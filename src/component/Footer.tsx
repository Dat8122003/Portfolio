import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";

const Footer = () => {
  const { t } = useTheme();
  const year = new Date().getFullYear();
  return (
    <footer>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 sm:px-6"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          © {year} · {t.name}
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;
