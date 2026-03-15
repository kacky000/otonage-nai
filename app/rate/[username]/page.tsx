'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, COLORS, type SessionData } from '@/lib/types';
import SliderInput from '@/components/SliderInput';

export default function RatePage() {
  const router = useRouter();
  const params = useParams();
  const targetUsername = decodeURIComponent(params.username as string);

  const [session, setSession] = useState<SessionData | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [ratingValues, setRatingValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('otonage_session');
    if (!stored) {
      router.replace('/');
      return;
    }
    const s: SessionData = JSON.parse(stored);

    // Cannot rate yourself
    if (s.username === targetUsername) {
      router.replace('/home');
      return;
    }

    setSession(s);
    loadExistingRating(s);
  }, [router, targetUsername]);

  const loadExistingRating = async (s: SessionData) => {
    // Get target user
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', targetUsername)
      .single();

    if (!targetUser) {
      setError('ユーザーが見つかりません');
      setLoading(false);
      return;
    }

    setTargetUserId(targetUser.id);

    // Check for existing rating
    const { data: existing } = await supabase
      .from('ratings')
      .select('*')
      .eq('rater_id', s.userId)
      .eq('target_id', targetUser.id)
      .single();

    const init: Record<string, number> = {};
    CATEGORIES.forEach((c) => {
      init[c.key] = existing ? existing[c.dbKey] : 5;
    });
    setRatingValues(init);
    setLoading(false);
  };

  const submitRating = async () => {
    if (!session || !targetUserId) return;
    setSubmitting(true);

    const ratingData = {
      rater_id: session.userId,
      target_id: targetUserId,
      rudeness: ratingValues.rudeness,
      self_conscious: ratingValues.selfConscious,
      childish: ratingValues.childish,
      random_talk: ratingValues.random,
      behavior: ratingValues.behavior,
      useless_kindness: ratingValues.kindness,
      updated_at: new Date().toISOString(),
    };

    // Upsert (insert or update on conflict)
    const { error: dbError } = await supabase
      .from('ratings')
      .upsert(ratingData, { onConflict: 'rater_id,target_id' });

    if (dbError) {
      setError('評価の保存に失敗しました');
      setSubmitting(false);
      return;
    }

    router.push('/home');
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
    <div className="min-h-screen px-4 py-5 mx-auto" style={{ background: COLORS.bg, maxWidth: 480 }}>
      <button
        onClick={() => router.push('/home')}
        className="bg-transparent border-none text-sm cursor-pointer py-2 px-0"
        style={{ color: COLORS.textDim }}
      >
        ← 戻る
      </button>

      <div className="text-center my-4 mb-6">
        <div className="text-4xl mb-2">📝</div>
        <h2 className="text-[22px] font-extrabold m-0" style={{ color: COLORS.text }}>
          <span style={{ color: COLORS.accent }}>{targetUsername}</span>
          <span className="text-sm font-medium" style={{ color: COLORS.textDim }}>
            {' '}を評価する
          </span>
        </h2>
      </div>

      {error && (
        <div className="text-center text-sm mb-4" style={{ color: COLORS.accent }}>
          {error}
        </div>
      )}

      <div
        className="rounded-2xl p-5 mb-3"
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {CATEGORIES.map((cat) => (
          <SliderInput
            key={cat.key}
            cat={cat}
            value={ratingValues[cat.key] || 5}
            onChange={(v) => setRatingValues((p) => ({ ...p, [cat.key]: v }))}
          />
        ))}
      </div>

      <button
        className="w-full py-3 px-6 rounded-xl border-none font-bold text-[15px] cursor-pointer text-white transition-all disabled:opacity-50"
        style={{
          background: `linear-gradient(135deg, ${COLORS.accent}, #ff6b6b)`,
          boxShadow: `0 4px 20px ${COLORS.accentGlow}`,
        }}
        onClick={submitRating}
        disabled={submitting}
      >
        {submitting ? '送信中...' : '🔥 評価を確定する'}
      </button>
    </div>
  );
}
