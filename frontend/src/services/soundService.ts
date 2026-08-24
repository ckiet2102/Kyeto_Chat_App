// Web Audio API Ringtone Synthesizer for Kyeto Chat Call Sounds

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentType: "dialing" | "incoming" | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGainNodes: GainNode[] = [];
  private loopTimer: any = null;

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  // Play Dialing Tone (Caller Side: Tiếng tút chờ gọi đi)
  public playDialingTone() {
    if (this.isPlaying && this.currentType === "dialing") return;
    this.stopSound();
    this.initAudioContext();
    if (!this.audioCtx) return;

    this.isPlaying = true;
    this.currentType = "dialing";

    const triggerDialingBeep = () => {
      if (!this.isPlaying || !this.audioCtx || this.currentType !== "dialing") return;

      try {
        const now = this.audioCtx.currentTime;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        // Standard US/EU Dialing Tone (440Hz + 480Hz)
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, now);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(480, now);

        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);

        this.activeOscillators = [osc1, osc2];
        this.activeGainNodes = [gainNode];
      } catch (e) {
        console.warn("Dialing sound error:", e);
      }
    };

    triggerDialingBeep();
    this.loopTimer = setInterval(triggerDialingBeep, 3000);
  }

  // Play Incoming Ringtone (Receiver Side: Tiếng chuông reo cuộc gọi đến)
  public playIncomingRingtone() {
    if (this.isPlaying && this.currentType === "incoming") return;
    this.stopSound();
    this.initAudioContext();
    if (!this.audioCtx) return;

    this.isPlaying = true;
    this.currentType = "incoming";

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 Harmonic Chime

    const triggerIncomingChime = () => {
      if (!this.isPlaying || !this.audioCtx || this.currentType !== "incoming") return;

      try {
        const now = this.audioCtx.currentTime;
        notes.forEach((freq, idx) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gainNode = this.audioCtx.createGain();

          const noteStartTime = now + idx * 0.15;
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, noteStartTime);

          gainNode.gain.setValueAtTime(0.12, noteStartTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, noteStartTime + 0.4);

          osc.connect(gainNode);
          gainNode.connect(this.audioCtx.destination);

          osc.start(noteStartTime);
          osc.stop(noteStartTime + 0.4);
        });
      } catch (e) {
        console.warn("Incoming ringtone sound error:", e);
      }
    };

    triggerIncomingChime();
    this.loopTimer = setInterval(triggerIncomingChime, 1600);
  }

  // Stop any active call sound
  public stopSound() {
    this.isPlaying = false;
    this.currentType = null;

    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }

    try {
      this.activeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.activeGainNodes.forEach((g) => {
        try {
          g.disconnect();
        } catch {}
      });
    } catch {}

    this.activeOscillators = [];
    this.activeGainNodes = [];
  }
}

export const soundService = new SoundService();
