import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, ShieldCheck, Zap, ChevronDown, User, Shield, BookOpen, X, Info, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Landing() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 overflow-hidden font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">FinDash</span>
          </div>
          
          <div className="flex items-center">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium"
              >
                Login Menu
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-white/5 bg-white/5">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Select Portal</p>
                  </div>
                  <button 
                    onClick={() => navigate('/login?role=viewer')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">View for Viewer</p>
                      <p className="text-xs text-neutral-400">Personal finance dashboard</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => navigate('/login?role=admin')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">View for Admin</p>
                      <p className="text-xs text-neutral-400">System overview panel</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs font-semibold uppercase tracking-wider">New Features Available</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
          Manage your finances <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            intelligently
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
          Gain unparalleled insights into your spending, track your investments, and grow your wealth with our state-of-the-art financial dashboard.
        </p>
        
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
          <button 
            onClick={() => setIsGuideOpen(true)} 
            className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] flex items-center gap-2 group mx-auto"
          >
            <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
            How to Use FinDash
          </button>
          
          <AnimatePresence>
            {isGuideOpen && (
               <motion.div 
                 initial={{ opacity: 0, height: 0, y: -20 }}
                 animate={{ opacity: 1, height: 'auto', y: 0 }}
                 exit={{ opacity: 0, height: 0, y: -20, transition: { duration: 0.2 } }}
                 className="w-full text-left bg-neutral-900 border border-indigo-500/30 rounded-2xl p-6 md:p-8 mt-2 relative overflow-hidden shadow-2xl"
               >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                 
                 <button onClick={() => setIsGuideOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors z-20">
                   <X className="w-5 h-5" />
                 </button>
                 
                 <div className="flex items-center gap-3 mb-6 relative z-10">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                     <Info className="w-5 h-5" />
                   </div>
                   <h2 className="text-2xl font-bold text-white">Beginner's Quick Guide</h2>
                 </div>
                 
                 <div className="space-y-6 relative z-10">
                    <div className="flex gap-4">
                       <div className="flex-shrink-0 w-8 h-8 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">1</div>
                       <div>
                         <h3 className="text-lg font-bold text-white mb-1">Create an Account</h3>
                         <p className="text-neutral-400 text-sm leading-relaxed">
                           Use the <strong>Login Menu</strong> at the top right to select "View for Viewer", then click "Sign up for free". Create your very own dummy testing account. Note down your email/password!
                         </p>
                       </div>
                    </div>
                    
                    <div className="flex gap-4">
                       <div className="flex-shrink-0 w-8 h-8 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">2</div>
                       <div>
                         <h3 className="text-lg font-bold text-white mb-1">Populate Your Data</h3>
                         <p className="text-neutral-400 text-sm leading-relaxed">
                           Head to the <strong>Admin Dashboard</strong> (Via "Login Menu" &gt; "View for Admin") and sign up as an Admin. From there, you can inject real dummy transactions tailored to your specific Viewer account!
                         </p>
                       </div>
                    </div>
                    
                    <div className="flex gap-4">
                       <div className="flex-shrink-0 w-8 h-8 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold"><CheckCircle2 className="w-4 h-4" /></div>
                       <div>
                         <h3 className="text-lg font-bold text-white mb-1">Explore Insights</h3>
                         <p className="text-neutral-400 text-sm leading-relaxed">
                           Switch back to the Viewer's dashboard to see the beautiful animated charts, expense matrices, and spending insights react to the data you injected.
                         </p>
                       </div>
                    </div>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-32 grid md:grid-cols-3 gap-8 w-full text-left relative z-10">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <BarChart3 className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">Visualize your data with interactive charts and get actionable insights instantly.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Bank-grade Security</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">Your data is encrypted at rest and in transit. We take your privacy seriously.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <Zap className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">Built on modern architecture ensuring you get your data when you need it, fast.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
