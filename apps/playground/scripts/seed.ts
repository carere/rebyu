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
    selector: "#home-heading",
    tag: "h1",
    text: "A little perspectivechanges everything.",
    author: "Mira Chen",
    message:
      "Could we give the heading a little more breathing room on mobile? The last line feels close to the paragraph.",
    category: "feedback",
    status: "open",
  },
  {
    id: "d0000000-0000-4000-8000-000000000002",
    page: "/",
    selector: "#perspective-art",
    tag: "div",
    text: "",
    author: "Leo Martin",
    message:
      "Love this illustration. A touch more contrast on the annotation would make the idea clearer.",
    category: "idea",
    status: "in-progress",
    reply: "Trying a darker olive for the selection border.",
  },
  {
    id: "d0000000-0000-4000-8000-000000000003",
    page: "/work",
    selector: "#work-heading",
    tag: "h1",
    text: "Thoughtful work.Room to grow.",
    author: "Kevin Abatan",
    message:
      "This introduction sets the right tone. Let’s keep the project cards close to it so the work stays above the fold.",
    category: "feedback",
    status: "open",
  },
  {
    id: "d0000000-0000-4000-8000-000000000004",
    page: "/work",
    selector: "#work-atlas",
    tag: "article",
    text: "",
    author: "Mira Chen",
    message:
      "The project metadata is quite small. Can we increase its size and contrast for readability?",
    category: "bug",
    status: "open",
  },
  {
    id: "d0000000-0000-4000-8000-000000000005",
    page: "/work",
    selector: "#work-cta",
    tag: "section",
    text: "",
    author: "Leo Martin",
    message:
      "The contact link now takes us directly to the About page’s contact section. Looks good!",
    category: "feedback",
    status: "resolved",
    reply: "Updated the destination and checked keyboard navigation.",
  },
  {
    id: "d0000000-0000-4000-8000-000000000006",
    page: "/about",
    selector: "#about-heading",
    tag: "h1",
    text: "Made with care.Better together.",
    author: "Mira Chen",
    message:
      "Could we make this a little more personal by mentioning the team in the opening paragraph?",
    category: "idea",
    status: "open",
  },
  {
    id: "d0000000-0000-4000-8000-000000000007",
    page: "/about",
    selector: "#about-values",
    tag: "section",
    text: "",
    author: "Kevin Abatan",
    message:
      "The values read well, but the three columns need more space between them on tablet widths.",
    category: "feedback",
    status: "in-progress",
  },
  {
    id: "d0000000-0000-4000-8000-000000000008",
    page: "/about",
    selector: "#about-contact",
    tag: "section",
    text: "",
    author: "Leo Martin",
    message: "Replace the sample email address with the real studio inbox before launch.",
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
      userAgent: "Rebyu playground sample",
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
console.log(
  `Added ${added} sample reviews across Home, Work, and About. Existing reviews were preserved.`,
);
