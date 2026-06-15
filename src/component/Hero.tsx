import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { useReveal } from "../hooks/useReveal";
import { fadeUp, stagger } from "../hooks/motion";

const Hero = () => {
  const { t } = useTheme();
  const [ref, seen] = useReveal<HTMLDivElement>();
  const show = seen ? "show" : "hidden";

  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 dark:opacity-40"
        style={{
          background:
            "radial-gradient(60% 80% at 80% 10%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(50% 60% at 0% 100%, rgba(236,72,153,0.14), transparent 60%)",
        }}
      />
      <motion.div
        ref={ref as unknown as React.Ref<HTMLDivElement>}
        variants={stagger(0.08)}
        initial="hidden"
        animate={show}
        className="mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-24 md:py-28"
      >
        <motion.h1
          variants={fadeUp}
          className="text-5xl font-bold leading-[1.02] tracking-tight text-zinc-900 sm:text-6xl md:text-7xl lg:text-[5.5rem] dark:text-zinc-50"
        >
          {t.name}
          <span className="text-zinc-400 dark:text-zinc-500">.</span>
        </motion.h1>
      </motion.div>
    </section>
  );
};

export default Hero;
