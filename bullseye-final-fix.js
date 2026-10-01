(function(){
  function run(){
    const system=document.querySelector('.bt-system-copy .bt-locked-heading');
    if(system){
      system.innerHTML='<span>Study.</span><br><span>Practice.</span><br><span>Review.</span>';
      system.style.cssText+=';writing-mode:horizontal-tb!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:normal!important;';
    }

    const course=document.querySelector('.bt-course-copy .bt-locked-heading');
    if(course){
      course.innerHTML='<span>11-Lesson</span><br><span>Trading Education</span>';
    }

    const chart=document.querySelector('.bt-hero-visual .chart');
    if(!chart) return;

    let bull=chart.querySelector('.bt-final-bull');
    if(!bull){
      bull=document.createElement('div');
      bull.className='bt-final-bull';
      bull.setAttribute('aria-label','Premium metallic gold bull market visual');
      bull.innerHTML=`
<svg viewBox="0 0 700 700" role="img" aria-hidden="true">
<defs>
<radialGradient id="btGoldFace" cx="42%" cy="25%" r="78%"><stop offset="0" stop-color="#ffe9a5"/><stop offset=".24" stop-color="#e8bd5e"/><stop offset=".53" stop-color="#bd8628"/><stop offset=".78" stop-color="#70460f"/><stop offset="1" stop-color="#241507"/></radialGradient>
<linearGradient id="btHornMetal" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#6b4311"/><stop offset=".38" stop-color="#dab64c"/><stop offset=".65" stop-color="#fff0aa"/><stop offset="1" stop-color="#714610"/></linearGradient>
<linearGradient id="btNoseMetal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d9a73e"/><stop offset=".55" stop-color="#8c5b13"/><stop offset="1" stop-color="#3a2006"/></linearGradient>
<radialGradient id="btEyeFire"><stop stop-color="#fff4c4"/><stop offset=".25" stop-color="#ffd35b"/><stop offset=".55" stop-color="#ff8b1e"/><stop offset="1" stop-color="#b51f05"/></radialGradient>
<filter id="btGlow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<path class="bt-bull-horn" d="M165 224C112 179 72 137 91 86c32 32 62 47 114 61-25 24-40 47-40 77Z"/>
<path class="bt-bull-horn" d="M535 224c53-45 93-87 74-138-32 32-62 47-114 61 25 24 40 47 40 77Z"/>
<path d="M350 125C267 125 194 162 170 236c-21 66-8 177 28 262 21 50 53 99 106 130 23 14 41 20 46 21 5-1 23-7 46-21 53-31 85-80 106-130 36-85 49-196 28-262-24-74-97-111-180-111Z" fill="url(#btGoldFace)" stroke="#ffe18a" stroke-opacity=".3"/>
<path d="M166 184c-55-33-89-12-87 31 37-12 67-10 104 8ZM534 184c55-33 89-12 87 31-37-12-67-10-104 8Z" fill="#5a360b"/>
<path d="M207 286c43-42 84-49 122-32-16 20-29 37-37 55-32-12-58-14-85-23ZM493 286c-43-42-84-49-122-32 16 20 29 37 37 55 32-12 58-14 85-23Z" fill="#422505"/>
<g filter="url(#btGlow)"><path d="M222 300c30-20 61-19 88-2-24 20-57 24-86 11Z" fill="#100904"/><ellipse cx="268" cy="303" rx="15" ry="9" fill="url(#btEyeFire)"/><circle cx="269" cy="303" r="3.5" fill="#fffbd8"/><path d="M478 300c-30-20-61-19-88-2 24 20 57 24 86 11Z" fill="#100904"/><ellipse cx="432" cy="303" rx="15" ry="9" fill="url(#btEyeFire)"/><circle cx="431" cy="303" r="3.5" fill="#fffbd8"/></g>
<path d="M241 436c23-46 68-70 109-69 41-1 86 23 109 69 11 25 4 73-24 106-26 30-52 43-85 47-33-4-59-17-85-47-28-33-35-81-24-106Z" fill="url(#btNoseMetal)" stroke="#e2b954" stroke-opacity=".4" stroke-width="2"/>
<ellipse cx="286" cy="470" rx="31" ry="22" fill="#100904"/><ellipse cx="414" cy="470" rx="31" ry="22" fill="#100904"/>
<ellipse cx="286" cy="468" rx="12" ry="8" fill="#ff8d23"/><ellipse cx="414" cy="468" rx="12" ry="8" fill="#ff8d23"/>
<path d="M350 385v128" stroke="#4e2e09" stroke-width="3"/><path d="M278 546c25 33 45 51 72 54 27-3 47-21 72-54-15 39-33 71-72 82-39-11-57-43-72-82Z" fill="#2c1805"/>
<path d="M92 87c19 16 36 29 64 43M608 87c-19 16-36 29-64 43" fill="none" stroke="#fff0b2" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/>
</svg>`;
      chart.appendChild(bull);
    }

    document.querySelectorAll('.bt-asset-wrap').forEach(el=>el.remove());
    document.querySelectorAll('.bt-vector-bull').forEach(el=>el.remove());
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  setTimeout(run,100);
  setTimeout(run,700);
})();