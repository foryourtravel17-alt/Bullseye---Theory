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
})();
(function(){
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
      <div class="bull-visual">
        <div class="bull-glow"></div><div class="bull-ring"></div><div class="bull-ring r2"></div><div class="bull-ring r3"></div>
        <div class="fire"></div>
        <svg class="bull-svg" viewBox="0 0 240 240" aria-label="Bullseye bull mark" role="img">
          <defs><linearGradient id="btBullGold" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff0ad"/><stop offset=".35" stop-color="#e4b957"/><stop offset="1" stop-color="#8f6b25"/></linearGradient></defs>
          <path d="M54 77 C36 63 28 45 37 31 C48 44 61 48 75 46 C88 35 101 29 120 29 C139 29 152 35 165 46 C179 48 192 44 203 31 C212 45 204 63 186 77 C190 91 189 111 181 127 C173 144 159 155 145 163 L155 187 L120 172 L85 187 L95 163 C81 155 67 144 59 127 C51 111 50 91 54 77 Z" fill="url(#btBullGold)" opacity=".96"/>
          <path d="M59 78 C43 69 37 58 38 47 M181 78 C197 69 203 58 202 47" fill="none" stroke="#f7e6a0" stroke-width="6" stroke-linecap="round"/>
          <path d="M78 91 Q91 80 104 91 M136 91 Q149 80 162 91" fill="none" stroke="#101719" stroke-width="7" stroke-linecap="round"/>
          <circle cx="91" cy="93" r="3.5" fill="#101719"/><circle cx="149" cy="93" r="3.5" fill="#101719"/>
          <path d="M112 104 L108 133 L120 141 L132 133 L128 104" fill="#101719"/>
          <path d="M96 151 Q120 166 144 151" fill="none" stroke="#101719" stroke-width="5" stroke-linecap="round"/>
        </svg>
        <span class="symbol s1">₿</span><span class="symbol s2">$</span><span class="symbol s3">€</span><span class="symbol s4">¥</span>
      </div>
      <div class="hud-label"><span>STRUCTURE / LIQUIDITY / DISCIPLINE</span><b>● EDUCATIONAL MODE</b></div>
    `;
    heroChart.appendChild(core);
  }
})();
