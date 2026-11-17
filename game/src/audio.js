export function createAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = AudioContext ? new AudioContext() : null;
  if (!context) return { resume() {}, update() {}, gunshot() {}, pickup() {}, mission() {} };
  const master = context.createGain();
  master.gain.value = 0.13;
  master.connect(context.destination);
  const engine = context.createOscillator();
  const engineGain = context.createGain();
  engine.type = 'sawtooth';
  engine.frequency.value = 42;
  engineGain.gain.value = 0;
  engine.connect(engineGain).connect(master);
  engine.start();
  let sirenTimer = 0;
  let sirenTone = null;
  function tone(frequency, duration, type = 'sine', volume = 0.16, endFrequency = frequency) {
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + duration);
  }
  return {
    resume() { if (context.state === 'suspended') context.resume(); },
    update(dt, driving, wanted) {
      engineGain.gain.setTargetAtTime(driving ? 0.055 : 0, context.currentTime, 0.08);
      if (driving) engine.frequency.setTargetAtTime(45 + Math.min(90, driving * 0.42), context.currentTime, 0.06);
      if (wanted > 0) {
        sirenTimer -= dt;
        if (sirenTimer <= 0) {
          sirenTimer = 0.48;
          sirenTone = sirenTone === 680 ? 920 : 680;
          tone(sirenTone, 0.42, 'square', 0.045, sirenTone);
        }
      } else sirenTimer = 0;
    },
    gunshot() {
      const now = context.currentTime;
      const buffer = context.createBuffer(1, context.sampleRate * 0.11, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = 0.34;
      source.connect(gain).connect(master);
      source.start(now);
      tone(125, 0.12, 'triangle', 0.08, 46);
    },
    pickup() { tone(620, 0.16, 'sine', 0.12, 1040); },
    mission() {
      tone(510, 0.2, 'triangle', 0.14);
      window.setTimeout(() => tone(690, 0.24, 'triangle', 0.13), 110);
      window.setTimeout(() => tone(880, 0.34, 'triangle', 0.12), 230);
    },
  };
}
