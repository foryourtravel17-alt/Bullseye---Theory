(function(){
"use strict";
function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn);else fn()}
function addStyle(){
  if(document.getElementById("bullseye-motion-style"))return;
  var l=document.createElement("link");l.id="bullseye-motion-style";l.rel="stylesheet";l.href="motion-system.css?v=20260929";document.head.appendChild(l);
}
function progress(){
  if(document.getElementById("bt-progress"))return;
  var p=document.createElement("div");p.id="bt-progress";document.body.appendChild(p);
  function tick(){var h=document.documentElement.scrollHeight-innerHeight; p.style.width=(h>0?(scrollY/h)*100:0)+"%"}tick();addEventListener("scroll",tick,{passive:true});
}
function pointer(){
  addEventListener("pointermove",function(e){
    document.documentElement.style.setProperty("--bt-x",(e.clientX/innerWidth*100).toFixed(2)+"%");
    document.documentElement.style.setProperty("--bt-y",(e.clientY/innerHeight*100).toFixed(2)+"%");
  },{passive:true});
}
function makeKinetic(el){
  if(el.dataset.btKinetic)return;
  el.dataset.btKinetic="1";el.classList.add("bt-kinetic");
  var txt=el.textContent;el.textContent="";
  Array.from(txt).forEach(function(ch,i){
    var s=document.createElement("span");
    s.className=ch===" "?"bt-char bt-space":"bt-char";
    if(ch!==" ")s.style.transitionDelay=(Math.min(i,28)*22)+"ms";
    s.textContent=ch===" "?"\u00a0":ch;
    el.appendChild(s);
  });
}
function reveals(){
  var all=[];
  document.querySelectorAll("h1,h2,.hero p,.section,.box,.quiz,.done,.continue,.stat,.lesson,.target,.tradebox,.myth,.phase,.item,.btv,article,.notice,.actions,.cards,.gridcards,.phases,.points,.flow,.steps,.sides").forEach(function(el){
    if(el.closest("script,style,template"))return;
    if(!el.classList.contains("bt-reveal"))el.classList.add("bt-reveal");
    if(el.matches("h1,h2"))makeKinetic(el);
    el.classList.add("bt-glass");
    if(el.matches("article,.card,.lesson,.stat,.item,.phase,.tradebox,.myth"))el.classList.add("bt-hover");
    all.push(el);
  });
  document.querySelectorAll(".hero,.section,.box,.quiz,.btv").forEach(function(el){el.classList.add("bt-scan","bt-orbit")});
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("bt-in");io.unobserve(e.target)}});
  },{threshold:.13,rootMargin:"0px 0px -7% 0px"});
  all.forEach(function(el){io.observe(el)});
}
function magnet(){
  document.querySelectorAll(".btn,.primary,button.submit,button[id]").forEach(function(el){
    el.classList.add("bt-magnetic");
    el.addEventListener("pointermove",function(e){
      if(innerWidth<760)return;
      var r=el.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/r.width,y=(e.clientY-r.top-r.height/2)/r.height;
      el.style.transform="translate3d("+(x*6)+"px,"+(y*5)+"px,0)";
    });
    el.addEventListener("pointerleave",function(){el.style.transform=""});
  });
}
function cursorLabel(){
  if(innerWidth<760)return;
  var label=document.createElement("div");label.className="bt-cursor-label";label.textContent="EXPLORE";document.body.appendChild(label);
  document.querySelectorAll("a.btn,.lesson-action,.card a").forEach(function(el){
    el.addEventListener("pointerenter",function(){label.classList.add("show")});
    el.addEventListener("pointerleave",function(){label.classList.remove("show")});
    el.addEventListener("pointermove",function(e){label.style.left=e.clientX+"px";label.style.top=e.clientY+"px"});
  });
}
function svgDraw(){
  document.querySelectorAll(".btstage svg path,.btstage svg polyline,.btstage svg line").forEach(function(el){
    try{var len=el.getTotalLength();el.style.strokeDasharray=len+" "+len;el.style.strokeDashoffset=len;el.style.transition="stroke-dashoffset 1.35s cubic-bezier(.2,.8,.2,1)";}
    catch(_){}
  });
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.querySelectorAll("path,polyline,line").forEach(function(el){el.style.strokeDashoffset="0"});io.unobserve(e.target)}});
  },{threshold:.25});
  document.querySelectorAll(".btstage").forEach(function(el){io.observe(el)});
}
function countdownHint(){
  document.querySelectorAll(".eyebrow").forEach(function(el){if(/LESSON\s*\d+/i.test(el.textContent))el.classList.add("bt-focus-line")});
}

function injectHeroMorph(){
  if(document.getElementById("bt-hero-morph"))return;
  var hero=document.querySelector(".hero"); if(!hero)return;
  var wrap=document.createElement("div"); wrap.id="bt-hero-morph";
  wrap.innerHTML=`
    <div class="btm-particles"></div>
    <div class="bt-label">MARKET MOTION / LIVE STUDY</div>
    <svg class="btm-scene" viewBox="0 0 720 430" aria-hidden="true">
      <defs><filter id="btGlow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path class="btm-trail" d="M40 310 C160 270 210 205 320 210 S500 130 660 70" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="28 18"/>
      <g class="btm-bull" filter="url(#btGlow)">
        <path d="M105 235 C82 205 86 160 121 137 C154 115 207 120 236 145 C263 168 270 204 250 232 C229 261 177 273 135 260 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
        <path d="M117 145 C92 119 64 122 45 103 M124 151 C94 143 70 151 55 171 M226 145 C251 117 280 120 298 101 M219 151 C248 142 274 150 289 170" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
        <circle cx="151" cy="174" r="5" fill="currentColor"/><circle cx="218" cy="174" r="5" fill="currentColor"/>
        <path d="M151 220 Q184 244 218 220 M130 257 L118 292 M235 254 L249 289" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      </g>
      <g class="btm-target" fill="none" stroke="currentColor" stroke-width="3">
        <circle cx="500" cy="155" r="72"/><circle cx="500" cy="155" r="42"/><circle cx="500" cy="155" r="12"/>
        <path d="M500 62V248M407 155H593"/>
      </g>
      <g class="btm-symbols" text-anchor="middle"><text x="500" y="175">₿</text><text x="590" y="100">$</text><text x="610" y="225">↗</text></g>
    </svg>
    <div class="btm-caption">PRECISION → PROCESS → BULLSEYE</div>`;
  hero.insertBefore(wrap,hero.firstChild);
}
function setupHeroParallax(){
  var el=document.getElementById("bt-hero-morph"); if(!el)return;
  var hero=el.closest(".hero"); if(!hero)return;
  function tick(){var r=hero.getBoundingClientRect(),p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));el.style.transform="translate3d(0,"+(p*-26)+"px,0)";}
  tick();addEventListener("scroll",tick,{passive:true});
}
function microVisualLabels(){
  document.querySelectorAll(".chart,.btv,.btc-stage").forEach(function(el){
    if(el.querySelector(".bt-visual-label"))return;
    var l=document.createElement("div");l.className="bt-visual-label";l.textContent=el.classList.contains("chart")?"PRICE / TARGET":"VISUAL STUDY";el.appendChild(l);
  });
}
function lessonVisual(){
  var main=document.querySelector("main"); if(!main||document.querySelector(".bt-lesson-cinematic"))return;
  if(!document.querySelector("main .hero"))return;
  if(document.querySelector("main .hero") && !document.getElementById("bt-cinematic-intro"))return;
  var lesson=document.querySelector(".lesson")||document.querySelector(".lesson-hero")||document.querySelector(".hero");
  if(!lesson)return;
  var title=(document.querySelector("h1")||{}).textContent||"LESSON", n=(document.querySelector(".eyebrow")||{}).textContent||"MARKET STUDY";
  var box=document.createElement("section");box.className="bt-lesson-cinematic";
  box.innerHTML=`<div class="btc-head"><span>LESSON VISUAL SYSTEM</span><em>${n.replace(/[<>]/g,"")}</em></div><div class="btc-stage"><div class="btc-grid"></div><div class="btc-copy"><small>PRECISION STUDY</small><strong>${title.replace(/[<>]/g,"")}</strong></div><div class="btc-wave"></div><div class="btc-bars"></div><div class="btc-path"></div><div class="btc-reticle"></div><div class="btc-symbol">₿ ↗</div></div>`;
  lesson.parentNode.insertBefore(box,lesson.nextSibling);requestAnimationFrame(function(){box.classList.add("btc-ready")});
}
function cinematicBrandIntro(){
  if(document.getElementById("bt-cinematic-intro"))return;
  if(!document.getElementById("course"))return;
  var hero=document.querySelector("main .hero"); if(!hero)return;

  var intro=document.createElement("section");
  intro.id="bt-cinematic-intro";
  intro.className="bt-cinema bt-particle-cinema";
  intro.innerHTML=`
    <div class="btp-atmosphere"></div>
    <div class="btp-top"><span>BULLSEYE THEORY / ORIGIN</span><b>SYSTEM 01 · PRECISION</b></div>
    <canvas class="btp-canvas" aria-hidden="true"></canvas>
    <div class="btp-hud btp-hud-a">FORCE / BULL</div>
    <div class="btp-hud btp-hud-b">LOCK / PRECISION</div>
    <div class="btp-hud btp-hud-c">ASSET / CRYPTO</div>
    <div class="btp-data btp-data-a">VOL 04.28 / FLOW 98.2%</div>
    <div class="btp-data btp-data-b">TARGET LOCK / 01</div>
    <div class="btp-word"><span>BULLSEYE</span> <b>THEORY</b></div>
    <div class="btp-thesis"><span><b>FORCE</b> / BULL</span><span><b>FOCUS</b> / EYE</span><span><b>TARGET</b> / BULLSEYE</span><span><b>PROCESS</b> / THEORY</span></div>
    <div class="btp-enter">SCROLL / ENTER <i>↓</i></div>`;
  hero.parentNode.insertBefore(intro,hero);

  var canvas=intro.querySelector(".btp-canvas"),ctx=canvas.getContext("2d"), particles=[], W=0,H=0,dpr=1, raf=0, t0=performance.now();
  var TAU=Math.PI*2;
  function resize(){
    var r=intro.getBoundingClientRect(); dpr=Math.min(devicePixelRatio||1,2); W=Math.max(320,r.width); H=Math.max(600,r.height);
    canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(dpr,0,0,dpr,0,0);
    buildParticles();
  }
  function insidePoly(x,y,p){
    var hit=false;
    for(var i=0,j=p.length-1;i<p.length;j=i++){
      var xi=p[i][0],yi=p[i][1],xj=p[j][0],yj=p[j][1];
      var cross=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi);
      if(cross)hit=!hit;
    } return hit;
  }
  function bullShape(x,y,s){
    var pts=[
      [-.54,-.02],[-.63,-.18],[-.58,-.42],[-.38,-.56],[-.08,-.52],[.14,-.39],[.34,-.22],[.51,-.03],
      [.58,-.20],[.76,-.42],[.82,-.55],[.74,-.18],[.62,.02],[.74,.24],[.82,.55],[.76,.42],[.58,.20],
      [.46,.08],[.28,.29],[.08,.45],[-.18,.48],[-.43,.38],[-.57,.20],[-.64,.02]
    ];
    return pts.map(function(q){return [x+q[0]*s,y+q[1]*s]});
  }
  function targetPoint(cx,cy,s,i){
    var mode=i%7;
    if(mode<5){var a=(i*2.39996)%TAU;var rad=s*(.12+((i*37)%100)/100*.72);return [cx+Math.cos(a)*rad,cy+Math.sin(a)*rad]}
    if(mode===5)return [cx+(i%2?s:-s)*.95,cy+((i*13)%21-10)*2];
    return [cx+((i*17)%31-15)*2,cy+(i%2?s:-s)*.95];
  }
  function cryptoPoint(cx,cy,s,i){
    var a=(i*2.39996)%TAU, rad=s*(.15+((i*53)%100)/100*.66);
    var bx=cx+Math.cos(a)*rad, by=cy+Math.sin(a)*rad;
    var stroke=(i%6<4);
    if(stroke){var side=(i%2?1:-1), yy=((i*29)%100)/100*2-1; return [cx+side*s*.18+yy*s*.20,cy+yy*s*.82]}
    return [bx,by];
  }
  function buildParticles(){
    particles=[];
    var scale=Math.min(W/1180,H/720), cx=W*.49, cy=H*.46, bs=Math.min(W,H)*.30;
    var poly=bullShape(cx-W*.22,cy,bs);
    var minx=cx-W*.22-bs*.85,maxx=cx-W*.22+bs*.85,miny=cy-bs*.62,maxy=cy+bs*.62;
    var count=Math.min(2600,Math.max(1500,Math.floor(W*H/480)));
    var guard=0;
    while(particles.length<count && guard<count*20){
      guard++;
      var x=minx+Math.random()*(maxx-minx),y=miny+Math.random()*(maxy-miny);
      if(insidePoly(x,y,poly) || Math.random()<.08){
        particles.push({bx:x,by:y,tx:targetPoint(cx+W*.08,cy-bs*.02,bs*.55,particles.length),cx:cryptoPoint(cx+W*.08,cy-bs*.02,bs*.55,particles.length),px:x,py:y,r:.6+Math.random()*1.8,a:.25+Math.random()*.75,seed:Math.random()*TAU});
      }
    }
  }
  function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
  function mix(a,b,p){return a+(b-a)*p}
  function draw(now){
    var elapsed=(now-t0)/1000, cycle=10.8, q=(elapsed%cycle)/cycle;
    ctx.clearRect(0,0,W,H);
    var bg=ctx.createRadialGradient(W*.52,H*.42,10,W*.52,H*.42,Math.max(W,H)*.62);
    bg.addColorStop(0,"rgba(8,28,31,.38)");bg.addColorStop(.55,"rgba(3,12,15,.20)");bg.addColorStop(1,"rgba(0,4,6,0)");
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

    var bullIn=Math.max(0,Math.min(1,(q-.02)/.20));
    var dissolve=Math.max(0,Math.min(1,(q-.37)/.13));
    var target=Math.max(0,Math.min(1,(q-.45)/.16));
    var crypto=Math.max(0,Math.min(1,(q-.63)/.13));
    var out=Math.max(0,Math.min(1,(q-.82)/.16));
    particles.forEach(function(p,i){
      var x=p.bx,y=p.by,alpha=p.a;
      if(dissolve>0){
        var e=ease(dissolve), targetX=mix(p.bx,p.tx,e),targetY=mix(p.by,p.tx? p.tx*0+p.ty||p.by: p.by,e);
        // targetY is replaced below using stored target point
        targetY=mix(p.by,p.ty,e);
        x=targetX;y=targetY;
      } else {
        var e=ease(bullIn);x=mix(W*.20,p.bx,e);y=mix(H*.58,p.by,e);
      }
      if(crypto>0){
        var e=ease(crypto);x=mix(p.tx,p.cx,e);y=mix(p.ty,p.cy,e);
      }
      if(out>0){var e=ease(out);x+=Math.cos(p.seed)*W*.12*e;y-=H*.10*e;alpha*=1-e}
      p.px=x;p.py=y;
      var shimmer=.55+.45*Math.sin(elapsed*3+p.seed);
      ctx.globalAlpha=alpha*shimmer;
      ctx.fillStyle=(i%9===0)?"#e4b957":(i%7===0?"#73d7ff":"#a8ff61");
      ctx.beginPath();ctx.arc(x,y,p.r*(1+.5*shimmer),0,TAU);ctx.fill();
    });
    ctx.globalAlpha=1;
    // Cinematic light sweep
    var sx=(q*1.7%1)*W;
    var grd=ctx.createLinearGradient(sx-180,0,sx+180,0);grd.addColorStop(0,"rgba(115,215,255,0)");grd.addColorStop(.5,"rgba(115,215,255,.10)");grd.addColorStop(1,"rgba(115,215,255,0)");
    ctx.fillStyle=grd;ctx.fillRect(sx-180,0,360,H);
    // target lock rings
    if(target>0&&target<1){
      var te=ease(target),cx=W*.57,cy=H*.45,rr=Math.min(W,H)*(.08+.11*te);
      ctx.strokeStyle="rgba(168,255,97,"+(1-target*.35)+")";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.stroke();
      ctx.beginPath();ctx.arc(cx,cy,rr*.58,0,TAU);ctx.stroke();
      ctx.fillStyle="#a8ff61";ctx.fillRect(cx-rr*1.35,cy-.5,rr*2.7,1);ctx.fillRect(cx-.5,cy-rr*1.35,1,rr*2.7);
    }
    // crypto glow
    if(crypto>.05&&crypto<.96){
      var ce=ease(crypto),cx=W*.57,cy=H*.45,fs=Math.min(W,H)*.19;
      ctx.save();ctx.translate(cx,cy);ctx.globalAlpha=Math.sin(Math.PI*Math.min(1,crypto*1.15))*.92;
      ctx.shadowBlur=28;ctx.shadowColor="rgba(115,215,255,.65)";
      ctx.font="900 "+fs+"px Inter,Arial,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillStyle="#edfaff";ctx.fillText("₿",0,0);ctx.restore();
    }
    intro.style.setProperty("--btp-progress",q.toFixed(3));
    raf=requestAnimationFrame(draw);
  }
  particles.forEach(function(p){});
  // assign target/crypto coordinates after creation
  function fixParticleTargets(){
    var scale=Math.min(W/1180,H/720),s=Math.min(W,H)*.30,cx=W*.57,cy=H*.45;
    particles.forEach(function(p,i){var a=targetPoint(cx,cy,s*.55,i);p.tx=a[0];p.ty=a[1];var b=cryptoPoint(cx,cy,s*.55,i);p.cx=b[0];p.cy=b[1]});
  }
  var ro=new ResizeObserver(function(){resize();fixParticleTargets()});ro.observe(intro);resize();fixParticleTargets();requestAnimationFrame(draw);
  intro.addEventListener("click",function(){window.scrollTo({top:hero.offsetTop,behavior:"smooth"})});
}
function lessonOpeningScene(){
  if(document.getElementById("bt-lesson-opening"))return;
  if(document.querySelector("main .hero") && document.getElementById("bt-cinematic-intro"))return;
  var hero=document.querySelector("main .hero"); if(!hero)return;
  var old=hero.querySelector("h1"),title=old?old.textContent:"LESSON";
  var scene=document.createElement("div");scene.id="bt-lesson-opening";scene.className="bt-lesson-opening";
  scene.innerHTML=`<div class="bto-ring"></div><div class="bto-cross"></div><div class="bto-symbol">₿</div><div class="bto-label">OPENING SCENE · ${title.replace(/[<>]/g,"")}</div>`;
  hero.parentNode.insertBefore(scene,hero);
}

ready(function(){addStyle();progress();pointer();reveals();magnet();cursorLabel();svgDraw();countdownHint();injectHeroMorph();setupHeroParallax();microVisualLabels();lessonVisual();cinematicBrandIntro();lessonOpeningScene();});
})();