import { createClient } from '@supabase/supabase-js';

// Read Supabase credentials from Vite env variables.
// Create a `.env` file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase credentials are not set. Create a .env file from .env.example and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

let supabase = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  // Provide a complete stub so imports won't fail; methods will throw when used.
  supabase = {
    auth: {
      signInWithOAuth: async () => {
        throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
      },
      signInWithOtp: async () => {
        throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
      },
      signOut: async () => {
        throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
      },
      getUser: async () => ({ data: { user: null } }),
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: null, error: new Error('Supabase not configured') }),
      insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
      update: async () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: new Error('Supabase not configured') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  };
}

export const signInWithProvider = async (provider) => supabase.auth.signInWithOAuth({ provider });
export const signInWithEmail = async (email) => supabase.auth.signInWithOtp({ email });
export const signOut = async () => supabase.auth.signOut();
export const getUser = async () => {
  const res = await supabase.auth.getUser();
  return res?.data?.user ?? null;
};
export const onAuthState = (cb) => supabase.auth.onAuthStateChange((event, session) => cb(event, session));

export default supabase;
