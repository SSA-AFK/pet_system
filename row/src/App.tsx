import React, { useState, useEffect } from "react";
import { UserRole, Pet, Client, Appointment, ServiceItem, InventoryItem, Employee, SalesRecord, SystemLog } from "./types";
import {
  initialPets,
  initialClients,
  initialServices,
  initialAppointments,
  initialInventory,
  initialEmployees,
  initialSales,
  initialLogs
} from "./data";
import LoginLayout from "./components/LoginLayout";
import LandingPage from "./components/LandingPage";
import MiniAppLogin from "./components/MiniAppLogin";
import CustomerBooking from "./components/CustomerBooking";
import AdminWorkspace from "./components/AdminWorkspace";
import GroomerMobile from "./components/GroomerMobile";
import CustomerMobile from "./components/CustomerMobile";
import { LogOut, Smartphone, Zap } from "lucide-react";
import { setAuthToken } from "./hooks/useApiData";

const isDevMode = import.meta.env.VITE_DEV_MODE === "true";

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return hash;
}

export default function App() {
  const hash = useHashRoute();
  const isMiniApp = hash.startsWith("#/miniapp");

  const [currentUser, setCurrentUser] = useState<{
    role: UserRole | null;
    username: string;
    displayName: string;
  }>({
    role: null,
    username: "",
    displayName: ""
  });

  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [sales, setSales] = useState<SalesRecord[]>(initialSales);
  const [logs, setLogs] = useState<SystemLog[]>(initialLogs);

  /* 落地页相关状态 */
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const updatePetStatus = (petId: string, status: Pet["status"]) => {
    setPets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          const newLog: SystemLog = {
            id: "L" + Math.floor(200 + Math.random() * 800),
            operator: currentUser.displayName,
            role: currentUser.role || "UNKNOWN",
            action: `更新宠物 【${p.name}】 的在店状态为 [${status === "bath" ? "洗浴中" : status === "groom" ? "美容中" : "已完工"}]`,
            time: new Date().toISOString().replace("T", " ").substring(0, 19),
            ip: "192.168.1.130",
            status: "成功"
          };
          setLogs((prevLogs) => [newLog, ...prevLogs]);
          return { ...p, status };
        }
        return p;
      })
    );
  };

  const updateAppointmentNotes = (appId: string, notes: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appId) {
          return { ...a, progressNotes: notes };
        }
        return a;
      })
    );
  };

  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments((prev) => [newApp, ...prev]);
    const newLog: SystemLog = {
      id: "L" + Math.floor(200 + Math.random() * 800),
      operator: "微信小程序系统",
      role: "CUSTOMER",
      action: `客户 【${newApp.clientName}】 在线自选预约 [${newApp.serviceName}]`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19),
      ip: "124.89.231.54",
      status: "成功"
    };
    setLogs((prevLogs) => [newLog, ...prevLogs]);
  };

  const handleLoginSuccess = (role: UserRole, username: string, name: string) => {
    setCurrentUser({ role, username, displayName: name });
    setShowLogin(false);

    const freshLog: SystemLog = {
      id: "L" + Math.floor(200 + Math.random() * 800),
      operator: name,
      role: role === UserRole.SUPER_ADMIN ? "超级管理员" : role === UserRole.MANAGER ? "店长 / 管理员" : role === UserRole.STAFF ? "普通员工" : "会员顾客",
      action: `成功登录宠物系统门户 (${role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER ? "PC端后台" : "手机微信小程序"})`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19),
      ip: "192.168.1.100",
      status: "成功"
    };
    setLogs((prevLogs) => [freshLog, ...prevLogs]);
  };

  const handleLogout = () => {
    const goodbyeLog: SystemLog = {
      id: "L" + Math.floor(200 + Math.random() * 800),
      operator: currentUser.displayName,
      role: String(currentUser.role),
      action: "安全退出系统连接",
      time: new Date().toISOString().replace("T", " ").substring(0, 19),
      ip: "192.168.1.100",
      status: "成功"
    };
    setLogs((prevLogs) => [goodbyeLog, ...prevLogs]);
    setCurrentUser({ role: null, username: "", displayName: "" });
    setShowAdmin(false);
    setAuthToken(null);
  };

  const handleQuickRoleSwitch = (role: UserRole) => {
    let name = "张老板";
    let uName = "admin";
    if (role === UserRole.MANAGER) { name = "陈店长"; uName = "manager"; }
    else if (role === UserRole.STAFF) { name = "高级美容师丽丽"; uName = "staff"; }
    else if (role === UserRole.CUSTOMER) { name = "陈女士 (黄金卡会员)"; uName = "member"; }
    handleLoginSuccess(role, uName, name);
  };

  // 顾客在线预约（无需登录）
  if (hash === "#/book") {
    return <CustomerBooking />;
  }

  // Mini App Route
  if (isMiniApp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-pink-50 font-sans text-slate-800 flex flex-col relative">
        {isDevMode && currentUser.role && (
          <section className="bg-white/80 backdrop-blur border-b border-orange-100 text-slate-600 py-2 px-4 flex justify-between items-center text-xs z-40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              <span className="font-semibold">🛠️ 快速切换：</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleQuickRoleSwitch(UserRole.STAFF)} className={`px-2.5 py-1 rounded-lg font-bold transition-all ${currentUser.role === UserRole.STAFF ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}>员工</button>
              <button onClick={() => handleQuickRoleSwitch(UserRole.CUSTOMER)} className={`px-2.5 py-1 rounded-lg font-bold transition-all ${currentUser.role === UserRole.CUSTOMER ? "bg-pink-500 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}>顾客</button>
            </div>
          </section>
        )}

        {!currentUser.role ? (
          <MiniAppLogin onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center px-4 py-2 bg-white/80 backdrop-blur border-b border-orange-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold tracking-wider text-slate-600">
                <Smartphone size={14} className="text-orange-500" />
                宠物智管小程序
              </div>
              <button onClick={handleLogout} className="hover:text-red-500 text-slate-400 transition-all font-bold flex items-center gap-1">
                <LogOut size={12} />
                退出
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {currentUser.role === UserRole.STAFF ? (
                <GroomerMobile pets={pets} appointments={appointments} employees={employees} currentStaffName={currentUser.displayName} updatePetStatus={updatePetStatus} updateAppointmentNotes={updateAppointmentNotes} />
              ) : (
                <CustomerMobile pets={pets} appointments={appointments} services={services} clients={clients} currentUserPhone="13800138000" onAddAppointment={handleAddAppointment} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Web Route (Default) — 落地页 + 登录模态框 + 管理后台
  if (showAdmin && currentUser.role) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col relative">
        {isDevMode && (
          <section className="bg-slate-900 border-b border-slate-800 text-slate-350 py-2 px-4 flex justify-between items-center text-xs z-40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="font-semibold text-slate-200">🛠️ 免退出快捷换岗测评：</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleQuickRoleSwitch(UserRole.SUPER_ADMIN)} className={`px-2.5 py-1 rounded-lg font-bold transition-all ${currentUser.role === UserRole.SUPER_ADMIN ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>1. 老板账号 (PC)</button>
              <button onClick={() => handleQuickRoleSwitch(UserRole.MANAGER)} className={`px-2.5 py-1 rounded-lg font-bold transition-all ${currentUser.role === UserRole.MANAGER ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>2. 店长账号 (PC)</button>
            </div>
          </section>
        )}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
          <AdminWorkspace
            role={currentUser.role}
            userName={currentUser.displayName}
            pets={pets}
            clients={clients}
            appointments={appointments}
            services={services}
            inventory={inventory}
            employees={employees}
            sales={sales}
            logs={logs}
            onLogOut={handleLogout}
            setPets={setPets}
            setClients={setClients}
            setAppointments={setAppointments}
            setServices={setServices}
            setInventory={setInventory}
            setEmployees={setEmployees}
            setSales={setSales}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <LandingPage
        currentUser={currentUser.role ? { role: currentUser.role, username: currentUser.username, displayName: currentUser.displayName } : null}
        onLoginClick={() => setShowLogin(true)}
        onLogout={handleLogout}
        onEnterAdmin={() => {
          if (currentUser.role) {
            setShowAdmin(true);
          } else {
            setShowLogin(true);
          }
        }}
      />
      <LoginLayout
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
