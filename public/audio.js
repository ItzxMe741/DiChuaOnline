// Web Audio API Synthesizer for Authentic Buddhist Temple Sounds
// Tạo âm thanh chuông đại hồng chung, mõ gỗ, chuông gia trì và nhạc thiền không phụ thuộc file mạng

class TempleAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.isAmbientPlaying = false;
        this.ambientInterval = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            this.ambientGain.connect(this.masterGain);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 🔔 Thỉnh Đại Hồng Chung (Đại Chuông Chùa ngân vang trầm ấm)
    playGreatBell() {
        this.init();
        const now = this.ctx.currentTime;
        
        // Frequencies for a rich, resonant Buddhist bronze bell
        const freqs = [130, 260, 368, 520, 780, 1040, 1560];
        const decays = [5.5, 4.5, 3.8, 3.0, 2.2, 1.5, 0.8];
        const gains = [0.6, 0.45, 0.35, 0.25, 0.15, 0.1, 0.05];

        // Strike impulse (cú gõ vồ chuông)
        const strikeBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const data = strikeBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.01));
        }
        const strikeSource = this.ctx.createBufferSource();
        strikeSource.buffer = strikeBuffer;
        
        const strikeFilter = this.ctx.createBiquadFilter();
        strikeFilter.type = "lowpass";
        strikeFilter.frequency.setValueAtTime(300, now);
        
        const strikeGain = this.ctx.createGain();
        strikeGain.gain.setValueAtTime(0.5, now);
        strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        strikeSource.connect(strikeFilter);
        strikeFilter.connect(strikeGain);
        strikeGain.connect(this.masterGain);
        strikeSource.start(now);

        // Harmonic partials
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            
            // Add subtle beating/tremolo for bronze vibration
            osc.type = idx === 0 ? "sine" : (idx % 2 === 0 ? "triangle" : "sine");
            osc.frequency.setValueAtTime(freq + (Math.random() * 2 - 1), now);

            gainNode.gain.setValueAtTime(gains[idx], now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + decays[idx] + 0.1);
        });
    }

    // 🔔 Chuông gia trì / Tiếng khánh nhỏ trên bàn thờ
    playSmallBell() {
        this.init();
        const now = this.ctx.currentTime;
        const freqs = [880, 1320, 2200, 3520];
        const gains = [0.4, 0.25, 0.15, 0.08];

        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(f, now);

            g.gain.setValueAtTime(gains[i], now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + (3.0 - i * 0.5));

            osc.connect(g);
            g.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 3.1);
        });
    }

    // 🪵 Tiếng Gõ Mõ Gỗ (Hollow Wooden Fish)
    playWoodenFish() {
        this.init();
        const now = this.ctx.currentTime;

        // Wood resonance oscillator (thân mõ gỗ gụ/gỗ mít)
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

        // Click transient
        const clickOsc = this.ctx.createOscillator();
        clickOsc.type = "triangle";
        clickOsc.frequency.setValueAtTime(1200, now);
        clickOsc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        const clickGain = this.ctx.createGain();
        clickGain.gain.setValueAtTime(0.5, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        // Bandpass filter for hollow wooden tone
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(520, now);
        filter.Q.setValueAtTime(3.5, now);

        osc.connect(oscGain);
        clickOsc.connect(clickGain);
        oscGain.connect(filter);
        clickGain.connect(filter);
        filter.connect(this.masterGain);

        osc.start(now);
        clickOsc.start(now);
        osc.stop(now + 0.15);
        clickOsc.stop(now + 0.05);
    }

    // 📿 Tiếng lần tràng hạt niệm Phật (Subtle bead click)
    playBeadClick() {
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1400 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.02);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    // 📜 Tiếng lắc ống xăm (Bamboo fortune sticks clacking)
    playStickRattle() {
        this.init();
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(700 + Math.random() * 400, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now);
                osc.stop(now + 0.06);
            }, i * 65);
        }
    }

    // 🧘 Nhạc Thiền Tĩnh Tâm Ambient (Tibetan Singing Bowl / Meditation notes)
    toggleAmbientMusic(enable) {
        this.init();
        if (enable === undefined) {
            this.isAmbientPlaying = !this.isAmbientPlaying;
        } else {
            this.isAmbientPlaying = enable;
        }

        if (this.isAmbientPlaying) {
            this.startAmbientDrone();
        } else {
            this.stopAmbientDrone();
        }
        return this.isAmbientPlaying;
    }

    startAmbientDrone() {
        if (this.ambientInterval) clearInterval(this.ambientInterval);
        
        // Pentatonic peaceful notes: D3, F#3, A3, B3, D4, E4
        const notes = [146.83, 185.00, 220.00, 246.94, 293.66, 329.63];
        
        const playGentleChime = () => {
            if (!this.isAmbientPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;
            const note = notes[Math.floor(Math.random() * notes.length)];
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(note, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.07, now + 2.0);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 8.0);

            osc.connect(gain);
            gain.connect(this.ambientGain);

            osc.start(now);
            osc.stop(now + 8.2);
        };

        playGentleChime();
        this.ambientInterval = setInterval(playGentleChime, 4500);
    }

    stopAmbientDrone() {
        if (this.ambientInterval) {
            clearInterval(this.ambientInterval);
            this.ambientInterval = null;
        }
    }
}

window.templeAudio = new TempleAudio();
