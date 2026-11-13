import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Activity,
    ArrowLeft,
    Bell,
    CalendarDays,
    Check,
    CircleAlert,
    Crown,
    Download,
    Eye,
    Flame,
    Gamepad2,
    Image,
    KeyRound,
    ListChecks,
    LogOut,
    Mail,
    MailCheck,
    Monitor,
    Moon,
    Palette,
    RefreshCw,
    Save,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    Sun,
    Tablet,
    Target,
    Trash2,
    Trophy,
    UserRound,
    Zap,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import AudioControls from '../components/AudioControls.jsx';
import StatCard from '../components/StatCard.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.jsx';
import { useAuth } from '../context/auth-context.js';
import { authApi, userApi } from '../api/client.js';
import {
    MODE_LIST,
    QUIZ_COUNT_OPTIONS,
    TIME_LIMIT_OPTIONS,
    formatDate,
    formatDateTime,
    formatRelative,
    initials,
    normalizeModeId,
} from '../lib/format.js';
import { evaluatePassword } from '../lib/passwordStrength.js';
import { applyCompactMode, applyTheme, THEME_OPTIONS } from '../lib/theme.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useSound } from '../hooks/useSound.js';

const inputClass =
    'w-full rounded-xl border-2 border-banana-200 bg-white px-3.5 py-2.5 font-semibold text-banana-900 placeholder:text-banana-400 focus:border-banana-400 focus:outline-none';

const DEVICE_ICONS = {
    mobile: Smartphone,
    tablet: Tablet,
    desktop: Monitor,
    unknown: Monitor,
};

const METHOD_LABELS = {
    password: 'Password',
    register: 'Sign-up',
    google: 'Google',
    facebook: 'Facebook',
};

const REASON_LABELS = {
    unknown_email: 'Unknown email',
    wrong_password: 'Wrong password',
    social_only: 'Social-only account',
};

const TABS = [
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'gameplay', label: 'Gameplay', icon: Gamepad2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'privacy', label: 'Privacy & data', icon: Eye },
    { id: 'danger-zone', label: 'Danger zone', icon: ShieldAlert },
];

const DEFAULT_PREFERENCES = {
    theme: 'light',
    compactMode: false,
    reducedMotion: false,
    showOnLeaderboard: true,
    emailNotifications: true,
    loginAlerts: true,
    productUpdates: false,
    defaultMode: 'easy',
    autoSubmit: true,
    celebrations: true,
    showKeyboardHints: true,
    showTimer: true,
    confirmQuit: true,
    defaultQuizCount: 10,
    defaultTime: 30,
};

export default function ProfilePage() {
    usePageTitle('Profile & settings');
    const { user, stats, setUser, setStats } = useAuth();
    const { play } = useSound();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const requestedTab = searchParams.get('tab') || 'profile';
    const activeTab = TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'profile';

    const [profile, setProfile] = useState({
        name: '',
        bio: '',
        avatar: '',
        favoriteMode: 'easy',
    });
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [notices, setNotices] = useState({});
    const [savingSection, setSavingSection] = useState('');

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordNotice, setPasswordNotice] = useState(null);

    const [loginData, setLoginData] = useState(null);
    const [loginError, setLoginError] = useState('');
    const [loadingLogins, setLoadingLogins] = useState(true);

    const [security, setSecurity] = useState(null);
    const [securityError, setSecurityError] = useState('');
    const [loadingSecurity, setLoadingSecurity] = useState(true);
    const [signingOutOthers, setSigningOutOthers] = useState(false);
    const [deviceNotice, setDeviceNotice] = useState(null);

    const [emailAction, setEmailAction] = useState({ sending: false, error: '' });

    const [deactivateForm, setDeactivateForm] = useState({ confirm: '', password: '' });
    const [deactivating, setDeactivating] = useState(false);
    const [deactivateError, setDeactivateError] = useState('');

    const [verifiedBanner, setVerifiedBanner] = useState(
        searchParams.get('verified') === '1'
    );

    const hasPassword =
        security?.hasPassword ?? Boolean(user?.providerNames?.includes('local'));
    const winRate = stats?.gamesPlayed
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;

    useEffect(() => {
        if (!user) return;
        setProfile({
            name: user.displayName || '',
            bio: user.bio || '',
            avatar: user.avatar || '',
            favoriteMode: normalizeModeId(user.favoriteMode),
        });
        const storedQuizCount = Number(user.preferences?.defaultQuizCount);
        const storedTime = Number(user.preferences?.defaultTime);

        setPreferences({
            theme: user.preferences?.theme ?? DEFAULT_PREFERENCES.theme,
            compactMode:
                user.preferences?.compactMode ?? DEFAULT_PREFERENCES.compactMode,
            reducedMotion:
                user.preferences?.reducedMotion ?? DEFAULT_PREFERENCES.reducedMotion,
            showOnLeaderboard:
                user.preferences?.showOnLeaderboard ?? DEFAULT_PREFERENCES.showOnLeaderboard,
            emailNotifications:
                user.preferences?.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications,
            loginAlerts: user.preferences?.loginAlerts ?? DEFAULT_PREFERENCES.loginAlerts,
            productUpdates:
                user.preferences?.productUpdates ?? DEFAULT_PREFERENCES.productUpdates,
            defaultMode: normalizeModeId(
                user.preferences?.defaultMode ?? DEFAULT_PREFERENCES.defaultMode
            ),
            autoSubmit: user.preferences?.autoSubmit ?? DEFAULT_PREFERENCES.autoSubmit,
            celebrations: user.preferences?.celebrations ?? DEFAULT_PREFERENCES.celebrations,
            showKeyboardHints:
                user.preferences?.showKeyboardHints ?? DEFAULT_PREFERENCES.showKeyboardHints,
            showTimer: user.preferences?.showTimer ?? DEFAULT_PREFERENCES.showTimer,
            confirmQuit: user.preferences?.confirmQuit ?? DEFAULT_PREFERENCES.confirmQuit,
            defaultQuizCount: QUIZ_COUNT_OPTIONS.includes(storedQuizCount)
                ? storedQuizCount
                : DEFAULT_PREFERENCES.defaultQuizCount,
            defaultTime: TIME_LIMIT_OPTIONS.includes(storedTime)
                ? storedTime
                : DEFAULT_PREFERENCES.defaultTime,
        });
    }, [user]);

    useEffect(() => {
        if (searchParams.get('verified') === '1') setVerifiedBanner(true);
    }, [searchParams]);

    const loadSecurity = useCallback(() => {
        setLoadingSecurity(true);
        setLoadingLogins(true);
        setSecurityError('');
        setLoginError('');

        Promise.allSettled([userApi.security(), userApi.logins()])
            .then(([securityResult, loginResult]) => {
                if (securityResult.status === 'fulfilled') {
                    setSecurity(securityResult.value.security);
                } else {
                    setSecurityError(
                        securityResult.reason?.friendlyMessage ||
                            'Could not load your security overview.'
                    );
                }

                if (loginResult.status === 'fulfilled') {
                    setLoginData(loginResult.value);
                } else {
                    setLoginError(
                        loginResult.reason?.friendlyMessage || 'Could not load login history.'
                    );
                }
            })
            .finally(() => {
                setLoadingLogins(false);
                setLoadingSecurity(false);
            });
    }, []);

    useEffect(() => {
        loadSecurity();
    }, [loadSecurity]);

    const selectTab = (tabId) => {
        play('click');
        setNotices({});
        setPasswordNotice(null);
        setDeviceNotice(null);
        setEmailAction({ sending: false, error: '' });
        setSearchParams(tabId === 'profile' ? {} : { tab: tabId }, { replace: true });
    };

    const setNotice = (scope, notice) => {
        setNotices((prev) => ({ ...prev, [scope]: notice }));
    };

    const updateProfileField = (field) => (event) => {
        setProfile((prev) => ({ ...prev, [field]: event.target.value }));
        setNotice('profile', null);
    };

    const updatePreference = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setPreferences((prev) => ({ ...prev, [field]: value }));
        if (field === 'compactMode') applyCompactMode(value);
        setNotices({});
        play('toggle');
    };

    const handleThemeSelect = (theme) => {
        setPreferences((prev) => ({ ...prev, theme }));
        applyTheme(theme);
        setNotices({});
        play('select');
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        if (savingSection) return;
        setSavingSection('profile');
        setNotice('profile', null);

        try {
            const data = await userApi.updateMe({
                name: profile.name.trim(),
                bio: profile.bio,
                avatar: profile.avatar || '',
                favoriteMode: profile.favoriteMode,
            });
            setUser(data.user);
            play('success');
            setNotice('profile', {
                type: 'success',
                text: data.message || 'Profile updated.',
            });
        } catch (err) {
            play('error');
            setNotice('profile', {
                type: 'error',
                text: err.friendlyMessage || 'Could not save your profile.',
            });
        } finally {
            setSavingSection('');
        }
    };

    const savePreferences = async (scope, changes, successText) => {
        if (savingSection) return;
        setSavingSection(scope);
        setNotice(scope, null);

        try {
            const data = await userApi.updateMe({ preferences: changes });
            setUser(data.user);
            play('success');
            setNotice(scope, { type: 'success', text: successText });
        } catch (err) {
            play('error');
            setNotice(scope, {
                type: 'error',
                text: err.friendlyMessage || 'Could not save your preferences.',
            });
        } finally {
            setSavingSection('');
        }
    };

    const handlePasswordSave = async (event) => {
        event.preventDefault();
        if (savingSection) return;
        setPasswordNotice(null);

        if (passwordForm.newPassword.length < 8) {
            setPasswordNotice({
                type: 'error',
                text: 'New password must be at least 8 characters.',
            });
            return;
        }
        if (hasPassword && !passwordForm.currentPassword) {
            setPasswordNotice({
                type: 'error',
                text: 'Enter your current password to change it.',
            });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordNotice({ type: 'error', text: 'The new passwords do not match.' });
            return;
        }

        const policy = evaluatePassword(passwordForm.newPassword, {
            email: user?.email,
            name: user?.displayName,
        });
        if (!policy.valid) {
            setPasswordNotice({ type: 'error', text: policy.message });
            return;
        }

        setSavingSection('password');
        try {
            const data = await userApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            if (data.user) setUser(data.user);
            play('success');
            setPasswordNotice({
                type: 'success',
                text: data.message || 'Password updated.',
            });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            play('error');
            setPasswordNotice({
                type: 'error',
                text: err.friendlyMessage || 'Could not update your password.',
            });
        } finally {
            setSavingSection('');
        }
    };

    const handleLogoutOthers = async () => {
        if (signingOutOthers) return;
        setSigningOutOthers(true);
        setDeviceNotice(null);

        try {
            const data = await userApi.logoutOthers();
            if (data.user) setUser(data.user);
            setDeviceNotice({
                type: 'success',
                text: data.message || 'All other devices have been signed out.',
            });
            loadSecurity();
        } catch (err) {
            setDeviceNotice({
                type: 'error',
                text: err.friendlyMessage || 'Could not sign out your other devices.',
            });
        } finally {
            setSigningOutOthers(false);
        }
    };

    const handleRequestVerification = async () => {
        if (emailAction.sending) return;
        setEmailAction({ sending: true, error: '' });

        try {
            const data = await authApi.requestEmailVerification();
            if (data.verificationId) {
                navigate(
                    `/verify-email?verificationId=${encodeURIComponent(
                        data.verificationId
                    )}&purpose=email_verification`,
                    {
                        state: {
                            email: data.email,
                            devOtp: data.devOtp,
                            expiresAt: data.expiresAt,
                        },
                    }
                );
                return;
            }
            setEmailAction({ sending: false, error: 'Could not start email verification.' });
        } catch (err) {
            const payload = err.response?.data;
            if (payload?.alreadyVerified && payload.user) setUser(payload.user);
            setEmailAction({
                sending: false,
                error: err.friendlyMessage || 'Could not send a verification code.',
            });
        }
    };

    const handleDeactivate = async (event) => {
        event.preventDefault();
        if (deactivating) return;
        setDeactivateError('');

        if (deactivateForm.confirm !== 'DELETE') {
            setDeactivateError('Type DELETE in capitals to confirm.');
            return;
        }
        if (hasPassword && !deactivateForm.password) {
            setDeactivateError('Enter your current password to deactivate your account.');
            return;
        }

        setDeactivating(true);
        try {
            await userApi.deactivate({
                confirm: deactivateForm.confirm,
                password: deactivateForm.password,
            });
            setUser(null);
            setStats(null);
            navigate('/', { replace: true });
        } catch (err) {
            setDeactivateError(
                err.friendlyMessage || 'Could not deactivate your account.'
            );
        } finally {
            setDeactivating(false);
        }
    };

    const failedLogins = useMemo(
        () =>
            (loginData?.history || [])
                .filter((entry) => entry.success === false)
                .slice(0, 6),
        [loginData]
    );

    const statCards = useMemo(
        () => [
            { icon: <Trophy size={18} />, label: 'Total points', value: stats?.totalPoints ?? 0 },
            {
                icon: <Gamepad2 size={18} />,
                label: 'Games played',
                value: stats?.gamesPlayed ?? 0,
                color: 'from-sky-300 to-sky-500',
            },
            {
                icon: <Target size={18} />,
                label: 'Win rate',
                value: `${winRate}%`,
                color: 'from-emerald-300 to-emerald-500',
            },
            {
                icon: <Flame size={18} />,
                label: 'Current streak',
                value: stats?.currentStreak ?? 0,
                color: 'from-orange-300 to-orange-500',
            },
            {
                icon: <Crown size={18} />,
                label: 'Best streak',
                value: stats?.bestStreak ?? 0,
                color: 'from-violet-300 to-violet-500',
            },
            {
                icon: <Zap size={18} />,
                label: 'Fastest answer',
                value: stats?.fastestAnswerMs
                    ? `${(stats.fastestAnswerMs / 1000).toFixed(1)}s`
                    : '—',
                color: 'from-pink-300 to-pink-500',
            },
        ],
        [stats, winRate]
    );

    const favouriteLabel =
        MODE_LIST.find((mode) => mode.id === normalizeModeId(user?.favoriteMode))?.label ||
        'Standard · Easy';

    if (!user) return null;

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
                <div className="mb-5">
                    <p className="text-sm font-extrabold uppercase tracking-widest text-banana-600">
                        Account centre
                    </p>
                    <h1 className="font-display text-4xl font-extrabold text-banana-900">
                        Profile &amp; settings
                    </h1>
                    <p className="mt-1 text-banana-700">
                        Manage your public identity, game defaults, notifications, privacy,
                        security and data.
                    </p>
                </div>

                <div className="mb-4 flex items-center justify-between gap-3">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-1.5 text-sm font-bold text-banana-700 hover:underline"
                    >
                        <ArrowLeft size={17} /> Back to dashboard
                    </Link>
                    <Link
                        to="/achievements"
                        className="flex items-center gap-1.5 text-sm font-bold text-banana-700 hover:underline"
                    >
                        <Trophy size={16} /> Achievements
                    </Link>
                </div>

                {verifiedBanner && (
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3">
                        <MailCheck size={20} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                        <div className="min-w-0 flex-1">
                            <p className="font-display text-base font-extrabold text-emerald-800">
                                Email verified
                            </p>
                            <p className="text-xs font-semibold text-emerald-700">
                                Your address is confirmed. Recovery and security emails can now
                                reach you.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setVerifiedBanner(false)}
                            className="rounded-lg px-2 py-1 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Identity card */}
                <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <Card className="mb-5 !p-5 md:!p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-banana-300 bg-banana-100 font-display text-2xl font-extrabold text-banana-600 shadow-game-sm">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        initials(user.displayName)
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="break-words font-display text-3xl font-extrabold leading-tight text-banana-800">
                                        {user.displayName}
                                    </h2>
                                    <p className="flex min-w-0 flex-wrap items-center gap-1.5 break-all text-sm text-banana-600">
                                        <Mail size={14} /> {user.email}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        {user.providerNames?.map((provider) => (
                                            <span
                                                key={provider}
                                                className="rounded-full bg-banana-200 px-2.5 py-0.5 text-[11px] font-bold capitalize text-banana-800"
                                            >
                                                {provider}
                                            </span>
                                        ))}
                                        {user.emailVerified ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700">
                                                <MailCheck size={12} /> Email verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700">
                                                <CircleAlert size={12} /> Email not verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-banana-500">
                                        Joined
                                    </dt>
                                    <dd className="font-bold text-banana-800">
                                        {formatDate(user.createdAt)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-banana-500">
                                        Last login
                                    </dt>
                                    <dd className="font-bold text-banana-800">
                                        {formatRelative(user.lastLoginAt)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-banana-500">
                                        Favourite mode
                                    </dt>
                                    <dd className="font-bold text-banana-800">{favouriteLabel}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-banana-500">
                                        Email status
                                    </dt>
                                    <dd
                                        className={`font-bold ${
                                            user.emailVerified
                                                ? 'text-emerald-700'
                                                : 'text-amber-700'
                                        }`}
                                    >
                                        {user.emailVerified
                                            ? user.emailVerifiedAt
                                                ? `Verified ${formatDate(user.emailVerifiedAt)}`
                                                : 'Verified'
                                            : 'Needs verification'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </Card>

                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {statCards.map((card) => (
                            <StatCard key={card.label} {...card} />
                        ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                        <aside
                            className="h-fit overflow-x-auto rounded-3xl border-4 border-banana-300 bg-white/90 p-2 shadow-game lg:p-3"
                            aria-label="Profile settings navigation"
                        >
                            <div className="flex gap-1 lg:block">
                                {TABS.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => selectTab(id)}
                                        aria-current={activeTab === id ? 'page' : undefined}
                                        className={`mb-0 flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-extrabold transition lg:mb-1 lg:w-full ${
                                            activeTab === id
                                                ? 'bg-banana-300 text-banana-900'
                                                : 'text-banana-700 hover:bg-banana-100'
                                        }`}
                                    >
                                        <Icon size={17} className="flex-shrink-0" />
                                        <span className="whitespace-nowrap">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className="min-w-0 space-y-5">
                            {activeTab === 'profile' && (
                                <ProfileSection
                                    profile={profile}
                                    updateProfileField={updateProfileField}
                                    onSubmit={saveProfile}
                                    saving={savingSection === 'profile'}
                                    notice={notices.profile}
                                    user={user}
                                    onVerify={handleRequestVerification}
                                    emailAction={emailAction}
                                    play={play}
                                />
                            )}

                            {activeTab === 'appearance' && (
                                <AppearanceSection
                                    preferences={preferences}
                                    updatePreference={updatePreference}
                                    onThemeSelect={handleThemeSelect}
                                    onSubmit={() =>
                                        savePreferences(
                                            'appearance',
                                            {
                                                theme: preferences.theme,
                                                compactMode: preferences.compactMode,
                                                reducedMotion: preferences.reducedMotion,
                                                defaultMode: preferences.defaultMode,
                                            },
                                            'Appearance settings saved.'
                                        )
                                    }
                                    saving={savingSection === 'appearance'}
                                    notice={notices.appearance}
                                />
                            )}

                            {activeTab === 'gameplay' && (
                                <GameplaySection
                                    preferences={preferences}
                                    updatePreference={updatePreference}
                                    onSubmit={() =>
                                        savePreferences(
                                            'gameplay',
                                            {
                                                autoSubmit: preferences.autoSubmit,
                                                celebrations: preferences.celebrations,
                                                showKeyboardHints:
                                                    preferences.showKeyboardHints,
                                                showTimer: preferences.showTimer,
                                                confirmQuit: preferences.confirmQuit,
                                                defaultQuizCount: Number(
                                                    preferences.defaultQuizCount
                                                ),
                                                defaultTime: Number(preferences.defaultTime),
                                            },
                                            'Gameplay settings saved.'
                                        )
                                    }
                                    saving={savingSection === 'gameplay'}
                                    notice={notices.gameplay}
                                />
                            )}

                            {activeTab === 'notifications' && (
                                <NotificationsSection
                                    preferences={preferences}
                                    updatePreference={updatePreference}
                                    onSubmit={() =>
                                        savePreferences(
                                            'notifications',
                                            {
                                                emailNotifications:
                                                    preferences.emailNotifications,
                                                loginAlerts: preferences.loginAlerts,
                                                productUpdates: preferences.productUpdates,
                                            },
                                            'Notification preferences saved.'
                                        )
                                    }
                                    saving={savingSection === 'notifications'}
                                    notice={notices.notifications}
                                />
                            )}

                            {activeTab === 'security' && (
                                <SecuritySection
                                    user={user}
                                    hasPassword={hasPassword}
                                    security={security}
                                    loadingSecurity={loadingSecurity}
                                    securityError={securityError}
                                    passwordForm={passwordForm}
                                    setPasswordForm={setPasswordForm}
                                    onPasswordSubmit={handlePasswordSave}
                                    savingPassword={savingSection === 'password'}
                                    passwordNotice={passwordNotice}
                                    emailAction={emailAction}
                                    onVerify={handleRequestVerification}
                                    signingOutOthers={signingOutOthers}
                                    onLogoutOthers={handleLogoutOthers}
                                    deviceNotice={deviceNotice}
                                />
                            )}

                            {activeTab === 'activity' && (
                                <ActivitySection
                                    user={user}
                                    stats={stats}
                                    loginData={loginData}
                                    loginError={loginError}
                                    loadingLogins={loadingLogins}
                                    failedLogins={failedLogins}
                                    onRefresh={loadSecurity}
                                    loadingSecurity={loadingSecurity}
                                />
                            )}

                            {activeTab === 'privacy' && (
                                <PrivacySection
                                    preferences={preferences}
                                    updatePreference={updatePreference}
                                    onSubmit={() =>
                                        savePreferences(
                                            'privacy',
                                            {
                                                showOnLeaderboard:
                                                    preferences.showOnLeaderboard,
                                            },
                                            'Privacy settings saved.'
                                        )
                                    }
                                    saving={savingSection === 'privacy'}
                                    notice={notices.privacy}
                                    user={user}
                                    stats={stats}
                                    security={security}
                                    loginData={loginData}
                                />
                            )}

                            {activeTab === 'danger-zone' && (
                                <DangerZoneSection
                                    user={user}
                                    hasPassword={hasPassword}
                                    form={deactivateForm}
                                    setForm={setDeactivateForm}
                                    onSubmit={handleDeactivate}
                                    deactivating={deactivating}
                                    error={deactivateError}
                                    setError={setDeactivateError}
                                />
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

function ProfileSection({
    profile,
    updateProfileField,
    onSubmit,
    saving,
    notice,
    user,
    onVerify,
    emailAction,
    play,
}) {
    const [avatarPreview, setAvatarPreview] = useState({
        status: 'idle',
        src: '',
        message: '',
    });

    useEffect(() => {
        setAvatarPreview({ status: 'idle', src: '', message: '' });
    }, [profile.avatar]);

    const previewAvatar = () => {
        const url = profile.avatar.trim();
        if (!url) {
            setAvatarPreview({
                status: 'error',
                src: '',
                message: 'Paste an image URL first, or leave it empty to use your initials.',
            });
            play?.('error');
            return;
        }

        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            parsed = null;
        }
        if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
            setAvatarPreview({
                status: 'error',
                src: '',
                message: 'Use a complete http or https image link.',
            });
            play?.('error');
            return;
        }

        setAvatarPreview({ status: 'loading', src: url, message: 'Checking image…' });
        play?.('click');

        const image = new window.Image();
        image.onload = () => {
            setAvatarPreview({
                status: 'ok',
                src: url,
                message: 'Image loaded — save your profile to apply it.',
            });
            play?.('success');
        };
        image.onerror = () => {
            setAvatarPreview({
                status: 'error',
                src: '',
                message: 'Could not load that image. Check the link or try another one.',
            });
            play?.('error');
        };
        image.src = url;
    };

    return (
        <>
            <Card className="!p-5 md:!p-6">
                <SectionHeading
                    icon={<UserRound size={20} />}
                    title="Account details"
                    subtitle="Update how you appear across Banana Quiz."
                />

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Display name" htmlFor="displayName">
                            <input
                                id="displayName"
                                value={profile.name}
                                onChange={updateProfileField('name')}
                                required
                                minLength={2}
                                maxLength={60}
                                className={inputClass}
                                placeholder="Your name"
                            />
                        </Field>
                        <Field label="Favourite mode" htmlFor="favoriteMode">
                            <select
                                id="favoriteMode"
                                value={profile.favoriteMode}
                                onChange={updateProfileField('favoriteMode')}
                                className={inputClass}
                            >
                                {MODE_LIST.map((mode) => (
                                    <option key={mode.id} value={mode.id}>
                                        {mode.label} — {mode.tagline}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <Field
                        label="Email"
                        htmlFor="email"
                        hint={
                            user.emailVerified
                                ? 'Verified'
                                : 'Verification recommended'
                        }
                    >
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                                id="email"
                                value={user.email}
                                readOnly
                                disabled
                                className={`${inputClass} opacity-60`}
                            />
                            {!user.emailVerified && (
                                <Button
                                    variant="secondary"
                                    onClick={onVerify}
                                    disabled={emailAction.sending}
                                    className="flex-shrink-0 !py-2.5 !text-sm"
                                >
                                    <MailCheck size={16} />
                                    {emailAction.sending ? 'Sending…' : 'Verify'}
                                </Button>
                            )}
                        </div>
                        {emailAction.error && (
                            <p className="mt-2 text-xs font-semibold text-red-600">
                                {emailAction.error}
                            </p>
                        )}
                    </Field>

                    <Field
                        label="Avatar image URL"
                        htmlFor="avatar"
                        hint="Paste a public https image link. Leave empty for your initials."
                    >
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="flex flex-1 items-center gap-2">
                                <Image size={18} className="flex-shrink-0 text-banana-500" />
                                <input
                                    id="avatar"
                                    type="url"
                                    value={profile.avatar}
                                    onChange={updateProfileField('avatar')}
                                    className={inputClass}
                                    placeholder="https://example.com/avatar.png"
                                />
                            </div>
                            <Button
                                variant="secondary"
                                onClick={previewAvatar}
                                disabled={avatarPreview.status === 'loading'}
                                className="flex-shrink-0 !py-2.5 !text-sm"
                            >
                                <Eye size={16} />
                                {avatarPreview.status === 'loading' ? 'Checking…' : 'Preview'}
                            </Button>
                        </div>

                        <div
                            className={`mt-3 flex items-center gap-3 rounded-2xl border-2 p-3 ${
                                avatarPreview.status === 'error'
                                    ? 'border-red-200 bg-red-50'
                                    : avatarPreview.status === 'ok'
                                      ? 'border-emerald-200 bg-emerald-50'
                                      : 'border-banana-200 bg-banana-50'
                            }`}
                            aria-live="polite"
                        >
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-banana-300 bg-banana-100 font-display text-xl font-extrabold text-banana-600">
                                {avatarPreview.status === 'ok' ? (
                                    <img
                                        src={avatarPreview.src}
                                        alt="Avatar preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : avatarPreview.status === 'loading' ? (
                                    <RefreshCw size={20} className="animate-spin text-banana-500" />
                                ) : profile.avatar.trim() ? (
                                    <Image size={22} className="text-banana-400" />
                                ) : (
                                    initials(profile.name || user.displayName)
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-extrabold text-banana-800">
                                    {avatarPreview.status === 'ok'
                                        ? 'Avatar preview ready'
                                        : avatarPreview.status === 'error'
                                          ? 'Avatar preview problem'
                                          : avatarPreview.status === 'loading'
                                            ? 'Checking avatar'
                                            : 'Avatar preview'}
                                </p>
                                <p
                                    className={`text-xs font-semibold ${
                                        avatarPreview.status === 'error'
                                            ? 'text-red-700'
                                            : avatarPreview.status === 'ok'
                                              ? 'text-emerald-700'
                                              : 'text-banana-600'
                                    }`}
                                >
                                    {avatarPreview.message ||
                                        'Preview the image before saving to make sure the link works.'}
                                </p>
                            </div>
                        </div>
                    </Field>

                    <Field
                        label="Bio"
                        htmlFor="bio"
                        hint={`${profile.bio.length}/160 characters`}
                    >
                        <textarea
                            id="bio"
                            value={profile.bio}
                            onChange={updateProfileField('bio')}
                            maxLength={160}
                            rows={3}
                            className={`${inputClass} resize-none`}
                            placeholder="Tell other players about your banana-value calculation skills…"
                        />
                    </Field>

                    <Notice notice={notice} />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving} className="!py-2.5 !text-base">
                            <Save size={17} /> {saving ? 'Saving…' : 'Save profile'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="!p-5">
                <SectionHeading
                    icon={<ShieldCheck size={20} />}
                    title="Sign-in methods"
                    subtitle="Ways you can access this account."
                    noMargin
                />
                <div className="mt-3 flex flex-wrap gap-2">
                    {user.providerNames?.map((provider) => (
                        <span
                            key={provider}
                            className="rounded-full bg-banana-100 px-3 py-1 text-sm font-bold capitalize text-banana-800"
                        >
                            {provider === 'local' ? 'Email & password' : provider}
                        </span>
                    ))}
                </div>
                <p className="mt-3 text-xs font-semibold text-banana-600">
                    Manage passwords in Security. Social providers stay linked automatically.
                </p>
            </Card>
        </>
    );
}

function AppearanceSection({
    preferences,
    updatePreference,
    onThemeSelect,
    onSubmit,
    saving,
    notice,
}) {
    return (
        <Card className="!p-5 md:!p-6">
            <SectionHeading
                icon={<Palette size={20} />}
                title="Appearance & play defaults"
                subtitle="Choose the theme, density and which mode loads first."
            />

            <div className="space-y-4">
                <div className="rounded-2xl border-2 border-banana-200 bg-banana-50 p-4">
                    <p className="mb-3 flex items-center gap-2 font-bold text-banana-800">
                        <Palette size={17} /> Theme
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {THEME_OPTIONS.map((option) => {
                            const selected = preferences.theme === option.id;
                            const Icon = option.id === 'dark' ? Moon : Sun;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onThemeSelect(option.id)}
                                    aria-pressed={selected}
                                    className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition ${
                                        selected
                                            ? 'border-banana-500 bg-banana-200 shadow-game-sm'
                                            : 'border-banana-200 bg-white hover:border-banana-300'
                                    }`}
                                >
                                    <span
                                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                                            selected
                                                ? 'bg-banana-500 text-white'
                                                : 'bg-banana-100 text-banana-600'
                                        }`}
                                    >
                                        <Icon size={18} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-extrabold text-banana-900">
                                            {option.label}
                                            {selected ? ' · selected' : ''}
                                        </span>
                                        <span className="block text-xs font-semibold text-banana-600">
                                            {option.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-banana-500">
                        Light is the default. Theme changes preview instantly and save with this
                        section.
                    </p>
                </div>

                <PreferenceToggle
                    label="Compact layout"
                    description="Tighter cards and spacing so more of the game fits on screen."
                    checked={preferences.compactMode}
                    onChange={updatePreference('compactMode')}
                />

                <PreferenceToggle
                    label="Reduce motion"
                    description="Turn off decorative floating and wiggling animations."
                    checked={preferences.reducedMotion}
                    onChange={updatePreference('reducedMotion')}
                />

                <div className="border-t border-banana-200 pt-4">
                    <Field
                        label="Default game mode"
                        htmlFor="defaultMode"
                        hint="Used by the dashboard and play page"
                    >
                        <select
                            id="defaultMode"
                            value={preferences.defaultMode}
                            onChange={updatePreference('defaultMode')}
                            className={inputClass}
                        >
                            {MODE_LIST.map((mode) => (
                                <option key={mode.id} value={mode.id}>
                                    {mode.label} — {mode.tagline}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="border-t border-banana-200 pt-4">
                    <p className="mb-3 flex items-center gap-2 font-bold text-banana-800">
                        <Gamepad2 size={17} /> Sound &amp; music
                    </p>
                    <AudioControls />
                    <p className="mt-2 text-xs font-semibold text-banana-500">
                        Audio settings are stored on this device. The background track loops the
                        bundled game music.
                    </p>
                </div>

                <Notice notice={notice} />

                <div className="flex justify-end">
                    <Button type="button" onClick={onSubmit} disabled={saving} className="!py-2.5 !text-base">
                        <Save size={17} /> {saving ? 'Saving…' : 'Save appearance'}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function GameplaySection({ preferences, updatePreference, onSubmit, saving, notice }) {
    return (
        <Card className="!p-5 md:!p-6">
            <SectionHeading
                icon={<Gamepad2 size={20} />}
                title="Gameplay & controls"
                subtitle="Tune how answering, celebrations and the game screen behave."
            />

            <div className="space-y-4">
                <PreferenceToggle
                    label="Auto-submit answers"
                    description="Submit automatically when you pause after typing. Turn off to use the Submit answer button."
                    checked={preferences.autoSubmit}
                    onChange={updatePreference('autoSubmit')}
                />
                <PreferenceToggle
                    label="Celebration animations"
                    description="Show a confetti burst when an answer is correct."
                    checked={preferences.celebrations}
                    onChange={updatePreference('celebrations')}
                />
                <PreferenceToggle
                    label="Show keyboard hints"
                    description="Display the digits, Backspace and Enter hint under the keypad."
                    checked={preferences.showKeyboardHints}
                    onChange={updatePreference('showKeyboardHints')}
                />
                <PreferenceToggle
                    label="Show countdown timer"
                    description="Display the remaining-time bar. Turn off for a calmer, timer-free view."
                    checked={preferences.showTimer}
                    onChange={updatePreference('showTimer')}
                />
                <PreferenceToggle
                    label="Confirm before quitting"
                    description="Ask for confirmation before leaving a game so a stray tap does not end your run."
                    checked={preferences.confirmQuit}
                    onChange={updatePreference('confirmQuit')}
                />

                <div className="grid gap-4 border-t border-banana-200 pt-4 sm:grid-cols-2">
                    <Field
                        label="Default quiz count"
                        htmlFor="defaultQuizCount"
                        hint="Custom mode"
                    >
                        <select
                            id="defaultQuizCount"
                            value={preferences.defaultQuizCount}
                            onChange={updatePreference('defaultQuizCount')}
                            className={inputClass}
                        >
                            {QUIZ_COUNT_OPTIONS.map((count) => (
                                <option key={count} value={count}>
                                    {count} quizzes
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field
                        label="Default time per quiz"
                        htmlFor="defaultTime"
                        hint="Custom mode"
                    >
                        <select
                            id="defaultTime"
                            value={preferences.defaultTime}
                            onChange={updatePreference('defaultTime')}
                            className={inputClass}
                        >
                            {TIME_LIMIT_OPTIONS.map((seconds) => (
                                <option key={seconds} value={seconds}>
                                    {seconds} seconds
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <p className="rounded-2xl bg-banana-50 p-3 text-xs font-semibold text-banana-600">
                    Auto-submit waits about a second after your last digit. Press Enter to submit
                    immediately, or turn auto-submit off to bring back the Submit answer button.
                </p>

                <Notice notice={notice} />

                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={saving}
                        className="!py-2.5 !text-base"
                    >
                        <Save size={17} /> {saving ? 'Saving…' : 'Save gameplay'}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function NotificationsSection({ preferences, updatePreference, onSubmit, saving, notice }) {
    return (
        <Card className="!p-5 md:!p-6">
            <SectionHeading
                icon={<Bell size={20} />}
                title="Email notifications"
                subtitle="Choose which optional emails you receive."
            />

            <div className="space-y-4">
                <PreferenceToggle
                    label="Account and game emails"
                    description="Welcome messages and important account activity."
                    checked={preferences.emailNotifications}
                    onChange={updatePreference('emailNotifications')}
                />
                <PreferenceToggle
                    label="New sign-in alerts"
                    description="Email me when my account is used to sign in from a new place."
                    checked={preferences.loginAlerts}
                    onChange={updatePreference('loginAlerts')}
                />
                <PreferenceToggle
                    label="Product updates"
                    description="Occasional news about new modes, features and events."
                    checked={preferences.productUpdates}
                    onChange={updatePreference('productUpdates')}
                />

                <div className="rounded-2xl bg-banana-50 p-4 text-xs font-semibold text-banana-600">
                    Password reset codes and verification codes are security messages and are
                    always sent when you request them.
                </div>

                <Notice notice={notice} />

                <div className="flex justify-end">
                    <Button type="button" onClick={onSubmit} disabled={saving} className="!py-2.5 !text-base">
                        <Save size={17} /> {saving ? 'Saving…' : 'Save notifications'}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function SecuritySection({
    user,
    hasPassword,
    security,
    loadingSecurity,
    securityError,
    passwordForm,
    setPasswordForm,
    onPasswordSubmit,
    savingPassword,
    passwordNotice,
    emailAction,
    onVerify,
    signingOutOthers,
    onLogoutOthers,
    deviceNotice,
}) {
    const checks = Array.isArray(security?.checks) ? security.checks : [];
    const passedChecks = checks.filter((check) => check.passed).length;
    const securityScore = Math.max(0, Math.min(100, Number(security?.score) || 0));

    return (
        <>
            <Card className="!p-5 md:!p-6">
                <SectionHeading
                    icon={<MailCheck size={20} />}
                    title="Email verification"
                    subtitle="Confirm the address used for account recovery and security alerts."
                    noMargin
                />

                {user.emailVerified ? (
                    <div className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                        <ShieldCheck
                            size={22}
                            className="mt-0.5 flex-shrink-0 text-emerald-600"
                        />
                        <div>
                            <p className="font-display text-lg font-extrabold text-emerald-800">
                                Verified
                            </p>
                            <p className="break-all text-sm font-semibold text-emerald-700">
                                {user.email}
                                {user.emailVerifiedAt
                                    ? ` · confirmed ${formatDate(user.emailVerifiedAt)}`
                                    : ''}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-emerald-700">
                                Your email can receive password resets and sign-in alerts.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                        <p className="font-display text-lg font-extrabold text-amber-900">
                            Not verified yet
                        </p>
                        <p className="mt-1 text-sm font-semibold text-amber-800">
                            We send a 6-digit code to{' '}
                            <strong className="break-all">{user.email}</strong>. Enter it to
                            unlock recovery emails and add a completed security check.
                        </p>
                        <Button
                            variant="secondary"
                            onClick={onVerify}
                            disabled={emailAction.sending}
                            className="mt-3 !py-2.5 !text-base"
                        >
                            <Mail size={17} />
                            {emailAction.sending ? 'Sending code…' : 'Send verification code'}
                        </Button>
                        {emailAction.error && (
                            <p className="mt-2 text-sm font-semibold text-red-600">
                                {emailAction.error}
                            </p>
                        )}
                    </div>
                )}
            </Card>

            <Card className="!p-5 md:!p-6">
                <SectionHeading
                    icon={<KeyRound size={20} />}
                    title={hasPassword ? 'Change password' : 'Add a password'}
                    subtitle={
                        hasPassword
                            ? 'Use at least 8 characters. Your current password is required.'
                            : 'Set a password so you can sign in without a social provider.'
                    }
                />

                <form onSubmit={onPasswordSubmit} className="space-y-4">
                    {hasPassword && (
                        <PasswordInput
                            id="currentPassword"
                            label="Current password"
                            value={passwordForm.currentPassword}
                            onChange={(event) =>
                                setPasswordForm((prev) => ({
                                    ...prev,
                                    currentPassword: event.target.value,
                                }))
                            }
                            autoComplete="current-password"
                            maxLength={72}
                            placeholder="Current password"
                            inputClassName={inputClass}
                        />
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <PasswordInput
                            id="newPassword"
                            label="New password"
                            value={passwordForm.newPassword}
                            onChange={(event) =>
                                setPasswordForm((prev) => ({
                                    ...prev,
                                    newPassword: event.target.value,
                                }))
                            }
                            autoComplete="new-password"
                            minLength={8}
                            placeholder="At least 8 characters"
                            inputClassName={inputClass}
                        />
                        <PasswordInput
                            id="confirmPassword"
                            label="Confirm new password"
                            value={passwordForm.confirmPassword}
                            onChange={(event) =>
                                setPasswordForm((prev) => ({
                                    ...prev,
                                    confirmPassword: event.target.value,
                                }))
                            }
                            autoComplete="new-password"
                            minLength={8}
                            placeholder="Repeat new password"
                            inputClassName={inputClass}
                        />
                    </div>

                    <PasswordStrengthMeter
                        password={passwordForm.newPassword}
                        email={user?.email}
                        name={user?.displayName}
                    />

                    {passwordForm.confirmPassword.length > 0 &&
                        passwordForm.newPassword !== passwordForm.confirmPassword && (
                            <p className="text-xs font-semibold text-red-600">
                                The new passwords do not match yet.
                            </p>
                        )}

                    <Notice notice={passwordNotice} />

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            variant="secondary"
                            disabled={savingPassword}
                            className="!py-2.5 !text-base"
                        >
                            <ShieldCheck size={17} />{' '}
                            {savingPassword
                                ? 'Updating…'
                                : hasPassword
                                  ? 'Update password'
                                  : 'Add password'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="!p-5 md:!p-6">
                <SectionHeading
                    icon={<ShieldCheck size={20} />}
                    title="Account security overview"
                    subtitle="Live checks on how protected your account is."
                />

                {loadingSecurity && !security && (
                    <p className="py-4 text-center text-xs font-semibold text-banana-500">
                        Checking your account…
                    </p>
                )}

                {securityError && <Notice type="error" text={securityError} />}

                {security && (
                    <>
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl ${
                                    securityScore >= 75
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : securityScore >= 50
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-red-100 text-red-700'
                                }`}
                            >
                                <span className="font-display text-xl font-extrabold leading-none">
                                    {securityScore}%
                                </span>
                                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">
                                    secure
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-extrabold text-banana-800">
                                    {security.level || 'Account security'}
                                </p>
                                <p className="text-[11px] text-banana-500">
                                    {passedChecks}/{checks.length} checks passed
                                </p>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-banana-200">
                                    <div
                                        className={`h-full rounded-full ${
                                            securityScore >= 75
                                                ? 'bg-emerald-500'
                                                : securityScore >= 50
                                                  ? 'bg-amber-400'
                                                  : 'bg-red-500'
                                        }`}
                                        style={{ width: `${securityScore}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <ul className="mt-4 space-y-2">
                            {checks.map((check) => (
                                <li
                                    key={check.id}
                                    title={check.hint}
                                    className="flex items-start gap-2 text-xs font-semibold"
                                >
                                    {check.passed ? (
                                        <Check
                                            size={15}
                                            className="mt-0.5 flex-shrink-0 text-emerald-600"
                                        />
                                    ) : (
                                        <CircleAlert
                                            size={15}
                                            className="mt-0.5 flex-shrink-0 text-amber-500"
                                        />
                                    )}
                                    <span
                                        className={
                                            check.passed
                                                ? 'text-emerald-700'
                                                : 'text-banana-600'
                                        }
                                    >
                                        {check.label}
                                        <span className="block text-[11px] font-semibold text-banana-500">
                                            {check.hint}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 flex flex-wrap gap-4 border-t border-banana-100 pt-3 text-[11px] text-banana-500">
                            <p className="flex items-center gap-1.5">
                                <Activity size={12} />
                                Last sign-in:{' '}
                                <span className="font-bold text-banana-700">
                                    {formatRelative(security.lastSuccessAt)}
                                </span>
                            </p>
                            <p className="flex items-center gap-1.5">
                                <ShieldAlert size={12} />
                                Failed attempts:{' '}
                                <span className="font-bold text-banana-700">
                                    {security.failedLogins}
                                </span>
                            </p>
                        </div>
                    </>
                )}

                <div className="mt-4 border-t border-banana-100 pt-4">
                    <Button
                        variant="secondary"
                        onClick={onLogoutOthers}
                        disabled={signingOutOthers}
                        className="w-full !py-2.5 !text-base"
                    >
                        <LogOut size={17} />{' '}
                        {signingOutOthers ? 'Signing out…' : 'Sign out other devices'}
                    </Button>
                    {deviceNotice && (
                        <div className="mt-3">
                            <Notice notice={deviceNotice} />
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
}

function ActivitySection({
    user,
    stats,
    loginData,
    loginError,
    loadingLogins,
    failedLogins,
    onRefresh,
    loadingSecurity,
}) {
    const history = Array.isArray(loginData?.history) ? loginData.history : [];
    const devices = Array.isArray(loginData?.devices) ? loginData.devices : [];

    return (
        <>
            <Card className="!p-5 md:!p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <SectionHeading
                        icon={<ListChecks size={20} />}
                        title="Login history"
                        subtitle="Every recent sign-in attempt, including failed ones."
                        noMargin
                    />
                    <button
                        type="button"
                        onClick={onRefresh}
                        title="Refresh activity"
                        className="rounded-xl p-2 text-banana-600 hover:bg-banana-100"
                    >
                        <RefreshCw
                            size={17}
                            className={loadingLogins || loadingSecurity ? 'animate-spin' : ''}
                        />
                    </button>
                </div>

                {loginError && <Notice type="error" text={loginError} />}

                {loadingLogins && !loginData && (
                    <p className="py-6 text-center text-sm font-semibold text-banana-500">
                        Loading sign-ins…
                    </p>
                )}

                {loginData && history.length === 0 && (
                    <p className="py-6 text-center text-sm font-semibold text-banana-500">
                        No sign-ins recorded yet.
                    </p>
                )}

                <ul className="divide-y divide-banana-100">
                    {history.map((entry) => {
                        const Icon = DEVICE_ICONS[entry.deviceType] || Monitor;
                        const failed = entry.success === false;
                        return (
                            <li key={entry.id} className="flex items-center gap-3 py-3">
                                <div
                                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                                        failed
                                            ? 'bg-red-50 text-red-600'
                                            : 'bg-banana-100 text-banana-700'
                                    }`}
                                >
                                    <Icon size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-banana-800">
                                        <span className="truncate">{entry.device}</span>
                                        {entry.current && (
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700">
                                                This device
                                            </span>
                                        )}
                                        {failed && (
                                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-red-700">
                                                {REASON_LABELS[entry.reason] || 'Failed'}
                                            </span>
                                        )}
                                    </p>
                                    <p className="break-words text-xs text-banana-500">
                                        {METHOD_LABELS[entry.method] || entry.method} ·{' '}
                                        {entry.email || user.email} · {entry.ip} ·{' '}
                                        {formatDateTime(entry.at)}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </Card>

            <div className="grid gap-5 sm:grid-cols-2">
                <Card className="!p-5">
                    <SectionHeading
                        icon={<CalendarDays size={20} />}
                        title="Devices"
                        subtitle="Where you are signed in."
                        noMargin
                    />
                    <div className="mt-3 space-y-2">
                        {devices.map((device) => {
                            const Icon = DEVICE_ICONS[device.deviceType] || Monitor;
                            return (
                                <div
                                    key={device.id}
                                    className={`rounded-xl border-2 p-2.5 ${
                                        device.current
                                            ? 'border-emerald-300 bg-emerald-50'
                                            : 'border-banana-200 bg-white/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon size={16} className="text-banana-600" />
                                        <p className="flex-1 truncate text-sm font-bold text-banana-800">
                                            {device.device}
                                        </p>
                                        {device.current && (
                                            <Check size={15} className="text-emerald-600" />
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-banana-500">
                                        {device.logins} sign-in
                                        {device.logins === 1 ? '' : 's'} · last{' '}
                                        {formatRelative(device.lastSeenAt)}
                                    </p>
                                </div>
                            );
                        })}
                        {loginData && devices.length === 0 && (
                            <p className="py-3 text-center text-xs font-semibold text-banana-500">
                                No devices yet.
                            </p>
                        )}
                    </div>
                </Card>

                <Card className="!p-5">
                    <SectionHeading
                        icon={<ShieldAlert size={20} />}
                        title="Failed sign-ins"
                        subtitle="Recent attempts that did not get in."
                        noMargin
                    />
                    <div className="mt-3 space-y-2">
                        {failedLogins.length === 0 && (
                            <p className="py-2 text-center text-xs font-semibold text-banana-500">
                                No failed attempts recorded. Nice and quiet.
                            </p>
                        )}
                        {failedLogins.map((entry) => (
                            <div
                                key={`failed-${entry.id}`}
                                className="rounded-xl border-2 border-red-100 bg-red-50/60 p-2.5"
                            >
                                <p className="flex items-center gap-2 text-xs font-bold text-red-700">
                                    <ShieldAlert size={14} className="flex-shrink-0" />
                                    {REASON_LABELS[entry.reason] || 'Sign-in failed'}
                                </p>
                                <p className="mt-0.5 break-words text-[11px] text-banana-500">
                                    {entry.email || user.email} · {entry.ip} ·{' '}
                                    {formatRelative(entry.at)}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="!p-5">
                <SectionHeading
                    icon={<Activity size={20} />}
                    title="Game activity"
                    subtitle="A quick summary of your play."
                    noMargin
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <InfoTile title="Games played" text={`${stats?.gamesPlayed || 0}`} />
                    <InfoTile title="Total points" text={`${stats?.totalPoints || 0}`} />
                    <InfoTile
                        title="Last played"
                        text={stats?.lastPlayedAt ? formatRelative(stats.lastPlayedAt) : 'Never'}
                    />
                </div>
            </Card>
        </>
    );
}

function PrivacySection({
    preferences,
    updatePreference,
    onSubmit,
    saving,
    notice,
    user,
    stats,
    security,
    loginData,
}) {
    return (
        <>
            <Card className="!p-5 md:!p-6">
                <SectionHeading
                    icon={<Eye size={20} />}
                    title="Privacy"
                    subtitle="Choose what other players can see."
                />

                <div className="space-y-4">
                    <PreferenceToggle
                        label="Show me on the leaderboard"
                        description="Hide your display name, avatar and score from public rankings."
                        checked={preferences.showOnLeaderboard}
                        onChange={updatePreference('showOnLeaderboard')}
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                        <InfoTile
                            title="Activity tracking"
                            text="Used to calculate streaks, accuracy and trends."
                        />
                        <InfoTile
                            title="Marketing emails"
                            text="Optional and off by default. Manage them in Notifications."
                        />
                        <InfoTile
                            title="Data retention"
                            text="Your game history stays linked to your account until deactivation."
                        />
                    </div>

                    <Notice notice={notice} />

                    <div className="flex justify-end">
                        <Button type="button" onClick={onSubmit} disabled={saving} className="!py-2.5 !text-base">
                            <Save size={17} /> {saving ? 'Saving…' : 'Save privacy'}
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="!p-5 md:!p-6">
                <SectionHeading
                    icon={<Download size={20} />}
                    title="Your data"
                    subtitle="Download a copy of the information this device can see."
                />
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="secondary"
                        onClick={() =>
                            downloadDataExport({ user, stats, security, loginData })
                        }
                        className="!py-2.5 !text-base"
                    >
                        <Download size={17} /> Download JSON export
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            localStorage.removeItem('banana-cookie-choice');
                            window.location.reload();
                        }}
                        className="!py-2.5 !text-base"
                    >
                        <Settings size={17} /> Review cookie choice
                    </Button>
                </div>
                <p className="mt-3 text-xs font-semibold text-banana-600">
                    The export includes your profile, preferences, statistics, security summary
                    and recent sign-in devices. It never includes password hashes or session
                    secrets.
                </p>
            </Card>
        </>
    );
}

function DangerZoneSection({
    user,
    hasPassword,
    form,
    setForm,
    onSubmit,
    deactivating,
    error,
    setError,
}) {
    return (
        <Card className="!border-red-300 !p-5 md:!p-6">
            <SectionHeading
                icon={<ShieldAlert size={20} />}
                title="Danger zone"
                subtitle="These actions affect access to your account."
            />

            <div className="rounded-2xl border-2 border-red-200 bg-red-50/70 p-4">
                <p className="flex items-center gap-2 font-display text-lg font-extrabold text-red-800">
                    <Trash2 size={19} /> Deactivate account
                </p>
                <p className="mt-1 text-sm font-semibold text-red-700">
                    Your account will be signed out everywhere and can no longer sign in. Your
                    scores and history are kept so support can restore the account if you ask.
                </p>

                <form onSubmit={onSubmit} className="mt-4 space-y-3">
                    <div>
                        <label
                            htmlFor="deactivate-confirm"
                            className="mb-1 block text-sm font-bold text-red-800"
                        >
                            Type <span className="font-mono">DELETE</span> to confirm
                        </label>
                        <input
                            id="deactivate-confirm"
                            value={form.confirm}
                            onChange={(event) => {
                                setForm((prev) => ({ ...prev, confirm: event.target.value }));
                                setError('');
                            }}
                            autoComplete="off"
                            placeholder="DELETE"
                            className={`${inputClass} !border-red-200 focus:!border-red-400`}
                        />
                    </div>

                    {hasPassword && (
                        <PasswordInput
                            id="deactivatePassword"
                            label="Current password"
                            value={form.password}
                            onChange={(event) => {
                                setForm((prev) => ({
                                    ...prev,
                                    password: event.target.value,
                                }));
                                setError('');
                            }}
                            autoComplete="current-password"
                            maxLength={72}
                            placeholder="Confirm with your password"
                            inputClassName={inputClass}
                        />
                    )}

                    {error && (
                        <p className="rounded-xl bg-red-100 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        variant="danger"
                        disabled={deactivating || form.confirm !== 'DELETE'}
                        className="!py-2.5 !text-base"
                    >
                        <Trash2 size={17} />
                        {deactivating ? 'Deactivating…' : 'Deactivate my account'}
                    </Button>
                </form>
            </div>

            <p className="mt-4 text-xs font-semibold text-banana-600">
                Signed in as <strong className="break-all">{user.email}</strong>. You can export
                your data first from Privacy &amp; data.
            </p>
        </Card>
    );
}

function downloadDataExport({ user, stats, security, loginData }) {
    const payload = {
        exportedAt: new Date().toISOString(),
        user: user || null,
        stats: stats || null,
        security: security || null,
        loginDevices: Array.isArray(loginData?.devices) ? loginData.devices : [],
        recentSignIns: Array.isArray(loginData?.history) ? loginData.history : [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `banana-quiz-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function SectionHeading({ icon, title, subtitle, noMargin = false }) {
    return (
        <div className={noMargin ? '' : 'mb-4'}>
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-banana-800">
                <span className="text-banana-500">{icon}</span>
                {title}
            </h2>
            {subtitle && <p className="text-xs text-banana-600">{subtitle}</p>}
        </div>
    );
}

function Field({ label, htmlFor, hint, children }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor={htmlFor} className="text-sm font-bold text-banana-700">
                    {label}
                </label>
                {hint && <span className="text-[11px] text-banana-500">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function PreferenceToggle({ label, description, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
                <span className="block text-sm font-bold text-banana-800">{label}</span>
                <span className="block text-xs text-banana-600">{description}</span>
            </span>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="h-5 w-5 flex-shrink-0 accent-banana-500"
            />
        </label>
    );
}

function InfoTile({ title, text }) {
    return (
        <div className="rounded-2xl border-2 border-banana-200 bg-banana-50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-banana-600">
                {title}
            </p>
            <p className="mt-1 font-bold text-banana-800">{text}</p>
        </div>
    );
}

function Notice({ notice, type, text }) {
    const value = notice || (type && text ? { type, text } : null);
    if (!value) return null;
    const success = value.type === 'success';
    return (
        <p
            role="alert"
            className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
        >
            {success ? (
                <Check size={17} className="mt-0.5 flex-shrink-0" />
            ) : (
                <CircleAlert size={17} className="mt-0.5 flex-shrink-0" />
            )}
            {value.text}
        </p>
    );
}
