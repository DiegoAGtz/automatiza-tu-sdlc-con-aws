import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Book } from "./types";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.BOOKS_TABLE_NAME!;

export const booksRepository = {
  async getAll(): Promise<Book[]> {
    const result = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
    return (result.Items ?? []) as Book[];
  },

  async create(book: Book): Promise<Book> {
    await client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: book,
      }),
    );
    return book;
  },
};
