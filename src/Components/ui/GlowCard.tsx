import React, { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "../../lib/utils";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  radius?: number;
}

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className,
  glowColor = "rgba(249,115,22,0.12)",
  radius = 280,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
    opacity.set(1);
  };
  const handleMouseLeave = () => opacity.set(0);

  const background = useTransform(
    [mouseX, mouseY] as any,
    ([x, y]: number[]) =>
      `radial-gradient(${radius}px circle at ${x}px ${y}px, ${glowColor}, transparent 80%)`
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative overflow-hidden", className)}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{ background, opacity }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GlowCard;
