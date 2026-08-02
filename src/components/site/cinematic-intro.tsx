'use client';

import { useEffect, useState } from 'react';

/**
 * A film-open sequence: letterbox bars close in, a title card holds, then
 * everything snaps open into the real hero. Runs once per session (sessionStorage
 * guard) so repeat visitors during the same session aren't forced through it again.
 */
export function CinematicIntro() {
  const [phase, setPhase] = useState<'bars-in' | 'title' | 'bars-out' | 'done'>('bars-in');
  const [skip, setSkip] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem('at_intro_seen');
    if (seen) {
      setPhase('done');
      return;
    }
    setSkip(false);
    sessionStorage.setItem('at_intro_seen', '1');

    const t1 = setTimeout(() => setPhase('title'), 500);
    const t2 = setTimeout(() => setPhase('bars-out'), 2100);
    const t3 = setTimeout(() => setPhase('done'), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (skip || phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-[500] pointer-events-none" aria-hidden="true">
      {/* letterbox bars — thick at rest, snap to zero on bars-out */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: phase === 'bars-out' ? '0vh' : '14vh',
          background: '#000',
          transition: 'height .55s cubic-bezier(.76,0,.24,1)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: phase === 'bars-out' ? '0vh' : '14vh',
          background: '#000',
          transition: 'height .55s cubic-bezier(.76,0,.24,1)',
        }}
      />

      {/* title card — holds center, cuts out fast (film-cut, not a fade) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{
          opacity: phase === 'title' ? 1 : 0,
          transition: phase === 'title' ? 'opacity .3s ease' : 'opacity .12s ease',
        }}
      >
        <p
          className="text-[0.6rem] uppercase tracking-[0.5em]"
          style={{ color: 'rgba(214,67,47,.65)' }}
        >
          Arttrolley presents
        </p>
        <p
          className="mt-4 text-sm font-light uppercase tracking-[0.3em]"
          style={{ color: '#D6432F' }}
        >
          A film in one scroll
        </p>
      </div>
    </div>
  );
}
