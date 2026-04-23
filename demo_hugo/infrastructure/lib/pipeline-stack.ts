import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface PipelineStackProps extends cdk.StackProps {
  siteBucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { siteBucket, distribution, githubOwner, githubRepo, githubBranch } = props;

    // Artifact bucket para CodePipeline (separado del site bucket)
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `${this.stackName}-artifacts-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        { expiration: cdk.Duration.days(30) },
      ],
    });

    // CodeBuild project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `${this.stackName}-build`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      environmentVariables: {
        BUCKET_NAME: { value: siteBucket.bucketName },
        DISTRIBUTION_ID: { value: distribution.distributionId },
        HUGO_VERSION: { value: '0.121.0' },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
      timeout: cdk.Duration.minutes(15),
    });

    // Permisos para CodeBuild: S3 sync + CloudFront invalidation
    siteBucket.grantReadWrite(buildProject.role!);

    buildProject.role!.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudfront:CreateInvalidation'],
        resources: [
          `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        ],
      })
    );

    // Pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // GitHub source action (usa OAuth token de Secrets Manager)
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: githubOwner,
      repo: githubRepo,
      branch: githubBranch,
      oauthToken: cdk.SecretValue.secretsManager('github-token'),
      output: sourceOutput,
      trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
    });

    // CodeBuild action
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Hugo_Build_Deploy',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    // CodePipeline
    new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${this.stackName}`,
      artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build_and_Deploy',
          actions: [buildAction],
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: `${this.stackName}`,
      description: 'CodePipeline name',
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: buildProject.projectName,
      description: 'CodeBuild project name',
    });

    new cdk.CfnOutput(this, 'SetupInstructions', {
      value: 'Guarda tu GitHub token en Secrets Manager: aws secretsmanager create-secret --name github-token --secret-string "ghp_TU_TOKEN"',
      description: 'Instrucciones para configurar el GitHub token',
    });
  }
}
