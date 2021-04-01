import { ReactStack } from './react-stack';
import { Stage, Construct, StageProps } from '@aws-cdk/core';
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
;
export class ReactStage extends Stage {
  public readonly webappBucket: Bucket;
    constructor(scope: Construct, id: string, html: Artifact, staticAssets:Artifact, envName: string, props?: StageProps) {
        super(scope, id, props);
        const reactStack = new ReactStack(this, 'React', envName );
        const webappBucket = reactStack.webappBucket;
      new S3DeployAction({
        actionName: "Static-Assets",
        input: staticAssets,
        bucket: webappBucket,
        cacheControl: [
          CacheControl.setPublic(),
          CacheControl.maxAge(Duration.days(5)),
        ],
        runOrder: 1,
      }),
      new S3DeployAction({
        actionName: "HTML-Assets",
        input: html,
        bucket: webappBucket,
        cacheControl: [CacheControl.noCache()],
        runOrder: 2,
      })
    }
}