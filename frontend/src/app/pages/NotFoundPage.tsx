import { useNavigate } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';
import { Home, Compass } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Admin dùng app riêng (port khác) — không redirect sang /admin ở đây
const ROLE_REDIRECT: Record<string, string> = {
  owner: '/horse-owner',
  jockey: '/jockey',
  referee: '/referee',
  spectator: '/spectator',
};

function CountUp({ to }: { to: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toString().padStart(3, '0'));

  useEffect(() => {
    const ctrl = animate(count, to, { duration: 1.2, ease: 'easeOut', delay: 0.3 });
    return ctrl.stop;
  }, []);

  return <motion.span>{rounded}</motion.span>;
}

export function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const horsesRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleGoHome = () => {
    const dest = user?.role ? ROLE_REDIRECT[user.role] : undefined;
    navigate(dest ?? '/');
  };

  // GSAP: floating glow + horse parade
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pulse glow
      gsap.to(glowRef.current, {
        scale: 1.25,
        opacity: 0.18,
        duration: 2.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // Horses running across screen
      const horses = horsesRef.current?.querySelectorAll('.horse-runner');
      if (horses) {
        horses.forEach((el, i) => {
          gsap.set(el, { x: -200, opacity: 0 });
          gsap.to(el, {
            x: '120vw',
            opacity: 1,
            duration: 3.5 + i * 0.8,
            delay: i * 1.2 + 0.5,
            ease: 'power1.inOut',
            repeat: -1,
            repeatDelay: 4 + i * 2,
            onStart: () => gsap.set(el, { opacity: 1 }),
          });
        });
      }

      // Stagger text lines
      gsap.from('.stagger-line', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.4,
      });

      // Magnetic shimmer on 404
      gsap.to('.digit-shimmer', {
        backgroundPositionX: '200%',
        duration: 2.5,
        ease: 'none',
        repeat: -1,
      });
    }, containerRef);

    // Confetti burst on mount
    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 90,
        spread: 80,
        origin: { x: 0.5, y: 0.3 },
        colors: ['#C9A227', '#1F3D2B', '#8C2F1B', '#8F7318'],
        gravity: 1.4,
        scalar: 0.85,
      });
    }, 800);

    return () => {
      ctx.revert();
      clearTimeout(timer);
    };
  }, []);

  // GSAP: mouse-follow tilt on card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    gsap.to(el, {
      rotateX: -dy * 6,
      rotateY: dx * 6,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 900,
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    });
  };

  const buttons = [
    { key: 'home', label: 'Về trang chủ', icon: Home, action: handleGoHome, primary: true },
  ];

  const quickLinks = [
    { label: 'Giải đấu', path: '/tournaments' },
    { label: 'Bảng xếp hạng', path: '/rankings' },
    { label: 'Dự đoán AI', path: '/predictions' },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative px-4 select-none"
    >
      {/* Grid bg */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent,transparent 48px,#23201A 48px,#23201A 49px),repeating-linear-gradient(90deg,transparent,transparent 48px,#23201A 48px,#23201A 49px)',
        }}
      />

      {/* Glow blob */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,162,39,0.14) 0%, transparent 70%)' }}
      />

      {/* Horse runners */}
      <div
        ref={horsesRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden
      >
        {['🐎', '🏇', '🐴'].map((emoji, i) => (
          <div
            key={i}
            className="horse-runner absolute text-3xl"
            style={{ top: `${28 + i * 22}%`, opacity: 0 }}
          >
            {emoji}
            <span
              className="ml-1 text-xs text-[#8F7318]/40 font-mono"
              style={{ verticalAlign: 'middle' }}
            >
              {'·'.repeat(6 - i)}
            </span>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Card border glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-gold/25 via-transparent to-secondary/10 pointer-events-none" />

        <div className="relative rounded-2xl bg-card backdrop-blur-sm border border-border p-10 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="stagger-line inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/40 bg-gold/10 text-[#8F7318] text-xs font-medium mb-6"
          >
            <Compass className="w-3 h-3" />
            Lỗi 404 — Không tìm thấy trang
          </motion.div>

          {/* 404 */}
          <div className="stagger-line mb-1">
            <span
              className="digit-shimmer text-[9rem] font-black leading-none tracking-tighter"
              style={{
                background:
                  'linear-gradient(90deg, #C9A227 0%, #E5C95A 30%, #C9A227 50%, #E5C95A 80%, #C9A227 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <CountUp to={404} />
            </span>
          </div>

          {/* Title */}
          <h1 className="stagger-line font-serif text-2xl font-bold text-foreground mb-3">
            Đường đua không tồn tại
          </h1>

          {/* Description */}
          <p className="stagger-line text-muted-foreground text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            Trang bạn đang tìm kiếm đã rời khỏi vạch xuất phát và không thể tìm thấy.
            Có thể nó đã bị di chuyển, xóa, hoặc chưa bao giờ tồn tại.
          </p>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="stagger-line w-full h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-8"
          />

          {/* Buttons */}
          <div className="stagger-line flex flex-col sm:flex-row gap-3 justify-center mb-8">
            {buttons.map(({ key, label, icon: Icon, action, primary }) => (
              <motion.button
                key={key}
                onClick={action}
                onHoverStart={() => setHovered(key)}
                onHoverEnd={() => setHovered(null)}
                whileTap={{ scale: 0.96 }}
                className={[
                  'relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-150 overflow-hidden',
                  primary
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'border border-border hover:border-primary text-foreground hover:text-primary',
                ].join(' ')}
              >
                {/* shimmer sweep on hover */}
                {hovered === key && (
                  <motion.span
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-foreground/10 skew-x-12 pointer-events-none"
                  />
                )}
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            ))}
          </div>

          {/* Quick links */}
          <div className="stagger-line flex items-center justify-center flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            <span>Liên kết nhanh:</span>
            {quickLinks.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="text-muted-foreground hover:text-secondary transition-colors duration-150"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
