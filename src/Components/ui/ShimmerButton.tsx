import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  children,
  className,
  disabled,
  shimmerWidth = 100,
  onClick,
  type = "button",
  ...props
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick as any}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.015, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "relative overflow-hidden font-semibold tracking-wide",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...(props as any)}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {!disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)`,
            backgroundSize: "300% 100%",
            animation: "shimmerSlide 2.2s linear infinite",
          }}
        />
      )}
    </motion.button>
  );
};

export default ShimmerButton;
