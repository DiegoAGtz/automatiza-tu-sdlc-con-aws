import { Book } from "@demo-api/db-repositories";

export interface CreateBookResponse {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: string;
  description?: string;
  createdAt: string;
}

export const mapToCreateBookResponse = (book: Book): CreateBookResponse => ({
  id: book.id,
  title: book.title,
  author: book.author,
  year: book.year,
  genre: book.genre,
  description: book.description,
  createdAt: book.createdAt,
});
