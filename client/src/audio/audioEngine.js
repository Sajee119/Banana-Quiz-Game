/**
 * Banana Quiz audio engine.
 *
 * Sound effects are synthesised with the Web Audio API, so they stay tiny and
 * always match the game's playful tone. Background music streams the bundled
 * `game-bg-audio.mp3` loop instead of a generated melody.
 *
 * The module is a singleton: music keeps playing while the player moves between
 * pages. Browsers only allow audio after a user gesture, so `initAudio()`
 * installs one-time unlock listeners. The first tap/click/keypress resumes the
 * audio context and starts the background loop (if music is enabled).
 */

import { SAMPLED_SFX } from './sound-effects/manifest.js';

const SETTINGS_KEY = 'bq-audio-settings';
const MUSIC_URL = new URL('./game-bg-audio.mp3', import.meta.url).href;

const DEFAULT_SETTINGS = {
    sfxEnabled: true,
    musicEnabled: true,
    volume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
};

const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, Number(value) || 0));

// Every effect is a short score of oscillator notes plus optional noise.
// Keeping them here makes it easy to add new sounds as the game grows.
const SFX = {
    click: [{ freq: 720, duration: 0.06, type: 'square', gain: 0.06 }],
    tick: [{ freq: 960, duration: 0.05, type: 'square', gain: 0.05 }],
    type: [{ freq: 540, duration: 0.045, type: 'triangle', gain: 0.07 }],
    pop: [{ freq: 680, duration: 0.07, type: 'sine', gain: 0.11 }],
    toggle: [{ freq: 620, duration: 0.06, type: 'triangle', gain: 0.09 }],
    select: [
        { freq: 660, duration: 0.06, type: 'triangle', gain: 0.1 },
        { freq: 880, duration: 0.09, type: 'triangle', gain: 0.09, delay: 0.05 },
    ],
    correct: [
        { freq: 523.25, duration: 0.09, type: 'triangle', gain: 0.14 },
        { freq: 659.25, duration: 0.09, type: 'triangle', gain: 0.14, delay: 0.07 },
        { freq: 783.99, duration: 0.16, type: 'triangle', gain: 0.15, delay: 0.14 },
    ],
    streak: [
        { freq: 659.25, duration: 0.08, type: 'triangle', gain: 0.13 },
        { freq: 783.99, duration: 0.08, type: 'triangle', gain: 0.13, delay: 0.06 },
        { freq: 987.77, duration: 0.08, type: 'triangle', gain: 0.13, delay: 0.12 },
        { freq: 1318.51, duration: 0.18, type: 'triangle', gain: 0.14, delay: 0.18 },
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
    skip: [
        { freq: 392.0, duration: 0.08, type: 'triangle', gain: 0.1 },
        { freq: 523.25, duration: 0.08, type: 'triangle', gain: 0.1, delay: 0.07 },
        { freq: 659.25, duration: 0.12, type: 'triangle', gain: 0.11, delay: 0.14 },
    ],
    win: [
        { freq: 523.25, duration: 0.12, type: 'triangle', gain: 0.15 },
        { freq: 659.25, duration: 0.12, type: 'triangle', gain: 0.15, delay: 0.1 },
        { freq: 783.99, duration: 0.12, type: 'triangle', gain: 0.15, delay: 0.2 },
        { freq: 1046.5, duration: 0.3, type: 'triangle', gain: 0.16, delay: 0.3 },
    ],
    lose: [
        { freq: 392.0, duration: 0.16, type: 'triangle', gain: 0.12 },
        { freq: 329.63, duration: 0.16, type: 'triangle', gain: 0.12, delay: 0.14 },
        { freq: 261.63, duration: 0.32, type: 'triangle', gain: 0.12, delay: 0.28 },
    ],
    success: [
        { freq: 587.33, duration: 0.09, type: 'sine', gain: 0.13 },
        { freq: 880.0, duration: 0.16, type: 'sine', gain: 0.13, delay: 0.08 },
    ],
    error: [
        { freq: 220.0, duration: 0.12, type: 'square', gain: 0.1 },
        { freq: 174.61, duration: 0.18, type: 'square', gain: 0.1, delay: 0.1 },
    ],
    achievement: [
        { freq: 783.99, duration: 0.1, type: 'triangle', gain: 0.13 },
        { freq: 1046.5, duration: 0.1, type: 'triangle', gain: 0.13, delay: 0.09 },
        { freq: 1318.51, duration: 0.12, type: 'triangle', gain: 0.14, delay: 0.18 },
        { freq: 1567.98, duration: 0.26, type: 'triangle', gain: 0.14, delay: 0.28 },
    ],
    coin: [
        { freq: 987.77, duration: 0.05, type: 'square', gain: 0.08 },
        { freq: 1318.51, duration: 0.12, type: 'square', gain: 0.07, delay: 0.05 },
    ],
    gameStart: [
        { freq: 392.0, duration: 0.1, type: 'triangle', gain: 0.12 },
        { freq: 523.25, duration: 0.1, type: 'triangle', gain: 0.12, delay: 0.08 },
        { freq: 659.25, duration: 0.1, type: 'triangle', gain: 0.12, delay: 0.16 },
        { freq: 783.99, duration: 0.22, type: 'triangle', gain: 0.14, delay: 0.24 },
        { noise: { duration: 0.25, gain: 0.05, freq: 1800 } },
    ],
    gameOver: [
        { freq: 783.99, duration: 0.12, type: 'triangle', gain: 0.13 },
        { freq: 659.25, duration: 0.12, type: 'triangle', gain: 0.13, delay: 0.12 },
        { freq: 523.25, duration: 0.12, type: 'triangle', gain: 0.13, delay: 0.24 },
        { freq: 392.0, duration: 0.3, type: 'triangle', gain: 0.13, delay: 0.36 },
    ],
    quit: [
        { freq: 329.63, duration: 0.12, type: 'sawtooth', gain: 0.08 },
        { freq: 220.0, duration: 0.24, type: 'sawtooth', gain: 0.08, delay: 0.1 },
    ],
    countdown: [{ freq: 880.0, duration: 0.09, type: 'square', gain: 0.08 }],
    notify: [
        { freq: 880.0, duration: 0.08, type: 'sine', gain: 0.1 },
        { freq: 1174.66, duration: 0.13, type: 'sine', gain: 0.1, delay: 0.07 },
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
                    ? clamp(parsed.volume)
                    : DEFAULT_SETTINGS.volume,
            sfxVolume:
                typeof parsed.sfxVolume === 'number'
                    ? clamp(parsed.sfxVolume)
                    : DEFAULT_SETTINGS.sfxVolume,
            musicVolume:
                typeof parsed.musicVolume === 'number'
                    ? clamp(parsed.musicVolume)
                    : DEFAULT_SETTINGS.musicVolume,
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
        this.musicAudio = null;
        this.musicPlaying = false;
        this.sampleAudio = new Map();
        this.samplesPreloaded = false;
        this.installed = false;
    }

    getState() {
        return {
            ...this.settings,
            ready: Boolean(this.ctx && this.ctx.state === 'running'),
            musicPlaying: this.musicPlaying,
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

        this.preloadSamples();
    }

    /** Create one preloaded Audio element per sampled effect (deduplicated). */
    preloadSamples() {
        if (this.samplesPreloaded || typeof Audio === 'undefined') return;
        this.samplesPreloaded = true;
        Object.keys(SAMPLED_SFX).forEach((name) => this.getSample(name));
    }

    getSample(name) {
        const url = SAMPLED_SFX[name];
        if (!url) return null;

        let audio = this.sampleAudio.get(url);
        if (!audio) {
            try {
                audio = new Audio(url);
                audio.preload = 'auto';
                this.sampleAudio.set(url, audio);
            } catch {
                return null;
            }
        }
        return audio;
    }

    /**
     * Play a real MP3 effect. Cloning the preloaded element lets short sounds
     * overlap (for example a streak fanfare over the next question) without
     * cutting each other off. Returns false when the effect has no sample.
     */
    playSample(name) {
        const base = this.getSample(name);
        if (!base) return false;

        try {
            const audio = base.cloneNode(true);
            audio.volume = clamp(this.settings.volume * this.settings.sfxVolume);
            const playback = audio.play();
            if (playback && typeof playback.catch === 'function') {
                playback.catch(() => {});
            }
            return true;
        } catch {
            return false;
        }
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
            this.sfxGain.gain.value = this.settings.sfxVolume;
            this.sfxGain.connect(this.master);
        } catch {
            this.ctx = null;
        }

        return this.ctx;
    }

    ensureMusicAudio() {
        if (this.musicAudio) return this.musicAudio;
        if (typeof Audio === 'undefined') return null;

        try {
            const audio = new Audio(MUSIC_URL);
            audio.loop = true;
            audio.preload = 'auto';
            audio.volume = clamp(this.settings.volume * this.settings.musicVolume);
            audio.addEventListener('error', () => {
                this.musicPlaying = false;
                this.emit();
            });
            this.musicAudio = audio;
        } catch {
            this.musicAudio = null;
        }

        return this.musicAudio;
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
        // Already unlocked: don't re-emit state on every tap/keypress.
        if (!this.settings.musicEnabled || this.musicPlaying) return;
        this.startMusic();
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

    noise(when, duration = 0.2, peak = 0.05, frequency = 1200) {
        if (!this.ctx) return;
        const size = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
        const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let index = 0; index < size; index += 1) {
            data[index] = (Math.random() * 2 - 1) * (1 - index / size);
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = frequency;
        filter.Q.value = 0.8;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        source.start(when);
        source.stop(when + duration + 0.02);
    }

    playSfx(name) {
        if (!this.settings.sfxEnabled) return;

        // Real samples take priority; events without one fall through to the
        // Web Audio synth below.
        if (this.playSample(name)) return;

        const ctx = this.ensureContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const notes = SFX[name];
        if (!notes) return;

        const now = ctx.currentTime + 0.01;
        notes.forEach((note) => {
            if (note.noise) {
                this.noise(
                    now + (note.delay || 0),
                    note.noise.duration,
                    note.noise.gain,
                    note.noise.freq
                );
                return;
            }
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

    startMusic() {
        const ctx = this.ensureContext();
        if (!ctx || !this.settings.musicEnabled) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const audio = this.ensureMusicAudio();
        if (!audio) return;
        if (this.musicPlaying && !audio.paused) return;

        audio.volume = clamp(this.settings.volume * this.settings.musicVolume);
        this.musicPlaying = true;

        const playback = audio.play();
        if (playback && typeof playback.catch === 'function') {
            playback.catch(() => {
                this.musicPlaying = false;
                this.emit();
            });
        }
        this.emit();
    }

    stopMusic(emit = true) {
        if (this.musicAudio) {
            try {
                this.musicAudio.pause();
            } catch {
                // The element may not be ready yet; nothing to pause.
            }
        }
        this.musicPlaying = false;
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
        const volume = clamp(value);
        this.settings.volume = volume;
        this.persist();
        if (this.master && this.ctx) {
            this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
        }
        if (this.musicAudio) {
            this.musicAudio.volume = clamp(volume * this.settings.musicVolume);
        }
        this.emit();
    }

    setSfxVolume(value) {
        const volume = clamp(value);
        this.settings.sfxVolume = volume;
        this.persist();
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
        }
        this.emit();
    }

    setMusicVolume(value) {
        const volume = clamp(value);
        this.settings.musicVolume = volume;
        this.persist();
        if (this.musicAudio) {
            this.musicAudio.volume = clamp(this.settings.volume * volume);
        }
        this.emit();
    }
}

export const audioEngine = new AudioEngine();

export function initAudio() {
    audioEngine.init();
}
