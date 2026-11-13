# Matthew Chau · Portfolio

My portfolio, themed as a Hong Kong cha chaan teng (茶餐廳). Each project is an item on the menu. Visitors tick items on an order slip, check out, and get a receipt with links to each project.

The theme lives in the frame (headers, order slip, receipt, tiles). The content stays plain (real project names, plain descriptions).

Built with Astro (static output), TypeScript, hand-written CSS and two small React islands.

## Run it locally

You need Node 22.12 or newer and npm.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:4321.

Other commands:

- `npm run build` checks types and builds the site into `dist/`
- `npm run preview` serves the built site so you can check it before deploying
- `npm run check` only checks types and content

If the dev server shows a React error right after you install or update packages, stop it and start it again.

### A note on the Astro version

Astro is pinned to 7.3 because Astro 7.4 needs Node 22.23.4 or newer, and this machine had Node 22.12.0 when the site was built. To move to the newest Astro, update Node first, then run:

```bash
npm install astro@latest
```

## Where things are

- `src/content/projects/` one Markdown file per project
- `src/content/books/` one Markdown file per book review
- `src/content/videos/` one Markdown file per video
- `src/content/photos/` photo files plus `photos.json`
- `src/data/socials.json` links on the takeout flyer
- `src/data/specials.json` paper strips on the wall ("what I'm working on now")
- `src/data/timeline.json` work timeline on the About page
- `src/pages/about.astro` the bio text
- `src/components/ShopSign.astro` name, tagline and "opening hours" line
- `src/styles/tokens.css` every colour, font, spacing step and radius
- `src/content.config.ts` the rules each content file is checked against
- `public/resume.pdf` the resume the About page links to

Everything is editable. Change a file, save, and the dev server reloads.

If a field is missing or wrong, the build stops and names the file and the field. For example: `projects → my-project data does not match collection schema. spice: Too big: expected number to be <=3`.

## Add a project, book or video

Each folder has a `TEMPLATE.md`. Copy it, rename the copy, and fill it in. The template itself is never published.

### Project

1. Copy `src/content/projects/TEMPLATE.md` to a new file such as `my-new-project.md`. The file name becomes the address: `/projects/my-new-project/`.
2. Fill in the fields at the top. Use the real project name.
3. Pick a `code` that is not used yet (M for mains, S for sides, D for desserts). The build fails if two projects share a code.
4. Write the body under the four headings: Overview, My Role, Process, Results.

`madeAt` must be one of: OPG, TMU Research, TMAV, ASHRAE TMU, Personal. To add a new place, add it to the `MADE_AT` list in `src/content.config.ts`. It then shows up in the filter by itself.

To add a video to a project, set `video:` to the full YouTube link.

### Book

1. Copy `src/content/books/TEMPLATE.md` to a new file such as `the-book-title.md`.
2. Fill in the fields. `pairedDrink` needs both the Chinese name (`zh`) and the English name (`en`).
3. Write the review below the fields.

### Video

1. Copy `src/content/videos/TEMPLATE.md` to a new file.
2. Set `youtubeId` to the part after `v=` in the YouTube link.
3. To link the video to a project, set `relatedProject` to the project's file name without `.md`.

Videos are sorted by `date`, newest first.

## Add photos to the Photo Wall

1. Put the image file in `src/content/photos/` (JPG, PNG or WebP). Full-size is fine. The site makes smaller versions when it builds.
2. Add a row to `src/content/photos/photos.json`:

```json
{
  "file": "harbour-at-night.jpg",
  "caption": "Harbour at night",
  "location": "Toronto",
  "date": "2026-08-14",
  "featured": true,
  "placeholder": false
}
```

Photos show in the order they are written in the file. `featured: true` also puts the photo in the strip on the menu page (the first 6 featured photos are used).

## Change featured items and sort order

**Today's Sets (A餐 / B餐 / C餐).** In a project file set:

```yaml
featured: true
featuredSlot: A
```

Each slot can hold one project. To swap one out, set `featured: false` on the old project and give its slot to the new one. The build fails if two projects claim the same slot.

**Order inside a section.** Set `priority` in each file. Lower numbers show first. Dates are not used for sorting. Books work the same way.

**Wall specials, socials and timeline** show in the order they are written in their JSON files.

## Swap placeholders for real content

Every placeholder has `placeholder: true` in its fields and the word PLACEHOLDER in its text. Draft write-ups also have TODO notes where details are missing.

To find them all, search the `src` folder for `PLACEHOLDER` and for `TODO`.

What is a placeholder right now:

- **Projects:** S1 SolidWorks Models, S2 Laser Cutting & Engraving and S4 Python Tools are full placeholders. The other write-ups are drafts with TODO notes.
- **Project images:** every project uses gray images from `src/assets/placeholders/`.
- **Books:** all 3
- **Videos:** both
- **Photos:** all 6
- **Socials:** GitHub, Instagram and YouTube in `src/data/socials.json`
- **Resume:** `public/resume.pdf`
- **About page:** one TODO in the bio
- **Site address:** `site` in `astro.config.mjs`

To replace one:

1. Put in the real content.
2. Set `placeholder: false`.
3. For images, add the real image to the repo (for example `src/assets/projects/drone-frame.jpg`), then point `src:` at it and write a real `alt:` line that says what the image shows.

On the menu page the 少甜 (Less sweet) filter hides everything still marked as a placeholder, so you can see how the site looks without them.

Once a project has a real first image (its `alt` no longer says PLACEHOLDER), that image is also used as the share preview for the project page.

## Things worth knowing

**Chinese fonts.** The site only loads the Chinese characters it uses. `scripts/subset-fonts.mjs` scans `src/`, then writes small font files to `src/assets/fonts/`. This runs by itself when the dev server starts, when a file changes, and when the site builds. Commit the font files when they change.

**Order slip.** Ticked items are kept in the browser tab (sessionStorage), so they survive page changes and reloads but not closing the tab.

**Storefront.** First-time visitors to the home page see the storefront. Clicking the door, scrolling or pressing Skip is remembered (localStorage), so it shows once. It is skipped for visitors who ask for reduced motion. To see it again, clear the site data in your browser or open a private window.

**Spice and prep time.** The menu explains them as "Prep time is how long it took. Spice is how demanding it was." Change that line in `src/components/MenuFilters.astro` if you mean something else.

## Deploy to Cloudflare Pages from GitHub

The site is static, so no adapter or extra config is needed. `.node-version` tells Cloudflare which Node to use, and `public/_headers` sets caching.

### 1. Put the repo on GitHub

Create an empty repository on GitHub (no README), then run these with your own address:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
```

```bash
git push -u origin main
```

### 2. Create the Pages project

1. Sign in at https://dash.cloudflare.com and go to **Workers & Pages**.
2. Select **Create application**, then the **Pages** tab.
3. Select **Import an existing Git repository** and connect your GitHub account.
4. Pick the repository and select **Begin setup**.
5. Set:
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Select **Save and Deploy**.

After that, every push to `main` rebuilds and deploys the site. Other branches get their own preview address.

### 3. Set the site address

When you know your address (for example `your-project.pages.dev`), change `site` in `astro.config.mjs` to match, then commit and push. Share previews and canonical links use it.

## Free yourname.is-a.dev domain

is-a.dev gives developers a free subdomain. You ask for one by opening a pull request on their GitHub repository. Read their guide first, since the steps change from time to time: https://docs.is-a.dev/guides/cloudflare-pages/

At the time of writing:

1. Deploy to Cloudflare Pages first, so you have a `your-project.pages.dev` address.
2. Fork https://github.com/is-a-dev/register.
3. In your fork, add a file `domains/yourname.json` (lowercase letters, numbers and single dashes):

```json
{
  "owner": {
    "username": "your-github-username"
  },
  "records": {
    "CNAME": "your-project.pages.dev"
  }
}
```

4. Open a pull request and wait for a maintainer to review and merge it. Write the request yourself and make any changes they ask for. Their README says AI-written requests get rejected.
5. After the merge, attach the domain to your Pages project. The normal **Custom domains** button in the Cloudflare dashboard does not work for is-a.dev addresses. Their guide explains how to do it with the Cloudflare API or their helper tool.
6. Change `site` in `astro.config.mjs` to `https://yourname.is-a.dev`, commit and push.
