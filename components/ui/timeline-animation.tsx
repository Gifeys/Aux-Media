"use client";

import React from "react";
import { motion, Variants } from "motion/react";

interface TimelineContentProps {
  as?: keyof React.JSX.IntrinsicElements;
  animationNum?: number;
  customVariants?: Variants;
  timelineRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  children?: React.ReactNode;
}

export function TimelineContent({
  as = "div",
  animationNum = 0,
  customVariants,
  timelineRef,
  className,
  children,
  ...props
}: TimelineContentProps) {
  const Component = motion.create(as as any);

  const defaultVariants: Variants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  return (
    <Component
      custom={animationNum}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={customVariants || defaultVariants}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}
