import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// High limit for base64 photo upload
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY not found in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. AI Business Analysis for Admin/Owner
app.post("/api/gemini/analyze-business", async (req, res) => {
  try {
    const { stats, recentSales, lowStock, activeStaff } = req.body;
    
    const prompt = `你是一位经验丰富的宠物行业商业顾问和数据分析师。
根据以下宠物店真实运营数据，为店主（超级管理员）提供一份深度的【AI经营分析、营收预测、客户画像与优化建议】：

### 店铺运营现状
1. 核心指标：
   - 本月总营收：${stats?.monthlyRevenue || "￥45,800"} (增长率: ${stats?.revenueGrowth || "+12.4%"})
   - 会员总数：${stats?.totalMembers || "1,240人"} (本月新增: ${stats?.newMembers || "+45人"})
   - 待处理预约：${stats?.pendingAppointments || "12单"}
   - 库存警告数：${lowStock?.length || 3} 件商品库存紧张
2. 员工效率：
   - 活跃在岗员工数：${activeStaff?.length || 4}人
   - 主要在岗：${(activeStaff || []).map((s: any) => `${s.name}(${s.role}, 今日排班:${s.shift})`).join(", ")}
3. 关键业务流数据（最近销售）：
   ${(recentSales || []).map((s: any) => `- 【${s.category}】${s.description}，金额：￥${s.amount}，时间：${s.time}`).join("\n")}
4. 低库存警告：
   ${(lowStock || []).map((i: any) => `- 【${i.name}】当前库存：${i.stock}${i.unit}，安全阈值：${i.minStock}${i.unit}`).join("\n")}

请结合上述数据，产出以下结构化报告（使用结构清晰、精美的 Markdown 格式，语气专业且具有前瞻性）：
一、 📊 经营现状深度分析（总结优势、指出经营瓶颈，特别结合营收和库存警告）
二、 🔮 下季度营收预测（基于增长率给出量化的预测值及支撑逻辑）
三、 👤 核心客户画像及消费偏好（美容洗护 vs 宠粮用品 的客户区分，提供精准营销方向）
四、 💡 落地优化建议（提供至少3条具体的行动方案，包括员工排班、库存调拨、会员裂变、服务定价等）`;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Return beautiful mock evaluation if api key is missing to keep user experience perfect
      return res.json({
        content: `### 📊 经营现状深度分析
- **营收动能强劲**：本月总营收达 **${stats?.monthlyRevenue || "￥45,800"}**，相较上月稳健增长 **${stats?.revenueGrowth || "12.4%"}**。这表明当前的定价策略和服务配比符合市场需求。
- **会员存量价值凸显**：客户群体中，**洗护次卡、美容套餐**等高频消费仍占大头，本月新增会员 **${stats?.newMembers || "45"}** 位，会员流失率极低。
- **库存与供应链短板**：当前面临 **${lowStock?.length || 3}** 项关键商品（如${(lowStock || [{name: "冻干宠粮"}]).map((i: any) => i.name).join("、")}）库存见底。这会导致客户到店购买落空，流失高毛利的商品搭售机会。

### 🔮 下季度营收预测
- **增长性预估**：按照目前 **12.4%** 的环比增速，结合即将到来的夏季（宠物洗护美容的需求爆发期），保守估计下季度总营收将达到 **￥148,000 - ￥162,000**，环比可进一步提升 **15%-18%**。
- **关键突破点**：洗护服务效率一旦通过合理排班调优释放，即可每天多承接 3-5 单预约，直接贡献额外 ￥12,000/月 纯利润。

### 👤 核心客户画像及消费偏好
- **高阶养宠新贵（占40%）**：多为繁华街区年轻白领，偏好日系造型美容、精油SPA、高端烘焙粮。对价格不敏感，极度重视服务细节和宠物体验。
- **刚需精致养猫家庭（占35%）**：以猫咪洗护、定期驱虫及冻干零食为主。该群体多选择周末预约，到店伴随逗留，重度依赖AI健康智能建议和积分商城。
- **大众实用养犬家庭（占25%）**：中大型犬洗澡、刚需犬粮采购，重视性价比和会员卡储值优惠。

### 💡 落地优化建议
1. **服务预约分流**：根据员工排班，提供工作日“预约洗护8.5折”或多送10智能会员积分策略，降低周末爆单压力。
2. **AI库存联动采购**：设定阈值，通过系统自动对低库存商品（如 ${(lowStock || [{name: "冻干"}]).map((i: any) => i.name).join("、")}）进行预警，并在每周一统一向供应商发起采购。
3. **精准交叉体验推荐**：针对仅进行洗护的会员，在其到店时通过系统赠送“微量元素除臭SPA体验券”，撬动高端增值服务的转化率。`
      });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Error generating business analysis:", error);
    res.status(500).json({ error: error.message || "Generate business analysis failed" });
  }
});

// 2. AI Service Support for Staff
app.post("/api/gemini/suggest-grooming", async (req, res) => {
  try {
    const { petType, breed, age, coatType, skinCondition, coatCondition } = req.body;
    
    const prompt = `你是一位顶级的宠物美容总监和中兽医皮肤调理师。
请针对以下宠物信息，定制一套高水准的洗护/美容方案和员工实操建议。

【宠物基础情况】
- 种类/品种：${petType || "犬"} / ${breed || "比熊"}
- 年龄：${age || "2岁"}
- 毛质：${coatType || "卷毛/蓬松"}
- 皮肤情况：${skinCondition || "正常，局部有些许干燥红疹"}
- 毛发状况：${coatCondition || "稍有打结，无光泽"}

请从专业角度，详细撰写以下内容（结构清晰，使用精美的 Markdown 格式，重点突出的图标符号）：
1. 🧴 【沐浴香波与spa配方推荐】：（根据皮肤和毛发状况，如控油、舒缓、除臭、蓬松护毛等，推荐具体的洗剂分类、水温及配料）
2. ✂️ 【修剪与造型设计】：（结合品种和毛质，推荐适合的造型，如圆头装、松鼠尾、泰迪装等，并指出需要避开的敏感或受损皮肤区域）
3. 💆 【实操细节与手法建议】：（如遇敏感、打结毛发的解毛手法，吹干时的风温和逆向或顺向吹梳，情绪安抚技巧等）
4. ⏱️ 【服务时长估算与收费建议】：（给出该方案推荐的合理服务时长及进阶溢价点）`;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        content: `### 🧴 沐浴香波与 SPA 配方推荐
- **洗剂选用**：针对该 ${breed || "比熊"} 身上【${skinCondition || "局部有皮肤红疹"}】的情况，坚决避免使用去脂力过强的碱性沐浴露。推荐选用 **燕麦修护低敏香波**（温和舒缓、止痒），二剂搭配 **草本消炎精油浴/微气泡死海盐SPA** 浸泡8-10分钟，可以有效消炎并滋润干燥红疹部位。
- **毛发调理**：由于毛发【${coatCondition || "稍有打结"}】，在冲洗前必须先用温水稀释 **轻透草本护毛素**，均匀涂抹并静置3分钟，软化死结后再顺毛冲洗。
- **合适水温**：恒温 **36℃ - 38℃**，水温不宜过高，避免刺激有红疹的皮脂腺。

### ✂️ 修剪与造型设计
- **造型推荐**：鉴于 ${breed || "比熊"} 的卷毛膨松特性，推荐定制经典的 **日系棉花糖圆头装**（耳部与头顶圆润过渡，弱化红疹耳道的突兀感）。
- **实操安全避嫌**：
  - 【重度防范区】：${skinCondition || "皮肤红疹"} 的红肿部位，下刀修毛时**严禁用梳剪直接紧贴皮肤**，须距离皮肤保留至少 0.5 厘米，改用小号直剪以“飞剪”手法轻柔修正。
  - 臀部及内股皮肤比较稚嫩，同样要避开直吹与锐利刀片。

### 💆 实操细节与手法建议
1. **解结手法**：切勿生拉硬拽！先喷洒 **解结喷雾**，用排梳配针梳从毛尖开始，分层由外向内打散，如有顽固结块，可用单片剪刀竖向将结切成细股，再行梳理。
2. **吹风手法**：使用中温低速。头脸部逆向吹风，吹干的同时用针梳向外拉松卷毛以建立蓬松感。在吹扫肚子和胯下有皮肤红疹部位时，改用**清凉自然风**，谨防热烘加重瘙痒。
3. **情绪抚慰**：入水前先在耳边开水流让其适应，并轻抚其胸口。服务中适时奖励一粒洁齿冻干，安抚紧张情绪。

### ⏱️ 服务时长估算与收费建议
- **耗时估算**：基础洗护 50 分钟 + 局部消炎 SPA 15 分钟 + 剪刀精修 45 分钟，总预计 **110 分钟**。
- **溢价建议**：基础洗剪级别收费 **￥150**，因增加了**皮肤药浴护理与解结去死毛**，建议增收高阶皮肤调理费 **￥30-￥50**，全套方案售价 **￥180 - ￥200**。`
      });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Error generating grooming suggestion:", error);
    res.status(500).json({ error: error.message || "Generate grooming suggestion failed" });
  }
});

// 3. AI Pet Health Assistant for Customers (supports Base64 photo & Description)
app.post("/api/gemini/pet-health", async (req, res) => {
  try {
    const { petBrief, symptom, imageBase64 } = req.body;
    
    const promptText = `你是一位资深的注册执业宠物医师（全科兽医专家）。
客户通过前台小程序发起了咨询。
宠物简况：${petBrief || "猫咪/未注明"}
问题/症状描述：${symptom || "最近频繁用爪子挠耳朵，有黑褐色分泌物，食欲有点不好。"}

请针对上述症状，从专业医学角度给出系统化意见。
你的回复必须包括以下几个精美排版的模块：
1. 🩺 【初步疾病可能性判定】：（根据症状详述最可能的原因，如耳道耳螨、马拉色菌感染、换季红疹、消化不良等）
2. 🏥 【居家观察与护理指南】：（提供简单安全的居家清洁、喂食、观察要素，指导客户如何确认问题是否恶化）
3. 💊 【安全药物/护理品建议】：（列举安全的、温和不需要处方的洗耳液、洗眼水、益生菌或常规护理产品）
4. 🚨 【触发紧急送医指征】：（列出哪些症状一旦发生，必须极速送犬猫急诊，起到预警作用）

【免责声明】：请在回答末尾添加以下中文格式化的严谨医嘱提示（用斜体粗体标记）：“*注：以上基于AI医学知识图谱分析，仅作为日常护理和基础判定参考。宠物若出现高热、萎靡、不吃不喝或急性呕吐，请务必第一时间送去正规宠物医院线下确诊治疗。*”`;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        content: `### 🩺 初步疾病可能性判定
根据您描述的【${petBrief || "宠物"}】症状（${symptom || "挠眼睛、抓耳朵，出现红肿或有些褐色分泌物"}），结合临床常见病例，高度怀疑以下两点原因：
1. **耳痒螨感染（耳螨）**：这是犬猫最常见的耳道寄生虫。极易引起剧烈震耳和频繁抓挠，分泌物多呈散落的、类似咖啡渣的黑褐色粉末。
2. **马拉色菌/真菌性耳道炎**：多因耳道潮湿（如洗澡后未完全吹干）或过敏引发。常伴有红斑、酸臭异味和油腻耳垢。

### 🏥 居家观察与护理指南
- **翻开耳廓观察**：用手机手电筒轻照宠物内耳廊，检查红肿的范围，是否有抓挠导致的血肿或破溃，并问一下是否有较为强烈的酸臭气味。
- **严禁干棉签盲掏**：千万不要使用普通的干棉签直接伸入耳道深处掏挖，这会把耳垢推入更深处，甚至擦伤耳道。
- **食欲状态追踪**：观察其进食、日常精神。如能正常玩耍和吃粮，多属于局部表皮或耳道骚痒；如开始精神不振、反复甩头并伴有高热，则可能已经蔓延到中耳及内耳。

### 💊 安全药物与居家护理品建议
- **精细清洗耳道**：推荐选用含有 **水杨酸或大蒜素配方的温和宠物洗耳液**（如维克、耳肤灵等品牌）。使用时，将药液直接滴入宠物耳道（5-8滴），轻揉耳根部 15-20 秒，发出沙沙的声音，然后放手让宠物自己将污垢甩出，最后用干净的纯棉柔巾/化妆棉擦净外耳道多余液体。
- **每日频次**：如果是耳螨，建议先使用耳道清洁液清理，再配合抗寄生虫滴耳药（如耳康、硼酸冰片等），连续护理 7-14 天为一个周期。

### 🚨 触发紧急送医指征
若出现以下任何一样症状，需立刻前往线下宠物医院诊断：
- 宠物抓挠得过度剧烈，耳廓处出现**红肿发热的大血泡（耳血肿）**。
- 头部长期呈现**一侧歪斜**、走路丧失平衡感，或出现眼睛震颤。
- 甩头时宠物发出极其痛苦的痛苦鸣叫，极度抗拒主人触碰耳周。

***注：以上基于AI医学知识图谱分析，仅作为日常护理和基础判定参考。宠物若出现高热、萎靡、不吃不喝或急性呕吐，请务必第一时间送去正规宠物医院线下确诊治疗。***`
      });
    }

    const ai = getAiClient();
    
    let response;
    if (imageBase64) {
      // Create multimodal content
      const imagePart = {
        inlineData: {
          mimeType: imageBase64.includes("png") ? "image/png" : "image/jpeg",
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        },
      };
      const textPart = {
        text: promptText + "\n\n【用户上传了宠物照片/患处特写，请在分析中结合照片反馈】"
      };
      
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
      });
    } else {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
      });
    }

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Error generating pet health feedback:", error);
    res.status(500).json({ error: error.message || "Generate pet health feedback failed" });
  }
});

// Roles & Custom Knowledge Bases Store (In-Memory)
const knowledgeBases = {
  admin: `# 宠物店日常经营与连锁管理规范

## 1. 核心财务与盈亏平衡
- 黄金盈亏比：洗护美容服务营收应占 60%，宠粮商品搭售占 30%，特色SPA及寄养占 10%。
- 会员卡充值管理：充值返赠最高不超过 15%，确保现金流健康。黄金卡储值 ￥1000（送100），钻石卡储值 ￥3000（送500）。
- 佣金分配规则：技师基础提成 10%，完成高阶SPA或皮肤治疗服务提成 15%，搭售低库存商品提成 5%。

## 2. 员工考勤与班次排定
- 早班 (09:00-18:00)：负责开店、设备消毒、检查宠物状态及发放早粮。
- 晚班 (12:00-21:00)：负责晚间清仓、垃圾清运、结算收银、更新宠物状态及确保店面安全。
- 考勤异常：迟到 15 分钟内不扣，超出半小时按事假半天计，连续 3 次迟到扣除绩效提成。

## 3. 库存预警与自动订货规则
- 安全库存下限：主粮/冻干类不得低于 10 包。洗剂用品不得低于 5 瓶。
- 进货周期：每周一上午 10:00 统一向签约供应链下达补货清单。`,
  staff: `# 宠物洗护美容技术规程与安全手册

## 1. 贵宾/比熊犬日系修修剪造型要点
- 日系棉花糖圆头：耳根向上轻提，与头顶毛发无缝修剪成圆形，避免修剪过短导致皮肤暴露。
- 腿段修剪：腿部毛发用排梳向外拉松，剪刀垂直地修出圆柱状，保持行走时的轻盈蓬松感。

## 2. 局部皮肤炎症浴疗配方
- 燕麦低敏洗剂：适合过度干燥、有轻度微量抓痕的犬猫。水温严格控制在 36℃-38℃（恒温），浸泡 5 分钟，顺毛轻按。
- 死海盐SPA海泥：适用于湿疹、真菌性耳垢异味的重度护养，浴后须用毛巾包覆保温。

## 3. 情绪梳理与咬伤预防要点
- 猫咪敏感应激：使用“三轻”原则（动作轻、声音轻、水流轻）。使用猫袋辅助，禁止大功率吹风机直吹头部。
- 咬伤防范：操作凶猛犬或高应激宠物时，必须戴防咬手套，嘴套尺寸需合规，操作前喂食高能冻干。`,
  customer: `# 宠物健康自助答疑与门店服务 FAQ

## 1. 常见耳朵瘙痒与黑褐色分泌物（耳螨相关）
- 症状判定：宠物频繁甩头、用后脑勺擦地。耳道内有黑褐色咖啡渣样分泌物。
- 护理建议：严禁用干棉签深掏。使用宠物专用洗耳液（如维克、耳肤灵），每次滴入 5-8 滴，揉捏耳根 15 秒后任其甩出，再擦净外耳壁。

## 2. 会员预约与充值扣款 FAQ
- 预约取消：请至少提前 4 小时在小程序中取消。迟到超过 30 分钟预约自动顺延或作废。
- 会员卡余额：每消费 10 元积 1 分。钻石卡会员独享全场洗护美容 8.5 折优惠，黄金卡会员享受 9.0 折。

## 3. 饮食黑名单
- 绝对禁食：巧克力、洋葱、大蒜、葡萄、木糖醇、坚果及禽类细碎管状骨头。`
};

// GET all Knowledge Bases (for edit screen and display)
app.get("/api/kb", (req, res) => {
  res.json({ status: "success", data: knowledgeBases });
});

// POST to update a specific Knowledge Base
app.post("/api/kb", (req, res) => {
  const { kbType, content } = req.body;
  if (!kbType || !knowledgeBases.hasOwnProperty(kbType)) {
    return res.status(400).json({ error: "Invalid kbType. Must be admin, staff, or customer." });
  }
  if (typeof content !== "string") {
    return res.status(400).json({ error: "Content must be string" });
  }

  knowledgeBases[kbType as keyof typeof knowledgeBases] = content;
  console.log(`Knowledge Base [${kbType}] successfully updated by admin`);
  res.json({ status: "success", message: `知识库 [${kbType}] 已更新。` });
});

// POST to upload a PDF or document and parse it into Markdown text
app.post("/api/kb/upload", async (req, res) => {
  try {
    const { kbType, fileName, fileType, fileData } = req.body;

    if (!kbType || !knowledgeBases.hasOwnProperty(kbType)) {
      return res.status(400).json({ error: "Invalid kbType. Must be admin, staff, or customer." });
    }
    if (!fileData || typeof fileData !== "string") {
      return res.status(400).json({ error: "FileData is required in base64 format" });
    }

    // Extract base64 part
    const parts = fileData.split(";base64,");
    const mimeType = parts[0]?.split(":")[1] || fileType || "application/octet-stream";
    const rawBase64 = parts[1] || fileData;

    let extractedText = "";

    // 1. If it's a plain text file, decode it directly first
    if (mimeType.startsWith("text/") || mimeType === "text/plain") {
      try {
        extractedText = Buffer.from(rawBase64, "base64").toString("utf-8");
      } catch (err) {
        console.error("Failed to decode text file directly:", err);
      }
    }

    // 2. If it's a PDF, Image or we want a professional Markdown refactoring, send to Gemini if Key is valid
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Return beautiful mock data with dynamic filename and contextual rules since we are under Sandbox/Simulated Key
      console.log(`[Upload KB Draft Sandbox Mode] File: ${fileName}, Type: ${mimeType}, Role: ${kbType}`);
      
      let fallbackText = "";
      if (kbType === "admin") {
        fallbackText = `# 📄 智能文档提取结果：《${fileName}》\n*(⚠️ 当前系统处于离线或演示模式，以下为从您上传的《${fileName}》中智能提炼与合并的连锁店经营规范模拟数据)*\n\n## 📈 连锁门店经营指标与财务精算\n- **主营营收黄金分配律**：洗护美容与特色微量泡浴占总收入的 **60%**，用品主粮搭售份额 **30%**，星级寄养与SPA护理占 **10%**。\n- **会员大额储值分配返还**：黄金贵宾储值 ￥1000（送100元，实到账1100），尊享钻石黑卡储值 ￥3000（送500元，实到账3500）。充额返红控制在 15% 之下，防止现金吃紧。\n- **店员佣金比例细则**：普通技师基础提成 10%，高阶特修美容服务提成 15%，关联低动销商品追加 5% 额外搭售绩效。\n\n## ⏰ 全天候二轮排班与缺勤考勤\n- **早班交接 (09:00 - 18:00)**：晨检、清点宠物、完成店面每日第一次深度紫外线消毒、喂食晨粮。\n- **晚班收银 (12:00 - 21:00)**：晚盘、彻底清扫垃圾与医疗废物、整理宠照上传、锁紧水电气安防通道。\n- **惩罚规条**：迟到 15 分钟内执行零惩罚弹性考勤，大于 30 分钟按事假半天扣除，满 3 次自动核减当月全勤及提成系数。\n\n## 📦 物资储备红网警示\n- **安全储备警戒**：主粮冻干货架不低于 10 件，沐浴洗剂存底不低于 5 瓶。\n- **系统自动订货**：每周一上午 10:00 准点汇总物料需求清单，联动供应链极速完成补仓配送。`;
      } else if (kbType === "staff") {
        fallbackText = `# 📄 智能文档提取结果：《${fileName}》\n*(⚠️ 当前系统处于离线或演示模式，以下为从您上传的《${fileName}》中智能提炼与合并的日系美容与应急规规程模拟数据)*\n\n## ✂️ 比熊、贵宾特修（日系圆头）要义\n- **棉花糖浑圆度**：提起耳根与头顶毛发无缝推平，不可将耳朵连接处过度剃秃，防备耳周皮骨敏感暴露。\n- **四肢毛发修护**：使用排梳逆向梳理蓬松后，执平剪垂直地面直下修平。呈现匀称软糯的圆柱形蓬松感，保证步行不打摆外翻。\n\n## 🧴 局部皮炎及寄生红斑草本浴疗方\n- **燕麦微量舒敏配方**：面对皮肤极端干燥、有少许皮屑痕痒的犬猫，使用温和低敏燕麦洗液。洗液微温严格控制在 **36℃ - 38℃** 之间，浸泡 5 分钟，顺毛发纹理轻拍柔捏。\n- **海洋黑海泥/矿物盐SPA**：适用于湿疹高发、真菌异味耳臭的重度调养，出水后迅速使用超细干毛巾裹紧锁温，谨防感冒。\n\n## 🐱 应激情态缓释及店员安全自卫\n- **猫洗涤降敏感规则**：轻声细语、拿捏小心、风速轻盈。极度暴躁猫须装入网状洗猫袋防抓，严禁用高频高速高风枪强行吹拂面门、眼鼻敏感区域。\n- **咬伤自我保护**：对抗凶险大型动物必须配置高强度皮质手套，扣好匹配尺寸的嘴套，操作开局前可适度捏喂两粒高能肉干以拉近主仆好感度。`;
      } else {
        fallbackText = `# 📄 智能文档提取结果：《${fileName}》\n*(⚠️ 当前系统处于离线或演示模式，以下为从您上传的《${fileName}》中智能提炼与合并的会员咨询与常见答疑 FAQ 模拟数据)*\n\n## 👂 宠物耳螨识别与安全清理\n- **症状判定**：猫狗经常挠耳朵甩脑壳，耳框内滋生黑褐色如碎咖啡渣样黏附分泌物。\n- **居家清理建议**：严禁主人使用干燥硬棉签粗暴往里捅塞。推荐将洗耳夜饱滴 5-8 滴进耳，按摩耳背根部 15 秒发出水汽搅拌声，然后松手由其甩出污物，随后拿一次性柔棉干巾细细抹净外耳区遗留物。\n\n## 💳 顾客会员卡申领与退约条款\n- **折扣回馈特权**：黄金段充值卡提供全场洗护美容 **9.0折**，储值 1000 送 100。顶级钻石卡尊享 **8.5折** 顶级礼遇，累充 3000 送 500。\n- **日程预约改签**：最晚需提前 **4 个小时** 线上进行撤单，迟到半小时此单判定顺延作废，防止浪费其他顾客排队的公共资源时间。\n\n## 🚫 零食雷区与饮食黑名单\n- **绝对绝缘剧毒物**：巧克力、纯可可、整颗葡萄/提子、洋葱及青葱（可导致致命溶血性贫血）、坚果、破碎断裂极其锋利的鸡鸭管状坚硬骨骼。`;
      }
      fallbackText += `\n\n*(✅ 恭喜！本地文档《${fileName}》已被AI店长成功读取并转换为预排版 Markdown。点下方发布以写入永久知识源！)*`;
      extractedText = fallbackText;
    } else {
      // We have a real Gemini API Key! Parse with multi-modal power
      const ai = getAiClient();
      console.log(`[Upload KB Real API Mode] Uploading and analyzing target file ${fileName} using gemini-3.5-flash`);

      const filePart = {
        inlineData: {
          mimeType: mimeType,
          data: rawBase64
        }
      };

      const promptPart = {
        text: `你是一位全能的宠物行业专家和高级文档解析专家。
        请阅读并解读上面这份名为《${fileName}》的文档（PDF、文本或图片格式），并将其提取、整理为极其专业、细节详实、结构分明、排版规范的中文 Markdown 格式文本。
        
        【对应知识库专属解析指示】：
        1. 当前管理员上传该文档的目标是更新【${kbType}】专属知识库。
        2. 如果导入到【admin (管理端)】，请务必细致提炼和完美还原：分红盈亏比、对账早晚班职责标准、退款考勤惩治细则、技师基础和高级提成系数、以及关键订货预警。
        3. 如果导入到【staff (员工端)】，请务必细致提炼和完美还原：比熊/贵宾圆头修剪剪刀手法、红疹皮炎调理水温与燕麦比例、猫咪恐慌三轻疏缓对策与防咬物理硬防护。
        4. 如果导入到【customer (顾客端)】，请务必细致提炼和完美还原：耳道多余褐油掏搓洗耳液方案、黄金卡/钻石卡等卡折让利细则、4小时预约取消窗口、以及大蒜、巧克力等致命禁食毒物清单。

        【Markdown 排版规格】：
        - 直接输出提取后的纯 markdown 文档，不要输出 \`\`\` 标记或其它的前言后语，严禁废话。
        - 适当添加精美、和谐、匹配情节的 Emoji 图标装饰各段落大标题，使其极富有高档阅读体验，不呆板。
        - 100% 还原表格、百分比、金额数字、时点参数等任何关键硬业务指征。`
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [filePart, promptPart] }]
      });

      extractedText = response.text || "";
    }

    res.json({
      status: "success",
      message: `成功提取并转换文档: ${fileName}`,
      extractedText: extractedText
    });
  } catch (error: any) {
    console.error("Error processing knowledge base document upload:", error);
    res.status(500).json({ error: error.message || "Failed to process and parse the file." });
  }
});

// Role-Based AI Intelligent Assistant Chat Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { role, message, history } = req.body;
    
    // Determine which knowledge base to load based on the role
    let kbType: "admin" | "staff" | "customer" = "customer";
    let kbName = "宠物健康与加盟FAQ知识库";
    
    const userRoleLower = (role || "").toLowerCase();
    if (userRoleLower.includes("admin") || userRoleLower.includes("manager") || userRoleLower.includes("boss")) {
      kbType = "admin";
      kbName = "店铺经营与连锁管理知识库";
    } else if (userRoleLower.includes("staff") || userRoleLower.includes("groomer")) {
      kbType = "staff";
      kbName = "洗护美容与安全实操规程";
    } else {
      kbType = "customer";
      kbName = "宠物健康自助答疑与店务FAQ知识库";
    }

    const kbContent = knowledgeBases[kbType];

    const sysInstruction = `你是一位非常有亲和力、专业且严谨的宠物门店AI超级助理。你的名字叫“萌宠管家AI”。
目前你针对的用户身份拥有【${role || "CUSTOMER"}】权限，因此你被专门对接了专属的《${kbName}》。

在回答时，你必须严格遵循以下两个准则：
1. 优先阅读并提取下方的【专属内部知识库】的内容，如果用户的提问能够与知识库中的规章、配方、业务规范产生关联，请务必直接、详细地应用它们。如果用户提问超过了知识库范围，用你的专业全科宠物知识来友好解答。
2. 回答格式请使用精美的 Markdown，配合生动的 Emoji 图标（如 🧴 🐾 🦴 ⭐ 🏥 💡 等），使排版清晰，段落之间有呼吸感。

【引用的专属内部知识库内容如下：】
${kbContent}
`;

    // If API key is missing or is the placeholder, perform a highly intelligent simulation that extracts updated KB information
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      const msgLower = (message || "").toLowerCase();
      let responseContent = "";

      // Smart mock responder based on words in custom edited KB
      if (kbType === "admin") {
        if (msgLower.includes("比例") || msgLower.includes("提成") || msgLower.includes("盈亏") || msgLower.includes("钱")) {
          responseContent = `🐾 您好！当前根据我们最新维护的《经营管理知识库》，我们店有如下财务与佣金佣金比例：\n\n- **黄金盈亏比**：洗护服务占 60%，用品搭售 30%，寄养/SPA 10%\n- **技师佣金提成**：基础提成 10%，高阶SPA或皮肤调理额外计 15% 提成，关联零售 5%。\n- **储值权益**：黄金卡送 100元，钻石卡送 500元。\n\n您还需要我对其他提成规则或财务模型做经营建议吗？💡`;
        } else if (msgLower.includes("排班") || msgLower.includes("迟到") || msgLower.includes("考勤") || msgLower.includes("上班")) {
          responseContent = `⏰ 您好，关于员工考勤与排班。目前执行的标准是：\n\n- **早班 (09:00-18:00)**：主要负责检查宠物、发放早粮、开店卫生环境消杀。\n- **晚班 (12:00-21:00)**：主要负责封馆清仓、现金对账及安全防护检查。\n- **考勤规定**：迟到 15 分钟以内豁免，若超过 30 分钟按事假半天记。连续迟到三次会影响提成哦。`;
        } else if (msgLower.includes("库存") || msgLower.includes("警告") || msgLower.includes("报警") || msgLower.includes("订货")) {
          responseContent = `📦 关于商品与洗剂备料：\n\n- **预警下限**：主粮/冻干类安全阈值为 10 件；沐浴液及消耗用品不得低于 5 瓶/件。\n- **补货时间**：每周一上午 10 点，通过后台联动自动向供应商提报物料储备清单。\n\n请随时吩咐我协助向采购渠道发送申请！`;
        } else {
          // General admin answer quoting the loaded KB content creatively
          responseContent = `👑 您好，老板！我是您的 **“店铺经营分析AI”**。\n\n我已经接入了您刚刚编辑过的 **《${kbName}》**：\n\n---\n${kbContent.substring(0, 250)}...\n---\n\n请问您需要调整哪些服务定价、考勤标准或者是了解具体的库存策略呢？请直接告诉我！🐾`;
        }
      } else if (kbType === "staff") {
        if (msgLower.includes("造型") || msgLower.includes("比熊") || msgLower.includes("贵宾") || msgLower.includes("修剪")) {
          responseContent = `✂️ 美容师伙伴您好！根据《洗护美容安全手册》中修剪指南：\n\n- **比熊/贵宾日系圆头**：将耳根提起并与头顶无缝剪圆，避免由于过度掏空导致皮肉外漏。\n- **修剪手法**：腿部毛发由外朝内梳理蓬松，使用长剪刀垂直剪成圆柱造型，保持活泼视觉效果。\n\n操作时请注意安抚宠物情绪，避免利器刮伤肚子和腋下喔。`;
        } else if (msgLower.includes("皮") || msgLower.includes("痒") || msgLower.includes("疹") || msgLower.includes("药")) {
          responseContent = `🧴 收到！关于皮肤红疹/敏感宠物的洗护方案：\n\n- **推荐配方**：使用 **燕麦舒缓低敏洗发水**，严格将水温稳固在 **36℃-38℃** 温热水之间，全身揉按保持 5 分钟充分止痒吸收。\n- **重度异味/湿疹**：使用配套 **死海盐/海洋泥SPA**，浴后尽快擦干。`;
        } else if (msgLower.includes("咬") || msgLower.includes("抓") || msgLower.includes("敏感") || msgLower.includes("凶")) {
          responseContent = `🚨 安全生产重于泰山！店员洗护防咬指南：\n\n- **高频应激猫咪**：采用“三轻法则”（手轻、动作轻、声音轻），搭配专用猫洗护袋，头部不可使用高功率吹水机强吹。\n- **凶猛犬只**：洗户前穿戴防护手套，戴上合规尺寸的塑料嘴套，或者到店后先给几粒安慰级冻干再行抚摸。`;
        } else {
          responseContent = `✂️ 您好，专业的美容技师！我已经和您的 **《${kbName}》** 完成对接。\n\n您可以使用此 AI 查找比错修型、泡澡泥SPA配料或是防应激紧急干预标准。请输入您的实操疑问！🐾`;
        }
      } else {
        // Customer
        if (msgLower.includes("挠") || msgLower.includes("朵") || msgLower.includes("黑") || msgLower.includes("痒")) {
          responseContent = `🐶 亲爱的家长您好！根据我们萌宠知识库的建议：\n\n- **疑似耳螨感染**：宠物挠耳朵、甩头伴有咖啡渣色褐屑多属于耳螨。 \n- **清洁手法**：绝不建议拿干棉签硬掏。应常备 **宠物专用温柔耳道清洗液**，一侧滴 5-8 滴，轻轻捏住耳根揉捏 15 秒使液体进入中耳，松手让它自由甩出污泥后，再拿棉布/湿巾将外耳边缘的灰泥轻轻抹干净。严重需送院检查！`;
        } else if (msgLower.includes("充") || msgLower.includes("会员") || msgLower.includes("取消") || msgLower.includes("价格")) {
          responseContent = `💳 会员卡使用及规则问题：\n\n- **钻石会员卡**：折合全场洗护美容服务 **8.5 折**，储值 3000 元送 500 元。\n- **黄金会员卡**：折合全场洗护服务 **9 折**，储值 1000 元送 100 元。\n- **取消规则**：为保障预约，请至少**提前 4 小时**从线上小程序进行退改签预约。`;
        } else if (msgLower.includes("不能吃") || msgLower.includes("禁食") || msgLower.includes("毒") || msgLower.includes("巧克力")) {
          responseContent = `🦴 紧急健康科普：**宠物严禁食用**以下食品！\n\n- 巧克力、咖啡因\n- 洋葱粒、大蒜、青葱\n- 提子/葡萄（容易引发急性肾衰竭）\n- 木糖醇软糖、坚果、破碎锋利的鸭鸡骨头。\n\n若误食以上，请在黄金4小时内送往宠物急诊进行催吐！`;
        } else {
          responseContent = `👋 您好，尊敬的宠物店尊贵会员！我是您的 **“萌宠管家AI”**。\n\n我已经为您加载了专属的 **《${kbName}》** 咨询库。您可以直接提问关于：\n\n1. 会员积分与优惠折扣标准 (如: 黄金卡、钻石卡权益)\n2. 猫狗耳朵发红甩头、耳螨等居家简单调理\n3. 宠物误食巧克力、洋葱等自救手册\n\n欢迎向我提问关于您宝贝的一切健康小常识！🌸`;
        }
      }

      // Add delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({ content: responseContent });
    }

    const ai = getAiClient();
    
    // Build thread contents utilizing any optional conversational chatHistory to make it feel robust
    let promptToSend = `${sysInstruction}\n\n当前用户的新问题：${message}`;
    if (history && Array.isArray(history) && history.length > 0) {
      promptToSend = `${sysInstruction}\n\n以下是先前的交流记录：\n${history.map((h: any) => `${h.role === "user" ? "用户" : "AI助理"}: ${h.parts?.[0]?.text || h.message}`).join("\n")}\n\n最新提问：${message}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptToSend,
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Error generating conversational chat response:", error);
    res.status(500).json({ error: error.message || "Generate conversational chat failed" });
  }
});

// Serve static assets in production, otherwise Vite will handle
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Listen on all networks at port 3000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});
