import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null); // 👈 nuevo
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let didResolveInitialLoading = false;

        function resolveInitialLoading() {
            if (!isMounted || didResolveInitialLoading) return;
            didResolveInitialLoading = true;
            setLoading(false);
        }

        async function loadProfile(userId) {
            if (!userId) {
                if (isMounted) setProfile(null);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!error && isMounted) {
                    setProfile(data);
                    return;
                }

                if (error) {
                    console.error('Failed to load profile:', error);
                }
            } catch (error) {
                console.error('Unexpected profile load failure:', error);
            }

            if (isMounted) setProfile(null);
        }

        function applySession(session) {
            const currentUser = session?.user ?? null;

            if (!isMounted) return;

            setUser(currentUser);

            if (!currentUser) {
                setProfile(null);
            }

            // Nunca bloqueamos la UI esperando perfil
            resolveInitialLoading();

            // Cargamos perfil en background para evitar pantalla de carga infinita
            void loadProfile(currentUser?.id);
        }

        async function bootstrapAuth() {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Failed to bootstrap session:', error);
                    applySession(null);
                    return;
                }

                applySession(data.session ?? null);
            } catch (error) {
                console.error('Unexpected session bootstrap failure:', error);
                applySession(null);
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                applySession(session);
            }
        );

        void bootstrapAuth();

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);



    const signIn = ({ email, password }) =>
        supabase.auth.signInWithPassword({ email, password });

    // signUp recibe el objeto completo para que Register pueda pasar options
    const signUp = (params) => supabase.auth.signUp(params);

    const signOut = async () => {
        let error = null;

        try {
            const response = await supabase.auth.signOut({ scope: 'global' });
            error = response.error ?? null;

            // Fallback to local sign-out if remote revocation fails.
            if (error) {
                const localResponse = await supabase.auth.signOut({ scope: 'local' });
                if (!localResponse.error) error = null;
            }
        } catch (err) {
            console.error('Unexpected sign-out failure:', err);
            error = err;
            await supabase.auth.signOut({ scope: 'local' });
        }

        if (error) {
            console.error('Failed to sign out from Supabase:', error);
        }

        setUser(null);
        setProfile(null);
        setLoading(false);

        return { error };
    };

    // updateProfile: actualiza campos del perfil y refresca el estado
    const updateProfile = async (updates) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .select()
            .single();

        if (!error) setProfile(data);
        return { data, error };
    };

    return (
        <AuthContext.Provider value={{
            user, profile, loading,
            signIn, signUp, signOut, updateProfile  // 👈 exportamos profile y updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
