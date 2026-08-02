'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** A slow, physical reveal: first the stamp lands, then the dye soaks in. */
export function InkPressType() {
  const sectionRef = useRef<HTMLElement>(null);
  const stampRef = useRef<HTMLSpanElement>(null);
  const dyeRef = useRef<HTMLSpanElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stamp = stampRef.current;
    const dye = dyeRef.current;
    const paper = paperRef.current;
    const kicker = kickerRef.current;
    if (!section || !stamp || !dye || !paper || !kicker) return;

    const ctx = gsap.context(() => {
      gsap.set([stamp, dye], { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' });
      gsap.set(dye, { opacity: 0 });
      gsap.set(paper, { opacity: 0 });
      gsap.set(kicker, { opacity: 0.2, letterSpacing: '-0.05em', y: 12 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          end: 'bottom 38%',
          scrub: 0.3,
        },
      });

      // Imperfect polygon edges keep it from reading as a generic wipe.
      timeline
        .to(stamp, {
          clipPath: 'polygon(0 0, 100% 0, 99% 12%, 100% 29%, 98% 46%, 100% 65%, 99% 82%, 100% 100%, 0 100%)',
          duration: 0.44,
          ease: 'none',
        })
        .to(dye, { opacity: 1, duration: 0.5, ease: 'none' }, 0.22)
        .to(paper, { opacity: 0.16, duration: 0.28, ease: 'none' }, 0.62)
        .to(kicker, { opacity: 0.82, letterSpacing: '0em', y: 0, duration: 0.32, ease: 'none' }, 0.48);
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} aria-label="Pressed by hand" className="relative min-h-[108svh] overflow-hidden bg-black">
      <div className="sticky top-0 flex min-h-svh items-center justify-center px-4">
        <div ref={paperRef} aria-hidden className="absolute inset-0 bg-[url('/textures/crinkle-red.jpg')] bg-cover bg-center mix-blend-multiply" />
        <div className="relative w-full text-center">
          <p className="mb-6 text-[0.58rem] uppercase tracking-[0.38em] text-[#D6432F]/65 sm:mb-8">
            The mark remains
          </p>
          <div className="relative mx-auto w-full select-none" aria-label="Pressed by hand">
            <span
              aria-hidden
              className="block font-black uppercase leading-[.78] tracking-[-0.075em] text-black"
              style={{ fontSize: 'clamp(3.2rem, 13.6vw, 13rem)', textShadow: '0 0 1px rgba(214,67,47,.3)' }}
            >
              Pressed by hand
            </span>
            <span
              ref={stampRef}
              aria-hidden
              className="absolute inset-0 block font-black uppercase leading-[.78] tracking-[-0.075em] text-[#D6432F]"
              style={{ fontSize: 'clamp(3.2rem, 13.6vw, 13rem)' }}
            >
              Pressed by hand
            </span>
            <span
              ref={dyeRef}
              aria-hidden
              className="absolute inset-0 block bg-[url('/prints/saree-ajrakh-3.jpg')] bg-cover bg-center bg-clip-text font-black uppercase leading-[.78] tracking-[-0.075em] text-transparent mix-blend-multiply"
              style={{ fontSize: 'clamp(3.2rem, 13.6vw, 13rem)' }}
            >
              Pressed by hand
            </span>
          </div>
          <p ref={kickerRef} className="mx-auto mt-9 max-w-sm text-sm font-light leading-relaxed text-white/80 sm:text-base">
            One carved block. One deliberate press. A pattern that could only have been made by a hand.
          </p>
        </div>
      </div>
    </section>
  );
}
