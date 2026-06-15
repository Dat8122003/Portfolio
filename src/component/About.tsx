import { useTheme } from "../hooks/useTheme";
import Reveal from "./motion/Reveal";
import { envUrl } from "../hooks/env";

type Row =
  | { kind: "kv"; k: string; v: string }
  | { kind: "link"; k: string; href: string; v: string; pending?: boolean };

const About = () => {
  const { t } = useTheme();
  const githubHref = envUrl("VITE_GITHUB_URL");

  const profile: Row[] = [
    { kind: "kv", k: t.profileProgram, v: t.programValue },
    { kind: "kv", k: t.profileMajor, v: t.majorValue },
    { kind: "kv", k: t.profileField, v: t.fieldValue },
    { kind: "kv", k: t.profileDepartment, v: t.departmentValue },
    { kind: "kv", k: t.profileUniversity, v: t.universityValue },
  ];

  const contact: Row[] = [
    { kind: "kv", k: t.contactPhone, v: t.phoneValue },
    { kind: "kv", k: t.contactEmail, v: t.emailValue },
  ];
  contact.push(
    githubHref
      ? { kind: "link", k: t.contactGithub, href: githubHref, v: t.githubValue }
      : {
          kind: "link",
          k: t.contactGithub,
          href: "#",
          v: t.githubValue,
          pending: true,
        }
  );

  const renderRows = (rows: readonly Row[]) => (
    <dl>
      {rows.map((r, i) => (
        <Reveal
          key={`${r.kind}-${i}-${r.k}`}
          as="div"
          className="grid grid-cols-[36px_1fr] items-baseline gap-3 py-2 sm:grid-cols-[48px_1fr] sm:gap-4 sm:py-2.5"
        >
          <span className="text-xs font-semibold tabular-nums text-zinc-400 sm:text-sm dark:text-zinc-500">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[120px_1fr] md:grid-cols-[140px_1fr] sm:gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:text-sm dark:text-zinc-400">
              {r.k}
            </span>
            {r.kind === "link" ? (
              <a
                href={r.href}
                target={r.pending ? undefined : "_blank"}
                rel="noreferrer"
                aria-disabled={r.pending || undefined}
                className={
                  "break-all text-sm font-semibold underline-offset-4 sm:text-base " +
                  (r.pending
                    ? "cursor-not-allowed text-zinc-400 dark:text-zinc-500"
                    : "text-zinc-900 hover:underline dark:text-zinc-50")
                }
                onClick={(e) => {
                  if (r.pending) e.preventDefault();
                }}
              >
                {r.v}
              </a>
            ) : (
              <span className="text-sm font-semibold text-zinc-900 sm:text-base dark:text-zinc-50">
                {r.v}
              </span>
            )}
          </div>
        </Reveal>
      ))}
    </dl>
  );

  return (
    <section id="about" className="flex min-h-[100svh] items-start pt-20 sm:pt-24">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-16">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
            {t.aboutHeading}
          </h2>

          <div className="mt-5 grid gap-8 md:grid-cols-2 md:gap-10">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                {t.aboutTitle}
              </h3>
              <div className="mt-2">{renderRows(profile)}</div>
            </div>
            <div id="contact">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                {t.contactTitle}
              </h3>
              <div className="mt-2">{renderRows(contact)}</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default About;
