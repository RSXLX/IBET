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

  const toggleLeague = (lg: string) => {
    const next = new Set(activeLeagues);
    if (next.has(lg)) next.delete(lg); else next.add(lg);
    setActiveLeagues(next);
  };

  const matches: LiveMatch[] = useMemo(() => {
    const list = enriched
      .filter(({ f, c }) => {
        const sportOk = activeSport === 'All' ? true : c.sport === activeSport;
        const leagueOk = activeLeagues.size === 0 ? true : (c.league ? activeLeagues.has(c.league) : false);
        const text = `${f.title} ${f.homeTeam} ${f.awayTeam}`.toLowerCase();
        const qOk = query ? text.includes(query.toLowerCase()) : true;
        return sportOk && leagueOk && qOk;
      })
      .map(({ f, c }) => ({
        id: f.id,
        sport: c.sport,
        teams: { home: { name: f.homeTeam }, away: { name: f.awayTeam } },
        status: { time: f.kickoffTime, isLive: false },
        liveOdds: f.preOdds ? { home: f.preOdds.home, draw: f.preOdds.draw, away: f.preOdds.away } : undefined,
        marketUrl: `/sports-betting?fixtureId=${encodeURIComponent(f.id)}&autoOpen=1`
      }));
    return list;
  }, [enriched, activeSport, activeLeagues, query]);

  return (
    <div className="space-y-6">
      {/* 筛选区 */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="text-lg">Browse Sports Fixtures</CardTitle>
        </CardHeader>
        <CardContent>
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

          <p className="text-xs text-muted-foreground">Tip: Click a fixture card to open the betting drawer. Use tabs and chips to quickly filter by sport and league.</p>
        </CardContent>
      </Card>

      {/* 列表区 */}
      <LiveInPlayGrid matches={matches} />

      {/* 新增：从 API 获取的实时比赛区块，便于预览直播信号 */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="text-lg">In-Play Now</CardTitle>
        </CardHeader>
        <CardContent>
          <LiveInPlayGrid />
        </CardContent>
      </Card>
    </div>
  );
}