import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

(() => {
  const chart = document.querySelector(".bt-market-core");
  if (!chart || chart.dataset.bt3dReady === "1") return;
  chart.dataset.bt3dReady = "1";

  const stage = chart.querySelector(".bt-cinematic-stage");
  const oldAsset = stage?.querySelector(".bt-asset-wrap");
  if (!stage) return;
  if (oldAsset) oldAsset.remove();

  const canvas = document.createElement("canvas");
  canvas.className = "bt-3d-bull-canvas";
  canvas.setAttribute("aria-label", "Animated 3D Bullseye Theory market bull");
  stage.insertBefore(canvas, stage.firstChild);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020607, 0.018);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.25, 10.8);
  camera.lookAt(0, 0.15, 0);

  const root = new THREE.Group();
  root.position.set(0, -0.15, 0);
  scene.add(root);

  const gold = new THREE.MeshPhysicalMaterial({
    color: 0x9b6416,
    metalness: 0.94,
    roughness: 0.23,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16
  });
  const goldLight = new THREE.MeshPhysicalMaterial({
    color: 0xe5b84f,
    metalness: 0.96,
    roughness: 0.18,
    clearcoat: 0.8
  });
  const darkGold = new THREE.MeshPhysicalMaterial({
    color: 0x5c3a0e,
    metalness: 0.9,
    roughness: 0.3
  });
  const blackMetal = new THREE.MeshPhysicalMaterial({
    color: 0x050607,
    metalness: 0.88,
    roughness: 0.28
  });

  const warm = new THREE.PointLight(0xff9b24, 8, 9);
  warm.position.set(0, 0.9, 3.2);
  root.add(warm);

  const key = new THREE.DirectionalLight(0xffe3a0, 4.2);
  key.position.set(-4, 6, 7);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x75ff61, 2.8);
  rim.position.set(5, 1, -4);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffc95a, 2.2);
  fill.position.set(-6, -2, 2);
  scene.add(fill);

  const ambient = new THREE.HemisphereLight(0x13271f, 0x010203, 1.8);
  scene.add(ambient);

  function sphere(scale, pos, material, detail=3) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, detail), material);
    m.scale.set(scale[0], scale[1], scale[2]);
    m.position.set(pos[0], pos[1], pos[2]);
    root.add(m);
    return m;
  }

  function tube(points, radius, material, tubular=48) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0],p[1],p[2])));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, tubular, radius, 12, false), material);
    root.add(mesh);
    return mesh;
  }

  // Broad, muscular bull head built from 3D volumes rather than an image.
  const head = sphere([2.18, 2.52, 1.18], [0, 0.25, 0], gold, 5);
  head.rotation.x = -0.05;

  sphere([1.54, 1.58, 1.24], [0, -1.05, 0.54], goldLight, 4);
  sphere([1.12, 0.88, 1.04], [0, -1.72, 1.02], darkGold, 4);

  // Forehead armor planes / brow mass.
  sphere([0.82, 0.58, 0.9], [-0.68, 0.58, 0.9], goldLight, 3).rotation.z = -0.15;
  sphere([0.82, 0.58, 0.9], [0.68, 0.58, 0.9], goldLight, 3).rotation.z = 0.15;

  // Ears.
  const earGeo = new THREE.ConeGeometry(0.58, 1.35, 5, 1);
  const leftEar = new THREE.Mesh(earGeo, gold);
  leftEar.position.set(-1.82, 0.72, -0.05);
  leftEar.rotation.set(0.1, 0.1, -0.9);
  root.add(leftEar);
  const rightEar = leftEar.clone();
  rightEar.position.x = 1.82;
  rightEar.rotation.z = 0.9;
  root.add(rightEar);

  // Large curved horns matching the strong reference silhouette.
  tube([
    [-1.48,1.12,0.05],[-2.18,1.38,0.02],[-2.85,1.96,-0.02],[-3.22,2.72,0.02],[-3.05,3.28,0.08]
  ], 0.27, goldLight, 64);
  tube([
    [1.48,1.12,0.05],[2.18,1.38,0.02],[2.85,1.96,-0.02],[3.22,2.72,0.02],[3.05,3.28,0.08]
  ], 0.27, goldLight, 64);
  tube([
    [-1.54,1.13,0.08],[-2.13,1.32,0.03],[-2.68,1.78,-0.02],[-2.98,2.45,0.02]
  ], 0.40, darkGold, 42);
  tube([
    [1.54,1.13,0.08],[2.13,1.32,0.03],[2.68,1.78,-0.02],[2.98,2.45,0.02]
  ], 0.40, darkGold, 42);

  // Nose bridge and muzzle.
  tube([[0,0.55,1.05],[0,0.0,1.22],[0,-0.62,1.34],[0,-1.25,1.30]], 0.42, goldLight, 42);
  sphere([1.28,0.74,0.72], [0,-1.60,1.30], goldLight, 4);
  sphere([0.92,0.52,0.56], [0,-1.80,1.72], darkGold, 4);

  // Nostril sockets.
  const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), blackMetal);
  nostril.position.set(-0.55,-1.68,2.08);
  root.add(nostril);
  const nostril2 = nostril.clone();
  nostril2.position.x = 0.55;
  root.add(nostril2);

  // Mouth / jaw.
  tube([[-0.72,-2.02,1.73],[0,-2.16,1.82],[0.72,-2.02,1.73]],0.11,blackMetal,32);
  sphere([0.88,0.34,0.44],[0,-2.10,1.22],blackMetal,3);

  // Eye sockets.
  sphere([0.66,0.48,0.35],[-0.76,0.12,1.02],blackMetal,3).rotation.z=-0.12;
  sphere([0.66,0.48,0.35],[0.76,0.12,1.02],blackMetal,3).rotation.z=0.12;

  const eyeMat = new THREE.MeshBasicMaterial({color:0xffb12d});
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.17,24,16),eyeMat);
  eyeL.position.set(-0.72,0.08,1.33); root.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x=0.72; root.add(eyeR);

  const eyeGlow = new THREE.PointLight(0xff5a18, 5.5, 4.2);
  eyeGlow.position.set(0,0.05,2.2); root.add(eyeGlow);

  // Eye-fire particle trails.
  const fireCount = 180;
  const firePositions = new Float32Array(fireCount*3);
  const fireData = [];
  for(let i=0;i<fireCount;i++){
    const side=i%2?-1:1;
    const t=Math.random();
    firePositions[i*3] = side*(0.75 + t*1.8);
    firePositions[i*3+1] = 0.12 + (Math.random()-0.5)*0.28 + t*0.16;
    firePositions[i*3+2] = 1.25 + Math.random()*0.5;
    fireData.push({side,t,seed:Math.random()*10});
  }
  const fireGeo = new THREE.BufferGeometry();
  fireGeo.setAttribute("position",new THREE.BufferAttribute(firePositions,3));
  const fireMat = new THREE.PointsMaterial({
    color:0xff7b1a,size:0.055,transparent:true,opacity:0.92,
    blending:THREE.AdditiveBlending,depthWrite:false
  });
  const firePoints = new THREE.Points(fireGeo,fireMat);
  root.add(firePoints);

  // Gold target rings behind the bull.
  const ringGroup = new THREE.Group();
  ringGroup.position.set(0,0.15,-0.65);
  root.add(ringGroup);
  [3.55,3.0,2.42].forEach((r,i)=>{
    const ring=new THREE.Mesh(
      new THREE.TorusGeometry(r, i===2?0.025:0.045, 10, 128),
      i===1 ? new THREE.MeshBasicMaterial({color:0xa8ff61,transparent:true,opacity:.48}) : new THREE.MeshBasicMaterial({color:0xe4b957,transparent:true,opacity:.72})
    );
    ring.rotation.x=Math.PI/2;
    ringGroup.add(ring);
  });

  // Central crosshair.
  const crossMat = new THREE.LineBasicMaterial({color:0xe4b957,transparent:true,opacity:.6});
  const crossGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-4.1,0.15,-0.6),new THREE.Vector3(4.1,0.15,-0.6)
  ]);
  ringGroup.add(new THREE.Line(crossGeo,crossMat));
  const crossGeo2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0,-4.1,-0.6),new THREE.Vector3(0,4.1,-0.6)
  ]);
  ringGroup.add(new THREE.Line(crossGeo2,crossMat));

  // Dubai-like skyline from procedural towers.
  const skyline = new THREE.Group();
  skyline.position.z = -2.3;
  scene.add(skyline);
  for(let i=0;i<28;i++){
    const x=-8+i*0.62;
    const h=1.0+Math.random()*3.7;
    const w=0.25+Math.random()*0.34;
    const tower=new THREE.Mesh(
      new THREE.BoxGeometry(w,h,w*0.82),
      new THREE.MeshStandardMaterial({color:0x07100f,metalness:.65,roughness:.42})
    );
    tower.position.set(x,-2.5+h/2,Math.random()*0.4);
    skyline.add(tower);
    for(let y=0.25;y<h-0.1;y+=0.42){
      const win=new THREE.Mesh(
        new THREE.BoxGeometry(w*.12,0.055,w*.08),
        new THREE.MeshBasicMaterial({color:0xe4b957,transparent:true,opacity:.35+Math.random()*.35})
      );
      win.position.set(x-w*.2+Math.random()*w*.4,-2.5+y,0.42);
      skyline.add(win);
    }
  }
  // Signature tall tower.
  const tower=new THREE.Mesh(
    new THREE.CylinderGeometry(0.13,0.38,6.4,8),
    new THREE.MeshStandardMaterial({color:0x101516,metalness:.8,roughness:.3})
  );
  tower.position.set(4.25,0.7,-1.9);
  skyline.add(tower);
  const spire=new THREE.Mesh(
    new THREE.ConeGeometry(0.12,2.2,8),
    new THREE.MeshBasicMaterial({color:0xe4b957})
  );
  spire.position.set(4.25,5.0,-1.9);
  skyline.add(spire);

  // Floating candlestick market data.
  const chartGroup=new THREE.Group();
  chartGroup.position.z=-1.2;
  scene.add(chartGroup);
  for(let i=0;i<18;i++){
    const x=-7+i*.78;
    const base=-1.9;
    const high=base+1.0+Math.random()*2.8;
    const low=base+Math.random()*.6;
    const up=Math.random()>.28;
    const wickMat=new THREE.LineBasicMaterial({color:up?0x8cff61:0xe4b957,transparent:true,opacity:.72});
    const pts=[new THREE.Vector3(x,low,0),new THREE.Vector3(x,high,0)];
    chartGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wickMat));
    const bodyH=.28+Math.random()*.7;
    const body=new THREE.Mesh(
      new THREE.BoxGeometry(.18,bodyH,.12),
      new THREE.MeshBasicMaterial({color:up?0x63ff48:0xd29c2d,transparent:true,opacity:.75})
    );
    body.position.set(x,base+.55+Math.random()*1.8,0);
    chartGroup.add(body);
  }

  // Gold particles around the scene.
  const pCount=520;
  const pPos=new Float32Array(pCount*3);
  for(let i=0;i<pCount;i++){
    const r=5+Math.random()*7;
    const a=Math.random()*Math.PI*2;
    pPos[i*3]=Math.cos(a)*r;
    pPos[i*3+1]=(Math.random()-.45)*8;
    pPos[i*3+2]=-1-Math.random()*4;
  }
  const pGeo=new THREE.BufferGeometry();
  pGeo.setAttribute("position",new THREE.BufferAttribute(pPos,3));
  const pMat=new THREE.PointsMaterial({color:0xe4b957,size:.028,transparent:true,opacity:.46});
  scene.add(new THREE.Points(pGeo,pMat));

  // Currency symbols as 3D labels, kept subtle.
  function symbolSprite(text,color="#e4b957"){
    const c=document.createElement("canvas"); c.width=128;c.height=64;
    const ctx=c.getContext("2d");
    ctx.clearRect(0,0,128,64);
    ctx.font="800 34px Inter,Arial";ctx.fillStyle=color;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(text,64,34);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
    const mat=new THREE.SpriteMaterial({map:tex,transparent:true,opacity:.75,depthWrite:false});
    const s=new THREE.Sprite(mat);s.scale.set(.9,.45,1);return s;
  }
  const syms=[["₿",-3.8,-1.0,-.5],["$",-3.4,2.2,-.7],["€",3.45,-1.4,-.4],["¥",3.8,2.1,-.6]];
  syms.forEach(([t,x,y,z])=>{const s=symbolSprite(t);s.position.set(x,y,z);scene.add(s);});

  let mx=0,my=0;
  window.addEventListener("pointermove",e=>{
    const r=stage.getBoundingClientRect();
    mx=((e.clientX-r.left)/r.width-.5);
    my=((e.clientY-r.top)/r.height-.5);
  },{passive:true});

  const clock=new THREE.Clock();
  function resize(){
    const w=stage.clientWidth,h=stage.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize",resize,{passive:true});
  resize();

  function animate(){
    const t=clock.getElapsedTime();
    root.rotation.y += ((mx*.10)-root.rotation.y)*.035;
    root.rotation.x += ((-my*.045)-root.rotation.x)*.035;
    root.position.y=-0.15+Math.sin(t*1.1)*.035;
    ringGroup.rotation.z=t*.045;
    skyline.position.x=Math.sin(t*.08)*.05;
    chartGroup.position.x=Math.sin(t*.22)*.16;

    eyeGlow.intensity=4.8+Math.sin(t*7.5)*1.8;
    eyeL.scale.setScalar(1+Math.sin(t*9)*.08);
    eyeR.scale.setScalar(1+Math.sin(t*9+1)*.08);

    const pos=fireGeo.attributes.position.array;
    for(let i=0;i<fireData.length;i++){
      const d=fireData[i], side=d.side, base=d.t;
      const pulse=(Math.sin(t*10+d.seed)+1)/2;
      pos[i*3]=side*(0.78+base*(1.55+0.42*pulse));
      pos[i*3+1]=0.12+(Math.sin(t*8+d.seed)*.10)+(base*.35);
      pos[i*3+2]=1.25+Math.cos(t*6+d.seed)*.08+Math.random()*0.015;
    }
    fireGeo.attributes.position.needsUpdate=true;
    fireMat.size=.045+.025*(Math.sin(t*8)+1)/2;

    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }
  animate();
})();