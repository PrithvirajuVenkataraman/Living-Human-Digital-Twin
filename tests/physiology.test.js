import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation } from '../src/physiology.js';

test('shared clock updates both organ phases', () => {
  const s = createSimulation();
  const result = s.tick(0.1);
  assert.ok(Math.abs(result.time - 0.1) < 1e-8);
  assert.ok(Math.abs(result.heartPhase - 0.12) < 1e-8);
  assert.ok(Math.abs(result.breathPhase - 14 / 600) < 1e-8);
});
test('pause freezes simulation time', () => {
  const s = createSimulation();
  s.tick(0.1);
  s.state.paused = true;
  assert.equal(s.tick(0.1).time, 0.1);
});
test('speed scales the shared clock', () => {
  const s = createSimulation({ speed: 2 });
  assert.equal(s.tick(0.1).time, 0.2);
});
test('reset restores defaults', () => {
  const s = createSimulation();
  s.state.heartRate = 120;
  s.tick(0.1);
  s.reset();
  assert.equal(s.state.heartRate, 72);
  assert.equal(s.state.time, 0);
});
