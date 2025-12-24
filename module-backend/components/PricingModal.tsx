
import React, { useState } from 'react';
import { CheckCircle2, Shield, Zap, X, ArrowRight, Loader2, Copy, MessageCircle } from 'lucide-react';
import { createTransaction } from '../services/db';
import { User } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentRole?: string;
}

type PlanType = 'silver' | 'gold';

const PricingModal: React.FC<Props> = ({ isOpen, onClose, user, currentRole }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // --- CONFIG ---
  const BANK_ID = "MB";
  const ACCOUNT_NO = "19928668868686";
  const ACCOUNT_NAME = "LUONG ANH VIET";
  const TRANSFER_PREFIX = "VKB";
  const ADMIN_ZALO = "0384317062";

  // Logic giá tiền
  const isSilverUser = currentRole === 'silver';
  
  let amount = 0;
  if (selectedPlan === 'silver') {
      amount = 199000;
  } else if (selectedPlan === 'gold') {
      // Nếu là silver user, giá nâng cấp gold chỉ còn 199k
      amount = isSilverUser ? 199000 : 299000;
  }

  const transferContent = `${TRANSFER_PREFIX} ${user.email?.split('@')[0]}`.toUpperCase().replace(/\s+/g, '%20');
  
  // VietQR API
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${amount}&addInfo=${transferContent}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      // 1. Tạo Transaction lưu vào DB
      const txId = await createTransaction(user.uid, user.email || 'unknown', selectedPlan, amount);
      
      // 2. Chuẩn bị nội dung chat Zalo
      const planLabel = selectedPlan === 'gold' && isSilverUser ? 'UPGRADE GOLD (FROM SILVER)' : selectedPlan.toUpperCase();
      const zaloMessage = `Chào Admin, tôi vừa chuyển khoản gói ${planLabel}. Email: ${user.email}. Mã giao dịch: ${txId}. Nhờ admin duyệt giúp.`;
      
      // 3. Copy vào clipboard cho khách tiện paste
      try {
        await navigator.clipboard.writeText(zaloMessage);
      } catch (err) {
        console.warn("Clipboard write failed", err);
      }

      // 4. Thông báo ngắn & Chuyển hướng
      alert("Đã gửi yêu cầu! Đang chuyển hướng sang Zalo Admin để duyệt nhanh...");
      window.open(`https://zalo.me/${ADMIN_ZALO}`, '_blank');
      
      // 5. Đóng modal
      onClose();
      setSelectedPlan(null); // Reset form

    } catch (e: any) {
      console.error(e);
      alert("Lỗi kết nối: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl max-w-6xl w-full relative overflow-hidden flex flex-col lg:flex-row shadow-2xl min-h-[650px]">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white z-20 transition-colors">
          <X className="w-6 h-6" />
        </button>

        {/* LEFT COLUMN: PLANS SELECTION */}
        <div className={`flex-1 p-8 lg:p-12 transition-all duration-500 ${selectedPlan ? 'hidden lg:block lg:opacity-40 lg:pointer-events-none blur-[2px]' : ''}`}>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Nâng Cấp Tài Khoản</h2>
            <p className="text-gray-400">
               {isSilverUser 
                 ? 'Bạn đang ở gói Silver. Hãy nâng cấp lên Gold để mở khóa toàn bộ sức mạnh!'
                 : 'Mở khóa toàn bộ sức mạnh của AI Story Factory'
               }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SILVER PLAN */}
            <div 
              onClick={() => !isSilverUser && setSelectedPlan('silver')}
              className={`
                group relative border rounded-2xl p-6 transition-all duration-300
                ${isSilverUser 
                   ? 'bg-gray-900 border-blue-900/50 opacity-60 cursor-default' 
                   : 'bg-gray-900 border-gray-800 hover:border-blue-500/50 cursor-pointer hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1'
                }
              `}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Silver Plan</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">FOR HOBBYISTS</p>
                </div>
                <Shield className="w-8 h-8 text-gray-700 group-hover:text-blue-500 transition-colors" />
              </div>
              
              <div className="mb-6">
                {isSilverUser ? (
                    <span className="text-lg font-bold text-blue-400">GÓI HIỆN TẠI</span>
                ) : (
                    <>
                        <span className="text-3xl font-bold text-white">199k</span>
                        <span className="text-gray-500 text-sm"> / trọn đời</span>
                    </>
                )}
              </div>

              <ul className="space-y-4 text-sm text-gray-400 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-blue-500" /> <span>Mở khóa <b>9 Style</b> phổ biến</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-blue-500" /> <span>Tạo <b>10 ý tưởng</b> cùng lúc</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-blue-500" /> <span>Chế độ <b>Batch Write</b> (Viết hàng loạt)</span></li>
              </ul>

              <button 
                disabled={isSilverUser}
                className={`w-full py-3 rounded-lg border font-semibold transition-all ${isSilverUser ? 'border-gray-800 text-gray-600' : 'border-gray-700 text-gray-300 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white'}`}
              >
                {isSilverUser ? 'Đang sử dụng' : 'Chọn Gói Silver'}
              </button>
            </div>

            {/* GOLD PLAN */}
            <div 
              onClick={() => setSelectedPlan('gold')}
              className="group relative bg-gradient-to-b from-gray-900 to-gray-950 border border-yellow-900/30 hover:border-yellow-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 bg-yellow-600 text-black text-[10px] font-black px-3 py-1 rounded-bl-lg rounded-tr-lg tracking-wider">POPULAR</div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition-colors">Gold Plan</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">FOR PRO WRITERS</p>
                </div>
                <Zap className="w-8 h-8 text-gray-700 group-hover:text-yellow-500 transition-colors" />
              </div>
              
              <div className="mb-6">
                {isSilverUser ? (
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-sm line-through decoration-red-500">299k</span>
                        <div>
                            <span className="text-3xl font-bold text-yellow-400">199k</span>
                            <span className="text-gray-500 text-sm"> / ưu đãi nâng cấp</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <span className="text-3xl font-bold text-white">299k</span>
                        <span className="text-gray-500 text-sm"> / trọn đời</span>
                    </>
                )}
              </div>

              <ul className="space-y-4 text-sm text-gray-400 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-yellow-500" /> <span className="text-gray-200">Mở khóa <b>TOÀN BỘ 16+ Style</b></span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-yellow-500" /> <span><b>Priority Support</b> 24/7</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-yellow-500" /> <span>Cập nhật tính năng mới sớm nhất</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-yellow-500" /> <span>Quyền lợi gói Silver</span></li>
              </ul>

              <button className="w-full py-3 rounded-lg bg-yellow-700/20 border border-yellow-700/50 text-yellow-500 font-semibold group-hover:bg-yellow-500 group-hover:text-black group-hover:border-yellow-500 transition-all">
                {isSilverUser ? 'Nâng Cấp Lên Gold' : 'Chọn Gói Gold'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PAYMENT DETAIL */}
        <div className={`
          lg:w-[450px] bg-gray-900 border-l border-gray-800 flex flex-col relative transition-all duration-500 ease-in-out
          ${selectedPlan ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute right-0 h-full lg:static lg:translate-x-0 lg:opacity-100'}
        `}>
          {!selectedPlan ? (
            <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-12 space-y-4 opacity-50">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-gray-500">Vui lòng chọn một gói dịch vụ<br/>để tiến hành thanh toán.</p>
            </div>
          ) : (
            <div className="h-full flex flex-col p-8 lg:p-10 animate-fade-in">
              <button 
                onClick={() => setSelectedPlan(null)}
                className="lg:hidden absolute top-6 left-6 text-gray-500 hover:text-white flex items-center gap-2 text-sm"
              >
                &larr; Chọn lại gói
              </button>

              <div className="mt-8 lg:mt-0 mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Xác Nhận & Thanh Toán
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Gói đã chọn: <span className={`font-bold ${selectedPlan === 'gold' ? 'text-yellow-500' : 'text-blue-400'}`}>{selectedPlan.toUpperCase()} PLAN</span>
                </p>
              </div>

              {/* QR Code Section - DYNAMIC VIETQR */}
              <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center shadow-lg mb-6">
                 <div className="relative group">
                   <img 
                      src={qrUrl}
                      alt="Quét mã QR để thanh toán"
                      className="w-56 h-auto object-contain"
                   />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                     <p className="text-xs bg-black text-white px-2 py-1 rounded">Tự động điền tiền & nội dung</p>
                   </div>
                 </div>
                 <p className="text-gray-900 font-bold mt-3 uppercase">{BANK_ID} BANK</p>
                 <p className="text-gray-500 text-sm">{ACCOUNT_NAME} - {ACCOUNT_NO}</p>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4 mb-8 bg-gray-950/50 p-4 rounded-xl border border-gray-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Số tiền cần chuyển:</span>
                  <span className="text-xl font-bold text-white">
                    {amount.toLocaleString()} <span className="text-xs font-normal text-gray-500">VND</span>
                  </span>
                </div>
                
                <div className="pt-3 border-t border-gray-800">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Nội dung chuyển khoản (Bắt buộc)</span>
                  <div 
                    onClick={() => handleCopyContent(decodeURIComponent(transferContent))}
                    className="flex items-center justify-between bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 p-3 rounded-lg cursor-pointer group transition-all"
                  >
                    <code className="font-mono text-white font-bold text-lg select-all">
                      {decodeURIComponent(transferContent)}
                    </code>
                    <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-primary-400">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4" />}
                      {copied ? 'Đã copy' : 'Copy'}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handlePaymentConfirm}
                disabled={isSubmitting}
                className={`
                  mt-auto w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all
                  ${selectedPlan === 'gold' 
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-yellow-900/20' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/20'}
                  ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <span>Đã Chuyển Khoản & Chat Zalo</span>
                    <MessageCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PricingModal;
