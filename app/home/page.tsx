'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, COLORS, type SessionData, type User, type Rating, type AverageData } from '@/lib/types';
import RadarChart from '@/components/RadarChart';

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('otonage_session');
    if (!stored) {
      router.replace('/');
      return;
    }
    const s: SessionData = JSON.parse(stored);
    setSession(s);
    fetchData(s.userId);
  }, [router]);

  const fetchData = async (userId: string) => {
    const [usersRes, ratingsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('ratings').select('*'),
    ]);
    if (usersRes.data) setUsers(usersRes.data);
    if (ratingsRes.data) setRatings(ratingsRes.data);
    setLoading(false);
  };

  const getAverageRatings = useCallback(
    (targetId: string): AverageData | null => {
      const targetRatings = ratings.filter((r) => r.target_id === targetId);
      if (targetRatings.length === 0) return null;

      const avg: Record<string, number> = {};
      CATEGORIES.forEach((c) => {
        const vals = targetRatings.map((r) => r[c.dbKey]).filter((v) => v != null);
        avg[c.key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      });
      return { ...avg, _count: targetRatings.length } as AverageData;
    },
    [ratings]
  );

  const hasRated = useCallback(
    (targetId: string): boolean => {
      if (!session) return false;
      return ratings.some((r) => r.rater_id === session.userId && r.target_id === targetId);
    },
    [ratings, session]
  );

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🔥</div>
          <div className="text-text-main text-xl">読み込み中...</div>
        </div>
      </div>
    );
  }

  const otherUsers = users
    .filter((u) => u.id !== session.userId)
    .sort((a, b) => {
      const countA = ratings.filter((r) => r.target_id === a.id).length;
      const countB = ratings.filter((r) => r.target_id === b.id).length;
      return countA - countB;
    });
  const myAvg = getAverageRatings(session.userId);

  return (
    <div className="min-h-screen px-4 py-5 mx-auto" style={{ background: COLORS.bg, maxWidth: 480 }}>
      {toast && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 py-2.5 px-6 rounded-xl font-bold text-sm z-50"
          style={{
            background: COLORS.success,
            color: '#000',
            boxShadow: '0 4px 20px rgba(74,222,128,0.4)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-xs" style={{ color: COLORS.textDim }}>ログイン中</div>
          <div className="text-xl font-extrabold" style={{ color: COLORS.text }}>
            🔥 {session.username}
          </div>
        </div>
        <button
          className="py-2 px-4 rounded-[10px] text-xs cursor-pointer"
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textDim,
          }}
          onClick={() => {
            localStorage.removeItem('otonage_session');
            router.push('/');
          }}
        >
          ログアウト
        </button>
      </div>

      {/* Ranking link */}
      <Link
        href="/ranking"
        className="block no-underline rounded-2xl p-5 mb-3 text-center cursor-pointer transition-all"
        style={{
          background: `linear-gradient(135deg, ${COLORS.card}, #1a1520)`,
          border: `1px solid ${COLORS.gold}33`,
        }}
      >
        <span className="text-xl">🏆</span>
        <span className="ml-2 font-bold" style={{ color: COLORS.gold }}>
          大人げないランキングを見る
        </span>
      </Link>

      {/* My chart link */}
      <Link
        href={`/chart/${session.username}`}
        className="block no-underline rounded-2xl p-5 mb-3 cursor-pointer transition-all"
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `linear-gradient(135deg, ${COLORS.accent}, #ff6b6b)` }}
          >
            📊
          </div>
          <div>
            <div className="font-bold" style={{ color: COLORS.text }}>自分の評価を見る</div>
            <div className="text-xs" style={{ color: COLORS.textDim }}>
              {myAvg ? `${myAvg._count}人から評価済み` : 'まだ評価されていません'}
            </div>
          </div>
        </div>
      </Link>

      {/* Members */}
      <h3
        className="text-sm font-semibold mt-6 mb-3"
        style={{ color: COLORS.textDim, letterSpacing: 2 }}
      >
        メンバー一覧
      </h3>

      {otherUsers.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textDim,
          }}
        >
          他のメンバーがまだいません
          <br />
          <span className="text-xs">他の人にもログインしてもらいましょう</span>
        </div>
      ) : (
        otherUsers.map((user) => {
          const rated = hasRated(user.id);
          const avgData = getAverageRatings(user.id);
          const canView = rated;

          return (
            <div
              key={user.id}
              className="rounded-2xl p-5 mb-3"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg"
                    style={{
                      background: rated
                        ? `linear-gradient(135deg, ${COLORS.success}33, ${COLORS.success}11)`
                        : COLORS.inputBg,
                      border: `1px solid ${rated ? COLORS.success + '44' : COLORS.border}`,
                    }}
                  >
                    {rated ? '✅' : '👤'}
                  </div>
                  <div>
                    <div className="font-bold text-[15px]" style={{ color: COLORS.text }}>
                      {user.username}
                    </div>
                    <div className="text-[11px]" style={{ color: COLORS.textDim }}>
                      {rated ? '評価済み' : '未評価'}
                      {avgData ? ` · ${avgData._count}人が評価` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/rate/${user.username}`}
                    className="no-underline py-2 px-3.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    style={{
                      background: rated
                        ? COLORS.card
                        : `linear-gradient(135deg, ${COLORS.accent}, #ff6b6b)`,
                      color: rated ? COLORS.text : '#fff',
                      border: rated ? `1px solid ${COLORS.border}` : 'none',
                      boxShadow: rated ? 'none' : `0 2px 12px ${COLORS.accentGlow}`,
                    }}
                  >
                    {rated ? '再評価' : '評価する'}
                  </Link>
                  {canView && (
                    <Link
                      href={`/chart/${user.username}`}
                      className="no-underline py-2 px-3.5 rounded-xl text-xs font-bold cursor-pointer"
                      style={{
                        background: COLORS.card,
                        color: COLORS.text,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    >
                      📊
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
