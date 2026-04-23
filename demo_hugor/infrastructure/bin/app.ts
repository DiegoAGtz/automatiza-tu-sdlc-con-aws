#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { HostingStack } from '../lib/hosting-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const projectName = 'demo-hugo';

const tags: Record<string, string> = {
  Project: projectName,
  Environment: 'demo',
  ManagedBy: 'cdk',
};

const hosting = new HostingStack(app, `${projectName}-hosting`, {
  env,
  description: 'S3 + CloudFront hosting for Hugo static site',
  tags,
});

const connectionArn = app.node.tryGetContext('connectionArn') ?? '';
const repo = app.node.tryGetContext('repo') ?? '';

if (!connectionArn || !repo) {
  console.warn(
    '[+] connectionArn and repo are required for the PipelineStack.\n' +
    '    Pass them via CDK context:\n' +
    '    npx cdk deploy -c connectionArn="arn:aws:..." -c repo="owner/repo"'
  );
}

new PipelineStack(app, `${projectName}-pipeline`, {
  env,
  description: 'CI/CD pipeline for Hugo static site (CodePipeline + CodeBuild)',
  tags,
  siteBucket: hosting.siteBucket,
  distribution: hosting.distribution,
  connectionArn,
  repo,
});
