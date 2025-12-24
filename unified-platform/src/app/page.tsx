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
  Key,
  Star,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiKey } from '@/contexts/ApiKeyContext';

const modules = [
  {
    path: '/story-factory',
    name: 'AI Story Factory',
    description: 'Viết kịch bản truyện với 16 phong cách khác nhau. Tạo ý tưởng, phát triển cốt truyện và xuất bản.',
    icon: BookOpen,
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/20',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    features: ['16 Writing Styles', 'Idea Generation', 'Story Library']
  },
  {
    path: '/scene-gen',
    name: 'ScriptGen AI Agent',
    description: 'Chuyển đổi voice data thành Scene JSON với pipeline multi-agent. Tạo characters và scenes tự động.',
    icon: Video,
    gradient: 'from-cyan-500 to-blue-600',
    bgGlow: 'bg-cyan-500/20',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    features: ['Multi-Agent Pipeline', 'Character Bible', 'Batch Processing']
  },
  {
    path: '/voice-editor',
    name: 'VietVoice Pro Editor',
    description: 'Phân tách văn bản thành voice segments tối ưu cho TTS. Kiểm soát độ dài và chỉnh sửa real-time.',
    icon: Mic,
    gradient: 'from-emerald-500 to-green-600',
    bgGlow: 'bg-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    features: ['Syllable Counting', 'Segment Optimization', 'JSON Export']
  },
  {
    path: '/data-tools',
    name: 'SceneJSON Pro VN',
    description: 'Công cụ xử lý và phân tích dữ liệu Scene JSON chuyên nghiệp. Import, trích xuất và chuẩn hóa.',
    icon: Database,
    gradient: 'from-orange-500 to-amber-600',
    bgGlow: 'bg-orange-500/20',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
    features: ['Data Import/Export', 'Gemini Integration', 'TVC Extraction']
  },
];

const features = [
  {
    icon: Zap,
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-400',
    title: 'Single Sign-On',
    description: 'Đăng nhập một lần, sử dụng tất cả module. Dữ liệu đồng bộ xuyên suốt.'
  },
  {
    icon: Key,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    title: 'API Key Rotation',
    description: 'Xoay vòng key tự động để tránh rate limit và tối ưu chi phí API.'
  },
  {
    icon: Shield,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    title: 'Role-Based Access',
    description: 'Phân quyền Free, Silver, Gold với các tính năng premium khác nhau.'
  }
];

export default function HomePage() {
  const { user } = useAuth();
  const { hasValidKey, openModal } = useApiKey();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-gradient-radial from-indigo-600/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-[-30%] left-[-10%] w-[600px] h-[600px] bg-gradient-radial from-purple-600/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-gradient-radial from-cyan-600/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Welcome Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 surface-base rounded-full">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-[rgb(var(--text-secondary))] font-medium">
                {user ? `Xin chào, ${user.displayName || user.email?.split('@')[0]}!` : 'AI-Powered Content Creation'}
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              16Styles AI
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[rgb(var(--text-tertiary))] text-center max-w-3xl mx-auto mb-12 leading-relaxed">
            Nền tảng hợp nhất 4 công cụ AI mạnh mẽ cho sáng tạo nội dung.
            Từ viết truyện đến xử lý dữ liệu, tất cả trong một.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {!hasValidKey ? (
              <button
                onClick={openModal}
                className="btn-primary flex items-center gap-3 px-8 py-4 text-lg"
              >
                <Key className="w-5 h-5" />
                Thêm API Key để bắt đầu
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <Link
                href="/story-factory"
                className="btn-primary flex items-center gap-3 px-8 py-4 text-lg"
              >
                <Sparkles className="w-5 h-5" />
                Bắt đầu sáng tạo
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}

            {hasValidKey && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">API Key đã sẵn sàng</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Chọn Công Cụ
            </h2>
            <p className="text-[rgb(var(--text-tertiary))] max-w-2xl mx-auto">
              4 module chuyên biệt, tích hợp trong một nền tảng duy nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.path}
                  href={module.path}
                  className="group relative card p-6 card-interactive"
                >
                  {/* Glow Effect on Hover */}
                  <div className={`absolute -inset-px ${module.bgGlow} opacity-0 group-hover:opacity-100 rounded-xl blur-xl transition-opacity duration-500`} />

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-sm text-[rgb(var(--text-tertiary))]">Open</span>
                        <ArrowRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2 group-hover:text-[rgb(var(--brand-primary-light))] transition-colors">
                      {module.name}
                    </h3>
                    <p className="text-[rgb(var(--text-tertiary))] text-sm mb-5 leading-relaxed">
                      {module.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {module.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-3 py-1.5 bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-tertiary))] rounded-md border border-[rgb(var(--border-subtle))]"
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
      <section className="py-20 px-4 border-t border-[rgb(var(--border-subtle))]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Tính Năng Nổi Bật
            </h2>
            <p className="text-[rgb(var(--text-tertiary))]">
              Được thiết kế cho hiệu suất và trải nghiệm người dùng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="text-center group">
                  <div className={`w-16 h-16 rounded-2xl ${feature.iconBg} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[rgb(var(--text-tertiary))] leading-relaxed max-w-xs mx-auto">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="surface-elevated rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">16</p>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">Writing Styles</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">4</p>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">AI Modules</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">∞</p>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">Possibilities</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">1</p>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">Platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-[rgb(var(--border-subtle))]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">16</span>
              </div>
              <div>
                <p className="font-semibold text-[rgb(var(--text-primary))]">16Styles AI</p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Unified Platform</p>
              </div>
            </div>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              © 2025. Built with Next.js, Firebase & Gemini AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
