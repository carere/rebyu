import type { Declaration, Plugin } from "postcss";

// Tailwind emits compatibility defaults for browsers without @property support.
// Apply those exact defaults in the ShadowRoot too, without changing utilities.
export function shadowProperties(): Plugin {
  return {
    postcssPlugin: "rebyu-shadow-properties",
    OnceExit(root, { AtRule, Rule }) {
      const values = new Map<string, Declaration>();
      root.walkAtRules("layer", (layer) => {
        if (layer.params !== "properties") return;
        layer.walkRules((rule) => {
          if (!rule.selector.split(",").some((selector) => selector.trim() === "*")) return;
          rule.walkDecls((decl) => {
            if (decl.prop.startsWith("--tw-")) values.set(decl.prop, decl.clone());
          });
        });
      });
      if (!values.size) return;
      const defaults = new Rule({
        selector:
          ".rebyu-root, .rebyu-root *, .rebyu-root::before, .rebyu-root::after, .rebyu-root *::before, .rebyu-root *::after",
        source: root.source,
      });
      for (const value of values.values()) defaults.append(value);
      const layer = new AtRule({ name: "layer", params: "properties", source: root.source });
      layer.append(defaults);
      root.append(layer);
    },
  };
}
