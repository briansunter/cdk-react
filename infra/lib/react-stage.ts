import { ReactStack } from "./react-stack";
import { Stage, Construct, StageProps } from "@aws-cdk/core";
import { Bucket } from "@aws-cdk/aws-s3";
import { CdkPipeline } from "@aws-cdk/pipelines";
import { App, Duration, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import {
  CacheControl,
  CodeBuildAction,
  ManualApprovalAction,
  S3DeployAction,
} from "@aws-cdk/aws-codepipeline-actions";
export class ReactStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    envName: string,
    props?: StageProps
  ) {
    super(scope, id, props);
    const reactStack = new ReactStack(this, "React", envName);
  }
}
