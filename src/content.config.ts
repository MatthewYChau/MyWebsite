/**
 * Content schemas.
 *
 * Every Markdown and JSON file under src/content and src/data is checked
 * against these shapes when the site builds. A missing or wrong field stops
 * the build with a message naming the file and the field.
 */
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** The only values allowed for "Made at". Add a new one here first. */
export const MADE_AT = ['OPG', 'TMU Research', 'TMAV', 'ASHRAE TMU', 'Personal'] as const;

export const SECTIONS = ['mains', 'sides', 'desserts'] as const;

/** Every .md file in the folder except TEMPLATE.md */
const markdownExceptTemplate = ['**/*.md', '!**/TEMPLATE.md'];

/** Reads a JSON array and gives each row an id, so rows don't need one. */
function jsonArray(idField?: string) {
  return (text: string) => {
    const rows = JSON.parse(text) as Record<string, unknown>[];
    return rows.map((row, index) => ({
      id: idField && typeof row[idField] === 'string' ? (row[idField] as string) : String(index + 1),
      ...row,
    }));
  };
}

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: markdownExceptTemplate }),
  schema: ({ image }) =>
    z
      .object({
        code: z
          .string()
          .regex(/^[MSD]\d+$/, { error: 'code must look like M1, S2 or D3' }),
        name: z.string().min(1),
        section: z.enum(SECTIONS),
        madeAt: z.enum(MADE_AT),
        description: z.string().min(1),
        tags: z.array(z.string()).default([]),
        prepTime: z.string().nullish(),
        spice: z.number().int().min(1).max(3),
        status: z.enum(['done', 'in-progress']).default('done'),
        priority: z.number().default(99),
        featured: z.boolean().default(false),
        featuredSlot: z.enum(['A', 'B', 'C']).nullish(),
        video: z.url({ error: 'video must be a full YouTube URL' }).nullish(),
        images: z.array(z.object({ src: image(), alt: z.string().min(1) })).default([]),
        placeholder: z.boolean().default(false),
      })
      .refine((data) => !data.featured || Boolean(data.featuredSlot), {
        error: 'featured: true also needs featuredSlot: A, B or C',
        path: ['featuredSlot'],
      }),
});

const books = defineCollection({
  loader: glob({ base: './src/content/books', pattern: markdownExceptTemplate }),
  schema: ({ image }) =>
    z.object({
      code: z.string().regex(/^B\d+$/, { error: 'code must look like B1' }),
      title: z.string().min(1),
      author: z.string().min(1),
      rating: z.number().int().min(1).max(5),
      pairedDrink: z.object({
        zh: z.string().min(1),
        en: z.string().min(1),
      }),
      dateRead: z.coerce.date(),
      cover: image().nullish(),
      priority: z.number().default(99),
      placeholder: z.boolean().default(false),
    }),
});

const videos = defineCollection({
  loader: glob({ base: './src/content/videos', pattern: markdownExceptTemplate }),
  schema: z.object({
    title: z.string().min(1),
    youtubeId: z.string().min(1),
    date: z.coerce.date(),
    /** File name of a project without .md, for example "tmav-modular-drone-program" */
    relatedProject: z.string().nullish(),
    placeholder: z.boolean().default(false),
  }),
});

const photos = defineCollection({
  loader: file('src/content/photos/photos.json', { parser: jsonArray('file') }),
  schema: z.object({
    /** Image file name inside src/content/photos */
    file: z.string().min(1),
    caption: z.string().min(1),
    location: z.string().min(1),
    date: z.coerce.date(),
    featured: z.boolean().default(false),
    placeholder: z.boolean().default(false),
  }),
});

const socials = defineCollection({
  loader: file('src/data/socials.json', { parser: jsonArray('platform') }),
  schema: z.object({
    platform: z.enum(['linkedin', 'github', 'instagram', 'youtube', 'email']),
    label: z.string().min(1),
    handle: z.string().min(1),
    url: z.string().min(1),
    placeholder: z.boolean().default(false),
  }),
});

const specials = defineCollection({
  loader: file('src/data/specials.json', { parser: jsonArray() }),
  schema: z.object({
    text: z.string().min(1),
    color: z.enum(['yellow', 'pink', 'mint', 'orange', 'white']).default('yellow'),
  }),
});

const timeline = defineCollection({
  loader: file('src/data/timeline.json', { parser: jsonArray() }),
  schema: z.object({
    org: z.string().min(1),
    role: z.string().min(1),
    start: z.string().min(1),
    end: z.string().min(1),
    summary: z.string().min(1),
  }),
});

export const collections = { projects, books, videos, photos, socials, specials, timeline };
