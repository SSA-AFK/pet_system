import React from "react";
import { PawPrint } from "lucide-react";
import { THEME } from "../../theme";

/* ─────────────────── 导航菜单配置 ─────────────────── */
const NAV_ITEMS = [
  { label: "首页", key: "dashboard" },
  { label: "在线预约", key: "booking" },
  { label: "客户管理", key: "clients" },
  { label: "预约管理", key: "appointments" },
  { label: "服务管理", key: "services" },
  { label: "库存管理", key: "inventory" },
  { label: "收银结算", key: "cashier" },
];

/* ─────────────────── Props ─────────────────── */
interface NavBarProps {
  /** 是否显示中间导航菜单项 */
  showNavItems?: boolean;
  /** 当前激活的菜单项 key */
  activeItem?: string;
  /** 导航栏背景是否透明（用于落地页轮播场景） */
  transparent?: boolean;
  /** 是否固定顶部 */
  fixed?: boolean;
  /** 右侧操作区：已登录用户信息或登录按钮 */
  rightContent?: React.ReactNode;
  /** 点击 Logo 回调 */
  onLogoClick?: () => void;
  /** 点击导航项回调 */
  onNavClick?: (key: string) => void;
}

/* ─────────────────── NavBar 组件 ─────────────────── */
export default function NavBar({
  showNavItems = true,
  activeItem,
  transparent = false,
  fixed = true,
  rightContent,
  onLogoClick,
  onNavClick,
}: NavBarProps) {
  return (
    <header
      className={`${fixed ? "fixed top-0 left-0 right-0" : "relative"} z-50 flex items-center justify-between px-10`}
      style={{
        backgroundColor: transparent ? "transparent" : THEME.NAV_BG,
        height: 64,
      }}
    >
      {/* 左侧 Logo */}
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={onLogoClick}
      >
        <PawPrint size={28} color={THEME.PRIMARY} />
        <span className="text-lg font-bold tracking-wide text-white">
          宠店智管 Pro
        </span>
      </div>

      {/* 中间导航菜单 */}
      {showNavItems && (
        <nav className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavClick?.(item.key)}
              className="text-sm transition-colors duration-200 cursor-pointer"
              style={{
                color:
                  activeItem === item.key
                    ? THEME.PRIMARY
                    : "rgba(255,255,255,0.9)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  THEME.PRIMARY;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  activeItem === item.key
                    ? THEME.PRIMARY
                    : "rgba(255,255,255,0.9)";
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {/* 右侧操作区 */}
      {rightContent && (
        <div className="flex items-center gap-3">{rightContent}</div>
      )}
    </header>
  );
}
