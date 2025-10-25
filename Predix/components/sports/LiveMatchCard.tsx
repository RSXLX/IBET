'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type Team = {
  name: string;
  score?: number;
  code?: string;
};

export type LiveMatch = {
  id: string;
  sport: string;
  teams: { home: Team; away: Team };
  status: { time?: string; isLive?: boolean; phase?: string };
  liveOdds?: { home?: number; draw?: number; away?: number };
  marketUrl: string;
};

export function LiveMatchCard({ match, onOpen }: { match: LiveMatch; onOpen?: (m: LiveMatch) => void }) {
  const { sport, teams, status, liveOdds, marketUrl } = match;

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen?.(match);
  };

  const CardInner = (
    <Card className="min-w-0 group cursor-pointer select-none transition-transform duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.99] hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{sport}</span>
          {status?.isLive && (
            <span className="text-xs text-emerald-500">Live</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">{teams.home.name}</span>
          <span>{teams.home.score ?? '-'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{teams.away.name}</span>
          <span>{teams.away.score ?? '-'}</span>
        </div>
        {status?.time && (
          <div className="text-xs text-muted-foreground">{status.time}</div>
        )}
        {liveOdds && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded bg-muted px-2 py-1 text-center">H {liveOdds.home ?? '-'}</div>
            {'draw' in liveOdds && (
              <div className="rounded bg-muted px-2 py-1 text-center">D {liveOdds.draw}</div>
            )}
            <div className="rounded bg-muted px-2 py-1 text-center">A {liveOdds.away ?? '-'}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (onOpen) {
    return (
      <div onClick={handleOpen} className="min-w-0">
        {CardInner}
      </div>
    );
  }

  return (
    <Link href={marketUrl} className="block">
      {CardInner}
    </Link>
  );
}