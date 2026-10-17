import "./style.css";

const home = `
<div class="site-shell">
<nav><a class="wordmark" href="/">rebyu<span>↗</span></a><div class="nav-links"><a href="/" aria-current="page">Home</a><a href="/work">Work</a><a href="/about">About</a></div><span class="playground-label"><span></span> THE PLAYGROUND</span></nav>
<main>
<section class="hero"><div class="edition"><span class="tiny-star">✳</span> MADE FOR THE FINISHING TOUCHES <span class="edition-line"></span> 001</div>
<div class="hero-layout"><div class="hero-copy"><h1 id="home-heading">A little perspective<br/>changes <em>everything.</em></h1><p>Great websites are made together. Turn a passing thought into a thoughtful conversation — right on the page.</p><div class="hero-actions"><button id="try-review">Take a closer look <span>↗</span></button><a href="#how-it-works">Find your flow <span>↓</span></a></div><div class="hero-footnote"><span class="mini-avatars"><i>KA</i><i>AM</i><i>JL</i></span><p>For the people who notice the little things.</p></div></div>
<div class="perspective-art" id="perspective-art" aria-label="Layered geometric illustration of a website review"><div class="art-grid"></div><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-window"><div class="window-bar"><span></span><span></span><span></span><small>another point of view</small></div><div class="window-content"><div class="window-sun">✳</div><div class="window-headline">Room for<br/><i>possibility.</i></div><div class="window-lines"><span></span><span></span></div><div class="window-button">Let’s make something ↗</div></div><div class="art-selection"><i></i><i></i><i></i><i></i></div></div><div class="art-note"><span>↗</span><p>What if we gave this<br/>a little more room?</p><small>A FRESH PERSPECTIVE</small></div><span class="art-spark">✳</span><span class="art-coordinate">GOOD THINGS TAKE A SECOND LOOK.</span></div></div></section>
<div class="manifesto-line"><span>LESS BACK AND FORTH. MORE MOVING FORWARD.</span><span>A note in the right place makes all the difference. <i>↙</i></span></div>
<section class="process" id="how-it-works"><div class="section-heading"><div><p class="eyebrow">FROM “WHAT IF” TO “THAT’S IT”</p><h2>Keep the thought.<br/>Lose the friction.</h2></div><p>No screenshot scavenger hunts.<br/>No “which button did you mean?”<br/>Just clear feedback, in context.</p></div><div class="steps"><article id="step-select"><span class="step-number">01 /</span><div class="step-visual select-visual"><span class="mini-element">That little detail <i>↗</i></span><span class="cursor-arrow">↖</span></div><h3>Point it out.</h3><p>Select an element, draw a box, or sketch your thought. Start wherever your eye lands.</p><span class="step-tag">A LITTLE MORE SPECIFIC</span></article><article id="step-comment"><span class="step-number">02 /</span><div class="step-visual comment-visual"><span class="sample-bubble">A little more breathing room?</span><span class="sample-pin">1</span></div><h3>Say what you see.</h3><p>Leave a note with the context already attached. Good conversations start with clarity.</p><span class="step-tag">EVERY THOUGHT HAS A PLACE</span></article><article id="step-resolve"><span class="step-number">03 /</span><div class="step-visual resolve-visual"><span class="sample-check">✓</span><span>Looking better already.</span></div><h3>Make it better.</h3><p>Keep the conversation going, work through the details, and check off a little progress.</p><span class="step-tag">ONE DETAIL AT A TIME</span></article></div></section>
<section class="details" id="details"><div><span class="tiny-star">✳</span><p class="eyebrow">FITS RIGHT INTO YOUR FLOW</p><h2>Your site.<br/>A fresh set of eyes.</h2><p>One Vite plugin. Any framework. Feedback that feels like part of the process.</p></div><div class="code-card"><div><span>vite.config.ts</span><span>● ● ●</span></div><pre><span class="code-muted">import</span> rebyu <span class="code-muted">from</span> <span class="code-string">'vite-plugin-rebyu'</span>;

<span class="code-muted">export default</span> defineConfig({
  plugins: [<span class="code-call">rebyu</span>()],
});</pre><p><span></span> A small addition. A better conversation.</p></div></section>
<section class="closing"><p>Nothing great was made<br/>without a little <em>back and forth.</em></p><a href="#">Here’s to the next iteration. ↗</a></section>
</main><footer><a class="wordmark" href="/">rebyu<span>↗</span></a><span>BUILT WITH SOLIDJS + ZAIDAN</span><span>A WORK IN PROGRESS. JUST LIKE THE GOOD STUFF.</span></footer></div>`;
const nav = (page: string) =>
  `<nav><a class="wordmark" href="/">rebyu<span>↗</span></a><div class="nav-links"><a href="/">Home</a><a href="/work" ${page === "work" ? 'aria-current="page"' : ""}>Work</a><a href="/about" ${page === "about" ? 'aria-current="page"' : ""}>About</a></div><span class="playground-label"><span></span> THE PLAYGROUND</span></nav>`;
const footer = `<footer><a class="wordmark" href="/">rebyu<span>↗</span></a><span>BUILT WITH SOLIDJS + ZAIDAN</span><a href="/">Back to the beginning ↗</a></footer>`;
const work = `<div class="site-shell">${nav("work")}<main class="inner-page"><section class="page-intro"><p class="eyebrow">A FEW THINGS WE’VE MADE BETTER</p><h1 id="work-heading">Thoughtful work.<br/><em>Room to grow.</em></h1><p>A collection of small details that came together to make something worth a second look.</p></section><div class="project-grid"><article class="project-card" id="work-atlas"><div class="project-cover atlas-cover"><span>ATLAS</span><i>A quieter kind<br/>of adventure.</i><small>FIND YOUR NEXT SOMEWHERE ↗</small></div><div class="project-caption"><h2>Atlas, a travel journal</h2><span>BRAND + WEB · 2026</span></div><p>A home for the places you’ve been, and the ones you haven’t found yet.</p></article><article class="project-card" id="work-form"><div class="project-cover form-cover"><span>form<span class="form-dot">.</span></span><i>Less noise.<br/>More intention.</i><small>OBJECTS FOR EVERYDAY LIVING ↗</small></div><div class="project-caption"><h2>Form, everyday objects</h2><span>COMMERCE · 2026</span></div><p>Simple things, considered carefully. An online shop with a little room to breathe.</p></article></div><section class="page-callout" id="work-cta"><span class="tiny-star">✳</span><h2>The next good idea<br/>could be <em>yours.</em></h2><a class="page-button" href="/about#about-contact">Let’s talk about it ↗</a></section></main>${footer}</div>`;
const about = `<div class="site-shell">${nav("about")}<main class="inner-page"><section class="page-intro"><p class="eyebrow">A SMALL STUDIO. A SHARED POINT OF VIEW.</p><h1 id="about-heading">Made with care.<br/><em>Better together.</em></h1><p>We’re a small team of curious people who believe the best work happens when everyone gets a say.</p></section><section class="about-story"><div class="studio-art"><span>GOOD<br/>THINGS<br/><em>TAKE CARE.</em></span><i>✳</i><small>AN INDEPENDENT DESIGN STUDIO</small></div><div><p class="eyebrow">THE WAY WE SEE IT</p><h2>Details aren’t the little things.<br/>They’re the whole thing.</h2><p>We build websites with people, for people. That means asking questions, leaving room for feedback, and taking the time to get the feeling right.</p><p>From the first sketch to the last line of copy, we’re here for the back and forth that makes a good idea great.</p></div></section><section class="values-grid" id="about-values"><article><span>01 /</span><h3>Stay curious.</h3><p>Ask one more question. Take another look. There’s usually something good waiting there.</p></article><article><span>02 /</span><h3>Make room.</h3><p>For another voice, a different perspective, and the idea that changes everything.</p></article><article><span>03 /</span><h3>Care a little more.</h3><p>About the words, the spacing, the way it feels. Especially the things no one asked you to notice.</p></article></section><section class="page-callout" id="about-contact"><p class="eyebrow">EVERY GOOD THING STARTS SOMEWHERE</p><h2>Have something<br/><em>on your mind?</em></h2><a class="page-button" href="mailto:hello@example.com">Say hello ↗</a><p class="demo-caption">A sample contact section for your review.</p></section></main>${footer}</div>`;
const pages: Record<string, { html: string; title: string }> = {
  "/": { html: home, title: "Rebyu — a little perspective changes everything" },
  "/work": { html: work, title: "Work — Rebyu playground" },
  "/about": { html: about, title: "About — Rebyu playground" },
};
const page = pages[location.pathname.replace(/\/$/, "") || "/"] ?? pages["/"];
let root = document.getElementById("playground-root");
if (!root) {
  root = document.createElement("div");
  root.id = "playground-root";
  document.body.prepend(root);
}
root.innerHTML = page.html;
document.title = page.title;
document.querySelector("#try-review")?.addEventListener("click", () => {
  const widget = document.getElementById("rebyu-widget")?.shadowRoot;
  (widget?.querySelector('[aria-label="Open review tools"]') as HTMLButtonElement)?.click();
  requestAnimationFrame(() => {
    (widget?.querySelector('[aria-label="Annotation tools"]') as HTMLButtonElement)?.click();
    requestAnimationFrame(() => {
      (widget?.querySelector('[aria-label="Select an element"]') as HTMLButtonElement)?.click();
    });
  });
});
