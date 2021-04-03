"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactStack = void 0;
const core_1 = require("@aws-cdk/core");
const pipelines_1 = require("@aws-cdk/pipelines");
const lambda_stage_1 = require("./lambda-stage");
const aws_codebuild_1 = require("@aws-cdk/aws-codebuild");
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
const react_stage_1 = require("./react-stage");
const aws_s3_1 = require("@aws-cdk/aws-s3");
class ReactStack extends core_1.Stack {
    constructor(app, id, props) {
        super(app, id, props);
        const sourceOutput = new aws_codepipeline_1.Artifact();
        const cloudAssemblyArtifact = new aws_codepipeline_1.Artifact();
        const buildHtmlOutput = new aws_codepipeline_1.Artifact("base");
        const buildStaticOutput = new aws_codepipeline_1.Artifact("static");
        const buildLambdaOutput = new aws_codepipeline_1.Artifact("lambda");
        const lambdaBucket = new aws_s3_1.Bucket(this, "LambdaBucket", {
            bucketName: `lambdabrian-dev`,
        });
        const pipeline = new pipelines_1.CdkPipeline(this, "Pipeline", {
            pipelineName: "AppPipeline",
            cloudAssemblyArtifact,
            sourceAction: new aws_codepipeline_actions_1.GitHubSourceAction({
                actionName: "GitHub",
                output: sourceOutput,
                oauthToken: core_1.SecretValue.secretsManager("github-token"),
                owner: "briansunter",
                repo: "cdk-react",
            }),
            synthAction: pipelines_1.SimpleSynthAction.standardNpmSynth({
                subdirectory: "infra",
                sourceArtifact: sourceOutput,
                cloudAssemblyArtifact,
                buildCommand: "npm run build",
            }),
        });
        pipeline.addStage("CompileLambda").addActions(new aws_codepipeline_actions_1.CodeBuildAction({
            actionName: "Webapp",
            project: new aws_codebuild_1.PipelineProject(this, "LambsaBuild", {
                projectName: "ReactSample",
                buildSpec: aws_codebuild_1.BuildSpec.fromObject({
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
                        [buildStaticOutput.artifactName]: {
                            "base-directory": "lambda",
                            files: ["*"],
                        },
                    },
                }),
                environment: {
                    buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_4_0,
                },
            }),
            input: sourceOutput,
            outputs: [buildLambdaOutput],
        }), new aws_codepipeline_actions_1.S3DeployAction({
            actionName: "Lambda-Assets",
            input: buildLambdaOutput,
            bucket: lambdaBucket,
            runOrder: 2,
        }));
        pipeline.addApplicationStage(new lambda_stage_1.LambdaStage(this, "LambdaStackDev", "dev", buildLambdaOutput.bucketName, buildLambdaOutput.objectKey, {
            env: { account: "847136656635", region: "us-east-1" },
        }));
        pipeline.addStage("Compile").addActions(new aws_codepipeline_actions_1.CodeBuildAction({
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
                            commands: ["npm run build", "npm run test:ci"],
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
        }));
        const devBucket = aws_s3_1.Bucket.fromBucketName(this, "DevBucket", "reactbriansunter-dev");
        pipeline
            .addApplicationStage(new react_stage_1.ReactStage(this, "ReactStackDev", "dev", {
            env: { account: "847136656635", region: "us-east-1" },
        }))
            .addActions(new aws_codepipeline_actions_1.S3DeployAction({
            actionName: "Static-Assets",
            input: buildStaticOutput,
            bucket: devBucket,
            cacheControl: [
                aws_codepipeline_actions_1.CacheControl.setPublic(),
                aws_codepipeline_actions_1.CacheControl.maxAge(core_1.Duration.days(5)),
            ],
            runOrder: 1,
        }), new aws_codepipeline_actions_1.S3DeployAction({
            actionName: "HTML-Assets",
            input: buildHtmlOutput,
            bucket: devBucket,
            cacheControl: [aws_codepipeline_actions_1.CacheControl.noCache()],
            runOrder: 2,
        }), new aws_codepipeline_actions_1.ManualApprovalAction({
            actionName: `Approvedev`,
            runOrder: 3,
        }));
        const qaBucket = aws_s3_1.Bucket.fromBucketName(this, "QaBucket", "reactbriansunter-qa");
        pipeline
            .addApplicationStage(new react_stage_1.ReactStage(this, "ReactStackQa", "qa", {
            env: { account: "847136656635", region: "us-east-1" },
        }))
            .addActions(new aws_codepipeline_actions_1.S3DeployAction({
            actionName: "Static-Assets",
            input: buildStaticOutput,
            bucket: qaBucket,
            cacheControl: [
                aws_codepipeline_actions_1.CacheControl.setPublic(),
                aws_codepipeline_actions_1.CacheControl.maxAge(core_1.Duration.days(5)),
            ],
            runOrder: 1,
        }), new aws_codepipeline_actions_1.S3DeployAction({
            actionName: "HTML-Assets",
            input: buildHtmlOutput,
            bucket: qaBucket,
            cacheControl: [aws_codepipeline_actions_1.CacheControl.noCache()],
            runOrder: 2,
        }));
    }
}
exports.ReactStack = ReactStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBOEU7QUFDOUUsa0RBQW9FO0FBQ3BFLGlEQUE2QztBQUM3QywwREFJZ0M7QUFDaEMsZ0VBQXFEO0FBQ3JELGdGQU0yQztBQUUzQywrQ0FBMkM7QUFDM0MsNENBQXlDO0FBQ3pDLE1BQWEsVUFBVyxTQUFRLFlBQUs7SUFDbkMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQ2xELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLE1BQU0sWUFBWSxHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBQ3BDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSwyQkFBUSxFQUFFLENBQUM7UUFFN0MsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSwyQkFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELE1BQU0saUJBQWlCLEdBQUcsSUFBSSwyQkFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sWUFBWSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDcEQsVUFBVSxFQUFFLGlCQUFpQjtTQUM5QixDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNqRCxZQUFZLEVBQUUsYUFBYTtZQUMzQixxQkFBcUI7WUFDckIsWUFBWSxFQUFFLElBQUksNkNBQWtCLENBQUM7Z0JBQ25DLFVBQVUsRUFBRSxRQUFRO2dCQUNwQixNQUFNLEVBQUUsWUFBWTtnQkFDcEIsVUFBVSxFQUFFLGtCQUFXLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQztnQkFDdEQsS0FBSyxFQUFFLGFB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QVE7YUFDTCxtQkFBbUIsQ0FDbEIsSUFBSSx3QkFBVSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFO1lBQ3pDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtTQUN0RCxDQUFDLENBQ0g7YUFDQSxVQUFVLENBQ1QsSUFBSSx5Q0FBYyxDQUFDO1lBQ2pCLFVBQVUsRUFBRSxlQUFlO1lBQzNCLEtBQUssRUFBRSxpQkFBaUI7WUFDeEIsTUFBTSxFQUFFLFFBQVE7WUFDaEIsWUFBWSxFQUFFO2dCQUNaLHVDQUFZLENBQUMsU0FBUyxFQUFFO2dCQUN4Qix1Q0FBWSxDQUFDLE1BQU0sQ0FBQyxlQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3RDO1lBQ0QsUUFBUSxFQUFFLENBQUM7U0FDWixDQUFDLEVBQ0YsSUFBSSx5Q0FBYyxDQUFDO1lBQ2pCLFVBQVUsRUFBRSxhQUFhO1lBQ3pCLEtBQUssRUFBRSxlQUFlO1lBQ3RCLE1BQU0sRUFBRSxRQUFRO1lBQ2hCLFlBQVksRUFBRSxDQUFDLHVDQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEMsUUFBUSxFQUFFLENBQUM7U0FDWixDQUFDLENBQ0gsQ0FBQztJQUNOLENBQUM7Q0FDRjtBQW5MRCxnQ0FtTEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIER1cmF0aW9uLCBTZWNyZXRWYWx1ZSwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tIFwiQGF3cy1jZGsvY29yZVwiO1xuaW1wb3J0IHsgQ2RrUGlwZWxpbmUsIFNpbXBsZVN5bnRoQWN0aW9uIH0gZnJvbSBcIkBhd3MtY2RrL3BpcGVsaW5lc1wiO1xuaW1wb3J0IHsgTGFtYmRhU3RhZ2UgfSBmcm9tIFwiLi9sYW1iZGEtc3RhZ2VcIjtcbmltcG9ydCB7XG4gIEJ1aWxkU3BlYyxcbiAgTGludXhCdWlsZEltYWdlLFxuICBQaXBlbGluZVByb2plY3QsXG59IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZWJ1aWxkXCI7XG5pbXBvcnQgeyBBcnRpZmFjdCB9IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lXCI7XG5pbXBvcnQge1xuICBDYWNoZUNvbnRyb2wsXG4gIENvZGVCdWlsZEFjdGlvbixcbiAgR2l0SHViU291cmNlQWN0aW9uLFxuICBNYW51YWxBcHByb3ZhbEFjdGlvbixcbiAgUzNEZXBsb3lBY3Rpb24sXG59IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnNcIjtcblxuaW1wb3J0IHsgUmVhY3RTdGFnZSB9IGZyb20gXCIuL3JlYWN0LXN0YWdlXCI7XG5pbXBvcnQgeyBCdWNrZXQgfSBmcm9tIFwiQGF3cy1jZGsvYXdzLXMzXCI7XG5leHBvcnQgY2xhc3MgUmVhY3RTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKGFwcCwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBBcnRpZmFjdCgpO1xuICAgIGNvbnN0IGNsb3VkQXNzZW1ibHlBcnRpZmFjdCA9IG5ldyBBcnRpZmFjdCgpO1xuXG4gICAgY29uc3QgYnVpbGRIdG1sT3V0cHV0ID0gbmV3IEFydGlmYWN0KFwiYmFzZVwiKTtcbiAgICBjb25zdCBidWlsZFN0YXRpY091dHB1dCA9IG5ldyBBcnRpZmFjdChcInN0YXRpY1wiKTtcbiAgICBjb25zdCBidWlsZExhbWJkYU91dHB1dCA9IG5ldyBBcnRpZmFjdChcImxhbWJkYVwiKTtcbiAgICBjb25zdCBsYW1iZGFCdWNrZXQgPSBuZXcgQnVja2V0KHRoaXMsIFwiTGFtYmRhQnVja2V0XCIsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBsYW1iZGFicmlhbi1kZXZgLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcGlwZWxpbmUgPSBuZXcgQ2RrUGlwZWxpbmUodGhpcywgXCJQaXBlbGluZVwiLCB7XG4gICAgICBwaXBlbGluZU5hbWU6IFwiQXBwUGlwZWxpbmVcIixcbiAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdCxcbiAgICAgIHNvdXJjZUFjdGlvbjogbmV3IEdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6IFwiR2l0SHViXCIsXG4gICAgICAgIG91dHB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICBvYXV0aFRva2VuOiBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcihcImdpdGh1Yi10b2tlblwiKSxcbiAgICAgICAgb3duZXI6IFwiYnJpYW5zdW50ZXJcIixcbiAgICAgICAgcmVwbzogXCJjZGstcmVhY3RcIixcbiAgICAgIH0pLFxuICAgICAgc3ludGhBY3Rpb246IFNpbXBsZVN5bnRoQWN0aW9uLnN0YW5kYXJkTnBtU3ludGgoe1xuICAgICAgICBzdWJkaXJlY3Rvcnk6IFwiaW5mcmFcIixcbiAgICAgICAgc291cmNlQXJ0aWZhY3Q6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgY2xvdWRBc3NlbWJseUFydGlmYWN0LFxuICAgICAgICBidWlsZENvbW1hbmQ6IFwibnBtIHJ1biBidWlsZFwiLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBwaXBlbGluZS5hZGRTdGFnZShcIkNvbXBpbGVMYW1iZGFcIikuYWRkQWN0aW9ucyhcbiAgICAgIG5ldyBDb2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiBcIldlYmFwcFwiLFxuICAgICAgICBwcm9qZWN0OiBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsIFwiTGFtYnNhQnVpbGRcIiwge1xuICAgICAgICAgIHByb2plY3ROYW1lOiBcIlJlYWN0U2FtcGxlXCIsXG4gICAgICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbU9iamVjdCh7XG4gICAgICAgICAgICB2ZXJzaW9uOiBcIjAuMlwiLFxuICAgICAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgICAgIGluc3RhbGw6IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kczogW1wiY2QgbGFtYmRhXCJdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgICAgIGNvbW1hbmRzOiBbXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAgICAgICBbYnVpbGRTdGF0aWNPdXRwdXQuYXJ0aWZhY3ROYW1lIGFzIHN0cmluZ106IHtcbiAgICAgICAgICAgICAgICAgIFwiYmFzZS1kaXJlY3RvcnlcIjogXCJsYW1iZGFcIixcbiAgICAgICAgICAgICAgICAgIGZpbGVzOiBbXCIqXCJdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF80XzAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIG91dHB1dHM6IFtidWlsZExhbWJkYU91dHB1dF0sXG4gICAgICB9KSxcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIkxhbWJkYS1Bc3NldHNcIixcbiAgICAgICAgICBpbnB1dDogYnVpbGRMYW1iZGFPdXRwdXQsXG4gICAgICAgICAgYnVja2V0OiBsYW1iZGFCdWNrZXQsXG4gICAgICAgICAgcnVuT3JkZXI6IDIsXG4gICAgICAgIH0pLFxuICAgICk7XG5cbiAgICBwaXBlbGluZS5hZGRBcHBsaWNhdGlvblN0YWdlKFxuICAgICAgbmV3IExhbWJkYVN0YWdlKHRoaXMsIFwiTGFtYmRhU3RhY2tEZXZcIiwgXCJkZXZcIiwgYnVpbGRMYW1iZGFPdXRwdXQuYnVja2V0TmFtZSwgYnVpbGRMYW1iZGFPdXRwdXQub2JqZWN0S2V5LCB7XG4gICAgICAgIGVudjogeyBhY2NvdW50OiBcIjg0NzEzNjY1NjYzNVwiLCByZWdpb246IFwidXMtZWFzdC0xXCIgfSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHBpcGVsaW5lLmFkZFN0YWdlKFwiQ29tcGlsZVwiKS5hZGRBY3Rpb25zKFxuICAgICAgbmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6IFwiV2ViYXBwXCIsXG4gICAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgXCJCdWlsZFwiLCB7XG4gICAgICAgICAgcHJvamVjdE5hbWU6IFwiUmVhY3RTYW1wbGVcIixcbiAgICAgICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgICAgIHZlcnNpb246IFwiMC4yXCIsXG4gICAgICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgICAgIGNvbW1hbmRzOiBbXCJjZCBmcm9udGVuZFwiLCBcIm5wbSBpbnN0YWxsXCJdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgICAgIGNvbW1hbmRzOiBbXCJucG0gcnVuIGJ1aWxkXCIsIFwibnBtIHJ1biB0ZXN0OmNpXCJdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgICAgICBcInNlY29uZGFyeS1hcnRpZmFjdHNcIjoge1xuICAgICAgICAgICAgICAgIFtidWlsZEh0bWxPdXRwdXQuYXJ0aWZhY3ROYW1lIGFzIHN0cmluZ106IHtcbiAgICAgICAgICAgICAgICAgIFwiYmFzZS1kaXJlY3RvcnlcIjogXCJmcm9udGVuZC9idWlsZFwiLFxuICAgICAgICAgICAgICAgICAgZmlsZXM6IFtcIipcIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBbYnVpbGRTdGF0aWNPdXRwdXQuYXJ0aWZhY3ROYW1lIGFzIHN0cmluZ106IHtcbiAgICAgICAgICAgICAgICAgIFwiYmFzZS1kaXJlY3RvcnlcIjogXCJmcm9udGVuZC9idWlsZFwiLFxuICAgICAgICAgICAgICAgICAgZmlsZXM6IFtcInN0YXRpYy8qKi8qXCJdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNF8wLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICBvdXRwdXRzOiBbYnVpbGRTdGF0aWNPdXRwdXQsIGJ1aWxkSHRtbE91dHB1dF0sXG4gICAgICB9KVxuICAgICk7XG4gICAgY29uc3QgZGV2QnVja2V0ID0gQnVja2V0LmZyb21CdWNrZXROYW1lKFxuICAgICAgdGhpcyxcbiAgICAgIFwiRGV2QnVja2V0XCIsXG4gICAgICBcInJlYWN0YnJpYW5zdW50ZXItZGV2XCJcbiAgICApO1xuXG4gICAgcGlwZWxpbmVcbiAgICAgIC5hZGRBcHBsaWNhdGlvblN0YWdlKFxuICAgICAgICBuZXcgUmVhY3RTdGFnZSh0aGlzLCBcIlJlYWN0U3RhY2tEZXZcIiwgXCJkZXZcIiwge1xuICAgICAgICAgIGVudjogeyBhY2NvdW50OiBcIjg0NzEzNjY1NjYzNVwiLCByZWdpb246IFwidXMtZWFzdC0xXCIgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRBY3Rpb25zKFxuICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IFwiU3RhdGljLUFzc2V0c1wiLFxuICAgICAgICAgIGlucHV0OiBidWlsZFN0YXRpY091dHB1dCxcbiAgICAgICAgICBidWNrZXQ6IGRldkJ1Y2tldCxcbiAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtcbiAgICAgICAgICAgIENhY2hlQ29udHJvbC5zZXRQdWJsaWMoKSxcbiAgICAgICAgICAgIENhY2hlQ29udHJvbC5tYXhBZ2UoRHVyYXRpb24uZGF5cyg1KSksXG4gICAgICAgICAgXSxcbiAgICAgICAgICBydW5PcmRlcjogMSxcbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogXCJIVE1MLUFzc2V0c1wiLFxuICAgICAgICAgIGlucHV0OiBidWlsZEh0bWxPdXRwdXQsXG4gICAgICAgICAgYnVja2V0OiBkZXZCdWNrZXQsXG4gICAgICAgICAgY2FjaGVDb250cm9sOiBbQ2FjaGVDb250cm9sLm5vQ2FjaGUoKV0sXG4gICAgICAgICAgcnVuT3JkZXI6IDIsXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgTWFudWFsQXBwcm92YWxBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IGBBcHByb3ZlZGV2YCxcbiAgICAgICAgICBydW5PcmRlcjogMyxcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBjb25zdCBxYUJ1Y2tldCA9IEJ1Y2tldC5mcm9tQnVja2V0TmFtZShcbiAgICAgIHRoaXMsXG4gICAgICBcIlFhQnVja2V0XCIsXG4gICAgICBcInJlYWN0YnJpYW5zdW50ZXItcWFcIlxuICAgICk7XG5cbiAgICBwaXBlbGluZVxuICAgICAgLmFkZEFwcGxpY2F0aW9uU3RhZ2UoXG4gICAgICAgIG5ldyBSZWFjdFN0YWdlKHRoaXMsIFwiUmVhY3RTdGFja1FhXCIsIFwicWFcIiwge1xuICAgICAgICAgIGVudjogeyBhY2NvdW50OiBcIjg0NzEzNjY1NjYzNVwiLCByZWdpb246IFwidXMtZWFzdC0xXCIgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRBY3Rpb25zKFxuICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IFwiU3RhdGljLUFzc2V0c1wiLFxuICAgICAgICAgIGlucHV0OiBidWlsZFN0YXRpY091dHB1dCxcbiAgICAgICAgICBidWNrZXQ6IHFhQnVja2V0LFxuICAgICAgICAgIGNhY2hlQ29udHJvbDogW1xuICAgICAgICAgICAgQ2FjaGVDb250cm9sLnNldFB1YmxpYygpLFxuICAgICAgICAgICAgQ2FjaGVDb250cm9sLm1heEFnZShEdXJhdGlvbi5kYXlzKDUpKSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJ1bk9yZGVyOiAxLFxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIkhUTUwtQXNzZXRzXCIsXG4gICAgICAgICAgaW5wdXQ6IGJ1aWxkSHRtbE91dHB1dCxcbiAgICAgICAgICBidWNrZXQ6IHFhQnVja2V0LFxuICAgICAgICAgIGNhY2hlQ29udHJvbDogW0NhY2hlQ29udHJvbC5ub0NhY2hlKCldLFxuICAgICAgICAgIHJ1bk9yZGVyOiAyLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxufVxuIl19