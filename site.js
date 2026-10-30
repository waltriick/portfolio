/* =========================================================
   SHARED BEHAVIOUR — used by every page (index.html, portfolio.html)
   ========================================================= */
const sidebar = document.querySelector(".sidebar");

// Upright layout: the menu is fixed at the top, the content starts below it
function updateHeaderHeight() {
  document.documentElement.style.setProperty("--header-height", sidebar.offsetHeight + "px");
}
updateHeaderHeight();
window.addEventListener("resize", updateHeaderHeight);
document.fonts?.ready.then(updateHeaderHeight);   // the font changes the height of the menu

// Touch: a tap switches the blur of the word on for a moment (.tap-blur), the CSS transition
// fades it in and out. Mouse: the blur comes from hovering, see style.css.
const TAP_BLUR = 700;                         // milliseconds until the blur is switched off again
const BLUR_TAPS = ".sidebar a, .subtitle, .text-button:not(:disabled)";   // what blurs when tapped
let tapTimer = null;
document.addEventListener("touchstart", e => {
  const el = e.target.closest(BLUR_TAPS)?.querySelector(".blur");
  if (!el) return;
  document.querySelectorAll(".tap-blur").forEach(other => other.classList.remove("tap-blur"));   // only one word at a time
  el.classList.add("tap-blur");
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => el.classList.remove("tap-blur"), TAP_BLUR);
}, { passive: true });
