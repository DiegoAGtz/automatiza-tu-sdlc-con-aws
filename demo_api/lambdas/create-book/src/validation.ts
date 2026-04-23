import { z } from "zod";

export const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  year: z.number().int().min(1000).max(new Date().getFullYear()),
  genre: z.string().min(1),
  description: z.string().optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
