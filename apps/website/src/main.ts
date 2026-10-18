import "./style.css";

if (import.meta.env.MODE === "test") {
  await import("../tests/fixtures/site");
} else {
  const { setupDemo } = await import("./review-demo");
  const { setupCopy } = await import("./copy-code");
  setupDemo();
  setupCopy();
}
