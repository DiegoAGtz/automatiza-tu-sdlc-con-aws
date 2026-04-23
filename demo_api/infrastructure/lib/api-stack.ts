import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as path from "path";
import { Construct } from "constructs";

const DOMAIN_NAME = "diegoagtz.com";

export interface ApiStackProps extends cdk.StackProps {
  stageName: string;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { stageName } = props;
    const subdomain = stageName === "prod" ? `api.${DOMAIN_NAME}` : `api-${stageName}.${DOMAIN_NAME}`;

    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: DOMAIN_NAME,
    });

    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: subdomain,
      validation: acm.CertificateValidation.fromDns(zone),
    });

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
      deployOptions: {
        stageName,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Custom domain
    const customDomain = new apigateway.DomainName(this, "CustomDomain", {
      domainName: subdomain,
      certificate,
      endpointType: apigateway.EndpointType.EDGE,
    });

    new apigateway.BasePathMapping(this, "BasePathMapping", {
      domainName: customDomain,
      restApi: api,
    });

    new route53.ARecord(this, "AliasRecord", {
      zone,
      recordName: subdomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGatewayDomain(customDomain),
      ),
    });

    const books = api.root.addResource("books");
    books.addMethod("GET", new apigateway.LambdaIntegration(getBooksFunction));
    books.addMethod("POST", new apigateway.LambdaIntegration(createBookFunction));

    this.apiUrl = new cdk.CfnOutput(this, "ApiUrl", {
      value: `https://${subdomain}/books`,
      description: "Books API URL",
    });
  }
}
