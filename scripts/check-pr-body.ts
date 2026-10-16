import { readFileSync } from "node:fs";
import { prTemplateFromSkill, validatePrBody } from "./pr-body";

const template = prTemplateFromSkill(
  readFileSync(new URL("../.agents/skills/pr/SKILL.md", import.meta.url), "utf8"),
);
const errors = validatePrBody(process.env.PR_BODY ?? "", template);
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else console.log("The pull request body follows the template.");
