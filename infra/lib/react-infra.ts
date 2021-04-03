import { App, Duration, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import { LambdaStage } from "./lambda-stage";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "@aws-cdk/aws-codebuild";
import { Artifact } from "@aws-cdk/aws-codepipeline";
import {
  CacheControl,
  CodeBuildAction,
  GitHubSourceAction,
  ManualApprovalAction,
  S3DeployAction,
} from "@aws-cdk/aws-codepipeline-actions";

import { ReactStage } from "./react-stage";
import { Bucket } from "@aws-cdk/aws-s3";
export class ReactStack extends Stack {
  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    const sourceOutput = new Artifact();
    const cloudAssemblyArtifact = new Artifact();

    const buildHtmlOutput = new Artifact("base");
    const buildStaticOutput = new Artifact("static");
    const buildLambdaOutput = new Artifact("lambda");
    const lambdaBucket = new Bucket(this, "LambdaBucket", {
      bucketName: `lambdabrian-dev`,
    });

    const pipeline = new CdkPipeline(this, "Pipeline", {
      pipelineName: "AppPipeline",
      cloudAssemblyArtifact,
      sourceAction: new GitHubSourceAction({
        actionName: "GitHub",
        output: sourceOutput,
        oauthToken: SecretValue.secretsManager("github-token"),
        owner: "briansunter",
        repo: "cdk-react",
      }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        subdirectory: "infra",
        sourceArtifact: sourceOutput,
        cloudAssemblyArtifact,
        buildCommand: "npm run build",
      }),
    });

    pipeline.addStage("CompileLambda").addActions(
      new CodeBuildAction({
        actionName: "LambdaBuildaAction",
        project: new PipelineProject(this, "LambdaBuild", {
          projectName: "LambdaBuild",
          buildSpec: BuildSpec.fromObject({
            version: "0.2",
            phases: {
              install: {
                commands: ["cd lambda"],
              },
              build: {
                commands: [],
              },
            },
            artifacts: {
                [buildLambdaOutput.artifactName as string]: {
                  "base-directory": "lambda",
                  files: ["*"],
                },
              },
          }),
          environment: {
            buildImage: LinuxBuildImage.STANDARD_4_0,
          },
        }),
        input: sourceOutput,
        outputs: [buildLambdaOutput],
      }),
        new S3DeployAction({
          actionName: "Lambda-Assets",
          input: buildLambdaOutput,
          bucket: lambdaBucket,
          runOrder: 2,
        }),
    );

    pipeline.addApplicationStage(
      new LambdaStage(this, "LambdaStackDev", "dev", buildLambdaOutput.bucketName, buildLambdaOutput.objectKey, {
        env: { account: "847136656635", region: "us-east-1" },
      })
    );

    pipeline.addStage("Compile").addActions(
      new CodeBuildAction({
        actionName: "Webapp",
        project: new PipelineProject(this, "Build", {
          projectName: "ReactSample",
          buildSpec: BuildSpec.fromObject({
            version: "0.2",
            phases: {
              install: {
                commands: ["cd frontend", "npm install"],
              },
              build: {
                commands: ["npm run build", "npm run test:ci"],
              },
            },
            artifacts: {
              "secondary-artifacts": {
                [buildHtmlOutput.artifactName as string]: {
                  "base-directory": "frontend/build",
                  files: ["*"],
                },
                [buildStaticOutput.artifactName as string]: {
                  "base-directory": "frontend/build",
                  files: ["static/**/*"],
                },
              },
            },
          }),
          environment: {
            buildImage: LinuxBuildImage.STANDARD_4_0,
          },
        }),
        input: sourceOutput,
        outputs: [buildStaticOutput, buildHtmlOutput],
      })
    );
    const devBucket = Bucket.fromBucketName(
      this,
      "DevBucket",
      "reactbriansunter-dev"
    );

        const devReactStage = new ReactStage(this, "ReactStackDev", "dev", {
          env: { account: "847136656635", region: "us-east-1" },
        })

    pipeline
      .addApplicationStage(devReactStage)
      .addActions(
        new S3DeployAction({
          actionName: "Static-Assets",
          input: buildStaticOutput,
          bucket: devBucket,
          cacheControl: [
            CacheControl.setPublic(),
            CacheControl.maxAge(Duration.days(5)),
          ]
        }),
        new S3DeployAction({
          actionName: "HTML-Assets",
          input: buildHtmlOutput,
          bucket: devBucket,
          cacheControl: [CacheControl.noCache()]
        }),
        new ManualApprovalAction({
          actionName: `Approvedev`
        })
      );

    const qaBucket = Bucket.fromBucketName(
      this,
      "QaBucket",
      "reactbriansunter-qa"
    );

    pipeline
      .addApplicationStage(
        new ReactStage(this, "ReactStackQa", "qa", {
          env: { account: "847136656635", region: "us-east-1" },
        })
      )
      .addActions(
        new S3DeployAction({
          actionName: "Static-Assets",
          input: buildStaticOutput,
          bucket: qaBucket,
          cacheControl: [
            CacheControl.setPublic(),
            CacheControl.maxAge(Duration.days(5)),
          ]
        }),
        new S3DeployAction({
          actionName: "HTML-Assets",
          input: buildHtmlOutput,
          bucket: qaBucket,
          cacheControl: [CacheControl.noCache()]
        })
      );
  }
}
