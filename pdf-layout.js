/* =========================================================
   PDF LAYOUT — shared by the gallery editor (editor.html) and the PDF portfolio (pdf.js)
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
                                                            mm from the top left corner of that page;
                                                            without it: bottom left, just below the image area
              "hidden": [ "y.jpg" ] }                       not in the PDF
   and once for the whole PDF:  "pdf": { "margin": 14,       mm, distance to the paper edge (top, left, right)
                                         "marginBottom": 30, mm, at the bottom: room for image titles and page number
                                         "about": { "items": [ … ], "hidden": [ … ] } }
                                         the double page "about me" (portrait left, cv right),
                                         same form as above, always one double page
   ========================================================= */
const PDF_PAGE = { w: 210, h: 297 };            // mm, A4
const PDF_MARGIN = 14;                           // mm, until a margin is set in the editor
const PDF_MARGIN_BOTTOM = 30;                    // mm, lower margin until it is set in the editor
const PDF_ABOUT_FOLDER = "about_me";             // folder in assets with the picture(s) for "about me"

// image titles: every page with images gets a small list "1  title" (title = file name without
// its ending, _ becomes a space); every image gets its number small below its lower right corner
const PDF_CAPTION = {
  show: true,           // false = no image titles and no numbers in the pdf
  size: 10,             // pt, titles and numbers
  lineHeight: 1.2,      // line spacing of the image titles (× font size; the other texts: 1.45)
  numberColumn: 5,      // mm, room for the number in front of the title
  numberGap: 1.2,       // mm between the lower edge of an image and its number
  gap: 4                // mm between the lower edge of the image area (lower margin) and the image titles
};
const pdfTitle = file => file.replace(/\.[^.]+$/, "").replace(/_/g, " ").trim();
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
function pdfCaptionLines(items, numbered, spread, side) {
  return pdfOrder(items.filter(e => e.spread === spread && pdfSide(e) === side && numbered[e.file]))
    .map(e => ({ n: numbered[e.file], title: pdfTitle(e.file) }));
}

// spot of the image titles of a page (mm from the top left corner of that page)
// (without a spot of its own: in the lower margin, just below the image area)
function pdfCaptionSpot(spec, spread, side, count, margin, bottom = margin) {
  const saved = spec && spec.captions && spec.captions[spread + "-" + side];
  if (saved) return saved;
  return { x: margin, y: pdfRound(PDF_PAGE.h - bottom + PDF_CAPTION.gap) };
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
