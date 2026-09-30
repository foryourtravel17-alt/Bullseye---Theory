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