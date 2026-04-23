import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as pipelines from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { ApiStack } from "./api-stack";

interface ApiStageProps extends cdk.StageProps {
  stageName: string;
}

class ApiStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: ApiStageProps) {
    super(scope, id, props);
    new ApiStack(this, "BooksApi", { stageName: props.stageName });
  }
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectionArn = this.node.tryGetContext("connectionArn") ?? "arn:aws:codeconnections:us-east-1:ACCOUNT:connection/PLACEHOLDER";
    const repo = this.node.tryGetContext("repo") ?? "owner/automatiza-tu-sdlc-con-aws";

    const env: cdk.Environment = {
      account: "314146298455",
      region: "us-east-1",
    };

    const source = pipelines.CodePipelineSource.connection(repo, "main", {
      connectionArn,
      triggerOnPush: false,
    });

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "BooksApiPipeline",
      pipelineType: codepipeline.PipelineType.V2,
      synth: new pipelines.ShellStep("Synth", {
        input: source,
        commands: [
          "npm install -g pnpm",
          "pnpm install --frozen-lockfile",
          "pnpm -r test",
          "cd demo_api/infrastructure",
          "npx cdk synth",
        ],
        primaryOutputDirectory: "demo_api/infrastructure/cdk.out",
      }),
    });

    // Dev — deploys automatically on every push
    pipeline.addStage(new ApiStage(this, "Dev", { env, stageName: "dev" }));

    // QA — requires manual approval to promote
    pipeline.addStage(new ApiStage(this, "QA", { env, stageName: "qa" }), {
      pre: [
        new pipelines.ManualApprovalStep("PromoteToQA", {
          comment: "Review the Dev deployment and approve promotion to QA",
        }),
      ],
    });

    // Prod — requires manual approval to promote
    pipeline.addStage(new ApiStage(this, "Prod", { env, stageName: "prod" }), {
      pre: [
        new pipelines.ManualApprovalStep("PromoteToProd", {
          comment: "Review the QA deployment and approve promotion to Production",
        }),
      ],
    });

    // Force pipeline build so we can access the underlying L1 resource
    pipeline.buildPipeline();

    // Add V2 trigger with file path filter via L1 escape hatch.
    // SourceActionName must match the action name CDK generates for the source action.
    // pipelines.CodePipelineSource.connection() names the action after the repo:
    // "<owner>_<repo>" with slashes replaced by underscores and hyphens kept.
    const sourceActionName = repo.replace("/", "_");
    const cfnPipeline = pipeline.pipeline.node.defaultChild as codepipeline.CfnPipeline;
    cfnPipeline.addPropertyOverride("Triggers", [
      {
        ProviderType: "CodeStarSourceConnection",
        GitConfiguration: {
          SourceActionName: sourceActionName,
          Push: [
            {
              Branches: { Includes: ["main"] },
              FilePaths: { Includes: ["demo_api/**"] },
            },
          ],
        },
      },
    ]);
  }
}
