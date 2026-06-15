import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import Reveal from "./motion/Reveal";
import { stagger, fadeUp } from "../hooks/motion";

type CatKey =
  | "catHardware"
  | "catProtocol"
  | "catLanguage"
  | "catFramework"
  | "catTool"
  | "catSoftware";

type SkillItem = { name: string; basic?: boolean };

const CATS: { key: CatKey; items: readonly SkillItem[] }[] = [
  {
    key: "catHardware",
    items: [{ name: "ESP32", basic: true }],
  },
  {
    key: "catProtocol",
    items: [
      { name: "I2C", basic: true },
      { name: "WebSocket", basic: true },
    ],
  },
  {
    key: "catLanguage",
    items: [
      { name: "JavaScript" },
      { name: "C++" },
      { name: "Python", basic: true },
      { name: "Matlab", basic: true },
    ],
  },
  {
    key: "catFramework",
    items: [
      { name: "React.js" },
      { name: "TypeScript", basic: true },
      { name: "Node.js", basic: true },
      { name: "Express", basic: true },
    ],
  },
  {
    key: "catTool",
    items: [
      { name: "MongoDB", basic: true },
      { name: "JWT", basic: true },
      { name: "Chart.js", basic: true },
      { name: "Git", basic: true },
      { name: "Linux", basic: true },
    ],
  },
  {
    key: "catSoftware",
    items: [
      { name: "VSCode", basic: true },
      { name: "Postman", basic: true },
    ],
  },
];

const Skill = () => {
  const { t } = useTheme();

  return (
    <section id="skills" className="flex min-h-[100svh] items-start pt-20 sm:pt-24">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-16">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
            {t.skillsTitle}
          </h2>
        </Reveal>

        <motion.dl
          variants={stagger(0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10"
        >
          {CATS.map((c) => (
            <motion.div key={c.key} variants={fadeUp}>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:text-sm dark:text-zinc-400">
                {t[c.key]}
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {c.items.map((s) => (
                  <motion.span
                    key={s.name}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 320, damping: 20 }}
                    className="inline-flex items-center gap-1.5 rounded-full border hairline bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white sm:px-3.5 sm:text-sm dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-900"
                  >
                    <span>{s.name}</span>
                    {s.basic && (
                      <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        basic
                      </span>
                    )}
                  </motion.span>
                ))}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
};

export default Skill;
