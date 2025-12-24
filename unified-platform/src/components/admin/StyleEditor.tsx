'use client';

import React, { useState, useEffect } from 'react';
import {
    X, Save, Loader2, Info, BookOpen, Video, Settings,
    Sparkles, AlertCircle
} from 'lucide-react';
import {
    UnifiedStyle,
    createEmptyStyle,
    toPascalCase,
    AVAILABLE_ICONS,
    AVAILABLE_COLORS,
} from '@/types/styles';
import { createStyle, updateStyle } from '@/services/stylesService';
import { useAuth } from '@/contexts/AuthContext';

// Dynamic icon import
import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

type TabId = 'basic' | 'story' | 'scene' | 'advanced';

interface StyleEditorProps {
    style: UnifiedStyle | null;
    isCreating: boolean;
    onSave: () => void;
    onCancel: () => void;
}

export function StyleEditor({ style, isCreating, onSave, onCancel }: StyleEditorProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabId>('basic');
    const [formData, setFormData] = useState<Omit<UnifiedStyle, 'createdAt' | 'updatedAt'>>(
        style ? { ...style, createdAt: undefined, updatedAt: undefined } as unknown as Omit<UnifiedStyle, 'createdAt' | 'updatedAt'> : createEmptyStyle()
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update form when style changes
    useEffect(() => {
        if (style) {
            setFormData({ ...style, createdAt: undefined, updatedAt: undefined } as unknown as Omit<UnifiedStyle, 'createdAt' | 'updatedAt'>);
        } else if (isCreating) {
            setFormData(createEmptyStyle());
        }
    }, [style, isCreating]);

    // Auto-generate sceneId from id
    useEffect(() => {
        if (formData.id && !formData.sceneId) {
            setFormData(prev => ({ ...prev, sceneId: toPascalCase(prev.id) }));
        }
    }, [formData.id, formData.sceneId]);

    // Update field
    const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    // Validate form
    const validateForm = (): string | null => {
        if (!formData.id.trim()) return 'ID là bắt buộc';
        if (!/^[a-z0-9-]+$/.test(formData.id)) return 'ID chỉ chứa chữ thường, số và dấu gạch ngang';
        if (!formData.name.trim()) return 'Tên là bắt buộc';
        if (!formData.sceneId.trim()) return 'Scene ID là bắt buộc';
        return null;
    };

    // Handle save
    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSaving(true);
        setError(null);

        try {
            if (isCreating) {
                // For creating, include id
                const dataToSave = {
                    ...formData,
                    createdBy: user?.uid || 'admin',
                };
                await createStyle(dataToSave);
            } else {
                // For updating, exclude id, createdAt, updatedAt (they are managed by service)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, createdAt, updatedAt, ...updateData } = formData as typeof formData & { createdAt?: unknown; updatedAt?: unknown };

                // Remove any remaining undefined values
                const cleanData = Object.fromEntries(
                    Object.entries(updateData).filter(([_, v]) => v !== undefined)
                );

                await updateStyle(formData.id, {
                    ...cleanData,
                    createdBy: user?.uid || 'admin',
                });
            }
            onSave();
        } catch (err: unknown) {
            console.error('Error saving style:', err);
            // Check for permission error
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
                setError('Không có quyền lưu style. Vui lòng kiểm tra role Admin trong Firestore.');
            } else if (errorMessage.includes('undefined')) {
                setError('Dữ liệu không hợp lệ. Vui lòng điền đầy đủ các trường bắt buộc.');
            } else {
                setError('Lỗi khi lưu style. Vui lòng thử lại.');
            }
        } finally {
            setSaving(false);
        }
    };

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

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'basic', label: 'Cơ bản', icon: <Info className="w-4 h-4" /> },
        { id: 'story', label: 'Story Factory', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'scene', label: 'Scene Gen', icon: <Video className="w-4 h-4" /> },
        { id: 'advanced', label: 'Nâng cao', icon: <Settings className="w-4 h-4" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="w-full max-w-4xl max-h-[90vh] bg-gray-900 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gray-800 ${formData.colorClass}`}>
                            {getIcon(formData.iconName)}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {isCreating ? 'Tạo Style Mới' : `Chỉnh sửa: ${style?.name}`}
                            </h2>
                            <p className="text-sm text-gray-400">
                                {isCreating ? 'Điền thông tin để tạo style mới' : 'Cập nhật thông tin style'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 px-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${activeTab === tab.id
                                ? 'text-indigo-400 border-indigo-400'
                                : 'text-gray-400 border-transparent hover:text-white'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Basic Tab */}
                    {activeTab === 'basic' && (
                        <div className="space-y-4">
                            {/* ID & Scene ID */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        ID <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.id}
                                        onChange={(e) => updateField('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                        disabled={!isCreating}
                                        placeholder="edo-samurai"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Chữ thường, số, dấu gạch ngang</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Scene ID <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.sceneId}
                                        onChange={(e) => updateField('sceneId', e.target.value)}
                                        placeholder="EdoSamurai"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">PascalCase cho Module 2</p>
                                </div>
                            </div>

                            {/* Name & Tagline */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Tên hiển thị <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        placeholder="Samurai Edo"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Tagline</label>
                                    <input
                                        type="text"
                                        value={formData.tagline}
                                        onChange={(e) => updateField('tagline', e.target.value)}
                                        placeholder="Danh dự, Kiếm đạo, Tĩnh lặng"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    rows={3}
                                    placeholder="Mô tả chi tiết về style này..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            {/* Icon & Color */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-800 rounded-lg">
                                        {AVAILABLE_ICONS.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => updateField('iconName', icon)}
                                                className={`p-2 rounded transition ${formData.iconName === icon
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-400 hover:bg-gray-700'
                                                    }`}
                                                title={icon}
                                            >
                                                {getIcon(icon)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Màu sắc</label>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-800 rounded-lg">
                                        {AVAILABLE_COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => updateField('colorClass', color.value)}
                                                className={`w-8 h-8 rounded-lg transition ${color.bg} ${formData.colorClass === color.value
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900'
                                                    : ''
                                                    }`}
                                                title={color.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                <div>
                                    <p className="text-white font-medium">Kích hoạt</p>
                                    <p className="text-sm text-gray-400">Style này sẽ hiển thị cho người dùng</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateField('isActive', !formData.isActive)}
                                    className={`relative w-12 h-6 rounded-full transition ${formData.isActive ? 'bg-indigo-600' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${formData.isActive ? 'left-7' : 'left-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Story Tab */}
                    {activeTab === 'story' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm">
                                <strong>Module 1 - Story Factory:</strong> Các prompt dùng để viết truyện/kịch bản
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">System Prompt</label>
                                <textarea
                                    value={formData.storySystemPrompt}
                                    onChange={(e) => updateField('storySystemPrompt', e.target.value)}
                                    rows={8}
                                    placeholder="Bạn là Agent..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Template mẫu</label>
                                <textarea
                                    value={formData.storyTemplate}
                                    onChange={(e) => updateField('storyTemplate', e.target.value)}
                                    rows={5}
                                    placeholder="Bối cảnh:..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Scene Tab */}
                    {activeTab === 'scene' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 text-sm">
                                <strong>Module 2 - Scene Generator:</strong> 3-step pipeline để tạo Scene JSON
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Step 1: Character System (Character Bible Creator)
                                </label>
                                <textarea
                                    value={formData.characterSystem}
                                    onChange={(e) => updateField('characterSystem', e.target.value)}
                                    rows={6}
                                    placeholder="You are Assistant 1 — Character Bible Creator..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Step 2: Snippet System (Prompt Snippet Generator)
                                </label>
                                <textarea
                                    value={formData.snippetSystem}
                                    onChange={(e) => updateField('snippetSystem', e.target.value)}
                                    rows={6}
                                    placeholder="You are Assistant 2 — CHARACTER VARIANT PROMPT GENERATOR..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Step 3: Scene System (Scene Generator)
                                </label>
                                <textarea
                                    value={formData.sceneSystem}
                                    onChange={(e) => updateField('sceneSystem', e.target.value)}
                                    rows={6}
                                    placeholder="You are Assistant 3 — INTERACTIVE SCENE GENERATOR..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Advanced Tab */}
                    {activeTab === 'advanced' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm">
                                <strong>Cài đặt nâng cao:</strong> Dialog style, cinematic style, và cấu hình batch
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Dialog Style</label>
                                <textarea
                                    value={formData.dialogStyle}
                                    onChange={(e) => updateField('dialogStyle', e.target.value)}
                                    rows={2}
                                    placeholder="Minimalist, stoic, formal speech."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Cinematic Style</label>
                                <textarea
                                    value={formData.cinematicStyle}
                                    onChange={(e) => updateField('cinematicStyle', e.target.value)}
                                    rows={2}
                                    placeholder="Cinematic aesthetic with..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Scene Batch Size</label>
                                    <input
                                        type="number"
                                        value={formData.sceneBatchSize}
                                        onChange={(e) => updateField('sceneBatchSize', parseInt(e.target.value) || 5)}
                                        min={1}
                                        max={20}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Scene Delay (ms)</label>
                                    <input
                                        type="number"
                                        value={formData.sceneDelayMs}
                                        onChange={(e) => updateField('sceneDelayMs', parseInt(e.target.value) || 2000)}
                                        min={500}
                                        max={10000}
                                        step={500}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-400 hover:text-white transition"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {isCreating ? 'Tạo Style' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StyleEditor;
