import './style.css';
import { createSimulation } from './physiology.js';
import { createAnatomyScene } from './scene.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="layout">
    <header class="topbar"><div><span class="eyebrow">OPEN SOURCE · PHYSIOLOGY LAB</span><h1>Living Human <span>Digital Twin</span></h1><p>Autonomous heart and lung exploration · v0.1</p></div><div class="live"><span class="dot"></span> EDUCATIONAL SIMULATION</div></header>
    <section class="workspace">
      <div class="viewport"><canvas id="scene" aria-label="Interactive 3D heart and lung model"></canvas><div class="scene-hint">DRAG TO ORBIT · SCROLL TO ZOOM · RIGHT DRAG TO PAN · CLICK AN ORGAN</div><div class="organ-info" id="organ-info">Select the heart or a lung to inspect it.</div></div>
      <aside class="panel">
        <h2>Simulation control</h2>
        <div class="metrics"><div class="metric"><span>HEART RATE</span><strong><span id="heart-value">72</span> <small>BPM</small></strong></div><div class="metric"><span>BREATHING RATE</span><strong><span id="breath-value">14</span> <small>/min</small></strong></div></div>
        <label for="heart">Heart rate <output id="heart-output">72 BPM</output></label><input id="heart" type="range" min="40" max="150" step="1" value="72" />
        <label for="breath">Breathing rate <output id="breath-output">14 /min</output></label><input id="breath" type="range" min="6" max="30" step="1" value="14" />
        <label for="speed">Simulation speed <output id="speed-output">1.0×</output></label><input id="speed" type="range" min="0.25" max="3" step="0.25" value="1" />
        <div class="actions"><button id="pause">Pause</button><button id="reset">Reset</button><button id="camera">Reset camera</button></div>
        <div class="timing"><span>SIMULATED TIME</span><strong id="time">00:00.0</strong><span>HEART CYCLE</span><div class="track"><div id="beat-progress"></div></div><span>BREATH CYCLE</span><div class="track"><div id="breath-progress"></div></div></div>
        <p class="disclaimer">This prototype uses simplified organ shapes and timing-based animation. It does not calculate real blood pressure, gas exchange, or clinical outcomes.</p>
      </aside>
    </section>
  </main>`;

const simulation = createSimulation();
const anatomy = createAnatomyScene(document.querySelector('#scene'));
const $ = id => document.getElementById(id);

function connectSlider(id, stateKey, formatter) {
  $(id).addEventListener('input', event => {
    simulation.state[stateKey] = Number(event.target.value);
    $(`${id}-output`).textContent = formatter(simulation.state[stateKey]);
  });
}
connectSlider('heart', 'heartRate', value => `${value} BPM`);
connectSlider('breath', 'breathingRate', value => `${value} /min`);
connectSlider('speed', 'speed', value => `${value.toFixed(2)}×`);

$('pause').addEventListener('click', () => {
  simulation.state.paused = !simulation.state.paused;
  $('pause').textContent = simulation.state.paused ? 'Resume' : 'Pause';
});
$('reset').addEventListener('click', () => {
  simulation.reset();
  for (const [id, value] of [['heart', 72], ['breath', 14], ['speed', 1]]) {
    $(id).value = value;
    $(id).dispatchEvent(new Event('input'));
  }
  $('pause').textContent = 'Pause';
});
$('camera').addEventListener('click', () => anatomy.resetCamera());
$('scene').addEventListener('click', event => {
  const organ = anatomy.pick(event.clientX, event.clientY);
  $('organ-info').textContent = organ === 'Heart'
    ? 'Heart · stylized contraction model. Four-chamber flow is planned.'
    : organ === 'Lungs'
      ? 'Lungs · synchronized breathing animation. Gas exchange is planned.'
      : 'Select the heart or a lung to inspect it.';
});

let previous = performance.now();
let frame = 0;
function animate(now) {
  const snapshot = simulation.tick((now - previous) / 1000);
  previous = now;
  anatomy.render(snapshot);
  // Throttle DOM updates, but update the model every animation frame.
  if (frame++ % 4 === 0) {
    $('heart-value').textContent = snapshot.heartRate;
    $('breath-value').textContent = snapshot.breathingRate;
    $('time').textContent = `${String(Math.floor(snapshot.time / 60)).padStart(2, '0')}:${String(Math.floor(snapshot.time % 60)).padStart(2, '0')}.${Math.floor((snapshot.time % 1) * 10)}`;
    $('beat-progress').style.width = `${snapshot.heartPhase * 100}%`;
    $('breath-progress').style.width = `${snapshot.breathPhase * 100}%`;
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
