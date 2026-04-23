#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

new PipelineStack(app, "BooksApiPipelineStack", {
  description: "Books Recommended API - CI/CD Pipeline with Dev/QA/Prod stages",
});
