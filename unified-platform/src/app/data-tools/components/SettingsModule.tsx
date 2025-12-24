'use client';

import React from 'react';
import { Settings, Trash2, AlertTriangle, Key, Download, Upload } from 'lucide-react';
import { DataToolsHook } from '../hooks/useDataTools';
import { saveTextFile } from '../utils/helpers';

interface SettingsModuleProps {
    hook: DataToolsHook;
}

export function SettingsModule({ hook }: SettingsModuleProps) {
    const handleClearProject = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Thao tác này không thể hoàn tác.')) {
            hook.clearProject();
            window.location.reload();
        }
    };

    const handleExportProject = () => {
        const exportData = {
            sceneData: hook.sceneData,
            settings: hook.settings,
            jsonRules: hook.jsonRules,
            exportedAt: new Date().toISOString(),
        };
        saveTextFile(JSON.stringify(exportData, null, 2), 'data_tools_project.json');
    };

    const separatorOptions = [
        { value: '\n\n', label: 'Hai dòng mới (\\n\\n)' },
        { value: '\n', label: 'Một dòng mới (\\n)' },
        { value: '\n---\n', label: 'Dashes (---)' },
        { value: '\n===\n', label: 'Equals (===)' },
        { value: ' ', label: 'Dấu cách' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Cài Đặt</h2>
                    <p className="text-sm text-gray-500">Cấu hình ứng dụng và quản lý dữ liệu</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Join Separator */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dấu phân cách (khi gộp dữ liệu)
                    </label>
                    <select
                        value={hook.settings.joinSeparator}
                        onChange={(e) => hook.updateSettings({ joinSeparator: e.target.value })}
                        className="w-full md:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-800"
                    >
                        {separatorOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Data Stats */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Thống kê dữ liệu</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-2xl font-bold text-orange-600">{hook.sceneData.length}</p>
                            <p className="text-xs text-gray-500">Rows</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{hook.availableKeys.length}</p>
                            <p className="text-xs text-gray-500">Fields</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-600">{hook.jsonRules.length}</p>
                            <p className="text-xs text-gray-500">Rules</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{hook.selectedKeys.size}</p>
                            <p className="text-xs text-gray-500">Selected</p>
                        </div>
                    </div>
                </div>

                {/* Export/Import */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Xuất/Nhập Project</h3>
                    <div className="flex gap-4">
                        <button
                            onClick={handleExportProject}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export Project
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Danger Zone
                    </h3>
                    <button
                        onClick={handleClearProject}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa tất cả dữ liệu
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                        Thao tác này sẽ xóa tất cả dữ liệu đã import. API Key và cài đặt được giữ lại.
                    </p>
                </div>
            </div>
        </div>
    );
}
