import type { Variants, Transition } from "framer-motion";

export const easeOut: Transition["ease"] = [0.2, 0.7, 0.2, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
};

export const stagger = (delay = 0.07): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren: 0.05 } },
});
