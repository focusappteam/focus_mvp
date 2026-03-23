import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null); // 👈 nuevo
    const [loading, setLoading] = useState(true);

    // Función para cargar el perfil desde la tabla profiles
    async function loadProfile(userId) {
        if (!userId) { setProfile(null); return; }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error) setProfile(data);
    }

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                await loadProfile(currentUser?.id);
                setLoading(false); // loading pasa de true → false cuando Supabase ya resolvió
            }
        );

        supabase.auth.getSession().then(({ data }) => {
            if (!data.session) {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);



    const signIn = ({ email, password }) =>
        supabase.auth.signInWithPassword({ email, password });

    // signUp recibe el objeto completo para que Register pueda pasar options
    const signUp = (params) => supabase.auth.signUp(params);

    const signOut = () => supabase.auth.signOut();

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
