import React, { useState, useEffect, useCallback } from "react";
import { ServiceItem, InventoryItem } from "../types";
import NavBar from "./shared/NavBar";
import AIChat from "./shared/AIChat";
import Footer from "./shared/Footer";
import { THEME } from "../theme";

// Icon mapping for service categories
const SERVICE_ICONS: Record<string, string> = {
  "洗护": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20dog%20bath%20icon%2C%20flat%20design%2C%20pastel%20pink%20background%2C%20minimalist&image_size=square",
  "美容": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20pet%20grooming%20scissors%20icon%2C%20flat%20design%2C%20pastel%20pink%20background%2C%20minimalist&image_size=square",
  "寄养": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20pet%20hotel%20house%20icon%2C%20flat%20design%2C%20pastel%20pink%20background%2C%20minimalist&image_size=square",
  "SPA护理": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20pet%20spa%20relaxation%20icon%2C%20flat%20design%2C%20pastel%20pink%20background%2C%20minimalist&image_size=square",
};

const PET_TYPE_ICONS: Record<string, string> = {
  dog: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20golden%20retriever%20face%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
  cat: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20orange%20tabby%20cat%20face%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
  rabbit: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20white%20rabbit%20face%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
  hamster: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20hamster%20face%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
  other: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20pet%20paw%20print%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
};

const PET_TYPE_LABELS: Record<string, string> = {
  dog: "狗狗",
  cat: "猫咪",
  rabbit: "兔兔",
  hamster: "仓鼠",
  other: "其他",
};

// Calendar helper
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

export default function CustomerBooking() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({}); // { productId: quantity }
  const [petType, setPetType] = useState("dog");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [petNote, setPetNote] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerWechat, setOwnerWechat] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auth states
  const [loggedInClient, setLoggedInClient] = useState<{ id: string; name: string; phone: string; wechat: string; level: string; points: number; balance: number } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showMemberPayModal, setShowMemberPayModal] = useState(false);
  const [selectedMemberLevel, setSelectedMemberLevel] = useState<string | null>(null);
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authWechat, setAuthWechat] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Fetch services and inventory from API
  useEffect(() => {
    fetch("/api/services")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (json.status === "success") setServices(json.data);
      })
      .catch(console.error);
    fetch("/api/inventory")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (json.status === "success") setInventory(json.data.filter((i: InventoryItem) => i.stock > 0));
      })
      .catch(console.error);
  }, []);

  // Auto-fill owner info when logged in
  useEffect(() => {
    if (loggedInClient) {
      setOwnerName(loggedInClient.name);
      setOwnerPhone(loggedInClient.phone);
      setOwnerWechat(loggedInClient.wechat || "");
    }
  }, [loggedInClient]);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const prevMonth = () => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() - 1);
    if (d >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCalendarDate(d);
    }
  };

  const nextMonth = () => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() + 1);
    setCalendarDate(d);
  };

  const toggleService = (name: string) => {
    setSelectedServices(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const updateProductQty = (id: string, delta: number) => {
    setSelectedProducts(prev => {
      const curr = prev[id] || 0;
      const next = Math.max(0, curr + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  };

  const isDateDisabled = (day: number) => {
    const d = new Date(year, month, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isDateSelected = (day: number) => selectedDate === day;

  const formatDate = () => {
    if (!selectedDate) return "";
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
  };

  const serviceTotal = services
    .filter(s => selectedServices.includes(s.name))
    .reduce((sum, s) => sum + s.price, 0);
  const productTotal = Object.entries(selectedProducts).reduce((sum, [id, qty]) => {
    const item = inventory.find(i => i.id === id);
    return sum + (item ? item.price * (qty as number) : 0);
  }, 0);
  const totalPrice = serviceTotal + productTotal;
  const MEMBER_DISCOUNTS: Record<string, number> = {
    "普通用户": 1,
    "普通会员": 0.95,
    "黄金卡会员": 0.9,
    "钻石卡会员": 0.8,
  };
  const MEMBER_PRICES: Record<string, number> = {
    "普通会员": 99,
    "黄金卡会员": 299,
    "钻石卡会员": 599,
  };
  const discount = loggedInClient ? (MEMBER_DISCOUNTS[loggedInClient.level] || 1) : 1;
  const discountAmount = discount < 1 ? totalPrice * (1 - discount) : 0;
  const finalPrice = totalPrice * discount;
  const hasSelection = selectedServices.length > 0 || Object.keys(selectedProducts).length > 0;

  const goNext = () => {
    if (step === 1 && !hasSelection) return;
    if (step === 2 && (!petName || (!loggedInClient && (!ownerName || !ownerPhone)))) return;
    if (step === 3 && (!selectedDate || !selectedTime)) return;
    setStep(s => Math.min(s + 1, 6));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_name: petName,
          pet_type: petType,
          pet_age: petAge,
          pet_weight: petWeight,
          breed: petBreed,
          service_name: [...selectedServices, ...Object.entries(selectedProducts).map(([id, qty]) => {
            const item = inventory.find(i => i.id === id);
            return item ? `${item.name}x${qty}` : "";
          })].filter(Boolean).join(", "),
          client_name: ownerName,
          client_phone: ownerPhone,
          client_wechat: ownerWechat,
          date_time: `${formatDate()} ${selectedTime}`,
          status: "pending",
          total_price: finalPrice,
          progress_notes: petNote,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status === "success") {
        // Deduct inventory for purchased products
        for (const [id, qty] of Object.entries(selectedProducts)) {
          const item = inventory.find(i => i.id === id);
          if (item) {
            fetch(`/api/inventory/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: item.name, category: item.category, stock: Math.max(0, item.stock - (qty as number)), unit: item.unit, min_stock: item.minStock, price: item.price })
            }).catch(console.error);
          }
        }
        // Update points for logged-in client
        if (loggedInClient) {
          const pointsToAdd = Math.floor(finalPrice / 10);
          fetch(`/api/clients/${loggedInClient.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: loggedInClient.name, phone: loggedInClient.phone,
              level: loggedInClient.level,
              points: loggedInClient.points + pointsToAdd,
              balance: loggedInClient.balance,
              join_date: ""
            })
          }).catch(console.error);
        }
        setBookingId(json.id || `APT${Date.now()}`);
        setStep(6);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, petName, petType, petAge, petWeight, petBreed, selectedServices, selectedProducts, inventory, ownerName, ownerPhone, ownerWechat, selectedDate, selectedTime, totalPrice, petNote, loggedInClient, finalPrice]);

  const resetForm = () => {
    setStep(1);
    setSelectedServices([]);
    setSelectedProducts({});
    setPetType("dog");
    setPetName("");
    setPetBreed("");
    setPetAge("");
    setPetWeight("");
    setPetNote("");
    setOwnerName("");
    setOwnerPhone("");
    setOwnerWechat("");
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingId("");
  };

  // Auth functions
  const handleRegister = async () => {
    if (!authName || !authPhone || !authPassword) { setAuthError("请填写姓名、手机号和密码"); return; }
    if (authPhone.length !== 11) { setAuthError("请输入11位手机号"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch("/api/clients/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: authName, phone: authPhone, password: authPassword, wechat: authWechat })
      });
      const json = await res.json();
      if (json.status === "success") {
        setLoggedInClient(json.client);
        setShowRegisterModal(false);
        setAuthName(""); setAuthPhone(""); setAuthPassword(""); setAuthWechat("");
      } else { setAuthError(json.detail || "注册失败"); }
    } catch { setAuthError("网络错误，请重试"); }
    finally { setAuthLoading(false); }
  };

  const handleLogin = async () => {
    if (!authPhone || !authPassword) { setAuthError("请输入手机号和密码"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch("/api/clients/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone, password: authPassword })
      });
      const json = await res.json();
      if (json.status === "success") {
        setLoggedInClient(json.client);
        setShowLoginModal(false);
        setAuthPhone(""); setAuthPassword("");
      } else { setAuthError(json.detail || "登录失败"); }
    } catch { setAuthError("网络错误，请重试"); }
    finally { setAuthLoading(false); }
  };

  const handleMemberUpgrade = async (level: string) => {
    if (!loggedInClient) return;
    setSelectedMemberLevel(level);
    setShowMemberModal(false);
    setShowMemberPayModal(true);
  };

  const confirmMemberUpgrade = async () => {
    if (!loggedInClient || !selectedMemberLevel) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${loggedInClient.id}/upgrade`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: selectedMemberLevel })
      });
      const json = await res.json();
      if (json.status === "success") {
        setLoggedInClient({ ...loggedInClient, level: selectedMemberLevel });
        setShowMemberPayModal(false);
        setSelectedMemberLevel(null);
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  // Generate confetti pieces for step 6
  const confettiPieces = step === 6 ? Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: [THEME.PRIMARY, THEME.PRIMARY_DARK, "#4080ff", "#6b9fff", "#b3ccff", "#3370e6", "#99b8ff"][Math.floor(Math.random() * 7)],
  })) : [];

  // Floating paw prints & leaves
  const pawPrints = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: 5 + Math.random() * 90,
    size: 20 + Math.random() * 30,
    opacity: 0.03 + Math.random() * 0.05,
    delay: Math.random() * 15,
    duration: 15 + Math.random() * 20,
    emoji: i % 3 === 0 ? "🍃" : "🐾",
  }));

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 30%, #f0f4fa 60%, #e8f0ff 100%)" }}>
      {/* 装饰性渐变光晕 */}
      <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(22,93,255,0.15) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,125,0,0.12) 0%, transparent 70%)" }} />
      <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(22,93,255,0.1) 0%, transparent 70%)" }} />

      {/* Floating paw prints & leaves */}
      {pawPrints.map(p => (
        <div
          key={p.id}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${p.left}%`,
            bottom: "-40px",
            opacity: p.opacity,
            fontSize: `${p.size}px`,
            animation: `floatUp ${p.duration}s linear ${p.delay}s infinite`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Confetti for step 6 */}
      {step === 6 && confettiPieces.map(c => (
        <div
          key={c.id}
          className="absolute pointer-events-none"
          style={{
            left: `${c.left}%`,
            top: "-10px",
            width: "10px",
            height: "10px",
            backgroundColor: c.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
            animation: `confettiFall ${c.duration}s ease-in ${c.delay}s infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.05; }
          90% { opacity: 0.05; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22, 93, 255, 0.4); }
          50% { box-shadow: 0 0 20px 10px rgba(22, 93, 255, 0.1); }
        }
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes successSlide {
          from { opacity: 0; transform: translateY(40px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideUp { animation: slideUp 0.6s ease-out forwards; }
        .animate-pulseGlow { animation: pulseGlow 2s ease-in-out infinite; }
        .animate-checkPop { animation: checkPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-successSlide { animation: successSlide 0.8s ease-out forwards; }
        .step-card { animation: slideUp 0.5s ease-out forwards; }
        @keyframes marqueeScroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marqueeScroll 15s linear infinite;
          white-space: nowrap;
        }
      `}</style>

      {/* Header — 共享 NavBar */}
      <NavBar
        activeItem="在线预约"
        fixed={false}
        onLogoClick={() => window.location.hash = "#/"}
        onNavClick={(key) => {
          switch (key) {
            case "dashboard":
            case "clients":
            case "appointments":
            case "services":
            case "inventory":
            case "cashier":
              window.location.hash = "#/"; break;
          }
        }}
        rightContent={
          loggedInClient ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white" style={{ backgroundColor: THEME.PRIMARY }}>
                  {loggedInClient.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{loggedInClient.name}</span>
                {loggedInClient.level !== "普通用户" && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    loggedInClient.level === "普通会员" ? "bg-green-500/30 text-green-300" :
                    loggedInClient.level === "黄金卡会员" ? "bg-yellow-500/30 text-yellow-300" :
                    loggedInClient.level === "钻石卡会员" ? "bg-purple-500/30 text-purple-300" :
                    "bg-gray-500/30 text-gray-300"
                  }`}>
                    {loggedInClient.level}
                  </span>
                )}
              </div>
              {loggedInClient.level !== "钻石卡会员" && (
                <button
                  onClick={() => setShowMemberModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-white"
                  style={{ backgroundColor: THEME.ACCENT }}
                >
                  开通会员
                </button>
              )}
              <button
                onClick={() => setLoggedInClient(null)}
                className="px-3 py-1.5 border border-white/30 hover:border-white/60 rounded-lg text-xs font-bold transition-colors text-white/80 hover:text-white"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setShowLoginModal(true); setAuthError(""); setAuthPhone(""); setAuthPassword(""); }}
                className="px-4 py-1.5 border border-white/40 rounded text-sm font-medium transition-all text-white"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.PRIMARY; (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.PRIMARY; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.4)"; }}
              >
                登录
              </button>
              <button
                onClick={() => { setShowRegisterModal(true); setAuthError(""); setAuthName(""); setAuthPhone(""); setAuthPassword(""); }}
                className="px-4 py-1.5 rounded text-sm font-medium transition-all text-white"
                style={{ backgroundColor: THEME.PRIMARY }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.PRIMARY_DARK; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.PRIMARY; }}
              >
                注册
              </button>
            </>
          )
        }
      />

      {/* 通知公告栏 — 导航栏下方，动态滚动 */}
      <div className="text-white/90 overflow-hidden py-2 relative z-10" style={{ background: `linear-gradient(to right, ${THEME.PRIMARY_DARK}, ${THEME.PRIMARY})` }}>
        <div className="animate-marquee text-[13px] tracking-[2px] inline-block">
          🐾 新客首单洗护立减20元 · 寄养3天以上送零食大礼包 · 会员专享折扣，黄金卡9折钻石卡8折 🌿&nbsp;&nbsp;&nbsp;&nbsp;
          🐾 新客首单洗护立减20元 · 寄养3天以上送零食大礼包 · 会员专享折扣，黄金卡9折钻石卡8折 🌿
        </div>
      </div>

      <main className="max-w-2xl mx-auto py-10 px-4 relative z-10">
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-[#333333] mb-3 tracking-tight">
            为爱宠预约一份 <span style={{ color: THEME.PRIMARY }}>精致洗护</span>
          </h2>
          <p className="text-[#999999] text-lg">选择最适合它的服务，开启焕新之旅</p>
        </div>

        {/* Progress indicator */}
        {step <= 5 && (
          <div className="flex items-center justify-center gap-0 max-w-lg mx-auto mb-12">
            {[1, 2, 3, 4, 5].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    step >= s
                      ? "text-white shadow-lg"
                      : "bg-gray-100 text-[#999999]"
                  }`}
                  style={step >= s ? { background: `linear-gradient(to bottom right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})`, boxShadow: `0 10px 15px -3px ${THEME.PRIMARY}26` } : undefined}
                  >
                    {step > s ? "✓" : s}
                  </div>
                  <span className={`text-[10px] mt-2 font-bold transition-colors duration-300`}
                    style={{ color: step >= s ? THEME.PRIMARY : "#999999" }}
                  >
                    {["选择项目", "填写信息", "预约时间", "确认订单", "扫码支付"][i]}
                  </span>
                </div>
                {i < 4 && (
                  <div className="flex-1 h-0.5 mx-1.5 rounded-full mb-6 overflow-hidden bg-gray-100">
                    <div
                      className="h-full transition-all duration-700 ease-in-out"
                      style={{ background: `linear-gradient(to right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})`, width: step > s ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Step 1: Service & Product selection */}
        {step === 1 && (
          <div className="step-card space-y-8">
            {/* Services Section */}
            <div>
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-[#333333]">选择洗护服务</h3>
                <p className="text-[#999999] text-sm">可多选，满足宝贝多样需求</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => toggleService(svc.name)}
                    className={`group relative rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
                      selectedServices.includes(svc.name)
                        ? "ring-2 ring-offset-2 shadow-xl bg-white/90 backdrop-blur-sm"
                        : "bg-white/70 backdrop-blur-sm shadow-md shadow-black/5 hover:shadow-xl border border-white/60"
                    }`}>
                    {selectedServices.includes(svc.name) && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center animate-checkPop" style={{ backgroundColor: THEME.PRIMARY }}>
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    <div className="w-16 h-16 rounded-xl mb-3 bg-gray-50 overflow-hidden">
                      <img
                        src={SERVICE_ICONS[svc.category] || SERVICE_ICONS["洗护"]}
                        alt={svc.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <h4 className="font-bold text-[#333333] text-lg">{svc.name}</h4>
                    <p className="text-sm text-[#999999] mt-1">时长：{svc.duration}分钟</p>
                    <p className="font-bold text-2xl mt-2" style={{ color: THEME.PRIMARY }}>
                      ￥{svc.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Products Section */}
            {inventory.length > 0 && (
              <div>
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-[#333333]">选购宠物用品</h3>
                <p className="text-[#999999] text-sm">精选好物，到店自取随服务带走</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inventory.map(item => {
                    const qty = selectedProducts[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-4 flex items-center justify-between transition-all backdrop-blur-sm ${
                          qty > 0 ? "ring-2 ring-offset-1 shadow-xl bg-white/90" : "bg-white/70 shadow-md shadow-black/5 border border-white/60"
                        }`}
                        style={qty > 0 ? { ["--tw-ring-color" as string]: THEME.PRIMARY } : undefined}
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-[#333333] text-sm">{item.name}</h4>
                          <p className="text-xs text-[#999999] mt-0.5">{item.category} · {item.stock}{item.unit}库存</p>
                          {item.stock <= 3 && item.stock > 0 && (
                            <p className="text-red-500 text-xs font-bold mt-0.5">仅剩{item.stock}件</p>
                          )}
                          <p className="font-bold text-lg mt-1" style={{ color: THEME.PRIMARY }}>￥{item.price}<span className="text-xs text-[#999999] font-normal">/{item.unit}</span></p>
                        </div>
                        <div className="flex items-center gap-3">
                          {qty > 0 && (
                            <button
                              onClick={() => updateProductQty(item.id, -1)}
                              className="w-8 h-8 rounded-full font-bold text-lg flex items-center justify-center transition-colors"
                            style={{ backgroundColor: THEME.PRIMARY_LIGHT, color: THEME.PRIMARY_DARK }}
                            >
                              -
                            </button>
                          )}
                          {qty > 0 && (
                            <span className="font-bold text-[#333333] w-6 text-center">{qty}</span>
                          )}
                          <button
                            onClick={() => updateProductQty(item.id, 1)}
                            disabled={qty >= item.stock}
                            className="w-8 h-8 rounded-full text-white font-bold text-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ backgroundColor: THEME.PRIMARY }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selection Summary */}
            {hasSelection && (
              <div className="bg-[#f0f4fa] rounded-2xl p-4 border border-[#b3ccff] text-center">
                <span className="text-sm font-bold" style={{ color: THEME.PRIMARY_DARK }}>
                  已选 {selectedServices.length} 项服务
                  {Object.keys(selectedProducts).length > 0 && ` + ${(Object.values(selectedProducts) as number[]).reduce((a, b) => a + b, 0)} 件商品`}
                  ，合计 <span className="text-xl">￥{totalPrice}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Pet & Owner Info */}
        {step === 2 && (
          <div className="step-card space-y-8">
            {/* Pet type selector */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#333333] mb-4">请选择您的宠物类型</h3>
              <div className="flex justify-center gap-5">
                {Object.entries(PET_TYPE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setPetType(key)}
                    className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${
                      petType === key
                        ? "text-white shadow-lg scale-105"
                        : "bg-white text-[#666666] shadow-sm hover:shadow-md"
                    }`}
                    style={petType === key ? { backgroundColor: THEME.PRIMARY, boxShadow: `0 10px 15px -3px ${THEME.PRIMARY}33` } : undefined}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden mb-2">
                      <img src={PET_TYPE_ICONS[key]} alt={label} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pet info */}
            <div>
              <h3 className="text-xl font-bold text-[#333333] mb-1 flex items-center gap-2">
                🐾 宠物信息
              </h3>
              <p className="text-[#999999] text-sm mb-4">请如实填写，以便我们提供更好的洗护方案</p>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-black/5 border border-white/80 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#333333] font-bold text-sm mb-1.5">宠物昵称 *</label>
                    <input
                      type="text"
                      value={petName}
                      onChange={e => setPetName(e.target.value)}
                      placeholder="例如：旺财"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#333333] font-bold text-sm mb-1.5">品种</label>
                    <input
                      type="text"
                      value={petBreed}
                      onChange={e => setPetBreed(e.target.value)}
                      placeholder="例如：金毛寻回犬"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#333333] font-bold text-sm mb-1.5">年龄</label>
                    <input
                      type="text"
                      value={petAge}
                      onChange={e => setPetAge(e.target.value)}
                      placeholder="例如：3岁"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#333333] font-bold text-sm mb-1.5">体重</label>
                    <input
                      type="text"
                      value={petWeight}
                      onChange={e => setPetWeight(e.target.value)}
                      placeholder="例如：15kg"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#333333] font-bold text-sm mb-1.5">特殊情况/过敏/备注</label>
                  <textarea
                    value={petNote}
                    onChange={e => setPetNote(e.target.value)}
                    placeholder="例如：皮肤敏感、对某种香波过敏、第一次洗澡比较紧张等..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Owner info */}
            <div>
              <h3 className="text-xl font-bold text-[#333333] mb-1 flex items-center gap-2">
                👤 主人信息
              </h3>
              <p className="text-[#999999] text-sm mb-4">
                {loggedInClient ? "已自动填充您的注册信息" : "用于接收预约确认和服务进度通知"}
              </p>
              {loggedInClient ? (
                <div className="bg-[#f0f4fa] rounded-2xl p-6 border border-[#b3ccff] space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold" style={{ color: THEME.PRIMARY }}>✓ 已登录</span>
                    <span className="text-xs text-[#666666]">以下信息已自动填充</span>
                  </div>
                  <p className="text-sm text-[#333333]"><span className="font-bold">姓名：</span>{loggedInClient.name}</p>
                  <p className="text-sm text-[#333333]"><span className="font-bold">手机号：</span>{loggedInClient.phone}</p>
                  <p className="text-sm text-[#333333]"><span className="font-bold">微信：</span>{loggedInClient.wechat || "未填写"}</p>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-black/5 border border-white/80 space-y-4">
                  <div>
                    <label className="block text-[#333333] font-bold text-sm mb-1.5">您的姓名 *</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="请输入您的姓名"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#333333] font-bold text-sm mb-1.5">手机号码 *</label>
                    <input
                      type="tel"
                      value={ownerPhone}
                      onChange={e => setOwnerPhone(e.target.value)}
                      placeholder="请输入手机号"
                      maxLength={11}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#333333] font-bold text-sm mb-1.5">微信号（可选）</label>
                    <input
                      type="text"
                      value={ownerWechat}
                      onChange={e => setOwnerWechat(e.target.value)}
                      placeholder="方便我们发送洗护前后对比照"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
                  />
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Calendar & Time */}
        {step === 3 && (
          <div className="step-card space-y-8">
            <div>
              <h3 className="text-xl font-bold text-[#333333] mb-1">📅 选择预约日期</h3>
              <p className="text-[#999999] text-sm mb-4">请选择您方便到店的时间</p>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-black/5 border border-white/80">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center transition-all"
                    style={{ ["--hover-bg" as string]: THEME.PRIMARY }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.PRIMARY; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""; (e.currentTarget as HTMLButtonElement).style.color = ""; }}>
                    <span className="text-lg">&lt;</span>
                  </button>
                  <h4 className="font-bold text-[#333333] text-lg">{year}年 {month + 1}月</h4>
                  <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center transition-all"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = THEME.PRIMARY; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""; (e.currentTarget as HTMLButtonElement).style.color = ""; }}>
                    <span className="text-lg">&gt;</span>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {WEEKDAYS.map(d => (
                    <div key={d} className="py-2 text-[#999999] font-medium text-xs">{d}</div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const disabled = isDateDisabled(day);
                    const selected = isDateSelected(day);
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    return (
                      <button
                        key={day}
                        disabled={disabled}
                        onClick={() => setSelectedDate(day)}
                        className={`p-2 rounded-xl transition-all font-medium text-sm ${
                          selected
                            ? "text-white shadow-md"
                            : disabled
                              ? "text-gray-300 cursor-not-allowed"
                              : isToday
                                ? "font-bold"
                                : "text-[#666666] hover:bg-[#f0f4fa]"
                        }`}
                        style={
                          selected ? { backgroundColor: THEME.PRIMARY, boxShadow: `0 4px 6px -1px ${THEME.PRIMARY}33` } :
                          isToday ? { color: THEME.PRIMARY } : undefined
                        }
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#333333] mb-1">⏰ 选择时间段</h3>
              <p className="text-[#999999] text-sm mb-4">高峰期热门时段可能需要排队</p>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-black/5 border border-white/80 grid grid-cols-3 md:grid-cols-5 gap-3">
                {TIME_SLOTS.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      selectedTime === time
                        ? "text-white shadow-md"
                        : "bg-gray-50 text-[#666666] hover:bg-[#f0f4fa]"
                    }`}
                    style={selectedTime === time ? { backgroundColor: THEME.PRIMARY, boxShadow: `0 4px 6px -1px ${THEME.PRIMARY}33` } : undefined}
                    onMouseEnter={(e) => { if (selectedTime !== time) { (e.currentTarget as HTMLButtonElement).style.color = THEME.PRIMARY; } }}
                    onMouseLeave={(e) => { if (selectedTime !== time) { (e.currentTarget as HTMLButtonElement).style.color = "#666666"; } }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="step-card space-y-6">
            <div className="text-center mb-2">
              <h3 className="text-2xl font-bold text-[#333333]">确认您的预订信息</h3>
              <p className="text-[#999999] text-sm">请仔细核对以下信息</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-black/5 border border-white/80 space-y-4">
              {/* Services */}
              {selectedServices.length > 0 && (
                <div>
                  <h4 className="font-bold mb-2 flex items-center gap-2" style={{ color: THEME.PRIMARY }}>✨ 已选服务</h4>
                  <div className="space-y-2">
                    {services.filter(s => selectedServices.includes(s.name)).map(svc => (
                      <div key={svc.id} className="flex justify-between text-sm">
                        <span className="text-[#666666]">{svc.name}</span>
                        <span className="font-bold" style={{ color: THEME.PRIMARY }}>￥{svc.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {Object.keys(selectedProducts).length > 0 && (
                <div>
                  {selectedServices.length > 0 && <div className="h-px bg-gray-100" />}
                  <h4 className="font-bold mb-2 flex items-center gap-2" style={{ color: THEME.PRIMARY }}>🛒 已选商品</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedProducts).map(([id, qty]) => {
                      const item = inventory.find(i => i.id === id);
                      if (!item) return null;
                      return (
                        <div key={id} className="flex justify-between text-sm">
                          <span className="text-[#666666]">{item.name} × {qty}</span>
                          <span className="font-bold" style={{ color: THEME.PRIMARY }}>￥{item.price * (qty as number)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100" />

              {/* Pet Info */}
              <div>
                <h4 className="font-bold mb-2 flex items-center gap-2" style={{ color: THEME.PRIMARY }}>🐾 宠物信息</h4>
                <p className="text-sm text-[#666666]">
                  {PET_TYPE_LABELS[petType]} - {petName} ({petBreed || "未知品种"})<br />
                  年龄：{petAge || "未填写"}　体重：{petWeight || "未填写"}<br />
                  备注：{petNote || "无"}
                </p>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Owner Info */}
              <div>
                <h4 className="font-bold mb-2 flex items-center gap-2" style={{ color: THEME.PRIMARY }}>👤 主人信息</h4>
                <p className="text-sm text-[#666666]">
                  姓名：{ownerName}　电话：{ownerPhone}<br />
                  微信：{ownerWechat || "未填写"}
                </p>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Time */}
              <div>
                <h4 className="font-bold mb-2 flex items-center gap-2" style={{ color: THEME.PRIMARY }}>📅 预约时间</h4>
                <p className="text-[#333333] font-bold">{formatDate()} {selectedTime}</p>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Total */}
              {discount < 1 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#666666]">会员折扣 ({Math.round(discount * 100) / 10}折)</span>
                    <span className="text-green-500 font-bold">-￥{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#999999]">原价</span>
                    <span className="text-[#999999] line-through">￥{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-[#666666]">应付总额</span>
                <span className="text-3xl font-extrabold" style={{ color: THEME.PRIMARY }}>￥{finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Payment */}
        {step === 5 && (
          <div className="step-card space-y-6">
            <div className="text-center mb-2">
              <h3 className="text-2xl font-bold text-[#333333]">扫码支付</h3>
              <p className="text-[#999999] text-sm">请使用微信或支付宝扫描下方二维码完成支付</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg shadow-black/5 border border-white/80 text-center space-y-5">
              <div className="mx-auto w-56 h-56 rounded-2xl overflow-hidden border-4 border-[#b3ccff] shadow-lg">
                <img src="/qrcode.jpg" alt="支付二维码" className="w-full h-full object-cover" />
              </div>

              <div>
                {discount < 1 && (
                  <div className="mb-2 space-y-1">
                    <p className="text-[#999999] text-sm">原价 <span className="line-through">￥{totalPrice.toFixed(2)}</span></p>
                    <p className="text-green-500 text-sm font-bold">会员优惠 -￥{discountAmount.toFixed(2)}</p>
                  </div>
                )}
                <p className="text-[#999999] text-sm">应付金额</p>
                <p className="text-4xl font-extrabold" style={{ color: THEME.PRIMARY }}>￥{finalPrice.toFixed(2)}</p>
              </div>

              <div className="text-xs text-[#999999] space-y-1">
                <p>支付完成后请点击下方按钮</p>
                <p>订单信息将在确认支付后同步至门店</p>
              </div>

              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="w-full py-4 text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-all disabled:opacity-50 hover:shadow-lg"
                style={{ background: `linear-gradient(to right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})`, boxShadow: `0 10px 15px -3px ${THEME.PRIMARY}33` }}
              >
                {submitting ? "提交中..." : "我已完成支付，确认提交"}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Success */}
        {step === 6 && (
          <div className="step-card text-center py-12 space-y-6">
            <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center animate-checkPop"
              style={{ background: `linear-gradient(to bottom right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})`, boxShadow: `0 20px 25px -5px ${THEME.PRIMARY}33` }}>
              <span className="text-white text-4xl">✓</span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#333333] animate-successSlide">支付成功！</h3>
            <p className="text-[#666666] animate-successSlide" style={{ animationDelay: "0.2s" }}>
              订单已同步至门店，稍后会有专人电话联系确认
            </p>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-black/5 border border-white/80 max-w-sm mx-auto animate-successSlide" style={{ animationDelay: "0.4s" }}>
              <p className="text-sm text-[#999999] mb-1">您的预订编号</p>
              <p className="font-mono text-xl font-extrabold tracking-widest select-all" style={{ color: THEME.PRIMARY }}>{bookingId}</p>
            </div>
            <button
              onClick={resetForm}
              className="px-8 py-3 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform animate-successSlide hover:shadow-lg"
              style={{ background: `linear-gradient(to right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})`, boxShadow: `0 10px 15px -3px ${THEME.PRIMARY}33`, animationDelay: "0.6s" }}
            >
              再次预约
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {step <= 5 && step !== 5 && (
          <div className="flex justify-between mt-10">
            {step > 1 ? (
              <button
                onClick={goBack}
                className="px-6 py-3 text-[#666666] font-bold rounded-xl hover:bg-[#f0f4fa] transition-all hover:shadow-lg"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = THEME.PRIMARY; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#666666"; }}
              >
                ← 上一步
              </button>
            ) : <div />}
            {step < 4 ? (
              <button
                onClick={goNext}
                disabled={
                  (step === 1 && !hasSelection) ||
                  (step === 2 && (!petName || (!loggedInClient && (!ownerName || !ownerPhone)))) ||
                  (step === 3 && (!selectedDate || !selectedTime))
                }
                className="px-10 py-3 text-white rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:shadow-lg"
                style={{ background: `linear-gradient(to right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})`, boxShadow: `0 10px 15px -3px ${THEME.PRIMARY}33` }}
              >
                下一步 →
              </button>
            ) : step === 4 ? (
              <button
                onClick={goNext}
                className="px-10 py-3 text-white rounded-xl font-bold hover:scale-105 transition-all hover:shadow-lg"
                style={{ background: `linear-gradient(to right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})`, boxShadow: `0 10px 15px -3px ${THEME.PRIMARY}33` }}
              >
                去支付 →
              </button>
            ) : null}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer variant="light" />

      {/* AI Chat Assistant */}
      <AIChat role="CUSTOMER" kbType="customer" />

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl shadow-black/15 border border-white/80">
            <h3 className="text-xl font-bold text-[#333333] mb-4">注册账号</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="姓名"
                value={authName}
                onChange={e => setAuthName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
              />
              <input
                type="tel"
                placeholder="手机号"
                value={authPhone}
                onChange={e => setAuthPhone(e.target.value)}
                maxLength={11}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
              />
              <input
                type="password"
                placeholder="密码"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
              />
              <input
                type="text"
                placeholder="微信号（可选）"
                value={authWechat}
                onChange={e => setAuthWechat(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
              />
            </div>
            {authError && <p className="text-red-500 text-xs mt-2 font-bold">{authError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRegister}
                disabled={authLoading}
                className="flex-1 py-3 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:shadow-lg transition-all"
                style={{ background: `linear-gradient(to right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})` }}
              >
                {authLoading ? "注册中..." : "注册"}
              </button>
              <button
                onClick={() => { setShowRegisterModal(false); setAuthError(""); }}
                className="flex-1 py-3 bg-gray-100 text-[#666666] rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
            <p className="text-center text-xs text-[#999999] mt-3">
              已有账号？<button onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); setAuthError(""); setAuthPhone(""); setAuthPassword(""); }} className="font-bold" style={{ color: THEME.PRIMARY }}>去登录</button>
            </p>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl shadow-black/15 border border-white/80">
            <h3 className="text-xl font-bold text-[#333333] mb-4">登录</h3>
            <div className="space-y-3">
              <input
                type="tel"
                placeholder="手机号"
                value={authPhone}
                onChange={e => setAuthPhone(e.target.value)}
                maxLength={11}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
              />
              <input
                type="password"
                placeholder="密码"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#165DFF] focus:bg-white outline-none transition-all text-sm"
              />
            </div>
            {authError && <p className="text-red-500 text-xs mt-2 font-bold">{authError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleLogin}
                disabled={authLoading}
                className="flex-1 py-3 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:shadow-lg transition-all"
                style={{ background: `linear-gradient(to right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})` }}
              >
                {authLoading ? "登录中..." : "登录"}
              </button>
              <button
                onClick={() => { setShowLoginModal(false); setAuthError(""); }}
                className="flex-1 py-3 bg-gray-100 text-[#666666] rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
            <p className="text-center text-xs text-[#999999] mt-3">
              没有账号？<button onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); setAuthError(""); setAuthName(""); setAuthPhone(""); setAuthPassword(""); }} className="font-bold" style={{ color: THEME.PRIMARY }}>去注册</button>
            </p>
          </div>
        </div>
      )}

      {/* Member Purchase Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl shadow-black/15 border border-white/80">
            <h3 className="text-xl font-bold text-[#333333] mb-4 text-center">开通会员</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-2 border-green-200 rounded-2xl p-4 text-center bg-green-50/30">
                <h4 className="font-bold text-green-600 text-sm">普通会员</h4>
                <p className="text-2xl font-extrabold text-green-600 mt-2">￥99<span className="text-xs font-normal">/年</span></p>
                <p className="text-xs text-green-500 mt-1">9.5折</p>
                <button
                  onClick={() => handleMemberUpgrade("普通会员")}
                  className="w-full mt-3 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors"
                >
                  立即开通
                </button>
              </div>
              <div className="border-2 border-yellow-300 rounded-2xl p-4 text-center bg-yellow-50/30">
                <h4 className="font-bold text-yellow-600 text-sm">黄金卡会员</h4>
                <p className="text-2xl font-extrabold text-yellow-600 mt-2">￥299<span className="text-xs font-normal">/年</span></p>
                <p className="text-xs text-yellow-500 mt-1">9折</p>
                <button
                  onClick={() => handleMemberUpgrade("黄金卡会员")}
                  className="w-full mt-3 py-2 bg-yellow-500 text-white rounded-xl font-bold text-sm hover:bg-yellow-600 transition-colors"
                >
                  立即开通
                </button>
              </div>
              <div className="border-2 border-purple-200 rounded-2xl p-4 text-center bg-purple-50/30">
                <h4 className="font-bold text-purple-600 text-sm">钻石卡会员</h4>
                <p className="text-2xl font-extrabold text-purple-600 mt-2">￥599<span className="text-xs font-normal">/年</span></p>
                <p className="text-xs text-purple-500 mt-1">8折</p>
                <button
                  onClick={() => handleMemberUpgrade("钻石卡会员")}
                  className="w-full mt-3 py-2 bg-purple-500 text-white rounded-xl font-bold text-sm hover:bg-purple-600 transition-colors"
                >
                  立即开通
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowMemberModal(false)}
              className="w-full mt-4 py-2 bg-gray-100 text-[#666666] rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Member Pay Confirmation Modal */}
      {showMemberPayModal && selectedMemberLevel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl shadow-black/15 border border-white/80 text-center">
            <h3 className="text-xl font-bold text-[#333333] mb-2">会员支付</h3>
            <p className="text-[#666666] text-sm mb-4">
              {selectedMemberLevel} - ￥{MEMBER_PRICES[selectedMemberLevel]}/年
            </p>
            <div className="mx-auto w-48 h-48 rounded-2xl overflow-hidden border-4 border-[#b3ccff] shadow-lg mb-4">
              <img src="/qrcode.jpg" alt="支付二维码" className="w-full h-full object-cover" />
            </div>
            <p className="text-2xl font-extrabold mb-4" style={{ color: THEME.PRIMARY }}>￥{MEMBER_PRICES[selectedMemberLevel]}</p>
            <button
              onClick={confirmMemberUpgrade}
              disabled={submitting}
              className="w-full py-3 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:shadow-lg transition-all"
              style={{ background: `linear-gradient(to right, ${THEME.PRIMARY}, ${THEME.PRIMARY_DARK})` }}
            >
              {submitting ? "确认中..." : "我已完成支付，确认开通"}
            </button>
            <button
              onClick={() => { setShowMemberPayModal(false); setSelectedMemberLevel(null); }}
              className="w-full mt-2 py-2 text-[#999999] text-sm font-bold hover:text-[#666666] transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
