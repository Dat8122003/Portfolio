export const envUrl = (key: keyof ImportMetaEnv): string | undefined => {
  const v = import.meta.env[key];
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
