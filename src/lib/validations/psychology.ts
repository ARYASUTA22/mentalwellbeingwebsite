import { z } from "zod";

export const ARTICLE_CATEGORIES = [
  "ALL",
  "BURNOUT",
  "PRODUCTIVITY",
  "BOUNDARIES",
  "FOCUS",
] as const;

export const articleCategorySchema = z.enum(ARTICLE_CATEGORIES);
export type ArticleCategory = z.infer<typeof articleCategorySchema>;

export const articleFilterSchema = z.object({
  category: articleCategorySchema.default("ALL"),
  search: z.string().max(120).optional(),
});

export const completeReadingQuestSchema = z.object({
  articleSlug: z.string().min(1),
});

export interface SerializedArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: Exclude<ArticleCategory, "ALL"> | string;
  readingTimeMin: number;
  coverPublicId: string | null;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
}
