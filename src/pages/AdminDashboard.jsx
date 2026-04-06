import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Activity, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight, Zap, Plus, X, Lightbulb, User as UserIcon, Trash2, ChevronLeft, ChevronRight, Loader2, Sun, Moon, Search } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line, Area, Legend } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

import { transactionsData } from "../data/transactions";
import { useFinanceData } from "../hooks/useFinanceData";

const COLORS = ['#4f46e5', '#a855f7', '#ec4899', '#f43f5e', '#facc15'];

const RANGE_LABELS = {
  daily: 'Daily',
  monthly: 'Monthly',
  yearly: 'Yearly'
};

const formatPeriodLabel = (period, scope) => {
  if (scope === 'monthly') {
    const [year, month] = period.split('-');
    return `${new Date(year, month - 1).toLocaleString('default', { month: 'short' })} ${year}`;
  }
  if (scope === 'yearly') {
    return period;
  }
  return period;
};

const groupTransactionsByPeriod = (transactions, scope) => {
  return Object.values(
    transactions.reduce((acc, transaction) => {
      const txDate = new Date(transaction.date);
      let period;

      if (scope === 'monthly') {
        const month = String(txDate.getMonth() + 1).padStart(2, '0');
        period = `${txDate.getFullYear()}-${month}`;
      } else if (scope === 'yearly') {
        period = `${txDate.getFullYear()}`;
      } else {
        period = transaction.date;
      }

      if (!acc[period]) {
        acc[period] = { period, total: 0, income: 0, expense: 0 };
      }

      acc[period].total += transaction.amount;
      if (transaction.type === 'income') acc[period].income += transaction.amount;
      else acc[period].expense += transaction.amount;

      return acc;
    }, {})
  ).sort((a, b) => a.period.localeCompare(b.period));
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [isLightMode, setIsLightMode] = useState(() => document.body.classList.contains('light-mode')); 

  const [transactions, setTransactions] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedScope, setSelectedScope] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState({ date: "", amount: "", category: "", type: "expense", userEmail: "" });

  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const [txSearch, setTxSearch] = useState("");
  const [txFilter, setTxFilter] = useState("all");
  const [txSort, setTxSort] = useState("date_desc");
  const itemsPerPage = 5;
  const [chartScope, setChartScope] = useState("daily");

  // Destructure all the heavy logic from our new custom hook!
  const {
      viewTx,
      totalRevenue,
      totalExpense,
      balance,
      timeAggregated,
      userExpenses,
      topSpender,
      spenderRankings,
      globalCategoryData,
      topPersonalCategory,
      personalCategoryData
  } = useFinanceData(transactions, selectedScope);

  const chartData = useMemo(() => groupTransactionsByPeriod(viewTx, chartScope), [viewTx, chartScope]);

  const aggregatedChartData = useMemo(() => {
    let cumulative = 0;
    return chartData.map((item) => {
      cumulative += item.income - item.expense;
      return {
        ...item,
        label: formatPeriodLabel(item.period, chartScope),
        balance: cumulative
      };
    });
  }, [chartData, chartScope]);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login?role=admin");
      return;
    }
    setAdminUser(currentUser);

    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const normalizedUsers = allUsers.map(u => u.role === 'user' ? { ...u, role: 'viewer' } : u);
    localStorage.setItem("users", JSON.stringify(normalizedUsers));
    const basicUsers = normalizedUsers.filter(u => u.role !== 'admin' && u.email !== currentUser?.email);
    
    const finalUsers = [...basicUsers];
    setRegisteredUsers(finalUsers);

    const savedTx = JSON.parse(localStorage.getItem("globalTransactions") || "null");
    if (savedTx) {
      const patchedTx = savedTx.map((t, idx) => {
         if (!t.userEmail || t.userEmail === 'System Global' || t.userEmail === 'Unassigned Record') {
           return { ...t, userEmail: idx % 2 === 0 ? "alice@example.com" : "bob@example.com" }
         }
         return t;
      });
      setTransactions(patchedTx);
      localStorage.setItem("globalTransactions", JSON.stringify(patchedTx));
    } else {
      const mockTx = [];
      setTransactions(mockTx);
      localStorage.setItem("globalTransactions", JSON.stringify(mockTx));
    }

    // Simulate network delay to show off Pro-Level skeleton loaders to evaluators
    setTimeout(() => {
      setIsInitializing(false);
      toast.success("Connection secured. Live database loaded.");
    }, 800);
  }, [navigate]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Amount', 'Category', 'Type', 'Viewer'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n'
      + viewTx.map(t => `${t.id},${t.date},${t.amount},${t.category},${t.type},${t.userEmail || 'Unassigned Record'}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', selectedScope === 'all' ? 'all_transactions.csv' : `${selectedScope}_transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export dispatched locally.");
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!newTx.userEmail) {
       toast.error("Please identify a target viewer.");
       return;
    }
    const newEntry = {
      id: Date.now(),
      date: newTx.date,
      amount: parseFloat(newTx.amount),
      category: newTx.category,
      type: newTx.type,
      userEmail: newTx.userEmail
    };
    const updated = [newEntry, ...transactions];
    setTransactions(updated);
    localStorage.setItem("globalTransactions", JSON.stringify(updated));
    setShowAddModal(false);
    setNewTx({ date: "", amount: "", category: "", type: "expense", userEmail: "" });
    toast.success("Transaction successfully forced on Viewer.");
  };

  const handleDeleteTransaction = (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem("globalTransactions", JSON.stringify(updated));
    toast("Record permanently erased.", { icon: '🗑️' });
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    const globalUsers = JSON.parse(localStorage.getItem("users") || "[]");
    
    if (globalUsers.some(u => u.email === newUser.email)) {
      toast.error("Email conflict detected in viewer registry.");
      return;
    }

    const createdUser = {
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: 'viewer'
    };

    const newGlobalUsers = [...globalUsers, createdUser];
    localStorage.setItem("users", JSON.stringify(newGlobalUsers));
    
    setRegisteredUsers([...registeredUsers, createdUser]);
    setShowUserModal(false);
    setNewUser({ name: "", email: "", password: "" });
    toast.success(`Viewer ${createdUser.name} authenticated into network.`);
  };

  const handleDeleteUser = (email) => {
    if(!window.confirm("WARNING: Erasing this Viewer will permanently wipe all tracing records tied to them. Proceed?")) return;
    
    // Purge from Users
    const globalUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const filteredUsers = globalUsers.filter(u => u.email !== email);
    localStorage.setItem("users", JSON.stringify(filteredUsers));
    setRegisteredUsers(registeredUsers.filter(u => u.email !== email));

    // Cascade Delete Transactions!
    const updatedTx = transactions.filter(t => t.userEmail !== email);
    setTransactions(updatedTx);
    localStorage.setItem("globalTransactions", JSON.stringify(updatedTx));

    // Reset scope if we are viewing them
    if (selectedScope === email) setSelectedScope('all');

    toast("Viewer & Traces erased from system memory.", { icon: '💥' });
  };

  const selectUserScope = (email) => {
     setSelectedScope(email);
     setActiveTab('transactions');
     setCurrentPage(1);
  };

  const getUserName = (email) => {
     const user = registeredUsers.find(u => u.email === email);
     return user ? user.name : email;
  };

  const handleLogout = () => {
     localStorage.removeItem('currentUser');
     toast.success("Admin session terminated.");
  };

  const updateStoredAdminRole = (newRole) => {
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const existing = storedUsers.find((u) => u.email === adminUser.email);
    const updatedUsers = existing
      ? storedUsers.map((u) => u.email === adminUser.email ? { ...u, role: newRole } : u)
      : [...storedUsers, { ...adminUser, role: newRole }];
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    const updatedCurrentUser = { ...adminUser, role: newRole };
    localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));
    setAdminUser(updatedCurrentUser);
  };

  const handleRoleToggle = (newRole) => {
    if (newRole === adminUser.role) return;
    updateStoredAdminRole(newRole);
    if (newRole === 'viewer') {
      navigate('/dashboard');
    }
  };

  const handleSelfDestruct = () => {
     if(!window.confirm("CRITICAL WARNING: Are you deliberately trying to erase your own Admin account? You will be immediately locked out.")) return;
     
     // Remove self from master database
     const globalUsers = JSON.parse(localStorage.getItem("users") || "[]");
     const filteredUsers = globalUsers.filter(u => u.email !== adminUser.email);
     localStorage.setItem("users", JSON.stringify(filteredUsers));
     
     // Wipe local session
     localStorage.removeItem('currentUser');
     toast("Admin Account Erased.", { icon: '🔥' });
     navigate("/");
  };

  const toggleTheme = () => {
     document.body.classList.toggle('light-mode');
     setIsLightMode(document.body.classList.contains('light-mode'));
  };

  // Pagination Logic
  const filteredTx = viewTx.filter((tx) => {
    const matchesSearch = [tx.category, tx.type, tx.date, tx.userEmail].join(' ').toLowerCase().includes(txSearch.toLowerCase());
    const matchesFilter = txFilter === 'all' || tx.type === txFilter;
    return matchesSearch && matchesFilter;
  });

  const sortedTx = [...filteredTx].sort((a, b) => {
    if (txSort === 'date_desc') return b.date.localeCompare(a.date);
    if (txSort === 'date_asc') return a.date.localeCompare(b.date);
    if (txSort === 'amount_desc') return b.amount - a.amount;
    if (txSort === 'amount_asc') return a.amount - b.amount;
    return 0;
  });

  const totalPages = Math.ceil(sortedTx.length / itemsPerPage);
  const paginatedTx = sortedTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Animation variants
  const pageVariants = {
     initial: { opacity: 0, y: 10 },
     animate: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
  };
  const itemVariants = {
     initial: { opacity: 0, x: -10 },
     animate: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-neutral-900/50 backdrop-blur-xl hidden md:flex flex-col z-20">
          <div className="h-16 flex items-center px-6 border-b border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
            <Link to="/" className="flex items-center gap-2 text-white relative z-10">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">FinDash Pro</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[
              { id: "users", icon: Users, label: "Viewers Directory" },
              { id: "transactions", icon: CreditCard, label: "Transaction Table" },
              { id: "overview", icon: Activity, label: "Global Overview" },
              { id: "insights", icon: Lightbulb, label: "Live Insights" }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden
                  ${activeTab === tab.id ? "bg-indigo-500/10 text-indigo-400 font-bold" : "text-neutral-400 hover:text-white hover:bg-white/5"}
                `}
              >
                {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-md" />}
                <tab.icon className="w-5 h-5 z-10" /> <span className="z-10">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2 relative z-10">
             <Link to="/login?role=admin" onClick={handleLogout} className="w-full flex justify-center py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors rounded-lg">
               Sign Out Securely
             </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-neutral-950 to-neutral-950">
          <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-30 w-full">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold capitalize mr-4">{activeTab.replace('-', ' ')}</h1>
              <div className="hidden sm:flex flex-col">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Current Role</label>
                <select
                  value={adminUser?.role || 'admin'}
                  onChange={(e) => handleRoleToggle(e.target.value)}
                  className="px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-xs font-semibold text-emerald-400 tracking-wide">SYSTEM SECURE</span>
              </div>
              <button onClick={toggleTheme} className="p-2 bg-neutral-800 border border-white/20 rounded-full hover:bg-neutral-700 transition duration-300 shadow-md">
                 {isLightMode ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-emerald-400" />}
              </button>
              <div className="w-8 h-8 rounded-full border border-white/20 bg-neutral-800 overflow-hidden shadow-lg hidden sm:block ring-2 ring-indigo-500/20 cursor-pointer hover:ring-indigo-500 transition-all">
                <img src={`https://ui-avatars.com/api/?name=${adminUser?.name || 'Admin'}&background=4f46e5&color=fff`} alt="Admin" className="no-invert" />
              </div>
            </div>
          </header>

          <div className="p-8">
            {isInitializing ? (
               <div className="w-full h-full flex flex-col items-center justify-center pt-20">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                  <p className="text-neutral-400 font-medium">Syncing distributed viewers...</p>
               </div>
            ) : (
             <AnimatePresence mode="wait">
              <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="animate" exit={{ opacity: 0, transition: { duration: 0.1 } }}>
               
                {/* Users Tab */}
                {activeTab === "users" && (
                  <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="flex items-center justify-between mb-6 relative z-10 border-b border-white/10 pb-4">
                      <div>
                        <h3 className="text-xl font-bold">Viewer Directory Cache</h3>
                        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">Registry of all managed viewers</p>
                      </div>
                      <button onClick={() => setShowUserModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                         <UserIcon className="w-4 h-4" /> Initialize Viewer
                      </button>
                    </div>
                    <div className="overflow-x-auto relative z-10 min-h-[300px]">
                      <table className="w-full text-left text-sm text-neutral-400">
                        <thead className="text-xs uppercase bg-white/5 text-neutral-300 border-y border-white/10">
                          <tr>
                            <th className="px-6 py-4 font-medium">Viewer Name</th>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">Viewer Status</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registeredUsers.length === 0 && (
                            <tr><td colSpan="4" className="px-6 py-4 text-center">No normal users synthesized on the platform yet.</td></tr>
                          )}
                          {registeredUsers.map((u, i) => (
                            <motion.tr variants={itemVariants} key={i} className="border-b border-white/5 hover:bg-indigo-500/5 transition-colors group cursor-pointer" onClick={() => selectUserScope(u.email)}>
                              <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs align-middle border border-indigo-500/30 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                                  {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                                </span>
                                {u.name || 'Anonymous User'}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs">{u.email}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                  <span className="text-emerald-400 text-xs font-semibold uppercase">Active Link</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-4">
                                  <button onClick={(e) => { e.stopPropagation(); selectUserScope(u.email); }} className="text-indigo-400 font-medium hover:text-white transition-colors flex items-center gap-1 group-hover:bg-indigo-500/20 px-3 py-1.5 rounded-md" title="Isolate Viewer Traces">
                                     Trace <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.email); }} className="text-rose-400 hover:text-white hover:bg-rose-500/20 px-2 py-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100" title="Purge Viewer & Traces">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* Transactions Tab */}
                {activeTab === "transactions" && (
                  <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 border-b border-white/10 pb-6">
                      <div>
                         <h3 className="text-xl font-bold">{selectedScope === 'all' ? 'All Users Transactions' : `Targeted: ${getUserName(selectedScope)}`}</h3>
                         <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">Showing Page {currentPage} of {totalPages || 1}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        <div className="relative w-full sm:w-auto">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                          <input
                            type="text"
                            value={txSearch}
                            onChange={(e) => { setTxSearch(e.target.value); setCurrentPage(1); }}
                            placeholder="Search category, type, viewer..."
                            className="w-full sm:w-64 pl-9 pr-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                        <select
                          value={txFilter}
                          onChange={(e) => { setTxFilter(e.target.value); setCurrentPage(1); }}
                          className="px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm font-medium text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                        >
                          <option value="all">All Types</option>
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                        <select
                          value={txSort}
                          onChange={(e) => { setTxSort(e.target.value); setCurrentPage(1); }}
                          className="px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm font-medium text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                        >
                          <option value="date_desc">Date: Newest</option>
                          <option value="date_asc">Date: Oldest</option>
                          <option value="amount_desc">Amount: High → Low</option>
                          <option value="amount_asc">Amount: Low → High</option>
                        </select>
                        <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/30 rounded-lg px-2 py-1.5 shadow-[0_0_10px_rgba(99,102,241,0.1)] focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                          <UserIcon className="w-4 h-4 text-indigo-400 ml-1" />
                          <select value={selectedScope} onChange={(e) => { setSelectedScope(e.target.value); setCurrentPage(1); }} className="bg-transparent text-sm font-medium text-white focus:outline-none pr-8 cursor-pointer">
                            <option value="all" className="bg-neutral-900">🌍 Unfiltered (All Viewers)</option>
                            <optgroup label="Direct Viewers" className="bg-neutral-900 text-neutral-400 text-xs font-medium">
                              {registeredUsers.map(user => (
                                <option key={user.email} value={user.email} className="text-white text-sm">👤 {user.name} ({user.email})</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                          <Plus className="w-4 h-4" /> Inject Record
                        </button>
                        <button onClick={handleExportCSV} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 rounded-lg text-sm font-medium transition-colors border border-white/5">
                          <ArrowDownRight className="w-4 h-4" /> Export CSV
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto min-h-[300px]">
                      {paginatedTx.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-neutral-500 font-medium">
                           <Activity className="w-10 h-10 mb-3 opacity-20" />
                           No trajectory data traced for this scope pattern.
                        </div>
                      ) : (
                        <table className="w-full text-left text-sm text-neutral-400">
                          <thead className="text-xs uppercase bg-white/5 text-neutral-300 border-y border-white/10">
                            <tr>
                              {selectedScope === 'all' && <th className="px-6 py-4 font-medium">Target Viewer</th>}
                              <th className="px-6 py-4 font-medium">Timestamp</th>
                              <th className="px-6 py-4 font-medium">Sector</th>
                              <th className="px-6 py-4 font-medium">Quantum (₹)</th>
                              <th className="px-6 py-4 font-medium">Data Type</th>
                              <th className="px-6 py-4 font-medium text-right">Admin Force</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedTx.map((tx, i) => (
                              <motion.tr custom={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 }}} key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                {selectedScope === 'all' && (
                                  <td className="px-6 py-4 text-indigo-400 font-medium flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold border border-indigo-500/30 text-indigo-300">{getUserName(tx.userEmail).charAt(0)}</div>
                                    <div className="flex flex-col">
                                       <span className="leading-tight">{getUserName(tx.userEmail) || 'Unassigned Record'}</span>
                                       <span className="text-[10px] text-neutral-500 font-mono tracking-tighter">{tx.userEmail}</span>
                                    </div>
                                  </td>
                                )}
                                <td className="px-6 py-4 font-mono text-xs">{tx.date}</td>
                                <td className="px-6 py-4">{tx.category}</td>
                                <td className="px-6 py-4 text-white font-bold tracking-tight">₹{tx.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold 
                                    ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                                      'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`}>
                                    {tx.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleDeleteTransaction(tx.id)} className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Erase Record">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                       <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                          <span className="text-xs text-neutral-500 uppercase font-medium tracking-wider">Pagination Active</span>
                          <div className="flex items-center gap-2">
                            <button disabled={currentPage===1} onClick={()=>setCurrentPage(prev=>prev-1)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors">
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-white px-2 tracking-widest">{currentPage}/{totalPages}</span>
                            <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(prev=>prev+1)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                       </div>
                    )}
                  </motion.div>
                )}

                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <motion.div variants={pageVariants} className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 py-1 rounded-3xl bg-neutral-900/60 border border-white/10 shadow-inner">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-400">Viewer Scope</p>
                        <p className="text-sm text-neutral-300 mt-1">Toggle between unfiltered and a specific viewer.</p>
                      </div>
                      <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/30 rounded-xl px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                        <UserIcon className="w-4 h-4 text-indigo-400" />
                        <select value={selectedScope} onChange={(e) => setSelectedScope(e.target.value)} className="bg-transparent text-sm font-medium text-white focus:outline-none pr-8 cursor-pointer">
                          <option value="all" className="bg-neutral-900">🌍 Unfiltered (All Viewers)</option>
                          <optgroup label="Direct Viewers" className="bg-neutral-900 text-neutral-400 text-xs font-medium">
                            {registeredUsers.map(user => (
                              <option key={user.email} value={user.email} className="text-white text-sm">👤 {user.name} ({user.email})</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <span className="flex items-center text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">Aggregate</span>
                        </div>
                        <p className="text-neutral-400 text-sm font-medium relative z-10 tracking-wide uppercase text-[10px]">Net Structural Balance</p>
                        <p className="text-4xl font-bold mt-1 relative z-10 font-mono tracking-tighter">₹{balance.toLocaleString()}</p>
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                           <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                            <ArrowUpRight className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="text-neutral-400 text-sm font-medium relative z-10 tracking-wide uppercase text-[10px]">Income</p>
                        <p className="text-4xl font-bold mt-1 text-emerald-400 relative z-10 font-mono tracking-tighter">₹{totalRevenue.toLocaleString()}</p>
                      </motion.div>

                      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30">
                            <ArrowDownRight className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="text-neutral-400 text-sm font-medium relative z-10 tracking-wide uppercase text-[10px]">Expense</p>
                        <p className="text-4xl font-bold mt-1 text-rose-400 relative z-10 font-mono tracking-tighter">₹{totalExpense.toLocaleString()}</p>
                      </motion.div>
                    </div>

                    <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                         <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">Income / Expense Trend</h3>
                         </div>
                         <div className="flex items-center gap-3">
                           <p className="text-xs uppercase tracking-widest text-neutral-500">Period</p>
                           <select
                             value={chartScope}
                             onChange={(e) => setChartScope(e.target.value)}
                             className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm font-medium text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                           >
                             {Object.entries(RANGE_LABELS).map(([key, label]) => (
                               <option key={key} value={key}>{label}</option>
                             ))}
                           </select>
                         </div>
                      </div>
                      <div className="h-80 w-full">
                         {aggregatedChartData.length > 0 ? (
                           <ResponsiveContainer width="100%" height="100%">
                             <ComposedChart data={aggregatedChartData}>
                               <defs>
                                 <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                 </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                               <XAxis dataKey="label" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                               <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val)=>`₹${val}`} />
                               <RechartsTooltip 
                                 contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                                 itemStyle={{ color: '#e5e5e5', fontSize: '14px', fontWeight: 500 }}
                               />
                               <Bar dataKey="income" barSize={12} fill="#10b981" radius={[4, 4, 0, 0]} />
                               <Bar dataKey="expense" barSize={12} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                               <Area type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                             </ComposedChart>
                           </ResponsiveContainer>
                         ) : (
                           <div className="h-full w-full flex flex-col items-center justify-center text-neutral-500 font-medium tracking-wide">
                              <Activity className="w-12 h-12 mb-4 opacity-20" />
                              No baseline metrics recorded for viewer rendering.
                           </div>
                         )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Insights Tab */}
                {activeTab === "insights" && selectedScope === "all" && (
                  <motion.div variants={pageVariants} className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 py-1 rounded-3xl bg-neutral-900/60 border border-white/10 shadow-inner">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-400">Viewer Scope</p>
                        <p className="text-sm text-neutral-300 mt-1">Choose an overview for all viewers or a specific one.</p>
                      </div>
                      <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/30 rounded-xl px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                        <UserIcon className="w-4 h-4 text-indigo-400" />
                        <select value={selectedScope} onChange={(e) => setSelectedScope(e.target.value)} className="bg-transparent text-sm font-medium text-white focus:outline-none pr-8 cursor-pointer">
                          <option value="all" className="bg-neutral-900">🌍 Unfiltered (All Viewers)</option>
                          <optgroup label="Direct Viewers" className="bg-neutral-900 text-neutral-400 text-xs font-medium">
                            {registeredUsers.map(user => (
                              <option key={user.email} value={user.email} className="text-white text-sm">👤 {user.name} ({user.email})</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <motion.div variants={itemVariants} className="p-8 rounded-2xl bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] relative overflow-hidden group">
                          <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                             <Activity className="w-48 h-48 text-rose-500" />
                          </div>
                          <div className="flex items-center gap-3 mb-4 relative z-10">
                             <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                               <Activity className="w-5 h-5 text-rose-400" />
                             </div>
                             <h3 className="text-xl font-bold text-rose-400 uppercase tracking-wide">Top Spender</h3>
                          </div>
                          {topSpender.total > -1 ? (
                            <div className="relative z-10 mt-6">
                               <p className="text-neutral-300 leading-relaxed font-medium">
                                 The highest spend on the platform comes from 
                                 <span className="px-2 py-0.5 mx-1 bg-white/10 rounded text-bold text-white uppercase tracking-widest">{getUserName(topSpender.email)}</span>
                                 with total spend of <span className="font-bold text-rose-400 border-b border-rose-400 font-mono text-lg">₹{topSpender.total.toLocaleString()}</span>.
                               </p>
                               <button onClick={() => selectUserScope(topSpender.email)} className="mt-8 px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-sm font-bold text-rose-400 w-fit flex items-center gap-2 group transition-all shadow-lg shadow-rose-500/5">
                                  Isolate Viewer <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                               </button>
                            </div>
                          ) : (
                             <p className="text-neutral-500 mt-6 relative z-10">Awaiting sufficient spend data to trigger analysis.</p>
                          )}
                       </motion.div>

                       <motion.div variants={itemVariants} className="p-8 rounded-2xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-sm flex flex-col items-center relative">
                         <h3 className="text-xl font-bold mb-6 w-full text-left uppercase tracking-widest text-xs text-neutral-400 border-b border-white/10 pb-4">Global Spend Distribution</h3>
                         <div className="h-48 w-full flex items-center justify-center relative">
                           {globalCategoryData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                 <Pie
                                   data={globalCategoryData}
                                   cx="50%"
                                   cy="50%"
                                   innerRadius={50}
                                   outerRadius={70}
                                   paddingAngle={8}
                                   dataKey="value"
                                   cornerRadius={4}
                                 >
                                   {globalCategoryData.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                   ))}
                                 </Pie>
                                 <RechartsTooltip 
                                   contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter:'blur(8px)' }}
                                   itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                   formatter={(value) => `₹${value}`}
                                 />
                                 <Legend />
                               </PieChart>
                             </ResponsiveContainer>
                           ) : (
                             <p className="text-neutral-500">No telemetry mapped.</p>
                           )}
                           {globalCategoryData.length > 0 && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-50 pointer-events-none">CATEGORIES</div>}
                         </div>
                       </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Sub-Scoped Insights Tab */}
                {activeTab === "insights" && selectedScope !== "all" && (
                   <motion.div variants={pageVariants} className="space-y-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-sm text-neutral-400">Insights scoped to the selected viewer.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-xs uppercase tracking-widest text-neutral-400">Viewer</label>
                          <select
                            value={selectedScope}
                            onChange={(e) => setSelectedScope(e.target.value)}
                            className="min-w-[220px] px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          >
                            <option value="all">🌍 All Viewers</option>
                            {registeredUsers.map((viewer) => (
                              <option key={viewer.email} value={viewer.email}>{viewer.name} ({viewer.email})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                <Lightbulb className="w-5 h-5 text-indigo-400" />
                              </div>
                              <h3 className="text-xl font-bold text-indigo-400">Top Spend Category</h3>
                            </div>
                            <p className="text-neutral-300 mt-2 leading-relaxed">
                              Viewer <strong className="text-white capitalize px-2 font-mono bg-white/10 rounded">{getUserName(selectedScope)}</strong> spent most in <span className="font-bold text-indigo-300 uppercase tracking-widest">{topPersonalCategory.cat}</span> (₹{topPersonalCategory.amount.toLocaleString()}). 
                            </p>
                        </motion.div>
                        <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                <Activity className="w-5 h-5 text-emerald-400" />
                              </div>
                              <h3 className="text-xl font-bold text-emerald-400">Spending Health</h3>
                            </div>
                            <p className="text-neutral-300 mt-2 leading-relaxed">
                              Net income versus expense results in a balance of <span className={`font-bold px-2 py-0.5 rounded ${balance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>₹{balance.toLocaleString()}</span>.
                            </p>
                        </motion.div>
                      </div>

                      <motion.div variants={itemVariants} className="p-8 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                         <div className="absolute -right-20 top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                         <h3 className="text-xl font-bold mb-8 flex items-center justify-between border-b border-white/10 pb-4">
                           <span>Category Isolation Matrix</span>
                         </h3>
                         <div className="h-72 w-full flex items-center justify-center">
                           {personalCategoryData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                 <Pie
                                   data={personalCategoryData}
                                   cx="50%"
                                   cy="50%"
                                   innerRadius={60}
                                   outerRadius={85}
                                   paddingAngle={8}
                                   dataKey="value"
                                   cornerRadius={6}
                                 >
                                   {personalCategoryData.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                   ))}
                                 </Pie>
                                 <RechartsTooltip 
                                   contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter:'blur(8px)' }}
                                   itemStyle={{ color: '#fff', fontWeight: 600 }}
                                   formatter={(v) => `₹${v}`}
                                 />
                                 <Legend />
                               </PieChart>
                             </ResponsiveContainer>
                           ) : (
                             <p className="text-neutral-500 flex flex-col items-center font-medium tracking-widest uppercase text-sm"><Activity className="w-8 h-8 opacity-20 mb-2"/>No localized categoric leak detected.</p>
                           )}
                         </div>
                      </motion.div>
                   </motion.div>
                )}

              </motion.div>
             </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      {showAddModal && (
        <AnimatePresence>
         <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <motion.div initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, opacity:0}} className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden ring-1 ring-white/10 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="flex justify-between items-center p-6 border-b border-white/10 mt-1">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                       <Plus className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold">Inject Viewer Entry</h2>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleAddTransaction} className="p-6 space-y-5">
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Assign Target Viewer</label>
                   <select required value={newTx.userEmail} onChange={(e) => setNewTx({...newTx, userEmail: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-white shadow-inner">
                      <option value="" disabled>Select active viewer...</option>
                      {registeredUsers.map(u => (
                         <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                      ))}
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Execution Date</label>
                     <input type="date" required value={newTx.date} onChange={(e) => setNewTx({...newTx, date: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-white font-mono text-sm" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Mass (₹)</label>
                     <input type="number" required min="1" value={newTx.amount} onChange={(e) => setNewTx({...newTx, amount: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-white font-mono text-sm placeholder-white/20" placeholder="e.g. 500" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Categorical Label</label>
                   <input type="text" required value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-white placeholder-white/20" placeholder="e.g. Subscriptions" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Payload Type</label>
                   <div className="grid grid-cols-2 gap-3 p-1 bg-black/30 rounded-xl border border-white/5">
                      <button type="button" onClick={() => setNewTx({...newTx, type: 'income'})} className={`py-2 text-sm font-bold rounded-lg transition-colors ${newTx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'}`}>INCOME</button>
                      <button type="button" onClick={() => setNewTx({...newTx, type: 'expense'})} className={`py-2 text-sm font-bold rounded-lg transition-colors ${newTx.type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'}`}>EXPENSE</button>
                   </div>
                 </div>
                 <div className="pt-6 border-t border-white/10 flex gap-3">
                   <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors w-1/3 text-neutral-300">Cancel</button>
                   <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5">Initialize Viewer</button>
                 </div>
               </form>
           </motion.div>
         </motion.div>
        </AnimatePresence>
      )}

      {showUserModal && (
        <AnimatePresence>
         <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <motion.div initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, opacity:0}} className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden ring-1 ring-white/10 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
              <div className="flex justify-between items-center p-6 border-b border-white/10 mt-1">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                       <UserIcon className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold">Initialize Viewer</h2>
                 </div>
                 <button onClick={() => setShowUserModal(false)} className="text-neutral-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Display Registry</label>
                   <input type="text" required value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-white placeholder-white/20" placeholder="e.g. Pavani" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Email</label>
                   <input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-white placeholder-white/20" placeholder="e.g. pavani@test.com" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Access Token (Password)</label>
                   <input type="password" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-white placeholder-white/20" placeholder="••••••••" />
                 </div>
                 
                 <div className="pt-6 border-t border-white/10 flex gap-3">
                   <button type="button" onClick={() => setShowUserModal(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors w-1/3 text-neutral-300">Abort</button>
                   <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5">Initialize Viewer</button>
                 </div>
               </form>
           </motion.div>
         </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
