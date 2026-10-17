import type { CompilerOptions } from "@inlang/paraglide-js";

export const paraglideOptions = {
  project: "../../project.inlang",
  outdir: "./src/i18n",
  strategy: ["cookie", "baseLocale"],
  cookieName: "rebyu_locale",
  emitTsDeclarations: true,
  outputStructure: "message-modules",
  disableAsyncLocalStorage: true,
} satisfies CompilerOptions;
