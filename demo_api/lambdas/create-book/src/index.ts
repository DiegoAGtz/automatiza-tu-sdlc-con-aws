import middy from "@middy/core";
import { errorHandlerMiddleware, requestLoggerMiddleware } from "@demo-api/api-common";
import { createBook } from "./handler";

export const handler = middy().use(requestLoggerMiddleware()).use(errorHandlerMiddleware()).handler(createBook);
