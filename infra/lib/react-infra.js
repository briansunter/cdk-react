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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBNEU7QUFDNUUsNENBQXVDO0FBQ3ZDLGtEQUFvRTtBQUNwRSw0REFBNEo7QUFDNUosOENBQWlEO0FBQ2pELDBEQUFtRjtBQUNuRixnRUFBNkQ7QUFDN0QsZ0ZBTTJDO0FBQzNDLHNEQUF1RTtBQUN2RSw0RUFBbUY7QUFFbkYsc0VBQThEO0FBRTlELE1BQWEsZ0JBQWlCLFNBQVEsWUFBSztJQUV6QyxZQUFZLEdBQVEsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDbEQsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFdEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNuRCxVQUFVLEVBQUUsdUJBQXVCO1lBQ25DLG9CQUFvQixFQUFFLFlBQVk7WUFDbEMsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxnQkFBZ0IsRUFBRSxJQUFJO1NBQ3ZCLENBQUMsQ0FBQztRQUVILE1BQU0sYUFBYSxHQUFHLElBQUkscUNBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUMxRCxPQUFPLEVBQUUsOEJBQThCO1NBQ3hDLENBQUMsQ0FBQztRQUVILE1BQU0sa0JBQWtCLEdBQUcsSUFBSSx5QkFBZSxFQUFFLENBQUM7UUFDakQsa0JBQWtCLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQy9DLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUMvQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4RCxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxZQUFZLENBQUMsU0FBUyxJ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QUMsUUFBUSxDQUFDLENBQUMsVUFBVSxDQUM5QixJQUFJLHlDQUFjLENBQUM7WUFDakIsVUFBVSxFQUFFLGVBQWU7WUFDM0IsS0FBSyxFQUFFLGlCQUFpQjtZQUN4QixNQUFNLEVBQUUsWUFBWTtZQUNwQixZQUFZLEVBQUUsQ0FBQyx1Q0FBWSxDQUFDLFNBQVMsRUFBRSxFQUFFLHVDQUFZLENBQUMsTUFBTSxDQUFDLGVBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRSxRQUFRLEVBQUUsQ0FBQztTQUNaLENBQUMsRUFDRixJQUFJLHlDQUFjLENBQUM7WUFDakIsVUFBVSxFQUFFLGFBQWE7WUFDekIsS0FBSyxFQUFFLGVBQWU7WUFDdEIsTUFBTSxFQUFFLFlBQVk7WUFDcEIsWUFBWSxFQUFFLENBQUMsdUNBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QyxRQUFRLEVBQUUsQ0FBQztTQUNaLENBQUMsQ0FBQyxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBN0tELDRDQTZLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QXBwLCBEdXJhdGlvbiwgU2VjcmV0VmFsdWUsIFN0YWNrLCBTdGFja1Byb3BzfSBmcm9tIFwiQGF3cy1jZGsvY29yZVwiO1xuaW1wb3J0IHtCdWNrZXR9IGZyb20gXCJAYXdzLWNkay9hd3MtczNcIjtcbmltcG9ydCB7IENka1BpcGVsaW5lLCBTaW1wbGVTeW50aEFjdGlvbiB9IGZyb20gXCJAYXdzLWNkay9waXBlbGluZXNcIjtcbmltcG9ydCB7U2VjdXJpdHlQb2xpY3lQcm90b2NvbCwgT3JpZ2luUHJvdG9jb2xQb2xpY3ksU1NMTWV0aG9kLCAgQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbiwgT3JpZ2luQWNjZXNzSWRlbnRpdHksIFByaWNlQ2xhc3N9IGZyb20gJ0Bhd3MtY2RrL2F3cy1jbG91ZGZyb250J1xuaW1wb3J0IHtQb2xpY3lTdGF0ZW1lbnR9IGZyb20gXCJAYXdzLWNkay9hd3MtaWFtXCI7XG5pbXBvcnQge0J1aWxkU3BlYywgTGludXhCdWlsZEltYWdlLCBQaXBlbGluZVByb2plY3R9IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZWJ1aWxkXCI7XG5pbXBvcnQge0FydGlmYWN0LCBQaXBlbGluZX0gZnJvbSBcIkBhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmVcIjtcbmltcG9ydCB7XG4gIENhY2hlQ29udHJvbCxcbiAgQ29kZUJ1aWxkQWN0aW9uLFxuICBHaXRIdWJTb3VyY2VBY3Rpb24sXG4gIEdpdEh1YlRyaWdnZXIsXG4gIFMzRGVwbG95QWN0aW9uXG59IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnNcIjtcbmltcG9ydCB7QVJlY29yZCwgSG9zdGVkWm9uZSwgUmVjb3JkVGFyZ2V0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLXJvdXRlNTNcIjtcbmltcG9ydCB7Q2VydGlmaWNhdGUsIENlcnRpZmljYXRlVmFsaWRhdGlvbn0gZnJvbSAnQGF3cy1jZGsvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5cbmltcG9ydCB7Q2xvdWRGcm9udFRhcmdldH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1yb3V0ZTUzLXRhcmdldHNcIjtcblxuZXhwb3J0IGNsYXNzIFJlYWN0U2FtcGxlU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKGFwcCwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHdlYmFwcEJ1Y2tldCA9IG5ldyBCdWNrZXQodGhpcywgJ1JlYWN0QnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogJ3JlYWN0LmJyaWFuc3VudGVyLmNvbScsXG4gICAgICB3ZWJzaXRlSW5kZXhEb2N1bWVudDogJ2luZGV4Lmh0bWwnLFxuICAgICAgd2Vic2l0ZUVycm9yRG9jdW1lbnQ6ICdlcnJvci5odG1sJyxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IHRydWVcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3VkRnJvbnRPQUkgPSBuZXcgT3JpZ2luQWNjZXNzSWRlbnRpdHkodGhpcywgJ09BSScsIHtcbiAgICAgIGNvbW1lbnQ6ICdPQUkgZm9yIHJlYWN0IHNhbXBsZSB3ZWJhcHAuJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3VkZnJvbnRTM0FjY2VzcyA9IG5ldyBQb2xpY3lTdGF0ZW1lbnQoKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkQWN0aW9ucygnczM6R2V0QnVja2V0KicpO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRBY3Rpb25zKCdzMzpHZXRPYmplY3QqJyk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZEFjdGlvbnMoJ3MzOkxpc3QqJyk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZFJlc291cmNlcyh3ZWJhcHBCdWNrZXQuYnVja2V0QXJuKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkUmVzb3VyY2VzKGAke3dlYmFwcEJ1Y2tldC5idWNrZXRBcm59LypgKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkQ2Fub25pY2FsVXNlclByaW5jaXBhbChcbiAgICAgIGNsb3VkRnJvbnRPQUkuY2xvdWRGcm9udE9yaWdpbkFjY2Vzc0lkZW50aXR5UzNDYW5vbmljYWxVc2VySWRcbiAgICApO1xuXG4gICAgd2ViYXBwQnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3koY2xvdWRmcm9udFMzQWNjZXNzKTtcblxuICAgIGNvbnN0IGhvc3RlZFpvbmUgPSBIb3N0ZWRab25lLmZyb21Mb29rdXAodGhpcywgJ0hvc3RlZFpvbmUnLCB7XG4gICAgICBkb21haW5OYW1lOiAnYnJpYW5zdW50ZXIuY29tJyxcbiAgICAgIHByaXZhdGVab25lOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgQ2VydGlmaWNhdGUodGhpcywgJ0NlcnRpZmljYXRlJywge1xuICAgICAgZG9tYWluTmFtZTogJ3JlYWN0LmJyaWFuc3VudGVyLmNvbScsXG4gICAgICB2YWxpZGF0aW9uOiBDZXJ0aWZpY2F0ZVZhbGlkYXRpb24uZnJvbURucyhob3N0ZWRab25lKSxcbiAgICB9KTtcblxuICAgIC8vIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uKHRoaXMsICdDbG91ZGZyb250Jywge1xuICAgIC8vICAgb3JpZ2luQ29uZmlnczogW1xuICAgIC8vICAgICB7XG4gICAgLy8gICAgICAgczNPcmlnaW5Tb3VyY2U6IHtcbiAgICAvLyAgICAgICAgIHMzQnVja2V0U291cmNlOiB3ZWJhcHBCdWNrZXQsXG4gICAgLy8gICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogY2xvdWRGcm9udE9BSVxuICAgIC8vICAgICAgIH0sXG4gICAgLy8gICAgICAgYmVoYXZpb3JzOiBbXG4gICAgLy8gICAgICAgICB7aXNEZWZhdWx0QmVoYXZpb3I6IHRydWV9XG4gICAgLy8gICAgICAgXVxuICAgIC8vICAgICB9XG4gICAgLy8gICBdLFxuICAgIC8vICAgZXJyb3JDb25maWd1cmF0aW9uczogW1xuICAgIC8vICAgICB7XG4gICAgLy8gICAgICAgZXJyb3JDb2RlOiA0MDQsXG4gICAgLy8gICAgICAgcmVzcG9uc2VDb2RlOiAyMDAsXG4gICAgLy8gICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9pbmRleC5odG1sJyxcbiAgICAvLyAgICAgICBlcnJvckNhY2hpbmdNaW5UdGw6IDBcbiAgICAvLyAgICAgfVxuICAgIC8vICAgXSxcbiAgICAvLyAgIHByaWNlQ2xhc3M6IFByaWNlQ2xhc3MuUFJJQ0VfQ0xBU1NfMTAwLFxuICAgIC8vICAgYWxpYXNDb25maWd1cmF0aW9uOiB7XG4gICAgLy8gICAgIGFjbUNlcnRSZWY6IGNlcnRpZmljYXRlLmNlcnRpZmljYXRlQXJuLFxuICAgIC8vICAgICBuYW1lczogWydyZWFjdC5icmlhbnN1bnRlci5jb20nXVxuICAgIC8vICAgfVxuICAgIC8vIH0pO1xuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uKHRoaXMsICdTaXRlRGlzdHJpYnV0aW9uJywge1xuICAgICAgYWxpYXNDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgYWNtQ2VydFJlZjogY2VydGlmaWNhdGUuY2VydGlmaWNhdGVBcm4sXG4gICAgICAgICAgbmFtZXM6IFsgJ3JlYWN0LmJyaWFuc3VudGVyLmNvbSddLFxuICAgICAgICAgIHNzbE1ldGhvZDogU1NMTWV0aG9kLlNOSSxcbiAgICAgICAgICBzZWN1cml0eVBvbGljeTogU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMV8yMDE2LFxuICAgICAgfSxcbiAgICAgIG9yaWdpbkNvbmZpZ3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgIGN1c3RvbU9yaWdpblNvdXJjZToge1xuICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogd2ViYXBwQnVja2V0LmJ1Y2tldFdlYnNpdGVEb21haW5OYW1lLFxuICAgICAgICAgICAgICAgICAgb3JpZ2luUHJvdG9jb2xQb2xpY3k6IE9yaWdpblByb3RvY29sUG9saWN5LkhUVFBfT05MWSxcbiAgICAgICAgICAgICAgfSwgICAgICAgICAgXG4gICAgICAgICAgICAgIGJlaGF2aW9ycyA6IFsge2lzRGVmYXVsdEJlaGF2aW9yOiB0cnVlfV0sXG4gICAgICAgICAgfVxuICAgICAgXVxuICB9KTtcbiAgICBuZXcgQVJlY29yZCh0aGlzLCAnQWxpYXMnLCB7XG4gICAgICB6b25lOiBob3N0ZWRab25lLFxuICAgICAgcmVjb3JkTmFtZTogJ3JlYWN0JyxcbiAgICAgIHRhcmdldDogUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pKVxuICAgIH0pO1xuXG4gICAgY29uc3Qgc291cmNlT3V0cHV0ID0gbmV3IEFydGlmYWN0KCk7XG4gICAgY29uc3QgYnVpbGRIdG1sT3V0cHV0ID0gbmV3IEFydGlmYWN0KCdiYXNlJyk7XG4gICAgY29uc3QgYnVpbGRTdGF0aWNPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ3N0YXRpYycpO1xuICAgIGNvbnN0IGNsb3VkQXNzZW1ibHlBcnRpZmFjdCA9IG5ldyBBcnRpZmFjdCgpO1xuXG5cbiAgICBjb25zdCBwaXBlbGluZSA9IG5ldyBDZGtQaXBlbGluZSh0aGlzLCAnUGlwZWxpbmUnLCB7XG4gICAgICAvLyBUaGUgcGlwZWxpbmUgbmFtZVxuICAgICAgcGlwZWxpbmVOYW1lOiAnTXlTdGF0aWNQaXBlbGluZScsXG4gICAgICBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QsXG5cbiAgICAgIC8vIFdoZXJlIHRoZSBzb3VyY2UgY2FuIGJlIGZvdW5kXG4gICAgICBzb3VyY2VBY3Rpb246IG5ldyBHaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiAnR2l0SHViJyxcbiAgICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIG9hdXRoVG9rZW46IFNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKCdnaXRodWItdG9rZW4nKSxcbiAgICAgICAgb3duZXI6ICdicmlhbnN1bnRlcicsXG4gICAgICAgIHJlcG86ICdjZGstcmVhY3QnLFxuICAgICAgfSksXG5cbiAgICAgICAvLyBIb3cgaXQgd2lsbCBiZSBidWlsdCBhbmQgc3ludGhlc2l6ZWRcbiAgICAgICBzeW50aEFjdGlvbjogU2ltcGxlU3ludGhBY3Rpb24uc3RhbmRhcmROcG1TeW50aCh7XG4gICAgICAgICBzb3VyY2VBcnRpZmFjdDogc291cmNlT3V0cHV0LFxuICAgICAgICAgY2xvdWRBc3NlbWJseUFydGlmYWN0LFxuICAgICAgICAgXG4gICAgICAgICAvLyBXZSBuZWVkIGEgYnVpbGQgc3RlcCB0byBjb21waWxlIHRoZSBUeXBlU2NyaXB0IExhbWJkYVxuICAgICAgICAgYnVpbGRDb21tYW5kOiAnbnBtIHJ1biBidWlsZCdcbiAgICAgICB9KSxcbiAgICB9KTtcbiAgICBwaXBlbGluZS5hZGRTdGFnZShcIkNvbXBpbGVcIikuYWRkQWN0aW9ucyhuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdXZWJhcHAnLFxuICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCAnQnVpbGQnLCB7XG4gICAgICAgIHByb2plY3ROYW1lOiAnUmVhY3RTYW1wbGUnLFxuICAgICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICAgIGluc3RhbGw6IHtcbiAgICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgICAnY2QgZnJvbnRlbmQnLFxuICAgICAgICAgICAgICAgICducG0gaW5zdGFsbCdcbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICAgIGNvbW1hbmRzOiAnbnBtIHJ1biBidWlsZCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgICAgJ3NlY29uZGFyeS1hcnRpZmFjdHMnOiB7XG4gICAgICAgICAgICAgIFtidWlsZEh0bWxPdXRwdXQuYXJ0aWZhY3ROYW1lIGFzIHN0cmluZ106IHtcbiAgICAgICAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnZnJvbnRlbmQvYnVpbGQnLFxuICAgICAgICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAgICAgICAnKidcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIFtidWlsZFN0YXRpY091dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICdiYXNlLWRpcmVjdG9yeSc6ICdmcm9udGVuZC9idWlsZCcsXG4gICAgICAgICAgICAgICAgZmlsZXM6IFtcbiAgICAgICAgICAgICAgICAgICdzdGF0aWMvKiovKidcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF80XzAsXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgIG91dHB1dHM6IFtidWlsZFN0YXRpY091dHB1dCwgYnVpbGRIdG1sT3V0cHV0XVxuICAgIH0pKVxuICAgIHBpcGVsaW5lLmFkZFN0YWdlKFwiRGVwbG95XCIpLmFkZEFjdGlvbnMoXG4gICAgICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgICAgICBhY3Rpb25OYW1lOiAnU3RhdGljLUFzc2V0cycsXG4gICAgICAgICAgICAgIGlucHV0OiBidWlsZFN0YXRpY091dHB1dCxcbiAgICAgICAgICAgICAgYnVja2V0OiB3ZWJhcHBCdWNrZXQsXG4gICAgICAgICAgICAgIGNhY2hlQ29udHJvbDogW0NhY2hlQ29udHJvbC5zZXRQdWJsaWMoKSwgQ2FjaGVDb250cm9sLm1heEFnZShEdXJhdGlvbi5kYXlzKDUpKV0sXG4gICAgICAgICAgICAgIHJ1bk9yZGVyOiAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgICAgIGFjdGlvbk5hbWU6ICdIVE1MLUFzc2V0cycsXG4gICAgICAgICAgICAgIGlucHV0OiBidWlsZEh0bWxPdXRwdXQsXG4gICAgICAgICAgICAgIGJ1Y2tldDogd2ViYXBwQnVja2V0LFxuICAgICAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtDYWNoZUNvbnRyb2wubm9DYWNoZSgpXSxcbiAgICAgICAgICAgICAgcnVuT3JkZXI6IDJcbiAgICAgICAgICAgIH0pKTtcbiAgfVxufVxuIl19