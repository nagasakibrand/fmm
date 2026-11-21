/* FMM NUTRICIÓN — HERO V03 / REAL HUMAN MESH
 * Human body: a licensed, rigged GLB (MakeHuman Sam, CC0).
 * Every luminous point is sampled on triangles of the *actual animated skin mesh*.
 * Skeleton pose is evaluated each frame; no procedural mannequin, no primitives.
 * Animation is intentionally shown in dramatic slow motion: 20 seconds per run cycle.
 * Place model at /public/models/runner-sam.glb. A CC0 source URL is a backup.
 * Source: https://www.innerscene.com/tools/library/3d-parts/run-sam-3d-person-animated-fa008c06
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector('#runner-canvas');
const hero = document.querySelector('#hero');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (canvas && hero && !reduced) {
  initializeHero(canvas, hero).catch(error => {
    console.warn('[FMM] No se pudo inicializar el corredor humano 3D:', error);
    // A static reference remains visible. Never fall back to a stick figure.
  });
}

async function initializeHero(canvas, hero) {
  const mobile = window.matchMedia('(max-width: 850px)').matches;
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: false, powerPreference: mobile ? 'low-power' : 'high-performance'});
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.8,2.8,1.8,-1.8,.1,100);
  camera.position.set(-6,.5,.95);
  camera.lookAt(0,0,0);

  const loader = new GLTFLoader();
  const urls = [
    '/models/runner-sam.glb',
    'https://files.innerscene.com/library/run-sam-3d-person-animated-fa008c06/71777483056ccfecfed9/run-sam-3d-person-animated.glb',
  ];
  let gltf = null;
  let lastError;
  for (const url of urls) {
    try { gltf = await loader.loadAsync(url); break; }
    catch (e) { lastError=e; console.warn('[FMM] Modelo no disponible:', url, e?.message || e); }
  }
  if (!gltf) {
    renderer.dispose();
    throw new Error('Sube runner-sam.glb a public/models/ en GitHub. ' + (lastError?.message || ''));
  }
  const human = gltf.scene;
  scene.add(human);
  // A genuine skeleton and its authored skeleton animation are required.
  const skins=[];
  human.traverse(node => {
    if (node.isSkinnedMesh && node.geometry?.attributes?.position && node.geometry?.attributes?.skinIndex) {
      node.frustumCulled = false;
      node.visible = false; // The source surface is never rendered; ONLY sampled particles are.
      skins.push(node);
    }
  });
  if (!skins.length) throw new Error('El GLB no contiene ninguna malla humana con esqueleto.');
  const clip = gltf.animations.find(a => /run|correr/i.test(a.name)) || gltf.animations[0];
  if (!clip) throw new Error('El modelo humano no incluye animación.');
  const mixer = new THREE.AnimationMixer(human);
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.play();
  // Cinematic slow-motion: complete precisely one running cycle in 20 seconds.
  // Increase RUN_CYCLE_SECONDS to make the runner even slower.
  // No artificial minimum playback rate: small rates must remain possible.
  const RUN_CYCLE_SECONDS = 20;
  const motionScale = clip.duration / RUN_CYCLE_SECONDS;

  // Triangle-area sampling: points lie on real skin/clothing geometry, not cylinders.
  let seed = 70419;
  function rand() {seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;return seed / 4294967296;}
  const vertexA = new THREE.Vector3(), vertexB = new THREE.Vector3(), vertexC = new THREE.Vector3();
  const crossAB = new THREE.Vector3(), crossAC = new THREE.Vector3();
  const shapeData=[];
  let modelArea=0;
  for (const skinned of skins) {
    const geo=skinned.geometry, pos=geo.attributes.position, idx=geo.index;
    const count=idx ? idx.count : pos.count;
    const faceIds=[];
    const cumulative=[];
    let area=0;
    for (let j=0;j+2<count;j+=3) {
      const ia=idx?idx.getX(j):j, ib=idx?idx.getX(j+1):j+1, ic=idx?idx.getX(j+2):j+2;
      vertexA.fromBufferAttribute(pos,ia);
      vertexB.fromBufferAttribute(pos,ib);
      vertexC.fromBufferAttribute(pos,ic);
      crossAB.subVectors(vertexB,vertexA);
      crossAC.subVectors(vertexC,vertexA);
      const faceArea=crossAB.cross(crossAC).length()*.5;
      if (faceArea<1e-9) continue;
      area+=faceArea;faceIds.push([ia,ib,ic]);cumulative.push(area);
    }
    if (area>0) {
      modelArea+=area;
      shapeData.push({skinned,pos,faceIds,cumulative,area,first: modelArea-area,used:new Set(),points:new Float32Array(pos.count*3)});
    }
  }
  if (!shapeData.length)throw new Error('No hay superficie humana que muestrear.');
  const particleCount=mobile?3900:7900;
  const samples=[];
  function weightedIndex(cumulative,x) {
    let lo=0,hi=cumulative.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(cumulative[mid]<x)lo=mid+1;else hi=mid;}
    return lo;
  }
  for (let i=0;i<particleCount;i++) {
    const areaPick=rand()*modelArea;
    let data=shapeData[shapeData.length-1];
    for (const s of shapeData)if(areaPick<s.first+s.area){data=s;break;}
    const tri=weightedIndex(data.cumulative,rand()*data.area);
    const [a,b,c]=data.faceIds[tri];
    data.used.add(a);data.used.add(b);data.used.add(c);
    const r=Math.sqrt(rand()),v=rand();
    const wa=1-r,wb=r*(1-v),wc=r*v;
    samples.push({data,a,b,c,wa,wb,wc,shine:rand(),offset:(rand()-.5)*.0035,phase:rand()*Math.PI*2,tail:[(rand()-.5)*2,(rand()-.5)*2,(rand()-.5)*2]});
  }
  for (const data of shapeData)data.used=Array.from(data.used);
  const positions=new Float32Array(particleCount*3);
  const lights=new Float32Array(particleCount);
  const sizes=new Float32Array(particleCount);
  for(let i=0;i<particleCount;i++){
    lights[i]=samples[i].shine;
    sizes[i]=.58+rand()*.88;
  }
  const pointGeo=new THREE.BufferGeometry();
  pointGeo.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  pointGeo.setAttribute('aLight',new THREE.BufferAttribute(lights,1));
  pointGeo.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
  const particleMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
    uniforms:{uPixelRatio:{value:renderer.getPixelRatio()},uOpacity:{value:1},uTime:{value:0}},
    vertexShader:`attribute float aLight;attribute float aSize;varying float vLight;uniform float uPixelRatio;
      void main(){vLight=aLight;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;
      gl_PointSize=min(7.0*uPixelRatio,(1.3+2.2*aLight)*aSize*uPixelRatio);}`,
    fragmentShader:`precision mediump float;varying float vLight;uniform float uOpacity;uniform float uTime;
      void main(){float d=length(gl_PointCoord-vec2(0.5));if(d>=.5)discard;
      float alpha=1.0-smoothstep(.08,.5,d);
      vec3 navy=vec3(.28,.49,.76);vec3 ice=vec3(.89,.96,1.0);
      vec3 c=mix(navy,ice,pow(vLight,.85));
      gl_FragColor=vec4(c,alpha*(.48+.5*vLight)*uOpacity);}`
  });
  const points=new THREE.Points(pointGeo,particleMaterial);
  points.frustumCulled=false;
  scene.add(points);

  let bounds=null;
  let time=0;
  let last=0;
  let running=false;
  let inView=true;
  let pointerX=0,pointerY=0,easedX=0,easedY=0,scrollTarget=0,easedScroll=0;
  const temp=new THREE.Vector3();
  const updateCanvas=()=>{
    const rect=canvas.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return;
    renderer.setSize(rect.width,rect.height,false);
    const aspect=rect.width/rect.height;
    const height=mobile?3.6:3.4;
    camera.left=-height*aspect/2;
    camera.right=height*aspect/2;
    camera.top=height/2;
    camera.bottom=-height/2;
    camera.updateProjectionMatrix();
    particleMaterial.uniforms.uPixelRatio.value=renderer.getPixelRatio();
  };
  updateCanvas();
  const resizeObserver=new ResizeObserver(updateCanvas);resizeObserver.observe(canvas);
  const onMove=e=>{pointerX=(e.clientX/window.innerWidth-.5)*2;pointerY=(e.clientY/window.innerHeight-.5)*2;};
  const onScroll=()=>{const rect=hero.getBoundingClientRect();scrollTarget=THREE.MathUtils.clamp(-rect.top/Math.max(1,rect.height),0,1);};
  window.addEventListener('pointermove',onMove,{passive:true});
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  function applySkeleton(){
    human.updateMatrixWorld(true);
    for (const data of shapeData){
      const mesh=data.skinned, dst=data.points, attr=data.pos;
      for(const i of data.used){
        temp.fromBufferAttribute(attr,i);
        mesh.applyBoneTransform(i,temp);
        temp.applyMatrix4(mesh.matrixWorld);
        const k=i*3;dst[k]=temp.x;dst[k+1]=temp.y;dst[k+2]=temp.z;
      }
    }
  }
  function rawSample(sample){
    const d=sample.data.points;
    const a=sample.a*3,b=sample.b*3,c=sample.c*3;
    return [d[a]*sample.wa+d[b]*sample.wb+d[c]*sample.wc,
            d[a+1]*sample.wa+d[b+1]*sample.wb+d[c+1]*sample.wc,
            d[a+2]*sample.wa+d[b+2]*sample.wb+d[c+2]*sample.wc];
  }
  function calculateBounds(){
    let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
    for(const sample of samples){const p=rawSample(sample);
      minX=Math.min(minX,p[0]);minY=Math.min(minY,p[1]);minZ=Math.min(minZ,p[2]);
      maxX=Math.max(maxX,p[0]);maxY=Math.max(maxY,p[1]);maxZ=Math.max(maxZ,p[2]);
    }
    const h=Math.max(.1,maxY-minY);
    return {x:(minX+maxX)/2,y:(minY+maxY)/2,z:(minZ+maxZ)/2,scale:2.35/h};
  }
  function updateParticles(elapsed){
    if(!bounds)bounds=calculateBounds();
    const effect=THREE.MathUtils.smoothstep(easedScroll,.07,.9)*.40;
    const intro=THREE.MathUtils.smoothstep(time,0,1.9);
    for(let i=0;i<particleCount;i++){
      const p=samples[i],w=rawSample(p),j=i*3;
      const wobble=.004*Math.sin(elapsed*.45+p.phase);
      const shake=effect*.11+((1-intro)*.42);
      positions[j]=(w[0]-bounds.x)*bounds.scale+p.offset+wobble+p.tail[0]*shake;
      positions[j+1]=(w[1]-bounds.y)*bounds.scale+p.offset+p.tail[1]*shake;
      positions[j+2]=(w[2]-bounds.z)*bounds.scale+p.offset+p.tail[2]*shake;
    }
    pointGeo.attributes.position.needsUpdate=true;
    particleMaterial.uniforms.uOpacity.value=.26+.74*intro;
    particleMaterial.uniforms.uTime.value=elapsed;
  }
  // Evaluate a real skin-bound run pose before the first frame.
  mixer.update(.001);
  applySkeleton();
  bounds=calculateBounds();

  function loop(now){
    if(!inView || document.hidden){running=false;last=0;return;}
    requestAnimationFrame(loop);
    // Render 30fps desktop and 24fps mobile; skeletal animation remains time-correct.
    const fps=mobile?24:30;
    if (now-last<1000/fps && last!==0)return;
    const dt=last?Math.min((now-last)/1000,.075):0;last=now;
    time+=dt;
    mixer.update(dt*motionScale);
    applySkeleton();
    easedX=THREE.MathUtils.lerp(easedX,pointerX,.035);
    easedY=THREE.MathUtils.lerp(easedY,pointerY,.035);
    easedScroll=THREE.MathUtils.lerp(easedScroll,scrollTarget,.045);
    updateParticles(time);
    camera.position.set(-6.2+easedX*.10,.54+easedY*.12,.90+easedX*.38+easedScroll*.25);
    camera.lookAt(0,0,0);
    renderer.render(scene,camera);
    if(time>.3)hero.querySelector('.runner-fallback')?.classList.add('runner-fallback--live');
  }
  const start=()=>{if(!running && inView && !document.hidden){running=true;last=0;requestAnimationFrame(loop);}};
  const viewObserver=new IntersectionObserver(entries=>{inView=Boolean(entries[0]?.isIntersecting);if(inView)start();},{rootMargin:'100px'});
  viewObserver.observe(hero);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)start();});
  start();
}
