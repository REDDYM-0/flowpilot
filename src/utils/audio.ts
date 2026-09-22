// Web Audio API Focus Sound & Chime Generator

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentType: string = 'none';

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playSound(type: 'white' | 'rain' | 'binaural' | 'waves' | 'none', volume: number = 0.25) {
    this.stop();
    if (type === 'none') {
      this.currentType = 'none';
      return;
    }

    try {
      const ctx = this.getContext();
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      this.gainNode.connect(ctx.destination);

      if (type === 'white' || type === 'rain') {
        // Generate noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'rain') {
            // Pink / Brown filter for soft rain
            output[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          } else {
            output[i] = white * 0.15;
          }
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        if (type === 'rain') {
          // Lowpass filter for smooth rainfall
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, ctx.currentTime);
          whiteNoise.connect(filter);
          filter.connect(this.gainNode);
        } else {
          whiteNoise.connect(this.gainNode);
        }

        whiteNoise.start();
        this.currentSource = whiteNoise;
      } else if (type === 'binaural') {
        // 40Hz Gamma Binaural Beat (200Hz Left, 240Hz Right)
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(200, ctx.currentTime);

        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(240, ctx.currentTime);

        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(this.gainNode);

        oscL.start();
        oscR.start();
        this.currentSource = merger;
      } else if (type === 'waves') {
        // Low oceanic drone with LFO filter
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second wave cycle

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.15, ctx.currentTime);

        lfo.connect(this.gainNode.gain);
        osc.connect(this.gainNode);

        osc.start();
        lfo.start();
        this.currentSource = osc;
      }

      this.isPlaying = true;
      this.currentType = type;
    } catch (e) {
      console.warn('Audio play failed or was blocked by browser autoplay policy:', e);
    }
  }

  public stop() {
    if (this.currentSource) {
      try {
        if ('stop' in this.currentSource) {
          (this.currentSource as any).stop();
        }
        this.currentSource.disconnect();
      } catch {
        // ignore
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.currentType = 'none';
  }

  public playCompletionChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.9);
      });
    } catch {
      // ignore
    }
  }

  public getStatus() {
    return { isPlaying: this.isPlaying, currentType: this.currentType };
  }
}

export const soundEngine = new AmbientSoundEngine();
