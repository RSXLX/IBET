'use client';

import React, { useEffect } from 'react';
import { useSportsBetting } from '@/hooks/useSportsBetting';
import { OddsChart } from '@/components/sports/OddsChart';
import { LiveOddsChart } from '@/components/sports/LiveOddsChart';
import { LiveMatchIndicator } from '@/components/sports/LiveMatchIndicator';
import { BetPanel } from '@/components/sports/BetPanel';
import { MatchList } from '@/components/sports/MatchList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SportsBettingClientProps {
  fixtureId?: string;
  isLiveSignal?: boolean;
}

export function SportsBettingClient({ fixtureId, isLiveSignal }: SportsBettingClientProps) {
  const {
    matchData,
    chartData,
    liveChartData,
    isLive,
    startLive,
    stopLive,
    generateRandomOdds,
    updateMultiplier,
    updateWagerAmount,
    selectTeam,
    loadFixtureById,
    bets,
    placeBet,
  } = useSportsBetting(fixtureId);

  useEffect(() => {
    if (typeof isLiveSignal === 'boolean') {
      if (isLiveSignal && !isLive) startLive();
      if (!isLiveSignal && isLive) stopLive();
    }
    return () => {
      stopLive();
    };
  }, [isLiveSignal]);

  const sampleMatches = [
    { id: '101', teams: { home: 'Lakers', away: 'Celtics' }, odds: { home: 1.8, away: 2.1 } },
    { id: '102', teams: { home: 'Jets', away: 'Bills' }, odds: { home: 1.9, away: 1.95 } },
    { id: '103', teams: { home: 'Arsenal', away: 'Chelsea' }, odds: { home: 2.2, away: 1.7 } }
  ];

  return (
    <div className="min-h-screen text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Card className="tech-card mb-8">
          <CardHeader>
            <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
              {isLive ? 'Live In-Play Odds' : 'Pre-Game Betting Odds'}
              <LiveMatchIndicator isLive={isLive} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className={`w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2 mx-auto ${matchData.wager.selectedTeam === 'home' ? 'ring-4 ring-primary' : ''}`}>
                  <span className="text-xl font-bold">{matchData.teams.home.code}</span>
                </div>
                <p className="text-sm text-muted-foreground">{matchData.teams.home.name}</p>
              </div>

              <Separator orientation="vertical" className="h-12" />

              <div className="text-center">
                <p className="text-muted-foreground">vs</p>
              </div>

              <Separator orientation="vertical" className="h-12" />

              <div className="text-center">
                <div className={`w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-2 mx-auto ${matchData.wager.selectedTeam === 'away' ? 'ring-4 ring-secondary' : ''}`}>
                  <span className="text-xl font-bold">{matchData.teams.away.code}</span>
                </div>
                <p className="text-sm text-muted-foreground">{matchData.teams.away.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {isLive ? (
            <LiveOddsChart
              homeCode={matchData.teams.home.code}
              awayCode={matchData.teams.away.code}
              data={liveChartData}
              liquidation={matchData.odds.liquidation}
              selectedTeam={matchData.wager.selectedTeam}
            />
          ) : (
            <OddsChart
              homeCode={matchData.teams.home.code}
              awayCode={matchData.teams.away.code}
              odds={matchData.odds}
              selectedTeam={matchData.wager.selectedTeam}
            />
          )}

          <BetPanel
            home={{ code: matchData.teams.home.code, name: matchData.teams.home.name, odds: matchData.odds.home }}
            away={{ code: matchData.teams.away.code, name: matchData.teams.away.name, odds: matchData.odds.away }}
            selectedTeam={matchData.wager.selectedTeam}
            amount={matchData.wager.amount}
            multiplier={matchData.wager.multiplier}
            payout={matchData.wager.payout}
            liquidation={matchData.odds.liquidation}
            onSelectTeam={selectTeam}
            onAmountChange={updateWagerAmount}
            onMultiplierChange={updateMultiplier}
            onPlaceBet={() => {
              const result = placeBet();
              alert(JSON.stringify(result, null, 2));
            }}
          />
        </div>

        {/* Match list */}
        <></>
      </div>
    </div>
  );
}