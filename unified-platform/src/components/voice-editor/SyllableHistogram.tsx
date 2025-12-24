'use client';

import React from 'react';
import { Segment } from '@/lib/voice-editor/types';
import { countSyllables } from '@/lib/voice-editor/syllableCounter';

interface SyllableHistogramProps {
    segments: Segment[];
    min: number;
    max: number;
}

export function SyllableHistogram({ segments, min, max }: SyllableHistogramProps) {
    // Create buckets for syllable counts
    const buckets: Record<number, number> = {};
    let minBucket = Infinity;
    let maxBucket = 0;

    segments.forEach(seg => {
        const count = seg.syllable_count;
        buckets[count] = (buckets[count] || 0) + 1;
        minBucket = Math.min(minBucket, count);
        maxBucket = Math.max(maxBucket, count);
    });

    // Extend range a bit for context
    const displayMin = Math.max(1, Math.min(minBucket, min) - 2);
    const displayMax = Math.max(maxBucket, max) + 2;

    // Find max frequency for scaling
    const maxFreq = Math.max(...Object.values(buckets), 1);

    const bars = [];
    for (let i = displayMin; i <= displayMax; i++) {
        const freq = buckets[i] || 0;
        const height = freq > 0 ? Math.max((freq / maxFreq) * 100, 8) : 0;
        const isInRange = i >= min && i <= max;

        bars.push(
            <div
                key={i}
                className="flex flex-col items-center gap-1"
                title={`${i} âm tiết: ${freq} segments`}
            >
                <div className="h-20 w-6 flex items-end">
                    <div
                        className={`w-full rounded-t transition-all ${isInRange ? 'bg-emerald-500' : 'bg-red-400'
                            }`}
                        style={{ height: `${height}%` }}
                    />
                </div>
                <span className={`text-xs font-medium ${isInRange ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                    {i}
                </span>
                {freq > 0 && (
                    <span className="text-xs text-gray-500">{freq}</span>
                )}
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-end justify-center gap-1 overflow-x-auto pb-2">
                {bars}
            </div>
            <div className="mt-2 flex justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded" />
                    <span>Đạt chuẩn ({min}-{max})</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded" />
                    <span>Cần sửa</span>
                </div>
            </div>
        </div>
    );
}

export default SyllableHistogram;
