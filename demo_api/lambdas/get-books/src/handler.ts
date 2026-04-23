import { APIGatewayProxyEvent } from "aws-lambda";
import { booksRepository } from "@demo-api/db-repositories";
import { successResponse } from "@demo-api/api-common";

export const getBooks = async (_event: APIGatewayProxyEvent) => {
  const books = await booksRepository.getAll();
  return successResponse(books);
};
