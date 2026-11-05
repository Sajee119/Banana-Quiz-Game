import {
    Banana,
    Eye,
    Flame,
    Crown,
    Zap,
    Coins,
    Trophy,
    Medal,
    Timer,
    Leaf,
} from 'lucide-react';

const ICONS = {
    banana: Banana,
    eye: Eye,
    flame: Flame,
    crown: Crown,
    zap: Zap,
    coins: Coins,
    trophy: Trophy,
    medal: Medal,
    timer: Timer,
    leaf: Leaf,
};

export function AchievementIcon({ name, size = 22, className = '' }) {
    const Icon = ICONS[name] || Trophy;
    return <Icon size={size} className={className} />;
}
