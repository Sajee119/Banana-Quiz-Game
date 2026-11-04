import { Volume2, VolumeX, Headphones, AudioLines, AudioLinesOff } from 'lucide-react';
import { useSound } from '../hooks/useSound.js';

function IconToggle({ on, onClick, label, title, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={on}
            aria-label={label}
            title={title || label}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 transition active:translate-y-0.5 ${
                on
                    ? 'border-banana-400 bg-white text-banana-700 shadow-game-sm'
                    : 'border-transparent bg-banana-100/70 text-banana-500 hover:text-banana-700'
            }`}
        >
            {children}
        </button>
    );
}

export default function AudioControls({ compact = false }) {
    const { sfxEnabled, musicEnabled, volume, toggleMute, toggleMusic, setVolume } = useSound();

    if (compact) {
        return (
            <div className="flex items-center gap-1.5">
                <IconToggle on={sfxEnabled} onClick={toggleMute} label="Toggle sound effects">
                    {sfxEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </IconToggle>
                <span className="hidden sm:contents">
                    <IconToggle on={musicEnabled} onClick={toggleMusic} label="Toggle music">
                        {musicEnabled ? <AudioLines size={18} /> : <AudioLinesOff size={18} />}
                    </IconToggle>
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-banana-200 text-banana-700">
                        {sfxEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </div>
                    <div>
                        <p className="font-bold text-banana-800">Sound effects</p>
                        <p className="text-xs text-banana-600">Ticks, correct answers and results</p>
                    </div>
                </div>
                <Switch on={sfxEnabled} onClick={toggleMute} label="Toggle sound effects" />
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-banana-200 text-banana-700">
                        <Headphones size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-banana-800">Background music</p>
                        <p className="text-xs text-banana-600">A looping banana groove</p>
                    </div>
                </div>
                <Switch on={musicEnabled} onClick={toggleMusic} label="Toggle background music" />
            </div>

            <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-banana-700">
                    <span>Master volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(volume * 100)}
                    onChange={(event) => setVolume(Number(event.target.value) / 100)}
                    aria-label="Master volume"
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-banana-200 accent-banana-500"
                />
            </div>
        </div>
    );
}

function Switch({ on, onClick, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            onClick={onClick}
            className={`relative h-8 w-14 flex-shrink-0 rounded-full border-2 transition ${
                on ? 'border-banana-500 bg-banana-400' : 'border-banana-300 bg-banana-100'
            }`}
        >
            <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                    on ? 'left-6' : 'left-0.5'
                }`}
            />
        </button>
    );
}
