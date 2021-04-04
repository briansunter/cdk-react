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
        pipeline.addApplicationStage(new lambda_stage_1.LambdaStage(this, "LambdaStackDev", "dev", {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBOEU7QUFDOUUsa0RBQW9FO0FBQ3BFLGlEQUE2QztBQUM3QywwREFJZ0M7QUFDaEMsZ0VBQXFEO0FBQ3JELGdGQU0yQztBQUUzQywrQ0FBMkM7QUFDM0MsNENBQXlDO0FBQ3pDLE1BQWEsVUFBVyxTQUFRLFlBQUs7SUFDbkMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQ2xELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLE1BQU0sWUFBWSxHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBQ3BDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSwyQkFBUSxFQUFFLENBQUM7UUFFN0MsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSwyQkFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRWpELE1BQU0sUUFBUSxHQUFHLElBQUksdUJBQVcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQ2pELFlBQVksRUFBRSxhQUFhO1lBQzNCLHFCQUFxQjtZQUNyQixZQUFZLEVBQUUsSUFBSSw2Q0FBa0IsQ0FBQztnQkFDbkMsVUFBVSxFQUFFLFFBQVE7Z0JBQ3BCLE1BQU0sRUFBRSxZQUFZO2dCQUNwQixVQUFVLEVBQUUsa0JBQVcsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDO2dCQUN0RCxLQUFLLEVBQUUsYUFBYTtnQkFDcEIsSUFBSSxFQUFFLFdBQVc7YUFDbEIsQ0FBQztZQUNGLFdBQVcsRUFBRSw2QkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDOUMsWUFBWSxFQUFFLE9BQU87Z0JBQ3JCLGNBQWMsRUFBRSxZQUFZO2dCQUM1QixxQkFBcUI7Z0JBQ3JCLFlBQVksRUFB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UUFFRixRQUFRO2FBQ0wsbUJBQW1CLENBQ2xCLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRTtZQUN6QyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUU7U0FDdEQsQ0FBQyxDQUNIO2FBQ0EsVUFBVSxDQUNULElBQUkseUNBQWMsQ0FBQztZQUNqQixVQUFVLEVBQUUsZUFBZTtZQUMzQixLQUFLLEVBQUUsaUJBQWlCO1lBQ3hCLE1BQU0sRUFBRSxRQUFRO1lBQ2hCLFFBQVEsRUFBRSxDQUFDO1lBQ1gsWUFBWSxFQUFFO2dCQUNaLHVDQUFZLENBQUMsU0FBUyxFQUFFO2dCQUN4Qix1Q0FBWSxDQUFDLE1BQU0sQ0FBQyxlQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3RDO1NBQ0YsQ0FBQyxFQUNGLElBQUkseUNBQWMsQ0FBQztZQUNqQixVQUFVLEVBQUUsYUFBYTtZQUN6QixRQUFRLEVBQUUsQ0FBQztZQUNYLEtBQUssRUFBRSxlQUFlO1lBQ3RCLE1BQU0sRUFBRSxRQUFRO1lBQ2hCLFlBQVksRUFBRSxDQUFDLHVDQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDdkMsQ0FBQyxDQUNILENBQUM7SUFDTixDQUFDO0NBQ0Y7QUEzSUQsZ0NBMklDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwLCBEdXJhdGlvbiwgU2VjcmV0VmFsdWUsIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSBcIkBhd3MtY2RrL2NvcmVcIjtcbmltcG9ydCB7IENka1BpcGVsaW5lLCBTaW1wbGVTeW50aEFjdGlvbiB9IGZyb20gXCJAYXdzLWNkay9waXBlbGluZXNcIjtcbmltcG9ydCB7IExhbWJkYVN0YWdlIH0gZnJvbSBcIi4vbGFtYmRhLXN0YWdlXCI7XG5pbXBvcnQge1xuICBCdWlsZFNwZWMsXG4gIExpbnV4QnVpbGRJbWFnZSxcbiAgUGlwZWxpbmVQcm9qZWN0LFxufSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVidWlsZFwiO1xuaW1wb3J0IHsgQXJ0aWZhY3QgfSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZVwiO1xuaW1wb3J0IHtcbiAgQ2FjaGVDb250cm9sLFxuICBDb2RlQnVpbGRBY3Rpb24sXG4gIEdpdEh1YlNvdXJjZUFjdGlvbixcbiAgTWFudWFsQXBwcm92YWxBY3Rpb24sXG4gIFMzRGVwbG95QWN0aW9uLFxufSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zXCI7XG5cbmltcG9ydCB7IFJlYWN0U3RhZ2UgfSBmcm9tIFwiLi9yZWFjdC1zdGFnZVwiO1xuaW1wb3J0IHsgQnVja2V0IH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1zM1wiO1xuZXhwb3J0IGNsYXNzIFJlYWN0U3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihhcHAsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QgPSBuZXcgQXJ0aWZhY3QoKTtcblxuICAgIGNvbnN0IGJ1aWxkSHRtbE91dHB1dCA9IG5ldyBBcnRpZmFjdChcImJhc2VcIik7XG4gICAgY29uc3QgYnVpbGRTdGF0aWNPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoXCJzdGF0aWNcIik7XG5cbiAgICBjb25zdCBwaXBlbGluZSA9IG5ldyBDZGtQaXBlbGluZSh0aGlzLCBcIlBpcGVsaW5lXCIsIHtcbiAgICAgIHBpcGVsaW5lTmFtZTogXCJBcHBQaXBlbGluZVwiLFxuICAgICAgY2xvdWRBc3NlbWJseUFydGlmYWN0LFxuICAgICAgc291cmNlQWN0aW9uOiBuZXcgR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogXCJHaXRIdWJcIixcbiAgICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIG9hdXRoVG9rZW46IFNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKFwiZ2l0aHViLXRva2VuXCIpLFxuICAgICAgICBvd25lcjogXCJicmlhbnN1bnRlclwiLFxuICAgICAgICByZXBvOiBcImNkay1yZWFjdFwiLFxuICAgICAgfSksXG4gICAgICBzeW50aEFjdGlvbjogU2ltcGxlU3ludGhBY3Rpb24uc3RhbmRhcmROcG1TeW50aCh7XG4gICAgICAgIHN1YmRpcmVjdG9yeTogXCJpbmZyYVwiLFxuICAgICAgICBzb3VyY2VBcnRpZmFjdDogc291cmNlT3V0cHV0LFxuICAgICAgICBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QsXG4gICAgICAgIGJ1aWxkQ29tbWFuZDogXCJucG0gcnVuIGJ1aWxkXCIsXG4gICAgICB9KSxcbiAgICB9KTtcblxuXG4gICAgcGlwZWxpbmUuYWRkQXBwbGljYXRpb25TdGFnZShcbiAgICAgIG5ldyBMYW1iZGFTdGFnZSh0aGlzLCBcIkxhbWJkYVN0YWNrRGV2XCIsIFwiZGV2XCIsIHtcbiAgICAgICAgZW52OiB7IGFjY291bnQ6IFwiODQ3MTM2NjU2NjM1XCIsIHJlZ2lvbjogXCJ1cy1lYXN0LTFcIiB9LFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2UoXCJDb21waWxlXCIpLmFkZEFjdGlvbnMoXG4gICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogXCJXZWJhcHBcIixcbiAgICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCBcIkJ1aWxkXCIsIHtcbiAgICAgICAgICBwcm9qZWN0TmFtZTogXCJSZWFjdFNhbXBsZVwiLFxuICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICAgICAgdmVyc2lvbjogXCIwLjJcIixcbiAgICAgICAgICAgIHBoYXNlczoge1xuICAgICAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IFtcImNkIGZyb250ZW5kXCIsIFwibnBtIGluc3RhbGxcIl0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IFtcIm5wbSBydW4gYnVpbGRcIiwgXCJucG0gcnVuIHRlc3Q6Y2lcIl0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgICAgIFwic2Vjb25kYXJ5LWFydGlmYWN0c1wiOiB7XG4gICAgICAgICAgICAgICAgW2J1aWxkSHRtbE91dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICAgXCJiYXNlLWRpcmVjdG9yeVwiOiBcImZyb250ZW5kL2J1aWxkXCIsXG4gICAgICAgICAgICAgICAgICBmaWxlczogW1wiKlwiXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFtidWlsZFN0YXRpY091dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICAgXCJiYXNlLWRpcmVjdG9yeVwiOiBcImZyb250ZW5kL2J1aWxkXCIsXG4gICAgICAgICAgICAgICAgICBmaWxlczogW1wic3RhdGljLyoqLypcIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF80XzAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIG91dHB1dHM6IFtidWlsZFN0YXRpY091dHB1dCwgYnVpbGRIdG1sT3V0cHV0XSxcbiAgICAgIH0pXG4gICAgKTtcbiAgICBjb25zdCBkZXZCdWNrZXQgPSBCdWNrZXQuZnJvbUJ1Y2tldE5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgXCJEZXZCdWNrZXRcIixcbiAgICAgIFwicmVhY3RicmlhbnN1bnRlci1kZXZcIlxuICAgICk7XG5cbiAgICAgICAgY29uc3QgZGV2UmVhY3RTdGFnZSA9IG5ldyBSZWFjdFN0YWdlKHRoaXMsIFwiUmVhY3RTdGFja0RldlwiLCBcImRldlwiLCB7XG4gICAgICAgICAgZW52OiB7IGFjY291bnQ6IFwiODQ3MTM2NjU2NjM1XCIsIHJlZ2lvbjogXCJ1cy1lYXN0LTFcIiB9LFxuICAgICAgICB9KVxuXG4gICAgcGlwZWxpbmVcbiAgICAgIC5hZGRBcHBsaWNhdGlvblN0YWdlKGRldlJlYWN0U3RhZ2UpXG4gICAgICAuYWRkQWN0aW9ucyhcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIlN0YXRpYy1Bc3NldHNcIixcbiAgICAgICAgICBydW5PcmRlcjogMyxcbiAgICAgICAgICBpbnB1dDogYnVpbGRTdGF0aWNPdXRwdXQsXG4gICAgICAgICAgYnVja2V0OiBkZXZCdWNrZXQsXG4gICAgICAgICAgY2FjaGVDb250cm9sOiBbXG4gICAgICAgICAgICBDYWNoZUNvbnRyb2wuc2V0UHVibGljKCksXG4gICAgICAgICAgICBDYWNoZUNvbnRyb2wubWF4QWdlKER1cmF0aW9uLmRheXMoNSkpLFxuICAgICAgICAgIF1cbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogXCJIVE1MLUFzc2V0c1wiLFxuICAgICAgICAgIGlucHV0OiBidWlsZEh0bWxPdXRwdXQsXG4gICAgICAgICAgcnVuT3JkZXI6IDQsXG4gICAgICAgICAgYnVja2V0OiBkZXZCdWNrZXQsXG4gICAgICAgICAgY2FjaGVDb250cm9sOiBbQ2FjaGVDb250cm9sLm5vQ2FjaGUoKV1cbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBNYW51YWxBcHByb3ZhbEFjdGlvbih7XG4gICAgICAgICAgcnVuT3JkZXI6IDUsXG4gICAgICAgICAgYWN0aW9uTmFtZTogYEFwcHJvdmVkZXZgXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgY29uc3QgcWFCdWNrZXQgPSBCdWNrZXQuZnJvbUJ1Y2tldE5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgXCJRYUJ1Y2tldFwiLFxuICAgICAgXCJyZWFjdGJyaWFuc3VudGVyLXFhXCJcbiAgICApO1xuXG4gICAgcGlwZWxpbmVcbiAgICAgIC5hZGRBcHBsaWNhdGlvblN0YWdlKFxuICAgICAgICBuZXcgUmVhY3RTdGFnZSh0aGlzLCBcIlJlYWN0U3RhY2tRYVwiLCBcInFhXCIsIHtcbiAgICAgICAgICBlbnY6IHsgYWNjb3VudDogXCI4NDcxMzY2NTY2MzVcIiwgcmVnaW9uOiBcInVzLWVhc3QtMVwiIH0sXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkQWN0aW9ucyhcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIlN0YXRpYy1Bc3NldHNcIixcbiAgICAgICAgICBpbnB1dDogYnVpbGRTdGF0aWNPdXRwdXQsXG4gICAgICAgICAgYnVja2V0OiBxYUJ1Y2tldCxcbiAgICAgICAgICBydW5PcmRlcjogMyxcbiAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtcbiAgICAgICAgICAgIENhY2hlQ29udHJvbC5zZXRQdWJsaWMoKSxcbiAgICAgICAgICAgIENhY2hlQ29udHJvbC5tYXhBZ2UoRHVyYXRpb24uZGF5cyg1KSksXG4gICAgICAgICAgXVxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIkhUTUwtQXNzZXRzXCIsXG4gICAgICAgICAgcnVuT3JkZXI6IDQsXG4gICAgICAgICAgaW5wdXQ6IGJ1aWxkSHRtbE91dHB1dCxcbiAgICAgICAgICBidWNrZXQ6IHFhQnVja2V0LFxuICAgICAgICAgIGNhY2hlQ29udHJvbDogW0NhY2hlQ29udHJvbC5ub0NhY2hlKCldXG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG59XG4iXX0=