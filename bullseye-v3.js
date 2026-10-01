(()=>{
  const d=document,hero=d.querySelector(".v3-hero"),canvas=d.querySelector(".v3-canvas");

  // Spotlight tracking
  window.addEventListener("pointermove",e=>{
    d.documentElement.style.setProperty("--mouse-x",e.clientX+"px");
    d.documentElement.style.setProperty("--mouse-y",e.clientY+"px");
  });

  if(hero&&canvas){
    const c=canvas.getContext("2d");
    let w,h,pts=[],t=0;
    function resize(){
      w=hero.clientWidth;h=hero.clientHeight;
      const r=devicePixelRatio||1;
      canvas.width=w*r;canvas.height=h*r;
      c.setTransform(r,0,0,r,0,0);
      pts=Array.from({length:Math.min(700,Math.max(250,Math.floor(w*h/1800)))},()=>({
        x:Math.random()*w,y:Math.random()*h,
        s:.15+Math.random()*.6,r:.3+Math.random()*1.4,
        g:Math.random(),pulse:Math.random()*Math.PI*2
      }));
    }
    function draw(){
      t+=.008;c.clearRect(0,0,w,h);

      // Draw grid points & glowing constellation particles
      for(let i=0;i<pts.length;i++){
        const p=pts[i];
        p.y-=p.s;if(p.y<0)p.y=h;
        p.pulse+=.02;
        const a=.08+.18*Math.sin(p.pulse+t);
        c.globalAlpha=Math.max(0,a);
        c.fillStyle=p.g>.82?"#e4b957":"#a8ff61";
        c.beginPath();
        c.arc(p.x,p.y,p.r,0,Math.PI*2);
        c.fill();

        // Connect nearby points to form subtle terminal telemetry mesh
        if(i%6===0&&i+1<pts.length){
          const p2=pts[i+1];
          const dist=Math.hypot(p2.x-p.x,p2.y-p.y);
          if(dist<90){
            c.globalAlpha=(1-dist/90)*0.08;
            c.strokeStyle=p.g>.82?"#e4b957":"#a8ff61";
            c.lineWidth=0.7;
            c.beginPath();
            c.moveTo(p.x,p.y);
            c.lineTo(p2.x,p2.y);
            c.stroke();
          }
        }
      }

      // Horizontal subtle market grid lines
      c.globalAlpha=.12;
      c.strokeStyle="#a8ff61";
      for(let i=0;i<5;i++){
        const y=h*(.18+i*.16)+Math.sin(t*1.2+i)*6;
        c.beginPath();
        c.moveTo(w*.04,y);
        c.lineTo(w*.96,y);
        c.stroke();
      }

      requestAnimationFrame(draw);
    }
    new ResizeObserver(resize).observe(hero);
    resize();
    draw();
  }

  // IntersectionObserver reveal with immediate fallback for visible top sections
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting)e.target.classList.add("on");
  }),{threshold:.08});

  d.querySelectorAll(".v3-reveal").forEach(x=>{
    io.observe(x);
    // Safety fallback: if element is near viewport top on load, force on immediately
    const rect=x.getBoundingClientRect();
    if(rect.top < window.innerHeight*0.9){
      x.classList.add("on");
    }
  });

  // 3D Card tilt
  d.querySelectorAll(".v3-card").forEach(card=>{
    card.addEventListener("pointermove",e=>{
      if(innerWidth<851)return;
      const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      card.style.transform="perspective(700px) rotateX("+(-y*6)+"deg) rotateY("+(x*8)+"deg) translateY(-8px)";
    });
    card.addEventListener("pointerleave",()=>card.style.transform="");
  });
})();