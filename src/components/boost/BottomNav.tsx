"use client";

import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Trophy } from "lucide-react";
import { GiDinosaurRex } from "react-icons/gi";
import { useEffect, useState } from "react";
import { FaWallet } from "react-icons/fa";
// NOTE: Global types for window.Telegram are declared centrally in
//  - src/utils/telegram.ts (TelegramWebApp)
//  - src/types/global.d.ts (ambient shim used by TS)
// Avoid redeclaring here to prevent TS2717 duplicate declaration errors.

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    const handleTelegramViewportChange = (data?: any) => {
      if (!tg) return;
      if (data?.isStateStable && tg.viewportHeight && tg.viewportStableHeight) {
        const keyboardOpen = tg.viewportHeight < tg.viewportStableHeight - 100;
        setIsKeyboardVisible(keyboardOpen);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    tg?.onEvent?.("viewportChanged", handleTelegramViewportChange);

    const visualViewport = window.visualViewport;
    const handleResize = () => {
      if (!visualViewport) return;
      const diff = window.innerHeight - visualViewport.height;
      setIsKeyboardVisible(diff > 150);
    };
    visualViewport?.addEventListener("resize", handleResize);

    return () => {
      tg?.offEvent?.("viewportChanged", handleTelegramViewportChange);
      visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  const items = [
    { icon: Home, label: "Boost", url: "/boost" },
    { icon: Trophy, label: "Leaderboard", url: "/leaderboard-new" },
    { icon: GiDinosaurRex, label: "Dino", url: "/dino" },
    { icon: Users, label: "Friends", url: "/friends" },
    { icon: FaWallet, label: "Wallet", url: "/wallet" },
  ];

  const handleNavClick = (label: string, url: string) => {
    if (label === "Wallet") {
      // 👇 Show “Coming Soon” message
      setShowComingSoon(true);
      setTimeout(() => setShowComingSoon(false), 2000);
    } else {
      navigate(url);
    }
  };

  return (
    <>
      {/* ✅ Coming Soon Notification (visible above nav) */}
      {showComingSoon && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 right-2 z-[9999] -translate-x-1/2 rounded-lg bg-black/80 px-5 py-2 text-sm font-medium text-white border border-white/40 shadow-lg backdrop-blur-lg"
        >
          Coming Soon
        </motion.div>
      )}

      {/* ✅ Bottom Navigation */}
      <motion.nav
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: isKeyboardVisible ? 100 : 0,
          opacity: isKeyboardVisible ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 15 }}
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-2 z-50 mx-auto w-[94%] max-w-sm overflow-hidden rounded-3xl border border-gray-800/70 bg-gradient-to-br from-[#0B0C0E]/90 via-[#111214]/95 to-[#0E0F11]/90 px-5 py-3 backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-transparent to-violet-700/10 pointer-events-none" />

        <ul className="relative z-10 grid grid-cols-5 items-center">
          {items.map(({ icon: Icon, label, url }, idx) => {
            const isActive = location.pathname === url;
            const isDino = label === "Dino" || idx === 2;

            return (
              <motion.li
                key={label}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleNavClick(label, url)}
                className="flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className={`flex items-center justify-center rounded-full border transition-all duration-300 ${
                    isDino ? "h-14 w-14 -mt-2" : "h-11 w-11"
                  } ${
                    isActive
                      ? isDino
                        ? "border-green-400/40 bg-[#82ad4b] shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                        : "border-green-400/40 bg-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                      : "border-gray-800 bg-gradient-to-br from-gray-800/80 to-gray-900/90 hover:from-gray-700 hover:to-gray-800"
                  }`}
                >
                  <Icon
                    className={`transition-colors duration-300 ${
                      isDino ? "h-6 w-6" : "h-5 w-5"
                    } ${isActive ? "text-black" : "text-gray-300"}`}
                  />
                </div>
                <span
                  className={`text-[11px] font-medium transition-colors duration-300 ${
                    isActive
                      ? isDino
                        ? "text-[#82ad4b]"
                        : "text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  {label}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </motion.nav>
    </>
  );
}
