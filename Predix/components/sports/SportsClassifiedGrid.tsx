'use client';

import React, { useMemo, useState } from 'react';
import { LiveInPlayGrid } from '@/components/sports/LiveInPlayGrid';
import type { LiveMatch } from '@/components/sports/LiveMatchCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { mockFixtures } from '@/lib/sports/mockFixtures';
import { enrichFixture } from '@/lib/sports/classification';

export function SportsClassifiedGrid() {
  const enriched = useMemo(() => mockFixtures.map(f => ({ f, c: enrichFixture(f) })), []);

  const sports = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach(({ c }) => set.add(c.sport));
    return Array.from(set);
  }, [enriched]);

  const leagues = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach(({ c }) => c.league && set.add(c.league));
    return Array.from(set);
  }, [enriched]);

  const [activeSport, setActiveSport] = useState<string>('All');
  const [activeLeagues, setActiveLeagues] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState<string>('');
  const [activeStatus, setActiveStatus] = useState<'pre' | 'live'>('pre');

  const toggleLeague = (lg: string) => {
    const next = new Set(activeLeagues);
    if (next.has(lg)) next.delete(lg); else next.add(lg);
    setActiveLeagues(next);
  };

  const filtered = useMemo(() => {
    return enriched.filter(({ f, c }) => {
      const statusOk = f.status ? (f.status === activeStatus) : (activeStatus === 'pre');
      const sportOk = activeSport === 'All' ? true : c.sport === activeSport;
      const leagueOk = activeLeagues.size === 0 ? true : (c.league ? activeLeagues.has(c.league) : false);
      const text = `${f.title} ${f.homeTeam} ${f.awayTeam}`.toLowerCase();
      const qOk = query ? text.includes(query.toLowerCase()) : true;
      return statusOk && sportOk && leagueOk && qOk;
    });
  }, [enriched, activeStatus, activeSport, activeLeagues, query]);

  const matches: LiveMatch[] = useMemo(() => {
    return filtered.map(({ f, c }) => ({
      id: f.id,
      sport: c.sport,
      teams: { home: { name: f.homeTeam }, away: { name: f.awayTeam } },
      status: { time: f.kickoffTime, isLive: f.status === 'live' },
      liveOdds: (f.status === 'live' ? f.liveOdds : f.preOdds) || undefined,
      marketUrl: `/sports-betting?fixtureId=${encodeURIComponent(f.id)}&autoOpen=1`
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* 筛选区 */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="text-lg">Browse Sports Fixtures</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 状态切换：Pre / In-Play */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded-md text-sm border ${activeStatus === 'pre' ? 'bg-primary text-primary-foreground' : 'bg-muted'} hover:bg-accent`}
              onClick={() => setActiveStatus('pre')}
            >Pre-Game</button>
            <button
              className={`px-3 py-1 rounded-md text-sm border ${activeStatus === 'live' ? 'bg-primary text-primary-foreground' : 'bg-muted'} hover:bg-accent`}
              onClick={() => setActiveStatus('live')}
            >In-Play</button>
          </div>

          {/* 一级：运动类型 Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded-md text-sm border ${activeSport === 'All' ? 'bg-primary text-primary-foreground' : 'bg-muted'} hover:bg-accent`}
              onClick={() => setActiveSport('All')}
            >All</button>
            {sports.map(sp => (
              <button
                key={sp}
                className={`px-3 py-1 rounded-md text-sm border ${activeSport === sp ? 'bg-primary text-primary-foreground' : 'bg-muted'} hover:bg-accent`}
                onClick={() => setActiveSport(sp)}
              >{sp}</button>
            ))}
          </div>

          {/* 二级：联赛 Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {leagues.map(lg => {
              const selected = activeLeagues.has(lg);
              return (
                <button
                  key={lg}
                  className={`px-3 py-1 rounded-full text-xs border ${selected ? 'ring-2 ring-primary bg-primary/10' : 'bg-muted'} hover:bg-accent`}
                  onClick={() => toggleLeague(lg)}
                >{lg}</button>
              );
            })}
          </div>

          {/* 搜索框 */}
          <div className="flex items-center gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or teams"
            />
          </div>

          <Separator className="my-4" />

          <p className="text-xs text-muted-foreground">Tip: Use status toggle to switch Pre/In-Play. Click a card to open the betting drawer.</p>
        </CardContent>
      </Card>

      {/* 列表区：仅显示当前状态对应的数据 */}
      <LiveInPlayGrid matches={matches} />
    </div>
  );
}