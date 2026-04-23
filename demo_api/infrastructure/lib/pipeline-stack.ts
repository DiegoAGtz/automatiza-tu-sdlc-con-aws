import * as cdk from "aws-cdk-lib";
import * as pipelines from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { ApiStack } from "./api-stack";

class ApiStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);
    new ApiStack(this, "BooksApi");
  }
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: Replace with your CodeStar Connection ARN and repo
    const connectionArn = this.node.tryGetContext("connectionArn") ?? "arn:aws:codeconnections:us-east-1:ACCOUNT:connection/PLACEHOLDER";
    const repo = this.node.tryGetContext("repo") ?? "owner/automatiza-tu-sdlc-con-aws";

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "BooksApiPipeline",
      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.connection(repo, "main", {
          connectionArn,
        }),
        commands: [
          "npm install -g pnpm",
          "pnpm install --frozen-lockfile",
          "cd demo_api/infrastructure",
          "npx cdk synth",
        ],
        primaryOutputDirectory: "demo_api/infrastructure/cdk.out",
      }),
    });

    // Dev — deploys automatically on every push
    pipeline.addStage(new ApiStage(this, "Dev"));

    // QA — requires manual approval to promote
    pipeline.addStage(new ApiStage(this, "QA"), {
      pre: [
        new pipelines.ManualApprovalStep("PromoteToQA", {
          comment: "Review the Dev deployment and approve promotion to QA",
        }),
      ],
    });

    // Prod — requires manual approval to promote
    pipeline.addStage(new ApiStage(this, "Prod"), {
      pre: [
        new pipelines.ManualApprovalStep("PromoteToProd", {
          comment: "Review the QA deployment and approve promotion to Production",
        }),
      ],
    });
  }
}
