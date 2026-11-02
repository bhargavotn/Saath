# Saath asset and design guide

## Included assets

- `public/courtyard.png`: original AI-generated editorial courtyard illustration, included in the source for direct use. No external image service or hotlink required.
- `public/favicon.svg`: editable connected-form Saath brand mark.
- Interface icons: `lucide-react`, installed with the project.
- Ambient sounds: synthesized locally in the browser through Web Audio; no third-party audio download or streaming account required. See `AUDIO.md`.

## Visual direction

Warm ivory canvas, deep forest green text and controls, sage surfaces, muted terracotta emphasis. Use generous whitespace, rounded architectural imagery, readable body text, and serif headlines. Keep motion restrained; respect system reduced-motion preferences. Layouts adapt to narrow screens.

## Editing in Cursor

Edit `app/page.tsx` for views and interactions and `app/globals.css` for the design system. Swap the courtyard asset by placing a new image in `public/` and updating its reference. Edit `components/AmbientSound.tsx` for sound controls. Keep API calls in route handlers under `app/api/`; never embed credentials in the frontend.

## Audio expectations

Sound is an optional listening preference. It does not measure brain activity, entrain brainwaves, or provide treatment. Stereo tones create different left/right pitches; their difference is not a direct measurement or control of a person's brain frequency. All sound begins only after user action and can be paused or muted. Choose a comfortable volume and turn it off whenever distracting.

## Dedicated visual set

- `public/assets/saath-garden-hero.png`: airy garden courtyard for background and hero use.
- `public/assets/saath-rehearsal.png`: two-chair room for rehearsal introductions.
- `public/assets/saath-circles.png`: small seating circle for group discovery.

All three are original AI-generated illustrations. Review and download them individually at `/studio`. Production layouts should keep text on a solid reading surface and use responsive image crops without stretching. Voice/provider selection and test protocol are in `VOICE_SELECTION.md`.
