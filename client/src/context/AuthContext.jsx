import { useEffect, useState, useCallback } from 'react';
import { authApi, userApi } from '../api/client';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            let status;
            try {
                status = await authApi.status();
            } catch {
                // One quick retry covers a cold/slow database connection
                // instead of treating the player as logged out.
                await new Promise((resolve) => setTimeout(resolve, 800));
                status = await authApi.status();
            }

            if (!status.authenticated) {
                setUser(null);
                setStats(null);
                return;
            }

            try {
                const data = await userApi.me();
                setUser(data.user);
                setStats(data.stats);
            } catch {
                // The session is valid even if the profile request fails.
                // Keeping the user signed in avoids bouncing back to /login.
                setUser(status.user || null);
                setStats(null);
            }
        } catch {
            setUser(null);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadSession = async () => { await refresh(); };
        loadSession();
    }, [refresh]);

    const signIn = useCallback(async (request) => {
        const data = await request();
        setUser(data.user);
        setStats(null);
        setLoading(false);

        // Fetch the player's stats in the background. A failure here must not
        // undo a successful login.
        userApi.me()
            .then((me) => {
                setUser(me.user);
                setStats(me.stats);
            })
            .catch(() => {});

        return data;
    }, []);

    const logout = async () => {
        await authApi.logout();
        setUser(null);
        setStats(null);
    };

    return (
        <AuthContext.Provider value={{ user, stats, setUser, setStats, loading, refresh, signIn, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
