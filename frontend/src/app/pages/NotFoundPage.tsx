import { useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();
  const horseRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance
      gsap.from(".fade-up", {
        y: 24,
        opacity: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.1,
      });

      // Shimmer on 404
      gsap.to(".digit-shimmer", {
        backgroundPositionX: "200%",
        duration: 3,
        ease: "none",
        repeat: -1,
      });

      // Horse runs across full track then navigates to /
      const horse = horseRef.current;
      const track = trackRef.current;
      if (horse && track) {
        const endX = track.offsetWidth - horse.offsetWidth;
        gsap.set(horse, { x: 0 });
        gsap.to(horse, {
          x: endX,
          duration: 2.8,
          delay: 2,
          ease: "power2.inOut",
          onComplete: () => navigate("/"),
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 relative overflow-hidden select-none"
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 56px,hsl(var(--border)) 56px,hsl(var(--border)) 57px)," +
            "repeating-linear-gradient(90deg,transparent,transparent 56px,hsl(var(--border)) 56px,hsl(var(--border)) 57px)",
        }}
      />

      {/* Gold glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(201,162,39,0.07) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-md w-full">
        {/* Horse icon */}
        <div className="fade-up text-5xl mb-6">🏇</div>

        {/* 404 */}
        <div className="fade-up mb-4">
          <span
            className="digit-shimmer font-black leading-none tracking-tighter"
            style={{
              fontSize: "clamp(6rem, 20vw, 9rem)",
              background:
                "linear-gradient(90deg, #8F7318 0%, #C9A227 30%, #E5C95A 50%, #C9A227 70%, #8F7318 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </span>
        </div>

        {/* Heading */}
        <h1 className="fade-up font-serif text-2xl font-bold text-foreground mb-3">
          Đường đua không tồn tại
        </h1>

        {/* Description */}
        <p className="fade-up text-muted-foreground text-sm leading-relaxed mb-10">
          Trang này đã rời khỏi vạch xuất phát và không thể tìm thấy. Có thể nó
          đã bị di chuyển hoặc chưa bao giờ tồn tại.
        </p>

        {/* Buttons */}
        <div className="fade-up flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Về Trang Chủ
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-border text-foreground text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay Lại
          </button>
        </div>

        {/* Track */}
        <div ref={trackRef} className="fade-up relative mx-auto w-72">
          {/* Labels row */}
          <div className="flex justify-between mb-1">
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/40">
              Start
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#C9A227]/60">
              Finish
            </span>
          </div>
          {/* Track line + horse */}
          <div className="relative h-6 flex items-center">
            <div className="w-full border-t border-dashed border-border" />
            <div
              ref={horseRef}
              className="absolute left-0 text-base leading-none pointer-events-none"
            >
              🏇
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="fade-up mt-8 text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground/40">
          The Paddock
        </div>
      </div>
    </div>
  );
}
