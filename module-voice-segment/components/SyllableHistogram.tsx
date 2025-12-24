
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Segment } from '../types';

interface SyllableHistogramProps {
  segments: Segment[];
  min: number;
  max: number;
}

const SyllableHistogram: React.FC<SyllableHistogramProps> = ({ segments, min, max }) => {
  const data = React.useMemo(() => {
    const syllableCounts = new Map<number, number>();
    segments.forEach(segment => {
      const count = segment.syllable_count;
      syllableCounts.set(count, (syllableCounts.get(count) || 0) + 1);
    });

    const chartData = [];
    const minRange = Math.min(...Array.from(syllableCounts.keys()), 10);
    const maxRange = Math.max(...Array.from(syllableCounts.keys()), 30);

    for (let i = minRange; i <= maxRange; i++) {
      chartData.push({
        syllables: i,
        count: syllableCounts.get(i) || 0,
      });
    }

    return chartData;
  }, [segments]);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="syllables" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '12px' }} />
          <Bar dataKey="count">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.syllables < min || entry.syllables > max ? '#ef4444' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SyllableHistogram;
