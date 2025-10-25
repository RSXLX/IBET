'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ReferenceLine, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface OddsChartProps {
  homeCode: string;
  awayCode: string;
  odds: { home: number; away: number; liquidation: number };
  selectedTeam: 'home' | 'away' | null;
}

export function OddsChart({ homeCode, awayCode, odds, selectedTeam }: OddsChartProps) {
  const data = [
    { name: homeCode, odds: odds.home, fill: '#6A4BFF' },
    { name: awayCode, odds: odds.away, fill: '#00E0A8' }
  ];

  return (
    <Card className="tech-card w-full min-w-0">
      <CardHeader>
        <CardTitle className="text-center text-lg">Odds Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis domain={[0, 4]} axisLine={false} tickLine={false} />
              <Bar dataKey="odds" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => {
                  const isSelected = (selectedTeam === 'home' && entry.name === homeCode) ||
                                     (selectedTeam === 'away' && entry.name === awayCode);
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      opacity={selectedTeam ? (isSelected ? 1 : 0.6) : 1}
                      stroke={isSelected ? '#ffffff' : undefined}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Bar>
              <ReferenceLine y={odds.liquidation} stroke="#FF4757" strokeDasharray="5 5" label="Liquidation" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-destructive">Liquidation Odds: {odds.liquidation}</p>
        </div>
      </CardContent>
    </Card>
  );
}