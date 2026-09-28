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
  var hero=document.querySelector("main .hero"); if(!hero)return;
  var intro=document.createElement("section");intro.id="bt-cinematic-intro";intro.className="bt-cinema";
  intro.innerHTML=`
    <div class="btc-noise"></div><div class="btc-topline"><span>BULLSEYE THEORY / ORIGIN</span><span class="btc-code">SYSTEM 01 · PRECISION</span></div>
    <div class="btc-cinema-stage">
      <div class="btc-hud btc-hud-a">FORCE / BULL</div><div class="btc-hud btc-hud-b">LOCK / TARGET</div><div class="btc-hud btc-hud-c">ASSET / ₿</div>
      <svg class="btc-scene" viewBox="0 0 1000 560" aria-hidden="true">
        <defs><filter id="btcGlow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <path class="btc-trajectory" d="M90 390 C230 330 300 260 455 290 S700 185 900 105" fill="none" stroke="#a8ff61" stroke-width="3" stroke-dasharray="420 420" filter="url(#btcGlow)"/>
        <g class="btc-bullform" fill="none" stroke="#e4b957" stroke-width="9" stroke-linecap="round" filter="url(#btcGlow)">
          <path d="M110 355 C78 314 88 250 132 219 C180 185 252 193 293 230 C330 265 333 317 303 354 C270 395 178 405 130 378 Z"/>
          <path d="M133 225 C97 183 62 190 38 157 M143 238 C104 224 68 236 48 262 M279 226 C314 183 350 190 375 157 M268 239 C307 224 343 236 363 262"/>
          <circle cx="170" cy="273" r="7" fill="#e4b957"/><circle cx="258" cy="273" r="7" fill="#e4b957"/>
          <path d="M160 331 Q214 365 268 331 M142 380 L126 425 M287 378 L305 423"/>
        </g>
        <g class="btc-targetform" fill="none" stroke="currentColor" stroke-width="5"><circle cx="600" cy="275" r="104"/><circle cx="600" cy="275" r="64"/><circle cx="600" cy="275" r="18"/><path d="M600 142V408M467 275H733"/></g>
        <g class="btc-symbolform" text-anchor="middle"><text x="600" y="296">₿</text><text x="735" y="185">$</text><text x="760" y="375">↗</text></g>
      </svg>
      <div class="btc-thesis"><span><b>THE BULL</b><br>FORCE</span><span><b>THE EYE</b><br>FOCUS</span><span><b>THE BULLSEYE</b><br>TARGET</span><span><b>THEORY</b><br>PROCESS</span></div>
      <div class="btc-wordmark"><span class="btc-word">BULLSEYE</span><span class="btc-word-accent">THEORY</span></div><div class="btc-scroll">SCROLL TO ENTER <i>↓</i></div>
    </div>`;
  hero.parentNode.insertBefore(intro,hero);
  function onScroll(){var r=intro.getBoundingClientRect(),p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));intro.style.setProperty("--cinema-p",p.toFixed(3));}
  onScroll();addEventListener("scroll",onScroll,{passive:true});
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