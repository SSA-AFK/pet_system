import React, { useState, useEffect } from "react";
import { UserRole } from "../types";
import { Shield, Key, Sparkles, AlertCircle, ChevronRight, X } from "lucide-react";
import { setAuthToken } from "../hooks/useApiData";

const isDevMode = import.meta.env.VITE_DEV_MODE === "true";

interface LoginLayoutProps {
  onLoginSuccess: (role: UserRole, username: string, name: string) => void;
  visible: boolean;
  onClose: () => void;
}

export default function LoginLayout({ onLoginSuccess, visible, onClose }: LoginLayoutProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* 打开时重置表单 */
  useEffect(() => {
    if (visible) {
      setUsername("");
      setPassword("");
      setError("");
      setLoading(false);
    }
  }, [visible]);

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
        if (data.token) setAuthToken(data.token);
        const roleMap: Record<string, UserRole> = {
          "SUPER_ADMIN": UserRole.SUPER_ADMIN,
          "MANAGER": UserRole.MANAGER,
          "STAFF": UserRole.STAFF,
          "CUSTOMER": UserRole.CUSTOMER
        };
        onLoginSuccess(roleMap[user.role] || UserRole.CUSTOMER, user.username, user.display_name);
      } else {
        setError(data.detail || "账号或密码错误");
      }
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      switch (role) {
        case UserRole.SUPER_ADMIN:
          onLoginSuccess(UserRole.SUPER_ADMIN, "admin", "张老板");
          break;
        case UserRole.MANAGER:
          onLoginSuccess(UserRole.MANAGER, "manager", "陈店长");
          break;
        case UserRole.STAFF:
          onLoginSuccess(UserRole.STAFF, "staff", "高级美容师丽丽");
          break;
        case UserRole.CUSTOMER:
          onLoginSuccess(UserRole.CUSTOMER, "member", "陈女士 (黄金卡会员)");
          break;
      }
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.3s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md mx-4"
        style={{ animation: "slideUp 0.3s ease-out" }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center z-10 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Logo 区域 */}
        <div className="mb-6">
          <div className="flex justify-center items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <Sparkles size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              宠物智管云端原型系统
            </h1>
          </div>
          <p className="mt-2 text-center text-sm text-slate-400">
            智能化多角色联动运营原型演示 (PC端后台 + 移动端小程序)
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl border border-slate-700 sm:px-10">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                账号 (User Key)
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Shield size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="请输入账号"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest">
                密码 (Credential)
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="请输入密码"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-xs text-red-200">
                <AlertCircle className="shrink-0 mt-0.5 text-red-400" size={14} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex justify-center items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "验证并登录云系统"
                )}
              </button>
            </div>
          </form>

          {/* Quick Login Passcards - Dev Mode Only */}
          {isDevMode && (
          <div className="mt-8 pt-6 border-t border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">
              快速体验账号通道 (免密码点击)
            </h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              {/* Card 1: Boss/Owner */}
              <button
                onClick={() => handleQuickLogin(UserRole.SUPER_ADMIN)}
                className="p-3 bg-slate-900/50 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 rounded-xl text-left transition-all group scale-100 active:scale-95"
              >
                <div className="flex justify-between items-center text-[10px] text-blue-400 font-semibold mb-1">
                  <span>超级管理员</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:animate-ping" />
                </div>
                <div className="text-xs font-bold text-white mb-0.5">老板/店主后台</div>
                <div className="text-[10px] text-slate-500 font-mono">所有功能 / AI分析</div>
              </button>

              {/* Card 2: Manager */}
              <button
                onClick={() => handleQuickLogin(UserRole.MANAGER)}
                className="p-3 bg-slate-900/50 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-700/60 rounded-xl text-left transition-all group scale-100 active:scale-95"
              >
                <div className="flex justify-between items-center text-[10px] text-emerald-400 font-semibold mb-1">
                  <span>店长/管理员</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white mb-0.5">业务管理端</div>
                <div className="text-[10px] text-slate-500 font-mono">除设置与员工外全开</div>
              </button>


            </div>
          </div>
          )}
        </div>

        {/* 小程序入口 */}
        <div className="mt-4 text-center">
          <a
            href="#/miniapp"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 transition-colors"
          >
            📱 员工/顾客请进入小程序端
            <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
