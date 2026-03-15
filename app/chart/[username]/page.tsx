'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, COLORS, type SessionData, type AverageData } from '@/lib/types';
import RadarChart from '@/components/RadarChart';

export default function ChartPage() {
  const router = useRouter();
  const params = useParams();
  const targetUsername = decodeURIComponent(params.username as string);

  const [session, setSession] = useState<SessionData | null>(null);
  const [avgData, setAvgData] = useState<AverageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRated, setHasRated] = useState(false);
  const [canView, setCanView] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('otonage_session');
    if (!stored) {
      router.replace('/');
      return;
    }
    const s: SessionData = JSON.parse(stored);
    setSession(s);
    loadChartData(s);
  }, [router, targetUsername]);

  const loadChartData = async (s: SessionData) => {
    // Get target user
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', targetUsername)
      .single();

    if (!targetUser) {
      setLoading(false);
      return;
    }

    const isOwnChart = s.username === targetUsername;

    // Check if current user has rated this target
    if (!isOwnChart) {
      const { data: ratingCheck } = await supabase
        .from('ratings')
        .select('id')
        .eq('rater_id', s.userId)
        .eq('target_id', targetUser.id)
        .single();

      setHasRated(!!ratingCheck);
      setCanView(!!ratingCheck);
    } else {
      setHasRated(false);
      setCanView(true);
    }

    // Get all ratings for this target
    const { data: targetRatings } = await supabase
      .from('ratings')
      .select('*')
      .eq('target_id', targetUser.id);

    if (targetRatings && targetRatings.length > 0) {
      const avg: Record<string, number> = {};
      CATEGORIES.forEach((c) => {
        const vals = targetRatings.map((r) => r[c.dbKey]).filter((v: number | null) => v != null);
        avg[c.key] = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
      });
      setAvgData({ ...avg, _count: targetRatings.length } as AverageData);
    }

    setLoading(false);
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

  const isOwnChart = session?.username === targetUsername;

  return (
    <div className="min-h-screen px-4 py-5 mx-auto" style={{ background: COLORS.bg, maxWidth: 480 }}>
      <button
        onClick={() => router.push('/home')}
        className="bg-transparent border-none text-sm cursor-pointer py-2 px-0"
        style={{ color: COLORS.textDim }}
      >
        ← 戻る
      </button>

      {!canView && !isOwnChart ? (
        <div
          className="rounded-2xl p-10 text-center mt-4"
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textDim,
          }}
        >
          <div className="text-4xl mb-4">🔒</div>
          <p>このユーザーのチャートを見るには、先に評価してください</p>
          <Link
            href={`/rate/${targetUsername}`}
            className="inline-block mt-4 py-3 px-6 rounded-xl no-underline font-bold text-white text-[15px]"
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent}, #ff6b6b)`,
              boxShadow: `0 4px 20px ${COLORS.accentGlow}`,
            }}
          >
            評価する
          </Link>
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 mt-4"
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {avgData ? (
            <>
              <RadarChart data={avgData} label={targetUsername} size={300} />
              <div className="text-center text-xs mt-2" style={{ color: COLORS.textDim }}>
                {avgData._count}人の評価の平均値
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {CATEGORIES.map((cat, i) => (
                  <div
                    key={cat.key}
                    className="rounded-[10px] py-2.5 px-3 flex justify-between items-center"
                    style={{ background: COLORS.inputBg }}
                  >
                    <span className="text-xs" style={{ color: COLORS.textDim }}>
                      {cat.emoji} {cat.label}
                    </span>
                    <span
                      className="font-extrabold font-mono text-base"
                      style={{ color: COLORS.chart[i] }}
                    >
                      {(avgData[cat.key] || 0).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10" style={{ color: COLORS.textDim }}>
              まだ誰からも評価されていません
            </div>
          )}
        </div>
      )}

      {!hasRated && !isOwnChart && canView && (
        <Link
          href={`/rate/${targetUsername}`}
          className="block text-center mt-3 py-3 px-6 rounded-xl no-underline font-bold text-white text-[15px]"
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent}, #ff6b6b)`,
            boxShadow: `0 4px 20px ${COLORS.accentGlow}`,
          }}
        >
          この人を評価する
        </Link>
      )}
    </div>
  );
}
