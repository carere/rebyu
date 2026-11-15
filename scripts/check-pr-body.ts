import { validatePrBody } from "./pr-body";

const errors = validatePrBody(process.env.PR_BODY ?? "");
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else console.log("The pull request body follows the template.");
