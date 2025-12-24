
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { X, Check, Crown, Star, Shield, Zap, Copy, ArrowLeft, MessageCircle, Home, Loader2 } from 'lucide-react';
import { AppUser } from '../types';
import { db } from '../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const PricingModal = () => {
  const { isPricingModalOpen, setPricingModalOpen, user } = useAppStore();
  const [selectedTier, setSelectedTier] = useState<'silver' | 'gold' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isPricingModalOpen) return null;

  const currentRole = user?.role || 'free';

  // Định nghĩa giá và thông tin gói
  const Tiers = [
    {
      id: 'free',
      name: 'Free',
      price: '0đ',
      period: '/vĩnh viễn',
      description: 'Dành cho người mới bắt đầu.',
      icon: Shield,
      features: [
        'Tốc độ tạo cơ bản',
        'Model Gemini 2.5 Flash',
        'Tối đa 3 Jobs chạy cùng lúc',
        'Hỗ trợ cơ bản'
      ],
      unavailable: [
        'Chế độ Deep Thinking (Gemini 3.0)',
        'Ưu tiên xử lý hàng chờ',
        'Không giới hạn lịch sử',
        'Giấy phép thương mại'
      ]
    },
    {
      id: 'silver',
      name: 'Silver',
      rawPrice: 199000,
      price: '199.000đ',
      period: '/tháng',
      description: 'Dành cho Creator chuyên nghiệp.',
      icon: Star,
      popular: true,
      features: [
        'Tốc độ tạo nhanh',
        'Model Gemini 2.5 Flash',
        'Tối đa 10 Jobs chạy cùng lúc',
        'Ưu tiên hàng chờ',
        'Hỗ trợ qua Email',
        'Giấy phép thương mại'
      ],
      unavailable: [
        'Chế độ Deep Thinking (Gemini 3.0)',
        'Truy cập sớm các style mới'
      ]
    },
    {
      id: 'gold',
      name: 'Gold',
      rawPrice: 299000,
      price: '299.000đ',
      period: '/tháng',
      description: 'Sức mạnh tối đa cho Studio.',
      icon: Crown,
      features: [
        'Tốc độ siêu tốc',
        'Model Gemini 3.0 Pro (Thinking Mode)',
        'Không giới hạn Jobs',
        'Ưu tiên xử lý cao nhất',
        'Hỗ trợ 1-1 ưu tiên 24/7',
        'Giấy phép thương mại',
        'Truy cập tính năng Beta'
      ],
      unavailable: []
    }
  ];

  const handleSelectTier = (tierId: string) => {
    if (tierId === 'silver' || tierId === 'gold') {
      setSelectedTier(tierId);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép: ${text}`);
  };

  const handleConfirmPayment = async () => {
    if (!user || !selectedTier || !db) return;
    
    setIsProcessing(true);
    try {
        // 1. Tạo bản ghi giao dịch Pending trong Firestore
        await addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            userEmail: user.email,
            plan: selectedTier,
            amount: selectedTier === 'gold' ? 299000 : 199000,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // 2. Mở Zalo
        window.open("https://zalo.me/0384317062", "_blank");
        
        // 3. Đóng modal (hoặc hiển thị thông báo thành công)
        // setPricingModalOpen(false);
    } catch (error: any) {
        console.error("Error creating transaction:", error);
        if (error.code === 'permission-denied') {
            alert("Lỗi quyền truy cập: Admin chưa cấu hình Firestore Rules cho bảng 'transactions'. Vui lòng liên hệ Admin.");
        } else {
            alert("Có lỗi xảy ra khi tạo giao dịch. Vui lòng thử lại sau.");
        }
    } finally {
        setIsProcessing(false);
    }
  };

  const handleBackToHome = () => {
    setPricingModalOpen(false);
    setSelectedTier(null);
  };

  // --- MÀN HÌNH THANH TOÁN (VIETQR) ---
  if (selectedTier) {
    const tierInfo = Tiers.find(t => t.id === selectedTier);
    const amount = tierInfo?.rawPrice || 0;
    // Nội dung chuyển khoản: UPGRADE [UID_NGAN] [GOI]
    const shortUid = user?.uid.slice(0, 6).toUpperCase() || 'USER';
    const memo = `UPGRADE ${shortUid} ${selectedTier.toUpperCase()}`;
    
    // Link VietQR (MB Bank)
    const qrUrl = `https://img.vietqr.io/image/MB-19928668868686-compact2.png?amount=${amount}&addInfo=${memo}&accountName=LUONG ANH VIET`;

    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-800/50 shrink-0">
            <button onClick={() => setSelectedTier(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white">Thanh toán gói {tierInfo?.name}</h2>
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="bg-white p-4 rounded-xl mb-6 shadow-inner flex justify-center">
               <img src={qrUrl} alt="VietQR Code" className="w-full max-w-[300px] h-auto object-contain" />
            </div>

            <div className="space-y-4 text-sm mb-6">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Ngân hàng</span>
                <span className="font-bold text-white">MB Bank</span>
              </div>
              
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center group cursor-pointer" onClick={() => handleCopy("19928668868686")}>
                <span className="text-slate-400">Số tài khoản</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono text-base">19928668868686</span>
                  <Copy className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Chủ tài khoản</span>
                <span className="font-bold text-white uppercase">LUONG ANH VIET</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center group cursor-pointer" onClick={() => handleCopy(memo)}>
                <span className="text-slate-400">Nội dung CK</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-yellow-400 font-mono">{memo}</span>
                  <Copy className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/30 text-indigo-200 text-xs leading-relaxed text-center">
                ⚠️ Vui lòng chuyển khoản đúng nội dung để hệ thống tự động nhận diện.
              </div>
            </div>

            <div className="space-y-3 pb-2">
              <div className="text-center">
                <p className="text-[11px] text-slate-400 mb-2 italic">
                   "Hệ thống đang xử lý, vui lòng đợi hoặc có thể nhắn tin với admin để được kích hoạt nhanh hơn"
                </p>
                <button 
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 animate-pulse hover:animate-none disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <MessageCircle className="w-5 h-5" />} 
                  {isProcessing ? 'Đang tạo đơn hàng...' : 'Xác nhận đã chuyển khoản & Chat Zalo'}
                </button>
              </div>

              <button 
                onClick={handleBackToHome}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Quay lại trang chủ (Dùng tạm gói hiện tại)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH CHỌN GÓI (DEFAULT) ---
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Nâng cấp tài khoản <Zap className="w-5 h-5 text-yellow-400 fill-current" />
            </h2>
            <p className="text-slate-400 text-sm mt-1">Mở khóa toàn bộ sức mạnh của ScriptGen AI</p>
          </div>
          <button 
            onClick={() => setPricingModalOpen(false)}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Tiers.map((tier) => {
              const isCurrent = currentRole === tier.id;
              const isGold = tier.id === 'gold';
              const isSilver = tier.id === 'silver';
              
              // Visual styles logic
              let borderColor = 'border-slate-800';
              let ringColor = 'ring-0';
              let bgGradient = 'bg-slate-900';
              let buttonStyle = 'bg-slate-800 text-slate-300 hover:bg-slate-700';

              if (isCurrent) {
                 borderColor = 'border-green-500/50';
                 ringColor = 'ring-1 ring-green-500/50';
                 buttonStyle = 'bg-green-900/20 text-green-400 cursor-default border border-green-900/50';
              } else if (isGold) {
                 borderColor = 'border-amber-500/30';
                 bgGradient = 'bg-gradient-to-b from-amber-900/10 to-slate-900';
                 buttonStyle = 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 hover:from-amber-500 hover:to-yellow-400 font-bold shadow-lg shadow-amber-900/20';
              } else if (isSilver) {
                 borderColor = 'border-indigo-500/30';
                 bgGradient = 'bg-gradient-to-b from-indigo-900/10 to-slate-900';
                 buttonStyle = 'bg-indigo-600 text-white hover:bg-indigo-500';
              }

              return (
                <div 
                  key={tier.id}
                  className={`relative rounded-2xl border ${borderColor} ${ringColor} ${bgGradient} p-6 flex flex-col transition-transform hover:scale-[1.01]`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                      Phổ biến nhất
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${
                        isGold ? 'bg-amber-900/20 text-amber-400' :
                        isSilver ? 'bg-indigo-900/20 text-indigo-400' :
                        'bg-slate-800 text-slate-400'
                    }`}>
                      <tier.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">{tier.price}</span>
                        <span className="text-xs text-slate-500">{tier.period}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 mb-6 min-h-[40px]">{tier.description}</p>

                  <button
                    disabled={isCurrent}
                    onClick={() => tier.id !== 'free' && handleSelectTier(tier.id)}
                    className={`w-full py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mb-8 ${buttonStyle}`}
                  >
                    {isCurrent ? 'Gói hiện tại' : tier.id === 'free' ? 'Hạ cấp' : 'Nâng cấp ngay'}
                  </button>

                  <div className="space-y-3 flex-1">
                    {tier.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs text-slate-300">
                        <Check className={`w-4 h-4 shrink-0 ${isGold ? 'text-amber-400' : isSilver ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {tier.unavailable.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs text-slate-600">
                        <X className="w-4 h-4 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col items-center gap-2 shrink-0">
            <p className="text-xs text-slate-500">
                Thanh toán an toàn qua VietQR.
            </p>
            <a 
                href="https://zalo.me/0384317062" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium hover:underline"
            >
                <MessageCircle className="w-4 h-4" /> Liên hệ Admin để được hỗ trợ (Zalo)
            </a>
        </div>

      </div>
    </div>
  );
};
