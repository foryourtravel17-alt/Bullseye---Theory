import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

(() => {
  const chart = document.querySelector(".bt-market-core");
  if (!chart || chart.dataset.bt3dReady === "1") return;
  chart.dataset.bt3dReady = "1";

  const stage = chart.querySelector(".bt-cinematic-stage");
  if (!stage) return;

  const oldAsset = stage.querySelector(".bt-asset-wrap");
  if (oldAsset) oldAsset.remove();

  const canvas = document.createElement("canvas");
  canvas.className = "bt-3d-bull-canvas";
  canvas.setAttribute("aria-label", "Animated metallic 3D bull market visual");
  stage.insertBefore(canvas, stage.firstChild);

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020506, 0.012);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.15, 13.4);

  const root = new THREE.Group();
  root.position.set(0, -0.25, 0);
  scene.add(root);

  const gold = new THREE.MeshPhysicalMaterial({
    color:0xb57920, metalness:.94, roughness:.25, clearcoat:.7, clearcoatRoughness:.18
  });
  const goldLight = new THREE.MeshPhysicalMaterial({
    color:0xe7b84e, metalness:.96, roughness:.18, clearcoat:.85, clearcoatRoughness:.12
  });
  const bronze = new THREE.MeshPhysicalMaterial({
    color:0x6f430d, metalness:.93, roughness:.3, clearcoat:.5
  });
  const dark = new THREE.MeshPhysicalMaterial({
    color:0x080807, metalness:.9, roughness:.25
  });
  const eyeMat = new THREE.MeshBasicMaterial({color:0xff8a18});

  const key = new THREE.DirectionalLight(0xffe4a3, 4.8);
  key.position.set(-4, 5, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8dff63, 2.4);
  rim.position.set(5, 2, -5); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffa22a, 2.5);
  fill.position.set(3, -2, 6); scene.add(fill);
  scene.add(new THREE.HemisphereLight(0x18372a, 0x010202, 1.5));

  function sphere(scale, pos, material, seg=40) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.max(20, seg/2)), material);
    m.scale.set(...scale); m.position.set(...pos); root.add(m); return m;
  }
  function tube(points, radius, material) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, radius, 16, false), material);
    root.add(mesh); return mesh;
  }

  // Distinct bovine silhouette: wide brow, tapered cheeks, long muzzle.
  sphere([1.72,2.05,1.18],[0,.38,.05],gold,48);
  sphere([1.18,1.18,.98],[-1.05,-.05,.28],goldLight,40);
  sphere([1.18,1.18,.98],[1.05,-.05,.28],goldLight,40);
  sphere([1.18,.72,.86],[0,-1.18,.78],goldLight,44);
  sphere([.92,.54,.68],[0,-1.60,1.10],bronze,40);

  // Strong brow ridge and cheek planes.
  tube([[-1.34,.72,.72],[-.78,.98,1.02],[0,1.08,1.12],[.78,.98,1.02],[1.34,.72,.72]],.19,goldLight);
  sphere([.52,.42,.55],[-1.28,-.62,.98],bronze,32);
  sphere([.52,.42,.55],[1.28,-.62,.98],bronze,32);

  // Ears sit behind the horns.
  const earGeo = new THREE.ConeGeometry(.42,1.15,5,1);
  const earL = new THREE.Mesh(earGeo,gold);
  earL.position.set(-1.62,.92,-.22); earL.rotation.set(.12,.15,-.85); root.add(earL);
  const earR = earL.clone();
  earR.position.x=1.62; earR.rotation.z=.85; root.add(earR);

  // Large upward-sweeping bull horns — kept fully inside the mobile frame.
  tube([[-1.28,1.05,-.02],[-1.95,1.30,-.02],[-2.55,1.78,.02],[-2.92,2.45,.06],[-2.72,3.05,.10]],.25,goldLight);
  tube([[1.28,1.05,-.02],[1.95,1.30,-.02],[2.55,1.78,.02],[2.92,2.45,.06],[2.72,3.05,.10]],.25,goldLight);
  tube([[-1.32,1.05,.03],[-1.96,1.26,.01],[-2.52,1.72,.02]],.40,bronze);
  tube([[1.32,1.05,.03],[1.96,1.26,.01],[2.52,1.72,.02]],.40,bronze);

  // Nose bridge, muzzle and nostrils.
  tube([[0,.45,1.02],[0,-.15,1.12],[0,-.72,1.28],[0,-1.28,1.30]],.27,goldLight);
  sphere([1.02,.55,.58],[0,-1.55,1.34],goldLight,44);
  sphere([.72,.40,.42],[0,-1.70,1.67],bronze,40);

  const nostrilL = sphere([.18,.14,.10],[-.43,-1.69,1.99],dark,28);
  const nostrilR = sphere([.18,.14,.10],[.43,-1.69,1.99],dark,28);
  nostrilL.rotation.z=.12; nostrilR.rotation.z=-.12;

  // Narrow, aggressive eye sockets and glowing eyes.
  sphere([.58,.32,.22],[-.73,.20,1.10],dark,36).rotation.z=-.10;
  sphere([.58,.32,.22],[.73,.20,1.10],dark,36).rotation.z=.10;
  const eyeL=sphere([.105,.075,.06],[-.73,.19,1.30],eyeMat,24);
  const eyeR=sphere([.105,.075,.06],[.73,.19,1.30],eyeMat,24);

  const eyeGlowL = new THREE.PointLight(0xff5a12,5.5,3.6); eyeGlowL.position.set(-.73,.18,1.9); root.add(eyeGlowL);
  const eyeGlowR = new THREE.PointLight(0xff5a12,5.5,3.6); eyeGlowR.position.set(.73,.18,1.9); root.add(eyeGlowR);

  // Fire streaming outward from both eyes.
  const fireCount=260, firePos=new Float32Array(fireCount*3), fireData=[];
  for(let i=0;i<fireCount;i++){
    const side=i%2?-1:1, t=Math.random(), spread=(Math.random()-.5);
    firePos[i*3]=side*(.82+t*2.35);
    firePos[i*3+1]=.20+t*.35+spread*.28;
    firePos[i*3+2]=1.26+t*.15+Math.random()*.16;
    fireData.push({side,t,seed:Math.random()*50,spread});
  }
  const fireGeo=new THREE.BufferGeometry();
  fireGeo.setAttribute("position",new THREE.BufferAttribute(firePos,3));
  const fireMat=new THREE.PointsMaterial({color:0xff7a18,size:.052,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
  const fire=new THREE.Points(fireGeo,fireMat); root.add(fire);

  // Gold target rings behind the bull.
  const rings=new THREE.Group(); rings.position.z=-1.25; root.add(rings);
  [3.65,3.05,2.45].forEach((r,i)=>{
    const m=new THREE.MeshBasicMaterial({color:i===1?0xa8ff61:0xe4b957,transparent:true,opacity:i===1?.42:.58});
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,i===1?.028:.045,10,128),m);
    ring.rotation.x=Math.PI/2; rings.add(ring);
  });

  // Subtle skyline and candlesticks stay behind the bull.
  const skyline=new THREE.Group(); skyline.position.z=-2.7; scene.add(skyline);
  for(let i=0;i<25;i++){
    const x=-8+i*.66, h=.8+Math.random()*3.2, w=.22+Math.random()*.28;
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w*.8),new THREE.MeshStandardMaterial({color:0x07100f,metalness:.7,roughness:.42}));
    b.position.set(x,-2.65+h/2,0); skyline.add(b);
  }
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(.13,.34,5.6,8),new THREE.MeshStandardMaterial({color:0x101515,metalness:.8,roughness:.3}));
  tower.position.set(4.1,.15,-2.2); skyline.add(tower);
  const spire=new THREE.Mesh(new THREE.ConeGeometry(.11,1.8,8),new THREE.MeshBasicMaterial({color:0xe4b957}));
  spire.position.set(4.1,3.85,-2.2); skyline.add(spire);

  const chartGroup=new THREE.Group(); chartGroup.position.z=-1.8; scene.add(chartGroup);
  for(let i=0;i<16;i++){
    const x=-7+i*.9, low=-2.1+Math.random()*.4, high=low+1.1+Math.random()*2.4, up=Math.random()>.3;
    const lm=new THREE.LineBasicMaterial({color:up?0x82ff5c:0xe4b957,transparent:true,opacity:.42});
    chartGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,low,0),new THREE.Vector3(x,high,0)]),lm));
    const body=new THREE.Mesh(new THREE.BoxGeometry(.16,.35+Math.random()*.55,.10),new THREE.MeshBasicMaterial({color:up?0x63ff48:0xd29c2d,transparent:true,opacity:.52}));
    body.position.set(x,low+.7+Math.random()*1.3,0); chartGroup.add(body);
  }

  // Floating particles.
  const pCount=380,pPos=new Float32Array(pCount*3);
  for(let i=0;i<pCount;i++){
    const a=Math.random()*Math.PI*2,r=5+Math.random()*7;
    pPos[i*3]=Math.cos(a)*r; pPos[i*3+1]=(Math.random()-.4)*7; pPos[i*3+2]=-1.5-Math.random()*4;
  }
  const pGeo=new THREE.BufferGeometry(); pGeo.setAttribute("position",new THREE.BufferAttribute(pPos,3));
  scene.add(new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xe4b957,size:.026,transparent:true,opacity:.4})));

  let mx=0,my=0;
  window.addEventListener("pointermove",e=>{
    const r=stage.getBoundingClientRect(); mx=(e.clientX-r.left)/r.width-.5; my=(e.clientY-r.top)/r.height-.5;
  },{passive:true});

  const clock=new THREE.Clock();
  function resize(){
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize",resize,{passive:true}); resize();

  function animate(){
    const t=clock.getElapsedTime();
    root.rotation.y += (mx*.08-root.rotation.y)*.035;
    root.rotation.x += (-my*.035-root.rotation.x)*.035;
    root.position.y=-.25+Math.sin(t*1.1)*.025;
    rings.rotation.z=t*.035;
    eyeGlowL.intensity=5+Math.sin(t*9)*1.6;
    eyeGlowR.intensity=5+Math.sin(t*9+1.3)*1.6;
    eyeL.scale.setScalar(1+Math.sin(t*11)*.08);
    eyeR.scale.setScalar(1+Math.sin(t*11+1)*.08);
    const p=fireGeo.attributes.position.array;
    for(let i=0;i<fireData.length;i++){
      const d=fireData[i], pulse=(Math.sin(t*9+d.seed)+1)/2;
      p[i*3]=d.side*(.82+d.t*(2.25+.35*pulse));
      p[i*3+1]=.20+d.t*.35+Math.sin(t*10+d.seed)*.09+d.spread*.18;
      p[i*3+2]=1.28+d.t*.16+Math.cos(t*7+d.seed)*.07;
    }
    fireGeo.attributes.position.needsUpdate=true;
    fireMat.size=.045+.02*((Math.sin(t*9)+1)/2);
    skyline.position.x=Math.sin(t*.08)*.05;
    chartGroup.position.x=Math.sin(t*.2)*.10;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }
  animate();
})();