'use client';

import Link from 'next/link';
import {
  BookOpen,
  Video,
  Mic,
  Database,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Key
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiKey } from '@/contexts/ApiKeyContext';

const modules = [
  {
    path: '/story-factory',
    name: 'AI Story Factory',
    description: 'Viết kịch bản truyện với 16 phong cách khác nhau. Tạo ý tưởng, phát triển cốt truyện và xuất bản tác phẩm của bạn.',
    icon: BookOpen,
    gradient: 'from-purple-500 to-indigo-600',
    features: ['16 Writing Styles', 'Idea Generation', 'Story Library', 'Multi-chapter Support']
  },
  {
    path: '/scene-gen',
    name: 'ScriptGen AI Agent',
    description: 'Chuyển đổi voice data thành Scene JSON với pipeline multi-agent. Tạo characters, snippets và scenes tự động.',
    icon: Video,
    gradient: 'from-cyan-500 to-blue-600',
    features: ['Multi-Agent Pipeline', 'Character Bible', 'Scene Generation', 'Batch Processing']
  },
  {
    path: '/voice-editor',
    name: 'VietVoice Pro Editor',
    description: 'Phân tách văn bản thành voice segments tối ưu cho TTS. Kiểm soát độ dài âm tiết và chỉnh sửa theo thời gian thực.',
    icon: Mic,
    gradient: 'from-green-500 to-emerald-600',
    features: ['Syllable Counting', 'Segment Optimization', 'Real-time Editor', 'JSON Export']
  },
  {
    path: '/data-tools',
    name: 'SceneJSON Pro VN',
    description: 'Công cụ xử lý và phân tích dữ liệu Scene JSON chuyên nghiệp. Import, trích xuất, thay thế và chuẩn hóa prompt.',
    icon: Database,
    gradient: 'from-orange-500 to-amber-600',
    features: ['Data Import/Export', 'JSON Replacement', 'Gemini Integration', 'TVC Extraction']
  },
];

export default function HomePage() {
  const { user, isPremium, isGold } = useAuth();
  const { hasValidKey, openModal } = useApiKey();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Welcome Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">
                {user ? `Xin chào, ${user.displayName || user.email?.split('@')[0]}!` : 'AI-Powered Content Creation'}
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              16Styles AI Platform
            </span>
          </h1>
          <p className="text-xl text-gray-400 text-center max-w-3xl mx-auto mb-12">
            Nền tảng hợp nhất 4 công cụ AI mạnh mẽ cho sáng tạo nội dung.
            Từ viết truyện đến xử lý dữ liệu, tất cả trong một.
          </p>

          {/* Quick Actions */}
          {!hasValidKey && (
            <div className="flex justify-center mb-12">
              <button
                onClick={openModal}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
              >
                <Key className="w-5 h-5" />
                Thêm API Key để bắt đầu
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Chọn Công Cụ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.path}
                  href={module.path}
                  className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all hover:shadow-xl hover:shadow-black/20"
                >
                  {/* Gradient Overlay on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {module.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {module.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {module.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-md"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Single Sign-On</h3>
              <p className="text-sm text-gray-500">
                Đăng nhập một lần, sử dụng tất cả 4 module. Dữ liệu đồng bộ xuyên suốt.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Key className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">API Key Rotation</h3>
              <p className="text-sm text-gray-500">
                Hệ thống xoay vòng key tự động để tránh rate limit và tối ưu chi phí.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Role-Based Access</h3>
              <p className="text-sm text-gray-500">
                Phân quyền Free, Silver, Gold với các tính năng premium khác nhau.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            16Styles AI Platform © 2025. Built with Next.js, Firebase & Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
