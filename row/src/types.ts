export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN", // Boss/Owner (超级管理员)
  MANAGER = "MANAGER",         // Store Manager (店长)
  STAFF = "STAFF",             // Groomer/Wash Specialist (普通店员)
  CUSTOMER = "CUSTOMER"        // Client/Member (客户/移动小程序端)
}

export interface Pet {
  id: string;
  name: string;
  type: "dog" | "cat" | "other";
  breed: string;
  age: string;
  ownerName: string;
  ownerPhone: string;
  avatar: string;
  healthNotes: string;
  status: "waiting" | "bath" | "groom" | "completed";
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  level: "普通用户" | "普通会员" | "黄金卡会员" | "钻石卡会员";
  points: number;
  balance: number;
  avatar: string;
  joinDate: string;
}

export interface Appointment {
  id: string;
  petId: string;
  petName: string;
  petType: "dog" | "cat" | "other";
  petAge?: string;
  petWeight?: string;
  breed: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  clientWechat?: string;
  dateTime: string;
  groomerName: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  totalPrice?: number;
  progressNotes: string;
  price?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: "洗护" | "美容" | "寄养" | "SPA护理";
  price: number;
  duration: number; // 分钟
  description: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "宠粮" | "洗护用品" | "零食" | "药品" | "玩具";
  stock: number;
  unit: string;
  minStock: number; // 安全库存
  price: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  shift: "早班 (09:00-18:00)" | "晚班 (12:00-21:00)" | "全天班" | "休息";
  attendance: "已签到" | "迟到" | "未签到" | "已签退";
  attendanceTime?: string;
  monthlyRevenue: number; // 月度业绩贡献
  baseSalary: number;
  commissionRate: number; // 提成比例 %
}

export interface SalesRecord {
  id: string;
  category: string;
  description: string;
  amount: number;
  time: string;
  paymentMethod: "微信支付" | "支付宝" | "会员卡余额" | "刷卡";
  operator: string;
}

export interface SystemLog {
  id: string;
  operator: string;
  role: string;
  action: string;
  time: string;
  ip: string;
  status: "成功" | "警告" | "失败";
}
