"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactSampleStack = void 0;
const core_1 = require("@aws-cdk/core");
const pipelines_1 = require("@aws-cdk/pipelines");
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
// import { ReactStack } from "./react-stack";
const react_stage_1 = require("./react-stage");
class ReactSampleStack extends core_1.Stack {
    constructor(app, id, props) {
        super(app, id, props);
        const sourceOutput = new aws_codepipeline_1.Artifact();
        ;
        const cloudAssemblyArtifact = new aws_codepipeline_1.Artifact();
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
        const reactStage = new react_stage_1.ReactStage(this, "ReactStack", pipeline, sourceOutput, {
            env: { account: "847136656635", region: "us-east-1" },
        });
        pipeline.addApplicationStage(reactStage);
    }
}
exports.ReactSampleStack = ReactSampleStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBOEU7QUFDOUUsa0RBQW9FO0FBRXBFLGdFQUErRDtBQUMvRCxnRkFNMkM7QUFDM0MsOENBQThDO0FBQzlDLCtDQUEyQztBQUMzQyxNQUFhLGdCQUFpQixTQUFRLFlBQUs7SUFDekMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQ2xELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLE1BQU0sWUFBWSxHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBQ3hDLENBQUM7UUFDRyxNQUFNLHFCQUFxQixHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBSTdDLE1BQU0sUUFBUSxHQUFHLElBQUksdUJBQVcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQ2pELG9CQUFvQjtZQUNwQixZQUFZLEVBQUUsa0JBQWtCO1lBQ2hDLHFCQUFxQjtZQUVyQixnQ0FBZ0M7WUFDaEMsWUFBWSxFQUFFLElBQUksNkNBQWtCLENBQUM7Z0JBQ25DLFVBQVUsRUFBRSxRQUFRO2dCQUNwQixNQUFNLEVBQUUsWUFBWTtnQkFDcEIsVUFBVSxFQUFFLGtCQUFXLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQztnQkFDdEQsS0FBSyxFQUFFLGFBQWE7Z0JBQ3BCLElBQUksRUFBRSxXQUFXO2FBQ2xCLENBQUM7WUFFRix1Q0FBdUM7WUFDdkMsV0FBVyxFQUFFLDZCQUFpQixDQUFDLGdCQUFnQixDQUFDO2dCQUM5QyxZQUFZLEVBQUUsT0FBTztnQkFDckIsY0FBYyxFQUFFLFlBQVk7Z0JBQzVCLHFCQUFxQjtnQkFFckIsd0RBQXdEO2dCQUN4RCxZQUFZLEVBQUUsZUFBZTthQUM5QixDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBRUgsTUFBTSxVQUFVLEdBQUcsSUFBSSx3QkFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRTtZQUM1RSxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUU7U0FDdEQsQ0FBQyxDQUFDO1FBQ0gsUUFBUSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7Q0FDRjtBQXhDRCw0Q0F3Q0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIER1cmF0aW9uLCBTZWNyZXRWYWx1ZSwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tIFwiQGF3cy1jZGsvY29yZVwiO1xuaW1wb3J0IHsgQ2RrUGlwZWxpbmUsIFNpbXBsZVN5bnRoQWN0aW9uIH0gZnJvbSBcIkBhd3MtY2RrL3BpcGVsaW5lc1wiO1xuXG5pbXBvcnQgeyBBcnRpZmFjdCwgUGlwZWxpbmUgfSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZVwiO1xuaW1wb3J0IHtcbiAgQ2FjaGVDb250cm9sLFxuICBDb2RlQnVpbGRBY3Rpb24sXG4gIEdpdEh1YlNvdXJjZUFjdGlvbixcbiAgR2l0SHViVHJpZ2dlcixcbiAgUzNEZXBsb3lBY3Rpb24sXG59IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnNcIjtcbi8vIGltcG9ydCB7IFJlYWN0U3RhY2sgfSBmcm9tIFwiLi9yZWFjdC1zdGFja1wiO1xuaW1wb3J0IHsgUmVhY3RTdGFnZSB9IGZyb20gXCIuL3JlYWN0LXN0YWdlXCI7XG5leHBvcnQgY2xhc3MgUmVhY3RTYW1wbGVTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKGFwcCwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBBcnRpZmFjdCgpO1xuO1xuICAgIGNvbnN0IGNsb3VkQXNzZW1ibHlBcnRpZmFjdCA9IG5ldyBBcnRpZmFjdCgpO1xuXG5cblxuICAgIGNvbnN0IHBpcGVsaW5lID0gbmV3IENka1BpcGVsaW5lKHRoaXMsIFwiUGlwZWxpbmVcIiwge1xuICAgICAgLy8gVGhlIHBpcGVsaW5lIG5hbWVcbiAgICAgIHBpcGVsaW5lTmFtZTogXCJNeVN0YXRpY1BpcGVsaW5lXCIsXG4gICAgICBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QsXG5cbiAgICAgIC8vIFdoZXJlIHRoZSBzb3VyY2UgY2FuIGJlIGZvdW5kXG4gICAgICBzb3VyY2VBY3Rpb246IG5ldyBHaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiBcIkdpdEh1YlwiLFxuICAgICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgb2F1dGhUb2tlbjogU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoXCJnaXRodWItdG9rZW5cIiksXG4gICAgICAgIG93bmVyOiBcImJyaWFuc3VudGVyXCIsXG4gICAgICAgIHJlcG86IFwiY2RrLXJlYWN0XCIsXG4gICAgICB9KSxcblxuICAgICAgLy8gSG93IGl0IHdpbGwgYmUgYnVpbHQgYW5kIHN5bnRoZXNpemVkXG4gICAgICBzeW50aEFjdGlvbjogU2ltcGxlU3ludGhBY3Rpb24uc3RhbmRhcmROcG1TeW50aCh7XG4gICAgICAgIHN1YmRpcmVjdG9yeTogXCJpbmZyYVwiLFxuICAgICAgICBzb3VyY2VBcnRpZmFjdDogc291cmNlT3V0cHV0LFxuICAgICAgICBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QsXG5cbiAgICAgICAgLy8gV2UgbmVlZCBhIGJ1aWxkIHN0ZXAgdG8gY29tcGlsZSB0aGUgVHlwZVNjcmlwdCBMYW1iZGFcbiAgICAgICAgYnVpbGRDb21tYW5kOiBcIm5wbSBydW4gYnVpbGRcIixcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVhY3RTdGFnZSA9IG5ldyBSZWFjdFN0YWdlKHRoaXMsIFwiUmVhY3RTdGFja1wiLCBwaXBlbGluZSwgc291cmNlT3V0cHV0LCB7XG4gICAgICBlbnY6IHsgYWNjb3VudDogXCI4NDcxMzY2NTY2MzVcIiwgcmVnaW9uOiBcInVzLWVhc3QtMVwiIH0sXG4gICAgfSk7XG4gICAgcGlwZWxpbmUuYWRkQXBwbGljYXRpb25TdGFnZShyZWFjdFN0YWdlKTtcbiAgfVxufVxuIl19