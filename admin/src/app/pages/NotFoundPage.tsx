import { useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import confetti from "canvas-confetti";
import { LayoutDashboard, ShieldAlert } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

function CountUp({ to }: { to: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    Math.round(v).toString().padStart(3, "0"),
  );
  useEffect(() => {
    const ctrl = animate(count, to, {
      duration: 1.1,
      ease: "easeOut",
      delay: 0.3,
    });
    return ctrl.stop;
  }, []);
  return <motion.span>{rounded}</motion.span>;
}

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pulse glow bằng CSS animation thuần
    const el = glowRef.current;
    if (!el) return;
    let frame: number;
    let t = 0;
    const tick = () => {
      t += 0.012;
      const s = 1 + Math.sin(t) * 0.18;
      const o = 0.12 + Math.sin(t) * 0.06;
      el.style.transform = `translate(-50%, -50%) scale(${s})`;
      el.style.opacity = String(o);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // Confetti burst
    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 90,
        spread: 70,
        origin: { x: 0.5, y: 0.25 },
        colors: ["#d4a017", "#f0c040", "#030213", "#667eea"],
        gravity: 1.5,
        scalar: 0.8,
      });
    }, 700);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#030213] flex items-center justify-center overflow-hidden relative px-4 select-none">
      {/* Grid nền */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 44px,#fff 44px,#fff 45px),repeating-linear-gradient(90deg,transparent,transparent 44px,#fff 44px,#fff 45px)",
        }}
      />

      {/* Glow blob */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,160,23,0.14) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md text-center">
        {/* Viền glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#d4a017]/20 via-transparent to-[#667eea]/10 pointer-events-none rounded-2xl" />

        <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-10">
          {/* Badge admin */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4a017]/30 bg-[#d4a017]/8 text-[#d4a017] text-xs font-medium mb-6"
          >
            <ShieldAlert className="w-3 h-3" />
            Quản trị hệ thống · Lỗi 404
          </motion.div>

          {/* Số 404 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              type: "spring",
              stiffness: 160,
            }}
            className="mb-1"
          >
            <span
              className="text-[8.5rem] font-black leading-none tracking-tighter"
              style={{
                background:
                  "linear-gradient(135deg, #d4a017 0%, #f0c040 40%, #d4a017 70%, #b8860b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              <CountUp to={404} />
            </span>
          </motion.div>

          {/* Tiêu đề */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.35 }}
            className="text-xl font-bold text-white mb-3"
          >
            Trang không tồn tại
          </motion.h1>

          {/* Mô tả */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="text-slate-400 text-sm leading-relaxed mb-2"
          >
            Trang bạn đang truy cập không có trong hệ thống quản trị.
          </motion.p>

          {user && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-slate-600 text-xs mb-8"
            >
              Đang đăng nhập với tư cách:{" "}
              <span className="text-[#d4a017] font-medium">
                {user.fullName ?? user.email}
              </span>
            </motion.p>
          )}

          {!user && <div className="mb-8" />}

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="w-full h-px bg-gradient-to-r from-transparent via-[#d4a017]/25 to-transparent mb-8"
          />

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.65 }}
            className="flex justify-center"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/dashboard")}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#d4a017] hover:bg-[#e6b020] text-black transition-colors duration-150"
            >
              <LayoutDashboard className="w-4 h-4" />
              Về trang đăng nhập
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
