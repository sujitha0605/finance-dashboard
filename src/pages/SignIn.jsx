import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Zap, AlertCircle } from "lucide-react";

export default function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "viewer"; // defaults to viewer if not specified
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = (e) => {
    e.preventDefault();
    setError("");

    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const user = storedUsers.find((u) => u.email === email && (u.role === role || (role === 'viewer' && u.role === 'user')));

    if (!user) {
      setError(`${role === 'admin' ? 'Admin' : 'Viewer'} not found for this role. Please sign up to continue.`);
      return;
    }

    if (user.password !== password) {
      setError("Check your email/password. Incorrect credentials.");
      return;
    }

    // Success
    const normalizedUser = role === 'viewer' ? { ...user, role: 'viewer' } : user;
    if (normalizedUser.role !== user.role) {
      const updatedUsers = storedUsers.map(u => u.email === email ? normalizedUser : u);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    }
    localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
    if (role === 'admin') {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center text-white mb-6">
          <Zap className="w-10 h-10 text-indigo-500" />
        </Link>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-white tracking-tight">
          {role === 'admin' ? 'Admin Portal' : 'Viewer Portal'}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-400">
          Sign in to your {role === 'admin' ? 'Admin' : 'Viewer'} account
        </p>
        <p className="mt-2 text-center text-sm text-neutral-400">
          Don't have an account?{" "}
          <Link to={`/signup?role=${role}`} className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSignIn}>
            
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-neutral-900/50 text-white transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-neutral-900/50 text-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-white/10 rounded bg-neutral-900/50"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button type="submit" className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${role === 'admin' ? 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500' : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950`}>
                Sign in to {role === 'admin' ? 'Admin' : 'Dashboard'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
