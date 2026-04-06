import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, CreditCard, Activity, ArrowUpRight, ArrowDownRight, User, LayoutDashboard, PieChart as PieChartIcon, Search, Lightbulb, Download, Loader2, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLightMode, setIsLightMode] = useState(() => document.body.classList.contains('light-mode'));
  
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [chartScope, setChartScope] = useState("daily");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [sortOption, setSortOption] = useState("date_desc");

  // Wait until user is hydrated to run the hook accurately
  const activeEmail = user?.email || "pending";
  const financeScope = activeEmail;
  
  const {
      viewTx,
      totalRevenue,
      totalExpense,
      balance,
      timeAggregated,
      topPersonalCategory,
      personalCategoryData
  } = useFinanceData(transactions, financeScope);

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
    let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
      navigate("/login?role=viewer");
      return;
    }
    if (currentUser.role === 'user') {
      currentUser = { ...currentUser, role: 'viewer' };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    }
    if (currentUser.role !== "viewer") {
      navigate("/login?role=viewer");
      return;
    } 
    setUser(currentUser);

    const savedTx = JSON.parse(localStorage.getItem("globalTransactions") || "[]");
    setTransactions(savedTx);

    // Simulate backend handshake
    setTimeout(() => {
      setIsInitializing(false);
      toast.success(`Welcome back, ${currentUser.name.split(' ')[0]}!`);
    }, 800);
  }, [navigate]);

  const highestSpendingCategory = personalCategoryData.length ? personalCategoryData[0] : null;

  const monthlyExpenseComparison = useMemo(() => {
    const byMonth = {};
    viewTx.forEach((tx) => {
      if (tx.type === 'expense') {
        const month = tx.date.slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + tx.amount;
      }
    });
    const ordered = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
    if (ordered.length < 2) return null;
    const [prevMonth, prevAmount] = ordered[ordered.length - 2];
    const [lastMonth, lastAmount] = ordered[ordered.length - 1];
    return {
      prevMonth,
      prevAmount,
      lastMonth,
      lastAmount,
      diff: lastAmount - prevAmount
    };
  }, [viewTx]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Amount', 'Category', 'Type'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n'
      + filteredTransactions.map(t => `${t.id},${t.date},${t.amount},${t.category},${t.type}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'personal_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export dispatched locally.");
  };


  const handleSignOut = () => {
    localStorage.removeItem("currentUser");
    toast("Session securely terminated.", { icon: '🔒' });
    navigate("/");
  };

  const updateStoredRole = (newRole) => {
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const existing = storedUsers.find((u) => u.email === user.email);
    const updatedUsers = existing
      ? storedUsers.map((u) => u.email === user.email ? { ...u, role: newRole } : u)
      : [...storedUsers, { ...user, role: newRole }];
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    const updatedCurrentUser = { ...user, role: newRole };
    localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));
    setUser(updatedCurrentUser);
  };

  const handleRoleToggle = (newRole) => {
    if (newRole === user.role) return;
    updateStoredRole(newRole);
    if (newRole === 'admin') {
      navigate('/admin');
    }
  };

  const toggleTheme = () => {
     document.body.classList.toggle('light-mode');
     setIsLightMode(document.body.classList.contains('light-mode'));
  };

  if (!user) return null;

  // Sub-filtering specifically for the user's transaction table view
  const filteredTransactions = viewTx.filter((t) => {
    const matchesSearch = t.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || t.type === filter;
    return matchesSearch && matchesFilter;
  });

  const sortedFilteredTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortOption === "date_desc") return b.date.localeCompare(a.date);
    if (sortOption === "date_asc") return a.date.localeCompare(b.date);
    if (sortOption === "amount_desc") return b.amount - a.amount;
    if (sortOption === "amount_asc") return a.amount - b.amount;
    return 0;
  });

  const totalPages = Math.ceil(sortedFilteredTransactions.length / itemsPerPage);
  const paginatedTx = sortedFilteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Animation states
  const pageVariants = {
     initial: { opacity: 0, scale: 0.98, y: 10 },
     animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
  };
  const itemVariants = {
     initial: { opacity: 0, x: -10 },
     animate: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-indigo-500/30 flex overflow-hidden">
      
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
        
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-white/20 bg-neutral-800 flex items-center justify-center overflow-hidden shadow-inner ring-2 ring-indigo-500/20">
                <span className="text-sm font-bold text-indigo-400">{user.name.charAt(0)}</span>
             </div>
             <div>
                <p className="text-sm font-semibold truncate w-36">{user.name}</p>
                <p className="text-xs text-emerald-400 capitalize flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Client</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "overview", icon: LayoutDashboard, label: "Portfolio Overview" },
            { id: "expenses", icon: PieChartIcon, label: "Expense Matrix" },
            { id: "transactions", icon: Activity, label: "Transactions" },
            { id: "insights", icon: Lightbulb, label: "Smart Insights" }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden
                ${activeTab === tab.id ? "bg-indigo-500/10 text-indigo-400 font-bold" : "text-neutral-400 hover:text-white hover:bg-white/5"}
              `}
            >
              {activeTab === tab.id && <motion.div layoutId="activeTabUser" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-md" />}
              <tab.icon className="w-5 h-5 z-10" /> <span className="z-10">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
           <button onClick={handleSignOut} className="w-full py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors rounded-lg flex items-center justify-center gap-2">
             Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-neutral-950 to-neutral-950">
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-30 md:hidden">
          <div className="flex items-center gap-2">
             <Zap className="w-6 h-6 text-indigo-500" />
             <span className="font-bold tracking-tight">FinDash Pro</span>
          </div>
          <button onClick={handleSignOut} className="text-sm font-medium text-rose-400">Sign Out</button>
        </header>

        <div className="p-8">
          {isInitializing ? (
             <div className="w-full h-full flex flex-col items-center justify-center pt-32">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-neutral-400 font-medium">Resolving secure connection...</p>
             </div>
          ) : (
           <AnimatePresence mode="wait">
            <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="animate" exit={{ opacity: 0, transition: { duration: 0.1 } }} className="space-y-8">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-3xl font-bold capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
                  <p className="text-sm text-neutral-400 mt-2 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                     Data synchronized to your secure vault.
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Profile: <span className="text-white font-semibold">{user.role === 'admin' ? 'Admin' : 'Viewer'}</span></p>
                  <div className="mt-3">
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Switch Role</label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleToggle(e.target.value)}
                      className="w-full max-w-xs px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <button onClick={toggleTheme} className="p-3 bg-neutral-800 border border-white/20 rounded-full hover:bg-neutral-700 transition duration-300 shadow-xl self-start">
                   {isLightMode ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-emerald-400" />}
                </button>
              </div>

              {activeTab === "overview" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                          <CreditCard className="w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest relative z-10">Total Balance</p>
                      <p className="text-3xl font-bold mt-1 font-mono tracking-tighter relative z-10">₹ {balance.toLocaleString()}</p>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest relative z-10">Income</p>
                      <p className="text-3xl font-bold mt-1 text-emerald-400 font-mono tracking-tighter relative z-10">₹ {totalRevenue.toLocaleString()}</p>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30">
                          <ArrowDownRight className="w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest relative z-10">Expenses</p>
                      <p className="text-3xl font-bold mt-1 text-rose-400 font-mono tracking-tighter relative z-10">₹ {totalExpense.toLocaleString()}</p>
                    </motion.div>
                  </div>

                  <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                       <div>
                         <h3 className="text-lg font-bold">Balance Fluctuation Spline</h3>
                         <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] uppercase font-bold rounded">Live Rendering</span>
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
                     <div className="h-72 w-full">
                        {aggregatedChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={aggregatedChartData}>
                              <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                              <XAxis dataKey="label" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                              <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val)=>`₹${val}`} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: 'rgba(23,23,23,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter:'blur(8px)' }}
                                itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}
                              />
                              <Area type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-50">
                             <Activity className="w-10 h-10 mb-2"/>
                             <span>No telemetry collected for spline chart</span>
                          </div>
                        )}
                     </div>
                  </motion.div>
                </>
              )}

              {activeTab === "expenses" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <motion.div variants={itemVariants} className="p-8 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <h3 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Volume Matrix</h3>
                    <div className="h-64 w-full flex items-center justify-center">
                       {personalCategoryData.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie
                               data={personalCategoryData}
                               cx="50%"
                               cy="50%"
                               innerRadius={70}
                               outerRadius={95}
                               paddingAngle={8}
                               dataKey="value"
                               cornerRadius={6}
                             >
                               {personalCategoryData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                               ))}
                             </Pie>
                             <RechartsTooltip 
                               contentStyle={{ backgroundColor: 'rgba(23,23,23,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter:'blur(8px)' }}
                               itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                               formatter={(val)=>`₹${val}`}
                             />
                           </PieChart>
                         </ResponsiveContainer>
                       ) : (
                         <p className="text-neutral-500 flex flex-col items-center"><Activity className="w-8 h-8 opacity-20 mb-2"/>No matrices to map</p>
                       )}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="p-8 rounded-2xl bg-white/5 border border-white/10 shadow-xl flex flex-col">
                    <h3 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Top Volume Categories</h3>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                       {personalCategoryData.length === 0 && <p className="text-neutral-500">No categoric spend mapped yet.</p>}
                       {personalCategoryData.map((cat, idx) => (
                          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0, transition:{delay: idx*0.1}}} key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-inner" style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20`, border: `1px solid ${COLORS[idx % COLORS.length]}40` }}>
                                   <Activity className="w-5 h-5" style={{ color: COLORS[idx % COLORS.length]}}/>
                                </div>
                                <span className="text-white font-bold tracking-wide">{cat.name}</span>
                             </div>
                             <span className="text-white font-mono text-lg font-bold">₹ {cat.value.toLocaleString()}</span>
                          </motion.div>
                       ))}
                    </div>
                  </motion.div>
                </div>
              )}

              {activeTab === "transactions" && (
                <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4 border-b border-white/10 pb-6">
                      <div>
                        <h3 className="text-xl font-bold">Encrypted Ledger</h3>
                        <p className="text-sm text-neutral-400 mt-2">Personal ledger view: all your own transactions, sortable and searchable.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                          <input
                            type="text"
                            placeholder="Trace context..."
                            value={search}
                            onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}}
                            className="w-full sm:w-56 pl-9 pr-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                          />
                        </div>
                        <select
                          value={filter}
                          onChange={(e) => {setFilter(e.target.value); setCurrentPage(1);}}
                          className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm font-medium text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                        >
                            <option value="all">Mixed (All)</option>
                            <option value="income">Inbound (Income)</option>
                            <option value="expense">Outbound (Expense)</option>
                        </select>
                        <select
                          value={sortOption}
                          onChange={(e) => {setSortOption(e.target.value); setCurrentPage(1);}}
                          className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm font-medium text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                        >
                            <option value="date_desc">Date: Newest</option>
                            <option value="date_asc">Date: Oldest</option>
                            <option value="amount_desc">Amount: High → Low</option>
                            <option value="amount_asc">Amount: Low → High</option>
                        </select>
                        <button onClick={handleExportCSV} className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                           <Download className="w-4 h-4"/> Extract Data
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto min-h-[300px]">
                      {paginatedTx.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-neutral-500 font-medium">
                           <Search className="w-10 h-10 mb-3 opacity-20" />
                           No ledger records trace to current parameters.
                        </div>
                      ) : (
                        <table className="w-full text-left text-sm text-neutral-400">
                            <thead className="text-xs uppercase bg-white/5 text-neutral-300 border-y border-white/10">
                              <tr>
                                <th className="px-6 py-4 font-medium">Log Date</th>
                                <th className="px-6 py-4 font-medium">Category</th>
                                <th className="px-6 py-4 font-medium text-right">Amount (₹)</th>
                                <th className="px-6 py-4 font-medium text-right">Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedTx.map((t, i) => (
                                <motion.tr custom={i} initial={{opacity:0, y:10}} animate={{opacity:1,y:0, transition:{delay:i*0.05}}} key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                  <td className="px-6 py-4 font-mono text-xs">{t.date}</td>
                                  <td className="px-6 py-4 text-white font-medium pl-8 relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {t.category}
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-white tracking-tight text-base">₹{t.amount.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`}>
                                      {t.type}
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                        </table>
                      )}
                    </div>

                    {totalPages > 1 && (
                       <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                          <span className="text-xs text-neutral-500 uppercase font-medium tracking-wider">Paginating Block Details</span>
                          <div className="flex items-center gap-2 relative z-20">
                            <button disabled={currentPage===1} onClick={()=>setCurrentPage(prev=>prev-1)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors">
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-white px-3 font-mono">{currentPage} / {totalPages}</span>
                            <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(prev=>prev+1)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                       </div>
                    )}
                </motion.div>
              )}

              {activeTab === "insights" && (
                <div className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <motion.div variants={itemVariants} className="p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.05)]">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
                             <Lightbulb className="w-6 h-6 text-indigo-400" />
                           </div>
                           <h3 className="text-xl font-bold text-indigo-400 uppercase tracking-widest text-sm">Top Spending Category</h3>
                        </div>
                        {topPersonalCategory && topPersonalCategory.cat !== 'None' ? (
                          <p className="text-neutral-300 leading-relaxed font-medium mt-6">
                            Your highest spend category is <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded tracking-widest">{topPersonalCategory.cat}</span> with <span className="font-bold text-indigo-400">₹{topPersonalCategory.amount.toLocaleString()}</span> in expense.
                            Use this insight to rebalance your budget and limit future outflows.
                          </p>
                        ) : (
                          <p className="text-neutral-500 mt-6 font-medium">Insufficient telemetry to build categoric models.</p>
                        )}
                     </motion.div>

                     <motion.div variants={itemVariants} className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                             <Activity className="w-6 h-6 text-emerald-400" />
                           </div>
                           <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest text-sm">Spending Health</h3>
                        </div>
                        <p className="text-neutral-300 leading-relaxed font-medium mt-6">
                          Your current finance balance is <span className="text-white font-mono">₹{balance.toLocaleString()}</span> after inbound <span className="text-white font-mono">₹{totalRevenue.toLocaleString()}</span> and outbound <span className="text-white font-mono">₹{totalExpense.toLocaleString()}</span>.
                          {monthlyExpenseComparison ? (
                            <> Last month ({monthlyExpenseComparison.lastMonth}) spend changed by <span className="font-bold text-indigo-400">₹{Math.abs(monthlyExpenseComparison.diff).toLocaleString()}</span> from {monthlyExpenseComparison.prevMonth}.</>
                          ) : (
                            ' Keep tracking your activity to build stronger monthly health signals.'
                          )}
                        </p>
                     </motion.div>
                  </div>

                  <motion.div variants={itemVariants} className="p-8 rounded-2xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-md">
                     <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                       <h3 className="text-xl font-bold">Income / Expense Trend</h3>
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
                     <div className="h-80 w-full relative z-10">
                       {aggregatedChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={aggregatedChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="label" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                            <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v)=>`₹${v}`} />
                            <RechartsTooltip 
                               contentStyle={{ backgroundColor: 'rgba(23,23,23,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter:'blur(8px)' }}
                               itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}
                             />
                            <Bar dataKey="income" barSize={16} fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" barSize={16} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#171717' }} activeDot={{ r: 6 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                       ) : (
                         <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                             <Activity className="w-10 h-10 mb-2 opacity-20"/>
                             No chronologic traces available.
                         </div>
                       )}
                     </div>
                  </motion.div>

                </div>
              )}

            </motion.div>
           </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}