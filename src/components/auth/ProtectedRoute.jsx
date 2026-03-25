import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    // Mientras Supabase verifica sesión, no redirigimos todavía.
    // Sin este check, habría un flash de redirección al /login
    // incluso si el usuario ya tiene sesión activa.
    if (loading) return (
        <div style={{
            display: 'grid', placeItems: 'center',
            height: '100vh', background: '#1a1a1a', color: '#fff'
        }}>
            Cargando sesion...
        </div>
    );

    // Si no hay usuario autenticado → redirige a /login
    // "replace" evita que /login quede en el historial del navegador
    if (!user) return <Navigate to="/login" replace />;

    // Si hay usuario → renderiza la ruta protegida
    return <Outlet />;
}
