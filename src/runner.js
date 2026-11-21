/* FMM Nutrición — corredor de partículas tridimensional (WebGL nativo).
   Animación procedural, ligada al cursor y al desplazamiento; sin bibliotecas ni vídeo.
   Móvil: menor número de puntos, cámara y velocidades adaptadas. */
(()=>{
const canvas=document.getElementById('runner-canvas'),hero=document.getElementById('hero');
if(!canvas||!hero)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true,powerPreference:'low-power'});
if(!gl)return;
const mobile=matchMedia('(max-width: 850px)').matches;
const COUNT=mobile?3400:8200;
let seed=20261121;const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const vs=`attribute vec3 a_pos;attribute float a_glow;uniform mat4 u_projection;uniform float u_turn;uniform float u_tilt;uniform float u_size;uniform float u_px;varying float v_glow;varying float v_depth;
void main(){
 float cx=cos(u_turn),sx=sin(u_turn),cy=cos(u_tilt),sy=sin(u_tilt);
 vec3 p=vec3(a_pos.x*cx-a_pos.z*sx,a_pos.y,a_pos.x*sx+a_pos.z*cx);
 p=vec3(p.x,p.y*cy-p.z*sy,p.y*sy+p.z*cy);
 vec4 eye=vec4(p.x,p.y,p.z-5.0,1.0);
 gl_Position=u_projection*eye;
 gl_PointSize=clamp(u_px*(2.5+2.9*a_glow)*(4.5/max(2.0,-eye.z))*u_size,1.0,8.8*u_px);
 v_glow=a_glow;v_depth=clamp((eye.z+7.0)/4.0,0.0,1.0);
}`;
const fs=`precision mediump float;varying float v_glow;varying float v_depth;
void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.49)discard;
 float soft=1.0-smoothstep(.13,.49,d);
 vec3 dark=vec3(.21,.40,.67),light=vec3(.85,.94,1.0);
 vec3 col=mix(dark,light,clamp(v_glow*.83+v_depth*.17,0.,1.));
 gl_FragColor=vec4(col,soft*(.55+.4*v_glow));}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
let program;
try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){console.warn('FMM particle fallback:',e);return;}
gl.useProgram(program);setTimeout(()=>document.querySelector('.runner-fallback')?.classList.add('runner-fallback--live'),800);const loc={p:gl.getAttribLocation(program,'a_pos'),g:gl.getAttribLocation(program,'a_glow'),proj:gl.getUniformLocation(program,'u_projection'),turn:gl.getUniformLocation(program,'u_turn'),tilt:gl.getUniformLocation(program,'u_tilt'),size:gl.getUniformLocation(program,'u_size'),px:gl.getUniformLocation(program,'u_px')};
const points=[];const add=(part,n)=>{for(let i=0;i<n;i++)points.push({part,t:rnd(),theta:rnd()*Math.PI*2,rr:.67+rnd()*.37,rand:rnd(),phase:rnd()*6.28,offset:[(rnd()-.5)*8,(rnd()-.5)*6,(rnd()-.5)*5],jitter:(rnd()-.5)*.032});};
const factor=COUNT/8200;
[['torso',1500],['pelvis',450],['neck',105],['head',650],['nearThigh',770],['farThigh',770],['nearShin',610],['farShin',610],['nearFoot',245],['farFoot',245],['nearUpper',510],['farUpper',510],['nearFore',390],['farFore',390],['nearHand',145],['farHand',145]].forEach(([name,n])=>add(name,Math.max(30,Math.floor(n*factor))));
const total=points.length,pos=new Float32Array(total*3),bright=new Float32Array(total),rise=new Float32Array(total*3);
for(let i=0;i<total;i++){const p=points[i];bright[i]=.38+rnd()*.62;rise[i*3]=(rnd()-.5)*9;rise[i*3+1]=(rnd()-.5)*7;rise[i*3+2]=(rnd()-.5)*6;}
const pBuf=gl.createBuffer(),gBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pBuf);gl.bufferData(gl.ARRAY_BUFFER,pos,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(loc.p);gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,gBuf);gl.bufferData(gl.ARRAY_BUFFER,bright,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc.g);gl.vertexAttribPointer(loc.g,1,gl.FLOAT,false,0,0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
const V=(x,y,z)=>[x,y,z],lerp=(a,b,t)=>a+(b-a)*t;
function limb(a,b,ra,rb,p,oval=1){
 const t=p.t,x=b[0]-a[0],y=b[1]-a[1],len=Math.hypot(x,y)||1;
 const rr=lerp(ra,rb,t)*p.rr,s=Math.sin(p.theta),c=Math.cos(p.theta);
 return [lerp(a[0],b[0],t)+(-y/len)*c*rr,lerp(a[1],b[1],t)+(x/len)*c*rr,lerp(a[2],b[2],t)+s*rr*oval];
}
function ball(center,rx,ry,rz,p){const vy=p.t*2-1,s=Math.sqrt(1-vy*vy);return [center[0]+rx*s*Math.cos(p.theta)*p.rr,center[1]+ry*vy*p.rr,center[2]+rz*s*Math.sin(p.theta)*p.rr];}
let scrollPos=0,mouseX=0,mouseY=0,mouseTargetX=0,mouseTargetY=0,active=true,last=0,elapsed=0,running=false;
const handleScroll=()=>{scrollPos=Math.min(1.4,Math.max(0,window.scrollY/Math.max(500,hero.offsetHeight)));};
addEventListener('scroll',handleScroll,{passive:true});handleScroll();
addEventListener('pointermove',e=>{mouseTargetX=(e.clientX/innerWidth-.5)*2;mouseTargetY=(e.clientY/innerHeight-.5)*2;},{passive:true});
const schedule=()=>{if(!running&&active&&!document.hidden){running=true;requestAnimationFrame(frame);}};
new IntersectionObserver(entries=>{active=entries[0]?.isIntersecting||false;if(active&&!reduce)schedule();},{rootMargin:'200px 0px 200px 0px'}).observe(hero);
function resize(){let box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,mobile?1.2:1.65),w=Math.max(2,Math.floor(box.width*dpr)),h=Math.max(2,Math.floor(box.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);
 const f=1/Math.tan((mobile?50:45)*Math.PI/360),asp=w/h,near=.1,far=60;
 gl.uniformMatrix4fv(loc.proj,false,new Float32Array([f/asp,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,(2*far*near)/(near-far),0]));gl.uniform1f(loc.px,dpr);}
let w=0;function frame(now){running=false;if(!active||document.hidden)return;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;elapsed+=dt;mouseX=lerp(mouseX,mouseTargetX,.047);mouseY=lerp(mouseY,mouseTargetY,.047);
 if(canvas.clientWidth!==w){w=canvas.clientWidth;resize();}
 const phase=(elapsed*(mobile?3.35:3.85))+1.2+scrollPos*2.3,bob=.025*Math.sin(phase*2),hips=V(-.15,-.31+bob,0),shoulder=V(.13,.65+bob,0),head=V(.23,1.09+bob,0);
 const limbs={};
 for(let side=0;side<2;side++){
  const near=side===0,z=near?.17:-.17,off=near?0:Math.PI,sw=Math.sin(phase+off),hip=V(hips[0],hips[1],z);
  const upperAngle=.86*sw,flex=.72+Math.max(0,sw)*.8;
  const knee=V(hip[0]+.78*Math.sin(upperAngle),hip[1]-.78*Math.cos(upperAngle),z*1.16);
  const shinAngle=upperAngle-flex;
  const ankle=V(knee[0]+.76*Math.sin(shinAngle),knee[1]-.76*Math.cos(shinAngle),z*1.3);
  const toe=V(ankle[0]+.24,ankle[1]-.065,z*1.34);
  const s=V(shoulder[0],shoulder[1],near?.245:-.245);
  const swing=-sw,elbow=V(s[0]+.48*swing,s[1]-.33-.07*Math.cos(phase+off),s[2]*1.03);
  const wrist=V(elbow[0]+.18*(swing>=0?1:-1),elbow[1]+.12+(swing<0?-.12:0),s[2]*1.05);
  const fingers=V(wrist[0]+.075,wrist[1]-.015,wrist[2]);
  const prefix=near?'near':'far';
  limbs[prefix+'Thigh']=[hip,knee,.163,.11];limbs[prefix+'Shin']=[knee,ankle,.11,.075];limbs[prefix+'Foot']=[ankle,toe,.074,.046];
  limbs[prefix+'Upper']=[s,elbow,.126,.086];limbs[prefix+'Fore']=[elbow,wrist,.083,.054];limbs[prefix+'Hand']=[wrist,fingers,.058,.047];
 }
 const intro=reduce?1:Math.min(1,Math.max(0,(elapsed-.12)/1.7));const smoothIntro=intro*intro*(3-2*intro);
 const scrollScatter=Math.max(0,Math.min(1,(scrollPos-.08)*.68));
 for(let i=0;i<total;i++){
  const p=points[i];let q;
  switch(p.part){
   case 'torso':{
    q=limb(V(-.13,-.24+bob,0),shoulder,.275,.265,p,1);const form=Math.sin(Math.PI*(.15+p.t*.8));q[0]+=.045*form;q[2]+=.04*Math.cos(p.theta)*form;break;}
   case 'pelvis':q=ball(V(-.115,-.29+bob,0),.275,.205,.22,p);break;
   case 'neck':q=limb(shoulder,V(.19,.94+bob,0),.095,.085,p);break;
   case 'head':q=ball(head,.187,.235,.187,p);if(q[0]>head[0]+.14&&q[1]<head[1])q[0]+=.017;break;
   default:q=limb(...limbs[p.part],p);break;
  }
  const wave=.018*Math.sin(phase*.8+p.phase+q[1]*4);
  let px=q[0]+Math.cos(p.theta)*wave,py=q[1]+Math.sin(p.phase)*wave,pz=q[2]+p.jitter;
  const drift=scrollScatter*(.65+.9*p.rand),out=p.offset;
  px+=drift*out[0]*.42;py+=drift*out[1]*.42;pz+=drift*out[2]*.42;
  // La figura emerge de una nube de partículas al entrar en la página.
  px=lerp(rise[i*3],px,smoothIntro);py=lerp(rise[i*3+1],py,smoothIntro);pz=lerp(rise[i*3+2],pz,smoothIntro);
  pos[i*3]=px;pos[i*3+1]=py;pos[i*3+2]=pz;
 }
 gl.bindBuffer(gl.ARRAY_BUFFER,pBuf);gl.bufferSubData(gl.ARRAY_BUFFER,0,pos);
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 gl.uniform1f(loc.turn,.13+mouseX*.23+scrollPos*.27);
 gl.uniform1f(loc.tilt,mouseY*.08);
 gl.uniform1f(loc.size,mobile?1.25:1.0);
 gl.drawArrays(gl.POINTS,0,total);
 if(!reduce)schedule();
}
resize();if(reduce){elapsed=5;frame(0);}else schedule();
addEventListener('resize',()=>{w=0;},{passive:true});
})();
