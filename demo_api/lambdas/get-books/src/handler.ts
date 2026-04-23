import { APIGatewayProxyEvent } from "aws-lambda";
import { booksRepository } from "@demo-api/db-repositories";
import { successResponse } from "@demo-api/api-common";

export const getBooks = async (_event: APIGatewayProxyEvent) => {
  // hello lambda
  const books = await booksRepository.getAll();
  return successResponse({ books, count: books.length });
};
