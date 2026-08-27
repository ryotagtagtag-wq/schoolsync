'use client';

import { useEffect, useState } from 'react';
import { PlayerCard } from '@/components/game';
import { FacilityCard } from '@/components/game';
import { PlayerState, UserAchievementState, UserFacilityState } from '@/lib/game/types';

interface ProfilePageData extends PlayerState {
  allAchievements: UserAchievementState[];
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfilePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/player/profile/full');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load profile');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">プロフィールの読み込みに失敗しました</h1>
          <p className="text-gray-600 dark:text-gray-400">{error || '不明なエラー'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Player Card Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
          <PlayerCard player={data} />
        </section>

        {/* Stats Detail Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            詳細ステータス
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'int', label: '知力 (INT)', icon: '🧠', color: 'blue' },
              { key: 'wis', label: '精神 (WIS)', icon: '🔮', color: 'purple' },
              { key: 'str', label: '腕力 (STR)', icon: '💪', color: 'red' },
              { key: 'end', label: '耐久 (END)', icon: '🛡️', color: 'green' },
              { key: 'cre', label: '創造 (CRE)', icon: '🎨', color: 'pink' },
              { key: 'soc', label: '社交 (SOC)', icon: '💬', color: 'orange' },
            ].map((stat) => (
              <div key={stat.key} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{stat.label}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {data.stats[stat.key as keyof typeof data.stats]}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Facilities Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            施設
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.facilities.map((facility: UserFacilityState) => (
              <FacilityCard
                key={facility.facilityId}
                facility={{
                  ...facility,
                  unlockLevel: 1,
                }}
                playerLevel={data.level}
              />
            ))}
          </div>
        </section>

        {/* Achievements Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            実績 ({data.allAchievements.filter(a => a.unlockedAt).length} / {data.allAchievements.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.allAchievements.map((achievement) => (
              <div
                key={achievement.achievementId}
                className={`relative rounded-xl p-4 transition-all ${
                  achievement.unlockedAt
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400'
                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                    achievement.unlockedAt
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-gray-900 dark:text-white ${
                      !achievement.unlockedAt ? 'line-through' : ''
                    }`}>
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {achievement.description}
                    </p>
                    {achievement.unlockedAt && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                        獲得日: {new Date(achievement.unlockedAt).toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </div>
                </div>
                {!achievement.unlockedAt && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}