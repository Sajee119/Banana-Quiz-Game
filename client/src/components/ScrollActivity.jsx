import { useEffect, useState } from 'react';

export default function ScrollActivity() {
    const [scrolling, setScrolling] = useState(false);
    useEffect(() => {
        let timer;
        const handleScroll = () => {
            setScrolling(true);
            window.clearTimeout(timer);
            timer = window.setTimeout(() => setScrolling(false), 350);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.clearTimeout(timer);
        };
    }, []);
    return scrolling ? <div className="fixed left-0 right-0 top-0 z-[70] h-1 overflow-hidden bg-banana-200"><div className="h-full w-1/3 animate-pulse bg-banana-600" /></div> : null;
}
