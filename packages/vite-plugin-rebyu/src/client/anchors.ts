import type { Anchor } from "../schema";
export const HOST_ID = "rebyu-widget";
export function isIgnored(element: Element | null): boolean {
  return !element || !!element.closest(`#${HOST_ID}, [data-rebyu-ignore], script, style, iframe`);
}
export function makeAnchor(
  element: Element,
  kind: Anchor["kind"],
  box?: { x: number; y: number; width: number; height: number },
  points: { x: number; y: number }[] = [],
): Anchor {
  const rect = element.getBoundingClientRect();
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== document.documentElement) {
    if (node.id) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const tag = node.tagName;
    const siblings = node.parentElement
      ? [...node.parentElement.children].filter((e) => e.tagName === tag)
      : [];
    parts.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(node) + 1})`);
    node = node.parentElement;
  }
  const xpath: string[] = [];
  node = element;
  while (node) {
    const tag = node.tagName;
    const siblings = node.parentElement
      ? [...node.parentElement.children].filter((e) => e.tagName === tag)
      : [node];
    xpath.unshift(`${node.tagName.toLowerCase()}[${siblings.indexOf(node) + 1}]`);
    node = node.parentElement;
  }
  const area = box ?? {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  return {
    selector: parts.join(" > "),
    xpath: `/${xpath.join("/")}`,
    tag: element.tagName.toLowerCase(),
    text: element.textContent?.trim().slice(0, 120) ?? "",
    kind,
    rect: {
      x: area.x + scrollX,
      y: area.y + scrollY,
      width: area.width,
      height: area.height,
    },
    offset: {
      x: clamp((area.x - rect.x) / (rect.width || 1)),
      y: clamp((area.y - rect.y) / (rect.height || 1)),
    },
    size: {
      x: clamp(area.width / (rect.width || 1)),
      y: clamp(area.height / (rect.height || 1)),
    },
    points,
  };
}
export function findAnchor(anchor: Anchor): Element | null {
  try {
    const found = document.querySelector(anchor.selector);
    if (found && !isIgnored(found) && found.tagName.toLowerCase() === anchor.tag) return found;
  } catch {}
  try {
    const found = document.evaluate(
      anchor.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;
    if (
      found instanceof Element &&
      !isIgnored(found) &&
      found.tagName.toLowerCase() === anchor.tag &&
      (!anchor.text || found.textContent?.trim().slice(0, 120) === anchor.text)
    )
      return found;
  } catch {}
  if (anchor.text)
    return (
      [...document.getElementsByTagName(anchor.tag)].find(
        (e) => !isIgnored(e) && e.textContent?.trim().slice(0, 120) === anchor.text,
      ) ?? null
    );
  return null;
}
export function anchorBox(anchor: Anchor) {
  const element = findAnchor(anchor);
  const rect = element?.getBoundingClientRect();
  if (rect) {
    if (anchor.kind === "element")
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        attached: true,
      };
    return {
      x: rect.x + rect.width * anchor.offset.x,
      y: rect.y + rect.height * anchor.offset.y,
      width: rect.width * anchor.size.x,
      height: rect.height * anchor.size.y,
      attached: true,
    };
  }
  return {
    ...anchor.rect,
    x: anchor.rect.x - scrollX,
    y: anchor.rect.y - scrollY,
    attached: false,
  };
}
