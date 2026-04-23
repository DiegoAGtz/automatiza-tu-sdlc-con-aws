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

const githubOwner = app.node.tryGetContext('githubOwner') || process.env.GITHUB_OWNER || '';
const githubRepo = app.node.tryGetContext('githubRepo') || process.env.GITHUB_REPO || '';
const githubBranch = app.node.tryGetContext('githubBranch') || process.env.GITHUB_BRANCH || 'main';

if (!githubOwner || !githubRepo) {
  console.warn(
    '[+] GITHUB_OWNER y GITHUB_REPO son requeridos para el PipelineStack.\n' +
    '    Configúralos como variables de entorno o CDK context.\n' +
    '    Ejemplo: export GITHUB_OWNER=tu-usuario && export GITHUB_REPO=tu-repo'
  );
}

new PipelineStack(app, `${projectName}-pipeline`, {
  env,
  description: 'CI/CD pipeline for Hugo static site (CodePipeline + CodeBuild)',
  tags,
  siteBucket: hosting.siteBucket,
  distribution: hosting.distribution,
  githubOwner,
  githubRepo,
  githubBranch,
});
