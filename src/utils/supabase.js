import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,   // refresca el token automáticamente
        persistSession: true,     // guarda la sesión en localStorage
        detectSessionInUrl: true  // necesario para confirmar email y OAuth
    }
});