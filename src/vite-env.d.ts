/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_URL?: string;

  readonly VITE_PROJECT_ONE_DEMO_URL?: string;
  readonly VITE_PROJECT_ONE_CODE_URL?: string;

  readonly VITE_PROJECT_TWO_DOCS_URL?: string;
  readonly VITE_PROJECT_TWO_CODE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
