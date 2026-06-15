import { useEffect, useRef, useState } from "react";

type Options = {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

const hasIO = typeof window !== "undefined" && "IntersectionObserver" in window;

export const useReveal = <T extends HTMLElement = HTMLDivElement>(
  options: Options = {}
) => {
  const { threshold = 0.15, rootMargin = "0px 0px -8% 0px", once = true } = options;
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(!hasIO);

  useEffect(() => {
    if (!hasIO) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true);
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            setSeen(false);
          }
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, seen] as const;
};
