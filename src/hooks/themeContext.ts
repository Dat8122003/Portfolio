import { createContext } from "react";
import type { Dict, Lang } from "./i18n";
import type { Mode } from "./ThemeProvider";

export type { Mode };

export type Ctx = {
  mode: Mode;
  lang: Lang;
  t: Dict;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  toggleLang: () => void;
};

export const ThemeCtx = createContext<Ctx | null>(null);
