import React, { useState } from "react";
import { Pet, Appointment, Employee } from "../types";
import { Sparkles, Calendar, Clock, Scissors, Clipboard, ChevronRight, User, ShieldAlert, Check } from "lucide-react";

interface GroomerMobileProps {
  pets: Pet[];
  appointments: Appointment[];
  employees: Employee[];
  currentStaffName: string;
  updatePetStatus: (id: string, status: Pet["status"]) => void;
  updateAppointmentNotes: (id: string, notes: string) => void;
}

export default function GroomerMobile({
  pets,
  appointments,
  employees,
  currentStaffName,
  updatePetStatus,
  updateAppointmentNotes
}: GroomerMobileProps) {
  // Filter appointments for groomer/staff. Let's pretend 阿明 or 丽丽 is currently logged-in
  const filteredAppointments = appointments.filter(
    (app) => app.status !== "cancelled"
  );

  const [selectedApp, setSelectedApp] = useState<Appointment | null>(appointments[0] || null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [personalNote, setPersonalNote] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");

  // AI input customizers
  const [aiSkin, setAiSkin] = useState("皮肤干燥，有微量泪痕");
  const [aiCoat, setAiCoat] = useState("毛发稍有打结，比较毛躁");

  // Floating AI Assistant States
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([
    { sender: "ai", text: "✂️ 您好，专业的美容技师伙伴！我是您的洗护助理。我已经为您对齐了我们最新的【洗护美容与安全实操规程】知识库。遇到任何比熊造型修型、湿疹泡药浴、情绪安抚等实操问题可以随时呼唤我哟！🐾", time: "09:41" }
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
          role: "STAFF_GROOMER",
          message: textToSend,
          history
        })
      });
      const d = await res.json();
      setChatMessages(prev => [...prev, { sender: "ai", text: d.content || "助理稍稍走神了，请再问一次呗", time: new Date().toTimeString().substring(0, 5) }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: "ai", text: "🚨 无法建立云端连接，请过会儿重试。", time: new Date().toTimeString().substring(0, 5) }]);
    } finally {
      setChatLoading(false);
    }
  };

  const myInfo = employees.find(e => e.name.includes("丽丽") || e.name.includes("阿明")) || employees[3];

  const handleUpdateStatus = (status: Pet["status"], appStatus: Appointment["status"]) => {
    if (!selectedApp) return;
    const petObj = pets.find(p => p.name === selectedApp.petName);
    if (petObj) {
      updatePetStatus(petObj.id, status);
    }
    // Update appointment status and note if any
    selectedApp.status = appStatus;
    if (personalNote) {
      updateAppointmentNotes(selectedApp.id, personalNote);
    }
    setShowStatusModal(false);
    setPersonalNote("");
  };

  const triggerGroomingAi = async (petName: string) => {
    const petObj = pets.find(p => p.name === petName);
    if (!petObj) return;

    setAiLoading(true);
    setAiResult("");
    try {
      const response = await fetch("/api/gemini/suggest-grooming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petType: petObj.type === "cat" ? "猫咪" : "犬类",
          breed: petObj.breed,
          age: petObj.age,
          coatType: petObj.type === "dog" ? "卷毛/蓬松" : "短毛",
          skinCondition: aiSkin,
          coatCondition: aiCoat
        })
      });
      const data = await response.json();
      setAiResult(data.content);
    } catch (e) {
      setAiResult("AI洗护方案推荐加载失败，请检查网络或稍后重试。");
    } finally {
      setAiLoading(false);
    }
  };

  const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 rounded-full">待开始</span>;
      case "processing":
        return <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 rounded-full animate-pulse">洗剪中</span>;
      case "completed":
        return <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-800 rounded-full">已完工</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 min-h-full pb-20 flex flex-col font-sans">
      {/* Header Banner representing mobile top */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-4 pt-6 pb-5 rounded-b-[2rem] shadow-md relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm">
              <Scissors size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold">{currentStaffName}</h1>
              <p className="text-[10px] text-orange-100 font-mono">普通店员 | 专属工作小程序</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-semibold tracking-wide border border-white/20">
              今日: {myInfo?.shift || "正常排班"}
            </span>
          </div>
        </div>

        {/* Quick Shift Card */}
        <div className="mt-4 bg-white/95 backdrop-blur shadow-sm rounded-2xl p-3.5 text-slate-800 flex justify-between items-center text-xs">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">今日考勤状态</div>
            <div className="font-bold flex items-center gap-1 mt-0.5 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              已签到 ({myInfo?.attendanceTime || "08:58"})
            </div>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">当月累计业绩</div>
            <div className="text-sm font-extrabold text-indigo-600 mt-0.5">￥{myInfo?.monthlyRevenue || 0}</div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4 flex-1">
        {/* Title */}
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={13} className="text-pink-500" />
            今日预约服务单 ({filteredAppointments.length})
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">左右滑动选择</span>
        </div>

        {/* Appointment Horizontal Scroll Selection */}
        <div className="flex overflow-x-auto pb-2 gap-3 snap-x scrollbar-none">
          {filteredAppointments.map((app) => {
            const isSelected = selectedApp?.id === app.id;
            const petImage = pets.find(p => p.name === app.petName)?.avatar || "";
            return (
              <div
                key={app.id}
                onClick={() => {
                  setSelectedApp(app);
                  setAiResult("");
                }}
                className={`snap-center shrink-0 w-64 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-br from-orange-50/70 to-pink-50/70 border-pink-300 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <div className="flex gap-2">
                    {petImage ? (
                      <img src={petImage} className="w-10 h-10 rounded-xl object-cover border border-slate-200" alt="pet" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        {app.petName}
                        <span className="text-[10px] font-normal text-slate-500">({pets.find(p => p.name === app.petName)?.breed})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{app.serviceName}</div>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    {app.dateTime.split(" ")[1]}
                  </div>
                  <div>客户: {app.clientName}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected app detailed actions */}
        {selectedApp && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800">当前工单处理面板</h3>
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1"
              >
                <Clipboard size={11} />
                更新洗护进度
              </button>
            </div>

            {/* Note & state summary */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">服务要求:</span>
                <span className="text-slate-700 font-bold">{selectedApp.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">预估售价:</span>
                <span className="text-indigo-600 font-mono font-bold">￥{selectedApp.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">当前更新:</span>
                <span className="text-slate-600 font-medium">{selectedApp.progressNotes || "暂无阶段更新"}</span>
              </div>
              <div className="pt-1.5 mt-1.5 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold">宠物健康备忘:</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  {pets.find(p => p.name === selectedApp.petName)?.healthNotes || "健康，无特殊备注。"}
                </div>
              </div>
            </div>

            {/* AI Assistant exclusive container */}
            <div className="pt-2 border-t border-slate-100">
              <div className="bg-gradient-to-tr from-pink-50 to-orange-50 rounded-2xl p-3.5 border border-pink-100/60">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest text-[#d946ef] bg-[#fdf4ff] rounded-md uppercase border border-pink-200 flex items-center gap-1">
                    <Sparkles size={9} />
                    AI 美容洗护助手
                  </span>
                  <button
                    onClick={() => triggerGroomingAi(selectedApp.petName)}
                    disabled={aiLoading}
                    className="px-3 py-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[10px] font-extrabold rounded-lg hover:shadow-md transition-all flex items-center gap-1 disabled:opacity-40"
                  >
                    {aiLoading ? (
                      <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={11} />
                        定制洗护推荐
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mt-2">
                  根据此宠物的品种特点（{pets.find(p => p.name === selectedApp.petName)?.breed}），智能解析香波、SPA配料、造型设计与敏感防范区。
                </p>

                {/* Micro Input customization */}
                <div className="grid grid-cols-2 gap-2 mt-3.5">
                  <div>
                    <label className="text-[9px] text-slate-400 font-semibold">疑似宠物皮肤状况</label>
                    <input
                      type="text"
                      value={aiSkin}
                      onChange={(e) => setAiSkin(e.target.value)}
                      className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-semibold">毛发及结折状况</label>
                    <input
                      type="text"
                      value={aiCoat}
                      onChange={(e) => setAiCoat(e.target.value)}
                      className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700"
                    />
                  </div>
                </div>

                {/* AI Markdown response */}
                {aiResult && (
                  <div className="mt-4 bg-white/90 p-3 rounded-xl border border-pink-100 text-xs text-slate-700 leading-relaxed max-h-56 overflow-y-auto font-sans shadow-inner scrollbar-thin">
                    <div className="prose max-w-none text-[11px] space-y-2">
                      {aiResult.split("\n").map((line, idx) => {
                        if (line.startsWith("###") || line.startsWith("##")) {
                          return <h4 key={idx} className="font-bold text-pink-600 mt-2 pt-1 border-b border-pink-50">{line.replace(/#*/g, "")}</h4>;
                        }
                        if (line.startsWith("-")) {
                          return <p key={idx} className="pl-2 border-l border-orange-200">{line}</p>;
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Client information */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800">全部客户及宠物资料 (限查看)</h3>
          <div className="space-y-2">
            {pets.map((p) => {
              return (
                <div key={p.id} className="flex justify-between items-center bg-slate-50/60 p-2.5 rounded-xl text-xs border border-slate-100">
                  <div className="flex items-center gap-2">
                    <img src={p.avatar} className="w-8 h-8 rounded-lg object-cover" alt="pet" />
                    <div>
                      <div className="font-bold text-slate-700">【{p.name}】{p.breed}</div>
                      <div className="text-[10px] text-slate-400">主主人：{p.ownerName} ({p.ownerPhone})</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                    {p.age}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress update interactive overlay */}
      {showStatusModal && selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-sm rounded-t-3xl p-5 space-y-4 animate-slide-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">更新 【{selectedApp.petName}】 洗护美容进度</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 text-xs">取消</button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-slate-400 font-semibold mb-1">写下当前的运作状态描述 (可选)</label>
              <input
                type="text"
                placeholder="例如: 基础眼耳部清洁完成，开始温水洗涤中。"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={() => handleUpdateStatus("bath", "processing")}
                className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all"
              >
                洗浴进行中 (Bath processing)
              </button>
              <button
                onClick={() => handleUpdateStatus("groom", "processing")}
                className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all"
              >
                修剪造型进行中 (Groom processing)
              </button>
              <button
                onClick={() => handleUpdateStatus("completed", "completed")}
                className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
              >
                项目已全部完工 (Completed Check-out)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Assistant icon for mobile staff */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setShowAiChat(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all text-sm font-bold relative animate-bounce"
        >
          <Sparkles size={20} className="text-yellow-300" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[8px] px-1 font-bold">AI</span>
        </button>
      </div>

      {/* AI Assistant Slider Drawer */}
      {showAiChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50">
          <div className="bg-slate-950 text-white w-full max-w-sm rounded-t-3xl p-5 space-y-4 animate-slide-up flex flex-col h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                  <Sparkles size={14} className="text-yellow-400" />
                  洗护实操规程 AI 客服
                </h3>
              </div>
              <button onClick={() => setShowAiChat(false)} className="text-slate-400 hover:text-white text-xs border border-slate-850 px-2.5 py-1 rounded-lg">关闭</button>
            </div>

            {/* Main Chat Display */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 text-xs">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className="text-[9px] text-slate-500 mb-0.5 flex items-center gap-1 font-mono">
                    <span>{m.time}</span>
                    <span className={m.sender === "user" ? "text-blue-400" : "text-yellow-400"}>
                      {m.sender === "user" ? "智能识别技师" : "萌宠洗护AI助理"}
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                    m.sender === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-start flex-col">
                  <span className="text-[9px] text-yellow-400 font-bold mb-1 animate-pulse">正在精读最新的规程手册...</span>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-500 font-bold">📖 师徒实操参考词条测试：</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                <button
                  onClick={() => sendMsg("贵宾或者比熊圆头要点和腿部修剪技巧是什么？")}
                  disabled={chatLoading}
                  className="bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 text-[10px] rounded-lg border border-slate-700/50 whitespace-nowrap active:scale-95 transition-all"
                >
                  ✂️ 比熊圆头怎么修
                </button>
                <button
                  onClick={() => sendMsg("如果有红疹轻度感染要用什么比例洗剂泡药浴？")}
                  disabled={chatLoading}
                  className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 text-[10px] rounded-lg border border-slate-700/50 whitespace-nowrap active:scale-95 transition-all"
                >
                  🧴 局部红斑药浴配方
                </button>
                <button
                  onClick={() => sendMsg("猫咪敏感应激的时候如何洗澡以及防止被抓开发指南？")}
                  disabled={chatLoading}
                  className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 text-[10px] rounded-lg border border-slate-700/50 whitespace-nowrap active:scale-95 transition-all"
                >
                  🐱 猫咪应激安抚
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
                placeholder="对洗护AI助理进行提问..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-4 pr-16 py-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-200"
              />
              <button
                onClick={() => sendMsg()}
                disabled={chatLoading || !chatInput.trim()}
                className="absolute right-2 top-2.5 h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40"
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
