"use client";

export type FootstepSurface = "path" | "grass" | "wood";

/**
 * Warm Lofi Jazz Chord Progression (Fmaj9 -> Em7 -> Dm9 -> Cmaj9) in Hz
 */
const LOFI_CHORD_PROGRESSION: number[][] = [
  [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
  [164.81, 196.0, 246.94, 293.66, 392.0], // Em7
  [146.83, 174.61, 220.0, 261.63, 329.63], // Dm9
  [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj9
];

class SanctuaryAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private vinylSource: AudioBufferSourceNode | null = null;
  private waterSource: AudioBufferSourceNode | null = null;
  private loopTimer: number | null = null;
  private stepIndex = 0;
  private isMuted = false;
  private isStarted = false;
  private stepAlternate = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.waterGain = this.ctx.createGain();

      this.masterGain.gain.value = this.isMuted ? 0 : 0.85;
      this.musicGain.gain.value = 0.24;
      this.sfxGain.gain.value = 0.45;
      this.waterGain.gain.value = 0.02;

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.waterGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public unlockAndStart(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.isStarted) return;
    this.isStarted = true;

    this.startVinylAndWaterAmbience(ctx);
    this.startLofiSequencer();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (!this.isMuted && !this.isStarted) {
      this.unlockAndStart();
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, now, 0.08);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Adjusts subtle spatial fountain/koi-pond water stream volume based on player proximity.
   */
  public updateWaterProximity(playerX: number, playerY: number): void {
    if (!this.ctx || !this.waterGain || this.isMuted) return;
    const distFountain = Math.hypot(playerX - 1210, playerY - 595);
    const distPond = Math.hypot(playerX - 2155, playerY - 675);
    const minDist = Math.min(distFountain, distPond);
    const proximity = Math.max(0, 1 - minDist / 520);
    const targetGain = 0.012 + proximity * 0.055;
    this.waterGain.gain.setTargetAtTime(
      targetGain,
      this.ctx.currentTime,
      0.15
    );
  }

  private startVinylAndWaterAmbience(ctx: AudioContext): void {
    if (!this.musicGain || !this.waterGain) return;

    // 1. Soft 4-second looping Lofi Vinyl Crackle & Warm Room Air buffer
    const bufferLen = ctx.sampleRate * 4;
    const vinylBuffer = ctx.createBuffer(1, bufferLen, ctx.sampleRate);
    const data = vinylBuffer.getChannelData(0);
    for (let i = 0; i < bufferLen; i++) {
      const dustPop = Math.random() < 0.0012 ? (Math.random() * 2 - 1) * 0.32 : 0;
      const hiss = (Math.random() * 2 - 1) * 0.018;
      data[i] = dustPop + hiss;
    }

    const vinylFilter = ctx.createBiquadFilter();
    vinylFilter.type = "bandpass";
    vinylFilter.frequency.value = 1650;
    vinylFilter.Q.value = 0.9;

    const vinylGain = ctx.createGain();
    vinylGain.gain.value = 0.22;

    this.vinylSource = ctx.createBufferSource();
    this.vinylSource.buffer = vinylBuffer;
    this.vinylSource.loop = true;
    this.vinylSource.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(this.musicGain);
    this.vinylSource.start();

    // 2. Soft looping Fountain / Pond Water Babble buffer
    const waterBuffer = ctx.createBuffer(1, bufferLen, ctx.sampleRate);
    const wData = waterBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferLen; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      const rippleMod = 0.65 + 0.35 * Math.sin((i / ctx.sampleRate) * Math.PI * 3.5);
      wData[i] = lastOut * rippleMod * 0.6;
    }

    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = "bandpass";
    waterFilter.frequency.value = 920;
    waterFilter.Q.value = 1.4;

    this.waterSource = ctx.createBufferSource();
    this.waterSource.buffer = waterBuffer;
    this.waterSource.loop = true;
    this.waterSource.connect(waterFilter);
    waterFilter.connect(this.waterGain);
    this.waterSource.start();
  }

  private startLofiSequencer(): void {
    if (this.loopTimer !== null) return;

    // 8th-note grid at ~70 BPM (428ms per 8th note, 8 steps per bar)
    const stepMs = 428;
    const tick = () => {
      if (this.ctx && !this.isMuted && this.ctx.state === "running") {
        const barStep = this.stepIndex % 8;
        const chordIdx = Math.floor(this.stepIndex / 8) % LOFI_CHORD_PROGRESSION.length;
        const chord = LOFI_CHORD_PROGRESSION[chordIdx];

        // Play warm Rhodes chord on beat 1 (barStep 0) and gentle pickup on beat 3.5 (barStep 5)
        if (barStep === 0) {
          this.triggerLofiChord(chord, 2.9, 0.14);
          this.triggerWarmBass(chord[0] * 0.5, 1.8);
        } else if (barStep === 5) {
          this.triggerLofiChord(chord.slice(1), 1.1, 0.08);
        }

        // Gentle pentatonic bell/kalimba melody note on select off-beats
        if (barStep === 2 || barStep === 6) {
          const melodyNote = chord[(barStep + chordIdx) % chord.length] * 2;
          if (Math.random() < 0.68) {
            this.triggerMelodyPluck(melodyNote, 0.065);
          }
        }

        // Soft Lofi Boom-Bap pulse: Kick on 0 & 5, Brushed Snare on 2 & 6, Shaker on odd steps
        if (barStep === 0 || barStep === 5) {
          this.triggerLofiKick();
        }
        if (barStep === 2 || barStep === 6) {
          this.triggerBrushedSnare();
        }
        if (barStep % 2 === 1) {
          this.triggerSoftHat();
        }
      }
      this.stepIndex += 1;
    };

    tick();
    this.loopTimer = window.setInterval(tick, stepMs);
  }

  private triggerLofiChord(
    freqs: number[],
    durationSec: number,
    peakGain: number
  ): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(760, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + durationSec);

    const chordGain = this.ctx.createGain();
    chordGain.gain.setValueAtTime(0.0001, now);
    chordGain.gain.linearRampToValueAtTime(peakGain, now + 0.06);
    chordGain.gain.exponentialRampToValueAtTime(0.0008, now + durationSec);

    filter.connect(chordGain);
    chordGain.connect(this.musicGain);

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const detuneSign = idx % 2 === 0 ? 1 : -1;
      osc.type = idx === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      // Subtle lofi tape warble detune
      osc.detune.setValueAtTime(detuneSign * 4.5, now);
      osc.detune.linearRampToValueAtTime(-detuneSign * 4.5, now + durationSec);

      const noteStart = now + idx * 0.018; // Softly strummed arpeggio feel
      osc.connect(filter);
      osc.start(noteStart);
      osc.stop(now + durationSec + 0.05);
    });
  }

  private triggerWarmBass(freq: number, durationSec: number): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + durationSec + 0.04);
  }

  private triggerMelodyPluck(freq: number, peakGain: number): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.65);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.68);
  }

  private triggerLofiKick(): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(112, now);
    osc.frequency.exponentialRampToValueAtTime(44, now + 0.14);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private triggerBrushedSnare(): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.09);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1150;
    filter.Q.value = 0.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    src.start(now);
  }

  private triggerSoftHat(): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.045);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.28));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 4200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    src.start(now);
  }

  /**
   * Plays a cozy terrain-aware footstep synchronized to the 140ms walk cycle.
   */
  public playFootstep(surface: FootstepSurface = "path"): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    this.stepAlternate = !this.stepAlternate;
    const pitchJitter = (this.stepAlternate ? 1.04 : 0.96) + (Math.random() - 0.5) * 0.05;
    const now = ctx.currentTime;

    // 1. Soft low-end footfall thud
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = surface === "wood" ? "triangle" : "sine";

    const startFreq =
      surface === "wood"
        ? 195 * pitchJitter
        : surface === "path"
          ? 145 * pitchJitter
          : 115 * pitchJitter;
    const endFreq = surface === "wood" ? 88 : 52;

    thudOsc.frequency.setValueAtTime(startFreq, now);
    thudOsc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.055);

    thudGain.gain.setValueAtTime(surface === "grass" ? 0.12 : 0.19, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    thudOsc.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.07);

    // 2. Surface texture grain (dirt crunch / grass swish / wood tap)
    const grainDuration = surface === "grass" ? 0.075 : 0.05;
    const len = Math.floor(ctx.sampleRate * grainDuration);
    const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value =
      surface === "grass"
        ? 1850 * pitchJitter
        : surface === "wood"
          ? 680 * pitchJitter
          : 1120 * pitchJitter;
    filter.Q.value = surface === "wood" ? 2.2 : 1.1;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(surface === "grass" ? 0.09 : 0.11, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + grainDuration);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noiseSrc.start(now);
  }

  /**
   * Plays a warm two-note wooden kalimba chime when opening a station or signpost.
   */
  public playZoneChime(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.isMuted) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25]; // C5 -> E5
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.075;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.36);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.38);
    });
  }
}

export const sanctuaryAudio = new SanctuaryAudioEngine();
