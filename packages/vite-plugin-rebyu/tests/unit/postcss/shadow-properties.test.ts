import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { shadowProperties } from "../../../postcss/shadow-properties";

async function compile(css: string) {
  return (await postcss([shadowProperties()]).process(css, { from: undefined })).root;
}

describe("Given Tailwind styles bundled inside the widget ShadowRoot", () => {
  it("Then borders, pseudo-elements, and shadows receive Tailwind’s compatibility defaults locally", async () => {
    const root = await compile(`
      @layer properties, base, utilities;
      @layer properties {
        @supports (not (color: rgb(from red r g b))) {
          *, ::before, ::after {
            --tw-border-style: solid;
            --tw-content: "";
            --tw-ring-shadow: 0 0 #0000;
            --tw-ring-offset-width: 0px;
            --tw-ring-color: initial;
          }
        }
      }
      @property --tw-ring-offset-width { syntax: "<length>"; inherits: false; initial-value: 0; }
    `);
    const defaults: Record<string, string> = {};
    root.walkRules((rule) => {
      if (!rule.selector.includes(".rebyu-root")) return;
      expect(rule.selector).toContain("::before");
      expect(rule.selector).toContain("::after");
      expect(rule.parent?.type).toBe("atrule");
      rule.walkDecls((decl) => {
        defaults[decl.prop] = decl.value;
      });
    });
    expect(defaults).toEqual({
      "--tw-border-style": "solid",
      "--tw-content": '""',
      "--tw-ring-shadow": "0 0 #0000",
      "--tw-ring-offset-width": "0px",
      "--tw-ring-color": "initial",
    });
  });

  it("Then unrelated CSS does not create widget defaults", async () => {
    const root = await compile(`
      @property --application-color { syntax: "<color>"; inherits: true; initial-value: red; }
      @property --tw-optional { syntax: "*"; inherits: false; }
    `);
    const rules: string[] = [];
    root.walkRules((rule) => {
      rules.push(rule.selector);
    });
    expect(rules).toEqual([]);
  });

  it("Then the original registration and utility overrides remain intact", async () => {
    const root = await compile(`
      @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid; }
      @layer properties {
        @supports (not (color: rgb(from red r g b))) {
          *, ::before { --tw-border-style: solid; }
        }
      }
      @layer utilities { .border-dashed { --tw-border-style: dashed; } }
    `);
    const layers: string[] = [];
    root.walkAtRules("layer", (rule) => {
      layers.push(rule.params);
    });
    expect(layers).toContain("properties");
    expect(root.toString()).toContain(".border-dashed { --tw-border-style: dashed; }");
    let registrations = 0;
    root.walkAtRules("property", () => {
      registrations++;
    });
    expect(registrations).toBe(1);
  });
});
