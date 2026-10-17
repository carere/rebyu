import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  type ParentProps,
  useContext,
} from "solid-js";

export const COLOR_MODE_COOKIE_KEY = "rebyu-color-mode";

export type ColorMode = "light" | "dark";

export type ColorModeContextValue = {
  colorMode: Accessor<ColorMode>;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
};

export const ColorModeContext = createContext<ColorModeContextValue>();

export function ColorModeProvider(
  props: ParentProps<{
    initialColorMode: ColorMode;
    target: HTMLElement;
  }>,
) {
  const [colorMode, updateColorMode] = createSignal<ColorMode>(props.initialColorMode);

  const setColorMode = (mode: ColorMode) => {
    updateColorMode(mode);
    // biome-ignore lint/suspicious/noDocumentCookie: preserve Zaidan's persisted preference under a Rebyu-specific key.
    document.cookie = `${COLOR_MODE_COOKIE_KEY}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
  };
  const toggleColorMode = () => setColorMode(colorMode() === "dark" ? "light" : "dark");

  // Scope Zaidan's class-based theme to the widget and all of its portals.
  createEffect(() => {
    const mode = colorMode();
    props.target.classList.toggle("dark", mode === "dark");
    props.target.classList.toggle("light", mode === "light");
    props.target.style.colorScheme = mode;
  });

  return (
    <ColorModeContext.Provider value={{ colorMode, toggleColorMode, setColorMode }}>
      {props.children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode(): ColorModeContextValue {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error("useColorMode must be used within a ColorModeProvider");
  }
  return context;
}

export const getClientColorMode = (): ColorMode => {
  const cookieColorMode = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${COLOR_MODE_COOKIE_KEY}=`))
    ?.split("=")[1];

  if (cookieColorMode === "light" || cookieColorMode === "dark") {
    return cookieColorMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};
