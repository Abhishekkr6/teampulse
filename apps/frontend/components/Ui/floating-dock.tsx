/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/

import Link from "next/link";
import { cn } from "../../lib/utils";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type FloatingDockItem = {
  title: string;
  icon: ReactNode;
  href: string;
  isActive?: boolean;
};

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const updateHints = () => {
      if (!element) {
        return;
      }
      const hasOverflow = element.scrollWidth > element.clientWidth + 4;
      if (!hasOverflow) {
        setShowLeftHint(false);
        setShowRightHint(false);
        return;
      }

      const atStart = element.scrollLeft <= 4;
      const atEnd =
        element.scrollLeft >= element.scrollWidth - element.clientWidth - 4;

      setShowLeftHint(!atStart);
      setShowRightHint(!atEnd);
    };

    updateHints();
    const handleResize = () => updateHints();

    window.addEventListener("resize", handleResize);
    element.addEventListener("scroll", updateHints, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      element.removeEventListener("scroll", updateHints);
    };
  }, [items.length]);

  return (
    <nav
      className={cn(
        "relative block w-full rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm md:hidden",
        className,
      )}
      aria-label="Secondary navigation"
    >
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollRef}
      >
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors",
              item.isActive
                ? "bg-indigo-100 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-inset ring-slate-200">
              {item.icon}
            </span>
            <span className="whitespace-nowrap">{item.title}</span>
          </Link>
        ))}
      </div>
      {showLeftHint && (
        <div className="pointer-events-none absolute inset-y-2 left-2 flex w-12 items-center justify-start rounded-xl bg-linear-to-r from-white via-white/80 to-transparent pl-2 pr-6">
          <ArrowIcon direction="left" />
        </div>
      )}
      {showRightHint && (
        <div className="pointer-events-none absolute inset-y-2 right-2 flex w-12 items-center justify-end rounded-xl bg-linear-to-l from-white via-white/80 to-transparent pl-6 pr-2">
          <ArrowIcon direction="right" />
        </div>
      )}
    </nav>
  );
};

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "left" ? (
        <>
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </>
      ) : (
        <>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </>
      )}
    </svg>
  );
}

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(event) => mouseX.set(event.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-end gap-4 rounded-2xl bg-gray-50 px-4 pb-3 md:flex dark:bg-neutral-900",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  isActive,
}: {
  mouseX: MotionValue;
  title: string;
  icon: ReactNode;
  href: string;
  isActive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href} className="group relative block">
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full bg-gray-200 transition-colors dark:bg-neutral-800",
          hovered && "bg-gray-300 dark:bg-neutral-700",
          isActive && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-neutral-900",
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit whitespace-pre rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center text-slate-700 dark:text-neutral-100"
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
