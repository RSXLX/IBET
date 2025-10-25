'use client';

import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Brush, ReferenceLine } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface LiveOddsChartProps {
  homeCode: string;
  awayCode: string;
  data: { t: number; ts: number; home: number; away: number }[];
  liquidation: number;
  selectedTeam: 'home' | 'away' | null;
}

export function LiveOddsChart({ homeCode, awayCode, data, liquidation, selectedTeam }: LiveOddsChartProps) {
  const homeStroke = '#6A4BFF';
  const awayStroke = '#00E0A8';

  const homeWidth = selectedTeam === 'home' ? 3 : 2;
  const awayWidth = selectedTeam === 'away' ? 3 : 2;
  const homeOpacity = selectedTeam ? (selectedTeam === 'home' ? 1 : 0.8) : 1;
  const awayOpacity = selectedTeam ? (selectedTeam === 'away' ? 1 : 0.8) : 1;

  const [range, setRange] = useState<{ startIndex?: number; endIndex?: number }>({});

  const startTs = data.length ? data[0].ts : undefined;
  const endTs = data.length ? data[data.length - 1].ts : undefined;

  const formatTs = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const tickFormatter = (val: number) => {
    const d = new Date(val);
    return `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <Card className="tech-card w-full min-w-0">
      <CardHeader>
        <CardTitle className="text-center text-lg">Live Odds</CardTitle>
        <div className="text-xs text-muted-foreground text-center">{formatTs(startTs)} — {formatTs(endTs)}</div>
      </CardHeader>
      <CardContent>
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              {/* 修改：使用 number 轴并锁定完整数据域，优化时间轴可读性 */}
              <XAxis dataKey="ts" type="number" domain={["dataMin", "dataMax"]} axisLine={false} tickLine={false} tickFormatter={tickFormatter} minTickGap={24} />
              <YAxis domain={[1, 4]} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={(val: any) => formatTs(typeof val === 'number' ? val : Number(val))} formatter={(val: any) => (typeof val === 'number' ? val.toFixed(2) : val)} />
              <ReferenceLine y={liquidation} stroke="#9CA3AF" strokeDasharray="4 4" ifOverflow="extendDomain" label={{ position: 'right', value: 'Liquidation', fill: '#9CA3AF', fontSize: 10 }} />
              <Line type="monotone" dataKey="home" name={homeCode} stroke={homeStroke} strokeWidth={homeWidth} strokeOpacity={homeOpacity} dot={false} isAnimationActive={true} animationDuration={300} />
              <Line type="monotone" dataKey="away" name={awayCode} stroke={awayStroke} strokeWidth={awayWidth} strokeOpacity={awayOpacity} dot={false} isAnimationActive={true} animationDuration={300} />
              <Brush dataKey="ts" travellerWidth={8} height={24} startIndex={range.startIndex} endIndex={range.endIndex} onChange={(r) => setRange({ startIndex: r?.startIndex, endIndex: r?.endIndex })} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}