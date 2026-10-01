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
        <svg class="bull-svg" viewBox="0 0 360 360" role="img" aria-label="Cinematic metallic bull with fiery eyes">
  <defs>
    <linearGradient id="btMetal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff3bd"/><stop offset=".16" stop-color="#d9a83e"/>
      <stop offset=".38" stop-color="#6e4310"/><stop offset=".55" stop-color="#f4cc62"/>
      <stop offset=".76" stop-color="#8b5a12"/><stop offset="1" stop-color="#2b1a06"/>
    </linearGradient>
    <linearGradient id="btHorn" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#3a250b"/><stop offset=".38" stop-color="#b77d20"/>
      <stop offset=".7" stop-color="#ffe5a0"/><stop offset="1" stop-color="#fff8d8"/>
    </linearGradient>
    <radialGradient id="btFace" cx="50%" cy="28%" r="78%">
      <stop offset="0" stop-color="#ffe9a2"/><stop offset=".24" stop-color="#c9962e"/>
      <stop offset=".58" stop-color="#70460d"/><stop offset="1" stop-color="#211304"/>
    </radialGradient>
    <linearGradient id="btFire" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#ff2100"/><stop offset=".4" stop-color="#ff6411"/>
      <stop offset=".72" stop-color="#ffc52d"/><stop offset="1" stop-color="#fff9c7"/>
    </linearGradient>
    <filter id="btGlow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="btEyeGlow"><feGaussianBlur stdDeviation="3.5" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>

  <!-- large curved bull horns -->
  <path d="M119 105 C83 105 51 92 35 70 C20 49 21 25 34 13 C36 43 53 58 74 61 C91 63 107 56 125 43 L139 69 C132 84 126 95 119 105Z" fill="url(#btHorn)" stroke="#f3d47e" stroke-width="3"/>
  <path d="M241 105 C277 105 309 92 325 70 C340 49 339 25 326 13 C324 43 307 58 286 61 C269 63 253 56 235 43 L221 69 C228 84 234 95 241 105Z" fill="url(#btHorn)" stroke="#f3d47e" stroke-width="3"/>

  <!-- ears -->
  <path d="M105 93 C78 84 59 91 47 109 C67 118 88 117 108 106Z" fill="#8a5913" stroke="#d9ad50" stroke-width="2"/>
  <path d="M255 93 C282 84 301 91 313 109 C293 118 272 117 252 106Z" fill="#8a5913" stroke="#d9ad50" stroke-width="2"/>

  <!-- anatomical bull head silhouette -->
  <path d="M112 76 C132 54 154 46 180 46 C206 46 228 54 248 76
           C263 95 267 122 261 151 C256 180 248 211 235 236
           C225 255 211 270 198 281 C191 287 169 287 162 281
           C149 270 135 255 125 236 C112 211 104 180 99 151
           C93 122 97 95 112 76Z" fill="url(#btFace)" stroke="#d8aa49" stroke-width="3"/>

  <!-- forehead planes -->
  <path d="M180 53 L153 104 L164 139 L180 126 L196 139 L207 104Z" fill="#f5cf69" opacity=".46"/>
  <path d="M124 91 C143 73 159 67 174 66 L157 119 L126 139 L109 119Z" fill="#3f2808" opacity=".32"/>
  <path d="M236 91 C217 73 201 67 186 66 L203 119 L234 139 L251 119Z" fill="#3f2808" opacity=".32"/>

  <!-- brow ridges and eyes -->
  <path d="M112 145 Q137 122 164 143" fill="none" stroke="#171006" stroke-width="17" stroke-linecap="round"/>
  <path d="M196 143 Q223 122 248 145" fill="none" stroke="#171006" stroke-width="17" stroke-linecap="round"/>
  <g filter="url(#btEyeGlow)">
    <path d="M116 153 Q139 137 160 154 Q139 171 116 153Z" fill="#090503" stroke="url(#btFire)" stroke-width="5"/>
    <path d="M200 154 Q221 137 244 153 Q221 171 200 154Z" fill="#090503" stroke="url(#btFire)" stroke-width="5"/>
    <ellipse cx="139" cy="153" rx="5" ry="3" fill="#fff7bd"/>
    <ellipse cx="221" cy="153" rx="5" ry="3" fill="#fff7bd"/>
  </g>

  <!-- long animated flames from the eyes -->
  <g class="bt-eye-fire" fill="url(#btFire)" filter="url(#btEyeGlow)">
    <path d="M121 155 C101 153 82 143 66 125 C81 133 94 133 106 129 C94 119 90 107 91 95 C108 111 121 122 135 130 C129 139 125 148 121 155Z"/>
  </g>
  <g class="bt-eye-fire fire2" fill="url(#btFire)" filter="url(#btEyeGlow)">
    <path d="M239 155 C259 153 278 143 294 125 C279 133 266 133 254 129 C266 119 270 107 269 95 C252 111 239 122 225 130 C231 139 235 148 239 155Z"/>
  </g>
  <g class="bt-fire-core" fill="url(#btFire)" filter="url(#btGlow)">
    <path d="M131 158 C120 149 116 138 119 128 C126 137 134 140 142 138 C138 129 141 120 148 113 C150 127 159 137 164 144 C155 152 144 157 131 158Z"/>
    <path d="M229 158 C240 149 244 138 241 128 C234 137 226 140 218 138 C222 129 219 120 212 113 C210 127 201 137 196 144 C205 152 216 157 229 158Z"/>
  </g>

  <!-- strong central muzzle bridge -->
  <path d="M157 166 C151 186 150 207 153 224 C158 239 166 248 180 252
           C194 248 202 239 207 224 C210 207 209 186 203 166
           C190 157 170 157 157 166Z" fill="#4b3009" stroke="#c8942e" stroke-width="2"/>

  <!-- broad bull muzzle -->
  <path d="M135 218 C145 205 163 201 180 201 C197 201 215 205 225 218
           C231 229 225 247 213 257 C202 266 191 270 180 270
           C169 270 158 266 147 257 C135 247 129 229 135 218Z" fill="#8d6019" stroke="#e1b451" stroke-width="3"/>
  <ellipse cx="157" cy="234" rx="11" ry="9" fill="#140d04"/>
  <ellipse cx="203" cy="234" rx="11" ry="9" fill="#140d04"/>
  <text class="bt-nostril-symbol" x="157" y="237" text-anchor="middle" fill="#a8ff61" font-size="8" font-weight="900">₿</text>
  <text class="bt-nostril-symbol s2" x="203" y="237" text-anchor="middle" fill="#e4b957" font-size="8" font-weight="900">$</text>

  <!-- jaw -->
  <path d="M151 261 Q180 282 209 261 Q203 292 180 300 Q157 292 151 261Z" fill="#2a1906" stroke="#b77e21" stroke-width="2"/>
  <path d="M160 278 Q180 288 200 278" fill="none" stroke="#f0c85c" stroke-width="3" opacity=".7"/>

  <!-- central horn/forehead highlight -->
  <path d="M180 48 L169 92 L180 111 L191 92Z" fill="#fff2ae" filter="url(#btGlow)" opacity=".92"/>

  <!-- sparks -->
  <g class="bt-spark" fill="#fff2a1"><circle cx="76" cy="112" r="2"/><circle cx="284" cy="110" r="2"/></g>
  <g class="bt-spark s2" fill="#ff8b1f"><circle cx="95" cy="91" r="1.5"/><circle cx="265" cy="91" r="1.5"/></g>
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