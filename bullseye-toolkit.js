/* Bullseye Theory — automated visual toolkit layer */
(function(){
  "use strict";
  function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn);else fn()}
  function background(){
    const hero=document.querySelector(".bt-hero-preview");
    if(!hero||hero.querySelector(".bt-toolkit-bg"))return;
    hero.classList.add("bt-toolkit");
    const bg=document.createElement("div");
    bg.className="bt-toolkit-bg";
    bg.setAttribute("aria-hidden","true");
    bg.innerHTML='<svg viewBox="0 0 1200 650" preserveAspectRatio="none">'+
      '<defs><linearGradient id="tkG" x1="0" x2="1"><stop stop-color="#39FF14" stop-opacity=".02"/><stop offset=".55" stop-color="#C5A059" stop-opacity=".20"/><stop offset="1" stop-color="#39FF14" stop-opacity=".02"/></linearGradient><filter id="tkBlur"><feGaussianBlur stdDeviation="2.5"/></filter></defs>'+
      '<path d="M30 520 C180 470 210 350 360 390 S570 260 720 315 S950 160 1180 105" fill="none" stroke="url(#tkG)" stroke-width="2" class="bt-flow"/>'+
      '<path d="M0 575H1200M0 475H1200M0 375H1200M0 275H1200M0 175H1200" stroke="#C5A059" stroke-opacity=".07"/>'+
      '<path d="M140 0V650M300 0V650M460 0V650M620 0V650M780 0V650M940 0V650M1100 0V650" stroke="#C5A059" stroke-opacity=".06"/>'+
      '<circle cx="360" cy="390" r="5" fill="#39FF14" class="bt-node"/><circle cx="720" cy="315" r="5" fill="#C5A059" class="bt-node"/><circle cx="950" cy="160" r="5" fill="#39FF14" class="bt-node"/>'+
      '<circle cx="950" cy="160" r="48" fill="none" stroke="#39FF14" stroke-opacity=".10"/><circle cx="950" cy="160" r="82" fill="none" stroke="#C5A059" stroke-opacity=".07"/>'+
      '</svg>';
    const corner=document.createElement("div");corner.className="bt-toolkit-corner";
    const readout=document.createElement("div");readout.className="bt-toolkit-readout";readout.innerHTML="VISUAL SYSTEM / <b>CALIBRATED</b> · MOTION / SVG / COLOR";
    hero.append(bg,corner,readout);
  }
  function motion(){
    document.querySelectorAll(".bt-flow article,.bt-lessons article,.bt-principles article,.bt-value-strip>div,.bt-system-copy .ghost,.bt-course-copy .btn").forEach(el=>{
      el.classList.add("bt-motion","bt-motion-focus");
    });
  }
  function palette(){
    document.documentElement.style.setProperty("--bt-obsidian","#0B0E14");
    document.documentElement.style.setProperty("--bt-lime","#39FF14");
    document.documentElement.style.setProperty("--bt-gold","#C5A059");
    document.documentElement.style.setProperty("--bt-offwhite","#F4F6F2");
  }
  ready(function(){palette();background();motion()});
})();