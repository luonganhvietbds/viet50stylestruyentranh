
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  Settings, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  ShieldAlert, 
  CheckCircle, 
  XCircle,
  Activity,
  Server,
  DollarSign,
  TrendingUp,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  LogOut,
  ChevronRight,
  Clock,
  CheckSquare,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../store';
import { AppUser, LogEntry, Transaction } from '../types';
import { db } from '../src/firebase';
import { collection, doc, updateDoc, deleteDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp, where } from 'firebase/firestore';

// --- SUB-COMPONENTS ---

const StatsCard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 bg-indigo-900/20 rounded-lg text-indigo-400">
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{title}</div>
    {subtext && <div className="text-xs text-slate-600 mt-2">{subtext}</div>}
  </div>
);

export const AdminDashboard = () => {
  const { user, setAdminView } = useAppStore();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'BILLING' | 'LOGS' | 'SETTINGS'>('OVERVIEW');
  const [permissionError, setPermissionError] = useState(false);

  // Security Guard
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-500 font-bold">
        <ShieldAlert className="w-6 h-6 mr-2" /> Access Denied. Admin Privileges Required.
      </div>
    );
  }

  if (permissionError) {
      return <FirestoreRulesHelp onBack={() => setAdminView(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
             <h1 className="font-bold text-white tracking-tight">Admin Panel</h1>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest">System Control</p>
          </div>
        </div>
        
        <nav className="p-4 space-y-1">
          {[
            { id: 'OVERVIEW', icon: LayoutDashboard, label: 'Overview' },
            { id: 'USERS', icon: Users, label: 'User Management' },
            { id: 'BILLING', icon: CreditCard, label: 'Billing & Subscriptions' },
            { id: 'LOGS', icon: FileText, label: 'System Logs' },
            { id: 'SETTINGS', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
           <button 
             onClick={() => setAdminView(false)}
             className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
           >
             <LogOut className="w-4 h-4" /> Exit Admin Mode
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto h-screen bg-slate-950 p-4 md:p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">{activeTab.charAt(0) + activeTab.slice(1).toLowerCase().replace('_', ' ')}</h2>
            <p className="text-sm text-slate-500">Welcome back, Administrator {user.displayName}.</p>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded border border-green-900/30 flex items-center gap-1">
                <Activity className="w-3 h-3" /> System Operational
             </span>
             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                {user.displayName?.charAt(0) || 'A'}
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="animate-in fade-in duration-300">
           {activeTab === 'OVERVIEW' && <OverviewModule setPermissionError={setPermissionError} />}
           {activeTab === 'USERS' && <UsersModule setPermissionError={setPermissionError} />}
           {activeTab === 'BILLING' && <BillingModule setPermissionError={setPermissionError} />}
           {activeTab === 'LOGS' && <LogsModule />}
           {activeTab === 'SETTINGS' && <SettingsModule />}
        </div>

      </main>
    </div>
  );
};

const FirestoreRulesHelp = ({ onBack }: { onBack: () => void }) => {
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Function to check if the user has the 'admin' role
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{userId} {
      // Allow users to read their own profile, OR admins to read all
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      
      // Allow creation of new users (Sign Up) with default 'free' role
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Allow updates: User can update non-role fields, Admin can update everything
      allow update: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    match /transactions/{txId} {
      // Users can see their own transactions, Admins can see all
      allow read: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
      
      // Anyone can create a transaction (payment request)
      allow create: if request.auth != null;
      
      // Only Admins can update transactions (approve/reject)
      allow update: if isAdmin();
    }
  }
}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(rules);
        alert("Rules copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300">
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-6 text-red-500">
                    <ShieldAlert className="w-10 h-10" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Database Permission Denied</h1>
                        <p className="text-sm">The Dashboard cannot access data because Firestore Rules are blocking it.</p>
                    </div>
                </div>

                <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 mb-6 relative group">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Required Firestore Rules</h3>
                    <pre className="text-[10px] sm:text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                        {rules}
                    </pre>
                    <button 
                        onClick={handleCopy}
                        className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white border border-slate-600 transition-colors flex items-center gap-2 text-xs font-bold"
                    >
                        <Copy className="w-4 h-4" /> Copy Rules
                    </button>
                </div>

                <div className="flex justify-between items-center">
                    <button onClick={onBack} className="text-sm text-slate-400 hover:text-white">
                        &larr; Return to App
                    </button>
                    <a 
                        href="https://console.firebase.google.com/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm"
                    >
                        Open Firebase Console
                    </a>
                </div>
            </div>
        </div>
    );
};

// --- MODULES ---

const OverviewModule = ({ setPermissionError }: { setPermissionError: (e: boolean) => void }) => {
  return (
    <div className="space-y-6">
       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Users" value="--" icon={Users} trend={12} subtext="Requires DB Access" />
          <StatsCard title="Monthly Revenue" value="$42,390" icon={DollarSign} trend={8.5} subtext="Recurring subscriptions" />
          <StatsCard title="Active Jobs" value="342" icon={Activity} trend={-2} subtext="Currently processing" />
          <StatsCard title="Server Health" value="99.9%" icon={Server} trend={0} subtext="Uptime 30 days" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart (Mock CSS) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white">Revenue Trend</h3>
                <select className="bg-slate-800 border-slate-700 text-slate-300 text-xs rounded p-1">
                   <option>Last 30 Days</option>
                   <option>Last 6 Months</option>
                </select>
             </div>
             <div className="h-64 flex items-end gap-2 px-2">
                {[40, 55, 45, 60, 75, 65, 80, 70, 85, 90, 85, 95].map((h, i) => (
                   <div key={i} className="flex-1 group relative">
                      <div 
                        className="bg-indigo-600/50 hover:bg-indigo-500 rounded-t transition-all w-full relative group-hover:shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                        style={{ height: `${h}%` }}
                      ></div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                         ${h * 500}
                      </div>
                   </div>
                ))}
             </div>
             <div className="flex justify-between mt-4 text-xs text-slate-500 border-t border-slate-800 pt-2">
                <span>Jan 01</span>
                <span>Jan 15</span>
                <span>Jan 30</span>
             </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <h3 className="font-bold text-white mb-4">Recent Alerts</h3>
             <div className="space-y-4">
                {[
                   { type: 'warning', msg: 'High CPU usage on Node-3', time: '10m ago' },
                   { type: 'success', msg: 'Backup completed successfully', time: '1h ago' },
                   { type: 'error', msg: 'Payment gateway timeout (Stripe)', time: '2h ago' },
                   { type: 'info', msg: 'New user registration spike', time: '3h ago' },
                ].map((alert, i) => (
                   <div key={i} className="flex gap-3 items-start p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                         alert.type === 'warning' ? 'bg-yellow-500' :
                         alert.type === 'error' ? 'bg-red-500' :
                         alert.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div>
                         <p className="text-xs text-slate-300 font-medium">{alert.msg}</p>
                         <p className="text-[10px] text-slate-600">{alert.time}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

const UsersModule = ({ setPermissionError }: { setPermissionError: (e: boolean) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
     if (!db) return;
     // Fetch Real Users from Firestore
     const q = query(collection(db, 'users'));
     const unsubscribe = onSnapshot(q, (snapshot) => {
         const fetchedUsers: AppUser[] = [];
         snapshot.forEach((doc) => {
             const data = doc.data();
             fetchedUsers.push({
                 uid: doc.id,
                 email: data.email,
                 displayName: data.displayName,
                 role: data.role || 'free',
                 photoURL: data.photoURL || null,
                 createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now(),
                 updatedAt: data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : Date.now(),
             } as AppUser);
         });
         setUsers(fetchedUsers);
     }, (error) => {
         console.error("Error fetching users:", error);
         if (error.code === 'permission-denied') {
             setPermissionError(true);
         }
     });

     return () => unsubscribe();
  }, [setPermissionError]);

  const filteredUsers = users.filter(u => {
     const matchesSearch = (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.uid.includes(searchTerm));
     const matchesRole = filterRole === 'all' || u.role === filterRole;
     return matchesSearch && matchesRole;
  });

  const handleDelete = async (uid: string) => {
     if (confirm(`Are you sure you want to delete user ${uid}? This action is irreversible.`)) {
        try {
            await deleteDoc(doc(db, 'users', uid));
        } catch (e) {
            console.error("Error deleting user:", e);
            alert("Failed to delete user. Check console.");
        }
     }
  };

  const handleRoleChange = async (uid: string, newRole: AppUser['role']) => {
     try {
         await updateDoc(doc(db, 'users', uid), {
             role: newRole,
             updatedAt: serverTimestamp()
         });
     } catch (e: any) {
         console.error("Error updating role:", e);
         if (e.code === 'permission-denied') {
             alert("Permission denied. Ensure your Firestore rules allow Admins to update 'role'.");
         } else {
             alert("Failed to update role.");
         }
     }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-160px)]">
       {/* Toolbar */}
       <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900">
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-indigo-500"
             />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
             >
                <option value="all">All Roles</option>
                <option value="free">Free</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="admin">Admin</option>
             </select>
          </div>
       </div>

       {/* Table */}
       <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
             <thead className="bg-slate-950 sticky top-0 z-10">
                <tr>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">User</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">Role</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">Status</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">Joined</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-800">
                {filteredUsers.map(user => (
                   <tr key={user.uid} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                               {user.displayName?.charAt(0) || '?'}
                            </div>
                            <div>
                               <div className="text-sm font-bold text-slate-200">{user.displayName || 'No Name'}</div>
                               <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="p-4">
                         <select 
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                            className={`text-xs font-bold uppercase px-2 py-1 rounded border bg-transparent focus:bg-slate-900 outline-none ${
                               user.role === 'gold' ? 'text-amber-400 border-amber-900/50' :
                               user.role === 'silver' ? 'text-indigo-400 border-indigo-900/50' :
                               user.role === 'admin' ? 'text-red-400 border-red-900/50' :
                               'text-slate-400 border-slate-700'
                            }`}
                         >
                            <option value="free">Free</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="admin">Admin</option>
                         </select>
                      </td>
                      <td className="p-4">
                         <span className="text-xs flex items-center gap-1.5 text-green-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            Active
                         </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                         {new Date(Number(user.createdAt) || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                         <button 
                            onClick={() => handleDelete(user.uid)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete User"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

const BillingModule = ({ setPermissionError }: { setPermissionError: (e: boolean) => void }) => {
   const [transactions, setTransactions] = useState<Transaction[]>([]);

   useEffect(() => {
     if (!db) return;
     const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
     const unsubscribe = onSnapshot(q, (snapshot) => {
         const txs: Transaction[] = [];
         snapshot.forEach((doc) => {
             txs.push({ id: doc.id, ...doc.data() } as Transaction);
         });
         setTransactions(txs);
     }, (error) => {
         console.error("Error fetching transactions:", error);
         if (error.code === 'permission-denied') {
             setPermissionError(true);
         }
     });
     return () => unsubscribe();
   }, [setPermissionError]);

   const handleApprove = async (tx: Transaction) => {
      if (!tx.id || !confirm(`Confirm payment of ${tx.amount} and upgrade user to ${tx.plan}?`)) return;

      try {
         // 1. Mark transaction as completed
         await updateDoc(doc(db, 'transactions', tx.id), {
             status: 'completed',
             updatedAt: serverTimestamp()
         });

         // 2. Update User Role
         await updateDoc(doc(db, 'users', tx.userId), {
             role: tx.plan,
             updatedAt: serverTimestamp()
         });

         alert(`Transaction approved. User ${tx.userEmail} upgraded to ${tx.plan}.`);

      } catch (e: any) {
         console.error("Error approving transaction:", e);
         if (e.code === 'permission-denied') {
             alert("Permission denied. Only Admins can approve transactions.");
         } else {
             alert("Approval failed.");
         }
      }
   };

   return (
      <div className="space-y-6">
         <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-8 flex items-center justify-between">
            <div>
               <h3 className="text-xl font-bold text-white mb-2">Transaction Processing</h3>
               <p className="text-slate-400 text-sm">Review incoming manual payments via VietQR.</p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg border border-green-500/30">
               <CheckCircle className="w-5 h-5" /> Live
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950">
               <h3 className="font-bold text-white">Transactions</h3>
            </div>
            <table className="w-full text-left text-sm">
               <thead className="text-xs text-slate-500 uppercase bg-slate-950 border-b border-slate-800">
                  <tr>
                     <th className="p-4">User</th>
                     <th className="p-4">Plan</th>
                     <th className="p-4">Amount</th>
                     <th className="p-4">Date</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                  {transactions.map(tx => (
                     <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="p-4 text-slate-300">
                            <div>{tx.userEmail}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{tx.userId}</div>
                        </td>
                        <td className="p-4"><span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-900/30 text-indigo-300 uppercase">{tx.plan}</span></td>
                        <td className="p-4 font-mono text-slate-200">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}</td>
                        <td className="p-4 text-slate-500 text-xs">
                            {tx.createdAt?.seconds ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'Pending...'}
                        </td>
                        <td className="p-4">
                            {tx.status === 'completed' ? (
                                <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>
                            ) : (
                                <span className="text-xs text-yellow-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                            )}
                        </td>
                        <td className="p-4 text-right">
                            {tx.status === 'pending' && (
                                <button 
                                    onClick={() => handleApprove(tx)}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold flex items-center gap-1 ml-auto"
                                >
                                    <CheckSquare className="w-3 h-3" /> Approve
                                </button>
                            )}
                        </td>
                     </tr>
                  ))}
                  {transactions.length === 0 && (
                      <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 italic">No transactions found.</td>
                      </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
};

const LogsModule = () => {
   // Assuming logs are still mocked or not yet connected to backend
   // For real logs, you'd need a 'logs' collection
   const [logs] = useState<LogEntry[]>([]); 
   const [severity, setSeverity] = useState('ALL');

   const filteredLogs = severity === 'ALL' ? logs : logs.filter(l => l.severity === severity);

   return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-160px)]">
         <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <div className="flex gap-2">
               {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map(s => (
                  <button 
                     key={s}
                     onClick={() => setSeverity(s)}
                     className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                        severity === s 
                           ? 'bg-slate-700 text-white' 
                           : 'bg-transparent text-slate-500 hover:bg-slate-800'
                     }`}
                  >
                     {s}
                  </button>
               ))}
            </div>
         </div>
         <div className="overflow-auto flex-1 bg-black/20 p-8 text-center text-slate-500 font-mono text-sm">
            System logs connector not yet configured for Firestore.
         </div>
      </div>
   );
};

const SettingsModule = () => {
   return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
               <ShieldAlert className="w-5 h-5 text-red-400" /> System Controls
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div>
                     <div className="text-sm font-bold text-slate-200">Maintenance Mode</div>
                     <div className="text-xs text-slate-500">Disable all non-admin access</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" />
                     <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};
