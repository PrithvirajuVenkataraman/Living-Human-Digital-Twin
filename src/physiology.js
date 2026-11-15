// Educational timing model, not a diagnostic or clinically validated simulator.
export const DEFAULTS = Object.freeze({ heartRate: 72, breathingRate: 14, speed: 1 });

export function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

export function createSimulation(initial = {}) {
  const state = {
    time: 0,
    paused: false,
    heartRate: DEFAULTS.heartRate,
    breathingRate: DEFAULTS.breathingRate,
    speed: DEFAULTS.speed,
    ...initial,
  };

  return {
    state,
    tick(realSeconds) {
      if (!state.paused) {
        // Cap catch-up after an inactive tab. Avoid dramatic phase jumps.
        state.time += clamp(realSeconds, 0, 0.1) * state.speed;
      }
      return this.snapshot();
    },
    snapshot() {
      const heartPhase = (state.time * state.heartRate / 60) % 1;
      const breathPhase = (state.time * state.breathingRate / 60) % 1;
      // Fast contraction near beat start, followed by slower relaxation.
      const systole = Math.exp(-Math.pow((heartPhase - 0.14) / 0.115, 2));
      const contraction = 0.035 * systole;
      const inhalation = 0.5 - 0.5 * Math.cos(2 * Math.PI * breathPhase);
      return { time: state.time, heartPhase, breathPhase, contraction, inhalation, ...state };
    },
    reset() {
      Object.assign(state, { time: 0, paused: false, ...DEFAULTS });
    },
  };
}
