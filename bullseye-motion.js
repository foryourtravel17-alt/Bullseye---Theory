/* Bullseye Theory — motion layer inspired by Lenis / GSAP / interaction-library patterns.
   Vanilla HTML/CSS/JS compatible. Fails soft if an external library is unavailable. */
(()=> {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.querySelector('.v5-scroll-progress span');

  // Lenis: premium-feeling smooth scroll while preserving native anchors/accessibility.
  if (window.Lenis && !reduced) {
    try {
      window.bullseyeLenis = new Lenis({
        autoRaf: true,
        anchors: true,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        respectReducedMotion: true
      });
      window.bullseyeLenis.on('scroll', ({progress: p}) => {
        if (progress) progress.style.width = (p * 100) + '%';
      });
    } catch (_) {}
  }

  // Native fallback for progress if Lenis is unavailable/reduced motion is enabled.
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  };
  addEventListener('scroll', updateProgress, {passive:true});
  updateProgress();

  if (!window.gsap || !window.ScrollTrigger || reduced) return;

  try {
    gsap.registerPlugin(ScrollTrigger);

    // Sync ScrollTrigger with Lenis when available.
    if (window.bullseyeLenis) {
      window.bullseyeLenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => window.bullseyeLenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const mm = gsap.matchMedia();
    mm.add('(min-width: 851px)', () => {
      const hero = document.querySelector('.v5-hero');
      const copy = document.querySelector('.v5-hero-copy');
      const bull = document.querySelector('.v6-bull-stage');
      const reticle = document.querySelector('.v5-reticle');

      if (hero && copy) {
        gsap.fromTo(copy, {y:24, opacity:0}, {
          y:0, opacity:1, duration:1.05, ease:'power3.out', delay:.12,
          clearProps:'transform,opacity'
        });
      }
      if (bull) {
        gsap.fromTo(bull, {scale:.965, opacity:0}, {
          scale:1, opacity:1, duration:1.2, ease:'power3.out', delay:.22,
          clearProps:'transform,opacity'
        });
      }
      if (reticle) {
        gsap.fromTo(reticle, {scale:.9, opacity:0}, {
          scale:1, opacity:1, duration:1.1, ease:'power2.out', delay:.35,
          clearProps:'transform,opacity'
        });
      }

      // Gentle scroll depth: no competing hero movement, just a small cinematic drift.
      if (hero && bull) {
        gsap.to(bull, {
          yPercent:7,
          ease:'none',
          scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1.2}
        });
      }
    });

    // Text/section reveal — inspired by text-reveal and tile-reveal patterns,
    // but kept restrained for the Bullseye institutional tone.
    gsap.utils.toArray('.v3-section .v3-label, .v3-section h2, .v3-principle, .v3-price, .v3-faq details').forEach((el, i) => {
      gsap.fromTo(el,
        {y:22, opacity:0},
        {y:0, opacity:1, duration:.72, ease:'power3.out',
         scrollTrigger:{trigger:el,start:'top 88%',once:true},
         delay: Math.min(i % 3, 2) * .05}
      );
    });

    // Small magnetic interaction for primary CTAs on fine pointers only.
    if (matchMedia('(pointer:fine)').matches) {
      document.querySelectorAll('.v3-primary').forEach(btn => {
        btn.addEventListener('pointermove', e => {
          const r=btn.getBoundingClientRect();
          const x=(e.clientX-r.left-r.width/2)*.08;
          const y=(e.clientY-r.top-r.height/2)*.08;
          gsap.to(btn,{x,y,duration:.25,ease:'power2.out',overwrite:true});
        });
        btn.addEventListener('pointerleave', () => {
          gsap.to(btn,{x:0,y:0,duration:.35,ease:'elastic.out(1,.55)',overwrite:true});
        });
      });
    }

    ScrollTrigger.refresh();
  } catch (_) {
    // Existing CSS/JS motion remains the fallback.
  }
})();