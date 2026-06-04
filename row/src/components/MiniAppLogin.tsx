import React, { useState } from "react";
import { UserRole } from "../types";
import { Smartphone, Key, Shield, AlertCircle, ChevronRight } from "lucide-react";

interface MiniAppLoginProps {
  onLoginSuccess: (role: UserRole, username: string, name: string) => void;
}

export default function MiniAppLogin({ onLoginSuccess }: MiniAppLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("请输入账号和密码");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === "success") {
        const user = data.user;
        if (user.role === "STAFF" || user.role === "CUSTOMER") {
          const roleMap: Record<string, UserRole> = {
            "STAFF": UserRole.STAFF,
            "CUSTOMER": UserRole.CUSTOMER
          };
          onLoginSuccess(roleMap[user.role], user.username, user.display_name);
        } else {
          setError("管理员请使用 Web 端登录");
        }
      } else {
        setError(data.detail || "账号或密码错误");
      }
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-pink-50 flex flex-col justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-300/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-300/20 blur-[130px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
            <Smartphone size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-sans">
            宠物智管小程序
          </h1>
        </div>
        <p className="mt-2 text-center text-sm text-slate-500">
          员工端 / 顾客端
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-3xl border border-orange-100 sm:px-10">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-widest">
                账号
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="请输入账号"
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-widest">
                密码
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="请输入密码"
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-600">
                <AlertCircle className="shrink-0 mt-0.5 text-red-400" size={14} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex justify-center items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "登录"
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a
            href="#/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-500 transition-colors"
          >
            💻 管理员请进入 Web 端
            <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
