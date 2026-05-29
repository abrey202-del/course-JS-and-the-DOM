"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/admin";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#060308] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#c39c4b] to-[#8b6914] flex items-center justify-center">
            <Lock className="w-10 h-10 text-[#060308]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#e8d9b5] mb-2">Staff Login</h1>
          <p className="text-[#c39c4b]/60 text-sm">Access the Hasset Restaurant management system</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-[#0d0a10] border border-[#c39c4b]/20 rounded-xl p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-[0.1em] font-semibold">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c39c4b]/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="staff@hasset.com"
                className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg pl-11 pr-4 py-3 text-[#e8d9b5] outline-none focus:border-[#c39c4b]/60 transition-colors placeholder:text-[#e8d9b5]/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-[0.1em] font-semibold">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c39c4b]/40" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg pl-11 pr-12 py-3 text-[#e8d9b5] outline-none focus:border-[#c39c4b]/60 transition-colors placeholder:text-[#e8d9b5]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c39c4b]/40 hover:text-[#c39c4b]/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c39c4b] text-[#060308] py-3.5 rounded-lg font-bold tracking-wide hover:bg-[#d4ad5c] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Back to Menu Link */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-[#c39c4b]/60 hover:text-[#c39c4b] text-sm transition-colors"
          >
            ← Back to Menu
          </a>
        </div>
      </div>
    </div>
  );
}
