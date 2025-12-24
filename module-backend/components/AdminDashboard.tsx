
import React, { useState, useEffect } from 'react';
import { StyleAgent, UserProfile, UserRole, TransactionRequest } from '../types';
import { 
  LogOut, Save, Edit3, Cpu, Activity, Users, 
  CreditCard, Check, Ban, CheckCircle, AlertCircle, Loader2, Plus, Trash2, Search 
} from 'lucide-react';
import { 
  getAllUsers, 
  updateUserRole, 
  saveAgentToCloud, 
  deleteAgentFromCloud, 
  getPendingTransactions, 
  approveTransaction 
} from '../services/db';

interface Props {
  agents: StyleAgent[];
  onUpdateAgents: (agents: StyleAgent[]) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<Props> = ({ agents, onUpdateAgents, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'users' | 'requests' | 'system'>('agents');
  
  // --- STATE: AGENTS ---
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StyleAgent>>({});
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);

  // --- STATE: USERS ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE: REQUESTS ---
  const [requests, setRequests] = useState<TransactionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // --- EFFECT: DATA FETCHING ---
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUserError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (e: any) {
      console.error(e);
      setUserError(e.message || "Không thể tải danh sách User.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    setRequestError(null);
    try {
      const data = await getPendingTransactions();
      setRequests(data);
    } catch (e: any) {
      console.error("Error fetching transactions:", e);
      setRequestError(e.message || "Lỗi khi tải danh sách giao dịch. Kiểm tra Permissions hoặc Index.");
    } finally {
      setLoadingRequests(false);
    }
  };

  // --- HANDLERS: AGENTS CRUD ---
  const handleEditAgent = (agent: StyleAgent) => {
    setEditingAgentId(agent.id);
    setEditForm({ ...agent });
    setIsAddingAgent(false);
  };

  const handleCreateAgent = () => {
    const newId = `custom-style-${Date.now()}`;
    setEditForm({
      id: newId,
      name: 'New Style Agent',
      tagline: 'Mô tả ngắn gọn',
      description: 'Mô tả chi tiết về phong cách...',
      iconName: 'Scroll',
      colorClass: 'text-gray-400',
      systemPrompt: 'Bạn là một chuyên gia kể chuyện...',
      template: 'Bối cảnh: ...\nNhân vật: ...'
    });
    setEditingAgentId(newId);
    setIsAddingAgent(true);
  };

  const handleCancelEdit = () => {
    setEditingAgentId(null);
    setEditForm({});
    setIsAddingAgent(false);
  };

  const handleSaveAgent = async () => {
    if (!editingAgentId || !editForm.name || !editForm.systemPrompt) {
      alert("Vui lòng nhập tên và Prompt hệ thống.");
      return;
    }
    setSavingAgent(true);
    
    try {
      const agentToSave = editForm as StyleAgent;
      await saveAgentToCloud(agentToSave);
      
      let updatedAgents;
      if (isAddingAgent) {
        updatedAgents = [...agents, agentToSave];
      } else {
        updatedAgents = agents.map(a => a.id === editingAgentId ? agentToSave : a);
      }
      
      onUpdateAgents(updatedAgents);
      setEditingAgentId(null);
      setEditForm({});
      setIsAddingAgent(false);
    } catch (e: any) {
        alert("Lỗi khi lưu Agent: " + e.message);
    } finally {
        setSavingAgent(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa Agent này không? Hành động không thể hoàn tác.")) return;
    
    try {
      await deleteAgentFromCloud(agentId);
      const updatedAgents = agents.filter(a => a.id !== agentId);
      onUpdateAgents(updatedAgents);
    } catch (e: any) {
      alert("Lỗi khi xóa Agent: " + e.message);
    }
  };

  // --- HANDLERS: USERS ---
  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (!confirm(`Chuyển quyền user này thành ${newRole}?`)) return;
    try {
        await updateUserRole(uid, newRole);
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (e: any) {
        alert("Lỗi cập nhật quyền: " + e.message);
    }
  };

  const handleBanUser = async (uid: string, currentStatus: string) => {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active';
      if (!confirm(`Xác nhận ${newStatus === 'banned' ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) return;

      try {
          const user = users.find(u => u.uid === uid);
          if (user) {
            await updateUserRole(uid, user.role, newStatus as 'active' | 'banned');
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus as 'active' | 'banned' } : u));
          }
      } catch (e: any) {
          alert("Lỗi cập nhật trạng thái: " + e.message);
      }
  };

  // --- HANDLERS: TRANSACTIONS ---
  const handleApproveRequest = async (req: TransactionRequest) => {
    if(!confirm(`DUYỆT: Nâng cấp ${req.email} lên ${req.plan.toUpperCase()}?`)) return;
    
    try {
        await approveTransaction(req.id);
        setRequests(prev => prev.filter(r => r.id !== req.id));
        alert("Đã duyệt thành công! Cloud Function đang xử lý.");
    } catch (e: any) {
        console.error(e);
        alert("Lỗi duyệt yêu cầu: " + e.message);
    }
  };

  // Filter users - Defensive Coding Fix: Handle undefined/null email
  const filteredUsers = users.filter(u => 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.uid || '').includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-gray-900 border-b border-red-900/30 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
              Admin
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">AI Story Factory <span className="text-gray-500 font-normal">| Control Center</span></h1>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Đăng Xuất
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-3 space-y-1">
          <NavButton 
            active={activeTab === 'agents'} 
            onClick={() => setActiveTab('agents')} 
            icon={<Cpu className="w-5 h-5" />} 
            label="Quản Lý Agent AI" 
          />
          <NavButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={<Users className="w-5 h-5" />} 
            label="Người Dùng" 
          />
          <NavButton 
            active={activeTab === 'requests'} 
            onClick={() => setActiveTab('requests')} 
            icon={<CreditCard className="w-5 h-5" />} 
            label="Duyệt Nâng Cấp" 
            badge={requests.length > 0 ? requests.length : undefined}
          />
          <NavButton 
            active={activeTab === 'system'} 
            onClick={() => setActiveTab('system')} 
            icon={<Activity className="w-5 h-5" />} 
            label="Hệ Thống" 
          />
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-9 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl min-h-[600px] flex flex-col">
          
          {/* --- TAB: AGENTS --- */}
          {activeTab === 'agents' && (
            <div className="space-y-6 animate-fade-in flex-1">
              <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Cấu Hình AI Agents</h2>
                    <p className="text-gray-400 text-sm">Quản lý Prompt và hành vi của AI.</p>
                </div>
                <button 
                  onClick={handleCreateAgent}
                  disabled={!!editingAgentId}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" /> Thêm Agent
                </button>
              </div>

              {/* Edit Form */}
              {editingAgentId && (
                <div className="bg-gray-800 border border-primary-500/50 rounded-xl p-6 mb-6 shadow-2xl animate-fade-in relative">
                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Edit3 className="w-4 h-4 text-primary-400"/>
                     {isAddingAgent ? 'Tạo Agent Mới' : `Chỉnh sửa: ${editForm.name}`}
                   </h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Tên Agent</label>
                        <input 
                          value={editForm.name || ''} 
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Tagline</label>
                        <input 
                          value={editForm.tagline || ''} 
                          onChange={e => setEditForm({...editForm, tagline: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white mt-1"
                        />
                      </div>
                   </div>

                   <div className="mb-4">
                      <label className="text-xs font-bold text-gray-400 uppercase">System Prompt (Quan Trọng)</label>
                      <textarea 
                          value={editForm.systemPrompt || ''} 
                          onChange={e => setEditForm({...editForm, systemPrompt: e.target.value})}
                          className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm font-mono text-green-400 mt-1"
                          placeholder="Nhập prompt hệ thống..."
                      />
                   </div>

                   <div className="flex justify-end gap-3">
                      <button onClick={handleCancelEdit} className="px-4 py-2 text-gray-400 hover:text-white">Hủy</button>
                      <button 
                        onClick={handleSaveAgent} 
                        disabled={savingAgent}
                        className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg flex items-center gap-2"
                      >
                         {savingAgent ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                         Lưu Agent
                      </button>
                   </div>
                </div>
              )}

              {/* Agents List */}
              <div className="grid grid-cols-1 gap-3">
                {agents.map((agent) => (
                  <div key={agent.id} className={`bg-gray-950 border border-gray-800 rounded-xl p-4 flex items-center justify-between group hover:border-gray-700 transition-all ${editingAgentId === agent.id ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center border border-gray-800 ${agent.colorClass} bg-opacity-10`}>
                         <span className={`font-bold ${agent.colorClass}`}>{agent.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{agent.name}</h4>
                        <p className="text-xs text-gray-500">{agent.tagline}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditAgent(agent)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="p-2 text-red-900 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB: USERS --- */}
          {activeTab === 'users' && (
             <div className="space-y-6 animate-fade-in flex-1">
                 <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                    <h2 className="text-2xl font-bold text-white">Quản Lý Users</h2>
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                       <input 
                         type="text" 
                         placeholder="Tìm email/uid..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="bg-gray-950 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 w-64"
                       />
                    </div>
                 </div>
                 
                 {userError && (
                    <div className="bg-red-900/10 border border-red-900/50 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4"/> {userError}
                    </div>
                 )}

                 {loadingUsers ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
                 ) : (
                     <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950/50">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs">
                                 <tr>
                                     <th className="p-4">User</th>
                                     <th className="p-4">Role</th>
                                     <th className="p-4">Status</th>
                                     <th className="p-4 text-right">Actions</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-800">
                                 {filteredUsers.map(user => (
                                     <tr key={user.uid} className="hover:bg-gray-900/50">
                                         <td className="p-4">
                                             <div className="font-bold text-white">{user.email || 'No Email'}</div>
                                             <div className="text-[10px] text-gray-600 font-mono">{user.uid}</div>
                                         </td>
                                         <td className="p-4"><RoleBadge role={user.role} /></td>
                                         <td className="p-4">
                                             {user.status === 'banned' 
                                                ? <span className="text-red-400 text-xs font-bold flex items-center gap-1"><Ban className="w-3 h-3"/> Banned</span> 
                                                : <span className="text-green-400 text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active</span>
                                             }
                                         </td>
                                         <td className="p-4 text-right">
                                             {user.role !== 'admin' && (
                                                <div className="flex justify-end gap-2">
                                                    <div className="flex bg-gray-800 rounded p-1">
                                                        {(['free', 'silver', 'gold'] as UserRole[]).map(r => (
                                                            <button 
                                                                key={r}
                                                                onClick={() => handleRoleChange(user.uid, r)}
                                                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${user.role === r ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                            >
                                                                {r}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleBanUser(user.uid, user.status)}
                                                        className={`p-1.5 rounded border ${user.status === 'banned' ? 'border-green-900 text-green-500' : 'border-red-900 text-red-500'}`}
                                                    >
                                                        <Ban className="w-3 h-3"/>
                                                    </button>
                                                </div>
                                             )}
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 )}
             </div>
          )}

          {/* --- TAB: REQUESTS --- */}
          {activeTab === 'requests' && (
             <div className="space-y-6 animate-fade-in flex-1">
                 <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                    <h2 className="text-2xl font-bold text-white">Duyệt Nâng Cấp ({requests.length})</h2>
                    <button onClick={fetchRequests} className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg border border-gray-700">Làm mới</button>
                 </div>
                 
                 {requestError && (
                    <div className="bg-red-900/10 border border-red-900/50 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4"/> {requestError}
                    </div>
                 )}

                 {loadingRequests ? (
                     <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
                 ) : (
                     <div className="grid grid-cols-1 gap-4">
                        {requests.length === 0 && !requestError && (
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
                                <CheckCircle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                <p className="text-gray-500">Tất cả yêu cầu đã được xử lý.</p>
                            </div>
                        )}
                        {requests.map(req => (
                            <div key={req.id} className="bg-gray-950 border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${req.plan === 'gold' ? 'bg-yellow-900/20 border-yellow-700 text-yellow-500' : 'bg-blue-900/20 border-blue-700 text-blue-400'}`}>
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{req.email}</div>
                                        <div className="text-xs text-gray-400">
                                            Yêu cầu: <span className="font-bold text-white uppercase">{req.plan}</span> • {req.amount.toLocaleString()} đ
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleApproveRequest(req)}
                                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold flex items-center gap-2 text-sm shadow-lg shadow-green-900/20"
                                >
                                    <Check className="w-4 h-4" /> Duyệt Ngay
                                </button>
                            </div>
                        ))}
                     </div>
                 )}
             </div>
          )}

          {/* --- TAB: SYSTEM --- */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-fade-in flex-1">
                <div className="border-b border-gray-800 pb-6"><h2 className="text-2xl font-bold text-white">System Status</h2></div>
                <div className="grid grid-cols-2 gap-4">
                    <StatusCard title="Database" status="Connected" color="green" />
                    <StatusCard title="AI Engine" status="Standby" color="blue" />
                </div>
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs font-mono text-gray-500">
                    <p>Version: 2.0.0 (Pro)</p>
                    <p>Build: Stable Release</p>
                    <p>Admin ID: {Math.random().toString(36).substr(2, 9)}</p>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// --- HELPERS ---
const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }> = ({ active, onClick, icon, label, badge }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-medium transition-all ${active ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
  >
    <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
    {badge && <span className="bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>}
  </button>
);

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const colors = { admin: 'red', gold: 'yellow', silver: 'blue', free: 'gray' };
    const c = colors[role] || 'gray';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-${c}-900/30 text-${c}-400 border border-${c}-900/50`}>{role}</span>;
};

const StatusCard: React.FC<{ title: string; status: string; color: string }> = ({ title, status, color }) => (
    <div className="p-5 bg-gray-950 border border-gray-800 rounded-xl">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`}></div>
            <span className={`text-${color}-400 font-bold`}>{status}</span>
        </div>
    </div>
);

export default AdminDashboard;
