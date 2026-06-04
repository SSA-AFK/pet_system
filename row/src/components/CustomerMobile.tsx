import React, { useState, useRef } from "react";
import { Pet, Appointment, Client, ServiceItem } from "../types";
import { Sparkles, Calendar, Heart, Award, CreditCard, ChevronRight, MessageSquare, ShieldCheck, Activity, PlusCircle } from "lucide-react";

interface CustomerMobileProps {
  pets: Pet[];
  appointments: Appointment[];
  services: ServiceItem[];
  clients: Client[];
  currentUserPhone: string;
  onAddAppointment: (newApp: any) => void;
}

export default function CustomerMobile({
  pets,
  appointments,
  services,
  clients,
  currentUserPhone,
  onAddAppointment
}: CustomerMobileProps) {
  // Let's pretend current logged-in client is "陈女士" (C001, phone 13800138000)
  const currentClient = clients.find(c => c.phone === currentUserPhone) || clients[0];
  const myPets = pets.filter(p => p.ownerPhone === currentUserPhone);
  const myAppointments = appointments.filter(a => a.clientPhone === currentUserPhone);

  // New Booking State
  const [selectedPet, setSelectedPet] = useState(myPets[0]?.name || "麦兜");
  const [selectedService, setSelectedService] = useState(services[0]?.name || "日系棉花糖精修造型-小型犬");
  const [bookDate, setBookDate] = useState("2026-06-03");
  const [bookTime, setBookTime] = useState("14:30");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // AI Health Check State
  const [currentSymptom, setCurrentSymptom] = useState("最近频繁用爪子挠耳朵，有黑褐色分泌物，食欲有点不好。");
  const [selectedTopic, setSelectedTopic] = useState("耳螨与细菌耳炎");
  const [diagnosticResult, setDiagnosticResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  
  // Real image upload state
  const [uploadedPhotoLabel, setUploadedPhotoLabel] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoBase64(result);
      setPhotoPreview(result);
      setUploadedPhotoLabel(file.name);
      setDiagnosticResult("");
    };
    reader.readAsDataURL(file);
  };

  // Floating AI Assistant States
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([
    { sender: "ai", text: "👋 亲爱的萌宠家长您好！我是您的智能客服AI。我已经为您打通了我们本店专属的【宠物健康日常答疑与会员 FAQ 手册】。关于我们店各级会员卡使用折扣规则、服务预约取消流程、或是宝贝耳道红斑甩头等日常居家护理建议，都可以向我提问哟！🐾", time: "09:41" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const sendMsg = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    setChatMessages(prev => [...prev, { sender: "user", text: textToSend, time: new Date().toTimeString().substring(0, 5) }]);
    if (!presetText) setChatInput("");
    setChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "CUSTOMER",
          message: textToSend,
          history
        })
      });
      const d = await res.json();
      setChatMessages(prev => [...prev, { sender: "ai", text: d.content || "客服助理忙碌中，请稍后再试", time: new Date().toTimeString().substring(0, 5) }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: "ai", text: "🚨 无法建立客服连接，请过会儿重试。", time: new Date().toTimeString().substring(0, 5) }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceObj = services.find(s => s.name === selectedService);
    const newApp: any = {
      id: "A" + Math.floor(100 + Math.random() * 900),
      petName: selectedPet,
      clientName: currentClient.name,
      clientPhone: currentClient.phone,
      serviceName: selectedService,
      groomerName: "阿明 (等候安排)",
      dateTime: `${bookDate} ${bookTime}`,
      status: "pending",
      price: serviceObj ? serviceObj.price : 120,
      progressNotes: "小程序自动下单，尚未指派技师。"
    };

    onAddAppointment(newApp);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  const startAiConsult = async () => {
    setAiLoading(true);
    setDiagnosticResult("");
    try {
      const response = await fetch("/api/gemini/pet-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petBrief: `${selectedPet} (${myPets.find(p => p.name === selectedPet)?.breed || "宠物"})`,
          symptom: currentSymptom,
          imageBase64: photoBase64 || "" 
        })
      });
      const data = await response.json();
      setDiagnosticResult(data.content);
    } catch (e) {
      setDiagnosticResult("智能宠物健康助理咨询超时，请稍后重试。");
    } finally {
      setAiLoading(false);
    }
  };

  // Quick symptom setups
  const applyQuickSymptom = (topic: string, phrase: string) => {
    setSelectedTopic(topic);
    setCurrentSymptom(phrase);
    setDiagnosticResult("");
  };

  return (
    <div className="bg-slate-50 min-h-full pb-20 flex flex-col font-sans">
      {/* Dynamic MiniProgram top card */}
      <div className="bg-gradient-to-tr from-pink-400 via-rose-450 to-orange-400 text-white px-4 pt-6 pb-6 rounded-b-[2rem] shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={currentClient.avatar} className="w-10 h-10 rounded-full border border-white/40" alt="avatar" />
            <div>
              <h1 className="text-sm font-extrabold flex items-center gap-1">
                {currentClient.name}
                <span className="text-[9px] bg-yellow-400 text-yellow-950 px-1.5 py-0.5 rounded-md font-bold">
                  {currentClient.level}
                </span>
              </h1>
              <p className="text-[10px] text-pink-100 font-mono">138-0013-8000 | 智能优选会员</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[11px] font-bold text-yellow-300">★ 尊享8.8折优惠</span>
          </div>
        </div>

        {/* Dynamic Member VIP Card with cute glassmorphism details */}
        <div className="mt-4 bg-gradient-to-r from-orange-500/80 to-pink-500/80 backdrop-blur-md rounded-2xl p-4 text-white hover:shadow-lg transition-all border border-white/20 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
            <Award size={100} />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[9px] uppercase font-bold tracking-wider opacity-85">ACCOUNT BALANCE</div>
              <div className="text-2xl font-extrabold mt-0.5 font-mono">￥{currentClient.balance.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase font-bold tracking-wider opacity-85 text-yellow-200">BONUS POINTS</div>
              <div className="text-lg font-extrabold mt-0.5 font-mono text-yellow-300">{currentClient.points} <span className="text-[10px]">分</span></div>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center text-[10px] text-orange-100 pt-2 border-t border-white/10">
            <span>VIP卡号: 889912040</span>
            <span>已加入此宠店共五个月</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-5 flex-1">
        {/* Section 1: My Pets */}
        <div>
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest mb-2.5 flex items-center gap-1">
            <Heart size={13} className="text-pink-500 fill-pink-500" />
            我的宠物档案 ({myPets.length}只)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {myPets.map((pet) => {
              const currentGroomingApp = appointments.find(a => a.petName === pet.name && a.status === "processing");
              return (
                <div key={pet.id} className="bg-white rounded-2xl p-3 border border-slate-150 shadow-sm relative overflow-hidden">
                  {/* Status Indicator */}
                  {currentGroomingApp && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg animate-pulse">
                      洗护中
                    </div>
                  )}
                  <div className="flex gap-2">
                    <img src={pet.avatar} className="w-10 h-10 rounded-xl object-cover" alt="avatar" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">{pet.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">{pet.breed}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-slate-500 font-mono flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span>年龄: {pet.age}</span>
                    <span className="text-pink-500">正常状态</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: AI Health Assistant */}
        <div className="bg-gradient-to-tr from-pink-50 via-rose-50/50 to-orange-50/40 rounded-2xl p-4 border border-pink-200">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-pink-600 bg-pink-100/50 rounded-md border border-pink-200 flex items-center gap-1">
              <Sparkles size={11} className="fill-pink-200" />
              AI 宠物健康顾问
            </span>
            <span className="text-[10px] text-slate-400 font-mono">多维度精准诊疗</span>
          </div>

          <p className="text-[11px] text-slate-600 mb-3.5">
            输入症状或使用下方快捷推荐，可自动生成科学耳道、皮肤、体内外综合护理指南：
          </p>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <button
              onClick={() => applyQuickSymptom("耳螨感染", "频繁用爪子挠耳道，耳朵内部有黑咖啡色泥状分泌物，有强烈酸臭味。")}
              className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${
                selectedTopic === "耳螨感染"
                  ? "bg-pink-500 border-pink-500 text-white font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              👂 挠耳黑褐色污垢
            </button>
            <button
              onClick={() => applyQuickSymptom("皮肤红疹", "下肚子和腿内侧长了芝麻粒般的新鲜红疹，有些皮肤脱屑，抓挠严重。")}
              className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${
                selectedTopic === "皮肤红疹"
                  ? "bg-pink-500 border-pink-500 text-white font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              🐕 下腹红斑瘙痒
            </button>
            <button
              onClick={() => applyQuickSymptom("眼分泌物", "眼睛周围泪痕发红发黑，有粘稠的眼屎，频繁眨眼、流泪。")}
              className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${
                selectedTopic === "眼分泌物"
                  ? "bg-pink-500 border-pink-500 text-white font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              👁 泪痕多/粘稠眼垢
            </button>
          </div>

          {/* Symptom Input Details */}
          <textarea
            rows={2}
            value={currentSymptom}
            onChange={(e) => setCurrentSymptom(e.target.value)}
            placeholder="请细致撰写宠物的患处变化或精神症状，便于AI做出严谨判定。"
            className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all"
          />

          {/* Hidden file input for camera/gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {/* Photo attach controller */}
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (uploadedPhotoLabel) {
                    setUploadedPhotoLabel(null);
                    setPhotoPreview(null);
                    setPhotoBase64("");
                    setDiagnosticResult("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all ${
                  uploadedPhotoLabel
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                📸 {uploadedPhotoLabel ? "已检测病灶(1张)" : "拍照识别"}
              </button>
              {uploadedPhotoLabel && (
                <span className="text-[10px] text-emerald-600 font-medium">已激活视觉分析</span>
              )}
            </div>

            <button
              onClick={startAiConsult}
              disabled={aiLoading}
              className="py-1 px-4 bg-gradient-to-r from-orange-450 to-pink-500 text-white rounded-lg text-xs font-bold hover:shadow-md transition-all flex items-center gap-1 disabled:opacity-40"
            >
              {aiLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>AI 问诊分析</>
              )}
            </button>
          </div>

          {/* Photo preview */}
          {photoPreview && (
            <div className="mt-2 flex items-center gap-2">
              <img src={photoPreview} alt="预览" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
              <span className="text-[10px] text-slate-500">{uploadedPhotoLabel}</span>
            </div>
          )}

          {/* Diagnostic results */}
          {diagnosticResult && (
            <div className="mt-4 bg-white/95 p-3.5 rounded-2xl border border-pink-100/60 shadow-sm text-xs font-sans text-slate-700 max-h-60 overflow-y-auto scrollbar-thin">
              <div className="space-y-3 prose max-w-none text-[11px] leading-relaxed">
                {diagnosticResult.split("\n").map((line, idx) => {
                  if (line.startsWith("###") || line.startsWith("##")) {
                    return <h4 key={idx} className="font-extrabold text-pink-600 mt-3 pt-1 border-b border-pink-50">{line.replace(/#*/g, "")}</h4>;
                  }
                  if (line.startsWith("-")) {
                    return <p key={idx} className="pl-2 border-l-2 border-rose-200">{line}</p>;
                  }
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Online Booking Form */}
        <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
              <Calendar size={13} className="text-orange-500" />
              极速预约洗护造型 (Online Booking)
            </h3>
          </div>
          
          <form onSubmit={handleBook} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-400 font-bold mb-1">选择预约宠物</label>
                <select
                  value={selectedPet}
                  onChange={(e) => setSelectedPet(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
                >
                  {myPets.map(p => <option key={p.id} value={p.name}>{p.name} ({p.breed})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">选择服务项目</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
                >
                  {services.map(s => <option key={s.id} value={s.name}>{s.name} - ￥{s.price}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-400 font-bold mb-1">选择到店日期</label>
                <input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">期望时间点</label>
                <input
                  type="time"
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                />
              </div>
            </div>

            {bookingSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] rounded-lg flex items-center gap-1.5 border border-emerald-100">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>恭喜您，店主已接受并生成此预约（指派为阿明等候服务中）！</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
            >
              提交线上预约清单
            </button>
          </form>
        </div>

        {/* Section 4: Booking and Order records */}
        <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
            <Activity size={13} className="text-indigo-500" />
            消费单与服务动态明细
          </h3>
          <div className="space-y-2">
            {myAppointments.map((app) => {
              return (
                <div key={app.id} className="p-3 bg-slate-55/65 hover:bg-slate-50 rounded-xl text-xs border border-slate-100 flex justify-between items-start">
                  <div>
                    <div className="font-extrabold text-slate-700">{app.petName} - {app.serviceName}</div>
                    <div className="text-[10px] text-slate-400 mt-1">预约时间：{app.dateTime}</div>
                    {app.progressNotes && (
                      <div className="text-[10px] text-indigo-600 bg-indigo-50/50 p-1.5 rounded-lg mt-1.5 border border-indigo-100/50">
                        {app.progressNotes}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-extrabold text-slate-700">￥{app.price}</span>
                    <div className="mt-1">
                      {app.status === "processing" && (
                        <span className="px-1.5 py-0.5 text-[8px] bg-blue-100 text-blue-800 rounded-md">洗护中</span>
                      )}
                      {app.status === "completed" && (
                        <span className="px-1.5 py-0.5 text-[8px] bg-emerald-100 text-emerald-800 rounded-md">已结算</span>
                      )}
                      {app.status === "pending" && (
                        <span className="px-1.5 py-0.5 text-[8px] bg-amber-100 text-amber-800 rounded-md">待接驳</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating AI Assistant bubble for Customers */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setShowAiChat(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all text-sm font-bold relative animate-bounce"
        >
          <Sparkles size={20} className="text-yellow-300" />
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-full text-[8.5px] px-1.5 font-bold">FAQ</span>
        </button>
      </div>

      {/* Custom Slider Drawer */}
      {showAiChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50">
          <div className="bg-slate-950 text-white w-full max-w-sm rounded-t-3xl p-5 space-y-4 animate-slide-up flex flex-col h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                  <Sparkles size={14} className="text-orange-400 animate-pulse animate-duration-1000" />
                  萌宠管家 AI 客服咨询 (FAQ)
                </h3>
              </div>
              <button onClick={() => setShowAiChat(false)} className="text-slate-400 hover:text-white text-xs border border-slate-800 px-2.5 py-1 rounded-lg">关闭</button>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 text-xs">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className="text-[9px] text-slate-500 mb-0.5 flex items-center gap-1 font-mono">
                    <span>{m.time}</span>
                    <span className={m.sender === "user" ? "text-orange-400" : "text-yellow-400"}>
                      {m.sender === "user" ? "顾客 (您)" : "萌宠管家AI组"}
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                    m.sender === "user" ? "bg-orange-500 text-white rounded-tr-none" : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-start flex-col">
                  <span className="text-[9px] text-yellow-400 font-bold mb-1 animate-pulse">正在梳理您的健康/会费疑问...</span>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-500 font-bold">🐶 会员常见问题极速问询：</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                <button
                  onClick={() => sendMsg("狗狗耳朵经常频繁甩、挠，还掏出黑褐色泥垢怎么办？")}
                  disabled={chatLoading}
                  className="bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 text-[10px] rounded-lg border border-slate-700/50 whitespace-nowrap active:scale-95 transition-all"
                >
                  👂 耳朵黑褐分泌物处理
                </button>
                <button
                  onClick={() => sendMsg("我们到店洗护美容，钻石会员和黄金会员分别打几折呀？")}
                  disabled={chatLoading}
                  className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 text-[10px] rounded-lg border border-slate-700/50 whitespace-nowrap active:scale-95 transition-all"
                >
                  💳 会员卡余额与优惠
                </button>
                <button
                  onClick={() => sendMsg("有哪些日常零食水果是猫狗绝对禁止喂食的？")}
                  disabled={chatLoading}
                  className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 text-[10px] rounded-lg border border-slate-700/50 whitespace-nowrap active:scale-95 transition-all"
                >
                  🦴 绝对饮食黑名单
                </button>
              </div>
            </div>

            {/* Input Form */}
            <div className="relative shrink-0 pt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                placeholder="向萌宠管家AI客服提问..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-4 pr-16 py-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-200"
              />
              <button
                onClick={() => sendMsg()}
                disabled={chatLoading || !chatInput.trim()}
                className="absolute right-2 top-2.5 h-9 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
