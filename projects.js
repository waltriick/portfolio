/* =========================================================
   PROJECTS — this is where you maintain your content.
   New project: copy a block and change the values.

   Every project gets a subfolder inside  assets/ , named after the
   project title (spaces become _ , special characters like [ ] are
   dropped: "salt [a]way" -> assets/salt_away/ ). The image and video
   files inside can have any name (.jpg, .png, .webp, .mp4).
   Videos play muted in an endless loop.

   This file is shared by all pages: the website (index.html) and the
   PDF portfolio (portfolio.html) both read their projects from here.

   GALLERY EDITOR: open editor.html (in Chrome or Edge) to arrange and size
   the images of each project. It saves layout.json, which the website reads.
   Images that are not arranged yet appear one below the other,
   exactly as the editor shows them before you arrange them.
   ========================================================= */
const projects = [
  {
    slug: "alors-on-danse",
    title: "alors on danse",
    year: "2026",
    place: "Brussels",
    context: "thesis project at TUM, Prof. Stephen Bates",
    text: "What if the thing keeping you awake at night was the thing keeping your home warm?<br><br>Clubs are often seen as a problem for residential life: too loud, too late, too disruptive. This proposal turns that relationship around. It converts a European office building in Brussels into housing with alternative forms of living and puts a club in the underground parking garage below.<br>The building becomes a living labyrinth where residents, commuters from the Maelbeek metro station and clubgoers share paths and thresholds at different times of day and night. The apartments are organised around a compact core, and the old office partitions are reused as dividing walls. Curtains and seasonal buffer zones let residents adapt their homes throughout the year.<br>For the club, part of the slab between two garage levels is removed, and the concrete gained is reused to build the club's walls. Heat from the dance floor is stored in a thermal buffer tank behind the DJ booth and heats the apartments after closing time.<br>Nothing is simply demolished.<br><br>Dancing becomes heat. Heat becomes dwelling. And what was once perceived as unpleasant and disruptive becomes the motor of the home."
  },
  {
    slug: "house-of-metal",
    title: "house of metal",
    year: "2025/26",
    place: "Munich",
    context: "3rd year master project at TUM, Prof. Uta Graff<br>with Hendrik Schmiemann",
    text: "A House of Metal Crafts is to be built on the site of a former railway works. It will offer space for artists and craftspeople as well as exhibition rooms. The site is an island within an extensive track bed, and visitors can reach it only through an underpass.<br><br>The design is meant to act as an architectural interface between craft, building and visitor.<br><br>It follows the logic of this unusual site and makes the underground arrival its central theme. The existing building is kept and upgraded. It mediates between two new buildings: a workshop to the west and an exhibition house to the east. Both are reached through newly created, sheltering trenches.<br><br>Conceptually, the architecture also makes space through subtraction and addition. Newly built functional cores, and thick walls open up served spaces for working and making while housing the buildings servant spaces."
  },
  {
    slug: "lamina",
    title: "lamina",
    year: "2025/26",
    place: "Door handle, cast bronze",
    context: "3rd year master seminar at TUM, Prof. Uta Graff<br>with Hendrik Schmiemann",
    text: "Lamina is a cast bronze door handle, made in collaboration with local craft businesses.<br>Production began with laser-cut cardboard layers, glued one on top of the other. Wax sprues were attached to the cardboard model, which was then invested in fireclay. Over several days in the kiln, the cardboard and wax burned out completely.<br>Molten bronze was poured through the channels the wax had left behind. Once it had cooled, the casting was freed from its sprues. Finally, the handle was sandblasted and patinated with liver of sulphur.<br>Its surface still shows every layer of the original model."
  },
  {
    slug: "salt-away",
    title: "salt [a]way",
    year: "2024",
    place: "Cyprus",
    context: "1st year master project at TUM, Prof. Francis Kéré<br>with Hanna Panschar & Bertram Dietz",
    text: "Salt [a]way is an alternative to conventional desalination plants, which use large amounts of energy, mostly from fossil fuels. Our case study is set in Cyprus, the island most dependent on seawater desalination in Europe. The plant runs on solar heat alone and turns brine, the waste product of desalination, into a building material.<br>Inside a circular breakwater, seawater evaporates under direct sunlight in floating modules. The distilled water is collected and enriched with minerals, so it can cover the entire freshwater demand of a neighbouring hotel.<br>Conventional plants pump the leftover brine back into the sea, where it harms the ecosystem. Here, it flows into shallow pools on land, where salt crystals form on stainless steel frames within 15 days. The frames are worked into salt panels for the façade, which improve the indoor climate and are fire-resistant and good for acoustics. The panels dry for three months along a circular walkway on the breakwater, which also extends the beach promenade for visitors."
  },
  {
    slug: "cool-lab",
    title: "cool lab",
    year: "2024",
    place: "TUM Campus",
    context: "1st year master seminar at TUM, Prof. Francis Kéré, Inês Dantas<br>team of 12 students",
    text: "The task was to design a pavilion with a cooling effect, develop it in detail and build it on the TUM campus for one day. Twelve students had eight weeks, from April to June 2024, supervised by Inês Dantas. Along with the design, we raised all the funding ourselves and ran simulations to prove the cooling effect.<br><br>The pavilion offered a generous seating area and combined several cooling methods for hot summer days. Textile sunshades blocked direct sunlight. A tubing system sprayed a fine mist of water along the top edge of the fabric to keep it wet. The people sitting on the platform generated the pressure themselves, with a bike pump built into the seating and a small pressure tank."
  },
  {
    slug: "la-rotante",
    title: "la rotante",
    year: "2023/24",
    place: "",
    context: "1st year master seminar at TUM, integrated product design<br>with Mia Schury & Clelia Veith",
    text: "An honest, simple, and durable design. Crafted from a single sheet of raw aluminium, La Rotante reveals its materiality and manufacturing process at first glance.Its minimalist form streamlines production in just a few steps, starting with precision-cut aluminum by a water jet, followed by folding and hand assembly using a hammer and pins, all without welding joints. With a cut-out circle serving as a versatile lampshade, simply rotate it to create direct or indirect light according to your needs."
  },
];

/* Texts for the info and imprint pages.
   The info text is also used for the CV in the PDF portfolio:
   every <h2> starts a section, <ul class="cv"> lists become year + entry. */
const infoHTML = `
  <h2>Architecture means...</h2>
  <p>much more than designing a beautiful building. It means responsibility, because it surrounds us every day. It plays a vital role in creating and restoring social relationships.<br>I am particularly interested in building within the existing fabric, which I believe is one of the most important tasks of our time. It means rethinking what is already there and finding new and different ways to use it, weaving together materials and uses and giving them new meaning.</p>
  <h2>education</h2>
  <ul class="cv">
    <li><span class="year">2023–2026</span><span>M.A. Architecture, Technical University of Munich</span></li>
    <li><span class="year">2024–2025</span><span>M.A. Architecture, Universidade de Lisboa</span></li>
    <li><span class="year">2019–2022</span><span>B.Sc. Architecture and Urban Planning, University of Stuttgart</span></li>
    <li><span class="year">2017–2019</span><span>B.Sc. Civil Engineering, University of Stuttgart</span></li>
    <li><span class="year">2009–2017</span><span>Abitur, Remstal-Gymnasium, Weinstadt</span></li>
  </ul>

  <h2>experience</h2>
  <ul class="cv">
    <li><span class="year">2025–2026</span><span>Student assistant, Design Factory, Technical University of Munich</span></li>
    <li><span class="year">2022–2023</span><span>Internship, Delugan Meissl Associated Architects, Vienna</span></li>
    <li><span class="year">2021–2022</span><span>Tutor in structural design, ITKE, University of Stuttgart</span></li>
    <li><span class="year">2019</span><span>Internship, W67 Architekten, Stuttgart</span></li>
    <li><span class="year">2018–2025</span><span>Internship, semester-break job, Carpentry Wiegmann GmbH, Kernen</span></li>
    <li><span class="year">2016–2022</span><span>IT assistant, AVL IT GmbH, Weinstadt</span></li>
    <li><span class="year">2014</span><span>Internship, blocher partners, Stuttgart</span></li>
  </ul>

  <h2>exhibitions</h2>
  <ul class="cv">
    <li><span class="year">2025</span><span>Water Futures, Pavillon 333, Technical University of Munich</span></li>
    <li><span class="year">2025</span><span>Water Futures, ZAZ Bellerive – Architecture Center Zurich</span></li>
  </ul>

  <p class="contact">contact: <a href="mailto:mail@patrickarchive.com">mail@patrickarchive.com</a></p>
`;
const imprintHTML = `
  <h2>imprint (impressum)</h2>
  <p>Information according to § 5 DDG<br>
  Patrick Walter<br>
  Germany</p>
  <p class="contact">contact: <a href="mailto:mail@patrickarchive.com">mail@patrickarchive.com</a></p>
`;
