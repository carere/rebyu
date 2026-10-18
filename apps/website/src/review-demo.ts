const targets = { heading: "Heading", button: "Button", card: "Note card" };
type Target = keyof typeof targets;
interface DemoComment {
  id: number;
  target: Target;
  message: string;
  author: string;
  resolved: boolean;
}
interface DemoState {
  selected: Target;
  nextId: number;
  comments: DemoComment[];
}
interface DemoElements {
  form: HTMLFormElement;
  message: HTMLTextAreaElement;
  comments: HTMLOListElement;
  selected: HTMLElement;
  count: HTMLElement;
  status: HTMLElement;
  targets: NodeListOf<HTMLButtonElement>;
}
function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`The review example is missing #${id}.`);
  return node as T;
}
function initialState(): DemoState {
  return {
    selected: "heading",
    nextId: 2,
    comments: [
      {
        id: 1,
        target: "heading",
        message: "Could this heading have a little more breathing room?",
        author: "Sam · example comment",
        resolved: false,
      },
    ],
  };
}
function commentElement(comment: DemoComment, resolve: () => void): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "demo-comment";
  const message = document.createElement("p");
  message.textContent = comment.message;
  const footer = document.createElement("footer");
  const author = document.createElement("span");
  author.textContent = comment.author;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Resolve";
  button.setAttribute("aria-label", `Resolve example comment ${comment.id}`);
  button.addEventListener("click", resolve);
  footer.append(author, button);
  item.append(message, footer);
  return item;
}
function renderDemo(state: DemoState, refs: DemoElements) {
  const open = state.comments.filter((comment) => !comment.resolved);
  refs.selected.textContent = targets[state.selected];
  refs.count.textContent = `${open.length} open sample ${open.length === 1 ? "note" : "notes"}`;
  for (const button of refs.targets) {
    button.setAttribute("aria-pressed", String(button.dataset.reviewTarget === state.selected));
    const pin = open.find((comment) => comment.target === button.dataset.reviewTarget);
    if (pin) button.dataset.pin = String(pin.id);
    else delete button.dataset.pin;
  }
  const comments = open.filter((comment) => comment.target === state.selected);
  refs.comments.replaceChildren(
    ...comments.map((comment) =>
      commentElement(comment, () => {
        comment.resolved = true;
        renderDemo(state, refs);
        refs.message.focus();
        refs.status.textContent = `Example comment ${comment.id} resolved.`;
      }),
    ),
  );
  if (!comments.length) {
    const empty = document.createElement("li");
    empty.className = "demo-empty";
    empty.textContent = "A good place for your first thought. Leave a note below.";
    refs.comments.append(empty);
  }
}
function selectTarget(target: Target, state: DemoState, refs: DemoElements) {
  state.selected = target;
  renderDemo(state, refs);
  refs.message.focus({ preventScroll: true });
  if (window.matchMedia("(max-width: 700px)").matches) {
    refs.selected.scrollIntoView({ block: "center", behavior: "instant" });
  }
  refs.status.textContent = `${targets[target]} selected. Write your note.`;
}
function bindForm(state: DemoState, refs: DemoElements) {
  const submit = refs.form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const updateSubmit = () => {
    if (submit) submit.disabled = !refs.message.value.trim();
  };
  refs.message.addEventListener("input", updateSubmit);
  updateSubmit();
  refs.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = refs.message.value.trim();
    if (!message) return;
    state.comments.push({
      id: state.nextId++,
      target: state.selected,
      message,
      author: "You · demo",
      resolved: false,
    });
    refs.form.reset();
    updateSubmit();
    renderDemo(state, refs);
    refs.message.focus();
    refs.status.textContent = "Your note is attached. It is only visible in this tab.";
  });
}
export function setupDemo() {
  const state = initialState();
  const refs: DemoElements = {
    form: element("review-form"),
    message: element("demo-message"),
    comments: element("demo-comments"),
    selected: element("selected-target"),
    count: element("demo-count"),
    status: element("demo-status"),
    targets: document.querySelectorAll<HTMLButtonElement>("[data-review-target]"),
  };
  for (const button of refs.targets) {
    button.addEventListener("click", () => {
      const target = button.dataset.reviewTarget;
      if (target && target in targets) selectTarget(target as Target, state, refs);
    });
  }
  element("reset-demo").addEventListener("click", () => {
    Object.assign(state, initialState());
    refs.form.reset();
    refs.message.dispatchEvent(new Event("input"));
    renderDemo(state, refs);
    refs.status.textContent = "The example has been reset.";
  });
  bindForm(state, refs);
  renderDemo(state, refs);
}
