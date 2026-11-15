# Living Human Digital Twin

A free, browser-based, interactive 3D educational prototype using Three.js. Version 0.1 includes a continuously animated stylized heart and lungs driven by a shared simulation clock.

## Requirements
- Node.js 20.19+ or 22.12+
- A WebGL-enabled modern browser

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite, usually http://localhost:5173.

## Test and build
```bash
npm test
npm run build
npm run preview
```

## Controls
- Left mouse drag: orbit
- Mouse wheel: zoom
- Right mouse drag: pan
- Click heart or lung: see information
- Use sliders to change heart rate, breaths per minute, and simulation speed
- Pause/resume, reset simulation, and reset camera

## Architecture
- `src/physiology.js`: shared simulation clock and illustrative organ timing; runs independently of camera.
- `src/scene.js`: Three.js 3D scene and animations.
- `src/main.js`: interface and animation loop.
- `src/style.css`: responsive presentation.
- `tests/physiology.test.js`: basic deterministic timing tests.

## Scientific limitations
This is an **educational visualization**, not a medically accurate physiological digital twin. The geometry is stylized. Heart contraction and breathing are timing animations, not fluid mechanics, neural signaling, oxygen exchange, or medically validated organ mechanics. Future versions can replace this with appropriately licensed anatomical assets and independently validated models.

## Pricing and licensing
No API keys or paid services. Three.js is MIT licensed. This project source is MIT licensed; see `LICENSE`. Use only assets with compatible licenses when expanding the model.
