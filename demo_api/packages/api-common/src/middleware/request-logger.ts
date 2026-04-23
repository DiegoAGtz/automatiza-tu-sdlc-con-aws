import middy from "@middy/core";
import { APIGatewayProxyEvent } from "aws-lambda";

export const requestLoggerMiddleware = (): middy.MiddlewareObj<APIGatewayProxyEvent> => ({
  before: async (request) => {
    const { event } = request;
    console.log(
      JSON.stringify({
        method: event.httpMethod,
        path: event.path,
        queryStringParameters: event.queryStringParameters,
      }),
    );
  },
  after: async (request) => {
    console.log(
      JSON.stringify({
        statusCode: (request.response as { statusCode?: number })?.statusCode,
      }),
    );
  },
});
