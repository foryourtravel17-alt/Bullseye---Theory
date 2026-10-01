(function(){
  const system = document.querySelector('.bt-system-copy .bt-locked-heading');
  if(system){
    system.innerHTML = '<span>Study.</span><br><span>Practice.</span><br><span>Review.</span>';
  }

  const course = document.querySelector('.bt-course-copy .bt-locked-heading');
  if(course){
    course.innerHTML = '<span>11-Lesson</span><br><span>Trading Education</span>';
  }

  const chart = document.querySelector('.bt-hero-visual .chart');
  if(chart && !chart.querySelector('.bt-final-bull')){
    const bull = document.createElement('div');
    bull.className = 'bt-final-bull';
    bull.setAttribute('aria-label','Premium metallic gold bull market visual');
    bull.innerHTML = `
<svg viewBox="0 0 700 700" role="img" aria-hidden="true">
  <defs>
    <radialGradient id="btGoldFace" cx="42%" cy="25%" r="78%">
      <stop offset="0%" stop-color="#ffe9a5"/>
      <stop offset="24%" stop-color="#e8bd5e"/>
      <stop offset="53%" stop-color="#bd8628"/>
      <stop offset="78%" stop-color="#70460f"/>
      <stop offset="100%" stop-color="#241507"/>
    </radialGradient>
    <radialGradient id="btGoldFace2" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#f7d778" stop-opacity=".95"/>
      <stop offset="45%" stop-color="#b8791e" stop-opacity=".86"/>
      <stop offset="100%" stop-color="#3c2308" stop-opacity=".96"/>
    </radialGradient>
    <linearGradient id="btGoldShadow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6d420c"/>
      <stop offset="44%" stop-color="#3c2105"/>
      <stop offset="100%" stop-color="#120a03"/>
    </linearGradient>
    <linearGradient id="btHornMetal" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#6b4311"/>
      <stop offset="38%" stop-color="#dab64c"/>
      <stop offset="65%" stop-color="#fff0aa"/>
      <stop offset="100%" stop-color="#714610"/>
    </linearGradient>
    <linearGradient id="btNoseMetal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d9a73e"/>
      <stop offset="55%" stop-color="#8c5b13"/>
      <stop offset="100%" stop-color="#3a2006"/>
    </linearGradient>
    <radialGradient id="btEyeFire" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="#fff4c4"/>
      <stop offset="23%" stop-color="#ffd35b"/>
      <stop offset="55%" stop-color="#ff8b1e"/>
      <stop offset="100%" stop-color="#b51f05"/>
    </radialGradient>
    <filter id="btGlow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="btSoft"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>

  <!-- horns -->
  <path class="bt-bull-horn" d="M165 224 C112 179 72 137 91 86 C123 118 153 133 205 147 C180 171 165 194 165 224Z"/>
  <path class="bt-bull-horn" d="M535 224 C588 179 628 137 609 86 C577 118 547 133 495 147 C520 171 535 194 535 224Z"/>
  <path d="M92 87 C111 103 128 116 156 130" fill="none" stroke="#fff0b2" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/>
  <path d="M608 87 C589 103 572 116 544 130" fill="none" stroke="#fff0b2" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/>

  <!-- ears -->
  <path class="bt-bull-shadow" d="M166 184 C111 151 77 172 79 215 C116 203 146 205 183 223Z"/>
  <path class="bt-bull-shadow" d="M534 184 C589 151 623 172 621 215 C584 203 554 205 517 223Z"/>

  <!-- head silhouette -->
  <path class="bt-bull-metal" d="M350 125
    C267 125 194 162 170 236
    C149 302 162 413 198 498
    C219 548 251 597 304 628
    C327 642 345 648 350 649
    C355 648 373 642 396 628
    C449 597 481 548 502 498
    C538 413 551 302 530 236
    C506 162 433 125 350 125Z"/>

  <!-- forehead crown -->
  <path class="bt-bull-shadow" d="M350 150 C292 151 235 169 207 210 C245 186 278 179 318 177 C331 163 339 155 350 150Z"/>
  <path d="M352 145 C400 153 455 174 490 210 C452 186 423 179 382 177 C372 161 363 153 352 145Z" fill="#fff0a1" opacity=".28"/>

  <!-- cheek planes -->
  <path d="M198 316 C224 279 267 263 315 269 C292 291 276 326 268 368 C244 359 219 343 198 316Z" fill="url(#btGoldFace2)" opacity=".9"/>
  <path d="M502 316 C476 279 433 263 385 269 C408 291 424 326 432 368 C456 359 481 343 502 316Z" fill="url(#btGoldFace2)" opacity=".9"/>

  <!-- brow ridges -->
  <path d="M207 286 C250 244 291 237 329 254 C313 274 300 291 292 309 C260 297 234 295 207 286Z" fill="#4a2907" opacity=".92"/>
  <path d="M493 286 C450 244 409 237 371 254 C387 274 400 291 408 309 C440 297 466 295 493 286Z" fill="#4a2907" opacity=".92"/>

  <!-- glowing eyes -->
  <g filter="url(#btGlow)">
    <path d="M222 300 C252 280 283 281 310 298 C286 318 253 322 224 309Z" class="bt-bull-dark"/>
    <ellipse cx="268" cy="303" rx="15" ry="9" fill="url(#btEyeFire)"/>
    <circle cx="269" cy="303" r="3.5" fill="#fffbd8"/>
    <path d="M478 300 C448 280 417 281 390 298 C414 318 447 322 476 309Z" class="bt-bull-dark"/>
    <ellipse cx="432" cy="303" rx="15" ry="9" fill="url(#btEyeFire)"/>
    <circle cx="431" cy="303" r="3.5" fill="#fffbd8"/>
  </g>

  <!-- blaze accents -->
  <path d="M251 340 C270 327 286 325 306 331" fill="none" stroke="#ffd76b" stroke-width="8" stroke-linecap="round" opacity=".55"/>
  <path d="M449 340 C430 327 414 325 394 331" fill="none" stroke="#ffd76b" stroke-width="8" stroke-linecap="round" opacity=".55"/>

  <!-- muzzle -->
  <path d="M241 436 C264 390 309 366 350 367 C391 366 436 390 459 436
           C470 461 463 509 435 542 C409 572 383 585 350 589
           C317 585 291 572 265 542 C237 509 230 461 241 436Z"
        fill="url(#btNoseMetal)" stroke="#e2b954" stroke-opacity=".36" stroke-width="2"/>

  <!-- muzzle center split -->
  <path d="M350 384 C345 427 345 472 350 513" class="bt-bull-cut" stroke-width="3"/>

  <!-- nostrils -->
  <ellipse cx="286" cy="470" rx="31" ry="22" fill="#100904"/>
  <ellipse cx="414" cy="470" rx="31" ry="22" fill="#100904"/>
  <ellipse cx="286" cy="468" rx="12" ry="8" class="bt-bull-hot" filter="url(#btGlow)"/>
  <ellipse cx="414" cy="468" rx="12" ry="8" class="bt-bull-hot" filter="url(#btGlow)"/>

  <!-- nose highlights -->
  <path d="M253 432 C268 410 289 397 311 391" fill="none" stroke="#fff1a4" stroke-opacity=".34" stroke-width="9" stroke-linecap="round"/>
  <path d="M447 432 C432 410 411 397 389 391" fill="none" stroke="#fff1a4" stroke-opacity=".24" stroke-width="9" stroke-linecap="round"/>

  <!-- jaw -->
  <path d="M278 546 C303 579 323 597 350 600 C377 597 397 579 422 546
           C407 585 389 617 350 628 C311 617 293 585 278 546Z"
        fill="#2c1805" opacity=".88"/>

  <!-- horn/face contour -->
  <path d="M196 251 C174 328 183 418 216 494" fill="none" stroke="#f7d873" stroke-opacity=".32" stroke-width="6" stroke-linecap="round"/>
  <path d="M504 251 C526 328 517 418 484 494" fill="none" stroke="#f7d873" stroke-opacity=".22" stroke-width="6" stroke-linecap="round"/>

  <!-- cinematic sparks -->
  <g fill="#ffd86e" opacity=".85">
    <circle cx="145" cy="335" r="3"/><circle cx="558" cy="355" r="3"/>
    <circle cx="180" cy="530" r="2.5"/><circle cx="520" cy="522" r="2.5"/>
    <circle cx="127" cy="280" r="2"/><circle cx="573" cy="290" r="2"/>
  </g>
</svg>`;
    chart.appendChild(bull);
  }

  // Remove legacy visual overlays that were making the previous composition look broken.
  document.querySelectorAll('.bt-asset-wrap').forEach(el=>el.remove());
  document.querySelectorAll('.bt-vector-bull').forEach((el,i)=>{ if(i>0) el.remove(); });
})();
