import { useState } from 'react';
import { Cookie, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'banana-cookie-choice';

export default function CookieConsent() {
    const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));

    const choose = (choice) => {
        localStorage.setItem(STORAGE_KEY, choice);
        setVisible(false);
    };

    if (!visible) return null;
    return (
        <aside className="fixed bottom-4 left-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/80 p-5 shadow-game" role="dialog" aria-label="Cookie choices">
            <div className="mb-3 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                    <Cookie size={18} />
                </span>
                <h2 className="font-display text-xl font-extrabold text-banana-900">Cookie choices</h2>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-banana-800">
                We use essential cookies to keep you signed in and save your game session. Choose whether to allow optional preferences.
            </p>
            <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => choose('allowed')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-banana-500 bg-gradient-to-b from-banana-400 to-banana-500 px-4 py-2.5 font-display text-sm font-bold text-banana-900 shadow-game-sm transition hover:brightness-[1.02] active:translate-y-0.5">Allow all</button>
                <button type="button" onClick={() => choose('declined')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-banana-400 bg-white/90 px-4 py-2.5 font-display text-sm font-bold text-banana-900 shadow-game-sm transition hover:bg-banana-100 active:translate-y-0.5">Decline</button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-banana-700"><ShieldCheck size={13} /> You can change this choice in Profile settings.</p>
        </aside>
    );
}
