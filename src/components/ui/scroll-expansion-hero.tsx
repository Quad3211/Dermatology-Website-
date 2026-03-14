"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "../../utils/cn";

export interface ScrollExpansionHeroProps {
  children?: ReactNode;
  backgroundImageUrl: string;
  className?: string;
  badge?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actionButtons?: ReactNode;
}

export function ScrollExpansionHero({
  children,
  backgroundImageUrl,
  className,
  badge,
  title,
  subtitle,
  actionButtons,
}: ScrollExpansionHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const width = useTransform(scrollYProgress, [0, 0.6], ["90%", "100%"]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.6], ["32px", "0px"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div
      ref={containerRef}
      className="relative w-full pt-32 pb-20 flex flex-col items-center justify-start bg-slate-50 overflow-hidden"
    >
      <motion.div
        style={{ opacity: textOpacity }}
        className="relative z-20 w-full max-w-5xl mx-auto px-4 text-center mb-16 flex flex-col items-center"
      >
        {badge && <div className="mb-8">{badge}</div>}
        {title && (
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 drop-shadow-sm px-4">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-lg lg:text-xl text-slate-600 mb-10 max-w-3xl font-medium px-4">
            {subtitle}
          </p>
        )}
        {actionButtons && (
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            {actionButtons}
          </div>
        )}
      </motion.div>

      <motion.div
        style={{ width, borderRadius }}
        className={cn(
          "relative overflow-hidden shadow-2xl z-10 w-[90%] h-[50vh] min-h-[400px] max-w-[1600px] flex-shrink-0 mt-auto",
          className,
        )}
      >
        <motion.div
          className="absolute inset-0 w-full h-[120%] bg-cover bg-center -top-[10%]"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            y: imageY,
          }}
        />
        <div className="absolute inset-0 bg-slate-900/10" />
        {children && (
          <div className="absolute inset-0 flex items-center justify-center p-4 z-20">
            {children}
          </div>
        )}
      </motion.div>
    </div>
  );
}
