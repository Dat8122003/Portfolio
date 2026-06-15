import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeCtx, type Ctx } from "./themeContext";
import { dict, type Lang } from "./i18n";

export type Mode = "light" | "dark";

const safeGet = <T extends string>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  return (v as T) || fallback;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<Mode>(() => safeGet<Mode>("mode", "light"));
  const [lang, setLang] = useState<Lang>(() => safeGet<Lang>("lang", "vi"));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
    window.localStorage.setItem("mode", mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem("lang", lang);
  }, [lang]);

  const toggleMode = useCallback(
    () => setMode((m) => (m === "dark" ? "light" : "dark")),
    []
  );
  const toggleLang = useCallback(
    () => setLang((l) => (l === "vi" ? "en" : "vi")),
    []
  );

  const value = useMemo<Ctx>(
    () => ({ mode, lang, t: dict[lang], setMode, toggleMode, toggleLang }),
    [mode, lang, toggleMode, toggleLang]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
};
