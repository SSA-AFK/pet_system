import React, { useState, useEffect } from "react";
import { UserRole, Pet, Client, Appointment, ServiceItem, InventoryItem, Employee, SalesRecord, SystemLog } from "../types";
import {
  Sparkles, TrendingUp, Users, Scissors, Calendar, DollarSign, Package, Clock, Settings,
  Database, Plus, Search, Trash, AlertTriangle, CheckCircle2, FileText, CreditCard,
  Volume2, RefreshCw, LogOut, ShieldAlert, Award, Heart, Upload, Edit, X
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { useApiServices, useApiInventory, useApiEmployees, useApiPets, useApiClients, useApiAppointments } from "../hooks/useApiData";
import AIChat from "./shared/AIChat";
import { THEME } from "../theme";

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

interface UserData {
  id: string;
  username: string;
  display_name: string;
  role: string;
  phone: string;
  created_at: string;
  created_by: string;
}

function UserManagementTab() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({ username: "", password: "", display_name: "", role: "STAFF", phone: "" });
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.status === "success") setUsers(data.data);
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ username: "", password: "", display_name: "", role: "STAFF", phone: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({ username: user.username, password: "", display_name: user.display_name, role: user.role, phone: user.phone });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.display_name || (!editingUser && (!formData.username || !formData.password))) {
      setMessage({ type: "error", text: "请填写必填字段" });
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";
      const body = editingUser 
        ? { display_name: formData.display_name, phone: formData.phone, role: formData.role, password: formData.password }
        : formData;
      
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "操作成功" });
        setShowModal(false);
        fetchUsers();
      } else {
        setMessage({ type: "error", text: data.detail || "操作失败" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "网络错误" });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("确定要删除此用户吗？")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "用户已删除" });
        fetchUsers();
      } else {
        setMessage({ type: "error", text: data.detail || "删除失败" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "网络错误" });
    }
  };

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "超级管理员",
    MANAGER: "店长/管理员",
    STAFF: "员工/美容师",
    CUSTOMER: "顾客/会员"
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-md">User Management</span>
          <h3 className="text-base font-black">员工与账户管理系统</h3>
          <p className="text-xs text-indigo-100">超级管理员可以在此添加、编辑和删除店长及员工账户</p>
        </div>
        <button onClick={handleOpenCreate} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
          <Plus size={16} /> 添加用户
        </button>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
          <button onClick={() => setMessage({ type: "", text: "" })} className="float-right"><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">用户列表</h4>
          <button onClick={fetchUsers} className="text-slate-400 hover:text-slate-600"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-bold">ID</th>
              <th className="px-4 py-3 text-left font-bold">用户名</th>
              <th className="px-4 py-3 text-left font-bold">显示名称</th>
              <th className="px-4 py-3 text-left font-bold">角色</th>
              <th className="px-4 py-3 text-left font-bold">手机号</th>
              <th className="px-4 py-3 text-left font-bold">创建时间</th>
              <th className="px-4 py-3 text-right font-bold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-600">{user.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{user.username}</td>
                <td className="px-4 py-3 text-slate-700">{user.display_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    user.role === "SUPER_ADMIN" ? "bg-blue-100 text-blue-700" :
                    user.role === "MANAGER" ? "bg-emerald-100 text-emerald-700" :
                    user.role === "STAFF" ? "bg-indigo-100 text-indigo-700" :
                    "bg-pink-100 text-pink-700"
                  }`}>
                    {roleLabel[user.role] || user.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">{user.phone}</td>
                <td className="px-4 py-3 text-slate-500">{user.created_at}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => handleOpenEdit(user)} className="text-blue-500 hover:text-blue-700 font-bold">编辑</button>
                  {user.role !== "SUPER_ADMIN" && (
                    <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 font-bold">删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{editingUser ? "编辑用户" : "添加新用户"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            {!editingUser && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">用户名 *</label>
                <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="登录账号" />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">显示名称 *</label>
              <input type="text" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="如：张三" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">密码 {editingUser ? "(留空则不修改)" : "*"}</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="登录密码" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">角色</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="MANAGER">店长/管理员</option>
                <option value="STAFF">员工/美容师</option>
                <option value="CUSTOMER">顾客/会员</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">手机号</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="可选" />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all">取消</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ backgroundColor: THEME.PRIMARY }}>{editingUser ? "保存修改" : "创建用户"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AdminWorkspaceProps {
  role: UserRole;
  userName: string;
  pets: Pet[];
  clients: Client[];
  appointments: Appointment[];
  services: ServiceItem[];
  inventory: InventoryItem[];
  employees: Employee[];
  sales: SalesRecord[];
  logs: SystemLog[];
  onLogOut: () => void;
  // State Mutators
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setSales: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
}

export default function AdminWorkspace({
  role,
  userName,
  pets,
  clients,
  appointments,
  services,
  inventory,
  employees,
  sales,
  logs,
  onLogOut,
  setPets,
  setClients,
  setAppointments,
  setServices,
  setInventory,
  setEmployees,
  setSales
}: AdminWorkspaceProps) {
  
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const currentTime = useCurrentTime();

  // API data hooks - fetch from backend
  const apiServices = useApiServices(services);
  const apiInventory = useApiInventory(inventory);
  const apiEmployees = useApiEmployees(employees);
  const apiPets = useApiPets(pets);
  const apiClients = useApiClients(clients);
  const apiAppointments = useApiAppointments(appointments);

  // Override props with API data
  const servicesData = apiServices.data;
  const inventoryData = apiInventory.data;
  const employeesData = apiEmployees.data;
  const petsData = apiPets.data;
  const clientsData = apiClients.data;
  const appointmentsData = apiAppointments.data;

  // Filter out unauthorized modules for Manager
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;

  // Search States
  const [petSearch, setPetSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");

  // AI Business Analysis State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState("");

  // AI Schedule Suggestion State
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState<{ peakSlots: string[]; staffAllocation: Record<string, string> } | null>(null);

  // Churn Risk State
  interface ChurnRisk { clientId: string; risk: "高" | "中" | "低" }
  const [churnRisks, setChurnRisks] = useState<ChurnRisk[]>([]);

  // Form states
  const [showAddPet, setShowAddPet] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [newPetName, setNewPetName] = useState("");
  const [newPetType, setNewPetType] = useState<"dog" | "cat" | "other">("dog");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetAge, setNewPetAge] = useState("");
  const [newPetOwnerPhone, setNewPetOwnerPhone] = useState("");
  const [newPetHealthNotes, setNewPetHealthNotes] = useState("");

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientLevel, setNewClientLevel] = useState<any>("普通会员");
  const [newClientBalance, setNewClientBalance] = useState(100);

  // Cashier State
  const [cashierClient, setCashierClient] = useState<string>(clients[0]?.phone || "");
  const [cashierService, setCashierService] = useState<string>(services[0]?.name || "");
  const [cashierGoods, setCashierGoods] = useState<string>(inventory[0]?.id || "");
  const [cashierNote, setCashierNote] = useState("");
  const [cashierSuccessMsg, setCashierSuccessMsg] = useState("");

  // AI Knowledge Base & Assistant States
  const [kbLoading, setKbLoading] = useState(false);
  const [kbDocs, setKbDocs] = useState<{ admin: string; staff: string; customer: string }>({
    admin: "",
    staff: "",
    customer: ""
  });
  const [selectedKbKey, setSelectedKbKey] = useState<"admin" | "staff" | "customer">("admin");
  const [kbEditorContent, setKbEditorContent] = useState("");
  const [kbSaveLoading, setKbSaveLoading] = useState(false);
  const [kbSaveSuccess, setKbSaveSuccess] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState("");

  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([
    { sender: "ai", text: "👑 您好，超级管理员！我已经为您加载了专属的【店铺经营与连锁管理知识库】。您可以随时向我咨询，或者在左侧编辑最新的经营与管理规范，我会立马吸收！🐾", time: "09:41" }
  ]);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatLoading, setAiChatLoading] = useState(false);

  React.useEffect(() => {
    const sandboxWelcome = role === UserRole.MANAGER
      ? "💼 您好，店长管理员！我已经为您加载了专属的【店铺经营与连锁管理知识库】。您作为本分店的核心经营者，拥有对全局知识库全部编辑、一键上传以及发布的同等权限。您可以在左侧编写或者通过本地文件一键导入并整理最新的规范，我会立马吸收！🐾"
      : "👑 您好，超级管理员房东老板！我已经为您加载了专属的【店铺经营与连锁管理知识库】。您可以随时向我咨询，或者在左侧编辑最新的经营与管理规范，我会立马吸收！🐾";

    setAiChatMessages([
      { sender: "ai", text: sandboxWelcome, time: new Date().toTimeString().substring(0, 5) }
    ]);
  }, [role]);

  const fetchKbData = async () => {
    setKbLoading(true);
    try {
      const res = await fetch("/api/kb");
      const d = await res.json();
      if (d.status === "success" && d.data) {
        setKbDocs(d.data);
      }
    } catch (e) {
      console.error("Failed to load KB data:", e);
    } finally {
      setKbLoading(false);
    }
  };

  const saveKbData = async () => {
    if (!kbEditorContent.trim()) {
      alert("知识库内容不能为空。");
      return;
    }
    setKbSaveLoading(true);
    setKbSaveSuccess("");
    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kbType: selectedKbKey, content: kbEditorContent })
      });
      const d = await res.json();
      if (d.status === "success") {
        setKbSaveSuccess("🎉 知识库更新成功！所有客户端将瞬时载入新数据。");
        setKbDocs(prev => ({ ...prev, [selectedKbKey]: kbEditorContent }));
        setTimeout(() => setKbSaveSuccess(""), 4000);
      } else {
        alert("更新失败: " + d.error);
      }
    } catch (e) {
      alert("保存时发生技术故障，请检查连接。");
    } finally {
      setKbSaveLoading(false);
    }
  };

  const handleKbFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("上传的文件太大，请限制在 10MB 以内。");
      return;
    }

    setFileUploading(true);
    setFileUploadError("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target?.result as string;
        const res = await fetch("/api/kb/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kbType: selectedKbKey,
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data
          })
        });

        const d = await res.json();
        if (d.status === "success" && d.extractedText) {
          setKbEditorContent(d.extractedText);
          setKbDocs(prev => ({ ...prev, [selectedKbKey]: d.extractedText }));
        } else {
          setFileUploadError(d.error || "智能提取失败");
          alert("导入失败: " + (d.error || "无法从文档中提取有效信息"));
        }
      } catch (err) {
        console.error("File upload parse failure:", err);
        setFileUploadError("解析处理异常，请稍后重试");
        alert("文件读取或与后端解析交互失败。");
      } finally {
        setFileUploading(false);
        e.target.value = ""; // Reset to allow same file uploading again
      }
    };

    reader.onerror = () => {
      alert("无法读取该本地文件！");
      setFileUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const sendAiChatMessage = async (presetText?: string) => {
    const textToSend = presetText || aiChatInput;
    if (!textToSend.trim()) return;

    setAiChatMessages(prev => [...prev, { sender: "user", text: textToSend, time: new Date().toTimeString().substring(0, 5) }]);
    if (!presetText) setAiChatInput("");
    setAiChatLoading(true);

    try {
      const chatHistory = aiChatMessages.map(m => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role,
          message: textToSend,
          history: chatHistory
        })
      });
      const d = await res.json();
      setAiChatMessages(prev => [...prev, {
        sender: "ai",
        text: d.content || "AI 思考超时，请稍后再次发送咨询。",
        time: new Date().toTimeString().substring(0, 5)
      }]);
    } catch (err) {
      setAiChatMessages(prev => [...prev, {
        sender: "ai",
        text: "🚨 发生网络连接超时或网关不可达，请稍后重发。",
        time: new Date().toTimeString().substring(0, 5)
      }]);
    } finally {
      setAiChatLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === "ai-assistant") {
      fetchKbData();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (kbDocs[selectedKbKey]) {
      setKbEditorContent(kbDocs[selectedKbKey]);
    }
  }, [selectedKbKey, kbDocs]);

  // Fetch churn risk data when clients tab loads
  React.useEffect(() => {
    if (activeTab === "clients") {
      fetchChurnRisk();
    }
  }, [activeTab]);

  // Fetch AI schedule suggestion
  const fetchScheduleSuggestion = async () => {
    setScheduleLoading(true);
    try {
      const res = await fetch("/api/analytics/schedule-suggest");
      const data = await res.json();
      if (data.status === "success" && data.data) {
        setScheduleData(data.data);
      } else {
        setScheduleData({
          peakSlots: ["周六 10:00-12:00", "周日 14:00-16:00", "周三 18:00-20:00"],
          staffAllocation: {
            "周一": "丽丽(早班) + 阿明(晚班)",
            "周二": "丽丽(早班) + 小王(晚班)",
            "周三": "阿明(全天班)",
            "周四": "丽丽(早班) + 阿明(晚班)",
            "周五": "全员在岗",
            "周六": "全员在岗(高峰)",
            "周日": "全员在岗(高峰)"
          }
        });
      }
      setShowScheduleModal(true);
    } catch (e) {
      console.error("Failed to fetch schedule suggestion", e);
      setScheduleData({
        peakSlots: ["周六 10:00-12:00", "周日 14:00-16:00", "周三 18:00-20:00"],
        staffAllocation: {
          "周一": "丽丽(早班) + 阿明(晚班)",
          "周二": "丽丽(早班) + 小王(晚班)",
          "周三": "阿明(全天班)",
          "周四": "丽丽(早班) + 阿明(晚班)",
          "周五": "全员在岗",
          "周六": "全员在岗(高峰)",
          "周日": "全员在岗(高峰)"
        }
      });
      setShowScheduleModal(true);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Fetch churn risk for clients
  const fetchChurnRisk = async () => {
    try {
      const res = await fetch("/api/analytics/churn-risk");
      const data = await res.json();
      if (data.status === "success" && data.data) {
        setChurnRisks(data.data);
      } else {
        setChurnRisks(clientsData.map((c, i) => ({
          clientId: c.id,
          risk: (["高", "中", "低"] as const)[i % 3]
        })));
      }
    } catch (e) {
      setChurnRisks(clientsData.map((c, i) => ({
        clientId: c.id,
        risk: (["高", "中", "低"] as const)[i % 3]
      })));
    }
  };

  // Trigger AI deep analysis
  const triggerAiAnalysis = async () => {
    setAiLoading(true);
    setAiReport("");
    try {
      const stats = {
        monthlyRevenue: "￥45,800",
        revenueGrowth: "+12.4%",
        totalMembers: clientsData.length + "人",
        newMembers: "+32人",
        pendingAppointments: appointmentsData.filter(a => a.status === "pending").length + "单"
      };
      const lowStock = inventoryData.filter(i => i.stock <= i.minStock);
      const activeStaff = employeesData.map(e => ({ name: e.name, role: e.role, shift: e.shift }));
      const recentSales = sales.slice(0, 4);

      const response = await fetch("/api/gemini/analyze-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats, recentSales, lowStock, activeStaff })
      });
      const data = await response.json();
      setAiReport(data.content);
    } catch (e) {
      setAiReport("数据提取与智能分析服务出现短暂异常，请检查API密钥。");
    } finally {
      setAiLoading(false);
    }
  };

  // Add pet helper
  const handleCreatePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName || !newPetBreed) return;
    const ownerObj = clientsData.find(c => c.phone === newPetOwnerPhone);
    const newP: Pet = {
      id: "P00" + (pets.length + 1),
      name: newPetName,
      type: newPetType,
      breed: newPetBreed,
      age: newPetAge || "1岁",
      ownerName: ownerObj ? ownerObj.name : "散客",
      ownerPhone: newPetOwnerPhone,
      avatar: newPetType === "dog" 
        ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200"
        : "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200",
      healthNotes: newPetHealthNotes || "常规健康状况良好",
      status: "waiting"
    };
    setPets([newP, ...pets]);
    // Sync to backend
    fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newP.name, type: newP.type, breed: newP.breed, age: newP.age, owner_name: newP.ownerName, owner_phone: newP.ownerPhone, health_notes: newP.healthNotes })
    }).catch(console.error);
    resetPetForm();
  };

  // Open edit modal
  const handleOpenEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setNewPetName(pet.name);
    setNewPetType(pet.type as "dog" | "cat" | "other");
    setNewPetBreed(pet.breed);
    setNewPetAge(pet.age);
    setNewPetOwnerPhone(pet.ownerPhone);
    setNewPetHealthNotes(pet.healthNotes || "");
    setShowAddPet(true);
  };

  // Update pet
  const handleUpdatePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPet || !newPetName || !newPetBreed) return;
    const ownerObj = clientsData.find(c => c.phone === newPetOwnerPhone);
    const updated: Pet = {
      ...editingPet,
      name: newPetName,
      type: newPetType,
      breed: newPetBreed,
      age: newPetAge || "1岁",
      ownerName: ownerObj ? ownerObj.name : "散客",
      ownerPhone: newPetOwnerPhone,
      healthNotes: newPetHealthNotes || editingPet.healthNotes,
    };
    setPets(prev => prev.map(p => p.id === editingPet.id ? updated : p));
    // Sync to backend
    fetch(`/api/pets/${editingPet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: updated.name, type: updated.type, breed: updated.breed, age: updated.age, owner_name: updated.ownerName, owner_phone: updated.ownerPhone, health_notes: updated.healthNotes })
    }).catch(console.error);
    resetPetForm();
  };

  // Delete pet
  const handleDeletePet = (petId: string) => {
    if (!confirm("确定删除该宠物档案吗？")) return;
    setPets(prev => prev.filter(p => p.id !== petId));
    fetch(`/api/pets/${petId}`, { method: "DELETE" }).catch(console.error);
  };

  // Reset pet form
  const resetPetForm = () => {
    setShowAddPet(false);
    setEditingPet(null);
    setNewPetName("");
    setNewPetType("dog");
    setNewPetBreed("");
    setNewPetAge("");
    setNewPetOwnerPhone("");
    setNewPetHealthNotes("");
  };

  // Add client helper
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;
    const newC: Client = {
      id: "C00" + (clientsData.length + 1),
      name: newClientName,
      phone: newClientPhone,
      level: newClientLevel,
      points: 50,
      balance: Number(newClientBalance),
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      joinDate: new Date().toISOString().split("T")[0]
    };
    setClients([newC, ...clients]);
    setShowAddClient(false);
    setNewClientName("");
    setNewClientPhone("");
  };

  // Restock trigger
  const handleRestock = async (id: string) => {
    const item = inventoryData.find(i => i.id === id);
    if (!item) return;
    try {
      await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: item.name, category: item.category, stock: item.stock + 10, unit: item.unit, min_stock: item.minStock, price: item.price })
      });
      apiInventory.refresh();
    } catch (e) { console.error(e); }
  };

  const handleUpdateAppointmentStatus = async (id: string, status: string, groomerName?: string, notes?: string) => {
    try {
      await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, groomer_name: groomerName || "", progress_notes: notes || "" })
      });
      apiAppointments.refresh();
    } catch (e) { console.error(e); }
  };

  // Inventory CRUD state
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [invForm, setInvForm] = useState({ name: "", category: "宠粮", stock: 0, unit: "件", minStock: 5, price: 0 });

  const handleOpenCreateInventory = () => {
    setEditingInventory(null);
    setInvForm({ name: "", category: "宠粮", stock: 0, unit: "件", minStock: 5, price: 0 });
    setShowInventoryModal(true);
  };

  const handleOpenEditInventory = (item: InventoryItem) => {
    setEditingInventory(item);
    setInvForm({ name: item.name, category: item.category, stock: item.stock, unit: item.unit, minStock: item.minStock, price: item.price });
    setShowInventoryModal(true);
  };

  const handleSubmitInventory = async () => {
    if (!invForm.name) return;
    try {
      const url = editingInventory ? `/api/inventory/${editingInventory.id}` : "/api/inventory";
      const method = editingInventory ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: invForm.name, category: invForm.category, stock: invForm.stock, unit: invForm.unit, min_stock: invForm.minStock, price: invForm.price })
      });
      setShowInventoryModal(false);
      apiInventory.refresh();
    } catch (e) { console.error(e); }
  };

  const handleDeleteInventory = async (id: string) => {
    if (!confirm("确定要删除此商品吗？")) return;
    try {
      await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      apiInventory.refresh();
    } catch (e) { console.error(e); }
  };

  // Dispatch cashier receipt logic
  const handleCashierCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const currC = clientsData.find(c => c.phone === cashierClient);
    const serviceObj = servicesData.find(s => s.name === cashierService);
    const goodsObj = inventoryData.find(g => g.id === cashierGoods);

    if (!currC) return;

    let cost = 0;
    let desc = "";

    if (serviceObj) {
      cost += serviceObj.price;
      desc += `${currC.name}的宠物办理服务：[${serviceObj.name}] `;
    }

    if (goodsObj) {
      cost += goodsObj.price;
      desc += `搭售商品：[${goodsObj.name}] `;
      fetch(`/api/inventory/${goodsObj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: goodsObj.name, category: goodsObj.category, stock: Math.max(0, goodsObj.stock - 1), unit: goodsObj.unit, min_stock: goodsObj.minStock, price: goodsObj.price })
      }).then(() => apiInventory.refresh()).catch(console.error);
    }

    // Apply VIP tier discounts
    let discountRate = 1.0;
    if (currC.level === "钻石卡会员") discountRate = 0.85;
    else if (currC.level === "黄金卡会员") discountRate = 0.90;

    const finalAmount = Math.ceil(cost * discountRate);

    if (currC.balance < finalAmount) {
      setCashierSuccessMsg("扣款失败：会员卡余额不足 (需支付 ￥" + finalAmount + "，当前余额 ￥" + currC.balance + " )，请引导客户充值");
      return;
    }

    // Deduct member balance via API
    fetch(`/api/clients/${currC.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currC.name, phone: currC.phone, level: currC.level, points: currC.points + Math.floor(finalAmount / 10), balance: currC.balance - finalAmount, join_date: currC.joinDate })
    }).then(() => apiClients.refresh()).catch(console.error);

    // Record Sale
    const freshSale: SalesRecord = {
      id: "R00" + (sales.length + 1),
      category: "收银台代扣结算",
      description: desc + ` (已享 ${discountRate * 10} 折优惠)`,
      amount: finalAmount,
      time: new Date().toISOString().replace("T", " ").substring(0, 16),
      paymentMethod: "会员卡余额",
      operator: userName
    };

    setSales([freshSale, ...sales]);
    setCashierSuccessMsg("🎉 收银清算成功！会员卡扣除 [ ￥" + finalAmount + " ]，累计获得 " + Math.floor(finalAmount / 10) + " 点积分。");
    setTimeout(() => setCashierSuccessMsg(""), 5000);
  };

  // Filtered lists
  const filteredPets = petsData.filter(p => 
    p.name.toLowerCase().includes(petSearch.toLowerCase()) || 
    p.breed.toLowerCase().includes(petSearch.toLowerCase()) ||
    (p.ownerName || "").toLowerCase().includes(petSearch.toLowerCase())
  );

  const filteredClients = clientsData.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.phone.includes(clientSearch)
  );

  const filteredInventory = inventoryData.filter(i => 
    i.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
    i.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  // Standard metrics
  const totalMonthlySales = sales.reduce((acc, sale) => acc + sale.amount, 0);
  const pendingAppsCount = appointmentsData.filter(a => a.status === "pending").length;
  const warningInventoryCount = inventoryData.filter(i => i.stock <= i.minStock).length;

  return (
    <div id="admin_workspace" className="min-h-screen bg-slate-100 flex font-sans">
      
      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-900 text-slate-350 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: THEME.PRIMARY, boxShadow: `0 4px 6px -1px ${THEME.PRIMARY}33` }}>
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-white text-sm font-black tracking-wide">{THEME.BRAND.name}</h2>
            <p className="text-[10px] text-slate-500">Professional Admin v1.8</p>
          </div>
        </div>

        {/* Menu selections */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-3.5 mb-2">核心仪表</div>
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
              activeTab === "dashboard" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
            }`}
            style={activeTab === "dashboard" ? { backgroundColor: THEME.PRIMARY } : undefined}
          >
            <TrendingUp size={16} />
            首页数据与AI分析
          </button>

          <button
            onClick={() => setActiveTab("ai-assistant")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
              activeTab === "ai-assistant" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
            }`}
            style={activeTab === "ai-assistant" ? { backgroundColor: THEME.PRIMARY } : undefined}
          >
            <Sparkles size={16} className="text-amber-450 fill-amber-450/20" />
            AI客服与知识库中心
          </button>

          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-3.5 pt-4 mb-2">日常业务</div>

          <button
            onClick={() => setActiveTab("clients")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
              activeTab === "clients" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
            }`}
            style={activeTab === "clients" ? { backgroundColor: THEME.PRIMARY } : undefined}
          >
            <Users size={16} />
            客户管理
          </button>

          <button
            onClick={() => setActiveTab("pets")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
              activeTab === "pets" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
            }`}
            style={activeTab === "pets" ? { backgroundColor: THEME.PRIMARY } : undefined}
          >
            <Heart size={16} />
            宠物智能档案
          </button>

          <button
            onClick={() => setActiveTab("appointments")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
              activeTab === "appointments" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
            }`}
            style={activeTab === "appointments" ? { backgroundColor: THEME.PRIMARY } : undefined}
          >
            <Calendar size={16} />
            预约排程管理
          </button>

          <button
            onClick={() => setActiveTab("cashier")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
              activeTab === "cashier" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
            }`}
            style={activeTab === "cashier" ? { backgroundColor: THEME.PRIMARY } : undefined}
          >
            <CreditCard size={16} />
            收银结算前台
          </button>

          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-3.5 pt-4 mb-2">物资服务</div>

          <button
            onClick={() => setActiveTab("services")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
              activeTab === "services" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
            }`}
            style={activeTab === "services" ? { backgroundColor: THEME.PRIMARY } : undefined}
          >
            <Scissors size={16} />
            服务项目库
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
              activeTab === "inventory" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
            }`}
            style={activeTab === "inventory" ? { backgroundColor: THEME.PRIMARY } : undefined}
          >
            <Package size={16} />
            商品与洗护库存
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
              activeTab === "reports" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
            }`}
            style={activeTab === "reports" ? { backgroundColor: THEME.PRIMARY } : undefined}
          >
            <FileText size={16} />
            财务报表查看
          </button>

          {/* SuperAdmin ONLY modules */}
          {isSuperAdmin && (
            <>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-3.5 pt-4 mb-2">安全和人事</div>
              
              <button
                onClick={() => setActiveTab("staff")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "staff" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
                }`}
                style={activeTab === "staff" ? { backgroundColor: THEME.PRIMARY } : undefined}
              >
                <Users size={16} />
                员工考勤提成
              </button>

              <button
                onClick={() => setActiveTab("logs")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "logs" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
                }`}
                style={activeTab === "logs" ? { backgroundColor: THEME.PRIMARY } : undefined}
              >
                <Database size={16} />
                系统操作日志
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "settings" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
                }`}
                style={activeTab === "settings" ? { backgroundColor: THEME.PRIMARY } : undefined}
              >
                <Settings size={16} />
                门店综合设置
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab("users")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
                    activeTab === "users" ? "text-white font-bold" : "hover:bg-slate-850 hover:text-white text-slate-400"
                  }`}
                  style={activeTab === "users" ? { backgroundColor: THEME.PRIMARY } : undefined}
                >
                  <Users size={16} />
                  用户账户管理
                </button>
              )}
            </>
          )}
        </nav>

        {/* User Identity bottom footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-xs text-slate-400 space-y-2 flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-300">{userName}</span>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            权限类别: {isSuperAdmin ? "超级管理员 (全开)" : "店长/管理员 (受限)"}
          </p>
          <button
            onClick={onLogOut}
            className="w-full mt-1.5 py-2 bg-slate-800 hover:bg-red-900 border border-slate-700 rounded-xl hover:text-white transition-all text-center font-bold text-[11px] flex items-center justify-center gap-1.5"
          >
            <LogOut size={12} />
            退出系统登录
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="bg-white h-16 border-b border-slate-200 px-6 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <span>宠物店智能化管理控制台</span>
              <span className={`text-[10px] pl-2 font-mono px-2 py-0.5 rounded-md ${
                isSuperAdmin ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {role === UserRole.SUPER_ADMIN ? "👑 Boss/老板专属视图" : "👔 店长/业务主管视图"}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
              {currentTime.toLocaleString('zh-CN', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
              })}
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <span className="font-semibold text-slate-800">登入人: {userName}</span>
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Tabs 1: Overview Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本月累积总营收</span>
                    <div className="text-xl font-extrabold text-slate-800 mt-1 font-mono">￥{totalMonthlySales + 45800}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: THEME.PRIMARY_LIGHT, color: THEME.PRIMARY }}>
                    <DollarSign size={20} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">会员档案总数</span>
                    <div className="text-xl font-extrabold text-slate-800 mt-1">{clientsData.length} 人</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">等候接驳预约量</span>
                    <div className="text-xl font-extrabold text-[#ca8a04] mt-1">{pendingAppsCount} 单</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">库存预警商品</span>
                    <div className="text-xl font-extrabold text-rose-600 mt-1">{warningInventoryCount} 个</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                </div>
              </div>

              {/* Exclusive Boss AI analysis block */}
              <div className="bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
                <div className="absolute right-[-10px] top-[-10px] w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]" />
                
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-extrabold tracking-widest rounded-lg border border-blue-500/30 uppercase flex items-center gap-1.5 w-max">
                      <Sparkles size={11} className="fill-blue-500/20" />
                      萌宠 AI 智能助手
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">
                      店铺运营大盘诊断及下期营收预测建议
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      自动采集当前的营收动态数据（￥{(totalMonthlySales + 45800).toLocaleString()}）、低库存物资、员工目前周期的排班排班，为店长及老板生成针对性的深度行业决策报告。
                    </p>
                  </div>

                  <button
                    onClick={triggerAiAnalysis}
                    disabled={aiLoading}
                    className="px-5 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 shrink-0 disabled:opacity-40"
                  >
                    {aiLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={14} />
                        生成AI辅助报告
                      </>
                    )}
                  </button>
                </div>

                {/* AI Markdown generated advisory report */}
                {aiReport && (
                  <div className="mt-5 bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans shadow-inner max-h-96 overflow-y-auto scrollbar-thin">
                    <div className="prose max-w-none text-slate-200 text-[12px] space-y-3">
                      {aiReport.split("\n").map((line, idx) => {
                        if (line.startsWith("###") || line.startsWith("##")) {
                          return <h4 key={idx} className="font-extrabold text-blue-400 mt-4 pt-2 border-b border-slate-800">{line.replace(/#*/g, "")}</h4>;
                        }
                        if (line.startsWith("-")) {
                          return <p key={idx} className="pl-3 border-l-2 border-blue-500">{line}</p>;
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Charts & Graphs Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* sales trend chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">月度收入增长趋势</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: "一月", 收入: 28000 },
                        { name: "二月", 收入: 32000 },
                        { name: "三月", 收入: 39000 },
                        { name: "四月", 收入: 41000 },
                        { name: "五月", 收入: 45800 },
                        { name: "六月 (预测)", 收入: totalMonthlySales + 45800 }
                      ]}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Area type="monotone" dataKey="收入" stroke="#2563eb" fill="#eff6ff" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Inventory breakdown barchart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">关键耗材及商品库存</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryData.map(i => ({ name: i.name.substring(0, 8), 当前库存: i.stock, 安全下限: i.minStock }))}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="当前库存" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="安全下限" fill="#fda4af" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs 2: Client management */}
          {activeTab === "clients" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
              <div className="flex justify-between items-center">
                <div className="relative w-80">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="按姓名或电话检索客群..."
                    className="bg-slate-50 border border-slate-200 rounded-xl px-10 py-2 w-full text-xs"
                  />
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                </div>

                <button
                  onClick={() => setShowAddClient(true)}
                  className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90"
                  style={{ backgroundColor: THEME.PRIMARY }}
                >
                  <Plus size={14} />
                  办理新卡/录入会员登记
                </button>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest">
                      <th className="py-3 px-4 font-bold">客户姓名</th>
                      <th className="py-3 px-4 font-bold">流失风险</th>
                      <th className="py-3 px-4 font-bold">联络手机</th>
                      <th className="py-3 px-4 font-bold">会员等级</th>
                      <th className="py-3 px-4 font-bold">积分配比</th>
                      <th className="py-3 px-4 font-bold">储值余额</th>
                      <th className="py-3 px-4 font-bold">开卡加入时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-700 flex items-center gap-2">
                          <img src={c.avatar} className="w-8 h-8 rounded-full border border-slate-200 object-cover" alt="c" />
                          {c.name}
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const riskItem = churnRisks.find(r => r.clientId === c.id);
                            const risk = riskItem?.risk;
                            if (!risk) return <span className="text-[10px] text-slate-400">-</span>;
                            const colors: Record<string, string> = {
                              "高": "bg-red-100 text-red-700 border-red-200",
                              "中": "bg-yellow-100 text-yellow-700 border-yellow-200",
                              "低": "bg-green-100 text-green-700 border-green-200"
                            };
                            return (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[risk] || "bg-slate-100 text-slate-500"}`}>
                                {risk}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{c.phone}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.level === "钻石卡会员" ? "bg-purple-100 text-purple-850" : 
                            c.level === "黄金卡会员" ? "bg-amber-100 text-amber-850" : "bg-slate-100 text-slate-700"
                          }`}>
                            {c.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-650">{c.points} P</td>
                        <td className="py-3 px-4 font-bold font-mono text-indigo-600">￥{c.balance}</td>
                        <td className="py-3 px-4 text-slate-400">{c.joinDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Form Modal */}
              {showAddClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <form onSubmit={handleCreateClient} className="bg-white p-6 rounded-2xl w-96 border border-slate-200 shadow-xl space-y-4 animate-fade-in">
                    <h3 className="text-sm font-bold text-slate-800">线下办理新会员登记卡</h3>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">姓名 (Client name)</label>
                        <input
                          type="text" required value={newClientName} onChange={(e) => setNewClientName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">联络电话 (Phone)</label>
                        <input
                          type="text" required value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-slate-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">会员级别</label>
                        <select
                          value={newClientLevel} onChange={(e) => setNewClientLevel(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                        >
                          <option value="普通会员">普通会员</option>
                          <option value="黄金卡会员">黄金卡会员 (享9折)</option>
                          <option value="钻石卡会员">钻石卡会员 (享85折)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">初始预存/充值金额 (￥)</label>
                        <input
                          type="number" value={newClientBalance} onChange={(e) => setNewClientBalance(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3">
                      <button type="button" onClick={() => setShowAddClient(false)} className="px-4 py-1.5 bg-slate-105 hover:bg-slate-200 rounded-lg text-xs text-slate-500">取消</button>
                      <button type="submit" className="px-4 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90" style={{ backgroundColor: THEME.PRIMARY }}>创建开卡</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Tabs 3: Pet Intelligent Archives */}
          {activeTab === "pets" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
              <div className="flex justify-between items-center">
                <div className="relative w-80">
                  <input
                    type="text"
                    value={petSearch}
                    onChange={(e) => setPetSearch(e.target.value)}
                    placeholder="检索宠物名称、品种、主人姓名..."
                    className="bg-slate-50 border border-slate-200 rounded-xl px-10 py-2 w-full text-xs"
                  />
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                </div>

                <button
                  onClick={() => setShowAddPet(true)}
                  className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90"
                  style={{ backgroundColor: THEME.PRIMARY }}
                >
                  <Plus size={14} />
                  创设宠物专属智能档案
                </button>
              </div>

              {/* Grid bento layout for pets */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredPets.map((p) => {
                  return (
                    <div key={p.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm relative space-y-3 hover:translate-y-[-2px] transition-all group">
                      {/* 编辑/删除按钮 */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditPet(p)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all"
                          title="编辑"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeletePet(p.id)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-300 transition-all"
                          title="删除"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <img src={p.avatar} className="w-12 h-12 rounded-2xl object-cover border border-slate-200" alt="avatar" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{p.name}</h4>
                          <span className="inline-block px-2 py-0.5 mt-1 bg-blue-50 text-blue-800 rounded-md text-[9px] font-bold">
                            {p.breed}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1 bg-white p-2.5 rounded-xl border border-slate-100">
                        <div className="flex justify-between">
                          <span>年龄：</span><span className="font-semibold text-slate-700">{p.age}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>属主：</span><span className="font-semibold text-slate-700">{p.ownerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>电话：</span><span className="font-mono text-slate-700">{p.ownerPhone}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-rose-600 bg-rose-50/50 p-2 rounded-xl border border-rose-100/60 line-clamp-2">
                        ★ {p.healthNotes}
                      </div>

                      <div className="text-[10px] text-slate-400 flex justify-between items-center">
                        <span>目前定位：店内处理中</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                          {p.status === "completed" ? "已带走" : p.status === "waiting" ? "待接驳" : "美容洗护中"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Form Modal for Add/Edit pet */}
              {showAddPet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) resetPetForm(); }}>
                  <form onSubmit={editingPet ? handleUpdatePet : handleCreatePet} className="bg-white p-6 rounded-2xl w-96 border border-slate-200 shadow-xl space-y-4 animate-fade-in">
                    <h3 className="text-sm font-bold text-slate-800">{editingPet ? "编辑宠物档案" : "创设高级宠物健康电子档案"}</h3>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">宠物名称 (Pet name)</label>
                        <input
                          type="text" required value={newPetName} onChange={(e) => setNewPetName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">大类分类 (Category)</label>
                        <select
                          value={newPetType} onChange={(e) => setNewPetType(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                        >
                          <option value="dog">犬犬 (Dog)</option>
                          <option value="cat">猫咪 (Cat)</option>
                          <option value="other">其它异宠 (Other)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">品种名称 (Breed)</label>
                        <input
                          type="text" required placeholder="例如: 柯基/金毛/英短猫等"
                          value={newPetBreed} onChange={(e) => setNewPetBreed(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">宠物周期年龄 (Age)</label>
                        <input
                          type="text" required placeholder="例如: 1岁2个月 / 11个月"
                          value={newPetAge} onChange={(e) => setNewPetAge(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">绑定对应主人联络电话 (Owner Phone)</label>
                        <input
                          type="text" required placeholder="精确查找已有的账号电话"
                          value={newPetOwnerPhone} onChange={(e) => setNewPetOwnerPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">健康备注 (Health Notes)</label>
                        <textarea
                          value={newPetHealthNotes} onChange={(e) => setNewPetHealthNotes(e.target.value)}
                          placeholder="例如: 过敏史、疫苗情况、特殊注意事项..."
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3">
                      <button type="button" onClick={resetPetForm} className="px-4 py-1.5 bg-slate-105 hover:bg-slate-200 rounded-lg text-xs text-slate-500">取消</button>
                      <button type="submit" className="px-4 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90" style={{ backgroundColor: THEME.PRIMARY }}>{editingPet ? "保存修改" : "同步归档"}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Tabs 4: Appointment Schedule list */}
          {activeTab === "appointments" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">门店预约与实时服务接单大屏</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchScheduleSuggestion}
                    disabled={scheduleLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90 text-white shadow-md disabled:opacity-50"
                    style={{ backgroundColor: THEME.PRIMARY }}
                  >
                    {scheduleLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    AI 排班建议
                  </button>
                  <span className="text-[11px] text-slate-400 font-semibold font-mono">
                    今日待分配/处理: {appointmentsData.filter(a => a.status === "pending").length} 单
                  </span>
                </div>
              </div>

              {/* AI Schedule Suggestion Modal */}
              {showScheduleModal && scheduleData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" />
                        AI 排班建议
                      </h3>
                      <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">高峰时段</h4>
                        <div className="flex flex-wrap gap-2">
                          {scheduleData.peakSlots.map((slot, i) => (
                            <span key={i} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold">
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">每日建议人员配置</h4>
                        <div className="space-y-2">
                          {Object.entries(scheduleData.staffAllocation).map(([day, staff]) => (
                            <div key={day} className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700">{day}</span>
                              <span className="text-slate-600 bg-white px-3 py-1 rounded-lg border border-blue-100">{staff}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setShowScheduleModal(false)}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: THEME.PRIMARY }}
                      >
                        知道了
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Kanban categories */}
              <div className="grid grid-cols-3 gap-5">
                {/* Column 1: pending to starts */}
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-3">
                  <div className="flex justify-between items-center text-amber-800 font-bold text-xs uppercase tracking-wider border-b border-amber-200/50 pb-2">
                    <span>⏳ 预约待理 (Pending)</span>
                    <span className="px-2 py-0.5 text-[9px] bg-amber-100 text-amber-900 rounded-full">
                      {appointmentsData.filter(a => a.status === "pending").length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {appointmentsData.filter(a => a.status === "pending").map((app) => (
                      <div key={app.id} className="bg-white p-3.5 rounded-xl shadow-xs border border-amber-100/50 text-xs space-y-3.5">
                        <div className="flex justify-between">
                          <span className="font-extrabold text-slate-800">{app.petName}</span>
                          <span className="font-mono text-slate-400 text-[10px]">{app.dateTime.split(" ")[1]}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{app.serviceName}</p>
                        <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-50">
                          <span className="text-slate-400">客: {app.clientName} | ￥{app.totalPrice || app.price || 0}</span>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(app.id, "processing", "阿明 (洗护师)")}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-bold"
                          >
                            指派接驳 &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: processing */}
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                  <div className="flex justify-between items-center text-blue-850 font-bold text-xs uppercase tracking-wider border-b border-blue-200/50 pb-2">
                    <span>💆 正在洗护美容中 (Processing)</span>
                    <span className="px-2 py-0.5 text-[9px] bg-blue-100 text-blue-900 rounded-full">
                      {appointmentsData.filter(a => a.status === "processing").length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {appointmentsData.filter(a => a.status === "processing").map((app) => (
                      <div key={app.id} className="bg-white p-3.5 rounded-xl shadow-xs border border-blue-100/50 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="font-extrabold text-[#1d4ed8]">{app.petName}</span>
                          <span className="text-[8px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md animate-pulse">
                            洗剪中
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-650">{app.serviceName}</p>
                        <p className="text-[10px] text-slate-400 italic">在岗人: {app.groomerName}</p>
                        {app.progressNotes && (
                          <div className="p-2 bg-slate-50 rounded-lg text-[10px] text-amber-700/90 border border-slate-100 line-clamp-2">
                            {app.progressNotes}
                          </div>
                        )}
                        <div className="flex justify-end pt-1.5 border-t border-slate-50">
                          <button
                            onClick={() => handleUpdateAppointmentStatus(app.id, "completed", "", "服务已完成，并扣除会员储值顺利结算。")}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-705 text-white rounded-lg text-[9px] font-bold"
                          >
                            完成出店 &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Completed checks */}
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex justify-between items-center text-emerald-800 font-bold text-xs uppercase tracking-wider border-b border-emerald-200/50 pb-2">
                    <span>✅ 今日完结结算 (Completed)</span>
                    <span className="px-2 py-0.5 text-[9px] bg-emerald-100 text-emerald-900 rounded-full">
                      {appointmentsData.filter(a => a.status === "completed").length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {appointmentsData.filter(a => a.status === "completed").map((app) => (
                      <div key={app.id} className="bg-white p-3.5 rounded-xl shadow-xs border border-emerald-100/50 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="font-extrabold text-emerald-800">{app.petName}</span>
                          <span className="text-[9px] text-emerald-650 font-bold flex items-center gap-0.5">
                            <CheckCircle2 size={9} />
                            已完结
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{app.serviceName}</p>
                        <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-50">
                          <span className="text-emerald-700 font-extrabold">￥{app.price}</span>
                          <span className="text-slate-400">承接: {app.groomerName.split(" ")[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs 5: Cashier Desk (收银结算) */}
          {activeTab === "cashier" && (
            <div className="grid grid-cols-3 gap-6">
              {/* Form trigger left panel */}
              <form onSubmit={handleCashierCheckout} className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">智能POS收银清算计算端 (VIP专属)</h3>
                  <span className="text-[10px] text-slate-400">刷卡/余额自动清算，多重卡型自动折扣</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">选择当期结账会员</label>
                    <select
                      value={cashierClient}
                      onChange={(e) => setCashierClient(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                    >
                      {clientsData.map(c => <option key={c.id} value={c.phone}>{c.name} ({c.phone} - 余额 ￥{c.balance})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">选择购买的消费卡/服务项</label>
                    <select
                      value={cashierService}
                      onChange={(e) => setCashierService(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    >
                      <option value="">-- 仅购买实体零食用品 --</option>
                      {servicesData.map(s => <option key={s.id} value={s.name}>{s.name} - ￥{s.price}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">搭售实体货架商品耗材</label>
                    <select
                      value={cashierGoods}
                      onChange={(e) => setCashierGoods(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    >
                      <option value="">-- 无配售商品 --</option>
                      {inventoryData.map(g => <option key={g.id} value={g.id}>{g.name} - ￥{g.price} {g.stock <= g.minStock ? '(库存极低)' : ''}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">收银单附加说明</label>
                    <input
                      type="text"
                      value={cashierNote}
                      onChange={(e) => setCashierNote(e.target.value)}
                      placeholder="例：麦兜当日棉花糖修剪造型完结清算"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                {cashierSuccessMsg && (
                  <div className={`p-4 rounded-xl text-xs font-bold leading-relaxed ${
                    cashierSuccessMsg.includes("失败") ? "bg-red-50 text-red-800 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}>
                    {cashierSuccessMsg}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-white rounded-xl font-bold flex items-center gap-1 transition-all hover:opacity-90"
                    style={{ backgroundColor: THEME.PRIMARY }}
                  >
                    <CreditCard size={14} />
                    确认极速扣款结算 (VIP Direct Account Charge)
                  </button>
                </div>
              </form>

              {/* Cashier right cards for current dynamic VIP info */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200">
                  当前所选客户特惠特权
                </h4>
                {(() => {
                  const selC = clientsData.find(c => c.phone === cashierClient);
                  if (!selC) return <p className="text-xs text-slate-400">请优先选择持卡会员</p>;
                  return (
                    <div className="space-y-3 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>客户名称:</span>
                        <span className="font-bold text-slate-800">{selC.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>卡等级:</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                          {selC.level}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>卡余额:</span>
                        <span className="font-bold text-indigo-600 font-mono">￥{selC.balance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>特权折扣比:</span>
                        <span className="font-bold text-rose-600">
                          {selC.level === "钻石卡会员" ? "享 8.5 折" : 
                           selC.level === "黄金卡会员" ? "享 9.0 折" : "普通价结算 (无折扣)"}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tabs 6: Services management */}
          {activeTab === "services" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">服务项目配置中心</h3>
                <span className="text-[11px] text-slate-400">决定前台及小程序可供预约的所有品类</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {servicesData.map((serv) => (
                  <div key={serv.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-800">{serv.name}</h4>
                      <span className="px-2 py-0.5 bg-blue-105 text-blue-700 rounded text-[9px] font-bold">
                        {serv.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{serv.description}</p>
                    
                    <div className="mt-4 pt-2.5 border-t border-slate-200/50 flex justify-between items-center text-xs">
                      <span className="font-mono text-indigo-600 font-bold">￥{serv.price}</span>
                      <span className="text-slate-400">时长: {serv.duration} 分钟</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs 7: Inventory management */}
          {activeTab === "inventory" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative w-80">
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="按名称或分类搜索商品库存..."
                    className="bg-slate-50 border border-slate-200 rounded-xl px-10 py-2 w-full text-xs"
                  />
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-rose-600 font-semibold">
                    * 触发预警商品底色标红，可执行极速"库房补货"补充库存。
                  </span>
                  <button
                    onClick={handleOpenCreateInventory}
                    className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90"
                    style={{ backgroundColor: THEME.PRIMARY }}
                  >
                    <Plus size={14} />
                    新增商品
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest">
                      <th className="py-3 px-4 font-bold">物资名称</th>
                      <th className="py-3 px-4 font-bold">物资分类</th>
                      <th className="py-3 px-4 font-bold">当前库存</th>
                      <th className="py-3 px-4 font-bold">安全库存容量</th>
                      <th className="py-3 px-4 font-bold">销售标价</th>
                      <th className="py-3 px-4 font-bold text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => {
                      const isLowStock = item.stock <= item.minStock;
                      return (
                        <tr key={item.id} className={`border-b border-slate-55/65 hover:bg-slate-50/50 ${
                          isLowStock ? "bg-rose-50/70" : ""
                        }`}>
                          <td className="py-3 px-4 font-bold text-slate-700 flex items-center gap-1.5">
                            {isLowStock && <AlertTriangle size={14} className="text-rose-600 animate-bounce" />}
                            {item.name}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{item.category}</td>
                          <td className={`py-3 px-4 font-mono font-extrabold ${isLowStock ? "text-rose-650" : "text-slate-800"}`}>
                            {item.stock} {item.unit}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{item.minStock} {item.unit}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">￥{item.price}</td>
                          <td className="py-3 px-4 text-center space-x-2">
                            <button
                              onClick={() => handleRestock(item.id)}
                              className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-700 rounded-lg text-[10px] font-bold transition-all shadow-xs"
                            >
                              + 补库
                            </button>
                            <button
                              onClick={() => handleOpenEditInventory(item)}
                              className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-700 rounded-lg text-[10px] font-bold transition-all shadow-xs text-indigo-600"
                            >
                              <Edit size={10} className="inline mr-0.5" />编辑
                            </button>
                            <button
                              onClick={() => handleDeleteInventory(item.id)}
                              className="px-2.5 py-1 bg-white hover:bg-red-600 hover:text-white border border-slate-200 hover:border-red-700 rounded-lg text-[10px] font-bold transition-all shadow-xs text-red-500"
                            >
                              <Trash size={10} className="inline mr-0.5" />删除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {showInventoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">{editingInventory ? "编辑商品" : "新增商品"}</h3>
                      <button onClick={() => setShowInventoryModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">商品名称 *</label>
                      <input type="text" value={invForm.name} onChange={e => setInvForm({...invForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">分类</label>
                        <select value={invForm.category} onChange={e => setInvForm({...invForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                          <option value="宠粮">宠粮</option>
                          <option value="洗护用品">洗护用品</option>
                          <option value="零食">零食</option>
                          <option value="药品">药品</option>
                          <option value="玩具">玩具</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">单位</label>
                        <input type="text" value={invForm.unit} onChange={e => setInvForm({...invForm, unit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">库存数</label>
                        <input type="number" value={invForm.stock} onChange={e => setInvForm({...invForm, stock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">安全库存</label>
                        <input type="number" value={invForm.minStock} onChange={e => setInvForm({...invForm, minStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">售价 (￥)</label>
                        <input type="number" value={invForm.price} onChange={e => setInvForm({...invForm, price: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowInventoryModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all">取消</button>
                      <button onClick={handleSubmitInventory} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ backgroundColor: THEME.PRIMARY }}>{editingInventory ? "保存修改" : "创建商品"}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs 8: Sales reports */}
          {activeTab === "reports" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-100">
                收银台经营对账记录 (Sales transaction logs)
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sales.map((sale) => (
                  <div key={sale.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-[4px] text-[8px] font-bold">
                          {sale.category}
                        </span>
                        {sale.description}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">交易时间: {sale.time} | 经手人: {sale.operator}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-slate-850 font-bold text-sm">￥{sale.amount}</div>
                      <div className="text-[10px] text-slate-400">{sale.paymentMethod}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Superadmin restricted exclusive panels */}
          {isSuperAdmin && (
            <>
              {/* Tabs 9: Employees and Commission performance */}
              {activeTab === "staff" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">在岗技师提成与排班排班大区</h3>
                    <span className="text-[11px] text-rose-600 font-bold">仅超级管理员有权操作及授权</span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {employeesData.map((staff) => {
                      // Simulating dynamic commission formula
                      const totalSalaryWithCommission = staff.baseSalary + Math.ceil(staff.monthlyRevenue * (staff.commissionRate / 100));
                      return (
                        <div key={staff.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-slate-800">{staff.name}</h4>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold">
                              {staff.role}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 space-y-1 bg-white p-2.5 rounded-lg border border-slate-100 font-mono">
                            <div className="flex justify-between">
                              <span>今日排班：</span><span className="text-slate-800 font-semibold">{staff.shift}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>底薪：</span><span className="text-slate-800">￥{staff.baseSalary}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>提成比例：</span><span className="text-orange-600 font-bold">{staff.commissionRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>本月业绩：</span><span className="text-slate-800">￥{staff.monthlyRevenue}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-100 font-extrabold text-xs">
                              <span>预计总薪资：</span><span className="text-indigo-600">￥{totalSalaryWithCommission}</span>
                            </div>
                          </div>

                          {/* Quick shifts actions */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button
                              onClick={() => {
                                setEmployees(employees.map(e => e.id === staff.id ? { ...e, shift: "早班 (09:00-18:00)" } : e));
                              }}
                              className="py-1 bg-white hover:bg-slate-200 text-slate-600 text-[10px] rounded-lg border border-slate-250 transition-all font-semibold"
                            >
                              切为早班
                            </button>
                            <button
                              onClick={() => {
                                setEmployees(employees.map(e => e.id === staff.id ? { ...e, shift: "晚班 (12:00-21:00)" } : e));
                              }}
                              className="py-1 bg-white hover:bg-slate-200 text-slate-600 text-[10px] rounded-lg border border-slate-250 transition-all font-semibold"
                            >
                              切为晚班
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tabs 10: System operation logs */}
              {activeTab === "logs" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-150">
                    安全反作弊与系统实时日志审计 (System Operation Logs)
                  </h3>

                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3.5 bg-slate-55/65 rounded-xl text-xs flex justify-between items-center text-slate-600 font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-850">{log.operator}</span>
                            <span className="text-[10px] text-slate-400">({log.role})</span>
                            <span className="text-slate-800">{log.action}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            操作IP地址: {log.ip} | 审计时间: {log.time}
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                          log.status === "警告" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs 11: Store config */}
              {activeTab === "settings" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-100">
                    门店运行综合参数设置 (Store settings)
                  </h3>

                  <div className="grid grid-cols-2 gap-6 text-xs text-slate-600">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">店铺物理名称 (Name)</label>
                        <input type="text" defaultValue="萌宠智能高阶沙龙店" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">日常营业时间范围 (Business Hours)</label>
                        <input type="text" defaultValue="周一至周日 09:00 - 21:00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">联络固定电话 (Telephone)</label>
                        <input type="text" defaultValue="021-88992211" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">线下门店详细定位 (Location Address)</label>
                        <input type="text" defaultValue="上海市长宁区天山路尊享养宠创意街区C栋两层" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => alert("门店最新配置已安全推送至小程序与各工作终端！")}
                      className="px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:opacity-90"
                      style={{ backgroundColor: THEME.PRIMARY }}
                    >
                      保存全局参数规范
                    </button>
                  </div>
                </div>
              )}

              {/* Tabs 13: User Management (Super Admin Only) */}
              {activeTab === "users" && isSuperAdmin && (
                <UserManagementTab />
              )}
            </>
          )}

          {/* Tabs 12: AI 智能客服与知识库 (AI Assistant and KB settings) */}
          {activeTab === "ai-assistant" && (
                <div className="space-y-6 animate-fade-in">
                  {/* Top quick banner */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex items-center justify-between">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-md">Role-Based Knowledge Base (RAG)</span>
                      <h3 className="text-base font-black">双尾智能AI本地知识库配置与多端客服中心</h3>
                      <p className="text-xs text-blue-100">
                        在这里编辑和部署各端（老板/店员/会员顾客）的专属知识库。AI 智能体将无缝感知并严格引用您最新录入的条款规范。
                      </p>
                    </div>
                    <button 
                      onClick={fetchKbData}
                      disabled={kbLoading}
                      className="h-10 w-10 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-45"
                    >
                      <RefreshCw size={18} className={kbLoading ? "animate-spin" : ""} />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-6">
                    {/* Left: KB Editor */}
                    <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col space-y-4 shadow-xs">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                            <Database size={14} className="text-blue-500" />
                            内部数据源与知识库编辑
                          </h3>
                          <p className="text-[11px] text-slate-400">选择对应的客户端角色，自定义其对接的专属知识内容</p>
                        </div>

                        <select
                          value={selectedKbKey}
                          onChange={(e) => setSelectedKbKey(e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="admin">💼 管理端：经营/考勤/佣金决策知识库</option>
                          <option value="staff">✂️ 员工端：洗护美容实操与安全应急手册</option>
                          <option value="customer">🐶 顾客端：日常健康自助与会员 FAQ 答疑</option>
                        </select>
                      </div>

                      {/* Info Banner showing purpose */}
                      <div className="bg-blue-50/40 border border-blue-100/70 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
                        <p className="font-extrabold text-blue-800 flex items-center gap-1.5">
                          <ShieldAlert size={13} className="text-blue-600" />
                          {selectedKbKey === "admin" 
                            ? "专属使用者：超级管理员（老板） & 店长" 
                            : selectedKbKey === "staff" 
                            ? "专属使用者：普通店员、洗护师、美容技师" 
                            : "专属使用者：到店或在小程序注册的会员、普通顾客"
                          }
                        </p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {selectedKbKey === "admin" 
                            ? "此知识库专门回复有关连锁店面日常盈亏比、提成系数核定、早晚班交接岗位责任及迟到早退考勤处理办法等内部决策问题。" 
                            : selectedKbKey === "staff" 
                            ? "此知识库覆盖日常技师实操：如何给贵宾等卷毛犬吹剪造型、怎么处理敏感红疹宠物（燕麦消炎配方比例）以及猫眯洗浴情绪疏解防咬指南。" 
                            : "本知识库用于向所有人公开自助。包含宠物禁食毒物清单（如洋葱、大蒜阻断）、黄金/钻石会员储值及退换预约取消扣费条款，避免法务纠纷。"
                          }
                        </p>
                      </div>

                      {/* Document Import Sector (With drag/drop or click) */}
                      <div className="border border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/10 rounded-2xl p-4 transition-all flex flex-col items-center justify-center text-center space-y-2.5 relative group overflow-hidden">
                        {fileUploading && (
                          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center space-y-3 z-20 transition-all">
                            <span className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-blue-800 animate-pulse">✨ AI 正在深度阅读并智能转换为 Markdown...</p>
                            <p className="text-[10px] text-slate-400">（这通常需要几秒钟，正在提取文字、规则与表格）</p>
                          </div>
                        )}
                        <div className="p-2.5 bg-blue-50 rounded-full text-blue-600 group-hover:scale-105 transition-transform duration-200">
                          <Upload size={18} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1">
                            📄 导入本地文档/PDF/表格/照片
                          </p>
                          <p className="text-[10px] text-slate-500 leading-relaxed max-w-lg">
                            支持 <strong className="text-slate-700">PDF (.pdf)</strong>、<strong className="text-slate-700">文字文档 (.txt)</strong>、以及 <strong className="text-slate-700">纸张照片/规章截图 (.png, .jpg, .jpeg)</strong>。智能 AI 会全自动帮您整理并转换为格式美观的 Markdown。
                          </p>
                        </div>
                        <label className="cursor-pointer bg-white hover:bg-slate-100 border border-slate-200 text-slate-705 px-4.5 py-1.5 rounded-xl text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5">
                          <span>选择本地文件</span>
                          <input
                            type="file"
                            accept=".pdf, .txt, .png, .jpg, .jpeg"
                            onChange={handleKbFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex-1 min-h-[350px] flex flex-col relative">
                        {kbLoading ? (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
                            <span className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : null}
                        <textarea
                          value={kbEditorContent}
                          onChange={(e) => setKbEditorContent(e.target.value)}
                          placeholder="请输入 Markdown 格式的知识库文档..."
                          className="w-full h-full flex-grow bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-mono leading-relaxed text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[380px]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          字数: {kbEditorContent.length} 字 | 格式: Markdown 标准 | 支持即时更新
                        </span>

                        <div className="flex items-center gap-3">
                          {kbSaveSuccess && (
                            <span className="text-xs text-emerald-600 font-bold animate-pulse">{kbSaveSuccess}</span>
                          )}
                          <button
                            onClick={saveKbData}
                            disabled={kbSaveLoading}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            {kbSaveLoading ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : "发布并覆盖云端知识库"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Conversation sandboxed simulator */}
                    <div className="col-span-12 lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col h-[650px] text-white shadow-xl relative">
                      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <h4 className="text-xs font-bold text-slate-100">AI 助理前台实机调试沙盒</h4>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">已连接：【{selectedKbKey === "admin" ? "经营管理库" : selectedKbKey === "staff" ? "洗护规程库" : "日常护理库"}】</p>
                        </div>
                        <span className="text-[10px] bg-slate-800/80 px-2.5 py-1 rounded-lg text-emerald-400 border border-slate-700/60 font-mono font-bold">
                          {isSuperAdmin ? "SUPER_ADMIN" : "MANAGER"}
                        </span>
                      </div>

                      {/* Chat screen displaying messages */}
                      <div className="flex-grow overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-850">
                        {aiChatMessages.map((m, i) => (
                          <div key={i} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500">
                              <span>{m.time}</span>
                              <span className={`font-bold ${m.sender === "user" ? "text-blue-400" : "text-amber-450"}`}>
                                {m.sender === "user" ? "管理员 (提问)" : "✨ 萌宠管家AI"}
                              </span>
                            </div>
                            <div className={`p-3 rounded-2xl text-xs max-w-[90%] leading-relaxed whitespace-pre-wrap ${
                              m.sender === "user" 
                                ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10" 
                                : "bg-slate-850/80 text-slate-200 rounded-tl-none border border-slate-800/80 font-sans"
                            }`}>
                              {m.text}
                            </div>
                          </div>
                        ))}
                        {aiChatLoading && (
                          <div className="flex items-start flex-col">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold text-amber-450 animate-pulse">✨ AI 正在极速检索最新发布的知识库...</span>
                            </div>
                            <div className="p-3.5 bg-slate-850 rounded-2xl rounded-tl-none border border-slate-800 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Suggestion tags to test customization quickly */}
                      <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2 mb-3 shrink-0">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                          <Sparkles size={11} className="text-amber-400" />
                          沙盒快捷测试（AI将结合最新修改回答）：
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => sendAiChatMessage("我们店里的员工提成比例有什么规则？")}
                            disabled={aiChatLoading}
                            className="bg-slate-850 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 px-3 py-1.5 text-[10px] rounded-lg border border-slate-800 font-semibold"
                          >
                            💸 技师提成
                          </button>
                          <button
                            onClick={() => sendAiChatMessage("早晚班怎么排定？迟到考勤怎么处罚？")}
                            disabled={aiChatLoading}
                            className="bg-slate-850 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 px-3 py-1.5 text-[10px] rounded-lg border border-slate-800 font-semibold"
                          >
                            ⏰ 考勤排班
                          </button>
                          <button
                            onClick={() => sendAiChatMessage("洗护主粮的安全库存预警线和自动订货周期是多少？")}
                            disabled={aiChatLoading}
                            className="bg-slate-850 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 px-3 py-1.5 text-[10px] rounded-lg border border-slate-800 font-semibold"
                          >
                            📦 库存预警
                          </button>
                        </div>
                      </div>

                      {/* Chat input box */}
                      <div className="relative shrink-0">
                        <input
                          type="text"
                          value={aiChatInput}
                          onChange={(e) => setAiChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendAiChatMessage()}
                          placeholder="向 AI 调试提问（可测试刚刚保存的修改）..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-16 py-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-250 font-medium placeholder-slate-600 shadow-inner"
                        />
                        <button
                          onClick={() => sendAiChatMessage()}
                          disabled={aiChatLoading || !aiChatInput.trim()}
                          className="absolute right-2 top-2 h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold active:scale-95 transition-all disabled:opacity-40"
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
 
        </div>
      </main>

      {/* AI 浮动聊天侧边栏 - 使用共享组件 */}
      <AIChat role="ADMIN" kbType="admin" mode="sidebar" />

    </div>
  );
}
