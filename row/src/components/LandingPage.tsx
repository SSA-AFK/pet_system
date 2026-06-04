import React, { useState, useEffect, useRef, useCallback } from "react";
import { UserRole } from "../types";
import { ChevronDown, LogOut, User } from "lucide-react";
import NavBar from "./shared/NavBar";
import AIChat from "./shared/AIChat";
import Footer from "./shared/Footer";
import { THEME } from "../theme";

/* ─────────────────── 常量 ─────────────────── */

/* 轮播图配置 — 使用实际宠物店场景图 */
const CAROUSEL_SLIDES = [
  {
    background: "url('/slides/slide1.jpg') center/cover no-repeat",
    alt: "宠物洗浴场景",
  },
  {
    background: "url('/slides/slide2.jpg') center/cover no-repeat",
    alt: "宠物美容场景",
  },
  {
    background: "url('/slides/slide3.jpg') center/cover no-repeat",
    alt: "宠物寄养场景",
  },
];

/* ─────────────────── Props ─────────────────── */
interface LandingPageProps {
  currentUser: { role: UserRole; username: string; displayName: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onEnterAdmin: () => void;
}

/* ─────────────────── 组件 ─────────────────── */
export default function LandingPage({
  currentUser,
  onLoginClick,
  onLogout,
  onEnterAdmin,
}: LandingPageProps) {
  /* ── 轮播状态 ── */
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  /* ── 用户下拉菜单 ── */
  const [showUserMenu, setShowUserMenu] = useState(false);

  /* ── 页面淡入 ── */
  const [pageVisible, setPageVisible] = useState(false);

  /* ─────────────── 副作用 ─────────────── */

  /* 页面加载淡入 */
  useEffect(() => {
    requestAnimationFrame(() => setPageVisible(true));
  }, []);

  /* 轮播自动切换 */
  useEffect(() => {
    slideTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(slideTimerRef.current);
  }, []);

  /* 点击外部关闭用户菜单 */
  useEffect(() => {
    if (!showUserMenu) return;
    const close = () => setShowUserMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showUserMenu]);

  /* ─────────────── 处理函数 ─────────────── */

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    clearInterval(slideTimerRef.current);
    slideTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
  }, []);

  /* ─────────────── 导航栏右侧内容 ─────────────── */

  const navRightContent = !currentUser ? (
    <button
      onClick={onLoginClick}
      className="px-5 py-1.5 text-sm font-medium text-white border border-white/40 rounded hover:bg-white/10 hover:border-white/60 transition-all duration-200"
    >
      登录
    </button>
  ) : (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowUserMenu((v) => !v);
        }}
        className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: THEME.PRIMARY }}
        >
          <User size={16} />
        </div>
        <span>{currentUser.displayName}</span>
        <ChevronDown size={14} />
      </button>

      {/* 下拉菜单 */}
      {showUserMenu && (
        <div className="absolute right-0 top-12 w-40 bg-white rounded-lg shadow-xl py-1 z-50">
          <button className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <User size={14} />
            个人中心
          </button>
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );

  /* ─────────────── 渲染 ─────────────── */
  return (
    <div
      className="relative w-full h-screen overflow-hidden font-sans text-white"
      style={{
        opacity: pageVisible ? 1 : 0,
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      {/* ═══════════ 1. 轮播背景层 ═══════════ */}
      {CAROUSEL_SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            background: slide.background,
            opacity: currentSlide === i ? 1 : 0,
            zIndex: currentSlide === i ? 1 : 0,
          }}
        />
      ))}
      {/* 30% 黑色半透明遮罩 */}
      <div className="absolute inset-0 bg-black/30 z-[2]" />

      {/* ═══════════ 2. 顶部导航栏 ═══════════ */}
      <NavBar
        showNavItems
        activeItem="首页"
        transparent
        fixed
        onLogoClick={() => {}}
        onNavClick={(key) => {
          if (key === "booking") {
            window.location.hash = "#/book";
          } else if (currentUser) {
            onEnterAdmin();
          } else {
            onLoginClick();
          }
        }}
        rightContent={navRightContent}
      />

      {/* ═══════════ 3. 轮播指示器（底部小圆点） ═══════════ */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
        {CAROUSEL_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              currentSlide === i
                ? "bg-white scale-125"
                : "bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* ═══════════ 4. 中央核心内容区 ═══════════ */}
      <main className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4">
        {/* 大标题 */}
        <h1 className="text-center leading-tight text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold">
          AI赋能 让宠物店经营更轻松
        </h1>

        {/* 副标题 */}
        <p className="mt-6 text-center text-white/80 text-base md:text-lg lg:text-xl">
          智能预约 · AI洗护 · 数据化经营 · 一站式管理
        </p>

        {/* 两个并排主按钮 */}
        <div className="mt-12 flex items-center gap-6 flex-wrap justify-center">
          <button
            onClick={onEnterAdmin}
            className="group relative w-44 md:w-50 h-14 text-lg font-medium border-2 border-white rounded hover:bg-white/10 hover:border-white/60 hover:text-white transition-all duration-300 hover:scale-105 flex items-center justify-center"
          >
            进入管理后台
          </button>
          <button
            onClick={() => { window.location.hash = "#/book"; }}
            className="group relative w-44 md:w-50 h-14 text-lg font-medium rounded transition-all duration-300 hover:scale-105 text-white flex items-center justify-center"
            style={{ backgroundColor: THEME.ACCENT }}
          >
            在线预约
          </button>
        </div>
      </main>

      {/* ═══════════ 5. 底部门店信息栏 ═══════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <Footer showStoreInfo variant="dark" />
      </div>

      {/* ═══════════ 6. AI 助手浮动组件 ═══════════ */}
      <AIChat role="ADMIN" kbType="admin" />
    </div>
  );
}
