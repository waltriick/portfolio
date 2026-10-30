/* =========================================================
   PDF PORTFOLIO — builds the book from the chosen projects
   A4, read as double pages (left page = even number, right page = odd number):
     1        cover: the title images of the chosen projects, scattered like on the start page,
              behind frosted glass; "patrick walter archive" in one line and below it the
              date and time of creating the pdf, both right-aligned
     2 – 3    statement from the info page, at the bottom (left) · contents (right)
     4 – 5    about me: portrait (picture(s) from assets/about_me, placed in the gallery editor,
              "about me" in mode "pdf") · cv (right)
     then     per project an introduction double page:
              left = its title image over the whole page behind frosted glass with the project title,
              right = the facts,
              then the double pages with its images as arranged in the gallery editor (mode "pdf"),
              cropped as set there, each with its number and on every page a list of the image titles
              (settings: PDF_CAPTION in pdf-layout.js)
     last     back cover, a single black page: the logo (favicon.svg, in white) centred on the lower margin,
              above it name, "archive", a short note, contact, date and time, aligned to the logo's left edge
   Title image of a project: chosen in the gallery editor, otherwise its first image.
   The margins of all pages (around and at the bottom) are set in the gallery editor (layout.json), see also pdf-layout.js.
   Uses the free library pdf-lib (loaded only when you click "create pdf").
   ========================================================= */
const PDF = {
  size: 12,                // pt, normal text
  small: 7.5,             // pt, page numbers
  lineHeight: 1.45,       // like the website
  listWidth: 80,          // mm, width of the contents list (like the menu on the website)
  textWidth: 120,         // mm, width of longer texts
  yearColumn: 24,         // mm, year column of the cv
  coverWidth: [30, 80],   // mm, smallest and largest image on the cover
  coverTitle: {           // "patrick walter   archive" on the cover, in one line on the same baseline
    size: 18,             // pt, "patrick walter"
    style: "bold italic",      // "normal", "bold", "italic" or "bold italic"
    archiveSize: 15,      // pt, "archive" (smaller)
    archiveStyle: "italic",
    gap: 5,               // mm, space between "patrick walter" and "archive"
    x: 0.9,              // RIGHT end of the text, as part of the page width (0.5 = middle, 1 = right edge)
    y: 0.465,             // height of the baseline, as part of the page height (0.5 = middle)
    dateSize: 10,          // pt, date and time of creating the pdf, in a line below (also right-aligned)
    dateStyle: "italic",
    dateGap: 6            // mm from the baseline of the title to the baseline of the date
  },
  backCover: {            // last page, black: logo centred on the lower margin, the text above it
                          // (text starts at the left edge of the logo and stacks upwards from it)
    width: 80,            // mm, width of the text block
    size: 12,              // pt
    style: "italic",      // "normal", "bold", "italic" or "bold italic"
    gap: 10,              // mm, empty space between the parts (name, note, contact, date, logo)
    // the note; <br> starts a new line (<br><br> = an empty line)
    note: "This portfolio shows a curated selection of my projects. It is not a fixed publication and may change over time.<br>Please visit patrickarchive.com for more projects.",
    logo: "favicon.svg",  // logo, drawn in white ("" = no logo; the text then stands where the logo would be)
    logoWidth: 12         // mm
  },
  introTitle: {           // project title on the left introduction page (on the frosted title image)
    size: 18,             // pt
    style: "bold italic", // "normal", "bold", "italic" or "bold italic"
    align: "left",        // "left" = x is where the text starts, "right" = x is where the text ends
    x: 0.1,               // as part of the page width (0 = left edge, 0.5 = middle, 1 = right edge)
    y: 0.465              // height of the baseline, as part of the page height (0.5 = middle)
  },

  // type style of the other texts: "normal", "bold", "italic" or "bold italic"
  styles: {
    header: "normal",       // "patrick walter / archive" above the contents
    contents: "normal",     // entries of the contents (and their page numbers)
    heading: "normal",      // headings of the statement and the cv, e.g. "education"
    text: "normal",         // running text: statement, cv entries, project texts
    year: "normal",         // years in the cv
    projectTitle: "normal", // title on the right introduction page
    facts: "normal",        // year, place and context of a project
    pageNumber: "normal"
  },

  // frosted glass of the cover
  coverFrost: {
    dark: true,           // true = black page, black haze and white text · false = white page, white haze, black text
    blur: 100,            // how strongly the images are blurred (higher = softer)
    haze: 0.5,           // milky layer on top (0 = none, 1 = only the colour of the layer)
    pale: 0.36,           // takes away colour (0 = full colour)
    grain: 5              // fine grain like on film (0 = none)
  },
  // frosted glass of the left introduction page of every project
  introFrost: {
    dark: false,          // same meaning as above
    blur: 75,
    haze: 0.25,
    pale: 0.36,
    grain: 5
  },
  fileName: "patrick_walter_portfolio.pdf"
};

const A4 = PDF_PAGE;                            // mm, 210 × 297 (pdf-layout.js)
const PT = 72 / 25.4;                           // points per mm (PDF measures in points)
const BLACK = [17, 17, 17], GREY = [138, 138, 138], PLACEHOLDER = [241, 240, 238];
const MM_PER_PT = 25.4 / 72;

/* ---------- small helpers ---------- */
// pdf-lib is only loaded when it is needed
function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("the pdf tool could not be loaded (no internet?)"));
    document.head.appendChild(s);
  });
}

// text from the HTML of projects.js: <br> becomes a line break, tags disappear
function plain(html) {
  const div = document.createElement("div");
  div.innerHTML = String(html || "").replace(/<br\s*\/?>/gi, "\n");
  return div.textContent.trim();
}

// Helvetica, like the website, in its four styles (built into every PDF program)
let fonts = null;
const fontOf = style => fonts[style] || fonts.normal;
const colour = c => PDFLib.rgb(c[0] / 255, c[1] / 255, c[2] / 255);
const lineHeight = (size = PDF.size) => size * MM_PER_PT * PDF.lineHeight;

// the built-in PDF font knows the usual Western characters; anything else is replaced
const charOk = {};
function safe(text) {
  return [...String(text)].map(ch => {
    if (ch === "\n") return ch;
    if (charOk[ch] === undefined) { try { fonts.normal.widthOfTextAtSize(ch, 10); charOk[ch] = true; } catch (e) { charOk[ch] = false; } }
    return charOk[ch] ? ch : ({ "\u2212": "-", "\u2192": "->" }[ch] || "");
  }).join("");
}
const textWidth = (text, size, style) => fontOf(style).widthOfTextAtSize(text, size) * MM_PER_PT;   // mm

// breaks text into lines that fit into "width" (mm); \n starts a new line
function wrap(text, width, size, style) {
  if (!width) return text.split("\n");
  const lines = [];
  text.split("\n").forEach(par => {
    let line = "";
    par.split(/ +/).forEach(word => {
      const test = line ? line + " " + word : word;
      if (line && textWidth(test, size, style) > width) { lines.push(line); line = word; }
      else line = test;
    });
    lines.push(line);
  });
  return lines;
}

// writes text with its top edge at y (mm from the top of the page), returns the y below it
// (page = null only measures, without writing)
function write(page, text, x, y, { size = PDF.size, color = BLACK, width, align = "left", style = "normal" } = {}) {
  const font = fontOf(style);
  const lines = wrap(safe(text), width, size, style);
  const lh = lineHeight(size);
  const ascent = font.heightAtSize(size, { descender: false }) * MM_PER_PT;
  if (page) lines.forEach((line, i) => {
    const w = textWidth(line, size, style);
    const lx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
    page.drawText(line, { x: lx * PT, y: (A4.h - y - i * lh - (lh - size * MM_PER_PT) / 2 - ascent) * PT, size, font, color: colour(color) });
  });
  return y + lines.length * lh;
}

// image or rectangle, positioned in mm from the top left corner
function drawImage(page, image, x, y, w, h) {
  page.drawImage(image, { x: x * PT, y: (A4.h - y - h) * PT, width: w * PT, height: h * PT });
}

// clickable area that jumps to another page
function link(pdf, page, x, y, w, h, target) {
  const annot = pdf.context.obj({
    Type: "Annot", Subtype: "Link", Border: [0, 0, 0],
    Rect: [x * PT, (A4.h - y - h) * PT, (x + w) * PT, (A4.h - y) * PT],
    Dest: [target.ref, "XYZ", null, null, null]
  });
  page.node.addAnnot(pdf.context.register(annot));
}

// page number: on the outer edge of the margin, in the middle of the lower margin
function pageNumber(page, n) {
  const left = n % 2 === 0;
  write(page, String(n), left ? PDF.margin : A4.w - PDF.margin, A4.h - PDF.margin / 2 - lineHeight(PDF.small) / 2,
    { size: PDF.small, color: GREY, align: left ? "left" : "right", style: PDF.styles.pageNumber });
}

/* ---------- images ---------- */
const imageCache = {};
function loadImage(src) {
  if (!imageCache[src]) {
    imageCache[src] = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);       // missing file: simply left out
      img.src = src;
    });
  }
  return imageCache[src];
}

// an empty page as a canvas (150 dpi); px = how many pixels one mm is
function pageCanvas() {
  const c = document.createElement("canvas");
  c.width = 1240;
  c.height = Math.round(c.width * A4.h / A4.w);
  return { canvas: c, ctx: c.getContext("2d"), px: c.width / A4.w };
}

// frosted glass over the whole page: blurred, a little pale, milky, fine grain
// (settings: PDF.coverFrost or PDF.introFrost; dark = black instead of white haze)
function frost(canvas, { blur, haze, pale, grain, dark }) {
  const W = canvas.width, H = canvas.height, ctx = canvas.getContext("2d");
  // blur: shrink step by step, then enlarge step by step (smooth in every browser)
  let src = canvas, w = W, h = H;
  const steps = [];
  while (w / 2 >= W / blur) {
    w = Math.round(w / 2); h = Math.round(h / 2);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const cx = c.getContext("2d");
    cx.imageSmoothingQuality = "high";
    cx.drawImage(src, 0, 0, w, h);
    steps.push(c);
    src = c;
  }
  for (let i = steps.length - 2; i >= -1; i--) {
    const target = i >= 0 ? steps[i] : canvas;
    const tx = target.getContext("2d");
    tx.imageSmoothingQuality = "high";
    tx.clearRect(0, 0, target.width, target.height);
    tx.drawImage(src, 0, 0, target.width, target.height);
    src = target;
  }
  ctx.globalCompositeOperation = "saturation";
  ctx.fillStyle = `rgba(128, 128, 128, ${pale})`;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = dark ? `rgba(0, 0, 0, ${haze})` : `rgba(255, 255, 255, ${haze})`;
  ctx.fillRect(0, 0, W, H);
  if (grain) {
    const data = ctx.getImageData(0, 0, W, H);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * grain;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(data, 0, 0);
  }
  return canvas.toDataURL("image/jpeg", 0.85);
}

// introduction page: the image fills the whole page (cropped in the middle), behind frosted glass
function frostedImage(img) {
  const { canvas, ctx } = pageCanvas();
  const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
  ctx.drawImage(img, (canvas.width - iw) / 2, (canvas.height - ih) / 2, iw, ih);
  return frost(canvas, PDF.introFrost);
}

// cover: the images scattered at random over the whole page so that they cover each other
// as little as possible (like the start page), behind frosted glass
function frostedCover(images) {
  const { canvas, ctx, px } = pageCanvas();
  ctx.fillStyle = PDF.coverFrost.dark ? "#000" : "#fff";   // paper colour of the cover
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const placed = [];
  const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
                            Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  images.forEach(img => {
    const w = PDF.coverWidth[0] + Math.random() * (PDF.coverWidth[1] - PDF.coverWidth[0]);
    const h = w * img.naturalHeight / img.naturalWidth;
    let best = null;
    for (let k = 0; k < 60; k++) {
      const box = { x: -8 + Math.random() * (A4.w - w + 16), y: -10 + Math.random() * (A4.h - h + 20), w, h };
      const score = placed.reduce((sum, p) => sum + overlap(box, p), 0);
      if (!best || score < best.score) best = { ...box, score };
    }
    placed.push(best);
    ctx.drawImage(img, best.x * px, best.y * px, best.w * px, best.h * px);
  });
  return frost(canvas, PDF.coverFrost);
}

// image for a page of the pdf: JPEG with about 300 dpi at the size it has on the paper (w in mm),
// cut as set in the gallery editor (crop: part cut away on each side, see pdf-layout.js)
function printJpeg(img, w, crop = {}) {
  const { l = 0, t = 0, r = 0, b = 0 } = crop;
  const sw = img.naturalWidth * (1 - l - r), sh = img.naturalHeight * (1 - t - b);   // part that is kept
  const width = Math.min(Math.round(sw), Math.round(w / 25.4 * 300));
  const c = document.createElement("canvas");
  c.width = width;
  c.height = Math.round(width * sh / sw);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";                         // transparent PNGs get a white background
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, img.naturalWidth * l, img.naturalHeight * t, sw, sh, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.9);
}

/* ---------- cv from the info text in projects.js ---------- */
// every <h2> starts a section; a section holds paragraphs and rows (year + entry) in their order
function infoSections() {
  const div = document.createElement("div");
  div.innerHTML = infoHTML;
  const sections = [];
  let current = null;
  [...div.children].forEach(el => {
    if (el.tagName === "H2") { current = { title: el.textContent.trim(), blocks: [] }; sections.push(current); return; }
    if (!current) { current = { title: "", blocks: [] }; sections.push(current); }
    if (el.tagName === "UL") {
      el.querySelectorAll("li").forEach(li => {
        const [year, ...rest] = [...li.children].map(c => c.textContent.trim());
        current.blocks.push({ row: [year, rest.join(" ")] });
      });
    } else {
      // <p class="contact"> goes to the back cover, everything else stays in its section
      current.blocks.push({ text: plain(el.innerHTML), contact: el.classList.contains("contact") });
    }
  });
  return sections;
}

// draws one section (heading, paragraphs, rows), returns the y of its lower edge
// (page = null only measures)
function drawSection(page, section, x, y) {
  const st = PDF.styles;
  if (section.title) y = write(page, section.title.toLowerCase(), x, y, { style: st.heading }) + lineHeight() * 0.5;
  section.blocks.forEach((b, i) => {
    const prev = section.blocks[i - 1];
    if (prev && b.text) y += prev.text ? lineHeight() * 0.5 : lineHeight();   // room before a paragraph
    if (prev && !b.text && prev.text) y += lineHeight() * 0.5;
    if (b.text) {
      y = write(page, b.text, x, y, { width: PDF.textWidth, style: st.text });
    } else {
      write(page, b.row[0], x, y, { color: GREY, style: st.year });
      y = write(page, b.row[1], x + PDF.yearColumn, y, { width: PDF.textWidth - PDF.yearColumn, style: st.text });
    }
  });
  return y;
}

/* ---------- the pages ---------- */
// date and time in the form 2026-10-28 12:15am
function timestamp(d = new Date()) {
  const two = n => String(n).padStart(2, "0");
  const h = d.getHours() % 12 || 12;              // 12-hour clock: 12:05am, 01:30pm …
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(h)}:${two(d.getMinutes())}${d.getHours() < 12 ? "am" : "pm"}`;
}

// cover: frosted image, "patrick walter" and a smaller "archive" on one baseline,
// below it the date and time of creating the pdf, all right-aligned at PDF.coverTitle.x
function cover(page, image, date) {
  if (image) drawImage(page, image, 0, 0, A4.w, A4.h);
  const ink = colour(PDF.coverFrost.dark ? [255, 255, 255] : BLACK);   // white text on the dark cover
  const { size, style, archiveSize, archiveStyle, gap, x, y, dateSize, dateStyle, dateGap } = PDF.coverTitle;
  const name = "patrick walter", word = "archive";
  const nameWidth = textWidth(name, size, style);
  const left = A4.w * x - nameWidth - gap - textWidth(word, archiveSize, archiveStyle);
  const baseline = (A4.h - A4.h * y) * PT;
  page.drawText(name, { x: left * PT, y: baseline, size, font: fontOf(style), color: ink });
  page.drawText(word, { x: (left + nameWidth + gap) * PT, y: baseline, size: archiveSize, font: fontOf(archiveStyle), color: ink });
  page.drawText(date, { x: (A4.w * x - textWidth(date, dateSize, dateStyle)) * PT, y: baseline - dateGap * PT,
    size: dateSize, font: fontOf(dateStyle), color: ink });
}

// the logo as a white picture (PNG with transparent background), whatever colour the SVG has;
// returns { data, ratio } or null if the file is missing
async function whiteLogo(file) {
  try {
    let svg = await (await fetch(file, { cache: "no-cache" })).text();
    // give the SVG a fixed size so every browser draws it sharply
    const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
    const [, , vw, vh] = vb ? vb.split(/[\s,]+/).map(Number) : [0, 0, 1, 1];
    const W = 1200, H = Math.round(W * vh / vw);
    svg = svg.replace(/<svg\b/, `<svg width="${W}" height="${H}"`);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = await loadImage(url);
    URL.revokeObjectURL(url);
    if (!img) return null;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, W, H);
    ctx.globalCompositeOperation = "source-in";   // every visible part of the logo becomes white
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    return { data: c.toDataURL("image/png"), ratio: H / W };
  } catch (e) {
    return null;                                  // no logo: the back cover simply goes without
  }
}

// back cover: black page; the logo centred on the lower margin (PDF.margin), above it – from the bottom up –
// date and time, contact, the note, name and "archive", all starting at the left edge of the logo
function backCover(page, date, contact, logo) {
  page.drawRectangle({ x: 0, y: 0, width: A4.w * PT, height: A4.h * PT, color: colour([0, 0, 0]) });
  const { width, size, style, gap, note, logoWidth } = PDF.backCover;
  const left = (A4.w - logoWidth) / 2;           // left edge of the logo = left edge of the text
  let bottom = A4.h - PDF.margin;                // lower edge of the next part
  if (logo) {
    const h = logoWidth * logo.ratio;
    drawImage(page, logo.image, left, bottom - h, logoWidth, h);
    bottom -= h + gap;
  }
  const parts = ["patrick walter\narchive", plain(note), ...contact, date];   // <br> in the note starts a new line
  const opts = { size, style, width, color: [255, 255, 255] };
  parts.reverse().forEach(text => {
    const h = write(null, text, left, 0, opts);   // measure first, then write it so that it ends at "bottom"
    write(page, text, left, bottom - h, opts);
    bottom -= h + gap;
  });
}

// contents: name and "archive" as on the website, then the list with page numbers instead of years;
// a click on an entry jumps to the page
function contents(pdf, page, entries, pages) {
  const m = PDF.margin, st = PDF.styles;
  write(page, "patrick walter", m, m, { style: st.header });
  write(page, "archive", m, m + lineHeight(), { color: GREY, style: st.header });
  let y = m + lineHeight() * 2 + 11;            // same gap as between "archive" and the list on the website
  entries.forEach(e => {
    write(page, e.title.toLowerCase(), m, y, { style: st.contents });
    write(page, String(e.page), m + PDF.listWidth, y, { color: GREY, align: "right", style: st.contents });
    link(pdf, page, m, y, PDF.listWidth, lineHeight(), pages[e.page - 1]);
    y += lineHeight();
  });
}

// sections from the top of the page
function textPage(page, sections) {
  let y = PDF.margin;
  sections.forEach(s => { y = drawSection(page, s, PDF.margin, y) + lineHeight() * 1.5; });
}

// a section that sits on the lower margin of the page
function bottomText(page, section) {
  if (!section) return;
  const height = drawSection(null, section, PDF.margin, 0);
  drawSection(page, section, PDF.margin, A4.h - PDF.marginBottom - height);
}

// left introduction page: frosted title image with the project title (position: PDF.introTitle)
function introImage(page, image, project) {
  if (image) drawImage(page, image, 0, 0, A4.w, A4.h);
  else page.drawRectangle({ x: 0, y: 0, width: A4.w * PT, height: A4.h * PT, color: colour(PLACEHOLDER) });
  const { size, style, align, x, y } = PDF.introTitle;
  const title = safe(project.title.toLowerCase());
  const left = align === "right" ? A4.w * x - textWidth(title, size, style) : A4.w * x;
  page.drawText(title, { x: left * PT, y: (A4.h - A4.h * y) * PT,
    size, font: fontOf(style), color: colour(PDF.introFrost.dark ? [255, 255, 255] : BLACK) });
}

function introFacts(page, project) {
  const m = PDF.margin, st = PDF.styles;
  let y = write(page, project.title.toLowerCase(), m, m, { style: st.projectTitle });
  const meta = [project.year, project.place, plain(project.context)].filter(Boolean).join(", ");
  y = write(page, meta, m, y, { color: GREY, width: PDF.textWidth, style: st.facts });
  if (project.text) write(page, plain(project.text), m, y + lineHeight(), { width: PDF.textWidth, style: st.text });
}

// the images of a project on its double pages, as arranged in the gallery editor (mode "pdf");
// images without a spot get one (two per page), images hidden in the pdf and videos are left out
async function projectSpreads(pdf, project, isImage) {
  const spec = (await savedLayout(project))?.pdf;
  const hidden = new Set((spec && spec.hidden) || []);
  const all = (await allMedia(project)).filter(isImage);
  const byName = new Map(all.map(src => [fileOf(src), src]));
  const websiteOrder = (await media(project)).filter(isImage).map(fileOf);
  const names = websiteOrder.concat([...byName.keys()].filter(n => !websiteOrder.includes(n))).filter(n => !hidden.has(n));
  const images = {};
  for (const n of names) images[n] = await loadImage(byName.get(n));
  const files = names.filter(n => images[n]).map(n => ({ file: n, ratio: images[n].naturalHeight / images[n].naturalWidth }));
  const ratio = new Map(files.map(f => [f.file, f.ratio]));
  const items = ((spec && spec.items) || []).filter(e => ratio.has(e.file));   // spots of missing files are left out
  const arranged = pdfArrange(spec, items, files, PDF.margin, PDF.marginBottom);
  const placed = [];
  for (const e of arranged.items) {
    placed.push({ ...e, h: e.w * pdfRatio(e, ratio.get(e.file)), image: await pdf.embedJpg(printJpeg(images[e.file], e.w, pdfCrop(e))) });
  }
  // numbers in the order of the pdf (1, 2, 3 … for the whole project)
  const numbered = {};
  pdfOrder(placed).forEach((e, i) => { numbered[e.file] = i + 1; });
  return { spreads: arranged.spreads, items: placed, numbered, spec };
}

// "about me": the picture(s) from assets/about_me, placed as in the gallery editor;
// a picture without a spot goes into the middle of the left page
async function aboutSpread(pdf, isImage) {
  const spec = ((await layoutData) || {}).pdf?.about || {};
  const hidden = new Set(spec.hidden || []);
  const sources = (await allMedia({ title: PDF_ABOUT_FOLDER, slug: PDF_ABOUT_FOLDER }))
    .filter(isImage).filter(src => !hidden.has(fileOf(src)));
  const images = {};
  for (const src of sources) images[fileOf(src)] = await loadImage(src);
  const files = Object.keys(images).filter(n => images[n]).map(n => ({ file: n, ratio: images[n].naturalHeight / images[n].naturalWidth }));
  const ratio = new Map(files.map(f => [f.file, f.ratio]));
  const items = pdfArrangeAbout((spec.items || []).filter(e => ratio.has(e.file)), files, PDF.margin, PDF.marginBottom);
  const placed = [];
  for (const e of items) placed.push({ ...e, h: e.w * pdfRatio(e, ratio.get(e.file)), image: await pdf.embedJpg(printJpeg(images[e.file], e.w, pdfCrop(e))) });
  return placed;
}

// one page of a double page: everything that lies (partly) on it; an image across the fold appears on both pages
// (titles: { spread, numbered, spec } of the project = with numbers and image titles, otherwise without)
function contentPage(page, items, side, titles) {
  items.forEach(e => {
    const x = e.x - side * A4.w;
    if (x + e.w > 0 && x < A4.w) drawImage(page, e.image, x, e.y, e.w, e.h);
  });
  if (!titles || !PDF_CAPTION.show) return;
  const { size, numberColumn, numberGap } = PDF_CAPTION;
  // number below the lower right corner, on the page where that corner lies
  items.forEach(e => {
    const right = e.x + e.w - side * A4.w;
    if (right > 0 && right <= A4.w) captionText(page, String(titles.numbered[e.file]), right, e.y + e.h + numberGap, "right");
  });
  // the list of image titles of this page
  const lines = pdfCaptionLines(items, titles.numbered, titles.spread, side);
  if (!lines.length) return;
  const spot = pdfCaptionSpot(titles.spec, titles.spread, side, lines.length, PDF.margin, PDF.marginBottom);
  lines.forEach((l, i) => {
    const y = spot.y + i * pdfCaptionLine();
    captionText(page, String(l.n), spot.x, y);
    captionText(page, l.title, spot.x + numberColumn, y);
  });
}

// small text of the image titles (top edge at y, like write(), but with the line height of the titles)
function captionText(page, text, x, y, align = "left") {
  const { size } = PDF_CAPTION, font = fontOf("normal");
  const t = safe(text), lh = pdfCaptionLine();
  const w = textWidth(t, size, "normal");
  const ascent = font.heightAtSize(size, { descender: false }) * MM_PER_PT;
  page.drawText(t, { x: (align === "right" ? x - w : x) * PT, y: (A4.h - y - (lh - size * MM_PER_PT) / 2 - ascent) * PT,
    size, font, color: colour(BLACK) });
}

/* ---------- building the book ---------- */
async function makePortfolio(chosen, report) {
  report("loading the pdf tool …");
  await loadPdfLib();
  const pdf = await PDFLib.PDFDocument.create();
  const F = PDFLib.StandardFonts;
  fonts = {
    "normal": await pdf.embedFont(F.Helvetica),
    "bold": await pdf.embedFont(F.HelveticaBold),
    "italic": await pdf.embedFont(F.HelveticaOblique),
    "bold italic": await pdf.embedFont(F.HelveticaBoldOblique)
  };
  PDF.margin = ((await layoutData) || {}).pdf?.margin ?? PDF_MARGIN;   // margins from the gallery editor
  PDF.marginBottom = ((await layoutData) || {}).pdf?.marginBottom ?? PDF_MARGIN_BOTTOM;

  // title image of every project: chosen in the gallery editor, otherwise its first image (no videos)
  const isImage = src => !src.toLowerCase().endsWith(".mp4");
  const titleImages = [];
  for (let i = 0; i < chosen.length; i++) {
    report(`loading images … ${i + 1}/${chosen.length}`);
    const images = (await media(chosen[i])).filter(isImage);
    const title = (await savedLayout(chosen[i]))?.cover;
    const src = images.find(s => fileOf(s) === title) || images[0];
    titleImages.push(src ? await loadImage(src) : null);
  }

  // left introduction pages: every title image behind frosted glass
  report("preparing the pages …");
  const intros = [];
  for (const img of titleImages) intros.push(img ? await pdf.embedJpg(frostedImage(img)) : null);

  // cover: all title images, scattered, behind frosted glass
  const onCover = titleImages.filter(Boolean).sort(() => Math.random() - 0.5);
  const coverImage = onCover.length ? await pdf.embedJpg(frostedCover(onCover)) : null;

  // info text: the first section is the statement, the others are the cv;
  // contact paragraphs go to the back cover
  const sections = infoSections();
  const contact = sections.flatMap(s => s.blocks.filter(b => b.contact).map(b => b.text));
  sections.forEach(s => { s.blocks = s.blocks.filter(b => !b.contact); });
  const date = timestamp();                     // moment of creating the pdf (cover and back cover)

  // logo for the back cover
  const logoFile = PDF.backCover.logo && await whiteLogo(PDF.backCover.logo);
  const logo = logoFile && { image: await pdf.embedPng(logoFile.data), ratio: logoFile.ratio };

  // picture(s) of "about me"
  const about = await aboutSpread(pdf, isImage);

  // images of every project on its double pages
  const spreads = [];
  for (let i = 0; i < chosen.length; i++) {
    report(`placing images … ${i + 1}/${chosen.length}`);
    spreads.push(await projectSpreads(pdf, chosen[i], isImage));
  }

  // page plan: cover 1 · statement 2, contents 3 · about me 4 (portrait), 5 (cv) · then every project:
  // introduction double page, its image double pages · back cover
  // (number: false = no page number on this page)
  const plan = [
    { draw: page => cover(page, coverImage, date), number: false },
    { draw: page => bottomText(page, sections[0]) },
    { draw: page => contents(pdf, page, entries, pages) },
    { draw: page => contentPage(page, about, 0) },
    { draw: page => { contentPage(page, about, 1); textPage(page, sections.slice(1)); } },
  ];
  const entries = [{ title: "about me", page: 5 }];
  chosen.forEach((p, i) => {
    entries.push({ title: p.title, page: plan.length + 1 });
    plan.push({ draw: page => introImage(page, intros[i], p), number: false },
              { draw: page => introFacts(page, p) });
    const { spreads: count, items, numbered, spec } = spreads[i];
    for (let s = 0; s < count; s++) {
      const on = items.filter(e => e.spread === s);
      const titles = { spread: s, numbered, spec };
      plan.push({ draw: page => contentPage(page, on, 0, titles) }, { draw: page => contentPage(page, on, 1, titles) });
    }
  });
  // a single page at the end: the book has an even number of pages
  plan.push({ draw: page => backCover(page, date, contact, logo), number: false });

  report("writing the pdf …");
  const pages = plan.map(() => pdf.addPage([A4.w * PT, A4.h * PT]));
  plan.forEach(({ draw, number }, i) => {
    if (draw) draw(pages[i]);
    if (number !== false) pageNumber(pages[i], i + 1);
  });

  pdf.setTitle("patrick walter — archive");
  pdf.setAuthor("Patrick Walter");
  const bytes = await pdf.save();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  a.download = PDF.fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  report(`pdf created · ${plan.length} pages`);
}
