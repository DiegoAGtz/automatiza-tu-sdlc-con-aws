import middy from "@middy/core";
import { errorHandlerMiddleware, requestLoggerMiddleware } from "@demo-api/api-common";
import { getBooks } from "./handler";

export const handler = middy().use(requestLoggerMiddleware()).use(errorHandlerMiddleware()).handler(getBooks);
