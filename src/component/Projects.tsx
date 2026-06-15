import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import type { Dict } from "../hooks/i18n";
import { envUrl } from "../hooks/env";
import Reveal from "./motion/Reveal";
import Button from "./Button";
import DemoCarousel from "./projects/DemoCarousel";
import { stagger, fadeUp } from "../hooks/motion";

type ProjectKind = "shop" | "curie";
type Layout = "left" | "right" | "stack";

type Project = {
  id: string;
  num: string;
  titleKey: "p1Title" | "p2Title";
  roleKey: "p1Role" | "p2Role";
  linesKey: "p1Lines" | "p2Lines";
  primary: { key: "demo" | "docs"; env?: keyof ImportMetaEnv };
  codeEnv: keyof ImportMetaEnv;
  kind: ProjectKind;
  layout: Layout;
  images: readonly string[];
};

const PROJECTS: readonly Project[] = [
  {
    id: "p1",
    num: "01",
    titleKey: "p1Title",
    roleKey: "p1Role",
    linesKey: "p1Lines",
    primary: { key: "demo", env: "VITE_PROJECT_ONE_DEMO_URL" },
    codeEnv: "VITE_PROJECT_ONE_CODE_URL",
    kind: "shop",
    layout: "right",
    images: ["/P1/P1-1.png", "/P1/P1-2.png"],
  },
  {
    id: "p2",
    num: "02",
    titleKey: "p2Title",
    roleKey: "p2Role",
    linesKey: "p2Lines",
    primary: { key: "docs", env: "VITE_PROJECT_TWO_DOCS_URL" },
    codeEnv: "VITE_PROJECT_TWO_CODE_URL",
    kind: "curie",
    layout: "right",
    images: ["/P2/P2-1.png", "/P2/P2-2.png"],
  },
];

const ProjectText = ({ p, t }: { p: Project; t: Dict }) => {
  const primaryHref = p.primary.env ? envUrl(p.primary.env) : undefined;
  const codeHref = envUrl(p.codeEnv);
  const primaryLabel = p.primary.key === "demo" ? t.demo : t.docs;

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-sm dark:text-zinc-400">
        {p.num} · {t[p.roleKey]}
      </p>
      <h3 className="text-2xl font-bold leading-[1.15] tracking-tight text-zinc-900 sm:text-3xl md:text-4xl dark:text-zinc-50">
        {t[p.titleKey]}
      </h3>
      <ul className="space-y-1 text-sm leading-6 text-zinc-700 sm:text-base md:text-lg dark:text-zinc-200">
        {t[p.linesKey].map((line, i) => (
          <li key={i} className="pl-3">
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-0.5 flex flex-wrap gap-3">
        <Button href={primaryHref} variant="primary" fallback={primaryLabel}>
          {primaryLabel}
        </Button>
        <Button href={codeHref}>{t.code}</Button>
      </div>
    </div>
  );
};

const ProjectCard = ({ p, t }: { p: Project; t: Dict }) => {
  const image = <DemoCarousel images={p.images} alt={t.demoImage} />;
  const text = <ProjectText p={p} t={t} />;

  return (
    <article>
      <Reveal className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:items-start md:gap-6 lg:gap-7">
          <div className="order-1 md:order-none md:col-span-7">{text}</div>
          <div
            className={
              "order-2 md:order-none md:col-span-5 " +
              (p.layout === "left" ? "md:-order-1" : "")
            }
          >
            {image}
          </div>
        </div>
      </Reveal>
    </article>
  );
};

const Projects = () => {
  const { t } = useTheme();
  return (
    <section id="projects" className="flex min-h-[100svh] items-start pt-16 sm:pt-20">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 md:pb-12">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl lg:text-6xl dark:text-zinc-50">
            {t.projectsTitle}
          </h2>
        </Reveal>
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        >
          {PROJECTS.map((p) => (
            <motion.div key={p.id} variants={fadeUp}>
              <ProjectCard p={p} t={t} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;
