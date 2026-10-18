import { fileURLToPath } from "node:url";
import type { Review } from "../../../packages/vite-plugin-rebyu/src/schema";
import { ReviewStore } from "../../../packages/vite-plugin-rebyu/src/store";

const store = new ReviewStore(fileURLToPath(new URL("../.rebyu/reviews.json", import.meta.url)));
const samples: {
  id: string;
  page: string;
  selector: string;
  tag: string;
  text: string;
  author: string;
  message: string;
  category: Review["category"];
  status: Review["status"];
  reply?: string;
}[] = [
  {
    id: "d0000000-0000-4000-8000-000000000001",
    page: "/",
    selector: "#hero-heading",
    tag: "h1",
    text: "Show themwhat you mean.",
    author: "Mira Chen",
    message:
      "Could we give the heading a little more breathing room on mobile? The last line feels close to the paragraph.",
    category: "feedback",
    status: "open",
  },
  {
    id: "d0000000-0000-4000-8000-000000000002",
    page: "/",
    selector: "#demo",
    tag: "div",
    text: "",
    author: "Leo Martin",
    message: "Make the selected target stand out more clearly in the interactive example.",
    category: "idea",
    status: "in-progress",
    reply: "Trying a stronger selected state for the sample target.",
  },
  {
    id: "d0000000-0000-4000-8000-000000000003",
    page: "/",
    selector: "#install-heading",
    tag: "h2",
    text: "One plugin.Your website.",
    author: "Kevin Abatan",
    message: "Keep the integration code close to the setup explanation so it is easy to find.",
    category: "feedback",
    status: "open",
  },
  {
    id: "d0000000-0000-4000-8000-000000000004",
    page: "/",
    selector: "#install-command",
    tag: "code",
    text: "",
    author: "Mira Chen",
    message: "Can the copy button confirm when the installation command has been copied?",
    category: "bug",
    status: "open",
  },
  {
    id: "d0000000-0000-4000-8000-000000000005",
    page: "/",
    selector: "#vite-example",
    tag: "code",
    text: "",
    author: "Leo Martin",
    message: "The configuration example includes both imports and the plugin. This is clearer.",
    category: "feedback",
    status: "resolved",
    reply: "Checked the complete configuration example.",
  },
  {
    id: "d0000000-0000-4000-8000-000000000006",
    page: "/",
    selector: "#details-heading",
    tag: "h2",
    text: "Less describing.More understanding.",
    author: "Mira Chen",
    message: "This explanation should make it clear that feedback remains connected to the page.",
    category: "idea",
    status: "open",
  },
  {
    id: "d0000000-0000-4000-8000-000000000007",
    page: "/",
    selector: "#demo-message",
    tag: "textarea",
    text: "",
    author: "Kevin Abatan",
    message: "Give the note field enough room to write a complete thought on a phone.",
    category: "feedback",
    status: "in-progress",
  },
  {
    id: "d0000000-0000-4000-8000-000000000008",
    page: "/",
    selector: "#reset-demo",
    tag: "button",
    text: "",
    author: "Leo Martin",
    message: "Keep the reset action reachable after someone leaves a sample note.",
    category: "bug",
    status: "open",
  },
];
const existing = new Set((await store.list()).map((review) => review.id));
let added = 0;
for (const sample of samples) {
  if (existing.has(sample.id)) continue;
  await store.create({
    id: sample.id,
    page: sample.page,
    author: sample.author,
    message: sample.message,
    category: sample.category,
    anchor: {
      selector: sample.selector,
      xpath: "",
      tag: sample.tag,
      text: sample.text,
      kind: "element",
      rect: { x: 40, y: 200, width: 320, height: 120 },
      offset: { x: 0, y: 0 },
      size: { x: 1, y: 1 },
      points: [],
    },
    context: {
      viewport: "1440 × 960",
      userAgent: "Rebyu website sample",
      errors: [],
    },
  });
  await store.update(sample.id, {
    status: sample.status,
    ...(sample.reply
      ? {
          reply: {
            id: sample.id.replace("d0000000", "e0000000"),
            author: "Kevin Abatan",
            message: sample.reply,
          },
        }
      : {}),
  });
  added++;
}
console.log(`Added ${added} sample reviews on the website. Existing reviews were preserved.`);
