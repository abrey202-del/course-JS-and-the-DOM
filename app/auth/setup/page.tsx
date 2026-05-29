"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, UserPlus, Check, X } from "lucide-react";

const STAFF_ACCOUNTS = [
  { email: "cashier@hasset.com", role: "Cashier", description: "Full order overview and revenue tracking" },
  { email: "kitchen@hasset.com", role: "Kitchen Staff", description: "Food order preparation" },
  { email: "bar@hasset.com", role: "Bartender", description: "Drink order preparation" },
];

const DEFAULT_PASSWORD = "Hasset2024!";

export default function SetupPage() {
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);
  const supabase = createClient();

  const createAccount = async (email: string) => {
    setLoading(email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password: DEFAULT_PASSWORD,
      options: {
        data: {
          role: STAFF_ACCOUNTS.find(a => a.email === email)?.role,
        }
      }
    });

    if (error) {
      setResults(prev => ({
        ...prev,
        [email]: { success: false, message: error.message }
      }));
    } else {
      setResults(prev => ({
        ...prev,
        [email]: { success: true, message: "Account created! (Check email to confirm)" }
      }));
    }
    
    setLoading(null);
  };

  const createAllAccounts = async () => {
    for (const account of STAFF_ACCOUNTS) {
      if (!results[account.email]?.success) {
        await createAccount(account.email);
      }
    }
    setAllDone(true);
  };

  return (
    <div className="min-h-screen bg-[#060308] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#c39c4b] to-[#8b6914] flex items-center justify-center">
            <UserPlus className="w-10 h-10 text-[#060308]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#e8d9b5] mb-2">Staff Account Setup</h1>
          <p className="text-[#c39c4b]/60 text-sm">Create accounts for Hasset Restaurant staff</p>
        </div>

        <div className="bg-[#0d0a10] border border-[#c39c4b]/20 rounded-xl p-6 space-y-4">
          <div className="bg-[#c39c4b]/10 border border-[#c39c4b]/30 rounded-lg p-4 mb-6">
            <p className="text-[#c39c4b] text-sm font-medium mb-1">Default Password for all accounts:</p>
            <code className="text-[#e8d9b5] bg-[#060308] px-3 py-1 rounded text-lg font-mono">{DEFAULT_PASSWORD}</code>
          </div>

          {STAFF_ACCOUNTS.map((account) => (
            <div key={account.email} className="flex items-center justify-between p-4 bg-[#060308] border border-[#c39c4b]/20 rounded-lg">
              <div>
                <p className="text-[#e8d9b5] font-medium">{account.role}</p>
                <p className="text-[#c39c4b]/60 text-sm">{account.email}</p>
                <p className="text-[#c39c4b]/40 text-xs mt-1">{account.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {results[account.email] ? (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    results[account.email].success 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {results[account.email].success ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {results[account.email].success ? 'Created' : 'Error'}
                  </div>
                ) : (
                  <button
                    onClick={() => createAccount(account.email)}
                    disabled={loading !== null}
                    className="px-4 py-2 bg-[#c39c4b] text-[#060308] rounded-lg font-semibold text-sm hover:bg-[#d4ad5c] disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {loading === account.email ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Create'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={createAllAccounts}
            disabled={loading !== null || allDone}
            className="w-full mt-6 bg-gradient-to-r from-[#c39c4b] to-[#8b6914] text-[#060308] py-3.5 rounded-lg font-bold tracking-wide hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : allDone ? (
              <>
                <Check className="w-5 h-5" />
                All Accounts Created
              </>
            ) : (
              'Create All Accounts'
            )}
          </button>

          <p className="text-[#c39c4b]/40 text-xs text-center mt-4">
            Note: Users may need to confirm their email before logging in, depending on your Supabase settings.
          </p>
        </div>

        <div className="text-center mt-6 space-x-4">
          <a href="/auth/login" className="text-[#c39c4b]/60 hover:text-[#c39c4b] text-sm transition-colors">
            Go to Login →
          </a>
        </div>
      </div>
    </div>
  );
}
