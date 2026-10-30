/* =========================================================
   MEDIA — finds the images and videos of every project
   Shared by all pages (website and PDF portfolio).
   ========================================================= */
const ASSET_FOLDER = "assets";
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4"];

// File name from the title: spaces -> _, special characters like [ ] are dropped
function fileName(title) {
  return title.trim().replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_-]/gu, "");
}

// List of all files, written automatically by GitHub on every push (assets.json).
// Online the site reads only this one file instead of searching for every image.
// Locally (or if it is missing) the list from layout.js is used instead.
function loadJSON(file, local) {
  const fallback = () => local() || null;
  return location.protocol.startsWith("http")
    ? fetch(file, { cache: "no-cache" }).then(r => r.ok ? r.json() : fallback()).catch(fallback)
    : Promise.resolve(fallback());
}
const manifest = loadJSON("assets.json", () => window.LOCAL_ASSETS);
// Arrangement made with the gallery editor (editor.html)
const layoutData = loadJSON("layout.json", () => window.LOCAL_LAYOUT);

const encodePath = path => path.split("/").map(encodeURIComponent).join("/");
async function savedLayout(project) {
  const data = await layoutData;
  return (data && data.projects && data.projects[fileName(project.title)]) || null;
}
const fileOf = src => decodeURIComponent(src.split("/").pop());
// files in the order arranged in the editor: top to bottom, then left to right
const arrangedFiles = saved => saved.desktop.slice().sort((a, b) => a.y - b.y || a.x - b.x).map(e => e.file);

// Finds all files of a project; the result is cached
const mediaCache = {};
function media(project) {
  if (!mediaCache[project.slug]) {
    mediaCache[project.slug] = (async () => {
      const name = fileName(project.title);
      const files = await manifest;
      const saved = await savedLayout(project);

      // 1. Online: every image or video in the project folder counts, whatever its name
      if (files) {
        const prefix = `${ASSET_FOLDER}/${name}/`;
        const hidden = new Set((saved && saved.hidden) || []);
        let names = files
          .filter(f => f.startsWith(prefix) && !f.slice(prefix.length).includes("/"))
          .map(f => f.slice(prefix.length))
          .filter(n => EXTENSIONS.some(e => n.toLowerCase().endsWith(e)) && !hidden.has(n))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        // order: as arranged in the editor (top to bottom, then left to right); new files at the end
        if (saved && saved.desktop) {
          const arranged = arrangedFiles(saved).filter(n => names.includes(n));
          names = arranged.concat(names.filter(n => !arranged.includes(n)));
        }
        return names.map(n => encodePath(prefix + n));
      }

      // 2. No list at all (editor not saved yet): show the files arranged in the editor
      if (!saved || !saved.desktop) return [];
      return arrangedFiles(saved).map(f => encodePath(`${ASSET_FOLDER}/${name}/${f}`));
    })();
  }
  return mediaCache[project.slug];
}

// Every image and video in the project folder – also the ones hidden on the website – sorted by name
// (used by the PDF portfolio, which has its own selection); the result is cached
const allMediaCache = {};
function allMedia(project) {
  if (!allMediaCache[project.slug]) {
    allMediaCache[project.slug] = (async () => {
      const prefix = `${ASSET_FOLDER}/${fileName(project.title)}/`;
      const files = await manifest;
      let names;
      if (files) {
        names = files.filter(f => f.startsWith(prefix) && !f.slice(prefix.length).includes("/"))
          .map(f => f.slice(prefix.length));
      } else {                                    // no list at all: the files known from the editor
        const saved = await savedLayout(project);
        names = [...new Set([...((saved && saved.desktop) || []), ...((saved && saved.pdf && saved.pdf.items) || [])].map(e => e.file))];
      }
      return names.filter(n => EXTENSIONS.some(e => n.toLowerCase().endsWith(e)))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map(n => encodePath(prefix + n));
    })();
  }
  return allMediaCache[project.slug];
}
