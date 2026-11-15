interface Section {
  heading: string;
  content: string;
}

const sections = (markdown: string): Section[] => {
  const result: Section[] = [];
  let fence = "";
  for (const line of markdown.replace(/<!--.*?-->/gs, "").split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = "";
    }
    const heading = !fence && !marker ? line.match(/^##\s+(.+?)\s*#*\s*$/)?.[1] : undefined;
    if (heading) result.push({ heading, content: "" });
    else {
      const section = result.at(-1);
      if (section) section.content += `${line}\n`;
    }
  }
  return result;
};

// CI's structure and placeholder checks stay local; writing guidance lives in Home's pr skill.
const expected = ["Summary", "Evidence", "Merge Danger"];
const placeholders = [
  "<diagram, diff-sketch, or tree>",
  "<video/output/failing test run>",
  "<video/output/passing test run>",
  "<one-way or two-way>",
  "<optional: description>",
  "<one-word description>",
  "<optional: potential ramifications of merge>",
];

export const validatePrBody = (body: string): string[] => {
  const errors: string[] = [];
  const actual = sections(body);
  if (actual.map(({ heading }) => heading).join("\n") !== expected.join("\n")) {
    errors.push(`Use the template headings once each, in order: ${expected.join(", ")}.`);
  }
  if (body.includes("<!--")) errors.push("Remove the template's HTML comment blocks.");
  if (/\bCloses\s+#0+\b/i.test(body)) errors.push("Replace Closes #000 or remove that line.");
  for (const { heading, content } of actual) {
    if (!content.trim()) errors.push(`Complete the ${heading} section.`);
  }
  for (const placeholder of placeholders) {
    if (body.includes(placeholder)) errors.push(`Replace the template placeholder ${placeholder}.`);
  }
  const risk = actual.find(({ heading }) => heading === "Merge Danger")?.content ?? "";
  if (!/^\*\*Door:\*\*\s*(?:one-way|two-way)\b/m.test(risk)) {
    errors.push("Merge Danger must declare **Door:** one-way or two-way.");
  }
  if (!/^\*\*Blast Radius:\*\*[^\S\n]*\S[^\n]*/m.test(risk)) {
    errors.push("Merge Danger must declare a completed **Blast Radius:**.");
  }
  return errors;
};
