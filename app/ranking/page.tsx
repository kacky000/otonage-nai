'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, COLORS, type SessionData, type User, type Rating, type RankingEntry } from '@/lib/types';

export default function RankingPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [ratedUserIds, setRatedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('otonage_session');
    if (!stored) {
      router.replace('/');
      return;
    }
    const s: SessionData = JSON.parse(stored);
    setSession(s);
    loadRanking(s);
  }, [router]);

  const loadRanking = async (s: SessionData) => {
    const [usersRes, ratingsRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('ratings').select('*'),
    ]);

    const users: User[] = usersRes.data || [];
    const allRatings: Rating[] = ratingsRes.data || [];

    // Track which users the current user has rated
    const rated = new Set<string>();
    allRatings
      .filter((r) => r.rater_id === s.userId)
      .forEach((r) => rated.add(r.target_id));
    setRatedUserIds(rated);

    // Build ranking
    const entries: RankingEntry[] = users.map((user) => {
      const targetRatings = allRatings.filter((r) => r.target_id === user.id);
      if (targetRatings.length === 0) {
        return { username: user.username, userId: user.id, avg: null, total: 0, count: 0 };
      }

      const avg: Record<string, number> = {};
      CATEGORIES.forEach((c) => {
        const vals = targetRatings.map((r) => r[c.dbKey]).filter((v) => v != null);
        avg[c.key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      });
      const total = CATEGORIES.reduce((s, c) => s + (avg[c.key] || 0), 0) / 6;

      return {
        username: user.username,
        userId: user.id,
        avg: { ...avg, _count: targetRatings.length } as any,
        total,
        count: targetRatings.length,
      };
    });

    const sorted = entries
      .filter((e) => e.count > 0)
      .sort((a, b) => b.total - a.total);

    setRanking(sorted);
    setLoading(false);
  };

  const canViewChart = (entry: RankingEntry) => {
    if (!session) return false;
    return entry.username === session.username || ratedUserIds.has(entry.userId);
  };

  const medals = ['👑', '🥈', '🥉'];

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
        <div className="text-4xl">🏆</div>
        <h2 className="text-[22px] font-extrabold mt-2 mb-0" style={{ color: COLORS.text }}>
          大人げないランキング
        </h2>
      </div>

      {ranking.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textDim,
          }}
        >
          まだ評価がありません
        </div>
      ) : (
        ranking.map((entry, i) => {
          const viewable = canViewChart(entry);
          const content = (
            <div
              className="rounded-2xl p-5 mb-3 flex items-center gap-3.5 transition-all"
              style={{
                background: COLORS.card,
                border: i === 0 ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
                cursor: viewable ? 'pointer' : 'default',
              }}
            >
              <div className="text-[28px] min-w-[40px] text-center">
                {i < 3 ? medals[i] : `${i + 1}.`}
              </div>
              <div className="flex-1">
                <div className="font-bold text-base" style={{ color: COLORS.text }}>
                  {entry.username}
                </div>
                <div className="text-[11px]" style={{ color: COLORS.textDim }}>
                  {entry.count}人が評価
                </div>
              </div>
              <div
                className="font-black text-2xl font-mono"
                style={{ color: i === 0 ? COLORS.gold : COLORS.accent }}
              >
                {entry.total.toFixed(1)}
              </div>
            </div>
          );

          if (viewable) {
            return (
              <Link
                key={entry.userId}
                href={`/chart/${entry.username}`}
                className="block no-underline"
              >
                {content}
              </Link>
            );
          }

          return <div key={entry.userId}>{content}</div>;
        })
      )}
    </div>
  );
}
