"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactSampleStack = void 0;
const core_1 = require("@aws-cdk/core");
const aws_s3_1 = require("@aws-cdk/aws-s3");
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
            bucketName: 'brians-react-cdk'
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
        new aws_route53_1.ARecord(this, 'Alias', {
            zone: hostedZone,
            recordName: 'react-test',
            target: aws_route53_1.RecordTarget.fromAlias(new aws_route53_targets_1.CloudFrontTarget(distribution))
        });
        const sourceOutput = new aws_codepipeline_1.Artifact();
        const buildHtmlOutput = new aws_codepipeline_1.Artifact('base');
        const buildStaticOutput = new aws_codepipeline_1.Artifact('static');
        new aws_codepipeline_1.Pipeline(this, 'Pipeline', {
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        // Where the source can be found
                        new aws_codepipeline_actions_1.GitHubSourceAction({
                            actionName: 'GitHub',
                            output: sourceOutput,
                            oauthToken: core_1.SecretValue.secretsManager('github-token'),
                            owner: 'briansunter',
                            repo: 'cdk-react',
                            trigger: aws_codepipeline_actions_1.GitHubTrigger.WEBHOOK,
                        }),
                    ]
                },
                {
                    stageName: 'Build',
                    actions: [
                        new aws_codepipeline_actions_1.CodeBuildAction({
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
                                                'base-directory': 'build',
                                                files: [
                                                    '*'
                                                ]
                                            },
                                            [buildStaticOutput.artifactName]: {
                                                'base-directory': 'build',
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
                        })
                    ]
                },
                {
                    stageName: 'Deploy',
                    actions: [
                        new aws_codepipeline_actions_1.S3DeployAction({
                            actionName: 'Static-Assets',
                            input: buildStaticOutput,
                            bucket: webappBucket,
                            cacheControl: [aws_codepipeline_actions_1.CacheControl.setPublic(), aws_codepipeline_actions_1.CacheControl.maxAge(core_1.Duration.days(5))],
                            runOrder: 1
                        }),
                        new aws_codepipeline_actions_1.S3DeployAction({
                            actionName: 'HTML-Assets',
                            input: buildHtmlOutput,
                            bucket: webappBucket,
                            cacheControl: [aws_codepipeline_actions_1.CacheControl.noCache()],
                            runOrder: 2
                        })
                    ]
                }
            ]
        });
    }
}
exports.ReactSampleStack = ReactSampleStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBNEU7QUFDNUUsNENBQXVDO0FBQ3ZDLDREQUFtRztBQUNuRyw4Q0FBaUQ7QUFDakQsMERBQW1GO0FBQ25GLGdFQUE2RDtBQUM3RCxnRkFNMkM7QUFDM0Msc0RBQXVFO0FBQ3ZFLDRFQUFtRjtBQUVuRixzRUFBOEQ7QUFFOUQsTUFBYSxnQkFBaUIsU0FBUSxZQUFLO0lBRXpDLFlBQVksR0FBUSxFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUNsRCxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV0QixNQUFNLFlBQVksR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ25ELFVBQVUsRUFBRSxrQkFBa0I7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxxQ0FBb0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzFELE9BQU8sRUFBRSw4QkFBOEI7U0FDeEMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLHlCQUFlLEVBQUUsQ0FBQztRQUNqRCxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDL0Msa0JBQWtCLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQy9DLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELGtCQUFrQixDQUFDLFlBQVksQ0FBQyxHQUFHLFlBQVksQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDO1FBQy9ELGtCQUFrQixDQUFDLHlCQUF5QixDQUMxQyxhQUFhLENBQUMsK0NBQStDLENBQzlELENBQUM7UUFFRixZQUFZ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LCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0FwcCwgRHVyYXRpb24sIFNlY3JldFZhbHVlLCBTdGFjaywgU3RhY2tQcm9wc30gZnJvbSBcIkBhd3MtY2RrL2NvcmVcIjtcbmltcG9ydCB7QnVja2V0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLXMzXCI7XG5pbXBvcnQge0Nsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24sIE9yaWdpbkFjY2Vzc0lkZW50aXR5LCBQcmljZUNsYXNzfSBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWRmcm9udCdcbmltcG9ydCB7UG9saWN5U3RhdGVtZW50fSBmcm9tIFwiQGF3cy1jZGsvYXdzLWlhbVwiO1xuaW1wb3J0IHtCdWlsZFNwZWMsIExpbnV4QnVpbGRJbWFnZSwgUGlwZWxpbmVQcm9qZWN0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVidWlsZFwiO1xuaW1wb3J0IHtBcnRpZmFjdCwgUGlwZWxpbmV9IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lXCI7XG5pbXBvcnQge1xuICBDYWNoZUNvbnRyb2wsXG4gIENvZGVCdWlsZEFjdGlvbixcbiAgR2l0SHViU291cmNlQWN0aW9uLFxuICBHaXRIdWJUcmlnZ2VyLFxuICBTM0RlcGxveUFjdGlvblxufSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zXCI7XG5pbXBvcnQge0FSZWNvcmQsIEhvc3RlZFpvbmUsIFJlY29yZFRhcmdldH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1yb3V0ZTUzXCI7XG5pbXBvcnQge0NlcnRpZmljYXRlLCBDZXJ0aWZpY2F0ZVZhbGlkYXRpb259IGZyb20gJ0Bhd3MtY2RrL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuXG5pbXBvcnQge0Nsb3VkRnJvbnRUYXJnZXR9IGZyb20gXCJAYXdzLWNkay9hd3Mtcm91dGU1My10YXJnZXRzXCI7XG5cbmV4cG9ydCBjbGFzcyBSZWFjdFNhbXBsZVN0YWNrIGV4dGVuZHMgU3RhY2sge1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihhcHAsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB3ZWJhcHBCdWNrZXQgPSBuZXcgQnVja2V0KHRoaXMsICdSZWFjdEJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6ICdicmlhbnMtcmVhY3QtY2RrJ1xuICAgIH0pO1xuXG4gICAgY29uc3QgY2xvdWRGcm9udE9BSSA9IG5ldyBPcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnT0FJJywge1xuICAgICAgY29tbWVudDogJ09BSSBmb3IgcmVhY3Qgc2FtcGxlIHdlYmFwcC4nLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xvdWRmcm9udFMzQWNjZXNzID0gbmV3IFBvbGljeVN0YXRlbWVudCgpO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRBY3Rpb25zKCdzMzpHZXRCdWNrZXQqJyk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZEFjdGlvbnMoJ3MzOkdldE9iamVjdConKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkQWN0aW9ucygnczM6TGlzdConKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkUmVzb3VyY2VzKHdlYmFwcEJ1Y2tldC5idWNrZXRBcm4pO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRSZXNvdXJjZXMoYCR7d2ViYXBwQnVja2V0LmJ1Y2tldEFybn0vKmApO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRDYW5vbmljYWxVc2VyUHJpbmNpcGFsKFxuICAgICAgY2xvdWRGcm9udE9BSS5jbG91ZEZyb250T3JpZ2luQWNjZXNzSWRlbnRpdHlTM0Nhbm9uaWNhbFVzZXJJZFxuICAgICk7XG5cbiAgICB3ZWJhcHBCdWNrZXQuYWRkVG9SZXNvdXJjZVBvbGljeShjbG91ZGZyb250UzNBY2Nlc3MpO1xuXG4gICAgY29uc3QgaG9zdGVkWm9uZSA9IEhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCAnSG9zdGVkWm9uZScsIHtcbiAgICAgIGRvbWFpbk5hbWU6ICdicmlhbnN1bnRlci5jb20nLFxuICAgICAgcHJpdmF0ZVpvbmU6IGZhbHNlXG4gICAgfSk7XG5cbiAgICBjb25zdCBjZXJ0aWZpY2F0ZSA9IG5ldyBDZXJ0aWZpY2F0ZSh0aGlzLCAnQ2VydGlmaWNhdGUnLCB7XG4gICAgICBkb21haW5OYW1lOiAncmVhY3QuYnJpYW5zdW50ZXIuY29tJyxcbiAgICAgIHZhbGlkYXRpb246IENlcnRpZmljYXRlVmFsaWRhdGlvbi5mcm9tRG5zKGhvc3RlZFpvbmUpLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24odGhpcywgJ0Nsb3VkZnJvbnQnLCB7XG4gICAgICBvcmlnaW5Db25maWdzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzM09yaWdpblNvdXJjZToge1xuICAgICAgICAgICAgczNCdWNrZXRTb3VyY2U6IHdlYmFwcEJ1Y2tldCxcbiAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5OiBjbG91ZEZyb250T0FJXG4gICAgICAgICAgfSxcbiAgICAgICAgICBiZWhhdmlvcnM6IFtcbiAgICAgICAgICAgIHtpc0RlZmF1bHRCZWhhdmlvcjogdHJ1ZX1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBlcnJvckNvbmZpZ3VyYXRpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBlcnJvckNvZGU6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUNvZGU6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIGVycm9yQ2FjaGluZ01pblR0bDogMFxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgcHJpY2VDbGFzczogUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDAsXG4gICAgICBhbGlhc0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgYWNtQ2VydFJlZjogY2VydGlmaWNhdGUuY2VydGlmaWNhdGVBcm4sXG4gICAgICAgIG5hbWVzOiBbJ3JlYWN0LmJyaWFuc3VudGVyLmNvbSddXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBuZXcgQVJlY29yZCh0aGlzLCAnQWxpYXMnLCB7XG4gICAgICB6b25lOiBob3N0ZWRab25lLFxuICAgICAgcmVjb3JkTmFtZTogJ3JlYWN0LXRlc3QnLFxuICAgICAgdGFyZ2V0OiBSZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyBDbG91ZEZyb250VGFyZ2V0KGRpc3RyaWJ1dGlvbikpXG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBidWlsZEh0bWxPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ2Jhc2UnKTtcbiAgICBjb25zdCBidWlsZFN0YXRpY091dHB1dCA9IG5ldyBBcnRpZmFjdCgnc3RhdGljJyk7XG5cbiAgICBuZXcgUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgc3RhZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdTb3VyY2UnLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAvLyBXaGVyZSB0aGUgc291cmNlIGNhbiBiZSBmb3VuZFxuICAgICBuZXcgR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdHaXRIdWInLFxuICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvYXV0aFRva2VuOiBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignZ2l0aHViLXRva2VuJyksXG4gICAgICBvd25lcjogJ2JyaWFuc3VudGVyJyxcbiAgICAgIHJlcG86ICdjZGstcmVhY3QnLFxuICAgICAgdHJpZ2dlcjogR2l0SHViVHJpZ2dlci5XRUJIT09LLFxuICAgIH0pLFxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YWdlTmFtZTogJ0J1aWxkJyxcbiAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgICAgICAgYWN0aW9uTmFtZTogJ1dlYmFwcCcsXG4gICAgICAgICAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ0J1aWxkJywge1xuICAgICAgICAgICAgICAgIHByb2plY3ROYW1lOiAnUmVhY3RTYW1wbGUnLFxuICAgICAgICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICAgICAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgICAgICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnY2QgZnJvbnRlbmQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ25wbSBpbnN0YWxsJ1xuICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kczogJ25wbSBydW4gYnVpbGQnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ3NlY29uZGFyeS1hcnRpZmFjdHMnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgW2J1aWxkSHRtbE91dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2Jhc2UtZGlyZWN0b3J5JzogJ2J1aWxkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgW2J1aWxkU3RhdGljT3V0cHV0LmFydGlmYWN0TmFtZSBhcyBzdHJpbmddOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnYnVpbGQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ3N0YXRpYy8qKi8qJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNF8wLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgICAgICAgIG91dHB1dHM6IFtidWlsZFN0YXRpY091dHB1dCwgYnVpbGRIdG1sT3V0cHV0XVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdEZXBsb3knLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgICAgIGFjdGlvbk5hbWU6ICdTdGF0aWMtQXNzZXRzJyxcbiAgICAgICAgICAgICAgaW5wdXQ6IGJ1aWxkU3RhdGljT3V0cHV0LFxuICAgICAgICAgICAgICBidWNrZXQ6IHdlYmFwcEJ1Y2tldCxcbiAgICAgICAgICAgICAgY2FjaGVDb250cm9sOiBbQ2FjaGVDb250cm9sLnNldFB1YmxpYygpLCBDYWNoZUNvbnRyb2wubWF4QWdlKER1cmF0aW9uLmRheXMoNSkpXSxcbiAgICAgICAgICAgICAgcnVuT3JkZXI6IDFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICAgICAgYWN0aW9uTmFtZTogJ0hUTUwtQXNzZXRzJyxcbiAgICAgICAgICAgICAgaW5wdXQ6IGJ1aWxkSHRtbE91dHB1dCxcbiAgICAgICAgICAgICAgYnVja2V0OiB3ZWJhcHBCdWNrZXQsXG4gICAgICAgICAgICAgIGNhY2hlQ29udHJvbDogW0NhY2hlQ29udHJvbC5ub0NhY2hlKCldLFxuICAgICAgICAgICAgICBydW5PcmRlcjogMlxuICAgICAgICAgICAgfSlcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9KTtcbiAgfVxufVxuIl19