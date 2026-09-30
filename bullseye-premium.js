(function(){
  const path=location.pathname.split('/').pop()||'index.html';
  document.body.classList.add('bt-premium');

  if(path==='index.html'||path===''){
    const hero=document.querySelector('.hero');
    if(hero && !document.querySelector('.bt-command')){
      const command=document.createElement('section');
      command.className='bt-command';
      command.innerHTML=`
        <div class="bt-command-grid">
          <div class="bt-panel">
            <div class="bt-panel-kicker">BULLSEYE COMMAND CENTER</div>
            <div class="bt-panel-title">A structured learning system — not a signal room.</div>
            <div class="bt-mini-grid">
              <div class="bt-mini"><b><span class="bt-dot"></span>Study</b><span>Lessons + visual examples</span></div>
              <div class="bt-mini"><b><span class="bt-dot"></span>Practice</b><span>Exercises + chart review</span></div>
              <div class="bt-mini"><b><span class="bt-dot"></span>Review</b><span>Journal + progress</span></div>
            </div>
          </div>
          <div class="bt-panel">
            <div class="bt-panel-kicker">SYSTEM STATUS</div>
            <div class="bt-panel-title">Learning stack</div>
            <div class="bt-status"><span>Course</span><b>ACTIVE</b></div>
            <div class="bt-status"><span>11 lessons</span><b>READY</b></div>
            <div class="bt-status"><span>Risk-first framework</span><b>ON</b></div>
          </div>
          <div class="bt-panel">
            <div class="bt-panel-kicker">POSITIONING</div>
            <div class="bt-panel-title">Learn the process.</div>
            <span class="bt-tag">NO EASY-MONEY PROMISES</span>
            <div class="bt-mobile-note">Educational use only. Trading involves risk.</div>
          </div>
        </div>`;
      hero.insertAdjacentElement('afterend',command);
    }
  }

  if(path==='dashboard.html'){
    const main=document.querySelector('main');
    if(main && !document.querySelector('.bt-command')){
      const command=document.createElement('section');
      command.className='bt-command';
      command.innerHTML=`
        <div class="bt-command-grid">
          <div class="bt-panel">
            <div class="bt-panel-kicker">TODAY'S PLAN</div>
            <div class="bt-panel-title">Learn → practice → review</div>
            <div class="bt-mini-grid">
              <div class="bt-mini"><b>01</b><span>Open current lesson</span></div>
              <div class="bt-mini"><b>02</b><span>Study the chart example</span></div>
              <div class="bt-mini"><b>03</b><span>Complete your review</span></div>
            </div>
            <div class="bt-statbar">
              <div class="bt-statbox"><strong id="btLiveProgress">—</strong><small>PROGRESS</small></div>
              <div class="bt-statbox"><strong>11</strong><small>LESSONS</small></div>
              <div class="bt-statbox"><strong>ON</strong><small>RISK-FIRST</small></div>
              <div class="bt-statbox"><strong>LIVE</strong><small>STUDENT AREA</small></div>
            </div>
          </div>
          <div class="bt-panel">
            <div class="bt-panel-kicker">SYSTEM STATUS</div>
            <div class="bt-panel-title">Bullseye stack</div>
            <div class="bt-status"><span>Authentication</span><b><span class="bt-dot"></span>READY</b></div>
            <div class="bt-status"><span>Course access</span><b id="btAccessState">CHECKING</b></div>
            <div class="bt-status"><span>Lesson progress</span><b><span class="bt-dot"></span>SYNCED</b></div>
          </div>
          <div class="bt-panel">
            <div class="bt-panel-kicker">STUDENT MODE</div>
            <div class="bt-panel-title">Focus on the process.</div>
            <span class="bt-tag">DISCIPLINE OVER IMPULSE</span>
            <div class="bt-mobile-note">Use the curriculum below to continue your learning path.</div>
          </div>
        </div>`;
      main.insertAdjacentElement('afterbegin',command);

      const sync=()=>{
        const pct=document.getElementById('completionPct');
        const out=document.getElementById('btLiveProgress');
        if(pct&&out) out.textContent=pct.textContent;
        const status=document.getElementById('statusStat');
        const access=document.getElementById('btAccessState');
        if(status&&access) access.textContent=status.textContent.toUpperCase();
      };
      setTimeout(sync,700); setTimeout(sync,1800); setInterval(sync,4000);
    }
  }

  const heroChart=document.querySelector('.chart');
  if(heroChart && !heroChart.querySelector('.bt-market-core')){
    const core=document.createElement('div');
    core.className='bt-market-core';
    core.innerHTML=`
      <div class="ticker-row">
        <span class="ticker">XAU/USD <b>GOLD</b></span>
        <span class="ticker">EUR/USD <b>FX</b></span>
        <span class="ticker">BTC/USD <b>CRYPTO</b></span>
      </div>

      <svg class="market-candles" viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true">
        <g>
          <line x1="35" y1="195" x2="35" y2="160"/><rect x="30" y="171" width="10" height="18"/>
          <line x1="75" y1="174" x2="75" y2="132"/><rect x="70" y="143" width="10" height="24"/>
          <line x1="115" y1="155" x2="115" y2="102"/><rect x="110" y="118" width="10" height="25"/>
          <line x1="155" y1="132" x2="155" y2="88"/><rect x="150" y="97" width="10" height="22"/>
          <line x1="195" y1="151" x2="195" y2="108"/><rect x="190" y="119" width="10" height="21" class="downrect"/>
          <line x1="235" y1="130" x2="235" y2="74"/><rect x="230" y="84" width="10" height="26"/>
          <line x1="275" y1="112" x2="275" y2="52"/><rect x="270" y="65" width="10" height="29"/>
          <line x1="315" y1="101" x2="315" y2="48"/><rect x="310" y="59" width="10" height="25"/>
          <line x1="355" y1="116" x2="355" y2="57" class="down"/><rect class="downrect" x="350" y="70" width="10" height="24"/>
          <line x1="395" y1="90" x2="395" y2="36"/><rect x="390" y="47" width="10" height="26"/>
          <line x1="435" y1="78" x2="435" y2="28"/><rect x="430" y="38" width="10" height="24"/>
          <line x1="475" y1="66" x2="475" y2="20"/><rect x="470" y="29" width="10" height="22"/>
          <line x1="515" y1="82" x2="515" y2="34" class="down"/><rect class="downrect" x="510" y="46" width="10" height="20"/>
          <line x1="555" y1="56" x2="555" y2="8"/><rect x="550" y="20" width="10" height="25"/>
        </g>
      </svg>

      <svg class="dubai-skyline" viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true">
        <g fill="#040607">
          <rect x="0" y="108" width="64" height="72"/><rect x="48" y="86" width="48" height="94"/>
          <rect x="92" y="122" width="48" height="58"/><rect x="135" y="76" width="45" height="104"/>
          <rect x="176" y="98" width="58" height="82"/><rect x="230" y="70" width="55" height="110"/>
          <rect x="281" y="52" width="48" height="128"/><rect x="323" y="32" width="42" height="148"/>
          <rect x="360" y="82" width="66" height="98"/><rect x="417" y="60" width="54" height="120"/>
          <rect x="464" y="100" width="62" height="80"/><rect x="518" y="72" width="44" height="108"/><rect x="558" y="112" width="42" height="68"/>
          <path d="M344 32 L344 3 L351 32Z" fill="#e4b957" fill-opacity=".30"/>
        </g>
        <g fill="#e4b957" opacity=".34">
          <rect x="330" y="42" width="3" height="12"/><rect x="356" y="55" width="3" height="14"/><rect x="286" y="69" width="3" height="10"/>
          <rect x="100" y="133" width="3" height="10"/><rect x="446" y="73" width="3" height="12"/><rect x="532" y="85" width="3" height="10"/>
        </g>
      </svg>

      <div class="bull-visual">
        <div class="bull-glow"></div><div class="bull-ring"></div><div class="bull-ring r2"></div><div class="bull-ring r3"></div>
        <div class="crosshair"></div>
        <svg class="bull-svg" viewBox="0 0 360 360" role="img" aria-label="Metallic bull with fiery eyes">
          <defs>
            <linearGradient id="btMetal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#fff2b5"/><stop offset=".18" stop-color="#f2cd69"/><stop offset=".38" stop-color="#a97521"/><stop offset=".55" stop-color="#ffe38a"/><stop offset=".78" stop-color="#9a6b1b"/><stop offset="1" stop-color="#4b3210"/>
            </linearGradient>
            <linearGradient id="btHorn" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#fff2b8"/><stop offset=".35" stop-color="#dba947"/><stop offset=".7" stop-color="#7b5416"/><stop offset="1" stop-color="#2b1b08"/>
            </linearGradient>
            <radialGradient id="btFace" cx="48%" cy="34%" r="70%">
              <stop offset="0" stop-color="#ffe79a"/><stop offset=".27" stop-color="#d2a33d"/><stop offset=".62" stop-color="#8e6118"/><stop offset="1" stop-color="#3c280c"/>
            </radialGradient>
            <linearGradient id="btFire" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stop-color="#ff3b00"/><stop offset=".45" stop-color="#ff9e19"/><stop offset=".75" stop-color="#fff3a0"/><stop offset="1" stop-color="#fff"/>
            </linearGradient>
            <filter id="btGlow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="btEyeGlow"><feGaussianBlur stdDeviation="4" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          <ellipse cx="180" cy="190" rx="112" ry="126" fill="url(#btFace)" stroke="#e4b957" stroke-width="2"/>
          <path d="M86 132 C50 124 24 101 18 68 C47 78 72 75 96 58 C111 42 130 31 150 27 L141 63 C119 73 103 91 92 110Z" fill="url(#btHorn)" stroke="#f2d883" stroke-width="3"/>
          <path d="M274 132 C310 124 336 101 342 68 C313 78 288 75 264 58 C249 42 230 31 210 27 L219 63 C241 73 257 91 268 110Z" fill="url(#btHorn)" stroke="#f2d883" stroke-width="3"/>
          <path d="M104 93 Q130 66 153 64 L165 99 L153 130 Q122 119 104 93Z" fill="#805717" opacity=".75"/>
          <path d="M256 93 Q230 66 207 64 L195 99 L207 130 Q238 119 256 93Z" fill="#805717" opacity=".75"/>

          <path d="M110 150 Q137 127 162 149" fill="none" stroke="#16120a" stroke-width="15" stroke-linecap="round"/>
          <path d="M198 149 Q223 127 250 150" fill="none" stroke="#16120a" stroke-width="15" stroke-linecap="round"/>

          <g filter="url(#btEyeGlow)">
            <path d="M113 159 Q137 142 159 159 Q136 176 113 159Z" fill="#140904" stroke="url(#btFire)" stroke-width="5"/>
            <path d="M201 159 Q223 142 247 159 Q224 176 201 159Z" fill="#140904" stroke="url(#btFire)" stroke-width="5"/>
            <path d="M122 158 Q138 149 151 159 Q138 167 122 158Z" fill="#fff6b0"/>
            <path d="M209 159 Q224 149 238 158 Q225 167 209 159Z" fill="#fff6b0"/>
            <path d="M108 158 L86 142 M109 164 L82 163 M251 158 L274 142 M251 164 L278 163" stroke="#ff6b16" stroke-width="4" stroke-linecap="round" opacity=".9"/>
          </g>

          <path d="M163 169 L152 241 L180 258 L208 241 L197 169 Q180 159 163 169Z" fill="#2a1c08" stroke="#d7aa4a" stroke-width="2"/>
          <ellipse cx="180" cy="249" rx="55" ry="30" fill="#6c4914" stroke="#e3b957" stroke-width="2"/>
          <ellipse cx="158" cy="248" rx="10" ry="8" fill="#160f06"/><ellipse cx="202" cy="248" rx="10" ry="8" fill="#160f06"/>
          <path d="M143 280 Q180 302 217 280" fill="none" stroke="#171006" stroke-width="8" stroke-linecap="round"/>

          <path d="M180 28 L171 83 L180 102 L189 83Z" fill="#fff0a4" filter="url(#btGlow)"/>
          <path d="M112 205 Q180 235 248 205" fill="none" stroke="rgba(255,244,178,.28)" stroke-width="5"/>
          <path d="M105 226 Q180 252 255 226" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="2"/>
        </svg>
        <span class="symbol s1">₿</span><span class="symbol s2">$</span><span class="symbol s3">€</span><span class="symbol s4">¥</span>
      </div>

      <div class="price-card pc1"><b>XAUUSD</b><span>GOLD · STUDY</span></div>
      <div class="price-card pc2"><b>BTCUSD</b><span>CRYPTO · STUDY</span></div>
      <div class="hud-label"><span>STRUCTURE / LIQUIDITY / DISCIPLINE</span><b>● EDUCATIONAL MODE</b></div>
    `;
    heroChart.appendChild(core);
  }
})();