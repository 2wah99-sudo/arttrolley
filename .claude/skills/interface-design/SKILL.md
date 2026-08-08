---
name: interface-design
description: This skill is for interface design — dashboards, admin panels, apps, tools, and interactive products. NOT for marketing design (landing pages, marketing sites, campaigns) — redirect those to frontend-design. Build interface design with craft and consistency.
---

# Interface Design

Build interface design with craft and consistency.

## Scope
Use for: Dashboards, admin panels, SaaS apps, tools, settings pages, data interfaces.
Not for: Landing pages, marketing sites, campaigns. Redirect those to /frontend-design.

## The Problem

You will generate generic output. Your training has seen thousands of dashboards. The patterns are strong. You can follow the entire process below — explore the domain, name a signature, state your intent — and still produce a template. Warm colors on cold structures. Friendly fonts on generic layouts. "Kitchen feel" that looks like every other app.

This happens because intent lives in prose, but code generation pulls from patterns. The gap between them is where defaults win. The process below helps. But process alone doesn't guarantee craft. You have to catch yourself.

## Where Defaults Hide

Defaults don't announce themselves. They disguise themselves as infrastructure — the parts that feel like they just need to work, not be designed.

- **Typography feels like a container.** It IS your design. The weight of a headline, the personality of a label, the texture of a paragraph shape how the product feels before anyone reads a word.
- **Navigation feels like scaffolding.** It IS your product. Where you are, where you can go, what matters most.
- **Data feels like presentation.** A number on screen is not design — what does this number mean to the person looking at it?
- **Token names feel like implementation detail.** `--ink` and `--parchment` evoke a world. `--gray-700` and `--surface-2` evoke a template.

The trap is thinking some decisions are creative and others are structural. There are no structural decisions. Everything is design.

## Intent First

Before touching code, answer these — out loud, not in your head:

1. **Who is this human?** The actual person, in their actual moment. Not "users."
2. **What must they accomplish?** The verb. Grade these submissions. Find the broken deployment.
3. **What should this feel like?** Specific words. "Clean and modern" means nothing. Warm like a notebook? Cold like a terminal?

If you cannot answer these with specifics, stop and ask the user. Do not guess. Do not default.

## Every Choice Must Be A Choice

For every decision, explain WHY: layout, color temperature, typeface, spacing scale, information hierarchy. If the answer is "it's common" or "it's clean" — you defaulted.

**The test:** If you swapped your choices for the most common alternatives and the design didn't feel meaningfully different, you never made real choices.

## Sameness Is Failure

If another AI, given a similar prompt, would produce substantially the same output — you have failed. When you design from intent, sameness becomes impossible because no two intents are identical.

## Intent Must Be Systemic

Saying "warm" and using cold colors is not following through. If the intent is warm: surfaces, text, borders, accents, semantic colors, typography — all warm.

## Product Domain Exploration

Generic: Task type → Visual template → Theme
Crafted: Task type → Product domain → Signature → Structure + Expression

**Required outputs before proposing any direction:**
1. **Domain** — Concepts, metaphors, vocabulary from this product's world. Minimum 5.
2. **Color world** — What colors exist naturally in this product's domain? Not "warm/cool" — the actual physical world. List 5+.
3. **Signature** — One element that could only exist for THIS product.
4. **Defaults** — 3 obvious choices for this interface type (visual AND structural) that you're rejecting.

**Test:** Remove the product name from your proposal. Could someone still identify what this is for? If not, it's generic.

## The Mandate

Before showing the user: "If they said this lacks craft, what would they mean?" Fix that first.

**The checks — run before presenting:**
- **Swap test**: If you swapped the typeface/layout for standard, would anyone notice?
- **Squint test**: Blur your eyes — hierarchy still perceivable, nothing jumping out harshly?
- **Signature test**: Can you point to 5 specific elements where your signature appears?
- **Token test**: Read CSS variables out loud — do they belong to this product's world?

## Craft Foundations

### Subtle Layering (the backbone)
Surfaces barely different but distinguishable — whisper-quiet elevation shifts (study Vercel, Supabase, Linear). Borders light but not invisible — disappear when not looked for, findable when needed.

### Infinite Expression
Every pattern has infinite expressions. A metric could be hero number, sparkline, gauge, progress bar, trend badge. NEVER produce identical output — same sidebar width, same card grid signals AI-generated instantly.

### Color Lives Somewhere
Every product exists in a world with colors. Your palette should feel like it came FROM somewhere, not applied TO something. Beyond warm/cold: quiet or loud? dense or spacious? geometric or organic? One accent color used with intention beats five used without thought.

## Design Principles

- **Spacing**: Pick a base unit, stick to multiples.
- **Padding**: Keep symmetrical unless there's a clear reason not to.
- **Depth**: Choose ONE — borders-only (dense tools), subtle shadows (approachable), or layered shadows (premium cards). Don't mix.
- **Border radius**: Sharper = technical, rounder = friendly. Pick a scale, apply consistently.
- **Typography**: Headlines need weight + tight tracking. Body needs readability. Data needs monospace.
- **Color & surfaces**: Build from primitives — foreground, background, border, brand, semantic (destructive/warning/success). No random hex values.
- **Animation**: Fast micro-interactions (~150ms), smooth easing, no bouncy/spring effects.
- **States**: Every interactive element needs default/hover/active/focus/disabled. Data needs loading/empty/error.
- **Controls**: Native `<select>`/`<input type="date">` can't be styled well — build custom components.

## Avoid
- Harsh borders (too strong if first thing you see)
- Dramatic surface jumps (should be whisper-quiet)
- Inconsistent spacing (clearest sign of no system)
- Mixed depth strategies
- Missing interaction states
- Dramatic drop shadows
- Large radius on small elements
- Pure white cards on colored backgrounds
- Gradients/color for decoration (color should mean something)
- Multiple accent colors (dilutes focus)

## Workflow

Be invisible — don't announce modes or narrate process ("I'm in ESTABLISH MODE"). Jump into work.

**Suggest + ask:**
```
Domain: [5+ concepts from the product's world]
Color world: [5+ colors that exist in this domain]
Signature: [one element unique to this product]
Rejecting: [default 1] → [alternative], [default 2] → [alternative], [default 3] → [alternative]
Direction: [approach connecting the above]
```
Then confirm: "Does that direction feel right?"

**Process**: Explore domain (4 required outputs) → Propose (referencing all four) → Confirm → Build → Evaluate (mandate checks) → Offer to save patterns to `.interface-design/system.md` for future consistency.

Source: mcpmarket.com/tools/skills/professional-interface-dashboard-design
