import { createBook } from "../handler";
import { booksRepository } from "@demo-api/db-repositories";
import { APIGatewayProxyEvent } from "aws-lambda";

jest.mock("@demo-api/db-repositories", () => ({
  booksRepository: {
    create: jest.fn().mockImplementation((book) => Promise.resolve(book)),
  },
}));

jest.mock("crypto", () => ({
  randomUUID: () => "test-uuid-1234",
}));

const makeEvent = (body: unknown): APIGatewayProxyEvent =>
  ({ body: JSON.stringify(body) }) as APIGatewayProxyEvent;

describe("createBook handler", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a book and returns 201", async () => {
    const input = {
      title: "Clean Code",
      author: "Robert C. Martin",
      year: 2008,
      genre: "Software Engineering",
      description: "A handbook of agile software craftsmanship",
    };

    const result = await createBook(makeEvent(input));

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.id).toBe("test-uuid-1234");
    expect(body.title).toBe("Clean Code");
    expect(body.author).toBe("Robert C. Martin");
    expect(body.createdAt).toBeDefined();
    expect(booksRepository.create).toHaveBeenCalledTimes(1);
  });

  it("creates a book without optional description", async () => {
    const input = {
      title: "The Pragmatic Programmer",
      author: "David Thomas",
      year: 1999,
      genre: "Software Engineering",
    };

    const result = await createBook(makeEvent(input));

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.description).toBeUndefined();
  });

  it("returns 400 for missing required fields", async () => {
    const input = { title: "Incomplete" };

    await expect(createBook(makeEvent(input))).rejects.toThrow();
  });

  it("returns 400 for invalid year", async () => {
    const input = {
      title: "Future Book",
      author: "Someone",
      year: 3000,
      genre: "Sci-Fi",
    };

    await expect(createBook(makeEvent(input))).rejects.toThrow();
  });

  it("returns 400 for empty body", async () => {
    const event = { body: null } as APIGatewayProxyEvent;
    await expect(createBook(event)).rejects.toThrow();
  });
});
