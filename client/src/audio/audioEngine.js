/**
 * Banana Quiz audio engine.
 *
 * Everything is synthesised with the Web Audio API, so there are no external
 * MP3 files to download and nothing can 404. The module is a singleton: music
 * keeps playing while the player moves between pages.
 *
 * Browsers only allow audio after a user gesture, so `initAudio()` installs
 * one-time unlock listeners. The first tap/click/keypress resumes the audio
 * context and starts the background loop (if music is enabled).
 */

const SETTINGS_KEY = 'bq-audio-settings';

const DEFAULT_SETTINGS = {
    sfxEnabled: true,
    musicEnabled: true,
    volume: 0.7,
};

const MUSIC_STEP_SECONDS = 60 / 108 / 2; // eighth notes at 108 BPM
const MUSIC_LOOKAHEAD_SECONDS = 0.25;

// A cheerful 32-step loop in C major pentatonic.
const MELODY = [
    523.25, null, 659.25, null, 783.99, 659.25, 523.25, null,
    587.33, null, 659.25, null, 523.25, null, 392.0, null,
    440.0, null, 523.25, null, 659.25, null, 587.33, null,
    523.25, null, 440.0, null, 392.0, null, 329.63, null,
];
const BASS = [130.81, 110.0, 87.31, 98.0, 130.81, 110.0, 98.0, 130.81];

const SFX = {
    click: [{ freq: 720, duration: 0.06, type: 'square', gain: 0.06 }],
    tick: [{ freq: 960, duration: 0.05, type: 'square', gain: 0.05 }],
    toggle: [{ freq: 620, duration: 0.06, type: 'triangle', gain: 0.09 }],
    correct: [
        { freq: 523.25, duration: 0.09, type: 'triangle', gain: 0.14 },
        { freq: 659.25, duration: 0.09, type: 'triangle', gain: 0.14, delay: 0.07 },
        { freq: 783.99, duration: 0.16, type: 'triangle', gain: 0.15, delay: 0.14 },
    ],
    wrong: [
        { freq: 246.94, duration: 0.16, type: 'sawtooth', gain: 0.12 },
        { freq: 185.0, duration: 0.22, type: 'sawtooth', gain: 0.12, delay: 0.14 },
    ],
    expire: [
        { freq: 440.0, duration: 0.12, type: 'square', gain: 0.1 },
        { freq: 349.23, duration: 0.12, type: 'square', gain: 0.1, delay: 0.12 },
        { freq: 261.63, duration: 0.24, type: 'square', gain: 0.1, delay: 0.24 },
    ],
    win: [
        { freq: 523.25, duration: 0.12, type: 'triangle', gain: 0.15 },
        { freq: 659.25, duration: 0.12, type: 'triangle', gain: 0.15, delay: 0.1 },
        { freq: 783.99, duration: 0.12, type: 'triangle', gain: 0.15, delay: 0.2 },
        { freq: 1046.5, duration: 0.3, type: 'triangle', gain: 0.16, delay: 0.3 },
    ],
};

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const parsed = JSON.parse(raw);
        return {
            sfxEnabled: parsed.sfxEnabled !== false,
            musicEnabled: parsed.musicEnabled !== false,
            volume:
                typeof parsed.volume === 'number'
                    ? Math.min(1, Math.max(0, parsed.volume))
                    : DEFAULT_SETTINGS.volume,
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

class AudioEngine {
    constructor() {
        this.settings = loadSettings();
        this.listeners = new Set();
        this.ctx = null;
        this.master = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.musicTimer = null;
        this.musicStep = 0;
        this.nextNoteTime = 0;
        this.installed = false;
    }

    getState() {
        return {
            ...this.settings,
            ready: Boolean(this.ctx && this.ctx.state === 'running'),
            musicPlaying: Boolean(this.musicTimer),
        };
    }

    emit() {
        const state = this.getState();
        this.listeners.forEach((listener) => {
            try {
                listener(state);
            } catch {
                // A broken listener must not stop audio.
            }
        });
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    persist() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
        } catch {
            // Private mode: settings still apply for this session.
        }
    }

    init() {
        if (this.installed || typeof window === 'undefined') return;
        this.installed = true;

        const unlock = () => this.unlock();
        window.addEventListener('pointerdown', unlock, { passive: true });
        window.addEventListener('keydown', unlock);
        window.addEventListener('touchstart', unlock, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopMusic(false);
            } else if (this.settings.musicEnabled && this.ctx) {
                this.unlock();
            }
        });
    }

    ensureContext() {
        if (this.ctx) return this.ctx;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;

        try {
            this.ctx = new Ctx();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.settings.volume;
            this.master.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 1;
            this.sfxGain.connect(this.master);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.32;
            this.musicGain.connect(this.master);
        } catch {
            this.ctx = null;
        }

        return this.ctx;
    }

    async unlock() {
        const ctx = this.ensureContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            try {
                await ctx.resume();
            } catch {
                return;
            }
        }
        if (this.settings.musicEnabled) this.startMusic();
        this.emit();
    }

    tone(freq, when, duration, type, peak, destination) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, when);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

        osc.connect(gain);
        gain.connect(destination || this.sfxGain);
        osc.start(when);
        osc.stop(when + duration + 0.03);
    }

    playSfx(name) {
        if (!this.settings.sfxEnabled) return;
        const ctx = this.ensureContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const notes = SFX[name];
        if (!notes) return;

        const now = ctx.currentTime + 0.01;
        notes.forEach((note) => {
            this.tone(
                note.freq,
                now + (note.delay || 0),
                note.duration,
                note.type || 'sine',
                note.gain ?? 0.12,
                this.sfxGain
            );
        });
    }

    scheduleMusic() {
        if (!this.ctx) return;
        while (this.nextNoteTime < this.ctx.currentTime + MUSIC_LOOKAHEAD_SECONDS) {
            const step = this.musicStep % MELODY.length;
            const note = MELODY[step];
            if (note) {
                this.tone(note, this.nextNoteTime, 0.22, 'triangle', 0.1, this.musicGain);
            }
            if (step % 8 === 0) {
                const bass = BASS[Math.floor(step / 8) % BASS.length];
                this.tone(bass, this.nextNoteTime, 0.55, 'sine', 0.16, this.musicGain);
            }
            this.nextNoteTime += MUSIC_STEP_SECONDS;
            this.musicStep += 1;
        }
    }

    startMusic() {
        const ctx = this.ensureContext();
        if (!ctx || this.musicTimer) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        this.nextNoteTime = ctx.currentTime + 0.1;
        this.musicStep = 0;
        this.musicTimer = setInterval(() => this.scheduleMusic(), 40);
        this.emit();
    }

    stopMusic(emit = true) {
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
        if (emit) this.emit();
    }

    toggleSfx() {
        this.settings.sfxEnabled = !this.settings.sfxEnabled;
        this.persist();
        this.emit();
        if (this.settings.sfxEnabled) this.playSfx('toggle');
    }

    toggleMusic() {
        this.settings.musicEnabled = !this.settings.musicEnabled;
        this.persist();
        if (this.settings.musicEnabled) {
            this.unlock();
        } else {
            this.stopMusic();
        }
        this.emit();
    }

    setMusicEnabled(enabled) {
        this.settings.musicEnabled = Boolean(enabled);
        this.persist();
        if (this.settings.musicEnabled) this.unlock();
        else this.stopMusic();
        this.emit();
    }

    setSfxEnabled(enabled) {
        this.settings.sfxEnabled = Boolean(enabled);
        this.persist();
        this.emit();
    }

    setVolume(value) {
        const volume = Math.min(1, Math.max(0, Number(value) || 0));
        this.settings.volume = volume;
        this.persist();
        if (this.master && this.ctx) {
            this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
        }
        this.emit();
    }
}

export const audioEngine = new AudioEngine();

export function initAudio() {
    audioEngine.init();
}
