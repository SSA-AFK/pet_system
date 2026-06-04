import { Pet, Client, Appointment, ServiceItem, InventoryItem, Employee, SalesRecord, SystemLog } from "./types";

export const initialPets: Pet[] = [
  {
    id: "P001",
    name: "麦兜",
    type: "dog",
    breed: "比熊犬",
    age: "1岁8个月",
    ownerName: "陈女士",
    ownerPhone: "13800138000",
    avatar: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=200",
    healthNotes: "轻微泪痕，对牛肉过敏。皮肤有些许干燥。",
    status: "bath"
  },
  {
    id: "P002",
    name: "糯米",
    type: "cat",
    breed: "布偶猫",
    age: "11个月",
    ownerName: "张先生",
    ownerPhone: "13900139000",
    avatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200",
    healthNotes: "长毛易打结，耳朵容易堆积褐色耳垢，需精细清理。",
    status: "groom"
  },
  {
    id: "P003",
    name: "坦克",
    type: "dog",
    breed: "法国斗牛犬",
    age: "3岁",
    ownerName: "王先生",
    ownerPhone: "13511223344",
    avatar: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=200",
    healthNotes: "鼻腔短，夏天洗吹需注意风温不宜过高，防止中暑。",
    status: "waiting"
  },
  {
    id: "P004",
    name: "七七",
    type: "cat",
    breed: "英国短毛猫",
    age: "2岁",
    ownerName: "李小姐",
    ownerPhone: "13766554433",
    avatar: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=200",
    healthNotes: "体型偏胖，毛发浓密，洗护时抗拒吹风机声音。",
    status: "completed"
  }
];

export const initialClients: Client[] = [
  {
    id: "C001",
    name: "陈女士",
    phone: "13800138000",
    level: "黄金卡会员",
    points: 1240,
    balance: 850,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    joinDate: "2025-01-12"
  },
  {
    id: "C002",
    name: "张先生",
    phone: "13900139000",
    level: "钻石卡会员",
    points: 3820,
    balance: 2400,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    joinDate: "2024-06-18"
  },
  {
    id: "C003",
    name: "王先生",
    phone: "13511223344",
    level: "普通会员",
    points: 350,
    balance: 120,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    joinDate: "2025-04-05"
  },
  {
    id: "C004",
    name: "李小姐",
    phone: "13766554433",
    level: "黄金卡会员",
    points: 1890,
    balance: 620,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    joinDate: "2024-11-20"
  }
];

export const initialServices: ServiceItem[] = [
  {
    id: "S001",
    name: "超精细深层洗护-小型犬",
    category: "洗护",
    price: 88,
    duration: 60,
    description: "含剪指甲、修脚底毛、掏耳道、挤肛门腺、草本杀菌双效香波洗浴。"
  },
  {
    id: "S002",
    name: "日系棉花糖精修造型-小型犬",
    category: "美容",
    price: 188,
    duration: 90,
    description: "专业美容师一对一手工精细手剪造型，含基础深层洗浴与全身毛发拉松。"
  },
  {
    id: "S003",
    name: "舒缓减压草本温水SPA",
    category: "SPA护理",
    price: 120,
    duration: 30,
    description: "进口死海盐+薄荷草本精油，对除臭防过敏、舒缓红疹红痒效果极佳。"
  },
  {
    id: "S004",
    name: "猫咪深度无水SPA/经典水洗",
    category: "洗护",
    price: 138,
    duration: 75,
    description: "使用猫咪专用极温洗剂，配戴情绪面罩防惊吓，去浮毛死毛，深层干爽滋润。"
  },
  {
    id: "S005",
    name: "豪华舒适恒温寄养间-猫犬通用",
    category: "寄养",
    price: 80,
    duration: 1440,
    description: "配独立新风系统、纯净饮水器、高清摄像头，每日两次消毒及全天监控。"
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: "A001",
    petId: "",
    petName: "麦兜",
    petType: "dog",
    breed: "比熊",
    clientName: "陈女士",
    clientPhone: "13800138000",
    serviceName: "日系棉花糖精修造型-小型犬",
    groomerName: "阿明 (洗护师)",
    dateTime: "2026-06-02 10:00",
    status: "processing",
    totalPrice: 188,
    price: 188,
    progressNotes: "已完成基础眼耳清理与温水第一道洗涤，吹干并起造型中。"
  },
  {
    id: "A002",
    petId: "",
    petName: "糯米",
    petType: "dog",
    breed: "柯基",
    clientName: "张先生",
    clientPhone: "13900139000",
    serviceName: "超精细深层洗护-小型犬",
    groomerName: "丽丽 (高级美容师)",
    dateTime: "2026-06-02 11:30",
    status: "pending",
    totalPrice: 88,
    price: 88,
    progressNotes: "宠物刚到店，安排在3号等候笼中，等待员工排班洗护。"
  },
  {
    id: "A003",
    petId: "",
    petName: "坦克",
    petType: "dog",
    breed: "金毛寻回犬",
    clientName: "王先生",
    clientPhone: "13511223344",
    serviceName: "舒缓减压草本温水SPA",
    groomerName: "阿明 (洗护师)",
    dateTime: "2026-06-02 14:00",
    status: "pending",
    totalPrice: 120,
    price: 120,
    progressNotes: ""
  },
  {
    id: "A004",
    petId: "",
    petName: "七七",
    petType: "cat",
    breed: "布偶猫",
    clientName: "李小姐",
    clientPhone: "13766554433",
    serviceName: "猫咪深度无水SPA/经典水洗",
    groomerName: "丽丽 (高级美容师)",
    dateTime: "2026-06-01 15:30",
    status: "completed",
    totalPrice: 138,
    price: 138,
    progressNotes: "项目已完成。毛发蓬松度良好，猫咪情绪基本稳定，已由主人带回。"
  }
];

export const initialInventory: InventoryItem[] = [
  {
    id: "I001",
    name: "精选低温烘焙全价小型犬粮 2kg",
    category: "宠粮",
    stock: 25,
    unit: "袋",
    minStock: 10,
    price: 198
  },
  {
    id: "I002",
    name: "新西兰风干脱水鲜肉冻干 500g",
    category: "零食",
    stock: 4, // 警告低于minStock
    unit: "罐",
    minStock: 12,
    price: 245
  },
  {
    id: "I003",
    name: "燕麦低敏修护舒缓香波 1L",
    category: "洗护用品",
    stock: 3, // 警告
    unit: "瓶",
    minStock: 8,
    price: 156
  },
  {
    id: "I004",
    name: "多效深层洗耳液 120ml",
    category: "药品",
    stock: 30,
    unit: "盒",
    minStock: 15,
    price: 68
  },
  {
    id: "I005",
    name: "无味超细豌豆猫砂 6L",
    category: "洗护用品",
    stock: 50,
    unit: "包",
    minStock: 20,
    price: 29
  },
  {
    id: "I006",
    name: "天然咬牙耐咬牛皮棒 10支装",
    category: "零食",
    stock: 6, // 警告
    unit: "包",
    minStock: 15,
    price: 38
  }
];

export const initialEmployees: Employee[] = [
  {
    id: "E001",
    name: "张老板",
    role: "店主 / 超级管理员",
    phone: "18888888888",
    shift: "全天班",
    attendance: "已签到",
    attendanceTime: "08:45",
    monthlyRevenue: 28540,
    baseSalary: 12000,
    commissionRate: 0
  },
  {
    id: "E002",
    name: "陈店长",
    role: "店长 / 管理员",
    phone: "18666666666",
    shift: "全天班",
    attendance: "已签到",
    attendanceTime: "08:52",
    monthlyRevenue: 15400,
    baseSalary: 6500,
    commissionRate: 5
  },
  {
    id: "E003",
    name: "阿明",
    role: "洗护师",
    phone: "13500001111",
    shift: "早班 (09:00-18:00)",
    attendance: "已签到",
    attendanceTime: "08:58",
    monthlyRevenue: 8900,
    baseSalary: 3500,
    commissionRate: 15
  },
  {
    id: "E004",
    name: "丽丽",
    role: "高级美容师",
    phone: "13222223333",
    shift: "晚班 (12:00-21:00)",
    attendance: "已签到",
    attendanceTime: "11:45",
    monthlyRevenue: 12800,
    baseSalary: 4500,
    commissionRate: 20
  }
];

export const initialSales: SalesRecord[] = [
  {
    id: "R001",
    category: "美容服务",
    description: "麦兜(比熊犬) - 日系棉花糖造型精修（已结算）",
    amount: 188,
    time: "2026-06-02 11:15",
    paymentMethod: "微信支付",
    operator: "陈店长"
  },
  {
    id: "R002",
    category: "商品购买",
    description: "新西兰风干鲜肉冻干 500g * 2罐",
    amount: 490,
    time: "2026-06-02 10:45",
    paymentMethod: "会员卡余额",
    operator: "阿明"
  },
  {
    id: "R003",
    category: "洗护服务",
    description: "七七(英国短毛猫) - 经典水洗无水SPA（已结算）",
    amount: 138,
    time: "2026-06-01 17:00",
    paymentMethod: "支付宝",
    operator: "丽丽"
  },
  {
    id: "R004",
    category: "商品购买",
    description: "精选低温烘焙狗粮 2kg * 1袋",
    amount: 198,
    time: "2026-06-01 14:20",
    paymentMethod: "微信支付",
    operator: "陈店长"
  }
];

export const initialLogs: SystemLog[] = [
  {
    id: "L001",
    operator: "张老板",
    role: "超级管理员",
    action: "登录系统并查看 5月份经营分析表",
    time: "2026-06-02 09:30:15",
    ip: "192.168.1.102",
    status: "成功"
  },
  {
    id: "L002",
    operator: "陈店长",
    role: "店长 / 管理员",
    action: "新增美容服务预约单 (麦兜 A001)",
    time: "2026-06-02 09:12:04",
    ip: "192.168.1.105",
    status: "成功"
  },
  {
    id: "L003",
    operator: "阿明",
    role: "洗护师",
    action: "提交麦兜服务进度 [已完成洗浴，进入剪毛阶段]",
    time: "2026-06-02 10:15:33",
    ip: "192.168.1.108",
    status: "成功"
  },
  {
    id: "L004",
    operator: "陈店长",
    role: "店长",
    action: "修改 [新西兰风干脱水鲜肉冻干] 售价为 245",
    time: "2026-06-01 16:45:00",
    ip: "192.168.1.105",
    status: "成功"
  }
];
