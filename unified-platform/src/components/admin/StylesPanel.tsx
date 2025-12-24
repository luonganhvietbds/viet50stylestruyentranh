'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Edit2, Trash2, Eye, EyeOff,
    Loader2, RefreshCw, Download, Upload,
    ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { UnifiedStyle } from '@/types/styles';
import {
    getAllStyles,
    deleteStyle,
    toggleStyleActive,
    seedStyles,
    isStylesCollectionEmpty,
} from '@/services/stylesService';
import { DEFAULT_STYLES } from '@/data/defaultStyles';
import { StyleEditor } from '@/components/admin/StyleEditor';

// Dynamic icon import helper
import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface StylesPanelProps {
    onRefresh?: () => void;
}

export function StylesPanel({ onRefresh }: StylesPanelProps) {
    const [styles, setStyles] = useState<UnifiedStyle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingStyle, setEditingStyle] = useState<UnifiedStyle | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Fetch styles from Firestore
    const fetchStyles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllStyles();
            setStyles(data);
        } catch (err) {
            console.error('Error fetching styles:', err);
            setError('Không thể tải danh sách styles');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStyles();
    }, [fetchStyles]);

    // Seed default styles if collection is empty
    const handleSeedStyles = async () => {
        setActionLoading('seed');
        try {
            const isEmpty = await isStylesCollectionEmpty();
            if (isEmpty) {
                await seedStyles(DEFAULT_STYLES);
                setSuccess('Đã thêm các styles mặc định!');
                await fetchStyles();
            } else {
                setError('Collection đã có dữ liệu. Xóa hết trước để seed lại.');
            }
        } catch (err) {
            console.error('Error seeding styles:', err);
            setError('Lỗi khi thêm styles mặc định');
        } finally {
            setActionLoading(null);
        }
    };

    // Toggle style active status
    const handleToggleActive = async (id: string, currentActive: boolean) => {
        setActionLoading(id);
        try {
            await toggleStyleActive(id, !currentActive);
            setStyles(prev =>
                prev.map(s => (s.id === id ? { ...s, isActive: !currentActive } : s))
            );
        } catch (err) {
            console.error('Error toggling style:', err);
            setError('Lỗi khi cập nhật trạng thái');
        } finally {
            setActionLoading(null);
        }
    };

    // Delete style
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa style "${name}"?`)) return;

        setActionLoading(id);
        try {
            await deleteStyle(id);
            setStyles(prev => prev.filter(s => s.id !== id));
            setSuccess(`Đã xóa style "${name}"`);
        } catch (err) {
            console.error('Error deleting style:', err);
            setError('Lỗi khi xóa style');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle save from editor
    const handleSaveStyle = async () => {
        setEditingStyle(null);
        setIsCreating(false);
        await fetchStyles();
        setSuccess(isCreating ? 'Đã tạo style mới!' : 'Đã cập nhật style!');
        onRefresh?.();
    };

    // Filter styles by search query
    const filteredStyles = styles.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tagline.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get icon component
    const getIcon = (iconName: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const icons = LucideIcons as unknown as Record<string, any>;
        const IconComponent = icons[iconName];
        if (IconComponent && typeof IconComponent === 'function') {
            return <IconComponent className="w-5 h-5" />;
        }
        return <Sparkles className="w-5 h-5" />;
    };

    // Clear messages after delay
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <h2 className="text-xl font-bold text-white">Quản Lý Styles</h2>

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handleSeedStyles}
                        disabled={actionLoading === 'seed'}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/20 text-amber-400 rounded-lg text-sm hover:bg-amber-600/30 transition disabled:opacity-50"
                    >
                        {actionLoading === 'seed' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Seed Mặc Định
                    </button>

                    <button
                        onClick={fetchStyles}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>

                    <button
                        onClick={() => {
                            setIsCreating(true);
                            setEditingStyle(null);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm Style
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                    {success}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo tên, ID hoặc tagline..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-gray-400">
                <span>Tổng: <strong className="text-white">{styles.length}</strong></span>
                <span>Đang hoạt động: <strong className="text-green-400">{styles.filter(s => s.isActive).length}</strong></span>
                <span>Tắt: <strong className="text-gray-500">{styles.filter(s => !s.isActive).length}</strong></span>
            </div>

            {/* Styles List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            ) : filteredStyles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    {searchQuery ? 'Không tìm thấy style phù hợp' : 'Chưa có style nào. Click "Seed Mặc Định" để thêm.'}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredStyles.map((style) => (
                        <div
                            key={style.id}
                            className={`bg-gray-800/50 border rounded-lg overflow-hidden transition ${style.isActive ? 'border-gray-700' : 'border-gray-800 opacity-60'
                                }`}
                        >
                            {/* Style Header */}
                            <div className="flex items-center gap-3 p-3">
                                {/* Icon */}
                                <div className={`p-2 rounded-lg bg-gray-800 ${style.colorClass}`}>
                                    {getIcon(style.iconName)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-white truncate">{style.name}</h3>
                                        <code className="text-xs text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">
                                            {style.id}
                                        </code>
                                        {!style.isActive && (
                                            <span className="text-xs text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">
                                                Đã tắt
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">{style.tagline}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleToggleActive(style.id, style.isActive)}
                                        disabled={actionLoading === style.id}
                                        className={`p-2 rounded-lg transition ${style.isActive
                                            ? 'text-green-400 hover:bg-green-500/10'
                                            : 'text-gray-500 hover:bg-gray-700'
                                            }`}
                                        title={style.isActive ? 'Tắt style' : 'Bật style'}
                                    >
                                        {actionLoading === style.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : style.isActive ? (
                                            <Eye className="w-4 h-4" />
                                        ) : (
                                            <EyeOff className="w-4 h-4" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setEditingStyle(style)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(style.id, style.name)}
                                        disabled={actionLoading === style.id}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => setExpandedId(expandedId === style.id ? null : style.id)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                                        title="Xem chi tiết"
                                    >
                                        {expandedId === style.id ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === style.id && (
                                <div className="border-t border-gray-700 p-4 space-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-500">Mô tả:</span>
                                        <p className="text-gray-300 mt-1">{style.description}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-500">Scene ID:</span>
                                            <code className="ml-2 text-indigo-400">{style.sceneId}</code>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Batch Size:</span>
                                            <span className="ml-2 text-white">{style.sceneBatchSize}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className={`p-2 rounded bg-gray-900 ${style.storySystemPrompt ? 'text-green-400' : 'text-gray-500'}`}>
                                            Story Prompt: {style.storySystemPrompt ? '✓' : '✕'}
                                        </div>
                                        <div className={`p-2 rounded bg-gray-900 ${style.characterSystem ? 'text-green-400' : 'text-gray-500'}`}>
                                            Character: {style.characterSystem ? '✓' : '✕'}
                                        </div>
                                        <div className={`p-2 rounded bg-gray-900 ${style.sceneSystem ? 'text-green-400' : 'text-gray-500'}`}>
                                            Scene: {style.sceneSystem ? '✓' : '✕'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Style Editor Modal */}
            {(editingStyle || isCreating) && (
                <StyleEditor
                    style={editingStyle}
                    isCreating={isCreating}
                    onSave={handleSaveStyle}
                    onCancel={() => {
                        setEditingStyle(null);
                        setIsCreating(false);
                    }}
                />
            )}
        </div>
    );
}

export default StylesPanel;
