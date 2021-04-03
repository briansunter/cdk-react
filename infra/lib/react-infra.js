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
        pipeline.addApplicationStage(new lambda_stage_1.LambdaStage(this, "LambdaStackDev", "dev", lambdaBucket.bucketName, buildLambdaOutput.objectKey, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBOEU7QUFDOUUsa0RBQW9FO0FBQ3BFLGlEQUE2QztBQUM3QywwREFJZ0M7QUFDaEMsZ0VBQXFEO0FBQ3JELGdGQU0yQztBQUUzQywrQ0FBMkM7QUFDM0MsNENBQXlDO0FBQ3pDLE1BQWEsVUFBVyxTQUFRLFlBQUs7SUFDbkMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQ2xELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLE1BQU0sWUFBWSxHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBQ3BDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSwyQkFBUSxFQUFFLENBQUM7UUFFN0MsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSwyQkFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELE1BQU0saUJBQWlCLEdBQUcsSUFBSSwyQkFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sWUFBWSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDcEQsVUFBVSxFQUFFLGlCQUFpQjtTQUM5QixDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNqRCxZQUFZLEVBQUUsYUFBYTtZQUMzQixxQkFBcUI7WUFDckIsWUFBWSxFQUFFLElBQUksNkNBQWtCLENBQUM7Z0JBQ25DLFVBQVUsRUFBRSxRQUFRO2dCQUNwQixNQUFNLEVBQUUsWUFBWTtnQkFDcEIsVUFBVSxFQUFFLGtCQUFXLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQztnQkFDdEQsS0FBSyxFQUFFLGFB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O2FBQ0wsbUJBQW1CLENBQ2xCLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRTtZQUN6QyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUU7U0FDdEQsQ0FBQyxDQUNIO2FBQ0EsVUFBVSxDQUNULElBQUkseUNBQWMsQ0FBQztZQUNqQixVQUFVLEVBQUUsZUFBZTtZQUMzQixLQUFLLEVBQUUsaUJBQWlCO1lBQ3hCLE1BQU0sRUFBRSxRQUFRO1lBQ2hCLFlBQVksRUFBRTtnQkFDWix1Q0FBWSxDQUFDLFNBQVMsRUFBRTtnQkFDeEIsdUNBQVksQ0FBQyxNQUFNLENBQUMsZUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN0QztZQUNELFFBQVEsRUFBRSxDQUFDO1NBQ1osQ0FBQyxFQUNGLElBQUkseUNBQWMsQ0FBQztZQUNqQixVQUFVLEVBQUUsYUFBYTtZQUN6QixLQUFLLEVBQUUsZUFBZTtZQUN0QixNQUFNLEVBQUUsUUFBUTtZQUNoQixZQUFZLEVBQUUsQ0FBQyx1Q0FBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3RDLFFBQVEsRUFBRSxDQUFDO1NBQ1osQ0FBQyxDQUNILENBQUM7SUFDTixDQUFDO0NBQ0Y7QUFuTEQsZ0NBbUxDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwLCBEdXJhdGlvbiwgU2VjcmV0VmFsdWUsIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSBcIkBhd3MtY2RrL2NvcmVcIjtcbmltcG9ydCB7IENka1BpcGVsaW5lLCBTaW1wbGVTeW50aEFjdGlvbiB9IGZyb20gXCJAYXdzLWNkay9waXBlbGluZXNcIjtcbmltcG9ydCB7IExhbWJkYVN0YWdlIH0gZnJvbSBcIi4vbGFtYmRhLXN0YWdlXCI7XG5pbXBvcnQge1xuICBCdWlsZFNwZWMsXG4gIExpbnV4QnVpbGRJbWFnZSxcbiAgUGlwZWxpbmVQcm9qZWN0LFxufSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVidWlsZFwiO1xuaW1wb3J0IHsgQXJ0aWZhY3QgfSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZVwiO1xuaW1wb3J0IHtcbiAgQ2FjaGVDb250cm9sLFxuICBDb2RlQnVpbGRBY3Rpb24sXG4gIEdpdEh1YlNvdXJjZUFjdGlvbixcbiAgTWFudWFsQXBwcm92YWxBY3Rpb24sXG4gIFMzRGVwbG95QWN0aW9uLFxufSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zXCI7XG5cbmltcG9ydCB7IFJlYWN0U3RhZ2UgfSBmcm9tIFwiLi9yZWFjdC1zdGFnZVwiO1xuaW1wb3J0IHsgQnVja2V0IH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1zM1wiO1xuZXhwb3J0IGNsYXNzIFJlYWN0U3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihhcHAsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QgPSBuZXcgQXJ0aWZhY3QoKTtcblxuICAgIGNvbnN0IGJ1aWxkSHRtbE91dHB1dCA9IG5ldyBBcnRpZmFjdChcImJhc2VcIik7XG4gICAgY29uc3QgYnVpbGRTdGF0aWNPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoXCJzdGF0aWNcIik7XG4gICAgY29uc3QgYnVpbGRMYW1iZGFPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoXCJsYW1iZGFcIik7XG4gICAgY29uc3QgbGFtYmRhQnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLCBcIkxhbWJkYUJ1Y2tldFwiLCB7XG4gICAgICBidWNrZXROYW1lOiBgbGFtYmRhYnJpYW4tZGV2YCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHBpcGVsaW5lID0gbmV3IENka1BpcGVsaW5lKHRoaXMsIFwiUGlwZWxpbmVcIiwge1xuICAgICAgcGlwZWxpbmVOYW1lOiBcIkFwcFBpcGVsaW5lXCIsXG4gICAgICBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QsXG4gICAgICBzb3VyY2VBY3Rpb246IG5ldyBHaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiBcIkdpdEh1YlwiLFxuICAgICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgb2F1dGhUb2tlbjogU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoXCJnaXRodWItdG9rZW5cIiksXG4gICAgICAgIG93bmVyOiBcImJyaWFuc3VudGVyXCIsXG4gICAgICAgIHJlcG86IFwiY2RrLXJlYWN0XCIsXG4gICAgICB9KSxcbiAgICAgIHN5bnRoQWN0aW9uOiBTaW1wbGVTeW50aEFjdGlvbi5zdGFuZGFyZE5wbVN5bnRoKHtcbiAgICAgICAgc3ViZGlyZWN0b3J5OiBcImluZnJhXCIsXG4gICAgICAgIHNvdXJjZUFydGlmYWN0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdCxcbiAgICAgICAgYnVpbGRDb21tYW5kOiBcIm5wbSBydW4gYnVpbGRcIixcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2UoXCJDb21waWxlTGFtYmRhXCIpLmFkZEFjdGlvbnMoXG4gICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogXCJXZWJhcHBcIixcbiAgICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCBcIkxhbWJzYUJ1aWxkXCIsIHtcbiAgICAgICAgICBwcm9qZWN0TmFtZTogXCJSZWFjdFNhbXBsZVwiLFxuICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICAgICAgdmVyc2lvbjogXCIwLjJcIixcbiAgICAgICAgICAgIHBoYXNlczoge1xuICAgICAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IFtcImNkIGxhbWJkYVwiXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kczogW10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgICAgICAgW2J1aWxkU3RhdGljT3V0cHV0LmFydGlmYWN0TmFtZSBhcyBzdHJpbmddOiB7XG4gICAgICAgICAgICAgICAgICBcImJhc2UtZGlyZWN0b3J5XCI6IFwibGFtYmRhXCIsXG4gICAgICAgICAgICAgICAgICBmaWxlczogW1wiKlwiXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNF8wLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICBvdXRwdXRzOiBbYnVpbGRMYW1iZGFPdXRwdXRdLFxuICAgICAgfSksXG4gICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogXCJMYW1iZGEtQXNzZXRzXCIsXG4gICAgICAgICAgaW5wdXQ6IGJ1aWxkTGFtYmRhT3V0cHV0LFxuICAgICAgICAgIGJ1Y2tldDogbGFtYmRhQnVja2V0LFxuICAgICAgICAgIHJ1bk9yZGVyOiAyLFxuICAgICAgICB9KSxcbiAgICApO1xuXG4gICAgcGlwZWxpbmUuYWRkQXBwbGljYXRpb25TdGFnZShcbiAgICAgIG5ldyBMYW1iZGFTdGFnZSh0aGlzLCBcIkxhbWJkYVN0YWNrRGV2XCIsIFwiZGV2XCIsIGxhbWJkYUJ1Y2tldC5idWNrZXROYW1lLCBidWlsZExhbWJkYU91dHB1dC5vYmplY3RLZXksIHtcbiAgICAgICAgZW52OiB7IGFjY291bnQ6IFwiODQ3MTM2NjU2NjM1XCIsIHJlZ2lvbjogXCJ1cy1lYXN0LTFcIiB9LFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2UoXCJDb21waWxlXCIpLmFkZEFjdGlvbnMoXG4gICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogXCJXZWJhcHBcIixcbiAgICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCBcIkJ1aWxkXCIsIHtcbiAgICAgICAgICBwcm9qZWN0TmFtZTogXCJSZWFjdFNhbXBsZVwiLFxuICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICAgICAgdmVyc2lvbjogXCIwLjJcIixcbiAgICAgICAgICAgIHBoYXNlczoge1xuICAgICAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IFtcImNkIGZyb250ZW5kXCIsIFwibnBtIGluc3RhbGxcIl0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IFtcIm5wbSBydW4gYnVpbGRcIiwgXCJucG0gcnVuIHRlc3Q6Y2lcIl0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgICAgIFwic2Vjb25kYXJ5LWFydGlmYWN0c1wiOiB7XG4gICAgICAgICAgICAgICAgW2J1aWxkSHRtbE91dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICAgXCJiYXNlLWRpcmVjdG9yeVwiOiBcImZyb250ZW5kL2J1aWxkXCIsXG4gICAgICAgICAgICAgICAgICBmaWxlczogW1wiKlwiXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFtidWlsZFN0YXRpY091dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICAgXCJiYXNlLWRpcmVjdG9yeVwiOiBcImZyb250ZW5kL2J1aWxkXCIsXG4gICAgICAgICAgICAgICAgICBmaWxlczogW1wic3RhdGljLyoqLypcIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF80XzAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIG91dHB1dHM6IFtidWlsZFN0YXRpY091dHB1dCwgYnVpbGRIdG1sT3V0cHV0XSxcbiAgICAgIH0pXG4gICAgKTtcbiAgICBjb25zdCBkZXZCdWNrZXQgPSBCdWNrZXQuZnJvbUJ1Y2tldE5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgXCJEZXZCdWNrZXRcIixcbiAgICAgIFwicmVhY3RicmlhbnN1bnRlci1kZXZcIlxuICAgICk7XG5cbiAgICBwaXBlbGluZVxuICAgICAgLmFkZEFwcGxpY2F0aW9uU3RhZ2UoXG4gICAgICAgIG5ldyBSZWFjdFN0YWdlKHRoaXMsIFwiUmVhY3RTdGFja0RldlwiLCBcImRldlwiLCB7XG4gICAgICAgICAgZW52OiB7IGFjY291bnQ6IFwiODQ3MTM2NjU2NjM1XCIsIHJlZ2lvbjogXCJ1cy1lYXN0LTFcIiB9LFxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEFjdGlvbnMoXG4gICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogXCJTdGF0aWMtQXNzZXRzXCIsXG4gICAgICAgICAgaW5wdXQ6IGJ1aWxkU3RhdGljT3V0cHV0LFxuICAgICAgICAgIGJ1Y2tldDogZGV2QnVja2V0LFxuICAgICAgICAgIGNhY2hlQ29udHJvbDogW1xuICAgICAgICAgICAgQ2FjaGVDb250cm9sLnNldFB1YmxpYygpLFxuICAgICAgICAgICAgQ2FjaGVDb250cm9sLm1heEFnZShEdXJhdGlvbi5kYXlzKDUpKSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJ1bk9yZGVyOiAxLFxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIkhUTUwtQXNzZXRzXCIsXG4gICAgICAgICAgaW5wdXQ6IGJ1aWxkSHRtbE91dHB1dCxcbiAgICAgICAgICBidWNrZXQ6IGRldkJ1Y2tldCxcbiAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtDYWNoZUNvbnRyb2wubm9DYWNoZSgpXSxcbiAgICAgICAgICBydW5PcmRlcjogMixcbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBNYW51YWxBcHByb3ZhbEFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogYEFwcHJvdmVkZXZgLFxuICAgICAgICAgIHJ1bk9yZGVyOiAzLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIGNvbnN0IHFhQnVja2V0ID0gQnVja2V0LmZyb21CdWNrZXROYW1lKFxuICAgICAgdGhpcyxcbiAgICAgIFwiUWFCdWNrZXRcIixcbiAgICAgIFwicmVhY3RicmlhbnN1bnRlci1xYVwiXG4gICAgKTtcblxuICAgIHBpcGVsaW5lXG4gICAgICAuYWRkQXBwbGljYXRpb25TdGFnZShcbiAgICAgICAgbmV3IFJlYWN0U3RhZ2UodGhpcywgXCJSZWFjdFN0YWNrUWFcIiwgXCJxYVwiLCB7XG4gICAgICAgICAgZW52OiB7IGFjY291bnQ6IFwiODQ3MTM2NjU2NjM1XCIsIHJlZ2lvbjogXCJ1cy1lYXN0LTFcIiB9LFxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEFjdGlvbnMoXG4gICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogXCJTdGF0aWMtQXNzZXRzXCIsXG4gICAgICAgICAgaW5wdXQ6IGJ1aWxkU3RhdGljT3V0cHV0LFxuICAgICAgICAgIGJ1Y2tldDogcWFCdWNrZXQsXG4gICAgICAgICAgY2FjaGVDb250cm9sOiBbXG4gICAgICAgICAgICBDYWNoZUNvbnRyb2wuc2V0UHVibGljKCksXG4gICAgICAgICAgICBDYWNoZUNvbnRyb2wubWF4QWdlKER1cmF0aW9uLmRheXMoNSkpLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgcnVuT3JkZXI6IDEsXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IFwiSFRNTC1Bc3NldHNcIixcbiAgICAgICAgICBpbnB1dDogYnVpbGRIdG1sT3V0cHV0LFxuICAgICAgICAgIGJ1Y2tldDogcWFCdWNrZXQsXG4gICAgICAgICAgY2FjaGVDb250cm9sOiBbQ2FjaGVDb250cm9sLm5vQ2FjaGUoKV0sXG4gICAgICAgICAgcnVuT3JkZXI6IDIsXG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG59XG4iXX0=