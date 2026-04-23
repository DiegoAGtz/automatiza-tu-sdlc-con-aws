import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const booksTable = new dynamodb.Table(this, "BooksTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaDefaults: Partial<lambdaNodejs.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        BOOKS_TABLE_NAME: booksTable.tableName,
      },
      bundling: {
        externalModules: ["@aws-sdk/*"],
        minify: true,
        sourceMap: true,
      },
    };

    const lambdasDir = path.join(__dirname, "../../lambdas");

    const getBooksFunction = new lambdaNodejs.NodejsFunction(this, "GetBooksFunction", {
      ...lambdaDefaults,
      entry: path.join(lambdasDir, "get-books/src/index.ts"),
      functionName: `${cdk.Stack.of(this).stackName}-get-books`,
    });

    const createBookFunction = new lambdaNodejs.NodejsFunction(this, "CreateBookFunction", {
      ...lambdaDefaults,
      entry: path.join(lambdasDir, "create-book/src/index.ts"),
      functionName: `${cdk.Stack.of(this).stackName}-create-book`,
    });

    booksTable.grantReadData(getBooksFunction);
    booksTable.grantReadWriteData(createBookFunction);

    const api = new apigateway.RestApi(this, "BooksApi", {
      restApiName: `${cdk.Stack.of(this).stackName}-books-api`,
      description: "Books Recommended API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const books = api.root.addResource("books");
    books.addMethod("GET", new apigateway.LambdaIntegration(getBooksFunction));
    books.addMethod("POST", new apigateway.LambdaIntegration(createBookFunction));

    this.apiUrl = new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "Books API Gateway URL",
    });
  }
}
