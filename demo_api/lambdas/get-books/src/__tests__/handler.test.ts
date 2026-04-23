import { getBooks } from "../handler";
import { booksRepository } from "@demo-api/db-repositories";
import { APIGatewayProxyEvent } from "aws-lambda";

jest.mock("@demo-api/db-repositories", () => ({
  booksRepository: {
    getAll: jest.fn(),
  },
}));

const mockEvent = {} as APIGatewayProxyEvent;

describe("getBooks handler", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns all books with 200 status", async () => {
    const books = [
      {
        id: "1",
        title: "Clean Code",
        author: "Robert C. Martin",
        year: 2008,
        genre: "Software Engineering",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "The Pragmatic Programmer",
        author: "David Thomas",
        year: 1999,
        genre: "Software Engineering",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    ];
    (booksRepository.getAll as jest.Mock).mockResolvedValue(books);

    const result = await getBooks(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(books);
    expect(booksRepository.getAll).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when no books exist", async () => {
    (booksRepository.getAll as jest.Mock).mockResolvedValue([]);

    const result = await getBooks(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual([]);
  });
});
