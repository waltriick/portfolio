/* =========================================================
   PDF PORTFOLIO — builds the book from the chosen projects
   A4, read as double pages (left page = even number, right page = odd number):
     1        cover: the image chosen in the gallery editor ("cover" under pdf pages), filling the page
              behind frosted glass (always the same, whatever projects are chosen);
              "patrick walter archive" in one line and below it the date and time of creating the pdf,
              both right-aligned; along the left edge the chosen projects, title and year, reading downwards
     2 – 3    statement from the info page, at the bottom (left) · contents (right)
     4 – 5    about me: portrait (picture(s) from assets/about_me, placed in the gallery editor,
              "about me" in mode "pdf") · cv (right)
     then     per project an introduction double page:
              left = its title image over the whole page behind frosted glass with the project title,
              right = the facts,
              then the double pages with its images as arranged in the gallery editor (mode "pdf"),
              cropped as set there, each with its number and on every page a list of the image titles
              (settings: PDF_CAPTION in pdf-settings.js)
     last     back cover, a single black page: the logo (favicon.svg, in white) centred on the lower margin,
              above it name, "archive", a short note, contact, date and time, aligned to the logo's left edge
   Title image of a project: chosen in the gallery editor, otherwise its first image.
   The margins of all pages (around and at the bottom) are set in the gallery editor (layout.json), see also pdf-settings.js.
   All settings (sizes, type, texts, positions) are in pdf-settings.js: this file only builds the book.
   Uses the free library pdf-lib (loaded only when you click "create pdf").
   ========================================================= */
// all settings are in pdf-settings.js (PDF, PDF_COVER, PDF_INTRO, PDF_CAPTION …)
PDF.coverFrost = PDF_COVER.frost;               // frosted glass: replaced by the values from the editor when building
PDF.introFrost = PDF_INTRO.frost;

const A4 = PDF_PAGE;                            // mm, 210 × 297 (pdf-settings.js)
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
function write(page, text, x, y, { size = PDF.size, color = BLACK, width, align = "left", style = "normal", leading } = {}) {
  const font = fontOf(style);
  const lines = wrap(safe(text), width, size, style);
  const lh = leading ? size * MM_PER_PT * leading : lineHeight(size);   // leading: own line spacing (× size)
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
const pageCanvas = pdfPageCanvas;          // canvas of a whole page (pdf-settings.js)

const frost = pdfFrost;                      // frosted glass (pdf-settings.js)

// cover and introduction pages: the image fills the whole page behind frosted glass
// (pos: which part of it, see pdfFill in pdf-settings.js; without one the middle)
function frostedImage(img, settings = PDF.introFrost, pos) {
  const { canvas } = pageCanvas();
  pdfFill(canvas, img, pos);
  return frost(canvas, settings);
}

// image for a page of the pdf: JPEG with about 300 dpi at the size it has on the paper (w in mm),
// cut as set in the gallery editor (crop: part cut away on each side, see pdf-settings.js)
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
const timestamp = pdfTimestamp;             // "2026-11-05 04:32pm" (pdf-settings.js)

// cover: frosted image (without one: a black page if dark), "patrick walter" and a smaller "archive" on one baseline,
// below it the date and time of creating the pdf, all right-aligned at PDF_COVER.title.x;
// along the left edge the projects in the pdf, title and year, reading downwards (PDF_COVER.list in pdf-settings.js)
function cover(page, image, date, chosen) {
  if (image) drawImage(page, image, 0, 0, A4.w, A4.h);
  else if (PDF.coverFrost.dark) page.drawRectangle({ x: 0, y: 0, width: A4.w * PT, height: A4.h * PT, color: colour(BLACK) });
  const ink = colour(PDF.coverFrost.dark ? [255, 255, 255] : BLACK);   // white text on the dark cover
  const { size, style, archiveSize, archiveStyle, gap, x, y, dateSize, dateStyle, dateGap } = PDF_COVER.title;
  const name = "patrick walter", word = "archive";
  const nameWidth = textWidth(name, size, style);
  const left = A4.w * x - nameWidth - gap - textWidth(word, archiveSize, archiveStyle);
  const baseline = (A4.h - A4.h * y) * PT;
  page.drawText(name, { x: left * PT, y: baseline, size, font: fontOf(style), color: ink });
  page.drawText(word, { x: (left + nameWidth + gap) * PT, y: baseline, size: archiveSize, font: fontOf(archiveStyle), color: ink });
  page.drawText(date, { x: (A4.w * x - textWidth(date, dateSize, dateStyle)) * PT, y: baseline - dateGap * PT,
    size: dateSize, font: fontOf(dateStyle), color: ink });
  const L = PDF_COVER.list;
  pdfCoverList(chosen, (t, s, st) => textWidth(safe(t), s, st), PDF.margin, PDF.marginBottom).forEach(l => {
    page.drawText(safe(l.text), { x: l.x * PT, y: (A4.h - l.y) * PT, rotate: PDFLib.degrees(-90),
      size: L.size, font: fontOf(L.style), color: ink });
  });
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

// left introduction page: frosted title image with the project title and below it its year
// (position and type: PDF_INTRO.title)
function introImage(page, image, project) {
  if (image) drawImage(page, image, 0, 0, A4.w, A4.h);
  else page.drawRectangle({ x: 0, y: 0, width: A4.w * PT, height: A4.h * PT, color: colour(PLACEHOLDER) });
  const { size, style, align, x, y, yearSize, yearStyle, yearGap } = PDF_INTRO.title;
  const ink = colour(PDF.introFrost.dark ? [255, 255, 255] : BLACK);
  const baseline = (A4.h - A4.h * y) * PT;
  const line = (text, s, st, base) => {
    const t = safe(String(text));
    const left = align === "right" ? A4.w * x - textWidth(t, s, st) : A4.w * x;
    page.drawText(t, { x: left * PT, y: base, size: s, font: fontOf(st), color: ink });
  };
  line(project.title.toLowerCase(), size, style, baseline);
  if (project.year) line(project.year, yearSize, yearStyle, baseline - yearGap * PT);
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
// (titles: { spread, numbered, spec } of the project = with numbers and image titles, otherwise without;
//  texts: text fields of this double page, each on the page where its left edge is)
function contentPage(page, items, side, titles, texts = []) {
  items.forEach(e => {
    const x = e.x - side * A4.w;
    if (x + e.w > 0 && x < A4.w) drawImage(page, e.image, x, e.y, e.w, e.h);
  });
  texts.filter(t => pdfTextSide(t) === side && t.text).forEach(t => {
    const align = t.align || "left";                     // left, center or right within its width
    const x = t.x - side * A4.w + (align === "center" ? t.w / 2 : align === "right" ? t.w : 0);
    write(page, t.text, x, t.y, { size: t.size || PDF_TEXT.size, style: t.style || PDF_TEXT.style,
      width: t.w, leading: PDF_TEXT.lineHeight, align });
  });
  if (!titles || !PDF_CAPTION.show) return;
  const { size, numberColumn, numberGap } = PDF_CAPTION;
  // number below the lower right corner, on the page where that corner lies
  items.forEach(e => {
    const right = e.x + e.w - side * A4.w;
    if (right > 0 && right <= A4.w) captionText(page, String(titles.numbered[e.file]), right, e.y + e.h + numberGap, "right");
  });
  // the list of image titles of this page
  const lines = pdfCaptionLines(items, titles.numbered, titles.spread, side, titles.folder);
  if (!lines.length) return;
  const spot = pdfCaptionSpot(titles.spec, titles.spread, side, lines.length, PDF.margin, PDF.marginBottom);
  const width = Math.max(...lines.map(l => textWidth(safe(l.title), size, "normal"))) + numberColumn;
  lines.forEach((l, i) => {
    const y = spot.y + i * pdfCaptionLine();
    if (pdfCaptionRight(side)) {                         // left page, mirrored: "title  1", ending at xr
      const xr = spot.xr ?? spot.x + width;
      captionText(page, String(l.n), xr, y, "right");
      captionText(page, l.title, xr - numberColumn, y, "right");
    } else {                                             // "1  title", starting at x
      const x = spot.x ?? spot.xr - width;
      captionText(page, String(l.n), x, y);
      captionText(page, l.title, x + numberColumn, y);
    }
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
  PDF.coverFrost = pdfFrostOf(await layoutData, "coverFrost");   // frosted glass as set in the gallery editor
  PDF.introFrost = pdfFrostOf(await layoutData, "introFrost");

  // title image of every project: chosen in the gallery editor, otherwise its first image (no videos)
  const isImage = src => !src.toLowerCase().endsWith(".mp4");
  const titleImages = [], titlePos = [];
  for (let i = 0; i < chosen.length; i++) {
    report(`loading images … ${i + 1}/${chosen.length}`);
    const images = (await media(chosen[i])).filter(isImage);
    const title = (await savedLayout(chosen[i]))?.cover;
    titlePos.push((await savedLayout(chosen[i]))?.coverPos);   // part of the title image, moved in the editor
    const src = images.find(s => fileOf(s) === title) || images[0];
    titleImages.push(src ? await loadImage(src) : null);
  }

  // left introduction pages: every title image behind frosted glass
  report("preparing the pages …");
  const intros = [];
  for (let i = 0; i < titleImages.length; i++) {
    const img = titleImages[i];
    intros.push(img ? await pdf.embedJpg(frostedImage(img, PDF.introFrost, titlePos[i])) : null);
  }

  // cover: the image chosen in the gallery editor ("folder/file" in layout.json), filling the page
  const coverPath = ((await layoutData) || {}).pdf?.cover;
  const coverImg = coverPath ? await loadImage(`${ASSET_FOLDER}/${coverPath.split("/").map(encodeURIComponent).join("/")}`) : null;
  const coverPos = ((await layoutData) || {}).pdf?.coverPos;   // part of the image, moved in the editor
  const coverImage = coverImg ? await pdf.embedJpg(frostedImage(coverImg, PDF.coverFrost, coverPos)) : null;

  // info text: the first section is the statement, the others are the cv;
  // contact paragraphs go to the back cover
  const sections = infoSections();
  const contact = sections.flatMap(s => s.blocks.filter(b => b.contact).map(b => b.text));
  sections.forEach(s => { s.blocks = s.blocks.filter(b => !b.contact); });
  const date = timestamp();                     // moment of creating the pdf (cover and back cover)

  // logo for the back cover
  const logoFile = PDF.backCover.logo && await whiteLogo(PDF.backCover.logo);
  const logo = logoFile && { image: await pdf.embedPng(logoFile.data), ratio: logoFile.ratio };

  // picture(s) and text fields of "about me"
  const about = await aboutSpread(pdf, isImage);
  const aboutTexts = ((await layoutData) || {}).pdf?.about?.texts || [];

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
    { draw: page => cover(page, coverImage, date, chosen), number: false },
    { draw: page => bottomText(page, sections[0]) },
    { draw: page => contents(pdf, page, entries, pages) },
    { draw: page => contentPage(page, about, 0, null, aboutTexts) },
    { draw: page => { contentPage(page, about, 1, null, aboutTexts); textPage(page, sections.slice(1)); } },
  ];
  const entries = [{ title: "about me", page: 5 }];
  chosen.forEach((p, i) => {
    entries.push({ title: p.title, page: plan.length + 1 });
    plan.push({ draw: page => introImage(page, intros[i], p), number: false },
              { draw: page => introFacts(page, p) });
    const { spreads: count, items, numbered, spec } = spreads[i];
    for (let s = 0; s < count; s++) {
      const on = items.filter(e => e.spread === s);
      const titles = { spread: s, numbered, spec, folder: fileName(p.title) };   // folder: left out of the image titles
      const texts = ((spec && spec.texts) || []).filter(t => t.spread === s);   // text fields of this double page
      plan.push({ draw: page => contentPage(page, on, 0, titles, texts) }, { draw: page => contentPage(page, on, 1, titles, texts) });
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
