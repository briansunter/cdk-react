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
            actionName: "LambdaBuildaAction",
            project: new aws_codebuild_1.PipelineProject(this, "LambdaBuild", {
                projectName: "LambdaBuild",
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
                        "base-directory": "lambda",
                        files: ["**/*"],
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
        const devReactStage = new react_stage_1.ReactStage(this, "ReactStackDev", "dev", {
            env: { account: "847136656635", region: "us-east-1" },
        });
        pipeline
            .addApplicationStage(devReactStage)
            .addActions(new aws_codepipeline_actions_1.S3DeployAction({
            actionName: "Static-Assets",
            runOrder: 3,
            input: buildStaticOutput,
            bucket: devBucket,
            cacheControl: [
                aws_codepipeline_actions_1.CacheControl.setPublic(),
                aws_codepipeline_actions_1.CacheControl.maxAge(core_1.Duration.days(5)),
            ]
        }), new aws_codepipeline_actions_1.S3DeployAction({
            actionName: "HTML-Assets",
            input: buildHtmlOutput,
            runOrder: 4,
            bucket: devBucket,
            cacheControl: [aws_codepipeline_actions_1.CacheControl.noCache()]
        }), new aws_codepipeline_actions_1.ManualApprovalAction({
            runOrder: 5,
            actionName: `Approvedev`
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
            runOrder: 3,
            cacheControl: [
                aws_codepipeline_actions_1.CacheControl.setPublic(),
                aws_codepipeline_actions_1.CacheControl.maxAge(core_1.Duration.days(5)),
            ]
        }), new aws_codepipeline_actions_1.S3DeployAction({
            actionName: "HTML-Assets",
            runOrder: 4,
            input: buildHtmlOutput,
            bucket: qaBucket,
            cacheControl: [aws_codepipeline_actions_1.CacheControl.noCache()]
        }));
    }
}
exports.ReactStack = ReactStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBOEU7QUFDOUUsa0RBQW9FO0FBQ3BFLGlEQUE2QztBQUM3QywwREFJZ0M7QUFDaEMsZ0VBQXFEO0FBQ3JELGdGQU0yQztBQUUzQywrQ0FBMkM7QUFDM0MsNENBQXlDO0FBQ3pDLE1BQWEsVUFBVyxTQUFRLFlBQUs7SUFDbkMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQ2xELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLE1BQU0sWUFBWSxHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBQ3BDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSwyQkFBUSxFQUFFLENBQUM7UUFFN0MsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSwyQkFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELE1BQU0saUJBQWlCLEdBQUcsSUFBSSwyQkFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRWpELE1BQU0sWUFBWSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDcEQsVUFBVSxFQUFFLGlCQUFpQjtTQUM5QixDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNqRCxZQUFZLEVBQUUsYUFBYTtZQUMzQixxQkFBcUI7WUFDckIsWUFBWSxFQUFFLElBQUksNkNBQWtCLENBQUM7Z0JBQ25DLFVBQVUsRUFBRSxRQUFRO2dCQUNwQixNQUFNLEVBQUUsWUFBWTtnQkFDcEIsVUFBVSxFQUFFLGtCQUFXLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQztnQkFDdEQsS0FBSyxFQUFFLGFB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QixDQUNsQixJQUFJLHdCQUFVLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUU7WUFDekMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFO1NBQ3RELENBQUMsQ0FDSDthQUNBLFVBQVUsQ0FDVCxJQUFJLHlDQUFjLENBQUM7WUFDakIsVUFBVSxFQUFFLGVBQWU7WUFDM0IsS0FBSyxFQUFFLGlCQUFpQjtZQUN4QixNQUFNLEVBQUUsUUFBUTtZQUNoQixRQUFRLEVBQUUsQ0FBQztZQUNYLFlBQVksRUFBRTtnQkFDWix1Q0FBWSxDQUFDLFNBQVMsRUFBRTtnQkFDeEIsdUNBQVksQ0FBQyxNQUFNLENBQUMsZUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN0QztTQUNGLENBQUMsRUFDRixJQUFJLHlDQUFjLENBQUM7WUFDakIsVUFBVSxFQUFFLGFBQWE7WUFDekIsUUFBUSxFQUFFLENBQUM7WUFDWCxLQUFLLEVBQUUsZUFBZTtZQUN0QixNQUFNLEVBQUUsUUFBUTtZQUNoQixZQUFZLEVBQUUsQ0FBQyx1Q0FBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3ZDLENBQUMsQ0FDSCxDQUFDO0lBQ04sQ0FBQztDQUNGO0FBbExELGdDQWtMQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgRHVyYXRpb24sIFNlY3JldFZhbHVlLCBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gXCJAYXdzLWNkay9jb3JlXCI7XG5pbXBvcnQgeyBDZGtQaXBlbGluZSwgU2ltcGxlU3ludGhBY3Rpb24gfSBmcm9tIFwiQGF3cy1jZGsvcGlwZWxpbmVzXCI7XG5pbXBvcnQgeyBMYW1iZGFTdGFnZSB9IGZyb20gXCIuL2xhbWJkYS1zdGFnZVwiO1xuaW1wb3J0IHtcbiAgQnVpbGRTcGVjLFxuICBMaW51eEJ1aWxkSW1hZ2UsXG4gIFBpcGVsaW5lUHJvamVjdCxcbn0gZnJvbSBcIkBhd3MtY2RrL2F3cy1jb2RlYnVpbGRcIjtcbmltcG9ydCB7IEFydGlmYWN0IH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmVcIjtcbmltcG9ydCB7XG4gIENhY2hlQ29udHJvbCxcbiAgQ29kZUJ1aWxkQWN0aW9uLFxuICBHaXRIdWJTb3VyY2VBY3Rpb24sXG4gIE1hbnVhbEFwcHJvdmFsQWN0aW9uLFxuICBTM0RlcGxveUFjdGlvbixcbn0gZnJvbSBcIkBhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9uc1wiO1xuXG5pbXBvcnQgeyBSZWFjdFN0YWdlIH0gZnJvbSBcIi4vcmVhY3Qtc3RhZ2VcIjtcbmltcG9ydCB7IEJ1Y2tldCB9IGZyb20gXCJAYXdzLWNkay9hd3MtczNcIjtcbmV4cG9ydCBjbGFzcyBSZWFjdFN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoYXBwLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qgc291cmNlT3V0cHV0ID0gbmV3IEFydGlmYWN0KCk7XG4gICAgY29uc3QgY2xvdWRBc3NlbWJseUFydGlmYWN0ID0gbmV3IEFydGlmYWN0KCk7XG5cbiAgICBjb25zdCBidWlsZEh0bWxPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoXCJiYXNlXCIpO1xuICAgIGNvbnN0IGJ1aWxkU3RhdGljT3V0cHV0ID0gbmV3IEFydGlmYWN0KFwic3RhdGljXCIpO1xuICAgIGNvbnN0IGJ1aWxkTGFtYmRhT3V0cHV0ID0gbmV3IEFydGlmYWN0KFwibGFtYmRhXCIpO1xuXG4gICAgY29uc3QgbGFtYmRhQnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLCBcIkxhbWJkYUJ1Y2tldFwiLCB7XG4gICAgICBidWNrZXROYW1lOiBgbGFtYmRhYnJpYW4tZGV2YCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHBpcGVsaW5lID0gbmV3IENka1BpcGVsaW5lKHRoaXMsIFwiUGlwZWxpbmVcIiwge1xuICAgICAgcGlwZWxpbmVOYW1lOiBcIkFwcFBpcGVsaW5lXCIsXG4gICAgICBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QsXG4gICAgICBzb3VyY2VBY3Rpb246IG5ldyBHaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiBcIkdpdEh1YlwiLFxuICAgICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgb2F1dGhUb2tlbjogU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoXCJnaXRodWItdG9rZW5cIiksXG4gICAgICAgIG93bmVyOiBcImJyaWFuc3VudGVyXCIsXG4gICAgICAgIHJlcG86IFwiY2RrLXJlYWN0XCIsXG4gICAgICB9KSxcbiAgICAgIHN5bnRoQWN0aW9uOiBTaW1wbGVTeW50aEFjdGlvbi5zdGFuZGFyZE5wbVN5bnRoKHtcbiAgICAgICAgc3ViZGlyZWN0b3J5OiBcImluZnJhXCIsXG4gICAgICAgIHNvdXJjZUFydGlmYWN0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdCxcbiAgICAgICAgYnVpbGRDb21tYW5kOiBcIm5wbSBydW4gYnVpbGRcIixcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2UoXCJDb21waWxlTGFtYmRhXCIpLmFkZEFjdGlvbnMoXG4gICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogXCJMYW1iZGFCdWlsZGFBY3Rpb25cIixcbiAgICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCBcIkxhbWJkYUJ1aWxkXCIsIHtcbiAgICAgICAgICBwcm9qZWN0TmFtZTogXCJMYW1iZGFCdWlsZFwiLFxuICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICAgICAgdmVyc2lvbjogXCIwLjJcIixcbiAgICAgICAgICAgIHBoYXNlczoge1xuICAgICAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IFtcImNkIGxhbWJkYVwiXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kczogW10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgICAgICAgICBcImJhc2UtZGlyZWN0b3J5XCI6IFwibGFtYmRhXCIsXG4gICAgICAgICAgICAgICAgICBmaWxlczogW1wiKiovKlwiXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzRfMCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgb3V0cHV0czogW2J1aWxkTGFtYmRhT3V0cHV0XSxcbiAgICAgIH0pLFxuICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IFwiTGFtYmRhLUFzc2V0c1wiLFxuICAgICAgICAgIGlucHV0OiBidWlsZExhbWJkYU91dHB1dCxcbiAgICAgICAgICBidWNrZXQ6IGxhbWJkYUJ1Y2tldCxcbiAgICAgICAgICBydW5PcmRlcjogMixcbiAgICAgICAgfSksXG4gICAgKTtcblxuICAgIHBpcGVsaW5lLmFkZEFwcGxpY2F0aW9uU3RhZ2UoXG4gICAgICBuZXcgTGFtYmRhU3RhZ2UodGhpcywgXCJMYW1iZGFTdGFja0RldlwiLCBcImRldlwiLCBidWlsZExhbWJkYU91dHB1dC5idWNrZXROYW1lLCBidWlsZExhbWJkYU91dHB1dC5vYmplY3RLZXksIHtcbiAgICAgICAgZW52OiB7IGFjY291bnQ6IFwiODQ3MTM2NjU2NjM1XCIsIHJlZ2lvbjogXCJ1cy1lYXN0LTFcIiB9LFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2UoXCJDb21waWxlXCIpLmFkZEFjdGlvbnMoXG4gICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogXCJXZWJhcHBcIixcbiAgICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCBcIkJ1aWxkXCIsIHtcbiAgICAgICAgICBwcm9qZWN0TmFtZTogXCJSZWFjdFNhbXBsZVwiLFxuICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICAgICAgdmVyc2lvbjogXCIwLjJcIixcbiAgICAgICAgICAgIHBoYXNlczoge1xuICAgICAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IFtcImNkIGZyb250ZW5kXCIsIFwibnBtIGluc3RhbGxcIl0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IFtcIm5wbSBydW4gYnVpbGRcIiwgXCJucG0gcnVuIHRlc3Q6Y2lcIl0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgICAgIFwic2Vjb25kYXJ5LWFydGlmYWN0c1wiOiB7XG4gICAgICAgICAgICAgICAgW2J1aWxkSHRtbE91dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICAgXCJiYXNlLWRpcmVjdG9yeVwiOiBcImZyb250ZW5kL2J1aWxkXCIsXG4gICAgICAgICAgICAgICAgICBmaWxlczogW1wiKlwiXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFtidWlsZFN0YXRpY091dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICAgXCJiYXNlLWRpcmVjdG9yeVwiOiBcImZyb250ZW5kL2J1aWxkXCIsXG4gICAgICAgICAgICAgICAgICBmaWxlczogW1wic3RhdGljLyoqLypcIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF80XzAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIG91dHB1dHM6IFtidWlsZFN0YXRpY091dHB1dCwgYnVpbGRIdG1sT3V0cHV0XSxcbiAgICAgIH0pXG4gICAgKTtcbiAgICBjb25zdCBkZXZCdWNrZXQgPSBCdWNrZXQuZnJvbUJ1Y2tldE5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgXCJEZXZCdWNrZXRcIixcbiAgICAgIFwicmVhY3RicmlhbnN1bnRlci1kZXZcIlxuICAgICk7XG5cbiAgICAgICAgY29uc3QgZGV2UmVhY3RTdGFnZSA9IG5ldyBSZWFjdFN0YWdlKHRoaXMsIFwiUmVhY3RTdGFja0RldlwiLCBcImRldlwiLCB7XG4gICAgICAgICAgZW52OiB7IGFjY291bnQ6IFwiODQ3MTM2NjU2NjM1XCIsIHJlZ2lvbjogXCJ1cy1lYXN0LTFcIiB9LFxuICAgICAgICB9KVxuXG4gICAgcGlwZWxpbmVcbiAgICAgIC5hZGRBcHBsaWNhdGlvblN0YWdlKGRldlJlYWN0U3RhZ2UpXG4gICAgICAuYWRkQWN0aW9ucyhcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIlN0YXRpYy1Bc3NldHNcIixcbiAgICAgICAgICBydW5PcmRlcjogMyxcbiAgICAgICAgICBpbnB1dDogYnVpbGRTdGF0aWNPdXRwdXQsXG4gICAgICAgICAgYnVja2V0OiBkZXZCdWNrZXQsXG4gICAgICAgICAgY2FjaGVDb250cm9sOiBbXG4gICAgICAgICAgICBDYWNoZUNvbnRyb2wuc2V0UHVibGljKCksXG4gICAgICAgICAgICBDYWNoZUNvbnRyb2wubWF4QWdlKER1cmF0aW9uLmRheXMoNSkpLFxuICAgICAgICAgIF1cbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogXCJIVE1MLUFzc2V0c1wiLFxuICAgICAgICAgIGlucHV0OiBidWlsZEh0bWxPdXRwdXQsXG4gICAgICAgICAgcnVuT3JkZXI6IDQsXG4gICAgICAgICAgYnVja2V0OiBkZXZCdWNrZXQsXG4gICAgICAgICAgY2FjaGVDb250cm9sOiBbQ2FjaGVDb250cm9sLm5vQ2FjaGUoKV1cbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBNYW51YWxBcHByb3ZhbEFjdGlvbih7XG4gICAgICAgICAgcnVuT3JkZXI6IDUsXG4gICAgICAgICAgYWN0aW9uTmFtZTogYEFwcHJvdmVkZXZgXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgY29uc3QgcWFCdWNrZXQgPSBCdWNrZXQuZnJvbUJ1Y2tldE5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgXCJRYUJ1Y2tldFwiLFxuICAgICAgXCJyZWFjdGJyaWFuc3VudGVyLXFhXCJcbiAgICApO1xuXG4gICAgcGlwZWxpbmVcbiAgICAgIC5hZGRBcHBsaWNhdGlvblN0YWdlKFxuICAgICAgICBuZXcgUmVhY3RTdGFnZSh0aGlzLCBcIlJlYWN0U3RhY2tRYVwiLCBcInFhXCIsIHtcbiAgICAgICAgICBlbnY6IHsgYWNjb3VudDogXCI4NDcxMzY2NTY2MzVcIiwgcmVnaW9uOiBcInVzLWVhc3QtMVwiIH0sXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkQWN0aW9ucyhcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIlN0YXRpYy1Bc3NldHNcIixcbiAgICAgICAgICBpbnB1dDogYnVpbGRTdGF0aWNPdXRwdXQsXG4gICAgICAgICAgYnVja2V0OiBxYUJ1Y2tldCxcbiAgICAgICAgICBydW5PcmRlcjogMyxcbiAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtcbiAgICAgICAgICAgIENhY2hlQ29udHJvbC5zZXRQdWJsaWMoKSxcbiAgICAgICAgICAgIENhY2hlQ29udHJvbC5tYXhBZ2UoRHVyYXRpb24uZGF5cyg1KSksXG4gICAgICAgICAgXVxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIkhUTUwtQXNzZXRzXCIsXG4gICAgICAgICAgcnVuT3JkZXI6IDQsXG4gICAgICAgICAgaW5wdXQ6IGJ1aWxkSHRtbE91dHB1dCxcbiAgICAgICAgICBidWNrZXQ6IHFhQnVja2V0LFxuICAgICAgICAgIGNhY2hlQ29udHJvbDogW0NhY2hlQ29udHJvbC5ub0NhY2hlKCldXG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG59XG4iXX0=