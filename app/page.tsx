'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { COLORS, type SessionData } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<string[]>([]);

  useEffect(() => {
    const session = localStorage.getItem('otonage_session');
    if (session) {
      router.replace('/home');
      return;
    }
    setLoading(false);
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('username')
      .order('created_at', { ascending: true });
    if (data) {
      setRegisteredUsers(data.map((u) => u.username));
    }
  };

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed || !password) {
      setError('名前とパスワードを入力してください');
      return;
    }
    setError('');
    setLoading(true);

    if (isLogin) {
      // Login
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', trimmed)
        .eq('password', password)
        .single();

      if (dbError || !data) {
        setError('名前またはパスワードが間違っています');
        setLoading(false);
        return;
      }

      const session: SessionData = { userId: data.id, username: data.username };
      localStorage.setItem('otonage_session', JSON.stringify(session));
      router.push('/home');
    } else {
      // Register
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', trimmed)
        .single();

      if (existing) {
        setError('この名前は既に使われています');
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('users')
        .insert({ username: trimmed, password })
        .select()
        .single();

      if (dbError || !data) {
        setError('登録に失敗しました');
        setLoading(false);
        return;
      }

      const session: SessionData = { userId: data.id, username: data.username };
      localStorage.setItem('otonage_session', JSON.stringify(session));
      router.push('/home');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🔥</div>
          <div className="text-text-main text-xl">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-5 mx-auto"
      style={{ background: COLORS.bg, maxWidth: 480 }}
    >
      <div className="text-center pt-16 pb-10">
        <div className="text-7xl mb-4">🔥</div>
        <h1
          className="text-3xl font-black m-0"
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.gold})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: -1,
          }}
        >
          大人げない
        </h1>
        <h2
          className="text-sm font-medium mt-2 m-0"
          style={{ color: COLORS.textDim, letterSpacing: 4 }}
        >
          評価システム
        </h2>
      </div>

      <div
        className="rounded-2xl p-5 mb-3"
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <p className="text-[13px] text-center mb-4 m-0" style={{ color: COLORS.textDim }}>
          {isLogin ? 'ログインしてください' : '新規登録'}
        </p>

        <input
          className="w-full py-3.5 px-4 rounded-xl text-base outline-none mb-3 transition-colors"
          style={{
            border: `2px solid ${COLORS.border}`,
            background: COLORS.inputBg,
            color: COLORS.text,
          }}
          placeholder="あなたの名前"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
          onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
        />

        <input
          className="w-full py-3.5 px-4 rounded-xl text-base outline-none mb-3 transition-colors"
          style={{
            border: `2px solid ${COLORS.border}`,
            background: COLORS.inputBg,
            color: COLORS.text,
          }}
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
          onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
        />

        {error && (
          <p className="text-sm text-center mb-3" style={{ color: COLORS.accent }}>
            {error}
          </p>
        )}

        <button
          className="w-full py-3 px-6 rounded-xl border-none font-bold text-[15px] cursor-pointer text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent}, #ff6b6b)`,
            boxShadow: `0 4px 20px ${COLORS.accentGlow}`,
          }}
          onClick={handleSubmit}
        >
          {isLogin ? '入場する' : '登録する'}
        </button>

        <div className="h-3" />

        <button
          className="w-full py-3 px-6 rounded-xl font-bold text-[13px] cursor-pointer transition-all"
          style={{
            background: COLORS.card,
            color: COLORS.textDim,
            border: `1px solid ${COLORS.border}`,
          }}
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
        >
          {isLogin ? '新規登録はこちら' : 'ログインに戻る'}
        </button>
      </div>

      {registeredUsers.length > 0 && (
        <div className="text-center text-xs mt-4" style={{ color: COLORS.textDim }}>
          登録済み: {registeredUsers.join('、')}
        </div>
      )}
    </div>
  );
}
