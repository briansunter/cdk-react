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
        const distribution = new aws_cloudfront_1.CloudFrontWebDistribution(this, 'Cloudfront', {
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: webappBucket,
                        originAccessIdentity: cloudFrontOAI
                    },
                    behaviors: [
                        { isDefaultBehavior: true }
                    ]
                }
            ],
            errorConfigurations: [
                {
                    errorCode: 404,
                    responseCode: 200,
                    responsePagePath: '/index.html',
                    errorCachingMinTtl: 0
                }
            ],
            priceClass: aws_cloudfront_1.PriceClass.PRICE_CLASS_100,
            aliasConfiguration: {
                acmCertRef: certificate.certificateArn,
                names: ['react.briansunter.com']
            }
        });
        //   const distribution = new CloudFrontWebDistribution(this, 'SiteDistribution', {
        //     aliasConfiguration: {
        //         acmCertRef: certificate.certificateArn,
        //         names: [ 'react.briansunter.com'],
        //         sslMethod: SSLMethod.SNI,
        //         securityPolicy: SecurityPolicyProtocol.TLS_V1_1_2016,
        //     },
        //     originConfigs: [
        //         {
        //             customOriginSource: {
        //                 domainName: webappBucket.bucketWebsiteDomainName,
        //                 originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
        //             },          
        //             behaviors : [ {isDefaultBehavior: true}],
        //         }
        //     ]
        // });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBNEU7QUFDNUUsNENBQXVDO0FBQ3ZDLGtEQUFvRTtBQUNwRSw0REFBNEo7QUFDNUosOENBQWlEO0FBQ2pELDBEQUFtRjtBQUNuRixnRUFBNkQ7QUFDN0QsZ0ZBTTJDO0FBQzNDLHNEQUF1RTtBQUN2RSw0RUFBbUY7QUFFbkYsc0VBQThEO0FBRTlELE1BQWEsZ0JBQWlCLFNBQVEsWUFBSztJQUV6QyxZQUFZLEdBQVEsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDbEQsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFdEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNuRCxVQUFVLEVBQUUsdUJBQXVCO1lBQ25DLG9CQUFvQixFQUFFLFlBQVk7WUFDbEMsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxnQkFBZ0IsRUFBRSxJQUFJO1NBQ3ZCLENBQUMsQ0FBQztRQUVILE1BQU0sYUFBYSxHQUFHLElBQUkscUNBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUMxRCxPQUFPLEVBQUUsOEJBQThCO1NBQ3hDLENBQUMsQ0FBQztRQUVILE1BQU0sa0JBQWtCLEdBQUcsSUFBSSx5QkFBZSxFQUFFLENBQUM7UUFDakQsa0JBQWtCLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQy9DLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUMvQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4RCxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxZQUFZLENBQUMsU0FBUyxJ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QyxVQUFVLENBQzlCLElBQUkseUNBQWMsQ0FBQztZQUNqQixVQUFVLEVBQUUsZUFBZTtZQUMzQixLQUFLLEVBQUUsaUJBQWlCO1lBQ3hCLE1BQU0sRUFBRSxZQUFZO1lBQ3BCLFlBQVksRUFBRSxDQUFDLHVDQUFZLENBQUMsU0FBUyxFQUFFLEVBQUUsdUNBQVksQ0FBQyxNQUFNLENBQUMsZUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9FLFFBQVEsRUFBRSxDQUFDO1NBQ1osQ0FBQyxFQUNGLElBQUkseUNBQWMsQ0FBQztZQUNqQixVQUFVLEVBQUUsYUFBYTtZQUN6QixLQUFLLEVBQUUsZUFBZTtZQUN0QixNQUFNLEVBQUUsWUFBWTtZQUNwQixZQUFZLEVBQUUsQ0FBQyx1Q0FBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3RDLFFBQVEsRUFBRSxDQUFDO1NBQ1osQ0FBQyxDQUFDLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUE5S0QsNENBOEtDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtBcHAsIER1cmF0aW9uLCBTZWNyZXRWYWx1ZSwgU3RhY2ssIFN0YWNrUHJvcHN9IGZyb20gXCJAYXdzLWNkay9jb3JlXCI7XG5pbXBvcnQge0J1Y2tldH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1zM1wiO1xuaW1wb3J0IHsgQ2RrUGlwZWxpbmUsIFNpbXBsZVN5bnRoQWN0aW9uIH0gZnJvbSBcIkBhd3MtY2RrL3BpcGVsaW5lc1wiO1xuaW1wb3J0IHtTZWN1cml0eVBvbGljeVByb3RvY29sLCBPcmlnaW5Qcm90b2NvbFBvbGljeSxTU0xNZXRob2QsICBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uLCBPcmlnaW5BY2Nlc3NJZGVudGl0eSwgUHJpY2VDbGFzc30gZnJvbSAnQGF3cy1jZGsvYXdzLWNsb3VkZnJvbnQnXG5pbXBvcnQge1BvbGljeVN0YXRlbWVudH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1pYW1cIjtcbmltcG9ydCB7QnVpbGRTcGVjLCBMaW51eEJ1aWxkSW1hZ2UsIFBpcGVsaW5lUHJvamVjdH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1jb2RlYnVpbGRcIjtcbmltcG9ydCB7QXJ0aWZhY3QsIFBpcGVsaW5lfSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZVwiO1xuaW1wb3J0IHtcbiAgQ2FjaGVDb250cm9sLFxuICBDb2RlQnVpbGRBY3Rpb24sXG4gIEdpdEh1YlNvdXJjZUFjdGlvbixcbiAgR2l0SHViVHJpZ2dlcixcbiAgUzNEZXBsb3lBY3Rpb25cbn0gZnJvbSBcIkBhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9uc1wiO1xuaW1wb3J0IHtBUmVjb3JkLCBIb3N0ZWRab25lLCBSZWNvcmRUYXJnZXR9IGZyb20gXCJAYXdzLWNkay9hd3Mtcm91dGU1M1wiO1xuaW1wb3J0IHtDZXJ0aWZpY2F0ZSwgQ2VydGlmaWNhdGVWYWxpZGF0aW9ufSBmcm9tICdAYXdzLWNkay9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcblxuaW1wb3J0IHtDbG91ZEZyb250VGFyZ2V0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLXJvdXRlNTMtdGFyZ2V0c1wiO1xuXG5leHBvcnQgY2xhc3MgUmVhY3RTYW1wbGVTdGFjayBleHRlbmRzIFN0YWNrIHtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoYXBwLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qgd2ViYXBwQnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLCAnUmVhY3RCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiAncmVhY3QuYnJpYW5zdW50ZXIuY29tJyxcbiAgICAgIHdlYnNpdGVJbmRleERvY3VtZW50OiAnaW5kZXguaHRtbCcsXG4gICAgICB3ZWJzaXRlRXJyb3JEb2N1bWVudDogJ2Vycm9yLmh0bWwnLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogdHJ1ZVxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xvdWRGcm9udE9BSSA9IG5ldyBPcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnT0FJJywge1xuICAgICAgY29tbWVudDogJ09BSSBmb3IgcmVhY3Qgc2FtcGxlIHdlYmFwcC4nLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xvdWRmcm9udFMzQWNjZXNzID0gbmV3IFBvbGljeVN0YXRlbWVudCgpO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRBY3Rpb25zKCdzMzpHZXRCdWNrZXQqJyk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZEFjdGlvbnMoJ3MzOkdldE9iamVjdConKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkQWN0aW9ucygnczM6TGlzdConKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkUmVzb3VyY2VzKHdlYmFwcEJ1Y2tldC5idWNrZXRBcm4pO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRSZXNvdXJjZXMoYCR7d2ViYXBwQnVja2V0LmJ1Y2tldEFybn0vKmApO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRDYW5vbmljYWxVc2VyUHJpbmNpcGFsKFxuICAgICAgY2xvdWRGcm9udE9BSS5jbG91ZEZyb250T3JpZ2luQWNjZXNzSWRlbnRpdHlTM0Nhbm9uaWNhbFVzZXJJZFxuICAgICk7XG5cbiAgICB3ZWJhcHBCdWNrZXQuYWRkVG9SZXNvdXJjZVBvbGljeShjbG91ZGZyb250UzNBY2Nlc3MpO1xuXG4gICAgY29uc3QgaG9zdGVkWm9uZSA9IEhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCAnSG9zdGVkWm9uZScsIHtcbiAgICAgIGRvbWFpbk5hbWU6ICdicmlhbnN1bnRlci5jb20nLFxuICAgICAgcHJpdmF0ZVpvbmU6IGZhbHNlXG4gICAgfSk7XG5cbiAgICBjb25zdCBjZXJ0aWZpY2F0ZSA9IG5ldyBDZXJ0aWZpY2F0ZSh0aGlzLCAnQ2VydGlmaWNhdGUnLCB7XG4gICAgICBkb21haW5OYW1lOiAncmVhY3QuYnJpYW5zdW50ZXIuY29tJyxcbiAgICAgIHZhbGlkYXRpb246IENlcnRpZmljYXRlVmFsaWRhdGlvbi5mcm9tRG5zKGhvc3RlZFpvbmUpLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24odGhpcywgJ0Nsb3VkZnJvbnQnLCB7XG4gICAgICBvcmlnaW5Db25maWdzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzM09yaWdpblNvdXJjZToge1xuICAgICAgICAgICAgczNCdWNrZXRTb3VyY2U6IHdlYmFwcEJ1Y2tldCxcbiAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5OiBjbG91ZEZyb250T0FJXG4gICAgICAgICAgfSxcbiAgICAgICAgICBiZWhhdmlvcnM6IFtcbiAgICAgICAgICAgIHtpc0RlZmF1bHRCZWhhdmlvcjogdHJ1ZX1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBlcnJvckNvbmZpZ3VyYXRpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBlcnJvckNvZGU6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUNvZGU6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIGVycm9yQ2FjaGluZ01pblR0bDogMFxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgcHJpY2VDbGFzczogUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDAsXG4gICAgICBhbGlhc0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgYWNtQ2VydFJlZjogY2VydGlmaWNhdGUuY2VydGlmaWNhdGVBcm4sXG4gICAgICAgIG5hbWVzOiBbJ3JlYWN0LmJyaWFuc3VudGVyLmNvbSddXG4gICAgICB9XG4gICAgfSk7XG4gIC8vICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24odGhpcywgJ1NpdGVEaXN0cmlidXRpb24nLCB7XG4gIC8vICAgICBhbGlhc0NvbmZpZ3VyYXRpb246IHtcbiAgLy8gICAgICAgICBhY21DZXJ0UmVmOiBjZXJ0aWZpY2F0ZS5jZXJ0aWZpY2F0ZUFybixcbiAgLy8gICAgICAgICBuYW1lczogWyAncmVhY3QuYnJpYW5zdW50ZXIuY29tJ10sXG4gIC8vICAgICAgICAgc3NsTWV0aG9kOiBTU0xNZXRob2QuU05JLFxuICAvLyAgICAgICAgIHNlY3VyaXR5UG9saWN5OiBTZWN1cml0eVBvbGljeVByb3RvY29sLlRMU19WMV8xXzIwMTYsXG4gIC8vICAgICB9LFxuICAvLyAgICAgb3JpZ2luQ29uZmlnczogW1xuICAvLyAgICAgICAgIHtcbiAgLy8gICAgICAgICAgICAgY3VzdG9tT3JpZ2luU291cmNlOiB7XG4gIC8vICAgICAgICAgICAgICAgICBkb21haW5OYW1lOiB3ZWJhcHBCdWNrZXQuYnVja2V0V2Vic2l0ZURvbWFpbk5hbWUsXG4gIC8vICAgICAgICAgICAgICAgICBvcmlnaW5Qcm90b2NvbFBvbGljeTogT3JpZ2luUHJvdG9jb2xQb2xpY3kuSFRUUF9PTkxZLFxuICAvLyAgICAgICAgICAgICB9LCAgICAgICAgICBcbiAgLy8gICAgICAgICAgICAgYmVoYXZpb3JzIDogWyB7aXNEZWZhdWx0QmVoYXZpb3I6IHRydWV9XSxcbiAgLy8gICAgICAgICB9XG4gIC8vICAgICBdXG4gIC8vIH0pO1xuICAgIG5ldyBBUmVjb3JkKHRoaXMsICdBbGlhcycsIHtcbiAgICAgIHpvbmU6IGhvc3RlZFpvbmUsXG4gICAgICByZWNvcmROYW1lOiAncmVhY3QnLFxuICAgICAgdGFyZ2V0OiBSZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyBDbG91ZEZyb250VGFyZ2V0KGRpc3RyaWJ1dGlvbikpXG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBidWlsZEh0bWxPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ2Jhc2UnKTtcbiAgICBjb25zdCBidWlsZFN0YXRpY091dHB1dCA9IG5ldyBBcnRpZmFjdCgnc3RhdGljJyk7XG4gICAgY29uc3QgY2xvdWRBc3NlbWJseUFydGlmYWN0ID0gbmV3IEFydGlmYWN0KCk7XG5cblxuICAgIGNvbnN0IHBpcGVsaW5lID0gbmV3IENka1BpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcbiAgICAgIC8vIFRoZSBwaXBlbGluZSBuYW1lXG4gICAgICBwaXBlbGluZU5hbWU6ICdNeVN0YXRpY1BpcGVsaW5lJyxcbiAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdCxcblxuICAgICAgLy8gV2hlcmUgdGhlIHNvdXJjZSBjYW4gYmUgZm91bmRcbiAgICAgIHNvdXJjZUFjdGlvbjogbmV3IEdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6ICdHaXRIdWInLFxuICAgICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgb2F1dGhUb2tlbjogU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoJ2dpdGh1Yi10b2tlbicpLFxuICAgICAgICBvd25lcjogJ2JyaWFuc3VudGVyJyxcbiAgICAgICAgcmVwbzogJ2Nkay1yZWFjdCcsXG4gICAgICB9KSxcblxuICAgICAgIC8vIEhvdyBpdCB3aWxsIGJlIGJ1aWx0IGFuZCBzeW50aGVzaXplZFxuICAgICAgIHN5bnRoQWN0aW9uOiBTaW1wbGVTeW50aEFjdGlvbi5zdGFuZGFyZE5wbVN5bnRoKHtcbiAgICAgICAgc3ViZGlyZWN0b3J5OiAnaW5mcmEnLFxuICAgICAgICAgc291cmNlQXJ0aWZhY3Q6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdCxcbiAgICAgICAgIFxuICAgICAgICAgLy8gV2UgbmVlZCBhIGJ1aWxkIHN0ZXAgdG8gY29tcGlsZSB0aGUgVHlwZVNjcmlwdCBMYW1iZGFcbiAgICAgICAgIGJ1aWxkQ29tbWFuZDogJ25wbSBydW4gYnVpbGQnXG4gICAgICAgfSksXG4gICAgfSk7XG4gICAgcGlwZWxpbmUuYWRkU3RhZ2UoXCJDb21waWxlXCIpLmFkZEFjdGlvbnMobmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiAnV2ViYXBwJyxcbiAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ0J1aWxkJywge1xuICAgICAgICBwcm9qZWN0TmFtZTogJ1JlYWN0U2FtcGxlJyxcbiAgICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbU9iamVjdCh7XG4gICAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICAgJ2NkIGZyb250ZW5kJyxcbiAgICAgICAgICAgICAgICAnbnBtIGluc3RhbGwnXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgICBjb21tYW5kczogJ25wbSBydW4gYnVpbGQnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAgICdzZWNvbmRhcnktYXJ0aWZhY3RzJzoge1xuICAgICAgICAgICAgICBbYnVpbGRIdG1sT3V0cHV0LmFydGlmYWN0TmFtZSBhcyBzdHJpbmddOiB7XG4gICAgICAgICAgICAgICAgJ2Jhc2UtZGlyZWN0b3J5JzogJ2Zyb250ZW5kL2J1aWxkJyxcbiAgICAgICAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgICAgICAgJyonXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBbYnVpbGRTdGF0aWNPdXRwdXQuYXJ0aWZhY3ROYW1lIGFzIHN0cmluZ106IHtcbiAgICAgICAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnZnJvbnRlbmQvYnVpbGQnLFxuICAgICAgICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAgICAgICAnc3RhdGljLyoqLyonXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNF8wLFxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvdXRwdXRzOiBbYnVpbGRTdGF0aWNPdXRwdXQsIGJ1aWxkSHRtbE91dHB1dF1cbiAgICB9KSlcbiAgICBwaXBlbGluZS5hZGRTdGFnZShcIkRlcGxveVwiKS5hZGRBY3Rpb25zKFxuICAgICAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICAgICAgYWN0aW9uTmFtZTogJ1N0YXRpYy1Bc3NldHMnLFxuICAgICAgICAgICAgICBpbnB1dDogYnVpbGRTdGF0aWNPdXRwdXQsXG4gICAgICAgICAgICAgIGJ1Y2tldDogd2ViYXBwQnVja2V0LFxuICAgICAgICAgICAgICBjYWNoZUNvbnRyb2w6IFtDYWNoZUNvbnRyb2wuc2V0UHVibGljKCksIENhY2hlQ29udHJvbC5tYXhBZ2UoRHVyYXRpb24uZGF5cyg1KSldLFxuICAgICAgICAgICAgICBydW5PcmRlcjogMVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgUzNEZXBsb3lBY3Rpb24oe1xuICAgICAgICAgICAgICBhY3Rpb25OYW1lOiAnSFRNTC1Bc3NldHMnLFxuICAgICAgICAgICAgICBpbnB1dDogYnVpbGRIdG1sT3V0cHV0LFxuICAgICAgICAgICAgICBidWNrZXQ6IHdlYmFwcEJ1Y2tldCxcbiAgICAgICAgICAgICAgY2FjaGVDb250cm9sOiBbQ2FjaGVDb250cm9sLm5vQ2FjaGUoKV0sXG4gICAgICAgICAgICAgIHJ1bk9yZGVyOiAyXG4gICAgICAgICAgICB9KSk7XG4gIH1cbn1cbiJdfQ==