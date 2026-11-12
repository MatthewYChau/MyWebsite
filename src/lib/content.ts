/**
 * Helpers that read the content collections and hand pages sorted,
 * checked data. Cross-file rules (unique menu codes, one project per
 * featured slot, videos pointing at real projects) are checked here.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

export type Project = CollectionEntry<'projects'>;
export type Book = CollectionEntry<'books'>;
export type Video = CollectionEntry<'videos'>;
export type SectionKey = Project['data']['section'];

/** Section labels. The Chinese is the theme; the English says what it is. */
export const SECTION_META: Record<SectionKey, { zh: string; en: string; note: string }> = {
  mains: { zh: '特餐', en: 'Mains', note: 'Work projects' },
  sides: { zh: '小食', en: 'Sides', note: 'Personal projects' },
  desserts: { zh: '甜品', en: 'Desserts', note: 'Passion projects' },
};

export const SECTION_ORDER: SectionKey[] = ['mains', 'sides', 'desserts'];

export const projectHref = (project: Project) => `/projects/${project.id}/`;
export const bookHref = (book: Book) => `/books/${book.id}/`;

function assertUnique(label: string, values: { value: string; file: string }[]) {
  const seen = new Map<string, string>();
  for (const { value, file } of values) {
    const first = seen.get(value);
    if (first) {
      throw new Error(`${label} "${value}" is used twice: in ${first} and ${file}. Each one must be unique.`);
    }
    seen.set(value, file);
  }
}

/** All projects, sorted by section order and then by priority (lower first). */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects');

  assertUnique(
    'Menu code',
    projects.map((p) => ({ value: p.data.code, file: `projects/${p.id}.md` })),
  );
  assertUnique(
    'Featured slot',
    projects
      .filter((p) => p.data.featured && p.data.featuredSlot)
      .map((p) => ({ value: p.data.featuredSlot as string, file: `projects/${p.id}.md` })),
  );

  return projects.sort(
    (a, b) =>
      SECTION_ORDER.indexOf(a.data.section) - SECTION_ORDER.indexOf(b.data.section) ||
      a.data.priority - b.data.priority ||
      a.data.code.localeCompare(b.data.code, 'en', { numeric: true }),
  );
}

export async function getProjectsBySection(): Promise<Record<SectionKey, Project[]>> {
  const projects = await getProjects();
  return {
    mains: projects.filter((p) => p.data.section === 'mains'),
    sides: projects.filter((p) => p.data.section === 'sides'),
    desserts: projects.filter((p) => p.data.section === 'desserts'),
  };
}

/** Today's Sets: featured projects in slot order A, B, C. */
export async function getFeatured(): Promise<Project[]> {
  const projects = await getProjects();
  return projects
    .filter((p) => p.data.featured && p.data.featuredSlot)
    .sort((a, b) => (a.data.featuredSlot as string).localeCompare(b.data.featuredSlot as string));
}

/** Two other dishes to suggest: same section first, then the rest of the menu. */
export async function getRelated(project: Project, count = 2): Promise<Project[]> {
  const others = (await getProjects()).filter((p) => p.id !== project.id);
  const sameSection = others.filter((p) => p.data.section === project.data.section);
  const rest = others.filter((p) => p.data.section !== project.data.section);
  return [...sameSection, ...rest].slice(0, count);
}

export async function getBooks(): Promise<Book[]> {
  const books = await getCollection('books');
  assertUnique(
    'Menu code',
    books.map((b) => ({ value: b.data.code, file: `books/${b.id}.md` })),
  );
  return books.sort(
    (a, b) => a.data.priority - b.data.priority || a.data.code.localeCompare(b.data.code, 'en', { numeric: true }),
  );
}

/** Videos, newest first. Fails the build if relatedProject names a project that does not exist. */
export async function getVideos(): Promise<(Video & { related?: Project })[]> {
  const [videos, projects] = await Promise.all([getCollection('videos'), getProjects()]);
  return videos
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((video) => {
      const slug = video.data.relatedProject;
      if (!slug) return video;
      const related = projects.find((p) => p.id === slug);
      if (!related) {
        throw new Error(
          `videos/${video.id}.md: relatedProject "${slug}" does not match any file in src/content/projects.`,
        );
      }
      return { ...video, related };
    });
}

const photoFiles = import.meta.glob<{ default: ImageMetadata }>(
  '../content/photos/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

export interface Photo {
  id: string;
  image: ImageMetadata;
  caption: string;
  location: string;
  date: Date;
  featured: boolean;
  placeholder: boolean;
}

/** Photos in the order they appear in photos.json. */
export async function getPhotos(): Promise<Photo[]> {
  const entries = await getCollection('photos');
  return entries.map((entry) => {
    const match = photoFiles[`../content/photos/${entry.data.file}`];
    if (!match) {
      throw new Error(
        `photos.json lists "${entry.data.file}" but there is no such image in src/content/photos. Check the file name and its ending.`,
      );
    }
    return {
      id: entry.id,
      image: match.default,
      caption: entry.data.caption,
      location: entry.data.location,
      date: entry.data.date,
      featured: entry.data.featured,
      placeholder: entry.data.placeholder,
    };
  });
}

/** Pulls the video id out of a YouTube link. */
export function youtubeIdFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1) || undefined;
    if (parsed.searchParams.has('v')) return parsed.searchParams.get('v') ?? undefined;
    const match = parsed.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/);
    return match?.[2];
  } catch {
    return undefined;
  }
}

const dateFormat = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', timeZone: 'UTC' });

export const formatDate = (date: Date) => dateFormat.format(date);
export const formatMonth = (date: Date) => monthFormat.format(date);
