import middy from "@middy/core";
import { HttpError } from "../errors";

export const errorHandlerMiddleware = (): middy.MiddlewareObj => ({
  onError: async (request) => {
    const { error } = request;

    if (error instanceof HttpError) {
      request.response = {
        statusCode: error.statusCode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: error.message }),
      };
      return;
    }

    console.error("Unhandled error:", error);
    request.response = {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  },
});
