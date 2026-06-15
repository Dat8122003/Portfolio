import { useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import Magnetic from "./motion/Magnetic";

type NavId = "about" | "skills" | "projects";
type NavItem = { id: NavId; label: string };

const NAV: readonly NavItem[] = [
  { id: "about", label: "About & Contact" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
];

const Header = () => {
  const { t, lang, toggleLang, mode, toggleMode } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<NavId>("about");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(
      (n): n is HTMLElement => !!n
    );
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id as NavId);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const linkBase =
    "btn-magnetic block rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-zinc-950 dark:hover:text-white";

  const renderLink = (id: NavId, label: string, onClick?: () => void) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={onClick}
      className={
        linkBase +
        " relative " +
        (active === id
          ? "text-zinc-950 dark:text-white"
          : "text-zinc-500 dark:text-zinc-400")
      }
    >
      {label}
      {active === id && (
        <span className="absolute inset-x-3 -bottom-0.5 h-px bg-current opacity-60" />
      )}
    </a>
  );

  return (
    <header
      className={
        "sticky top-0 z-30 border-b bg-white/80 backdrop-blur transition-all duration-300 dark:bg-black/70 " +
        (scrolled ? "hairline" : "border-transparent")
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <a
          href="#top"
          className="group flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-zinc-900 text-sm font-bold text-white transition-transform group-hover:rotate-6 dark:bg-zinc-50 dark:text-zinc-900">
            D
          </span>
          <span className="hidden sm:inline">{t.name}</span>
        </a>

        <nav className="hidden gap-1 md:flex">
          {NAV.map((n) => renderLink(n.id, n.label))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Magnetic>
            <button
              onClick={toggleLang}
              aria-label="toggle language"
              className="btn-magnetic rounded-full border hairline bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white sm:px-3 sm:text-sm dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-900"
            >
              {lang === "vi" ? "EN" : "VI"}
            </button>
          </Magnetic>
          <Magnetic>
            <button
              onClick={toggleMode}
              aria-label="toggle theme"
              className="btn-magnetic rounded-full border hairline bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white sm:px-3 sm:text-sm dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-900"
            >
              {mode === "dark" ? "Light" : "Dark"}
            </button>
          </Magnetic>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="toggle menu"
            aria-expanded={open}
            className="btn-magnetic grid h-8 w-8 place-items-center rounded-full border hairline bg-white text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white md:hidden dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-900"
          >
            <span aria-hidden className="text-base leading-none">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t hairline md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV.map((n) => renderLink(n.id, n.label, () => setOpen(false)))}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
