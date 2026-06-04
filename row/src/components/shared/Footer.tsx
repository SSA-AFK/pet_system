import React from "react";
import {
  PawPrint,
  MapPin,
  Phone,
  Clock,
  Mail,
  MessageCircle,
} from "lucide-react";
import { THEME } from "../../theme";

interface FooterProps {
  /** 是否显示门店详细信息（地址、电话等） */
  showStoreInfo?: boolean;
  /** 背景样式 */
  variant?: "dark" | "light";
}

const Footer: React.FC<FooterProps> = ({
  showStoreInfo = true,
  variant = "dark",
}) => {
  const isDark = variant === "dark";

  const bgClass = isDark
    ? "bg-black/40 backdrop-blur-sm border-t border-white/10"
    : "bg-white border-t border-slate-200";

  const textPrimary = isDark ? "text-white" : "text-slate-800";
  const textSecondary = isDark ? "text-white/60" : "text-slate-500";
  const textMuted = isDark ? "text-white/40" : "text-slate-400";

  return (
    <footer className={`w-full ${bgClass}`}>
      <div className="max-w-6xl mx-auto px-10 py-4 flex items-center justify-between">
        {/* 左侧：品牌与门店信息 */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <PawPrint size={18} className={textSecondary} />
            <span
              className="text-sm font-bold"
              style={{ color: isDark ? "#fff" : THEME.PRIMARY }}
            >
              {THEME.BRAND.name}
            </span>
          </div>

          {showStoreInfo && (
            <>
              <div
                className={`flex items-center gap-1.5 ${textSecondary} text-xs`}
              >
                <MapPin size={13} />
                <span>北京市朝阳区宠物大道 88 号</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${textSecondary} text-xs`}
              >
                <Phone size={13} />
                <span>400-888-6688</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${textSecondary} text-xs`}
              >
                <Clock size={13} />
                <span>营业时间：09:00 - 21:00</span>
              </div>
            </>
          )}
        </div>

        {/* 右侧：联系方式与版权 */}
        <div className="flex items-center gap-6">
          {showStoreInfo && (
            <>
              <div
                className={`flex items-center gap-1.5 ${textSecondary} text-xs`}
              >
                <Mail size={13} />
                <span>service@petshop.com</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${textSecondary} text-xs`}
              >
                <MessageCircle size={13} />
                <span>微信：PetShop_Pro</span>
              </div>
            </>
          )}
          <span className={`${textMuted} text-[10px]`}>
            © 2026 宠店智管 Pro All Rights Reserved
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
