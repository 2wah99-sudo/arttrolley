---
name: gsap-animation-expert
description: Expert knowledge for GSAP (GreenSock Animation Platform) - the industry-standard JavaScript animation library for professional-grade animations with precise timeline control. Activate when the user mentions "GSAP", "GreenSock", "timeline animations", scroll-triggered animations, SVG morphing, or complex animation sequences.
---

# GSAP Skill

Expert knowledge for GSAP (GreenSock Animation Platform) - the industry-standard JavaScript animation library for professional-grade animations with precise timeline control.

## When to Use

Activate this skill when:
- User mentions "GSAP", "GreenSock", or "timeline animations"
- Need frame-perfect, complex animation sequences
- Building scroll-triggered animations with ScrollTrigger
- Animating SVG paths or morphing shapes
- Require fine-grained control over animation timing
- Working with canvas or WebGL animations

## Installation

```bash
# Core library
npm install gsap

# With React integration
npm install gsap @gsap/react

# Specific plugins (if needed)
npm install gsap/ScrollTrigger
```

## Core Concepts

### Basic Tweens

```javascript
import gsap from 'gsap';

gsap.to('.element', { x: 100, opacity: 1, duration: 1, ease: 'power2.out' });
gsap.from('.element', { x: -100, opacity: 0, duration: 1 });
gsap.fromTo('.element', { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 1 });
gsap.set('.element', { x: 0, opacity: 1 });
```

### Timelines

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.out' } });

tl.to('.header', { y: 0, opacity: 1 })
  .to('.nav-item', { y: 0, opacity: 1, stagger: 0.1 }, '-=0.3')
  .to('.content', { y: 0, opacity: 1 }, '<0.2')
  .to('.footer', { y: 0, opacity: 1 }, '>-0.1');
```

### Position Parameters

```javascript
tl.to(el, { x: 100 })            // End of timeline
  .to(el, { y: 100 }, '+=0.5')   // 0.5s gap after previous
  .to(el, { z: 100 }, '-=0.25')  // 0.25s overlap
  .to(el, { rotation: 90 }, '<') // Same time as previous
  .to(el, { scale: 2 }, '<0.5')  // 0.5s after previous starts
  .to(el, { opacity: 0 }, 2)     // Absolute time: 2s from start
  .to(el, { color: 'red' }, 'myLabel')
  .to(el, { width: 200 }, 'myLabel+=1');
```

## React Integration

### useGSAP Hook

```jsx
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

function Component() {
  const containerRef = useRef(null);
  useGSAP(() => {
    gsap.to('.box', { x: 200, rotation: 360, duration: 2, ease: 'elastic.out(1, 0.3)' });
  }, { scope: containerRef });
  return <div ref={containerRef}><div className="box">Animated</div></div>;
}
```

### Manual Cleanup Pattern

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(elementRef.current, { x: 100, duration: 1 });
  });
  return () => ctx.revert();
}, []);
```

## ScrollTrigger

```javascript
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

gsap.to('.element', {
  x: 500,
  scrollTrigger: {
    trigger: '.element',
    start: 'top 80%',
    end: 'bottom 20%',
    scrub: true,
    markers: true, // dev only
  },
});

const tl = gsap.timeline({
  scrollTrigger: { trigger: '.section', start: 'top top', end: '+=300%', scrub: 1, pin: true, anticipatePin: 1 },
});
tl.to('.panel-1', { xPercent: -100 }).to('.panel-2', { xPercent: -100 }).to('.panel-3', { xPercent: -100 });
```

## Easing Functions

```
'none'                  linear
'power1.out'            subtle ease out
'power2.inOut'          moderate ease in-out
'power3.out'            strong ease out
'power4.in'             very strong ease in
'back.out(1.7)'         overshoot
'elastic.out(1, 0.3)'   bouncy spring
'bounce.out'            bounce
'circ.out'              circular
'expo.out'              exponential
'sine.inOut'            sine wave
```

## Stagger Animations

```javascript
gsap.to('.item', { y: 0, opacity: 1, stagger: 0.1 });

gsap.to('.grid-item', {
  scale: 1, opacity: 1,
  stagger: { amount: 1, from: 'center', grid: [5, 5], ease: 'power2.out', axis: 'x' },
});

gsap.to('.item', { y: 0, stagger: (index) => index * 0.1 + Math.random() * 0.1 });
```

## Animation Properties

```javascript
{
  x: 100, y: 100, xPercent: -50, yPercent: -50,
  rotation: 360, rotationX: 45, rotationY: 45,
  scale: 1.5, scaleX: 2, scaleY: 2, skewX: 45, skewY: 45,
  transformOrigin: '50% 50%', transformPerspective: 1000,
}
{
  autoAlpha: 1, immediateRender: false, overwrite: 'auto',
  repeat: -1, repeatDelay: 0.5, yoyo: true, reversed: true, paused: true,
}
```

## Common Patterns

### Reveal on Scroll

```javascript
gsap.utils.toArray('.reveal').forEach((element) => {
  gsap.from(element, {
    y: 60, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: element, start: 'top 85%', toggleActions: 'play none none reverse' },
  });
});
```

### Horizontal Scroll Section

```javascript
const sections = gsap.utils.toArray('.panel');
const totalWidth = sections.length * window.innerWidth;
gsap.to(sections, {
  xPercent: -100 * (sections.length - 1),
  ease: 'none',
  scrollTrigger: { trigger: '.container', pin: true, scrub: 1, snap: 1 / (sections.length - 1), end: () => '+=' + totalWidth },
});
```

### Text Split Animation

```javascript
const chars = text.split('');
element.innerHTML = chars.map(c => `<span class="char">${c}</span>`).join('');
gsap.from('.char', { opacity: 0, y: 50, rotateX: -90, stagger: 0.02, duration: 0.5, ease: 'back.out(1.7)' });
```

## Examples

**Scroll-reveal cards:**
```jsx
gsap.registerPlugin(ScrollTrigger);
function CardSection() {
  const containerRef = useRef(null);
  useGSAP(() => {
    gsap.from('.card', {
      y: 80, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15,
      scrollTrigger: { trigger: '.cards-container', start: 'top 75%' },
    });
  }, { scope: containerRef });
  return <div ref={containerRef}>{cards.map(card => <div className="card" key={card.id}>{card.content}</div>)}</div>;
}
```

**Logo reveal timeline:**
```javascript
const logoAnimation = gsap.timeline({ paused: true });
logoAnimation
  .from('.logo-icon', { scale: 0, rotation: -180, duration: 0.6, ease: 'back.out(1.7)' })
  .from('.logo-text span', { opacity: 0, y: 30, stagger: 0.05, duration: 0.4, ease: 'power2.out' }, '-=0.2')
  .from('.tagline', { opacity: 0, y: 20, duration: 0.4 }, '-=0.1');
logoAnimation.play();
```

## Resources
- GSAP Documentation: https://gsap.com/docs/v3/
- GSAP Cheatsheet: https://gsap.com/cheatsheet/

Source: mcpmarket.com/tools/skills/gsap-animation-expert (Brookside BI, React Animation Studio)
