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
      <div class="bt-cinematic-stage">
        <div class="bt-market-topline"><span>PRICE / TARGET</span><b>MARKET STUDY / <i>EDUCATIONAL</i></b></div>
        <div class="bt-3d-layer-label" aria-hidden="true">REAL-TIME 3D MARKET VISUAL / WEBGL</div>
        <div class="bt-market-pills"><span>XAU/USD <b>GOLD</b></span><span>EUR/USD <b>FX</b></span><span>BTC/USD <b>CRYPTO</b></span></div>
        <div class="bt-side-quote bt-q-left"><b>MARKET BOARD</b><span> XAUUSD <em>+0.42%</em></span><span>EURUSD <em>+0.28%</em></span><span>GBPUSD <em>+0.31%</em></span><span>BTCUSD <em>+1.24%</em></span><span>ETHUSD <em>+0.91%</em></span><span>DXY <em>+0.18%</em></span></div>
        <div class="bt-side-quote bt-q-right"><b>BTCUSD</b><strong>68324.12</strong><em>+2.14%</em></div>
        <div class="bt-side-quote bt-q-xau"><b>XAUUSD</b><strong>2354.80</strong><em>+0.42%</em></div>
        <div class="bt-side-quote bt-q-eur"><b>EURUSD</b><strong>1.0876</strong><em>+0.31%</em></div>
        <div class="bt-market-bottom"><span>STRUCTURE / LIQUIDITY / DISCIPLINE</span><b>● EDUCATIONAL MODE</b></div>
        <div class="bt-market-caption">MARKET MOTION / LIVE STUDY</div>
      </div>`
    heroChart.appendChild(core);
  }
})();
  const header=document.querySelector('header');
  if(header && !header.querySelector('.bt-header-menu')){
    const logo=header.querySelector('.logo');
    if(logo && !logo.querySelector('.bt-header-tagline')){
      const tag=document.createElement('span'); tag.className='bt-header-tagline'; tag.textContent='LEARN | TRADE | GROW'; logo.appendChild(tag);
    }
    const menu=document.createElement('button');
    menu.className='bt-header-menu'; menu.type='button'; menu.setAttribute('aria-label','Open navigation');
    menu.innerHTML='<span></span><span></span><span></span>';
    header.appendChild(menu);
    menu.addEventListener('click',()=>document.body.classList.toggle('bt-nav-open'));
  }
