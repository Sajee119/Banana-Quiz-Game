import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Trophy,
    Target,
    Flame,
    Zap,
    Crown,
    Gamepad2,
    Settings,
    ShieldCheck,
    KeyRound,
    Monitor,
    Smartphone,
    Tablet,
    CalendarDays,
    Mail,
    Save,
    RefreshCw,
    Check,
    CircleAlert,
    Image,
    UserRound,
    ListChecks,
    LogOut,
    ShieldAlert,
    Activity,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import AudioControls from '../components/AudioControls.jsx';
import StatCard from '../components/StatCard.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.jsx';
import { useAuth } from '../context/auth-context.js';
import { userApi } from '../api/client.js';
import {
    MODE_LIST,
    formatDate,
    formatDateTime,
    formatRelative,
    initials,
} from '../lib/format.js';
import { evaluatePassword } from '../lib/passwordStrength.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

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

export default function ProfilePage() {
    usePageTitle('Account settings');
    const { user, stats, setUser } = useAuth();

    const [profile, setProfile] = useState({
        name: user?.displayName || '',
        bio: user?.bio || '',
        avatar: user?.avatar || '',
        favoriteMode: user?.favoriteMode || 'classic',
    });
    const [preferences, setPreferences] = useState({
        reducedMotion: Boolean(user?.preferences?.reducedMotion),
        showOnLeaderboard: user?.preferences?.showOnLeaderboard !== false,
    });

    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState(null);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    const [loginData, setLoginData] = useState(null);
    const [loginError, setLoginError] = useState('');
    const [loadingLogins, setLoadingLogins] = useState(true);

    const [security, setSecurity] = useState(null);
    const [securityError, setSecurityError] = useState('');
    const [loadingSecurity, setLoadingSecurity] = useState(true);
    const [signingOutOthers, setSigningOutOthers] = useState(false);
    const [deviceMessage, setDeviceMessage] = useState(null);

    const hasPassword = user?.providerNames?.includes('local');
    const winRate = stats?.gamesPlayed
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;

    const fetchSecurity = () => {
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
                        loginResult.reason?.friendlyMessage ||
                            'Could not load login history.'
                    );
                }
            })
            .finally(() => {
                setLoadingLogins(false);
                setLoadingSecurity(false);
            });
    };

    const loadSecurity = () => {
        setLoadingLogins(true);
        setLoadingSecurity(true);
        setLoginError('');
        setSecurityError('');
        fetchSecurity();
    };

    useEffect(() => {
        fetchSecurity();
    }, []);

    const handleLogoutOthers = async () => {
        if (signingOutOthers) return;
        setSigningOutOthers(true);
        setDeviceMessage(null);

        try {
            const data = await userApi.logoutOthers();
            if (data.user) setUser(data.user);
            setDeviceMessage({
                type: 'success',
                text: data.message || 'All other devices have been signed out.',
            });
            loadSecurity();
        } catch (err) {
            setDeviceMessage({
                type: 'error',
                text: err.friendlyMessage || 'Could not sign out your other devices.',
            });
        } finally {
            setSigningOutOthers(false);
        }
    };

    const updateProfileField = (field) => (event) => {
        setProfile((prev) => ({ ...prev, [field]: event.target.value }));
        setProfileMessage(null);
    };

    const updatePreference = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setPreferences((prev) => ({ ...prev, [field]: value }));
        setProfileMessage(null);
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();
        if (savingProfile) return;
        setSavingProfile(true);
        setProfileMessage(null);

        try {
            const data = await userApi.updateMe({
                name: profile.name,
                bio: profile.bio,
                avatar: profile.avatar,
                favoriteMode: profile.favoriteMode,
                preferences,
            });
            setUser(data.user);
            setProfileMessage({ type: 'success', text: data.message || 'Account settings saved.' });
        } catch (err) {
            setProfileMessage({ type: 'error', text: err.friendlyMessage || 'Could not save settings.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSave = async (event) => {
        event.preventDefault();
        if (savingPassword) return;
        setPasswordMessage(null);

        if (passwordForm.newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'The new passwords do not match.' });
            return;
        }

        const policy = evaluatePassword(passwordForm.newPassword, {
            email: user?.email,
            name: user?.displayName,
        });
        if (!policy.valid) {
            setPasswordMessage({ type: 'error', text: policy.message });
            return;
        }

        setSavingPassword(true);
        try {
            const data = await userApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            if (data.user) setUser(data.user);
            setPasswordMessage({ type: 'success', text: data.message || 'Password updated.' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.friendlyMessage || 'Could not update password.' });
        } finally {
            setSavingPassword(false);
        }
    };

    const failedLogins = useMemo(
        () =>
            (loginData?.history || [])
                .filter((entry) => entry.success === false)
                .slice(0, 4),
        [loginData]
    );

    const statCards = useMemo(
        () => [
            { icon: <Trophy size={18} />, label: 'Total points', value: stats?.totalPoints ?? 0 },
            { icon: <Gamepad2 size={18} />, label: 'Games played', value: stats?.gamesPlayed ?? 0, color: 'from-sky-300 to-sky-500' },
            { icon: <Target size={18} />, label: 'Win rate', value: `${winRate}%`, color: 'from-emerald-300 to-emerald-500' },
            { icon: <Flame size={18} />, label: 'Current streak', value: stats?.currentStreak ?? 0, color: 'from-orange-300 to-orange-500' },
            { icon: <Crown size={18} />, label: 'Best streak', value: stats?.bestStreak ?? 0, color: 'from-violet-300 to-violet-500' },
            {
                icon: <Zap size={18} />,
                label: 'Fastest answer',
                value: stats?.fastestAnswerMs ? `${(stats.fastestAnswerMs / 1000).toFixed(1)}s` : '—',
                color: 'from-pink-300 to-pink-500',
            },
        ],
        [stats, winRate]
    );

    if (!user) return null;

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-bold text-banana-700 hover:underline">
                        <ArrowLeft size={17} /> Back to dashboard
                    </Link>
                    <Link to="/achievements" className="flex items-center gap-1.5 text-sm font-bold text-banana-700 hover:underline">
                        <Trophy size={16} /> Achievements
                    </Link>
                </div>

                {/* Identity card */}
                <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <Card className="mb-5 !p-5 md:!p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-banana-300 bg-banana-100 font-display text-2xl font-extrabold text-banana-600 shadow-game-sm">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        initials(user.displayName)
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="break-words font-display text-3xl font-extrabold leading-tight text-banana-800">
                                        {user.displayName}
                                    </h1>
                                    <p className="flex min-w-0 flex-wrap items-center gap-1.5 break-all text-sm text-banana-600">
                                        <Mail size={14} /> {user.email}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {user.providerNames?.map((provider) => (
                                            <span
                                                key={provider}
                                                className="rounded-full bg-banana-200 px-2.5 py-0.5 text-[11px] font-bold capitalize text-banana-800"
                                            >
                                                {provider}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-banana-500">Joined</dt>
                                    <dd className="font-bold text-banana-800">{formatDate(user.createdAt)}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-banana-500">Last login</dt>
                                    <dd className="font-bold text-banana-800">{formatRelative(user.lastLoginAt)}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-banana-500">Favourite mode</dt>
                                    <dd className="font-bold capitalize text-banana-800">{user.favoriteMode || 'classic'}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-banana-500">Security</dt>
                                    <dd className="font-bold text-banana-800">{hasPassword ? 'Password set' : 'Social only'}</dd>
                                </div>
                            </dl>
                        </div>
                    </Card>

                    {/* Stats */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {statCards.map((card) => (
                            <StatCard key={card.label} {...card} />
                        ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                        <div className="space-y-5 lg:col-span-2">
                            {/* Account details */}
                            <Card className="!p-5 md:!p-6">
                                <SectionHeading
                                    icon={<UserRound size={20} />}
                                    title="Account details"
                                    subtitle="Update how you appear across Banana Quiz."
                                />

                                <form onSubmit={handleProfileSave} className="space-y-4">
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

                                    <Field label="Email" htmlFor="email" hint="Contact support to change your email.">
                                        <input id="email" value={user.email} readOnly disabled className={`${inputClass} opacity-60`} />
                                    </Field>

                                    <Field label="Avatar image URL" htmlFor="avatar" hint="Paste a public https image link. Leave empty for your initials.">
                                        <div className="flex items-center gap-2">
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
                                    </Field>

                                    <Field label="Bio" htmlFor="bio" hint={`${profile.bio.length}/160 characters`}>
                                        <textarea
                                            id="bio"
                                            value={profile.bio}
                                            onChange={updateProfileField('bio')}
                                            maxLength={160}
                                            rows={3}
                                            className={`${inputClass} resize-none`}
                                            placeholder="Tell other players about your banana-counting skills…"
                                        />
                                    </Field>

                                    <div className="rounded-2xl border-2 border-banana-200 bg-banana-50 p-4">
                                        <p className="mb-3 flex items-center gap-2 font-bold text-banana-800">
                                            <Settings size={17} /> Web page settings
                                        </p>
                                        <div className="space-y-3">
                                            <PreferenceToggle
                                                label="Reduce motion"
                                                description="Turn off floating and wiggling animations."
                                                checked={preferences.reducedMotion}
                                                onChange={updatePreference('reducedMotion')}
                                            />
                                            <PreferenceToggle
                                                label="Show me on the leaderboard"
                                                description="Hide your name and score from public rankings."
                                                checked={preferences.showOnLeaderboard}
                                                onChange={updatePreference('showOnLeaderboard')}
                                            />
                                        </div>
                                    </div>

                                    {profileMessage && <Message {...profileMessage} />}

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={savingProfile} className="!py-2.5 !text-base">
                                            <Save size={17} /> {savingProfile ? 'Saving…' : 'Save changes'}
                                        </Button>
                                    </div>
                                </form>
                            </Card>

                            {/* Password */}
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

                                <form onSubmit={handlePasswordSave} className="space-y-4">
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
                                        passwordForm.newPassword !==
                                            passwordForm.confirmPassword && (
                                            <p className="text-xs font-semibold text-red-600">
                                                The new passwords do not match yet.
                                            </p>
                                        )}

                                    {passwordMessage && <Message {...passwordMessage} />}

                                    <div className="flex justify-end">
                                        <Button type="submit" variant="secondary" disabled={savingPassword} className="!py-2.5 !text-base">
                                            <ShieldCheck size={17} /> {savingPassword ? 'Updating…' : 'Update password'}
                                        </Button>
                                    </div>
                                </form>
                            </Card>

                            {/* Login history */}
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
                                        onClick={loadSecurity}
                                        title="Refresh security details"
                                        className="rounded-xl p-2 text-banana-600 hover:bg-banana-100"
                                    >
                                        <RefreshCw
                                            size={17}
                                            className={
                                                loadingLogins || loadingSecurity ? 'animate-spin' : ''
                                            }
                                        />
                                    </button>
                                </div>

                                {loginError && <Message type="error" text={loginError} />}

                                {loadingLogins && !loginData && (
                                    <p className="py-6 text-center text-sm font-semibold text-banana-500">Loading sign-ins…</p>
                                )}

                                {loginData && loginData.history.length === 0 && (
                                    <p className="py-6 text-center text-sm font-semibold text-banana-500">
                                        No sign-ins recorded yet.
                                    </p>
                                )}

                                <ul className="divide-y divide-banana-100">
                                    {loginData?.history.map((entry) => {
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
                        </div>

                        {/* Right column */}
                        <div className="space-y-5">
                            <Card className="!p-5">
                                <SectionHeading
                                    icon={<ShieldCheck size={20} />}
                                    title="Account security"
                                    subtitle="Live checks on how protected your account is."
                                    noMargin
                                />

                                {loadingSecurity && !security && (
                                    <p className="py-4 text-center text-xs font-semibold text-banana-500">
                                        Checking your account…
                                    </p>
                                )}

                                {securityError && (
                                    <div className="mt-3">
                                        <Message type="error" text={securityError} />
                                    </div>
                                )}

                                {security && (
                                    <>
                                        <div className="mt-3 flex items-center gap-3">
                                            <div
                                                className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl ${
                                                    security.score >= 75
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : security.score >= 50
                                                          ? 'bg-amber-100 text-amber-700'
                                                          : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                <span className="font-display text-xl font-extrabold leading-none">
                                                    {security.score}%
                                                </span>
                                                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">
                                                    secure
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-extrabold text-banana-800">
                                                    {security.level}
                                                </p>
                                                <p className="text-[11px] text-banana-500">
                                                    {security.checks.filter((check) => check.passed).length}/
                                                    {security.checks.length} checks passed
                                                </p>
                                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-banana-200">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            security.score >= 75
                                                                ? 'bg-emerald-500'
                                                                : security.score >= 50
                                                                  ? 'bg-amber-400'
                                                                  : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${security.score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <ul className="mt-3 space-y-1.5">
                                            {security.checks.map((check) => (
                                                <li
                                                    key={check.id}
                                                    title={check.hint}
                                                    className="flex items-start gap-2 text-[11px] font-semibold"
                                                >
                                                    {check.passed ? (
                                                        <Check
                                                            size={14}
                                                            className="mt-0.5 flex-shrink-0 text-emerald-600"
                                                        />
                                                    ) : (
                                                        <CircleAlert
                                                            size={14}
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
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="mt-3 space-y-0.5 border-t border-banana-100 pt-2.5 text-[11px] text-banana-500">
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

                                <Button
                                    variant="secondary"
                                    onClick={handleLogoutOthers}
                                    disabled={signingOutOthers}
                                    className="mt-4 w-full !py-2.5 !text-base"
                                >
                                    <LogOut size={17} />{' '}
                                    {signingOutOthers ? 'Signing out…' : 'Sign out other devices'}
                                </Button>
                                {deviceMessage && (
                                    <div className="mt-3">
                                        <Message {...deviceMessage} />
                                    </div>
                                )}
                            </Card>

                            <Card className="!p-5">
                                <SectionHeading icon={<CalendarDays size={20} />} title="Devices" subtitle="Where you are signed in." noMargin />
                                <div className="mt-3 space-y-2">
                                    {loginData?.devices.map((device) => {
                                        const Icon = DEVICE_ICONS[device.deviceType] || Monitor;
                                        return (
                                            <div
                                                key={device.id}
                                                className={`rounded-xl border-2 p-2.5 ${
                                                    device.current ? 'border-emerald-300 bg-emerald-50' : 'border-banana-200 bg-white/70'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon size={16} className="text-banana-600" />
                                                    <p className="flex-1 truncate text-sm font-bold text-banana-800">{device.device}</p>
                                                    {device.current && <Check size={15} className="text-emerald-600" />}
                                                </div>
                                                <p className="mt-0.5 text-[11px] text-banana-500">
                                                    {device.logins} sign-in{device.logins === 1 ? '' : 's'} · last {formatRelative(device.lastSeenAt)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                    {loginData && loginData.devices.length === 0 && (
                                        <p className="py-3 text-center text-xs font-semibold text-banana-500">No devices yet.</p>
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

                            <Card className="!p-5">
                                <SectionHeading icon={<Gamepad2 size={20} />} title="Sound & music" subtitle="Saved on this device." noMargin />
                                <div className="mt-4">
                                    <AudioControls />
                                </div>
                            </Card>

                            <Card className="!p-5">
                                <SectionHeading icon={<Trophy size={20} />} title="Quick links" noMargin />
                                <div className="mt-3 space-y-2">
                                    <Link to="/dashboard" className="block">
                                        <Button variant="secondary" className="w-full !py-2.5 !text-base">
                                            <Gamepad2 size={17} /> Dashboard
                                        </Button>
                                    </Link>
                                    <Link to="/achievements" className="block">
                                        <Button variant="secondary" className="w-full !py-2.5 !text-base">
                                            <Trophy size={17} /> Achievements
                                        </Button>
                                    </Link>
                                    <Link to="/leaderboard" className="block">
                                        <Button variant="ghost" className="w-full !py-2.5 !text-base">
                                            <Crown size={17} /> Leaderboard
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
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

function Message({ type, text }) {
    const success = type === 'success';
    return (
        <p
            role="alert"
            className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
        >
            {success ? <Check size={17} className="mt-0.5 flex-shrink-0" /> : <CircleAlert size={17} className="mt-0.5 flex-shrink-0" />}
            {text}
        </p>
    );
}
