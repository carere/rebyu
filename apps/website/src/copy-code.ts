export function setupCopy() {
  const status = document.getElementById("copy-status");
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
    button.addEventListener("click", async () => {
      const code = document.getElementById(button.dataset.copy ?? "");
      if (!code?.textContent) return;
      try {
        await navigator.clipboard.writeText(code.textContent.trim());
        button.textContent = "Copied";
        if (status) status.textContent = `${button.getAttribute("aria-label")} — copied.`;
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1800);
      } catch {
        if (status)
          status.textContent = "Clipboard unavailable. Select and copy the code directly.";
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
  }
}
