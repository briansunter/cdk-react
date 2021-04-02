#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ReactStack } from "../lib/react-infra";

const app = new cdk.App();
new ReactStack(app, "CdkReactStack", {
  env: { account: "847136656635", region: "us-east-1" },
});
