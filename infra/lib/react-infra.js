"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactSampleStack = void 0;
const core_1 = require("@aws-cdk/core");
const pipelines_1 = require("@aws-cdk/pipelines");
const aws_codebuild_1 = require("@aws-cdk/aws-codebuild");
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
const react_stack_1 = require("./react-stack");
class ReactSampleStack extends core_1.Stack {
  constructor(app, id, props) {
    super(app, id, props);
    const sourceOutput = new aws_codepipeline_1.Artifact();
    const buildHtmlOutput = new aws_codepipeline_1.Artifact("base");
    const buildStaticOutput = new aws_codepipeline_1.Artifact("static");
    const cloudAssemblyArtifact = new aws_codepipeline_1.Artifact();
    const reactStack = new react_stack_1.ReactStack(this, "ReactStack");
    const webappBucket = reactStack.webappBucket;
    const pipeline = new pipelines_1.CdkPipeline(this, "Pipeline", {
      // The pipeline name
      pipelineName: "MyStaticPipeline",
      cloudAssemblyArtifact,
      // Where the source can be found
      sourceAction: new aws_codepipeline_actions_1.GitHubSourceAction({
        actionName: "GitHub",
        output: sourceOutput,
        oauthToken: core_1.SecretValue.secretsManager("github-token"),
        owner: "briansunter",
        repo: "cdk-react",
      }),
      // How it will be built and synthesized
      synthAction: pipelines_1.SimpleSynthAction.standardNpmSynth({
        subdirectory: "infra",
        sourceArtifact: sourceOutput,
        cloudAssemblyArtifact,
        // We need a build step to compile the TypeScript Lambda
        buildCommand: "npm run build",
      }),
    });
    pipeline.addStage("Compile").addActions(
      new aws_codepipeline_actions_1.CodeBuildAction({
        actionName: "Webapp",
        project: new aws_codebuild_1.PipelineProject(this, "Build", {
          projectName: "ReactSample",
          buildSpec: aws_codebuild_1.BuildSpec.fromObject({
            version: "0.2",
            phases: {
              install: {
                commands: ["cd frontend", "npm install"],
              },
              build: {
                commands: "npm run build",
              },
            },
            artifacts: {
              "secondary-artifacts": {
                [buildHtmlOutput.artifactName]: {
                  "base-directory": "frontend/build",
                  files: ["*"],
                },
                [buildStaticOutput.artifactName]: {
                  "base-directory": "frontend/build",
                  files: ["static/**/*"],
                },
              },
            },
          }),
          environment: {
            buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_4_0,
          },
        }),
        input: sourceOutput,
        outputs: [buildStaticOutput, buildHtmlOutput],
      })
    );
    pipeline.addStage("Deploy").addActions(
      new aws_codepipeline_actions_1.S3DeployAction({
        actionName: "Static-Assets",
        input: buildStaticOutput,
        bucket: webappBucket,
        cacheControl: [
          aws_codepipeline_actions_1.CacheControl.setPublic(),
          aws_codepipeline_actions_1.CacheControl.maxAge(
            core_1.Duration.days(5)
          ),
        ],
        runOrder: 1,
      }),
      new aws_codepipeline_actions_1.S3DeployAction({
        actionName: "HTML-Assets",
        input: buildHtmlOutput,
        bucket: webappBucket,
        cacheControl: [aws_codepipeline_actions_1.CacheControl.noCache()],
        runOrder: 2,
      })
    );
  }
}
exports.ReactSampleStack = ReactSampleStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBNEU7QUFDNUUsa0RBQW9FO0FBQ3BFLDBEQUFtRjtBQUNuRixnRUFBNkQ7QUFDN0QsZ0ZBTTJDO0FBQzNDLCtDQUF5QztBQUV6QyxNQUFhLGdCQUFpQixTQUFRLFlBQUs7SUFFekMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQ2xELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLE1BQU0sWUFBWSxHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBQ3BDLE1BQU0sZUFBZSxHQUFHLElBQUksMkJBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QyxNQUFNLGlCQUFpQixHQUFHLElBQUksMkJBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqRCxNQUFNLHFCQUFxQixHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBRTdDLE1BQU0sVUFBVSxHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFdEQsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztRQUU3QyxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNqRCxvQkFBb0I7WUFDcEIsWUFBWSxFQUFFLGtCQUFrQjtZQUNoQyxxQkFBcUI7WUFFckIsZ0NBQWdDO1lBQ2hDLFlBQVksRUFBRSxJQUFJLDZDQUFrQixDQUFDO2dCQUNuQyxVQUFVLEVBQUUsUUFBUTtnQkFDcEIsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLFVBQVUsRUFBRSxrQkFBVyxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUM7Z0JBQ3RELEtBQUssRUFBRSxhQUFhO2dCQUNwQixJQUFJLEVBQUUsV0FBVzthQUNsQixDQUFDO1lBRUQsdUNBQXVDO1lBQ3ZDLFdBQVcsRUFBRSw2QkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDL0MsWUFBWSxFQUFFLE9BQU87Z0JBQ3BCLGNBQWMsRUFBRSxZQUFZO2dCQUM1QixxQkFBcUI7Z0JBRXJCLHdEQUF3RDtnQkFDeEQsWUFBWSxFQUFFLGVBQWU7YUFDOUIsQ0FBQztTQUNKLENBQUMsQ0FBQztRQUNILFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksMENBQWUsQ0FBQztZQUMxRCxVQUFVLEVBQUUsUUFBUTtZQUNwQixPQUFPLEVBQUUsSUFBSSwrQkFBZSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7Z0JBQzFDLFdBQVcsRUFBRSxhQUFhO2dCQUMxQixTQUFTLEVBQUUseUJBQVMsQ0FBQyxVQUFVLENBQUM7b0JBQzlCLE9BQU8sRUFBRSxLQUFLO29CQUNkLE1BQU0sRUFBRTt3QkFDTixPQUFPLEVBQUU7NEJBQ1AsUUFBUSxFQUFFO2dDQUNSLGFBQWE7Z0NBQ2IsYUFBYTs2QkFDZDt5QkFDRjt3QkFDRCxLQUFLLEVBQUU7NEJBQ0wsUUFBUSxFQUFFLGVBQWU7eUJBQzFCO3FCQUNGO29CQUNELFNBQVMsRUFBRTt3QkFDVCxxQkFBcUIsRUFBRTs0QkFDckIsQ0FBQyxlQUFlLENBQUMsWUFBc0IsQ0FBQyxFQUFFO2dDQUN4QyxnQkFBZ0IsRUFBRSxnQkFBZ0I7Z0NBQ2xDLEtBQUssRUFBRTtvQ0FDTCxHQUFHO2lDQUNKOzZCQUNGOzRCQUNELENBQUMsaUJBQWlCLENBQUMsWUFBc0IsQ0FBQyxFQUFFO2dDQUMxQyxnQkFBZ0IsRUFBRSxnQkFBZ0I7Z0NBQ2xDLEtBQUssRUFBRTtvQ0FDTCxhQUFhO2lDQUNkOzZCQUNGO3lCQUNGO3FCQUNGO2lCQUNGLENBQUM7Z0JBQ0YsV0FBVyxFQUFFO29CQUNYLFVBQVUsRUFBRSwrQkFBZSxDQUFDLFlBQVk7aUJBQ3pDO2FBQ0YsQ0FBQztZQUNGLEtBQUssRUFBRSxZQUFZO1lBQ25CLE9BQU8sRUFBRSxDQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQztTQUM5QyxDQUFDLENBQUMsQ0FBQTtRQUNILFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsVUFBVSxDQUM5QixJQUFJLHlDQUFjLENBQUM7WUFDakIsVUFBVSxFQUFFLGVBQWU7WUFDM0IsS0FBSyxFQUFFLGlCQUFpQjtZQUN4QixNQUFNLEVBQUUsWUFBWTtZQUNwQixZQUFZLEVBQUUsQ0FBQyx1Q0FBWSxDQUFDLFNBQVMsRUFBRSxFQUFFLHVDQUFZLENBQUMsTUFBTSxDQUFDLGVBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRSxRQUFRLEVBQUUsQ0FBQztTQUNaLENBQUMsRUFDRixJQUFJLHlDQUFjLENBQUM7WUFDakIsVUFBVSxFQUFFLGFBQWE7WUFDekIsS0FBSyxFQUFFLGVBQWU7WUFDdEIsTUFBTSxFQUFFLFlBQVk7WUFDcEIsWUFBWSxFQUFFLENBQUMsdUNBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QyxRQUFRLEVBQUUsQ0FBQztTQUNaLENBQUMsQ0FBQyxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBL0ZELDRDQStGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QXBwLCBEdXJhdGlvbiwgU2VjcmV0VmFsdWUsIFN0YWNrLCBTdGFja1Byb3BzfSBmcm9tIFwiQGF3cy1jZGsvY29yZVwiO1xuaW1wb3J0IHsgQ2RrUGlwZWxpbmUsIFNpbXBsZVN5bnRoQWN0aW9uIH0gZnJvbSBcIkBhd3MtY2RrL3BpcGVsaW5lc1wiO1xuaW1wb3J0IHtCdWlsZFNwZWMsIExpbnV4QnVpbGRJbWFnZSwgUGlwZWxpbmVQcm9qZWN0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVidWlsZFwiO1xuaW1wb3J0IHtBcnRpZmFjdCwgUGlwZWxpbmV9IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lXCI7XG5pbXBvcnQge1xuICBDYWNoZUNvbnRyb2wsXG4gIENvZGVCdWlsZEFjdGlvbixcbiAgR2l0SHViU291cmNlQWN0aW9uLFxuICBHaXRIdWJUcmlnZ2VyLFxuICBTM0RlcGxveUFjdGlvblxufSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zXCI7XG5pbXBvcnQge1JlYWN0U3RhY2t9IGZyb20gJy4vcmVhY3Qtc3RhY2snO1xuXG5leHBvcnQgY2xhc3MgUmVhY3RTYW1wbGVTdGFjayBleHRlbmRzIFN0YWNrIHtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoYXBwLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qgc291cmNlT3V0cHV0ID0gbmV3IEFydGlmYWN0KCk7XG4gICAgY29uc3QgYnVpbGRIdG1sT3V0cHV0ID0gbmV3IEFydGlmYWN0KCdiYXNlJyk7XG4gICAgY29uc3QgYnVpbGRTdGF0aWNPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ3N0YXRpYycpO1xuICAgIGNvbnN0IGNsb3VkQXNzZW1ibHlBcnRpZmFjdCA9IG5ldyBBcnRpZmFjdCgpO1xuXG4gICAgY29uc3QgcmVhY3RTdGFjayA9IG5ldyBSZWFjdFN0YWNrKHRoaXMsICdSZWFjdFN0YWNrJyk7XG5cbiAgICBjb25zdCB3ZWJhcHBCdWNrZXQgPSByZWFjdFN0YWNrLndlYmFwcEJ1Y2tldDtcblxuICAgIGNvbnN0IHBpcGVsaW5lID0gbmV3IENka1BpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcbiAgICAgIC8vIFRoZSBwaXBlbGluZSBuYW1lXG4gICAgICBwaXBlbGluZU5hbWU6ICdNeVN0YXRpY1BpcGVsaW5lJyxcbiAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdCxcblxuICAgICAgLy8gV2hlcmUgdGhlIHNvdXJjZSBjYW4gYmUgZm91bmRcbiAgICAgIHNvdXJjZUFjdGlvbjogbmV3IEdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6ICdHaXRIdWInLFxuICAgICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgb2F1dGhUb2tlbjogU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoJ2dpdGh1Yi10b2tlbicpLFxuICAgICAgICBvd25lcjogJ2JyaWFuc3VudGVyJyxcbiAgICAgICAgcmVwbzogJ2Nkay1yZWFjdCcsXG4gICAgICB9KSxcblxuICAgICAgIC8vIEhvdyBpdCB3aWxsIGJlIGJ1aWx0IGFuZCBzeW50aGVzaXplZFxuICAgICAgIHN5bnRoQWN0aW9uOiBTaW1wbGVTeW50aEFjdGlvbi5zdGFuZGFyZE5wbVN5bnRoKHtcbiAgICAgICAgc3ViZGlyZWN0b3J5OiAnaW5mcmEnLFxuICAgICAgICAgc291cmNlQXJ0aWZhY3Q6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdCxcbiAgICAgICAgIFxuICAgICAgICAgLy8gV2UgbmVlZCBhIGJ1aWxkIHN0ZXAgdG8gY29tcGlsZSB0aGUgVHlwZVNjcmlwdCBMYW1iZGFcbiAgICAgICAgIGJ1aWxkQ29tbWFuZDogJ25wbSBydW4gYnVpbGQnXG4gICAgICAgfSksXG4gICAgfSk7XG4gICAgcGlwZWxpbmUuYWRkU3RhZ2UoXCJDb21waWxlXCIpLmFkZEFjdGlvbnMobmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiAnV2ViYXBwJyxcbiAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ0J1aWxkJywge1xuICAgICAgICBwcm9qZWN0TmFtZTogJ1JlYWN0U2FtcGxlJyxcbiAgICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbU9iamVjdCh7XG4gICAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICAgJ2NkIGZyb250ZW5kJyxcbiAgICAgICAgICAgICAgICAnbnBtIGluc3RhbGwnXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgICBjb21tYW5kczogJ25wbSBydW4gYnVpbGQnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAgICdzZWNvbmRhcnktYXJ0aWZhY3RzJzoge1xuICAgICAgICAgICAgICBbYnVpbGRIdG1sT3V0cHV0LmFydGlmYWN0TmFtZSBhcyBzdHJpbmddOiB7XG4gICAgICAgICAgICAgICAgJ2Jhc2UtZGlyZWN0b3J5JzogJ2Zyb250ZW5kL2J1aWxkJyxcbiAgICAgICAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgICAgICAgJyonXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBbYnVpbGRTdGF0aWNPdXRwdXQuYXJ0aWZhY3ROYW1lIGFzIHN0cmluZ106IHtcbiAgICAgICAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnZnJvbnRlbmQvYnVpbGQnLFxuICAgICAgICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAgICAgICAnc3RhdGljLyoqLyonXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNF8wLFxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvdXRwdXRzOiBbYnVpbGRTdGF0aWNPdXRwdXQsIGJ1aWxkSHRtbE91dHB1dF1cbiAgICB9KSlcbiAgICBwaXBlbGluZS5hZGRTdGFnZShcIkRlcGxveVwiKS5hZGRBY3Rpb25zKFxuICAgICAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICAgICAgYWN0aW9uTmFtZTogJ1N0YXRpYy1Bc3NldHMnLFxuICAgICAgICAgICAgICBpbnB1dDogYnVpbGRTdGF0aWNPdXRwdXQsXG4gICAgICAgICAgICAgIGJ1Y2tldDogd2ViYXBwQnVja2V0LFxuICAgICAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtDYWNoZUNvbnRyb2wuc2V0UHVibGljKCksIENhY2hlQ29udHJvbC5tYXhBZ2UoRHVyYXRpb24uZGF5cyg1KSldLFxuICAgICAgICAgICAgICBydW5PcmRlcjogMVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgICAgICBhY3Rpb25OYW1lOiAnSFRNTC1Bc3NldHMnLFxuICAgICAgICAgICAgICBpbnB1dDogYnVpbGRIdG1sT3V0cHV0LFxuICAgICAgICAgICAgICBidWNrZXQ6IHdlYmFwcEJ1Y2tldCxcbiAgICAgICAgICAgICAgY2FjaGVDb250cm9sOiBbQ2FjaGVDb250cm9sLm5vQ2FjaGUoKV0sXG4gICAgICAgICAgICAgIHJ1bk9yZGVyOiAyXG4gICAgICAgICAgICB9KSk7XG4gIH1cbn1cbiJdfQ==
