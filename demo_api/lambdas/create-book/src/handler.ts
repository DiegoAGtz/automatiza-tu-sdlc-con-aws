import { APIGatewayProxyEvent } from "aws-lambda";
import { randomUUID } from "crypto";
import { booksRepository, Book } from "@demo-api/db-repositories";
import { successResponse, BadRequestError } from "@demo-api/api-common";
import { createBookSchema } from "./validation";
import { mapToCreateBookResponse } from "./types";

export const createBook = async (event: APIGatewayProxyEvent) => {
  const body = JSON.parse(event.body ?? "{}");
  const parsed = createBookSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const book: Book = {
    id: randomUUID(),
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  await booksRepository.create(book);
  return successResponse(mapToCreateBookResponse(book), 201);
};
