import {
    AudioLines,
    AudioLinesOff,
    Bell,
    CheckCircle2,
    Clock3,
    Flag,
    Headphones,
    MousePointerClick,
    Play,
    Volume1,
    Volume2,
    VolumeX,
    XCircle,
} from 'lucide-react';
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

function VolumeSlider({ label, value, onChange }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-banana-700">
                <span>{label}</span>
                <span>{Math.round(value * 100)}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(value * 100)}
                onChange={(event) => onChange(Number(event.target.value) / 100)}
                aria-label={label}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-banana-200 accent-banana-500"
            />
        </div>
    );
}

function TestButton({ onClick, label, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-banana-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-banana-700 transition hover:border-banana-300 hover:bg-banana-50 active:translate-y-0.5"
        >
            {children}
            {label}
        </button>
    );
}

export default function AudioControls({ compact = false }) {
    const {
        sfxEnabled,
        musicEnabled,
        volume,
        sfxVolume,
        musicVolume,
        toggleMute,
        toggleMusic,
        setVolume,
        setSfxVolume,
        setMusicVolume,
        play,
    } = useSound();

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
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-banana-200 text-banana-700">
                            {sfxEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </div>
                        <div>
                            <p className="font-bold text-banana-800">Sound effects</p>
                            <p className="text-xs text-banana-600">
                                Ticks, answers, streaks and results
                            </p>
                        </div>
                    </div>
                    <Switch on={sfxEnabled} onClick={toggleMute} label="Toggle sound effects" />
                </div>

                <VolumeSlider
                    label="Effects volume"
                    value={sfxVolume}
                    onChange={setSfxVolume}
                />

                <div className="flex flex-wrap gap-2">
                    <TestButton onClick={() => play('click')} label="Click">
                        <MousePointerClick size={13} className="text-sky-600" />
                    </TestButton>
                    <TestButton onClick={() => play('correct')} label="Correct">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                    </TestButton>
                    <TestButton onClick={() => play('wrong')} label="Wrong">
                        <XCircle size={13} className="text-red-500" />
                    </TestButton>
                    <TestButton onClick={() => play('expire')} label="Time out">
                        <Clock3 size={13} className="text-orange-500" />
                    </TestButton>
                    <TestButton onClick={() => play('streak')} label="Streak">
                        <Volume1 size={13} className="text-violet-500" />
                    </TestButton>
                    <TestButton onClick={() => play('win')} label="Win">
                        <Play size={13} className="text-banana-600" />
                    </TestButton>
                    <TestButton onClick={() => play('gameStart')} label="Start">
                        <Flag size={13} className="text-sky-600" />
                    </TestButton>
                    <TestButton onClick={() => play('notify')} label="Notify">
                        <Bell size={13} className="text-amber-600" />
                    </TestButton>
                </div>
                <p className="text-xs font-semibold text-banana-500">
                    Click, correct, wrong, time-out, streak, start and result sounds are
                    real MP3 samples from the bundled sound-effects folder.
                </p>
            </div>

            <div className="space-y-3 border-t border-banana-200 pt-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-banana-200 text-banana-700">
                            <Headphones size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-banana-800">Background music</p>
                            <p className="text-xs text-banana-600">
                                The banana quiz groove, looped from the bundled track
                            </p>
                        </div>
                    </div>
                    <Switch
                        on={musicEnabled}
                        onClick={toggleMusic}
                        label="Toggle background music"
                    />
                </div>

                <VolumeSlider
                    label="Music volume"
                    value={musicVolume}
                    onChange={setMusicVolume}
                />
            </div>

            <div className="border-t border-banana-200 pt-4">
                <VolumeSlider label="Master volume" value={volume} onChange={setVolume} />
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
                className={`theme-knob absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                    on ? 'left-6' : 'left-0.5'
                }`}
            />
        </button>
    );
}
