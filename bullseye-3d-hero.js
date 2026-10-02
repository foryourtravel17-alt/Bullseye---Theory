import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/loaders/GLTFLoader.js";

(() => {
  const canvas = document.getElementById("bullseye-3d");
  const host = document.querySelector(".v6-bull-stage");
  if (!canvas || !host) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:"high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020304, 0.035);

  const camera = new THREE.PerspectiveCamera(19, 1, 0.1, 100);
  camera.position.set(0, 0.72, 7.4);

  scene.add(new THREE.HemisphereLight(0xfff2c8, 0x030706, 2.0));
  const key = new THREE.DirectionalLight(0xffd875, 5.2); key.position.set(-4.5,6.5,5.5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9eff66, 3.2); rim.position.set(5,3.5,-5); scene.add(rim);
  const front = new THREE.PointLight(0xff9b24, 9, 13, 2); front.position.set(0,1.8,5.5); scene.add(front);

  const root = new THREE.Group(); root.position.y=-0.95; scene.add(root);
  const dustGeo = new THREE.BufferGeometry(), dustCount=260, dustPos=new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){const a=Math.random()*Math.PI*2,r=2.1+Math.random()*3.6;dustPos[i*3]=Math.cos(a)*r;dustPos[i*3+1]=(Math.random()-.2)*4.8;dustPos[i*3+2]=(Math.random()-.5)*2.4;}
  dustGeo.setAttribute("position",new THREE.BufferAttribute(dustPos,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xe4b957,size:.018,transparent:true,opacity:.38,depthWrite:false,blending:THREE.AdditiveBlending}));
  scene.add(dust);

  function materialFrom(src){
    const m=new THREE.MeshPhysicalMaterial({color:0xc38d2e,metalness:.96,roughness:.18,clearcoat:1,clearcoatRoughness:.12,emissive:0x1b1004,emissiveIntensity:.18});
    if(src?.map)m.map=src.map; if(src?.normalMap)m.normalMap=src.normalMap; return m;
  }

  function addEye(x,y,z){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.105,20,12),new THREE.MeshBasicMaterial({color:0xffd35b,transparent:true,opacity:.98}));
    eye.scale.set(1.5,.52,.45); eye.position.set(x,y,z); root.add(eye);
    const glow=new THREE.Mesh(new THREE.SphereGeometry(.28,18,12),new THREE.MeshBasicMaterial({color:0xff7214,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false}));
    glow.position.copy(eye.position); root.add(glow);
    const light=new THREE.PointLight(0xff7516,1.8,.9,2); light.position.copy(eye.position); root.add(light);
  }

  const loader=new GLTFLoader(), modelUrl="https://cdn.3dassets.dev/assets/5010/v1/model.glb";
  loader.load(modelUrl,(gltf)=>{
    const bull=gltf.scene, box=new THREE.Box3().setFromObject(bull), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3());
    bull.position.sub(center);
    const scale=5.2/Math.max(size.y,.001); bull.scale.setScalar(scale); bull.position.y=-.2;
    bull.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;o.material=materialFrom(o.material);});
    root.add(bull);
    const sx=size.x*scale, sz=size.z*scale, eyeY=.48, eyeZ=Math.min(sz*.48,2.0);
    addEye(-sx*.17,eyeY,eyeZ); addEye(sx*.17,eyeY,eyeZ);

    bull.traverse(o=>{
      if(!o.isMesh)return;
      const edge=o.clone(); edge.material=new THREE.MeshBasicMaterial({color:0xf1c55d,wireframe:true,transparent:true,opacity:.055,depthWrite:false}); edge.scale.setScalar(1.003); root.add(edge);
    });
    host.classList.add("v6-3d-ready");
  },undefined,()=>host.classList.add("v6-3d-failed"));

  const pointer={x:0,y:0,tx:0,ty:0};
  if(!coarse)addEventListener("pointermove",e=>{pointer.tx=(e.clientX/innerWidth-.5)*.22;pointer.ty=(e.clientY/innerHeight-.5)*.12;},{passive:true});

  function resize(){const r=host.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(host); resize();
  const clock=new THREE.Clock();
  function tick(){const t=clock.getElapsedTime();pointer.x+=(pointer.tx-pointer.x)*.045;pointer.y+=(pointer.ty-pointer.y)*.045;if(!reduced){root.rotation.y=pointer.x+Math.sin(t*.32)*.025;root.rotation.x=pointer.y;root.position.y=-.95+Math.sin(t*1.05)*.025;dust.rotation.y=t*.018;dust.rotation.x=Math.sin(t*.2)*.05;}renderer.render(scene,camera);requestAnimationFrame(tick);}
  tick();
})();