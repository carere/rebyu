import { createContext } from "solid-js";

// Overlay descendants use the widget mount rather than the host document body.
export const OverlayMountContext = createContext<HTMLElement>();
