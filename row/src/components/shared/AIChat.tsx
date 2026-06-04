import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, PawPrint } from "lucide-react";
import { THEME, AI_CHAT_ROLES } from "../../theme";

/* ─────────────────── Types ─────────────────── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  time: string;
}

interface AIChatProps {
  /** AI 角色标识 */
  role: "CUSTOMER" | "STAFF_GROOMER" | "ADMIN";
  /** 知识库类型 */
  kbType: "customer" | "staff" | "admin";
  /** 主题色，默认 #165DFF */
  themeColor?: string;
  /** 打开方式 */
  mode?: "floating" | "sidebar";
  /** 快捷标签列表 */
  quickTags?: string[];
  /** 是否默认展开 */
  defaultOpen?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
}

/* ─────────────────── 默认欢迎语 ─────────────────── */

const WELCOME_MAP: Record<AIChatProps["role"], string> = {
  CUSTOMER:
    "亲爱的萌宠家长您好！我是您的智能客服AI。关于服务预约、会员卡折扣、洗护流程、或是宝贝日常护理建议，都可以向我提问哟！🐾",
  STAFF_GROOMER:
    "您好，专业的美容技师！我已经和您的《洗护美容与安全实操规程》完成对接。您可以随时向我咨询造型方案、洗护配方或防应激措施。✂️",
  ADMIN:
    "您好，老板！我已经为您加载了专属的《店铺经营与连锁管理知识库》。您可以随时向我咨询经营分析、排班管理或库存策略。👑",
};

/* ─────────────────── 默认快捷标签 ─────────────────── */

const DEFAULT_TAGS: Record<AIChatProps["role"], string[]> = {
  CUSTOMER: [
    "洗护预约怎么取消或改期？",
    "会员卡有什么优惠折扣？",
    "猫咪洗澡要注意什么？",
  ],
  STAFF_GROOMER: [
    "比熊怎么修剪圆头造型？",
    "敏感皮肤用什么配方？",
    "猫咪洗护防应激措施",
  ],
  ADMIN: [
    "本月营收分析",
    "库存预警情况",
    "员工排班建议",
  ],
};

/* ─────────────────── Component ─────────────────── */

export default function AIChat({
  role,
  kbType,
  themeColor = THEME.PRIMARY,
  mode = "floating",
  quickTags,
  defaultOpen = false,
  onClose,
}: AIChatProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: WELCOME_MAP[role],
      time: new Date().toTimeString().substring(0, 5),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const tags = quickTags ?? DEFAULT_TAGS[role];
  const roleLabel =
    AI_CHAT_ROLES[role]?.label ?? "AI 助手";

  /* 自动滚到底部 */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ─── 发送消息 ─── */
  const sendMessage = async (presetText?: string) => {
    const text = presetText ?? input;
    if (!text.trim()) return;

    const now = () => new Date().toTimeString().substring(0, 5);
    setMessages((prev) => [...prev, { role: "user", content: text, time: now() }]);
    if (!presetText) setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, history, kbType }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content || "AI 服务繁忙，请稍后再试。", time: now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "无法与 AI 服务建立连接，请稍后再试。", time: now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  /* ─── 聊天面板内容 ─── */
  const chatPanel = (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex items-center gap-2 text-white">
          <PawPrint size={18} />
          <span className="font-semibold text-sm">{roleLabel}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
              <span>{m.time}</span>
              <span
                style={{ color: m.role === "user" ? themeColor : THEME.ACCENT }}
                className="font-medium"
              >
                {m.role === "user" ? "我" : roleLabel}
              </span>
            </div>
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "text-white rounded-tr-none shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm"
              }`}
              style={
                m.role === "user"
                  ? { backgroundColor: themeColor }
                  : undefined
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start flex-col">
            <span
              className="text-[10px] font-bold mb-1 animate-pulse"
              style={{ color: themeColor }}
            >
              正在为您查询中...
            </span>
            <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex gap-1.5 shadow-sm">
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: themeColor, animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: themeColor, animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: themeColor, animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick tags */}
      {tags.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-2.5 space-y-1.5 shrink-0 bg-white">
          <span className="text-[10px] text-slate-400 font-bold">常见问题快速咨询：</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tags.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="px-3 py-1.5 text-[11px] rounded-lg whitespace-nowrap transition-all disabled:opacity-50 border"
                style={{
                  backgroundColor: THEME.PRIMARY_LIGHT,
                  borderColor: themeColor + "40",
                  color: themeColor,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = themeColor + "20";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.PRIMARY_LIGHT;
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 p-3 bg-white flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="输入您的问题..."
          className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 text-slate-700"
          style={{ ["--tw-ring-color" as string]: themeColor }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-40"
          style={{ backgroundColor: themeColor }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );

  /* ─── Floating 模式 ─── */
  if (mode === "floating") {
    return (
      <>
        {/* FAB */}
        {!open && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setOpen(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all relative"
              style={{
                background: `linear-gradient(135deg, ${themeColor}, ${THEME.PRIMARY_DARK})`,
              }}
            >
              <MessageCircle size={24} />
              <span
                className="absolute -top-1 -right-1 text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold"
                style={{ backgroundColor: themeColor }}
              >
                AI
              </span>
            </button>
          </div>
        )}

        {/* Panel */}
        {open && (
          <div
            className="fixed bottom-6 right-6 z-50 rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: 380, height: 520 }}
          >
            {chatPanel}
          </div>
        )}
      </>
    );
  }

  /* ─── Sidebar 模式 ─── */
  return (
    <>
      {/* FAB toggle */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setOpen(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all relative"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, ${THEME.PRIMARY_DARK})`,
            }}
          >
            <MessageCircle size={24} />
            <span
              className="absolute -top-1 -right-1 text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold"
              style={{ backgroundColor: themeColor }}
            >
              AI
            </span>
          </button>
        </div>
      )}

      {/* Sidebar panel */}
      {open && (
        <div className="fixed top-0 right-0 bottom-0 z-50 w-96 bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {chatPanel}
        </div>
      )}
    </>
  );
}
