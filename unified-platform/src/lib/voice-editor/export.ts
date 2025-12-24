// Voice Editor Export Functions

import { Segment } from './types';

/**
 * Export segments to TXT format
 */
export function exportToTxt(segments: Segment[]): string {
    return segments.map(s => s.text).join('\n');
}

/**
 * Export segments to JSON format
 */
export function exportToJson(segments: Segment[]): string {
    return JSON.stringify(segments, null, 2);
}

/**
 * Export segments to CSV format
 */
export function exportToCsv(segments: Segment[]): string {
    const headers = ['segment_id', 'text', 'syllable_count', 'is_valid', 'note'];
    const rows = segments.map(s => [
        s.segment_id,
        `"${s.text.replace(/"/g, '""')}"`,
        s.syllable_count.toString(),
        s.is_valid ? 'true' : 'false',
        `"${(s.note || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Download content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export and download segments
 */
export function exportSegments(segments: Segment[], format: 'txt' | 'json' | 'csv') {
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
        case 'txt':
            content = exportToTxt(segments);
            filename = 'voice_segments.txt';
            mimeType = 'text/plain';
            break;
        case 'json':
            content = exportToJson(segments);
            filename = 'voice_segments.json';
            mimeType = 'application/json';
            break;
        case 'csv':
            content = exportToCsv(segments);
            filename = 'voice_segments.csv';
            mimeType = 'text/csv';
            break;
    }

    downloadFile(content, filename, mimeType);
}
