import { App, Duration, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "@aws-cdk/aws-codebuild";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import {
  CacheControl,
  CodeBuildAction,
  GitHubSourceAction,
  ManualApprovalAction,
  GitHubTrigger,
  S3DeployAction,
} from "@aws-cdk/aws-codepipeline-actions";
// import { ReactStack } from "./react-stack";
import { ReactStage } from "./react-stage";
import { Bucket } from "@aws-cdk/aws-s3";
export class ReactSampleStack extends Stack {
  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    const sourceOutput = new Artifact();
    const cloudAssemblyArtifact = new Artifact();

    const buildHtmlOutput = new Artifact("base");
    const buildStaticOutput = new Artifact("static");

    const pipeline = new CdkPipeline(this, "Pipeline", {
      // The pipeline name
      pipelineName: "MyStaticPipeline",
      cloudAssemblyArtifact,

      // Where the source can be found
      sourceAction: new GitHubSourceAction({
        actionName: "GitHub",
        output: sourceOutput,
        oauthToken: SecretValue.secretsManager("github-token"),
        owner: "briansunter",
        repo: "cdk-react",
      }),

      // How it will be built and synthesized
      synthAction: SimpleSynthAction.standardNpmSynth({
        subdirectory: "infra",
        sourceArtifact: sourceOutput,
        cloudAssemblyArtifact,

        // We need a build step to compile the TypeScript Lambda
        buildCommand: "npm run build",
      }),
    });
    pipeline.addStage("compile").addActions(
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
    const devStage = new ReactStage(
      this,
      "ReactStackDev",
      'dev',
      {
        env: { account: "847136656635", region: "us-east-1" },
      }
    );
    const devBucket = Bucket.fromBucketName(this,"DevBucket", "reactbriansunter-dev");
    pipeline.addApplicationStage(
      devStage
      ).addActions(
        new S3DeployAction({
          actionName: "Static-Assets",
          input: buildStaticOutput,
          bucket: devBucket,
          cacheControl: [
            CacheControl.setPublic(),
            CacheControl.maxAge(Duration.days(5)),
          ],
          runOrder: 1,
        }),
        new S3DeployAction({
          actionName: "HTML-Assets",
          input: buildHtmlOutput,
          bucket: devBucket,
          cacheControl: [CacheControl.noCache()],
          runOrder: 2,
        })


      );
      pipeline.addStage("PostDevDeploy").addActions( new ManualApprovalAction({
        actionName: `Approvedev`
      }))
    pipeline.addApplicationStage(
    new ReactStage(
      this,
      "ReactStackQA",
      'qa',
      {
        env: { account: "847136656635", region: "us-east-1" },
      }
    )
      );
  }
}
