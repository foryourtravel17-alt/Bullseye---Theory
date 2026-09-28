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
ready(function(){addStyle();progress();pointer();reveals();magnet();cursorLabel();svgDraw();countdownHint();injectHeroMorph();setupHeroParallax();microVisualLabels();lessonVisual();});
})();