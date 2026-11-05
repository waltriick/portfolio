/* =========================================================
   PDF SETTINGS — everything about how the PDF portfolio looks
   Used by the PDF portfolio (pdf.js, which only builds the book) and by the gallery editor
   (editor.html, whose previews are drawn with the same settings and code).

   Part 1: SETTINGS, in the order of the book:
     1  page, margins and texts       PDF_PAGE, PDF_MARGIN …, PDF (texts, contents, cv, back cover)
     2  cover                         PDF_COVER
     3  about me                      PDF_ABOUT_FOLDER
     4  title pages of the projects   PDF_INTRO
     5  image pages: image titles     PDF_CAPTION
     6  text fields                   PDF_TEXT
   Part 2: what the gallery editor stores in layout.json, and the code shared by editor and pdf.

   Set in the gallery editor instead (stored in layout.json): the margins, the guides, the cover image,
   the title images, the frosted glass of cover and title pages, and where every image goes.
   ========================================================= */


/* =========================================================
   PART 1 — SETTINGS
   ========================================================= */

/* ---------- 1  page, margins and texts ---------- */
const PDF_PAGE = { w: 210, h: 297 };            // mm, A4
const PDF_MARGIN = 14;                           // mm, margin around (until it is set in the editor)
const PDF_MARGIN_BOTTOM = 30;                    // mm, lower margin: image titles and page number (until set in the editor)

const PDF = {
  size: 12,                // pt, normal text
  small: 7.5,             // pt, page numbers
  lineHeight: 1.45,       // like the website
  listWidth: 80,          // mm, width of the contents list (like the menu on the website)
  textWidth: 120,         // mm, width of longer texts
  yearColumn: 24,         // mm, year column of the cv

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

  fileName: "patrick_walter_portfolio.pdf",   // name of the downloaded file
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
  }
};



/* ---------- 2  cover (page 1) ----------
   Its image is chosen in the gallery editor ("cover" under pdf pages) and can be moved there inside the page.
   The frosted glass below is used until it is set in the editor. */
const PDF_COVER = {
  title: {                // "patrick walter   archive" in one line on the same baseline, the date below
    size: 18,             // pt, "patrick walter"
    style: "bold italic", // "normal", "bold", "italic" or "bold italic"
    archiveSize: 15,      // pt, "archive" (smaller)
    archiveStyle: "italic",
    gap: 5,               // mm, space between "patrick walter" and "archive"
    x: 0.9,               // RIGHT end of the text, as part of the page width (0.5 = middle, 1 = right edge)
    y: 0.465,             // height of the baseline, as part of the page height (0.5 = middle)
    dateSize: 10,         // pt, date and time of creating the pdf, in a line below (also right-aligned)
    dateStyle: "italic",
    dateGap: 6            // mm from the baseline of the title to the baseline of the date
  },
  list: {                 // the projects in the pdf along the left edge: title and year, turned to read downwards
    show: true,           // false = no list
    size: 10,             // pt
    style: "normal",      // "normal", "bold", "italic" or "bold italic"
    lineHeight: 1.2,      // between title and year
    x: null,              // mm from the left edge of the page to the list (null = the margin)
    perColumn: 7,         // projects in one column (more: a second column to the right)
    places: true,         // true = the height (from the upper to the lower margin) is divided into perColumn equal
                          // places, every project starts at the beginning of its place – always the same spots,
                          // however many projects are chosen · false = one after another, minGap apart
    minGap: 8,            // mm between two projects when places is false
    columnGap: 6          // mm between two columns
  },
  frost: {                // frosted glass over the image (until it is set in the editor)
    dark: true,           // true = black page, black haze and white text · false = white page, white haze, black text
    blur: 100,            // how strongly the image is blurred (higher = softer)
    haze: 0.5,            // milky layer on top (0 = none, 1 = only the colour of the layer)
    pale: 0.36,           // takes away colour (0 = full colour)
    grain: 5              // fine grain like on film (0 = none)
  }
};


/* ---------- 3  about me (pages 4 – 5) ---------- */
const PDF_ABOUT_FOLDER = "about_me";             // folder in assets with the picture(s) for "about me"


/* ---------- 4  title pages of the projects ----------
   The left page that opens every project: its title image fills the page behind frosted glass.
   Title image, its part and the frosted glass are chosen in the gallery editor ("title pages"). */
const PDF_INTRO = {
  title: {                // project title, its year in a line below
    size: 18,             // pt
    style: "bold italic", // "normal", "bold", "italic" or "bold italic"
    align: "left",        // "left" = x is where the text starts, "right" = x is where the text ends
    x: 0.1,               // as part of the page width (0 = left edge, 0.5 = middle, 1 = right edge)
    y: 0.465,             // height of the baseline, as part of the page height (0.5 = middle)
    yearSize: 10,         // pt, year of the project (like the date on the cover)
    yearStyle: "italic",
    yearGap: 6            // mm from the baseline of the title to the baseline of the year
  },
  frost: {                // frosted glass (same meaning as for the cover)
    dark: false,
    blur: 75,
    haze: 0.25,
    pale: 0.36,
    grain: 5
  }
};


/* ---------- 5  image pages: image titles ---------- */
// image titles: every page with images gets a small list "1  title" (title = file name without its ending
// and without the project in front, _ becomes a space); every image gets its number small below its lower right corner.
// Mirrored at the fold: on a left page the list is right-aligned towards the middle of the book ("title  1"),
// on a right page left-aligned from the middle ("1  title")
const PDF_CAPTION = {
  show: true,           // false = no image titles and no numbers in the pdf
  mirror: true,         // false = left-aligned "1  title" on both pages
  size: 10,             // pt, titles and numbers
  lineHeight: 1.2,      // line spacing of the image titles (× font size; the other texts: 1.45)
  numberColumn: 5,      // mm, room for the number in front of the title
  numberGap: 1.2,       // mm between the lower edge of an image and its number
  gap: 4                // mm between the lower edge of the image area (lower margin) and the image titles
};


/* ---------- 6  text fields ----------
   Free text on the double pages of a project and on "about me", placed in the gallery editor
   ("add text field"). Size and style can be chosen there per field; these are the values a new field starts with. */
const PDF_TEXT = {
  size: 12,             // pt
  style: "normal",      // "normal", "bold", "italic" or "bold italic"
  lineHeight: 1.3,      // line spacing (× font size)
  width: 60             // mm, width of a new field (the text wraps at this width)
};


/* =========================================================
   PART 2 — layout.json and shared code (nothing to set here)
   The images of a project in the PDF sit on double pages after its introduction double page.
   In layout.json (per project):
     "pdf": { "spreads": 2,                                  number of double pages
              "items": [ { "file": "x.jpg", "spread": 0,    double page (0 = the first)
                           "x": 30, "y": 20, "w": 120,      mm on the double page (420 × 297 mm),
                                                            x from its left edge, y from its top edge,
                                                            w = width of the visible (cropped) image
                           "crop": { "l": 0.1, "t": 0, "r": 0, "b": 0.05 } } ],
                                                            optional: part of the image cut away on
                                                            each side (0.1 = a tenth of its width / height)
              "captions": { "0-1": { "x": 14, "y": 260 } }, optional: spot of the image titles of a page
                                                            ("double page-side", side 0 = left, 1 = right),
                                                            mm from the top left corner of that page
                                                            (left page: "xr" = where its lines end);
                                                            without it: bottom left, just below the image area
              "texts": [ { "spread": 0, "x": 20, "y": 30, "w": 60, text fields: double page, spot (mm, top left
                           "text": "…", "size": 10,          corner), width, the text (\n = new line),
                           "style": "italic",                size in pt, style and alignment
                           "align": "left" } ],              ("left", "center" or "right")
              "hidden": [ "y.jpg" ] }                       not in the PDF
   and once for the whole PDF:  "pdf": { "margin": 14,       mm, distance to the paper edge (top, left, right)
                                         "marginBottom": 30, mm, at the bottom: room for image titles and page number
                                         "about": { "items": [ … ], "hidden": [ … ] } }
                                         the double page "about me" (portrait left, cv right),
                                         same form as above, always one double page
   and also: "cover", "coverPos", "coverFrost", "introFrost" (cover and title pages, see above),
             "grid" (guides in the editor); per project: "cover" and "coverPos" (title image)
   ========================================================= */

// line spacing of a text field in mm
const pdfTextLine = t => (t.size || PDF_TEXT.size) * 25.4 / 72 * PDF_TEXT.lineHeight;
// page of a text field on its double page: where its left edge is (0 = left, 1 = right)
const pdfTextSide = t => (t.x >= PDF_PAGE.w ? 1 : 0);

// title of an image: its file name without the ending, without the name of the project folder in front
// ("salt_away_model_1-50.jpg" in salt_away -> "model 1-50"), _ becomes a space (same on the website)
const pdfTitle = (file, folder = "") => {
  let t = file.replace(/\.[^.]+$/, "");                 // without its ending
  if (folder) {                                          // without the project in front: "salt_away_model" -> "model"
    const parts = folder.split(/[ _-]+/).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const rest = t.replace(new RegExp("^" + parts.join("[ _-]+") + "[ _-]+", "i"), "");
    if (rest) t = rest;
  }
  return t.replace(/_/g, " ").trim();
};
const pdfCaptionLine = () => PDF_CAPTION.size * 25.4 / 72 * PDF_CAPTION.lineHeight;   // mm

// cropping: the part cut away on each side (0 … 1) and the proportions (height / width) of what is left
function pdfCrop(e) {
  const c = e.crop || {};
  return { l: c.l || 0, t: c.t || 0, r: c.r || 0, b: c.b || 0 };
}
function pdfRatio(e, ratio) {
  const c = pdfCrop(e);
  return ratio * (1 - c.t - c.b) / (1 - c.l - c.r);
}

// order in the pdf: double page by double page, left page before right page, then top to bottom, left to right
function pdfOrder(items) {
  return items.slice().sort((a, b) => a.spread - b.spread || pdfSide(a) - pdfSide(b) || a.y - b.y || a.x - b.x);
}

// the image titles of one page: [{ n, title }] for the images whose middle lies on it
// (numbered: { file: number } for the whole project)
function pdfCaptionLines(items, numbered, spread, side, folder) {
  return pdfOrder(items.filter(e => e.spread === spread && pdfSide(e) === side && numbered[e.file]))
    .map(e => ({ n: numbered[e.file], title: pdfTitle(e.file, folder) }));
}

// the image titles of a page are right-aligned (left page, mirrored) or left-aligned
const pdfCaptionRight = side => PDF_CAPTION.mirror && side === 0;
// spot of the image titles of a page (mm from the top left corner of that page): { x, y } = where the lines start,
// or { xr, y } = where they end (right-aligned list). Without a spot of its own: in the lower margin, just below
// the image area, at the inner margin (left page: ending there, right page: starting there)
function pdfCaptionSpot(spec, spread, side, count, margin, bottom = margin) {
  const saved = spec && spec.captions && spec.captions[spread + "-" + side];
  if (saved) return saved;
  const y = pdfRound(PDF_PAGE.h - bottom + PDF_CAPTION.gap);
  return pdfCaptionRight(side) ? { xr: PDF_PAGE.w - margin, y } : { x: margin, y };
}

const pdfRound = v => Math.round(v * 100) / 100;
// page of an item on its double page: 0 = left, 1 = right (where its middle is)
const pdfSide = e => (e.x + e.w / 2 >= PDF_PAGE.w ? 1 : 0);

// first free slot after the images already placed (2 slots per page, 4 per double page)
function pdfNextSlot(items) {
  if (!items.length) return 0;
  const lastPage = Math.max(...items.map(e => e.spread * 2 + pdfSide(e)));
  return (lastPage + 1) * 2;
}

// spots for images that have no place yet: two per page, medium size, inside the margins
// (files: [{ file, ratio }] where ratio = height / width · bottom = lower margin)
function pdfDefaultSpots(files, margin, firstSlot, bottom = margin) {
  const cw = PDF_PAGE.w - 2 * margin, ch = PDF_PAGE.h - margin - bottom;
  const slotH = (ch - margin) / 2;               // two slots per page, one margin between them
  return files.map((f, i) => {
    const slot = firstSlot + i, page = Math.floor(slot / 2), half = slot % 2;
    const w = Math.min(cw * 0.7, slotH / f.ratio);
    const h = w * f.ratio;
    return {
      file: f.file,
      spread: Math.floor(page / 2),
      x: pdfRound((page % 2) * PDF_PAGE.w + margin + (cw - w) / 2),
      y: pdfRound(margin + half * (slotH + margin) + (slotH - h) / 2),
      w: pdfRound(w)
    };
  });
}

// the arrangement of a project: the saved items plus spots for images that have none yet
// (spec: saved "pdf" of the project or nothing · files: the images that belong into the PDF,
//  in order · items of other files must be removed by the caller beforehand)
function pdfArrange(spec, items, files, margin, bottom = margin) {
  const placed = new Set(items.map(e => e.file));
  const missing = files.filter(f => !placed.has(f.file));
  const first = pdfNextSlot(items);
  const all = items.concat(pdfDefaultSpots(missing, margin, first, bottom));
  const used = all.length ? Math.max(...all.map(e => e.spread)) + 1 : 0;
  return { spreads: Math.max((spec && spec.spreads) || 0, used), items: all };
}

// "about me": images without a spot are placed in the middle of the left page (the right page holds the cv);
// several new images are placed slightly offset so that each one can still be grabbed
function pdfArrangeAbout(items, files, margin, bottom = margin) {
  const placed = new Set(items.map(e => e.file));
  const cw = PDF_PAGE.w - 2 * margin, ch = PDF_PAGE.h - margin - bottom;
  const added = files.filter(f => !placed.has(f.file)).map((f, i) => {
    const w = Math.min(cw * 0.7, ch * 0.7 / f.ratio), h = w * f.ratio;
    return { file: f.file, spread: 0, x: pdfRound(margin + (cw - w) / 2 + i * 6), y: pdfRound(margin + (ch - h) / 2 + i * 6), w: pdfRound(w) };
  });
  return items.map(e => ({ ...e, spread: 0 })).concat(added);
}

// frosted glass as set in the gallery editor ("pdf": { "coverFrost": { … }, "introFrost": { … } }),
// otherwise the values above (which = "coverFrost" or "introFrost")
function pdfFrostOf(layoutData, which) {
  const base = which === "coverFrost" ? PDF_COVER.frost : PDF_INTRO.frost;
  return { ...base, ...((layoutData && layoutData.pdf && layoutData.pdf[which]) || {}) };
}

// the list of projects on the cover: where every line goes (shared by pdf.js and the editor's preview).
// items: [{ title, year }] · measure(text, size, style) = width in mm · margin / bottom: margins in mm.
// Returns [{ text, x, y }]: x = its baseline (mm from the left edge), y = where it starts (mm from the top);
// the text runs downwards, its letters facing right: the title stands right of its year
function pdfCoverList(items, measure, margin, bottom) {
  const L = PDF_COVER.list;
  if (!L.show || !items.length) return [];
  const size = L.size * 25.4 / 72, line = size * L.lineHeight;
  const top = margin, length = PDF_PAGE.h - margin - bottom;
  const left = L.x ?? margin;
  const groups = items.map(p => {
    const lines = [String(p.title).toLowerCase(), p.year ? String(p.year) : ""].filter(Boolean);
    return { lines, length: Math.max(...lines.map(t => measure(t, L.size, L.style))) };
  });
  // columns of PDF_COVER.list.perColumn projects each
  const columns = [];
  for (let i = 0; i < groups.length; i += L.perColumn) columns.push(groups.slice(i, i + L.perColumn));
  const out = [];
  const place = length / L.perColumn;                       // height of one place
  columns.forEach((col, c) => {
    const outer = left + c * (2 * line + L.columnGap) + size * 0.21;   // baseline of the left line (above its descenders)
    let y = top;
    col.forEach((g, k) => {
      if (L.places) y = top + k * place;                     // the beginning of its place
      g.lines.forEach((text, i) => out.push({ text, x: outer + (g.lines.length - 1 - i) * line, y }));
      y += g.length + L.minGap;
    });
  });
  return out;
}

// canvas of a whole A4 page (1240 px wide, about 150 dpi)
function pdfPageCanvas() {
  const c = document.createElement("canvas");
  c.width = 1240;
  c.height = Math.round(c.width * PDF_PAGE.h / PDF_PAGE.w);
  return { canvas: c, ctx: c.getContext("2d"), px: c.width / PDF_PAGE.w };
}

// the image fills the whole canvas (cut to fit); pos = which part: { x: 0 … 1, y: 0 … 1 },
// 0 = its left / top edge, 1 = its right / bottom edge, without pos the middle
function pdfFill(canvas, img, pos) {
  const ctx = canvas.getContext("2d");
  const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
  const { x = 0.5, y = 0.5 } = pos || {};
  ctx.drawImage(img, (canvas.width - iw) * x, (canvas.height - ih) * y, iw, ih);
}

// frosted glass over the whole canvas: blurred, a little pale, milky, fine grain
// (settings: PDF_COVER.frost or PDF.introFrost in pdf.js; dark = black instead of white haze)
function pdfFrost(canvas, { blur, haze, pale, grain, dark }) {
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

// date and time of creating the pdf: "2026-11-05 04:32pm"
function pdfTimestamp(d = new Date()) {
  const two = n => String(n).padStart(2, "0");
  const h = d.getHours() % 12 || 12;              // 12-hour clock: 12:05am, 01:30pm …
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(h)}:${two(d.getMinutes())}${d.getHours() < 12 ? "am" : "pm"}`;
}
