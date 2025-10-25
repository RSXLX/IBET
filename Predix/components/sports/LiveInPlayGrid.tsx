'use client';

import React, { useEffect, useState } from 'react';
import { LiveMatchCard, LiveMatch } from './LiveMatchCard';
import { InPlaySidebar } from '@/components/sports/InPlaySidebar';
import { useRouter, useSearchParams } from 'next/navigation';

interface LiveInPlayGridProps {
  matches?: LiveMatch[];
}

// API 返回可能包含额外信息（name、createdAt、state），与前端结构兼容
type ApiMatch = LiveMatch & { name?: string; createdAt?: string; state?: string };

export function LiveInPlayGrid({ matches }: LiveInPlayGridProps) {
  const [data, setData] = useState<LiveMatch[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 侧边栏状态
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LiveMatch | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // 仅在接口不可用时用于展示的回退示例
  const fallbackSample: LiveMatch[] = [
    {
      id: 'nba-001',
      sport: 'NBA',
      teams: {
        home: { name: 'Lakers', score: 102, code: 'LAL' },
        away: { name: 'Celtics', score: 105, code: 'BOS' },
      },
      status: { time: 'Q4 02:15', isLive: true, phase: 'Q4' },
      liveOdds: { home: 2.1, away: 1.8 },
      marketUrl: '/sports-betting',
    },
    {
      id: 'epl-002',
      sport: 'Premier League',
      teams: {
        home: { name: 'Man City', score: 1, code: 'MCI' },
        away: { name: 'Arsenal', score: 1, code: 'ARS' },
      },
      status: { time: "81'", isLive: true },
      liveOdds: { home: 2.6, draw: 3.1, away: 2.4 },
      marketUrl: '/sports-betting',
    },
    {
      id: 'nfl-003',
      sport: 'NFL',
      teams: {
        home: { name: 'Jets', score: 17, code: 'NYJ' },
        away: { name: 'Bengals', score: 21, code: 'CIN' },
      },
      status: { time: 'Q3 04:42', isLive: true, phase: 'Q3' },
      liveOdds: { home: 2.9, away: 1.5 },
      marketUrl: '/sports-betting',
    },
  ];

  useEffect(() => {
    if (matches && matches.length > 0) return; // 已传入数据则不请求

    const controller = new AbortController();
    let cancelled = false;

    async function fetchLive() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/mock/live', {
          cache: 'no-store',
          next: { revalidate: 0 },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ApiMatch[] = await res.json();
        if (!cancelled) {
          if (Array.isArray(json)) {
            setData(json as LiveMatch[]);
          } else {
            throw new Error('Invalid data format');
          }
        }
      } catch (e: any) {
        const isAbort = e?.name === 'AbortError'
          || (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError')
          || (typeof e?.message === 'string' && /aborted|AbortError|The operation was aborted|ERR_ABORTED/i.test(e.message));
        if (isAbort) {
          return;
        }
        if (!cancelled) {
          setError(e?.message ?? 'Fetch failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLive();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [matches]);

  const items = matches ?? data;

  // 根据 URL 参数恢复抽屉状态
  useEffect(() => {
    const inplayId = searchParams?.get('inplay');
    if (!inplayId || !items) return;
    const found = items.find(m => m.id === inplayId);
    if (found) {
      setSelected(found);
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, items]);

  const onOpen = (m: LiveMatch) => {
    setSelected(m);
    setOpen(true);
    // 写入 URL 参数以便状态持久化
    const params = new URLSearchParams(searchParams?.toString());
    params.set('inplay', m.id);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : '?', { scroll: false });
  };

  const onClose = () => {
    setOpen(false);
    // 清除 URL 中的 inplay 参数
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('inplay');
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : '', { scroll: false });
  };

  if (!items) {
    if (loading) {
      return <div className="text-muted-foreground">Loading in-play matches...</div>;
    }
    if (error) {
      return (
        <div>
          <div className="mb-4 text-destructive">Failed to load: {error}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {fallbackSample.map((m) => (
              <LiveMatchCard key={m.id} match={m} onOpen={onOpen} />
            ))}
          </div>
          <InPlaySidebar open={open} onClose={onClose} match={selected ?? undefined} />
        </div>
      );
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(items ?? []).map((m) => (
          <LiveMatchCard key={m.id} match={m} onOpen={onOpen} />
        ))}
      </div>
      <InPlaySidebar open={open} onClose={onClose} match={selected ?? undefined} />
    </>
  );
}