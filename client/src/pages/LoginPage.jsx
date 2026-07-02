import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import heroImage from "../assets/icon.png";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(
        formData.email,
        formData.password
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Matching the precise off-white/cream canvas tint from your homepage images
    <div className="relative min-h-screen bg-[#FDFDFB] flex items-center justify-center px-4 sm:px-6 lg:px-8 selection:bg-slate-900/10 selection:text-slate-950">
      
      {/* Back to Home Button */}
      <Link 
        to="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-zinc-200 shadow-sm text-zinc-500 hover:text-slate-950 hover:shadow-md transition-all z-50"
        aria-label="Back to home"
      >
        <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
      </Link>

      <div className="w-full max-w-[420px] relative z-10 py-12">
        {/* Core Header System synchronized with Landing Page Assets */}
        <div className="text-center mb-8">
          <h1 className="flex items-center justify-center gap-1.5 text-3xl font-extrabold text-[#04142C] tracking-tight font-sans">
            <img src={heroImage} alt="CollabBoard Logo" className="h-10 w-auto object-contain" />
            <span>Collab<span className="text-[#FFB94A]">Board</span></span>
          </h1>
          <p className="mt-2 text-sm text-zinc-500 font-medium">
            Sign in to access your infinite shared canvases
          </p>
        </div>

        {/* Integrated Form UI Card Structure */}
        <div className="bg-white px-6 py-8 sm:px-10 sm:py-10 shadow-xl shadow-zinc-200/40 border border-zinc-200/60 rounded-2xl">
          
          {error && (
            <div className="mb-5 rounded-xl bg-red-50/70 border border-red-200 p-3.5 text-xs font-semibold text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}

          {/* Google SSO Anchor Wrapper ensuring style consistency */}
          <div className="[&_button]:w-full [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:gap-2.5 [&_button]:rounded-xl [&_button]:border [&_button]:border-zinc-200 [&_button]:bg-white [&_button]:px-3 [&_button]:py-3 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-zinc-700 [&_button]:shadow-sm [&_button]:transition-all [&_button]:hover:bg-zinc-50 [&_button]:active:scale-[0.99]">
            <GoogleAuthButton actionText="Sign in with Google" />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-200/60"></div>
            </div>
            <div className="relative flex justify-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <span className="bg-white px-3">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-bold text-slate-950 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@work.com"
                className="block w-full rounded-xl border border-zinc-200/80 bg-zinc-50/30 px-3.5 py-3 text-slate-950 placeholder:text-zinc-400 focus:bg-white focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 sm:text-sm transition-all outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-bold text-slate-950 uppercase tracking-wider"
                >
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-semibold text-zinc-500 hover:text-slate-950 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-zinc-200/80 bg-zinc-50/30 px-3.5 py-3 text-slate-950 placeholder:text-zinc-400 focus:bg-white focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 sm:text-sm transition-all outline-none"
                required
              />
            </div>

            {/* Premium Slate-950 Action Button (Matches "Get Started" styling) */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-[#051129] px-3 py-3 text-sm font-semibold text-white hover:bg-[#0c1e42] focus-visible:ring-4 focus-visible:ring-slate-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] shadow-md shadow-slate-950/10 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-zinc-400" />
                  Authenticating...
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>
        </div>

        {/* Footer Navigation Hierarchy */}
        <p className="mt-8 text-center text-sm text-zinc-500 font-medium">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-bold text-[#051129] hover:text-[#0c1e42] transition-colors underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>

      </div>
    </div>
  );
}

export default LoginPage;