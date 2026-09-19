/** Fanfare originale — pas le thème Star Wars (protégé). */

export function playOuvertureGalactique(): () => void {
  const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return () => undefined;

  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0.22;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.ratio.value = 4;
  master.connect(compressor);
  compressor.connect(ctx.destination);

  const t0 = ctx.currentTime;

  function note(freq: number, start: number, dur: number, vol = 0.11, type: OscillatorType = "sawtooth") {
    const osc = ctx.createOscillator();
    const fifth = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = type;
    fifth.type = "triangle";
    osc.frequency.value = freq;
    fifth.frequency.value = freq * 2;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, t0 + start);
    filter.frequency.linearRampToValueAtTime(1600, t0 + start + dur * 0.4);
    gain.gain.setValueAtTime(0.0001, t0 + start);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
    osc.connect(filter);
    fifth.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(t0 + start);
    fifth.start(t0 + start);
    osc.stop(t0 + start + dur + 0.02);
    fifth.stop(t0 + start + dur + 0.02);
  }

  function drone(freq: number, start: number, dur: number, vol = 0.05) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + start);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + start + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur + 0.02);
  }

  drone(55, 0, 18, 0.06);
  drone(82.4, 0.2, 16, 0.03);

  note(164.81, 0.15, 1.1, 0.09);
  note(220.0, 0.55, 1.0, 0.1);
  note(261.63, 1.05, 1.2, 0.12);
  note(329.63, 1.7, 1.6, 0.13);
  note(220.0, 2.6, 0.7, 0.09);
  note(293.66, 3.15, 0.8, 0.11);
  note(349.23, 3.8, 1.4, 0.13);
  note(440.0, 5.0, 2.2, 0.14);
  note(329.63, 6.6, 1.2, 0.1);
  note(392.0, 7.5, 1.4, 0.12);
  note(523.25, 8.6, 2.8, 0.13);

  note(174.61, 11.2, 1.3, 0.1);
  note(233.08, 12.0, 1.3, 0.11);
  note(349.23, 12.9, 2.0, 0.12);
  note(440.0, 14.6, 3.4, 0.13);

  void ctx.resume();

  return () => {
    try {
      master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    } catch {
      master.gain.value = 0;
    }
    window.setTimeout(() => {
      void ctx.close();
    }, 400);
  };
}
