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
  camera.position.set(0, 0.05, 14.2);

  const root = new THREE.Group();
  root.position.set(0, -0.18, 0);
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

  // REBUILT BULL HEAD — a single continuous silhouette, avoiding the
  // circular/ball-like face that appeared in the previous iterations.
  function bullHeadShape(material){
    const s=new THREE.Shape();
    s.moveTo(-1.42,.92);
    s.bezierCurveTo(-1.15,1.52,-.58,1.82,0,1.86);
    s.bezierCurveTo(.58,1.82,1.15,1.52,1.42,.92);
    s.bezierCurveTo(1.34,.28,1.12,-.30,.82,-.72);
    s.bezierCurveTo(.62,-1.05,.42,-1.28,0,-1.38);
    s.bezierCurveTo(-.42,-1.28,-.62,-1.05,-.82,-.72);
    s.bezierCurveTo(-1.12,-.30,-1.34,.28,-1.42,.92);
    const g=new THREE.ExtrudeGeometry(s,{depth:.92,bevelEnabled:true,bevelSegments:5,steps:2,bevelSize:.12,bevelThickness:.10});
    g.center();
    const m=new THREE.Mesh(g,material);
    m.position.set(0,.12,.10);
    root.add(m);
    return m;
  }
  const head=bullHeadShape(gold);
  // Wider forehead + tapered lower face: unmistakable bovine silhouette.
  head.scale.set(1.18,1.10,1.12);
  head.rotation.x=-0.035;
  
  // Sculpted cheek planes to break the mask/pig silhouette.
  const cheekGeo=new THREE.CapsuleGeometry(.48,.92,6,12);
  const cheekL=new THREE.Mesh(cheekGeo,gold);
  cheekL.scale.set(.72,.96,.72);
  cheekL.position.set(-.72,-.28,.28);
  cheekL.rotation.z=-.18;
  root.add(cheekL);
  const cheekR=cheekL.clone();
  cheekR.position.x=.72;
  cheekR.rotation.z=.18;
  root.add(cheekR);

  // Compact pointed ears.
  const earGeo=new THREE.ConeGeometry(.30,.78,5,1);
  const earL=new THREE.Mesh(earGeo,goldLight);
  earL.position.set(-1.38,1.08,-.16); earL.rotation.set(.10,.12,-.72); root.add(earL);
  const earR=earL.clone();
  earR.position.x=1.38; earR.rotation.z=.72; root.add(earR);

  // Strong classic bull horns.
  tube([[-1.04,1.18,-.08],[-1.62,1.38,-.06],[-2.15,1.78,-.02],[-2.48,2.34,.02],[-2.30,2.90,.06]],.19,goldLight);
  tube([[1.04,1.18,-.08],[1.62,1.38,-.06],[2.15,1.78,-.02],[2.48,2.34,.02],[2.30,2.90,.06]],.19,goldLight);
  tube([[-1.05,1.18,-.05],[-1.62,1.38,-.04],[-2.10,1.75,-.01]],.30,bronze);
  tube([[1.05,1.18,-.05],[1.62,1.38,-.04],[2.10,1.75,-.01]],.30,bronze);

  // Brow ridge and narrow eye sockets.
  tube([[-.98,.72,.70],[-.50,.88,.82],[0,.92,.88],[.50,.88,.82],[.98,.72,.70]],.12,goldLight);
  const socketL=sphere([.40,.13,.10],[-.66,.34,.64],dark,28);
  const socketR=sphere([.40,.13,.10],[.66,.34,.64],dark,28);
  const eyeL=sphere([.075,.045,.035],[-.66,.34,.76],eyeMat,20);
  const eyeR=sphere([.075,.045,.035],[.66,.34,.76],eyeMat,20);

  // Long central bridge and compact bovine muzzle.
  tube([[0,.55,.72],[0,.05,.86],[0,-.48,1.02],[0,-.84,1.12]],.17,goldLight);
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.48,.62,.72,32),goldLight);
  muzzle.rotation.x=Math.PI/2;
  muzzle.position.set(0,-1.02,1.05);
  muzzle.scale.z=.72;
  root.add(muzzle);
  const nose=new THREE.Mesh(new THREE.CylinderGeometry(.40,.48,.18,32),bronze);
  nose.rotation.x=Math.PI/2;
  nose.position.set(0,-1.10,1.38);
  nose.scale.z=.65;
  root.add(nose);
  const nostrilL=sphere([.11,.065,.045],[-.23,-1.12,1.51],dark,20);
  const nostrilR=sphere([.11,.065,.045],[.23,-1.12,1.51],dark,20);

  const eyeGlowL = new THREE.PointLight(0xff5a12,5.5,3.6); eyeGlowL.position.set(-.66,.34,1.25); root.add(eyeGlowL);
  const eyeGlowR = new THREE.PointLight(0xff5a12,5.5,3.6); eyeGlowR.position.set(.66,.34,1.25); root.add(eyeGlowR);

  // Fire streaming outward from both eyes.
  const fireCount=260, firePos=new Float32Array(fireCount*3), fireData=[];
  for(let i=0;i<fireCount;i++){
    const side=i%2?-1:1, t=Math.random(), spread=(Math.random()-.5);
    firePos[i*3]=side*(.82+t*2.35);
    firePos[i*3+1]=.34+t*.24+spread*.16;
    firePos[i*3+2]=.78+t*.13+Math.random()*.10;
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

  const chartGroup=new THREE.Group(); chartGroup.position.z=-3.4; scene.add(chartGroup);
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
    root.position.y=-.18+Math.sin(t*1.1)*.025;
    rings.rotation.z=t*.035;
    eyeGlowL.intensity=5+Math.sin(t*9)*1.6;
    eyeGlowR.intensity=5+Math.sin(t*9+1.3)*1.6;
    eyeL.scale.setScalar(1+Math.sin(t*11)*.08);
    eyeR.scale.setScalar(1+Math.sin(t*11+1)*.08);
    const p=fireGeo.attributes.position.array;
    for(let i=0;i<fireData.length;i++){
      const d=fireData[i], pulse=(Math.sin(t*9+d.seed)+1)/2;
      p[i*3]=d.side*(.75+d.t*(2.25+.35*pulse));
      p[i*3+1]=.34+d.t*.24+Math.sin(t*10+d.seed)*.06+d.spread*.14;
      p[i*3+2]=.78+d.t*.13+Math.cos(t*7+d.seed)*.05;
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