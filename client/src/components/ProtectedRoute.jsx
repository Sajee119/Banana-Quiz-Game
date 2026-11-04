import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-16 h-16 border-4 border-banana-400 border-t-transparent rounded-full" />
            </div>
        );
    }
    return user ? children : <Navigate to="/login" replace />;
}