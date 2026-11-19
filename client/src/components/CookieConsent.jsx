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
        <aside className="fixed bottom-4 left-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 p-5 shadow-game" role="dialog" aria-label="Cookie choices">
            <div className="mb-3 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-banana-300 bg-banana-100 text-banana-700">
                    <Cookie size={18} />
                </span>
                <h2 className="font-display text-xl font-bold text-banana-900">Cookie choices</h2>
            </div>
            <p className="text-sm leading-relaxed text-banana-800">
                We use essential cookies to keep you signed in and save your game session. Choose whether to allow optional preferences.
            </p>
            <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => choose('allowed')} className="flex-1 rounded-xl border-b-4 border-banana-700 bg-gradient-to-b from-banana-400 to-banana-500 px-3 py-2 font-display font-bold text-banana-900 shadow-game-sm hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2">Allow all</button>
                <button type="button" onClick={() => choose('declined')} className="flex-1 rounded-xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 px-3 py-2 font-display font-bold text-banana-900 shadow-game-sm hover:from-banana-50 hover:to-banana-100 active:translate-y-[1px]">Decline</button>
            </div>
            <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-banana-500"><ShieldCheck size={13} /> You can change this choice in Profile settings.</p>
        </aside>
    );
}
