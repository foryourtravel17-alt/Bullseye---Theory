/* Bullseye reel-context interaction layer — dependency free. */
(()=> {
  const root=document.querySelector('.bx-lab');
  if(!root) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tabs=[...root.querySelectorAll('.bx-tab')];
  const title=root.querySelector('[data-inspector-title]');
  const copy=root.querySelector('[data-inspector-copy]');
  const code=root.querySelector('[data-inspector-code]');
  const metric=root.querySelector('[data-inspector-metric]');
  const node=root.querySelector('.bx-stage-label');
  const states={
    system:{title:'Market Lens',copy:'A visual command layer for context, structure, liquidity and risk. The interface is designed to make the learning sequence visible before the student reaches for execution.',code:'MODE / SYSTEM\nINPUT / CONTEXT + STRUCTURE\nOUTPUT / DECISION MAP',metric:'CONTEXT → STRUCTURE → RISK',label:'SYSTEM / CONTEXT MAP'},
    practice:{title:'Practice Lab',copy:'A focused workspace for turning a lesson into chart work: mark the structure, define invalidation, then review the decision without noise.',code:'MODE / PRACTICE\nINPUT / CHART + RULES\nOUTPUT / TESTABLE SETUP',metric:'MARK → TEST → REVIEW',label:'PRACTICE / CHART LAB'},
    review:{title:'Review Loop',copy:'A post-trade review surface that treats decisions as data. Capture what was seen, what changed, and whether the process was followed.',code:'MODE / REVIEW\nINPUT / JOURNAL + OUTCOME\nOUTPUT / PROCESS SIGNAL',metric:'OBSERVE → RECORD → REFINE',label:'REVIEW / PROCESS DATA'}
  };
  tabs.forEach(t=>t.addEventListener('click',()=>{
    tabs.forEach(x=>x.setAttribute('aria-selected','false'));
    t.setAttribute('aria-selected','true');
    const s=states[t.dataset.mode]||states.system;
    [title,copy,code,metric,node].forEach(el=>{if(el)el.style.opacity='0'});
    setTimeout(()=>{
      if(title)title.textContent=s.title;
      if(copy)copy.textContent=s.copy;
      if(code)code.textContent=s.code;
      if(metric)metric.textContent=s.metric;
      if(node)node.textContent=s.label;
      [title,copy,code,metric,node].forEach(el=>{if(el)el.style.transition='opacity .25s ease';if(el)el.style.opacity='1'});
    },120);
  }));

  const cards=[...root.querySelectorAll('.bx-lesson')];
  const setActive=()=>{
    if(!cards.length)return;
    const center=innerWidth/2;
    let best=null,dist=Infinity;
    cards.forEach(c=>{const r=c.getBoundingClientRect();const d=Math.abs((r.left+r.width/2)-center);if(d<dist){dist=d;best=c}});
    cards.forEach(c=>c.classList.toggle('is-active',c===best));
  };
  root.querySelectorAll('[data-carousel]').forEach(btn=>btn.addEventListener('click',()=>{
    const track=root.querySelector('.bx-carousel'); if(!track)return;
    track.scrollBy({left:(btn.dataset.carousel==='next'?1:-1)*Math.min(track.clientWidth*.72,430),behavior:reduced?'auto':'smooth'});
  }));
  const track=root.querySelector('.bx-carousel');
  track?.addEventListener('scroll',()=>requestAnimationFrame(setActive),{passive:true});
  addEventListener('resize',setActive,{passive:true});
  setActive();

  const reveals=[...root.querySelectorAll('.bx-reveal')];
  if(reduced){reveals.forEach(x=>x.classList.add('bx-in'))}
  else{
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('bx-in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    reveals.forEach((x,i)=>{x.style.transitionDelay=Math.min(i*55,330)+'ms';io.observe(x)});
  }

  if(!reduced && matchMedia('(pointer:fine)').matches){
    const radar=root.querySelector('.bx-radar');
    root.addEventListener('pointermove',e=>{
      if(!radar)return;
      const r=radar.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/r.width,y=(e.clientY-r.top-r.height/2)/r.height;
      radar.style.transform='perspective(800px) rotateX('+(-y*5)+'deg) rotateY('+(x*7)+'deg)';
    });
    root.addEventListener('pointerleave',()=>{if(radar)radar.style.transform=''});
  }
})();