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
        <aside className="fixed bottom-4 left-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-3xl border-4 border-banana-400 bg-banana-50 p-5 shadow-game" role="dialog" aria-label="Cookie choices">
            <div className="mb-3 flex items-center gap-2">
                <Cookie className="text-banana-600" size={22} />
                <h2 className="font-display text-xl font-extrabold text-banana-900">Cookies, sessions and your choice</h2>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-banana-700">
                We use essential cookies to keep you signed in and save your game session. Choose whether to allow optional preferences.
            </p>
            <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => choose('allowed')} className="flex-1 rounded-xl bg-banana-500 px-3 py-2 font-bold text-white hover:bg-banana-600">Allow all</button>
                <button type="button" onClick={() => choose('declined')} className="flex-1 rounded-xl border-2 border-banana-300 bg-white px-3 py-2 font-bold text-banana-800 hover:bg-banana-100">Decline</button>
            </div>
            <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-banana-500"><ShieldCheck size={13} /> You can change this choice in Profile settings.</p>
        </aside>
    );
}
