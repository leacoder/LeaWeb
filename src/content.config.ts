import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    ctaLabel: z.string().trim().min(1),
    description: z.string(),
    number: z.string(),
    icon: z.enum(['web', 'systems', 'upgrade']),
    deliverables: z.array(z.string()),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    client: z.string(),
    sector: z.string(),
    image: image(),
    imageAlt: z.string(),
    imageCaption: z.string().optional(),
    website: z.url({ protocol: /^https$/ }).optional(),
    featured: z.boolean(),
    historical: z.boolean(),
    published: z.boolean().default(true),
    order: z.number(),
  }),
});

export const collections = { services, projects };
