/* FMM Nutrición · HERO V02 — corredor de partículas anatómico, cámara cinematográfica.
   Cada punto vive sobre un volumen humano de secciones variables (cabeza, rostro,
   tórax, cintura, pelvis, musculatura de piernas y brazos). No se muestran cilindros,
   esferas ni un muñeco esquemático. Ciclo de carrera en cámara lenta: ~6,5 segundos.
   Movimiento vinculado al scroll y con parallax muy sutil del cursor.
   Sin servicios externos. WebGL nativo, con fallback SVG si no hay aceleración.
*/
(()=>{
  'use strict';
  const canvas=document.getElementById('runner-canvas');
  const hero=document.getElementById('hero');
  if(!canvas||!hero)return;
  const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=matchMedia('(max-width: 850px)').matches;
  if(prefersReduced)return; // La ilustración estática permanece visible.
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:mobile?'low-power':'high-performance'});
  if(!gl)return;

  const vertex=`
    attribute vec3 a_position;
    attribute float a_light;
    uniform mat4 u_projection;
    uniform float u_yaw,u_pitch,u_pointSize,u_pixelRatio;
    varying float v_light,v_depth;
    void main(){
      float c=cos(u_yaw),s=sin(u_yaw),cv=cos(u_pitch),sv=sin(u_pitch);
      vec3 p=vec3(a_position.x*c-a_position.z*s,a_position.y,a_position.x*s+a_position.z*c);
      p=vec3(p.x,p.y*cv-p.z*sv,p.y*sv+p.z*cv);
      vec4 camera=vec4(p.x,p.y,p.z-5.0,1.0);
      gl_Position=u_projection*camera;
      gl_PointSize=clamp(u_pixelRatio*(2.4+2.6*a_light)*u_pointSize*(4.7/max(2.2,-camera.z)),1.0,7.4*u_pixelRatio);
      v_light=a_light;
      v_depth=clamp((camera.z+6.5)/3.5,0.0,1.0);
    }`;
  const fragment=`precision mediump float;
    varying float v_light,v_depth;
    void main(){
      float d=length(gl_PointCoord-vec2(.5));if(d>.49)discard;
      float soft=1.0-smoothstep(.08,.48,d);
      vec3 navy=vec3(.23,.45,.71),silver=vec3(.86,.95,1.0);
      vec3 color=mix(navy,silver,clamp(.82*v_light+.18*v_depth,0.0,1.0));
      gl_FragColor=vec4(color,soft*(.50+.49*v_light));
    }`;
  const compile=(type,source)=>{
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  let program;
  try {
    program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  }catch(error){console.warn('FMM: fallback del corredor',error);return;}
  gl.useProgram(program);
  const a={pos:gl.getAttribLocation(program,'a_position'),light:gl.getAttribLocation(program,'a_light'),proj:gl.getUniformLocation(program,'u_projection'),yaw:gl.getUniformLocation(program,'u_yaw'),pitch:gl.getUniformLocation(program,'u_pitch'),size:gl.getUniformLocation(program,'u_pointSize'),pixelRatio:gl.getUniformLocation(program,'u_pixelRatio')};
  let seed=0xF00D24;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const lerp=(x,y,t)=>x+(y-x)*t;
  const smooth=t=>t*t*(3-2*t);
  const V=(x,y,z)=>[x,y,z];
  const parts=[];
  const targetCount=mobile?5100:12700;
  const counts={torso:2650,hips:830,neck:200,cranium:1120,face:330,earL:110,earR:110,
    nearThigh:1000,farThigh:1000,nearCalf:900,farCalf:900,nearFoot:370,farFoot:370,
    nearBicep:660,farBicep:660,nearForearm:560,farForearm:560,nearHand:170,farHand:170};
  const baseTotal=Object.values(counts).reduce((a,b)=>a+b,0);
  Object.entries(counts).forEach(([name,n])=>{
    for(let i=0;i<Math.floor(n*targetCount/baseTotal);i++)parts.push({name,t:rand(),angle:rand()*Math.PI*2,
      shell:.92+.11*rand(),shimmer:.48+.52*rand(),noise:(rand()-.5)*.012,
      drift:[(rand()-.5)*5,(rand()-.5)*5,(rand()-.5)*4],float:[(rand()-.5)*6,(rand()-.5)*6,(rand()-.5)*4],wave:rand()*6.283});
  });
  const count=parts.length, positions=new Float32Array(count*3), lights=new Float32Array(count);
  for(let i=0;i<count;i++)lights[i]=parts[i].shimmer;
  const posBuffer=gl.createBuffer(),lightBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);gl.bufferData(gl.ARRAY_BUFFER,positions,gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(a.pos);gl.vertexAttribPointer(a.pos,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,lightBuffer);gl.bufferData(gl.ARRAY_BUFFER,lights,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(a.light);gl.vertexAttribPointer(a.light,1,gl.FLOAT,false,0,0);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);

  /* Volúmenes reales: loft transversal continuo y tejido que se estrecha en las articulaciones.
     En lugar de cilindros de radio constante, cada sección tiene su propio perfil. */
  const profile=(keys,t)=>{
    for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){
      const a=keys[i-1],b=keys[i],u=smooth((t-a[0])/(b[0]-a[0]));
      return [lerp(a[1],b[1],u),lerp(a[2],b[2],u),lerp(a[3]||0,b[3]||0,u)];
    }
    return keys[keys.length-1].slice(1);
  };
  const torsoShape=[[0,.17,.175,-.018],[.16,.19,.18,-.005],[.30,.17,.19,.004],[.46,.18,.22,.013],[.62,.245,.265,.025],[.78,.29,.335,.010],[.89,.25,.30,0],[1,.13,.15,-.012]];
  const hipsShape=[[0,.18,.18,0],[.2,.205,.22,0],[.5,.26,.275,0],[.8,.25,.26,0],[1,.17,.16,0]];
  const thighShape=[[0,.195,.183,0],[.18,.22,.193,0],[.43,.192,.168,0],[.66,.164,.144,0],[.86,.120,.117,0],[1,.102,.106,0]];
  const calfShape=[[0,.105,.102,0],[.16,.14,.145,0],[.38,.163,.166,0],[.6,.135,.134,0],[.83,.096,.092,0],[1,.077,.081,0]];
  const bicepShape=[[0,.17,.17,0],[.20,.157,.15,0],[.46,.145,.138,0],[.73,.119,.114,0],[1,.090,.093,0]];
  const foreShape=[[0,.096,.098,0],[.24,.128,.125,0],[.52,.115,.108,0],[.84,.071,.073,0],[1,.055,.060,0]];
  function loft(a,b,p,shape){
    const t=p.t,angle=p.angle;
    const section=profile(shape,t),u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],length=Math.hypot(...u)||1;
    const axis=[u[0]/length,u[1]/length,u[2]/length];
    let tangent=[-axis[1],axis[0],0];let tm=Math.hypot(...tangent);
    if(tm<.15){tangent=[1,0,0];tm=1;}
    tangent=tangent.map(x=>x/tm);
    const binormal=[axis[1]*tangent[2]-axis[2]*tangent[1],axis[2]*tangent[0]-axis[0]*tangent[2],axis[0]*tangent[1]-axis[1]*tangent[0]];
    const w=Math.cos(angle)*section[0]*p.shell,d=Math.sin(angle)*section[1]*p.shell;
    return [lerp(a[0],b[0],t)+tangent[0]*w+binormal[0]*d+section[2],
      lerp(a[1],b[1],t)+tangent[1]*w+binormal[1]*d,
      lerp(a[2],b[2],t)+tangent[2]*w+binormal[2]*d];
  }
  function skull(p,center){
    // Cráneo, pómulos, frente, mandíbula y barbilla con perfil vertical.
    const h=p.t*2-1,latitude=Math.sqrt(Math.max(0,1-h*h)),a=p.angle;
    const jaw=h<-.35?.76+.24*smooth((h+1)/.65):1;
    const temple=h>.36?1-.08*smooth((h-.36)/.64):1;
    const rx=.172*jaw*temple,rz=.142*jaw*temple;
    const x=center[0]+latitude*rx*Math.cos(a),z=center[2]+latitude*rz*Math.sin(a),y=center[1]+h*.229;
    const nose=(Math.cos(a)>.83&&h>-.23&&h<.30)? .048*(1-Math.abs(h-.04)/.28):0;
    return [x+Math.max(0,nose),y,z];
  }
  function ellipsoid(center,r,p){const y=2*p.t-1,k=Math.sqrt(Math.max(0,1-y*y));return [center[0]+r[0]*k*Math.cos(p.angle),center[1]+r[1]*y,center[2]+r[2]*k*Math.sin(p.angle)];}
  let mouseX=0,mouseY=0,desiredX=0,desiredY=0,scroll=0,last=0,elapsed=0,active=true,pending=false,needResize=true;
  const updateScroll=()=>{scroll=Math.min(1,Math.max(0,scrollY/Math.max(1,hero.offsetHeight)));};
  updateScroll();addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('pointermove',event=>{desiredX=(event.clientX/innerWidth-.5)*2;desiredY=(event.clientY/innerHeight-.5)*2;},{passive:true});
  addEventListener('resize',()=>{needResize=true;},{passive:true});
  const watcher=new IntersectionObserver(entries=>{active=Boolean(entries[0]?.isIntersecting);if(active)request();},{rootMargin:'120px 0px 120px 0px'});watcher.observe(hero);
  function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,mobile?1.15:1.6),width=Math.max(2,Math.floor(rect.width*dpr)),height=Math.max(2,Math.floor(rect.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);const f=1/Math.tan((mobile?47:43)*Math.PI/360),ratio=width/height,near=.1,far=40;
    gl.uniformMatrix4fv(a.proj,false,new Float32Array([f/ratio,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,(2*far*near)/(near-far),0]));
    gl.uniform1f(a.pixelRatio,dpr);needResize=false;
  }
  const partPoint=(part,limbs,bob,phase)=>{
    const p=part,t=p.t,s=p.name;
    if(s==='torso'){
      // El pecho se ensancha, el abdomen se afina y la espalda dibuja una curvatura natural.
      const base=V(-.105,-.24+bob,0),top=V(.11,.79+bob,0);
      const q=loft(base,top,p,torsoShape);q[0]+=.019*Math.sin(t*Math.PI);return q;
    }
    if(s==='hips')return loft(V(-.12,-.39+bob,0),V(-.10,-.13+bob,0),p,hipsShape);
    if(s==='neck')return loft(V(.12,.76+bob,0),V(.185,.99+bob,0),p,[[0,.12,.115,0],[.35,.102,.10,0],[1,.083,.083,0]]);
    if(s==='cranium')return skull(p,V(.215,1.158+bob,0));
    if(s==='face'){
      // Rasgos frontales distribuidos sobre el puente de la nariz, labios y mentón.
      const height=lerp(1.015,1.245,t),front=.335+(Math.sin(t*Math.PI)*.035);
      return [front+bob*.02,height+bob,(Math.cos(p.angle)*.034)*(1-.4*t)];
    }
    if(s==='earL'||s==='earR')return ellipsoid(V(.20,1.155+bob,s==='earL'?.147:-.147),[.052,.069,.024],p);
    const item=limbs[s];return loft(item[0],item[1],p,item[2]);
  };
  const request=()=>{if(!pending&&active&&!document.hidden){pending=true;requestAnimationFrame(frame);}};
  function frame(now){pending=false;if(!active||document.hidden)return;
    if(needResize)resize();
    const delta=last?Math.min((now-last)/1000,.045):0;last=now;elapsed+=delta;
    mouseX=lerp(mouseX,desiredX,.026);mouseY=lerp(mouseY,desiredY,.026);
    // SLOW MOTION: un ciclo completo dura ~6,6 s (antes ~1,6 s).
    const phase=elapsed*.95+1.12+scroll*.42;
    const bob=.018*Math.cos(phase*2),hip=V(-.11,-.31+bob,0),shoulder=V(.135,.66+bob,0),limbs={};
    for(let side=0;side<2;side++){
      const near=side===0,sidePhase=phase+(near?0:Math.PI),stride=Math.sin(sidePhase),z=(near?.15:-.15);
      const hipJoint=V(hip[0],hip[1],z);
      const upperAngle=.72*stride;
      const knee=V(hipJoint[0]+.825*Math.sin(upperAngle),hipJoint[1]-.825*Math.cos(upperAngle),z*1.07);
      const kneeBend=.42+1.12*Math.max(0,-Math.cos(sidePhase+.25));
      const shankAngle=upperAngle-kneeBend;
      const ankle=V(knee[0]+.76*Math.sin(shankAngle),knee[1]-.76*Math.cos(shankAngle),z*1.10);
      const footPitch=.14*Math.cos(sidePhase-.3);
      const toe=V(ankle[0]+.265,ankle[1]-.05+footPitch,ankle[2]);
      const armSwing=-.65*stride;
      const s=V(shoulder[0],shoulder[1],near?.285:-.285);
      const elbow=V(s[0]+.43*Math.sin(armSwing+.28),s[1]-.335+.04*Math.cos(sidePhase),s[2]*1.07);
      const wrist=V(elbow[0]+.26*Math.sin(armSwing-1.0),elbow[1]-.18+.12*Math.max(0,-stride),s[2]*1.10);
      const fingers=V(wrist[0]+.073,wrist[1]-.041,wrist[2]);
      const id=near?'near':'far';
      limbs[id+'Thigh']=[hipJoint,knee,thighShape];
      limbs[id+'Calf']=[knee,ankle,calfShape];
      limbs[id+'Foot']=[ankle,toe,[[0,.085,.074,0],[.23,.086,.083,0],[.55,.092,.090,0],[.85,.080,.090,0],[1,.023,.043,0]]];
      limbs[id+'Bicep']=[s,elbow,bicepShape];
      limbs[id+'Forearm']=[elbow,wrist,foreShape];
      limbs[id+'Hand']=[wrist,fingers,[[0,.072,.074,0],[.58,.079,.081,0],[1,.044,.045,0]]];
    }
    const enter=smooth(Math.min(1,Math.max(0,(elapsed-.10)/2.5)));
    const scatter=smooth(Math.max(0,Math.min(1,(scroll-.22)/.78)))*.27;
    for(let i=0;i<count;i++){
      const p=parts[i],q=partPoint(p,limbs,bob,phase),wave=.008*Math.sin(phase*.6+p.wave+q[1]*3.5);
      let x=q[0]+wave,y=q[1]+p.noise,z=q[2]+wave*.4;
      x+=scatter*p.drift[0];y+=scatter*p.drift[1];z+=scatter*p.drift[2];
      positions[i*3]=lerp(p.float[0],x,enter);
      positions[i*3+1]=lerp(p.float[1],y,enter);
      positions[i*3+2]=lerp(p.float[2],z,enter);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,positions);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    // La cámara no gira sin control: apenas 6° con el cursor.
    gl.uniform1f(a.yaw,.13+mouseX*.09+scroll*.10);
    gl.uniform1f(a.pitch,mouseY*.045);
    gl.uniform1f(a.size,mobile?1.08:.93);
    gl.drawArrays(gl.POINTS,0,count);
    if(elapsed>1.6)document.querySelector('.runner-fallback')?.classList.add('runner-fallback--live');
    request();
  }
  document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)request();});
  request();
})();
