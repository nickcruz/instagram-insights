#!/usr/bin/env node
import { App } from "aws-cdk-lib";

import { TranscriberBootstrapStack } from "../lib/transcriber-bootstrap-stack";
import { TranscriberServiceStack } from "../lib/transcriber-service-stack";

const app = new App();

const repositoryName =
  app.node.tryGetContext("repositoryName") ?? "instagram-insights-transcriber";
const imageTag = app.node.tryGetContext("imageTag") ?? "latest";
const transcriberApiKey =
  app.node.tryGetContext("transcriberApiKey") ??
  process.env.TRANSCRIBER_API_KEY ??
  "change-me";

const bootstrapStack = new TranscriberBootstrapStack(
  app,
  "InstagramInsightsTranscriberBootstrap",
  {
    repositoryName,
  },
);

new TranscriberServiceStack(app, "InstagramInsightsTranscriberService", {
  repository: bootstrapStack.repository,
  imageTag,
  repositoryName,
  transcriberApiKey,
});
