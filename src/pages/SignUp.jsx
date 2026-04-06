import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Zap } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "viewer";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = (e) => {
    e.preventDefault();
    
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    
    // Check if viewer already exists
    if (storedUsers.some(u => u.email === email && (u.role === role || (role === 'viewer' && u.role === 'user')))) {
       alert("Viewer with this email already exists for this role.");
       return;
    }

    const newUser = { name, email, password, role };
    storedUsers.push(newUser);
    localStorage.setItem("users", JSON.stringify(storedUsers));
    
    // Login the user implicitly
    localStorage.setItem("currentUser", JSON.stringify(newUser));

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
          Create an {role === 'admin' ? 'Admin' : 'Viewer'} account
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link to={`/login?role=${role}`} className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in instead
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-300">
                Full name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-neutral-900/50 text-white transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-neutral-900/50 text-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button type="submit" className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${role === 'admin' ? 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500' : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950`}>
                Sign up as {role === 'admin' ? 'Admin' : 'Viewer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
