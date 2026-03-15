'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, COLORS, type SessionData, type User, type Rating, type RankingEntry } from '@/lib/types';

const MIN_RATINGS = 5;

export default function RankingPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [ratedUserIds, setRatedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('overall');

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

    const rated = new Set<string>();
    allRatings
      .filter((r) => r.rater_id === s.userId)
      .forEach((r) => rated.add(r.target_id));
    setRatedUserIds(rated);

    const built: RankingEntry[] = users.map((user) => {
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

    setEntries(built);
    setLoading(false);
  };

  const ranking = useMemo(() => {
    const qualified = entries.filter((e) => e.count >= MIN_RATINGS);

    if (selectedTab === 'overall') {
      return qualified.sort((a, b) => b.total - a.total);
    }

    const cat = CATEGORIES.find((c) => c.key === selectedTab);
    if (!cat) return qualified;

    return [...qualified].sort((a, b) => {
      const aVal = a.avg?.[cat.key] ?? 0;
      const bVal = b.avg?.[cat.key] ?? 0;
      return bVal - aVal;
    });
  }, [entries, selectedTab]);

  const getDisplayScore = (entry: RankingEntry): number => {
    if (selectedTab === 'overall') return entry.total;
    return entry.avg?.[selectedTab] ?? 0;
  };

  const canViewChart = (entry: RankingEntry) => {
    if (!session) return false;
    return entry.username === session.username || ratedUserIds.has(entry.userId);
  };

  const medals = ['👑', '🥈', '🥉'];

  const tabs = [
    { key: 'overall', label: '総合', emoji: '🏆' },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji })),
  ];

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

      <div className="text-center my-4 mb-4">
        <div className="text-4xl">🏆</div>
        <h2 className="text-[22px] font-extrabold mt-2 mb-0" style={{ color: COLORS.text }}>
          大人げないランキング
        </h2>
        <div className="text-xs mt-1" style={{ color: COLORS.textDim }}>
          {MIN_RATINGS}人以上に評価されたメンバーのみ表示
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-3 mb-4 -mx-4 px-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            className="shrink-0 py-2 px-3 rounded-xl text-xs font-bold cursor-pointer border-none transition-all"
            style={{
              background: selectedTab === tab.key
                ? `linear-gradient(135deg, ${COLORS.accent}, #ff6b6b)`
                : COLORS.card,
              color: selectedTab === tab.key ? '#fff' : COLORS.textDim,
              border: selectedTab === tab.key ? 'none' : `1px solid ${COLORS.border}`,
              boxShadow: selectedTab === tab.key ? `0 2px 12px ${COLORS.accentGlow}` : 'none',
            }}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
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
          {entries.some((e) => e.count > 0)
            ? `${MIN_RATINGS}人以上に評価されたメンバーがまだいません`
            : 'まだ評価がありません'}
        </div>
      ) : (
        ranking.map((entry, i) => {
          const viewable = canViewChart(entry);
          const score = getDisplayScore(entry);
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
                {score.toFixed(1)}
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
