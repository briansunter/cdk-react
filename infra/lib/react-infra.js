"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactSampleStack = void 0;
const core_1 = require("@aws-cdk/core");
const aws_s3_1 = require("@aws-cdk/aws-s3");
const pipelines_1 = require("@aws-cdk/pipelines");
const aws_cloudfront_1 = require("@aws-cdk/aws-cloudfront");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_codebuild_1 = require("@aws-cdk/aws-codebuild");
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
const aws_route53_1 = require("@aws-cdk/aws-route53");
const aws_certificatemanager_1 = require("@aws-cdk/aws-certificatemanager");
const aws_route53_targets_1 = require("@aws-cdk/aws-route53-targets");
class ReactSampleStack extends core_1.Stack {
    constructor(app, id, props) {
        super(app, id, props);
        const webappBucket = new aws_s3_1.Bucket(this, 'ReactBucket', {
            bucketName: 'react.briansunter.com',
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
            publicReadAccess: true
        });
        const cloudFrontOAI = new aws_cloudfront_1.OriginAccessIdentity(this, 'OAI', {
            comment: 'OAI for react sample webapp.',
        });
        const cloudfrontS3Access = new aws_iam_1.PolicyStatement();
        cloudfrontS3Access.addActions('s3:GetBucket*');
        cloudfrontS3Access.addActions('s3:GetObject*');
        cloudfrontS3Access.addActions('s3:List*');
        cloudfrontS3Access.addResources(webappBucket.bucketArn);
        cloudfrontS3Access.addResources(`${webappBucket.bucketArn}/*`);
        cloudfrontS3Access.addCanonicalUserPrincipal(cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId);
        webappBucket.addToResourcePolicy(cloudfrontS3Access);
        const hostedZone = aws_route53_1.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: 'briansunter.com',
            privateZone: false
        });
        const certificate = new aws_certificatemanager_1.Certificate(this, 'Certificate', {
            domainName: 'react.briansunter.com',
            validation: aws_certificatemanager_1.CertificateValidation.fromDns(hostedZone),
        });
        // const distribution = new CloudFrontWebDistribution(this, 'Cloudfront', {
        //   originConfigs: [
        //     {
        //       s3OriginSource: {
        //         s3BucketSource: webappBucket,
        //         originAccessIdentity: cloudFrontOAI
        //       },
        //       behaviors: [
        //         {isDefaultBehavior: true}
        //       ]
        //     }
        //   ],
        //   errorConfigurations: [
        //     {
        //       errorCode: 404,
        //       responseCode: 200,
        //       responsePagePath: '/index.html',
        //       errorCachingMinTtl: 0
        //     }
        //   ],
        //   priceClass: PriceClass.PRICE_CLASS_100,
        //   aliasConfiguration: {
        //     acmCertRef: certificate.certificateArn,
        //     names: ['react.briansunter.com']
        //   }
        // });
        const distribution = new aws_cloudfront_1.CloudFrontWebDistribution(this, 'SiteDistribution', {
            aliasConfiguration: {
                acmCertRef: certificate.certificateArn,
                names: ['react.briansunter.com'],
                sslMethod: aws_cloudfront_1.SSLMethod.SNI,
                securityPolicy: aws_cloudfront_1.SecurityPolicyProtocol.TLS_V1_1_2016,
            },
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: webappBucket.bucketWebsiteDomainName,
                        originProtocolPolicy: aws_cloudfront_1.OriginProtocolPolicy.HTTP_ONLY,
                    },
                    behaviors: [{ isDefaultBehavior: true }],
                }
            ]
        });
        new aws_route53_1.ARecord(this, 'Alias', {
            zone: hostedZone,
            recordName: 'react',
            target: aws_route53_1.RecordTarget.fromAlias(new aws_route53_targets_1.CloudFrontTarget(distribution))
        });
        const sourceOutput = new aws_codepipeline_1.Artifact();
        const buildHtmlOutput = new aws_codepipeline_1.Artifact('base');
        const buildStaticOutput = new aws_codepipeline_1.Artifact('static');
        const cloudAssemblyArtifact = new aws_codepipeline_1.Artifact();
        const pipeline = new pipelines_1.CdkPipeline(this, 'Pipeline', {
            // The pipeline name
            pipelineName: 'MyStaticPipeline',
            cloudAssemblyArtifact,
            // Where the source can be found
            sourceAction: new aws_codepipeline_actions_1.GitHubSourceAction({
                actionName: 'GitHub',
                output: sourceOutput,
                oauthToken: core_1.SecretValue.secretsManager('github-token'),
                owner: 'briansunter',
                repo: 'cdk-react',
            }),
            // How it will be built and synthesized
            synthAction: pipelines_1.SimpleSynthAction.standardNpmSynth({
                subdirectory: 'infra',
                sourceArtifact: sourceOutput,
                cloudAssemblyArtifact,
                // We need a build step to compile the TypeScript Lambda
                buildCommand: 'npm run build'
            }),
        });
        pipeline.addStage("Compile").addActions(new aws_codepipeline_actions_1.CodeBuildAction({
            actionName: 'Webapp',
            project: new aws_codebuild_1.PipelineProject(this, 'Build', {
                projectName: 'ReactSample',
                buildSpec: aws_codebuild_1.BuildSpec.fromObject({
                    version: '0.2',
                    phases: {
                        install: {
                            commands: [
                                'cd frontend',
                                'npm install'
                            ]
                        },
                        build: {
                            commands: 'npm run build'
                        }
                    },
                    artifacts: {
                        'secondary-artifacts': {
                            [buildHtmlOutput.artifactName]: {
                                'base-directory': 'frontend/build',
                                files: [
                                    '*'
                                ]
                            },
                            [buildStaticOutput.artifactName]: {
                                'base-directory': 'frontend/build',
                                files: [
                                    'static/**/*'
                                ]
                            }
                        }
                    }
                }),
                environment: {
                    buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_4_0,
                }
            }),
            input: sourceOutput,
            outputs: [buildStaticOutput, buildHtmlOutput]
        }));
        pipeline.addStage("Deploy").addActions(new aws_codepipeline_actions_1.S3DeployAction({
            actionName: 'Static-Assets',
            input: buildStaticOutput,
            bucket: webappBucket,
            cacheControl: [aws_codepipeline_actions_1.CacheControl.setPublic(), aws_codepipeline_actions_1.CacheControl.maxAge(core_1.Duration.days(5))],
            runOrder: 1
        }), new aws_codepipeline_actions_1.S3DeployAction({
            actionName: 'HTML-Assets',
            input: buildHtmlOutput,
            bucket: webappBucket,
            cacheControl: [aws_codepipeline_actions_1.CacheControl.noCache()],
            runOrder: 2
        }));
    }
}
exports.ReactSampleStack = ReactSampleStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBNEU7QUFDNUUsNENBQXVDO0FBQ3ZDLGtEQUFvRTtBQUNwRSw0REFBNEo7QUFDNUosOENBQWlEO0FBQ2pELDBEQUFtRjtBQUNuRixnRUFBNkQ7QUFDN0QsZ0ZBTTJDO0FBQzNDLHNEQUF1RTtBQUN2RSw0RUFBbUY7QUFFbkYsc0VBQThEO0FBRTlELE1BQWEsZ0JBQWlCLFNBQVEsWUFBSztJQUV6QyxZQUFZLEdBQVEsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDbEQsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFdEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNuRCxVQUFVLEVBQUUsdUJBQXVCO1lBQ25DLG9CQUFvQixFQUFFLFlBQVk7WUFDbEMsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxnQkFBZ0IsRUFBRSxJQUFJO1NBQ3ZCLENBQUMsQ0FBQztRQUVILE1BQU0sYUFBYSxHQUFHLElBQUkscUNBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUMxRCxPQUFPLEVBQUUsOEJBQThCO1NBQ3hDLENBQUMsQ0FBQztRQUVILE1BQU0sa0JBQWtCLEdBQUcsSUFBSSx5QkFBZSxFQUFFLENBQUM7UUFDakQsa0JBQWtCLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQy9DLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUMvQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4RCxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxZQUFZLENBQUMsU0FBUyxJ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UUFDSCxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFVBQVUsQ0FDOUIsSUFBSSx5Q0FBYyxDQUFDO1lBQ2pCLFVBQVUsRUFBRSxlQUFlO1lBQzNCLEtBQUssRUFBRSxpQkFBaUI7WUFDeEIsTUFBTSxFQUFFLFlBQVk7WUFDcEIsWUFBWSxFQUFFLENBQUMsdUNBQVksQ0FBQyxTQUFTLEVBQUUsRUFBRSx1Q0FBWSxDQUFDLE1BQU0sQ0FBQyxlQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0UsUUFBUSxFQUFFLENBQUM7U0FDWixDQUFDLEVBQ0YsSUFBSSx5Q0FBYyxDQUFDO1lBQ2pCLFVBQVUsRUFBRSxhQUFhO1lBQ3pCLEtBQUssRUFBRSxlQUFlO1lBQ3RCLE1BQU0sRUFBRSxZQUFZO1lBQ3BCLFlBQVksRUFBRSxDQUFDLHVDQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEMsUUFBUSxFQUFFLENBQUM7U0FDWixDQUFDLENBQUMsQ0FBQztJQUNkLENBQUM7Q0FDRjtBQTlLRCw0Q0E4S0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0FwcCwgRHVyYXRpb24sIFNlY3JldFZhbHVlLCBTdGFjaywgU3RhY2tQcm9wc30gZnJvbSBcIkBhd3MtY2RrL2NvcmVcIjtcbmltcG9ydCB7QnVja2V0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLXMzXCI7XG5pbXBvcnQgeyBDZGtQaXBlbGluZSwgU2ltcGxlU3ludGhBY3Rpb24gfSBmcm9tIFwiQGF3cy1jZGsvcGlwZWxpbmVzXCI7XG5pbXBvcnQge1NlY3VyaXR5UG9saWN5UHJvdG9jb2wsIE9yaWdpblByb3RvY29sUG9saWN5LFNTTE1ldGhvZCwgIENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24sIE9yaWdpbkFjY2Vzc0lkZW50aXR5LCBQcmljZUNsYXNzfSBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWRmcm9udCdcbmltcG9ydCB7UG9saWN5U3RhdGVtZW50fSBmcm9tIFwiQGF3cy1jZGsvYXdzLWlhbVwiO1xuaW1wb3J0IHtCdWlsZFNwZWMsIExpbnV4QnVpbGRJbWFnZSwgUGlwZWxpbmVQcm9qZWN0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVidWlsZFwiO1xuaW1wb3J0IHtBcnRpZmFjdCwgUGlwZWxpbmV9IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lXCI7XG5pbXBvcnQge1xuICBDYWNoZUNvbnRyb2wsXG4gIENvZGVCdWlsZEFjdGlvbixcbiAgR2l0SHViU291cmNlQWN0aW9uLFxuICBHaXRIdWJUcmlnZ2VyLFxuICBTM0RlcGxveUFjdGlvblxufSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zXCI7XG5pbXBvcnQge0FSZWNvcmQsIEhvc3RlZFpvbmUsIFJlY29yZFRhcmdldH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1yb3V0ZTUzXCI7XG5pbXBvcnQge0NlcnRpZmljYXRlLCBDZXJ0aWZpY2F0ZVZhbGlkYXRpb259IGZyb20gJ0Bhd3MtY2RrL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuXG5pbXBvcnQge0Nsb3VkRnJvbnRUYXJnZXR9IGZyb20gXCJAYXdzLWNkay9hd3Mtcm91dGU1My10YXJnZXRzXCI7XG5cbmV4cG9ydCBjbGFzcyBSZWFjdFNhbXBsZVN0YWNrIGV4dGVuZHMgU3RhY2sge1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihhcHAsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB3ZWJhcHBCdWNrZXQgPSBuZXcgQnVja2V0KHRoaXMsICdSZWFjdEJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6ICdyZWFjdC5icmlhbnN1bnRlci5jb20nLFxuICAgICAgd2Vic2l0ZUluZGV4RG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcbiAgICAgIHdlYnNpdGVFcnJvckRvY3VtZW50OiAnZXJyb3IuaHRtbCcsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiB0cnVlXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbG91ZEZyb250T0FJID0gbmV3IE9yaWdpbkFjY2Vzc0lkZW50aXR5KHRoaXMsICdPQUknLCB7XG4gICAgICBjb21tZW50OiAnT0FJIGZvciByZWFjdCBzYW1wbGUgd2ViYXBwLicsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbG91ZGZyb250UzNBY2Nlc3MgPSBuZXcgUG9saWN5U3RhdGVtZW50KCk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZEFjdGlvbnMoJ3MzOkdldEJ1Y2tldConKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkQWN0aW9ucygnczM6R2V0T2JqZWN0KicpO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRBY3Rpb25zKCdzMzpMaXN0KicpO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRSZXNvdXJjZXMod2ViYXBwQnVja2V0LmJ1Y2tldEFybik7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZFJlc291cmNlcyhgJHt3ZWJhcHBCdWNrZXQuYnVja2V0QXJufS8qYCk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZENhbm9uaWNhbFVzZXJQcmluY2lwYWwoXG4gICAgICBjbG91ZEZyb250T0FJLmNsb3VkRnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eVMzQ2Fub25pY2FsVXNlcklkXG4gICAgKTtcblxuICAgIHdlYmFwcEJ1Y2tldC5hZGRUb1Jlc291cmNlUG9saWN5KGNsb3VkZnJvbnRTM0FjY2Vzcyk7XG5cbiAgICBjb25zdCBob3N0ZWRab25lID0gSG9zdGVkWm9uZS5mcm9tTG9va3VwKHRoaXMsICdIb3N0ZWRab25lJywge1xuICAgICAgZG9tYWluTmFtZTogJ2JyaWFuc3VudGVyLmNvbScsXG4gICAgICBwcml2YXRlWm9uZTogZmFsc2VcbiAgICB9KTtcblxuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gbmV3IENlcnRpZmljYXRlKHRoaXMsICdDZXJ0aWZpY2F0ZScsIHtcbiAgICAgIGRvbWFpbk5hbWU6ICdyZWFjdC5icmlhbnN1bnRlci5jb20nLFxuICAgICAgdmFsaWRhdGlvbjogQ2VydGlmaWNhdGVWYWxpZGF0aW9uLmZyb21EbnMoaG9zdGVkWm9uZSksXG4gICAgfSk7XG5cbiAgICAvLyBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbih0aGlzLCAnQ2xvdWRmcm9udCcsIHtcbiAgICAvLyAgIG9yaWdpbkNvbmZpZ3M6IFtcbiAgICAvLyAgICAge1xuICAgIC8vICAgICAgIHMzT3JpZ2luU291cmNlOiB7XG4gICAgLy8gICAgICAgICBzM0J1Y2tldFNvdXJjZTogd2ViYXBwQnVja2V0LFxuICAgIC8vICAgICAgICAgb3JpZ2luQWNjZXNzSWRlbnRpdHk6IGNsb3VkRnJvbnRPQUlcbiAgICAvLyAgICAgICB9LFxuICAgIC8vICAgICAgIGJlaGF2aW9yczogW1xuICAgIC8vICAgICAgICAge2lzRGVmYXVsdEJlaGF2aW9yOiB0cnVlfVxuICAgIC8vICAgICAgIF1cbiAgICAvLyAgICAgfVxuICAgIC8vICAgXSxcbiAgICAvLyAgIGVycm9yQ29uZmlndXJhdGlvbnM6IFtcbiAgICAvLyAgICAge1xuICAgIC8vICAgICAgIGVycm9yQ29kZTogNDA0LFxuICAgIC8vICAgICAgIHJlc3BvbnNlQ29kZTogMjAwLFxuICAgIC8vICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvaW5kZXguaHRtbCcsXG4gICAgLy8gICAgICAgZXJyb3JDYWNoaW5nTWluVHRsOiAwXG4gICAgLy8gICAgIH1cbiAgICAvLyAgIF0sXG4gICAgLy8gICBwcmljZUNsYXNzOiBQcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCxcbiAgICAvLyAgIGFsaWFzQ29uZmlndXJhdGlvbjoge1xuICAgIC8vICAgICBhY21DZXJ0UmVmOiBjZXJ0aWZpY2F0ZS5jZXJ0aWZpY2F0ZUFybixcbiAgICAvLyAgICAgbmFtZXM6IFsncmVhY3QuYnJpYW5zdW50ZXIuY29tJ11cbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbih0aGlzLCAnU2l0ZURpc3RyaWJ1dGlvbicsIHtcbiAgICAgIGFsaWFzQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIGFjbUNlcnRSZWY6IGNlcnRpZmljYXRlLmNlcnRpZmljYXRlQXJuLFxuICAgICAgICAgIG5hbWVzOiBbICdyZWFjdC5icmlhbnN1bnRlci5jb20nXSxcbiAgICAgICAgICBzc2xNZXRob2Q6IFNTTE1ldGhvZC5TTkksXG4gICAgICAgICAgc2VjdXJpdHlQb2xpY3k6IFNlY3VyaXR5UG9saWN5UHJvdG9jb2wuVExTX1YxXzFfMjAxNixcbiAgICAgIH0sXG4gICAgICBvcmlnaW5Db25maWdzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgICBjdXN0b21PcmlnaW5Tb3VyY2U6IHtcbiAgICAgICAgICAgICAgICAgIGRvbWFpbk5hbWU6IHdlYmFwcEJ1Y2tldC5idWNrZXRXZWJzaXRlRG9tYWluTmFtZSxcbiAgICAgICAgICAgICAgICAgIG9yaWdpblByb3RvY29sUG9saWN5OiBPcmlnaW5Qcm90b2NvbFBvbGljeS5IVFRQX09OTFksXG4gICAgICAgICAgICAgIH0sICAgICAgICAgIFxuICAgICAgICAgICAgICBiZWhhdmlvcnMgOiBbIHtpc0RlZmF1bHRCZWhhdmlvcjogdHJ1ZX1dLFxuICAgICAgICAgIH1cbiAgICAgIF1cbiAgfSk7XG4gICAgbmV3IEFSZWNvcmQodGhpcywgJ0FsaWFzJywge1xuICAgICAgem9uZTogaG9zdGVkWm9uZSxcbiAgICAgIHJlY29yZE5hbWU6ICdyZWFjdCcsXG4gICAgICB0YXJnZXQ6IFJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IENsb3VkRnJvbnRUYXJnZXQoZGlzdHJpYnV0aW9uKSlcbiAgICB9KTtcblxuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBBcnRpZmFjdCgpO1xuICAgIGNvbnN0IGJ1aWxkSHRtbE91dHB1dCA9IG5ldyBBcnRpZmFjdCgnYmFzZScpO1xuICAgIGNvbnN0IGJ1aWxkU3RhdGljT3V0cHV0ID0gbmV3IEFydGlmYWN0KCdzdGF0aWMnKTtcbiAgICBjb25zdCBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QgPSBuZXcgQXJ0aWZhY3QoKTtcblxuXG4gICAgY29uc3QgcGlwZWxpbmUgPSBuZXcgQ2RrUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgLy8gVGhlIHBpcGVsaW5lIG5hbWVcbiAgICAgIHBpcGVsaW5lTmFtZTogJ015U3RhdGljUGlwZWxpbmUnLFxuICAgICAgY2xvdWRBc3NlbWJseUFydGlmYWN0LFxuXG4gICAgICAvLyBXaGVyZSB0aGUgc291cmNlIGNhbiBiZSBmb3VuZFxuICAgICAgc291cmNlQWN0aW9uOiBuZXcgR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogJ0dpdEh1YicsXG4gICAgICAgIG91dHB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICBvYXV0aFRva2VuOiBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignZ2l0aHViLXRva2VuJyksXG4gICAgICAgIG93bmVyOiAnYnJpYW5zdW50ZXInLFxuICAgICAgICByZXBvOiAnY2RrLXJlYWN0JyxcbiAgICAgIH0pLFxuXG4gICAgICAgLy8gSG93IGl0IHdpbGwgYmUgYnVpbHQgYW5kIHN5bnRoZXNpemVkXG4gICAgICAgc3ludGhBY3Rpb246IFNpbXBsZVN5bnRoQWN0aW9uLnN0YW5kYXJkTnBtU3ludGgoe1xuICAgICAgICBzdWJkaXJlY3Rvcnk6ICdpbmZyYScsXG4gICAgICAgICBzb3VyY2VBcnRpZmFjdDogc291cmNlT3V0cHV0LFxuICAgICAgICAgY2xvdWRBc3NlbWJseUFydGlmYWN0LFxuICAgICAgICAgXG4gICAgICAgICAvLyBXZSBuZWVkIGEgYnVpbGQgc3RlcCB0byBjb21waWxlIHRoZSBUeXBlU2NyaXB0IExhbWJkYVxuICAgICAgICAgYnVpbGRDb21tYW5kOiAnbnBtIHJ1biBidWlsZCdcbiAgICAgICB9KSxcbiAgICB9KTtcbiAgICBwaXBlbGluZS5hZGRTdGFnZShcIkNvbXBpbGVcIikuYWRkQWN0aW9ucyhuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdXZWJhcHAnLFxuICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCAnQnVpbGQnLCB7XG4gICAgICAgIHByb2plY3ROYW1lOiAnUmVhY3RTYW1wbGUnLFxuICAgICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICAgIGluc3RhbGw6IHtcbiAgICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgICAnY2QgZnJvbnRlbmQnLFxuICAgICAgICAgICAgICAgICducG0gaW5zdGFsbCdcbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICAgIGNvbW1hbmRzOiAnbnBtIHJ1biBidWlsZCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgICAgJ3NlY29uZGFyeS1hcnRpZmFjdHMnOiB7XG4gICAgICAgICAgICAgIFtidWlsZEh0bWxPdXRwdXQuYXJ0aWZhY3ROYW1lIGFzIHN0cmluZ106IHtcbiAgICAgICAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnZnJvbnRlbmQvYnVpbGQnLFxuICAgICAgICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAgICAgICAnKidcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIFtidWlsZFN0YXRpY091dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICdiYXNlLWRpcmVjdG9yeSc6ICdmcm9udGVuZC9idWlsZCcsXG4gICAgICAgICAgICAgICAgZmlsZXM6IFtcbiAgICAgICAgICAgICAgICAgICdzdGF0aWMvKiovKidcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF80XzAsXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgIG91dHB1dHM6IFtidWlsZFN0YXRpY091dHB1dCwgYnVpbGRIdG1sT3V0cHV0XVxuICAgIH0pKVxuICAgIHBpcGVsaW5lLmFkZFN0YWdlKFwiRGVwbG95XCIpLmFkZEFjdGlvbnMoXG4gICAgICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgICAgICBhY3Rpb25OYW1lOiAnU3RhdGljLUFzc2V0cycsXG4gICAgICAgICAgICAgIGlucHV0OiBidWlsZFN0YXRpY091dHB1dCxcbiAgICAgICAgICAgICAgYnVja2V0OiB3ZWJhcHBCdWNrZXQsXG4gICAgICAgICAgICAgIGNhY2hlQ29udHJvbDogW0NhY2hlQ29udHJvbC5zZXRQdWJsaWMoKSwgQ2FjaGVDb250cm9sLm1heEFnZShEdXJhdGlvbi5kYXlzKDUpKV0sXG4gICAgICAgICAgICAgIHJ1bk9yZGVyOiAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgICAgIGFjdGlvbk5hbWU6ICdIVE1MLUFzc2V0cycsXG4gICAgICAgICAgICAgIGlucHV0OiBidWlsZEh0bWxPdXRwdXQsXG4gICAgICAgICAgICAgIGJ1Y2tldDogd2ViYXBwQnVja2V0LFxuICAgICAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtDYWNoZUNvbnRyb2wubm9DYWNoZSgpXSxcbiAgICAgICAgICAgICAgcnVuT3JkZXI6IDJcbiAgICAgICAgICAgIH0pKTtcbiAgfVxufVxuIl19