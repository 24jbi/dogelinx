import React, { useEffect, useState } from 'react';
import supabase, { signInWithProvider, signInWithEmail, signOut, onAuthState, getUser } from '../supabaseClient';

export default function Auth() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const u = await getUser();
      if (mounted) setUser(u);
    })();

    const sub = onAuthState((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      try { sub?.data?.subscription?.unsubscribe?.(); } catch {}
    };
  }, []);

  const sendMagicLink = async () => {
    if (!email) return alert('Enter email');
    await signInWithEmail(email);
    alert('Magic link sent to your email');
  };

  const handleDiscord = () => signInWithProvider('discord');
  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  if (user) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ color: '#cbd5e1', opacity: 0.9, fontSize: "13px" }}>{user.email ?? user.user_metadata?.full_name ?? 'Signed in'}</div>
        <button 
          onClick={handleSignOut} 
          style={{ 
            padding: '6px 10px', 
            borderRadius: 6, 
            background: '#2d3748',
            border: '1px solid #404854',
            color: '#cbd5e1',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="you@example.com" 
        style={{ 
          padding: '6px 8px', 
          borderRadius: 6, 
          width: 160,
          background: '#2d3748',
          border: '1px solid #404854',
          color: '#cbd5e1',
          fontSize: '12px'
        }} 
      />
      <button 
        onClick={sendMagicLink} 
        style={{ 
          padding: '6px 10px', 
          borderRadius: 6,
          background: '#2d3748',
          border: '1px solid #404854',
          color: '#cbd5e1',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Sign in
      </button>
      <button 
        onClick={handleDiscord} 
        style={{ 
          padding: '6px 10px', 
          borderRadius: 6,
          background: '#2d3748',
          border: '1px solid #404854',
          color: '#cbd5e1',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Discord
      </button>
    </div>
  );
}
