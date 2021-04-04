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
                environment: {
                    privileged: true
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBOEU7QUFDOUUsa0RBQW9FO0FBQ3BFLGlEQUE2QztBQUM3QywwREFJZ0M7QUFDaEMsZ0VBQXFEO0FBQ3JELGdGQU0yQztBQUUzQywrQ0FBMkM7QUFDM0MsNENBQXlDO0FBQ3pDLE1BQWEsVUFBVyxTQUFRLFlBQUs7SUFDbkMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQ2xELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLE1BQU0sWUFBWSxHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBQ3BDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSwyQkFBUSxFQUFFLENBQUM7UUFFN0MsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSwyQkFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRWpELE1BQU0sUUFBUSxHQUFHLElBQUksdUJBQVcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQ2pELFlBQVksRUFBRSxhQUFhO1lBQzNCLHFCQUFxQjtZQUNyQixZQUFZLEVBQUUsSUFBSSw2Q0FBa0IsQ0FBQztnQkFDbkMsVUFBVSxFQUFFLFFBQVE7Z0JBQ3BCLE1BQU0sRUFBRSxZQUFZO2dCQUNwQixVQUFVLEVBQUUsa0JBQVcsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDO2dCQUN0RCxLQUFLLEVBQUUsYUFBYTtnQkFDcEIsSUFBSSxFQUFFLFdBQVc7YUFDbEIsQ0FBQztZQUNGLFdBQVcsRUFBRSw2QkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDOUMsWUFBWSxFQUFFLE9BQU87Z0JBQ3JCLGNBQWMsRUFBRSxZQUFZO2dCQUM1QixxQkFBcUI7Z0JBQ3JCLFlBQVksRUFB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Q0FDcEMsSUFBSSxFQUNKLFVBQVUsRUFDVixxQkFBcUIsQ0FDdEIsQ0FBQztRQUVGLFFBQVE7YUFDTCxtQkFBbUIsQ0FDbEIsSUFBSSx3QkFBVSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFO1lBQ3pDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtTQUN0RCxDQUFDLENBQ0g7YUFDQSxVQUFVLENBQ1QsSUFBSSx5Q0FBYyxDQUFDO1lBQ2pCLFVBQVUsRUFBRSxlQUFlO1lBQzNCLEtBQUssRUFBRSxpQkFBaUI7WUFDeEIsTUFBTSxFQUFFLFFBQVE7WUFDaEIsUUFBUSxFQUFFLENBQUM7WUFDWCxZQUFZLEVBQUU7Z0JBQ1osdUNBQVksQ0FBQyxTQUFTLEVBQUU7Z0JBQ3hCLHVDQUFZLENBQUMsTUFBTSxDQUFDLGVBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdEM7U0FDRixDQUFDLEVBQ0YsSUFBSSx5Q0FBYyxDQUFDO1lBQ2pCLFVBQVUsRUFBRSxhQUFhO1lBQ3pCLFFBQVEsRUFBRSxDQUFDO1lBQ1gsS0FBSyxFQUFFLGVBQWU7WUFDdEIsTUFBTSxFQUFFLFFBQVE7WUFDaEIsWUFBWSxFQUFFLENBQUMsdUNBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUN2QyxDQUFDLENBQ0gsQ0FBQztJQUNOLENBQUM7Q0FDRjtBQTlJRCxnQ0E4SUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIER1cmF0aW9uLCBTZWNyZXRWYWx1ZSwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tIFwiQGF3cy1jZGsvY29yZVwiO1xuaW1wb3J0IHsgQ2RrUGlwZWxpbmUsIFNpbXBsZVN5bnRoQWN0aW9uIH0gZnJvbSBcIkBhd3MtY2RrL3BpcGVsaW5lc1wiO1xuaW1wb3J0IHsgTGFtYmRhU3RhZ2UgfSBmcm9tIFwiLi9sYW1iZGEtc3RhZ2VcIjtcbmltcG9ydCB7XG4gIEJ1aWxkU3BlYyxcbiAgTGludXhCdWlsZEltYWdlLFxuICBQaXBlbGluZVByb2plY3QsXG59IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZWJ1aWxkXCI7XG5pbXBvcnQgeyBBcnRpZmFjdCB9IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lXCI7XG5pbXBvcnQge1xuICBDYWNoZUNvbnRyb2wsXG4gIENvZGVCdWlsZEFjdGlvbixcbiAgR2l0SHViU291cmNlQWN0aW9uLFxuICBNYW51YWxBcHByb3ZhbEFjdGlvbixcbiAgUzNEZXBsb3lBY3Rpb24sXG59IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnNcIjtcblxuaW1wb3J0IHsgUmVhY3RTdGFnZSB9IGZyb20gXCIuL3JlYWN0LXN0YWdlXCI7XG5pbXBvcnQgeyBCdWNrZXQgfSBmcm9tIFwiQGF3cy1jZGsvYXdzLXMzXCI7XG5leHBvcnQgY2xhc3MgUmVhY3RTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKGFwcCwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBBcnRpZmFjdCgpO1xuICAgIGNvbnN0IGNsb3VkQXNzZW1ibHlBcnRpZmFjdCA9IG5ldyBBcnRpZmFjdCgpO1xuXG4gICAgY29uc3QgYnVpbGRIdG1sT3V0cHV0ID0gbmV3IEFydGlmYWN0KFwiYmFzZVwiKTtcbiAgICBjb25zdCBidWlsZFN0YXRpY091dHB1dCA9IG5ldyBBcnRpZmFjdChcInN0YXRpY1wiKTtcblxuICAgIGNvbnN0IHBpcGVsaW5lID0gbmV3IENka1BpcGVsaW5lKHRoaXMsIFwiUGlwZWxpbmVcIiwge1xuICAgICAgcGlwZWxpbmVOYW1lOiBcIkFwcFBpcGVsaW5lXCIsXG4gICAgICBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QsXG4gICAgICBzb3VyY2VBY3Rpb246IG5ldyBHaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiBcIkdpdEh1YlwiLFxuICAgICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgb2F1dGhUb2tlbjogU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoXCJnaXRodWItdG9rZW5cIiksXG4gICAgICAgIG93bmVyOiBcImJyaWFuc3VudGVyXCIsXG4gICAgICAgIHJlcG86IFwiY2RrLXJlYWN0XCIsXG4gICAgICB9KSxcbiAgICAgIHN5bnRoQWN0aW9uOiBTaW1wbGVTeW50aEFjdGlvbi5zdGFuZGFyZE5wbVN5bnRoKHtcbiAgICAgICAgc3ViZGlyZWN0b3J5OiBcImluZnJhXCIsXG4gICAgICAgIHNvdXJjZUFydGlmYWN0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdCxcbiAgICAgICAgYnVpbGRDb21tYW5kOiBcIm5wbSBydW4gYnVpbGRcIixcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBwcml2aWxlZ2VkOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgIH0pO1xuXG5cbiAgICBwaXBlbGluZS5hZGRBcHBsaWNhdGlvblN0YWdlKFxuICAgICAgbmV3IExhbWJkYVN0YWdlKHRoaXMsIFwiTGFtYmRhU3RhY2tEZXZcIiwgXCJkZXZcIiwge1xuICAgICAgICBlbnY6IHsgYWNjb3VudDogXCI4NDcxMzY2NTY2MzVcIiwgcmVnaW9uOiBcInVzLWVhc3QtMVwiIH0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICBwaXBlbGluZS5hZGRTdGFnZShcIkNvbXBpbGVcIikuYWRkQWN0aW9ucyhcbiAgICAgIG5ldyBDb2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiBcIldlYmFwcFwiLFxuICAgICAgICBwcm9qZWN0OiBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsIFwiQnVpbGRcIiwge1xuICAgICAgICAgIHByb2plY3ROYW1lOiBcIlJlYWN0U2FtcGxlXCIsXG4gICAgICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbU9iamVjdCh7XG4gICAgICAgICAgICB2ZXJzaW9uOiBcIjAuMlwiLFxuICAgICAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgICAgIGluc3RhbGw6IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kczogW1wiY2QgZnJvbnRlbmRcIiwgXCJucG0gaW5zdGFsbFwiXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kczogW1wibnBtIHJ1biBidWlsZFwiLCBcIm5wbSBydW4gdGVzdDpjaVwiXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAgICAgXCJzZWNvbmRhcnktYXJ0aWZhY3RzXCI6IHtcbiAgICAgICAgICAgICAgICBbYnVpbGRIdG1sT3V0cHV0LmFydGlmYWN0TmFtZSBhcyBzdHJpbmddOiB7XG4gICAgICAgICAgICAgICAgICBcImJhc2UtZGlyZWN0b3J5XCI6IFwiZnJvbnRlbmQvYnVpbGRcIixcbiAgICAgICAgICAgICAgICAgIGZpbGVzOiBbXCIqXCJdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgW2J1aWxkU3RhdGljT3V0cHV0LmFydGlmYWN0TmFtZSBhcyBzdHJpbmddOiB7XG4gICAgICAgICAgICAgICAgICBcImJhc2UtZGlyZWN0b3J5XCI6IFwiZnJvbnRlbmQvYnVpbGRcIixcbiAgICAgICAgICAgICAgICAgIGZpbGVzOiBbXCJzdGF0aWMvKiovKlwiXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzRfMCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgb3V0cHV0czogW2J1aWxkU3RhdGljT3V0cHV0LCBidWlsZEh0bWxPdXRwdXRdLFxuICAgICAgfSlcbiAgICApO1xuICAgIGNvbnN0IGRldkJ1Y2tldCA9IEJ1Y2tldC5mcm9tQnVja2V0TmFtZShcbiAgICAgIHRoaXMsXG4gICAgICBcIkRldkJ1Y2tldFwiLFxuICAgICAgXCJyZWFjdGJyaWFuc3VudGVyLWRldlwiXG4gICAgKTtcblxuICAgICAgICBjb25zdCBkZXZSZWFjdFN0YWdlID0gbmV3IFJlYWN0U3RhZ2UodGhpcywgXCJSZWFjdFN0YWNrRGV2XCIsIFwiZGV2XCIsIHtcbiAgICAgICAgICBlbnY6IHsgYWNjb3VudDogXCI4NDcxMzY2NTY2MzVcIiwgcmVnaW9uOiBcInVzLWVhc3QtMVwiIH0sXG4gICAgICAgIH0pXG5cbiAgICBwaXBlbGluZVxuICAgICAgLmFkZEFwcGxpY2F0aW9uU3RhZ2UoZGV2UmVhY3RTdGFnZSlcbiAgICAgIC5hZGRBY3Rpb25zKFxuICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IFwiU3RhdGljLUFzc2V0c1wiLFxuICAgICAgICAgIHJ1bk9yZGVyOiAzLFxuICAgICAgICAgIGlucHV0OiBidWlsZFN0YXRpY091dHB1dCxcbiAgICAgICAgICBidWNrZXQ6IGRldkJ1Y2tldCxcbiAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtcbiAgICAgICAgICAgIENhY2hlQ29udHJvbC5zZXRQdWJsaWMoKSxcbiAgICAgICAgICAgIENhY2hlQ29udHJvbC5tYXhBZ2UoRHVyYXRpb24uZGF5cyg1KSksXG4gICAgICAgICAgXVxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIkhUTUwtQXNzZXRzXCIsXG4gICAgICAgICAgaW5wdXQ6IGJ1aWxkSHRtbE91dHB1dCxcbiAgICAgICAgICBydW5PcmRlcjogNCxcbiAgICAgICAgICBidWNrZXQ6IGRldkJ1Y2tldCxcbiAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtDYWNoZUNvbnRyb2wubm9DYWNoZSgpXVxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IE1hbnVhbEFwcHJvdmFsQWN0aW9uKHtcbiAgICAgICAgICBydW5PcmRlcjogNSxcbiAgICAgICAgICBhY3Rpb25OYW1lOiBgQXBwcm92ZWRldmBcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBjb25zdCBxYUJ1Y2tldCA9IEJ1Y2tldC5mcm9tQnVja2V0TmFtZShcbiAgICAgIHRoaXMsXG4gICAgICBcIlFhQnVja2V0XCIsXG4gICAgICBcInJlYWN0YnJpYW5zdW50ZXItcWFcIlxuICAgICk7XG5cbiAgICBwaXBlbGluZVxuICAgICAgLmFkZEFwcGxpY2F0aW9uU3RhZ2UoXG4gICAgICAgIG5ldyBSZWFjdFN0YWdlKHRoaXMsIFwiUmVhY3RTdGFja1FhXCIsIFwicWFcIiwge1xuICAgICAgICAgIGVudjogeyBhY2NvdW50OiBcIjg0NzEzNjY1NjYzNVwiLCByZWdpb246IFwidXMtZWFzdC0xXCIgfSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRBY3Rpb25zKFxuICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IFwiU3RhdGljLUFzc2V0c1wiLFxuICAgICAgICAgIGlucHV0OiBidWlsZFN0YXRpY091dHB1dCxcbiAgICAgICAgICBidWNrZXQ6IHFhQnVja2V0LFxuICAgICAgICAgIHJ1bk9yZGVyOiAzLFxuICAgICAgICAgIGNhY2hlQ29udHJvbDogW1xuICAgICAgICAgICAgQ2FjaGVDb250cm9sLnNldFB1YmxpYygpLFxuICAgICAgICAgICAgQ2FjaGVDb250cm9sLm1heEFnZShEdXJhdGlvbi5kYXlzKDUpKSxcbiAgICAgICAgICBdXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IFwiSFRNTC1Bc3NldHNcIixcbiAgICAgICAgICBydW5PcmRlcjogNCxcbiAgICAgICAgICBpbnB1dDogYnVpbGRIdG1sT3V0cHV0LFxuICAgICAgICAgIGJ1Y2tldDogcWFCdWNrZXQsXG4gICAgICAgICAgY2FjaGVDb250cm9sOiBbQ2FjaGVDb250cm9sLm5vQ2FjaGUoKV1cbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cbn1cbiJdfQ==