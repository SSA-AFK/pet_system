/**
 * 智宠系统 - 全局设计 Token
 * 所有页面共享此常量，确保视觉一致性
 */

export const THEME = {
  /** 主色调 - 系统蓝 */
  PRIMARY: "#165DFF",
  PRIMARY_DARK: "#1248d4",
  PRIMARY_LIGHT: "#e8f0ff",

  /** 辅助色 - 活力橙 */
  ACCENT: "#FF7D00",
  ACCENT_DARK: "#d96800",

  /** 导航栏背景 */
  NAV_BG: "#1F2329",

  /** 页面背景 */
  BG_LIGHT: "#f5f7fa",
  BG_BLUE_LIGHT: "#f0f4fa",

  /** 文字色 */
  TEXT_PRIMARY: "#1d2129",
  TEXT_SECONDARY: "#4e5969",
  TEXT_MUTED: "#86909c",
  TEXT_WHITE: "#ffffff",

  /** 边框色 */
  BORDER_LIGHT: "#e5e6eb",
  BORDER_DEFAULT: "#c9cdd4",

  /** 圆角 */
  RADIUS: {
    sm: "rounded",        // 4px
    md: "rounded-lg",     // 8px
    lg: "rounded-xl",     // 12px
    xl: "rounded-2xl",    // 16px
    full: "rounded-full", // 9999px
  },

  /** 字号 */
  FONT: {
    xs: "text-xs",    // 12px
    sm: "text-sm",    // 14px
    base: "text-base", // 16px
    lg: "text-lg",    // 18px
    xl: "text-xl",    // 20px
    "2xl": "text-2xl", // 24px
    "3xl": "text-3xl", // 30px
    "4xl": "text-4xl", // 36px
  },

  /** 阴影 */
  SHADOW: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  },

  /** 品牌信息 */
  BRAND: {
    name: "宠店智管 Pro",
    slogan: "智能管理，让每一只宠物都被温柔以待",
  },
} as const;

/** AI 聊天角色配置 */
export const AI_CHAT_ROLES = {
  CUSTOMER: { label: "宠物健康顾问", kbType: "customer" },
  STAFF_GROOMER: { label: "洗护美容顾问", kbType: "staff" },
  ADMIN: { label: "经营决策顾问", kbType: "admin" },
} as const;
