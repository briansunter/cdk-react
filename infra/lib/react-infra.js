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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3QtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1pbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBNEU7QUFDNUUsNENBQXVDO0FBQ3ZDLDREQUE0SjtBQUM1Siw4Q0FBaUQ7QUFDakQsMERBQW1GO0FBQ25GLGdFQUE2RDtBQUM3RCxnRkFNMkM7QUFDM0Msc0RBQXVFO0FBQ3ZFLDRFQUFtRjtBQUVuRixzRUFBOEQ7QUFFOUQsTUFBYSxnQkFBaUIsU0FBUSxZQUFLO0lBRXpDLFlBQVksR0FBUSxFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUNsRCxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV0QixNQUFNLFlBQVksR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ25ELFVBQVUsRUFBRSx1QkFBdUI7WUFDbkMsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxvQkFBb0IsRUFBRSxZQUFZO1lBQ2xDLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxxQ0FBb0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzFELE9BQU8sRUFBRSw4QkFBOEI7U0FDeEMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLHlCQUFlLEVBQUUsQ0FBQztRQUNqRCxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDL0Msa0JBQWtCLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQy9DLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELGtCQUFrQixDQUFDLFlBQVksQ0FBQyxHQUFHLFlBQVksQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDO1FBQy9ELGtCQUFrQixDQUFDLHlCQUF5QixDQUMxQyxhQUFhLENBQUMsK0NBQStDLENBQzlELENBQUM7UUFFRixZQUFZLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUVyRCxNQUFNLFVBQVUsR0FBRyx3QkFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQzNELFVBQVUsRUFBRSxpQkFBaUI7WUFDN0IsV0FBVyxFQUFFLEtBQUs7U0FDbkIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxXQUFXLEdBQUcsSUFBSSxvQ0FBVyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDdkQsVUFBVSxFQUFFLHVCQUF1QjtZQUNuQyxVQUFVLEVBQUUsOENBQXFCLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztTQUN0RCxDQUFDLENBQUM7UUFFSCwyRUFBMkU7UUFDM0UscUJBQXFCO1FBQ3JCLFFBQVE7UUFDUiwwQkFBMEI7UUFDMUIsd0NBQXdDO1FBQ3hDLDhDQUE4QztRQUM5QyxXQUFXO1FBQ1gscUJBQXFCO1FBQ3JCLG9DQUFvQztRQUNwQyxVQUFVO1FBQ1YsUUFBUTtRQUNSLE9BQU87UUFDUCwyQkFBMkI7UUFDM0IsUUFBUTtRQUNSLHdCQUF3QjtRQUN4QiwyQkFBMkI7UUFDM0IseUNBQXlDO1FBQ3pDLDhCQUE4QjtRQUM5QixRQUFRO1FBQ1IsT0FBTztRQUNQLDRDQUE0QztRQUM1QywwQkFBMEI7UUFDMUIsOENBQThDO1FBQzlDLHVDQUF1QztRQUN2QyxNQUFNO1FBQ04sTUFBTTtRQUNOLE1BQU0sWUFBWSxHQUFHLElBQUksMENBQXlCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzNFLGtCQUFrQixFQUFFO2dCQUNoQixVQUFVLEVBQUUsV0FBVyxDQUFDLGNBQWM7Z0JBQ3RDLEtBQUssRUFBRSxDQUFFLHVCQUF1QixDQUFDO2dCQUNqQyxTQUFTLEVBQUUsMEJBQVMsQ0FBQyxHQUFHO2dCQUN4QixjQUFjLEVBQUUsdUNBQXNCLENBQUMsYUFBYTthQUN2RDtZQUNELGFBQWEsRUFBRTtnQkFDWDtvQkFDSSxrQkFBa0IsRUFBRTt3QkFDaEIsVUFBVSxFQUFFLFlBQVksQ0FBQyx1QkFBdUI7d0JBQ2hELG9CQUFvQixFQUFFLHFDQUFvQixDQUFDLFNBQVM7cUJBQ3ZEO29CQUNELFNBQVMsRUFBRyxDQUFFLEVBQUMsaUJBQWlCLEVBQUUsSUFBSSxFQUFDLENBQUM7aUJBQzNDO2FBQ0o7U0FDSixDQUFDLENBQUM7UUFDRCxJQUFJLHFCQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUN6QixJQUFJLEVBQUUsVUFBVTtZQUNoQixVQUFVLEVBQUUsWUFBWTtZQUN4QixNQUFNLEVBQUUsMEJBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxzQ0FBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNuRSxDQUFDLENBQUM7UUFFSCxNQUFNLFlBQVksR0FBRyxJQUFJLDJCQUFRLEVBQUUsQ0FBQztRQUNwQyxNQUFNLGVBQWUsR0FBRyxJQUFJLDJCQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0MsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLDJCQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFakQsSUFBSSwyQkFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDN0IsTUFBTSxFQUFFO2dCQUNOO29CQUNFLFNBQVMsRUFBRSxRQUFRO29CQUNuQixPQUFPLEVBQUU7d0JBQ2YsZ0NBQWdDO3dCQUMvQixJQUFJLDZDQUFrQixDQUFDOzRCQUN0QixVQUFVLEVBQUUsUUFBUTs0QkFDcEIsTUFBTSxFQUFFLFlBQVk7NEJBQ3BCLFVBQVUsRUFBRSxrQkFBVyxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUM7NEJBQ3RELEtBQUssRUFBRSxhQUFhOzRCQUNwQixJQUFJLEVBQUUsV0FBVzs0QkFDakIsT0FBTyxFQUFFLHdDQUFhLENBQUMsT0FBTzt5QkFDL0IsQ0FBQztxQkFDSztpQkFDRjtnQkFDRDtvQkFDRSxTQUFTLEVBQUUsT0FBTztvQkFDbEIsT0FBTyxFQUFFO3dCQUNQLElBQUksMENBQWUsQ0FBQzs0QkFDbEIsVUFBVSxFQUFFLFFBQVE7NEJBQ3BCLE9BQU8sRUFBRSxJQUFJLCtCQUFlLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtnQ0FDMUMsV0FBVyxFQUFFLGFBQWE7Z0NBQzFCLFNBQVMsRUFBRSx5QkFBUyxDQUFDLFVBQVUsQ0FBQztvQ0FDOUIsT0FBTyxFQUFFLEtBQUs7b0NBQ2QsTUFBTSxFQUFFO3dDQUNOLE9BQU8sRUFBRTs0Q0FDUCxRQUFRLEVBQUU7Z0RBQ1IsYUFBYTtnREFDYixhQUFhOzZDQUNkO3lDQUNGO3dDQUNELEtBQUssRUFBRTs0Q0FDTCxRQUFRLEVBQUUsZUFBZTt5Q0FDMUI7cUNBQ0Y7b0NBQ0QsU0FBUyxFQUFFO3dDQUNULHFCQUFxQixFQUFFOzRDQUNyQixDQUFDLGVBQWUsQ0FBQyxZQUFzQixDQUFDLEVBQUU7Z0RBQ3hDLGdCQUFnQixFQUFFLGdCQUFnQjtnREFDbEMsS0FBSyxFQUFFO29EQUNMLEdBQUc7aURBQ0o7NkNBQ0Y7NENBQ0QsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFzQixDQUFDLEVBQUU7Z0RBQzFDLGdCQUFnQixFQUFFLGdCQUFnQjtnREFDbEMsS0FBSyxFQUFFO29EQUNMLGFBQWE7aURBQ2Q7NkNBQ0Y7eUNBQ0Y7cUNBQ0Y7aUNBQ0YsQ0FBQztnQ0FDRixXQUFXLEVBQUU7b0NBQ1gsVUFBVSxFQUFFLCtCQUFlLENBQUMsWUFBWTtpQ0FDekM7NkJBQ0YsQ0FBQzs0QkFDRixLQUFLLEVBQUUsWUFBWTs0QkFDbkIsT0FBTyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDO3lCQUM5QyxDQUFDO3FCQUNIO2lCQUNGO2dCQUNEO29CQUNFLFNBQVMsRUFBRSxRQUFRO29CQUNuQixPQUFPLEVBQUU7d0JBQ1AsSUFBSSx5Q0FBYyxDQUFDOzRCQUNqQixVQUFVLEVBQUUsZUFBZTs0QkFDM0IsS0FBSyxFQUFFLGlCQUFpQjs0QkFDeEIsTUFBTSxFQUFFLFlBQVk7NEJBQ3BCLFlBQVksRUFBRSxDQUFDLHVDQUFZLENBQUMsU0FBUyxFQUFFLEVBQUUsdUNBQVksQ0FBQyxNQUFNLENBQUMsZUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUMvRSxRQUFRLEVBQUUsQ0FBQzt5QkFDWixDQUFDO3dCQUNGLElBQUkseUNBQWMsQ0FBQzs0QkFDakIsVUFBVSxFQUFFLGFBQWE7NEJBQ3pCLEtBQUssRUFBRSxlQUFlOzRCQUN0QixNQUFNLEVBQUUsWUFBWTs0QkFDcEIsWUFBWSxFQUFFLENBQUMsdUNBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDdEMsUUFBUSxFQUFFLENBQUM7eUJBQ1osQ0FBQztxQkFDSDtpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBL0tELDRDQStLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QXBwLCBEdXJhdGlvbiwgU2VjcmV0VmFsdWUsIFN0YWNrLCBTdGFja1Byb3BzfSBmcm9tIFwiQGF3cy1jZGsvY29yZVwiO1xuaW1wb3J0IHtCdWNrZXR9IGZyb20gXCJAYXdzLWNkay9hd3MtczNcIjtcbmltcG9ydCB7U2VjdXJpdHlQb2xpY3lQcm90b2NvbCwgT3JpZ2luUHJvdG9jb2xQb2xpY3ksU1NMTWV0aG9kLCAgQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbiwgT3JpZ2luQWNjZXNzSWRlbnRpdHksIFByaWNlQ2xhc3N9IGZyb20gJ0Bhd3MtY2RrL2F3cy1jbG91ZGZyb250J1xuaW1wb3J0IHtQb2xpY3lTdGF0ZW1lbnR9IGZyb20gXCJAYXdzLWNkay9hd3MtaWFtXCI7XG5pbXBvcnQge0J1aWxkU3BlYywgTGludXhCdWlsZEltYWdlLCBQaXBlbGluZVByb2plY3R9IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZWJ1aWxkXCI7XG5pbXBvcnQge0FydGlmYWN0LCBQaXBlbGluZX0gZnJvbSBcIkBhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmVcIjtcbmltcG9ydCB7XG4gIENhY2hlQ29udHJvbCxcbiAgQ29kZUJ1aWxkQWN0aW9uLFxuICBHaXRIdWJTb3VyY2VBY3Rpb24sXG4gIEdpdEh1YlRyaWdnZXIsXG4gIFMzRGVwbG95QWN0aW9uXG59IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnNcIjtcbmltcG9ydCB7QVJlY29yZCwgSG9zdGVkWm9uZSwgUmVjb3JkVGFyZ2V0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLXJvdXRlNTNcIjtcbmltcG9ydCB7Q2VydGlmaWNhdGUsIENlcnRpZmljYXRlVmFsaWRhdGlvbn0gZnJvbSAnQGF3cy1jZGsvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5cbmltcG9ydCB7Q2xvdWRGcm9udFRhcmdldH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1yb3V0ZTUzLXRhcmdldHNcIjtcblxuZXhwb3J0IGNsYXNzIFJlYWN0U2FtcGxlU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKGFwcCwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHdlYmFwcEJ1Y2tldCA9IG5ldyBCdWNrZXQodGhpcywgJ1JlYWN0QnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogJ3JlYWN0LmJyaWFuc3VudGVyLmNvbScsXG4gICAgICB3ZWJzaXRlSW5kZXhEb2N1bWVudDogJ2luZGV4Lmh0bWwnLFxuICAgICAgd2Vic2l0ZUVycm9yRG9jdW1lbnQ6ICdlcnJvci5odG1sJyxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IHRydWVcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3VkRnJvbnRPQUkgPSBuZXcgT3JpZ2luQWNjZXNzSWRlbnRpdHkodGhpcywgJ09BSScsIHtcbiAgICAgIGNvbW1lbnQ6ICdPQUkgZm9yIHJlYWN0IHNhbXBsZSB3ZWJhcHAuJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3VkZnJvbnRTM0FjY2VzcyA9IG5ldyBQb2xpY3lTdGF0ZW1lbnQoKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkQWN0aW9ucygnczM6R2V0QnVja2V0KicpO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRBY3Rpb25zKCdzMzpHZXRPYmplY3QqJyk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZEFjdGlvbnMoJ3MzOkxpc3QqJyk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZFJlc291cmNlcyh3ZWJhcHBCdWNrZXQuYnVja2V0QXJuKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkUmVzb3VyY2VzKGAke3dlYmFwcEJ1Y2tldC5idWNrZXRBcm59LypgKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkQ2Fub25pY2FsVXNlclByaW5jaXBhbChcbiAgICAgIGNsb3VkRnJvbnRPQUkuY2xvdWRGcm9udE9yaWdpbkFjY2Vzc0lkZW50aXR5UzNDYW5vbmljYWxVc2VySWRcbiAgICApO1xuXG4gICAgd2ViYXBwQnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3koY2xvdWRmcm9udFMzQWNjZXNzKTtcblxuICAgIGNvbnN0IGhvc3RlZFpvbmUgPSBIb3N0ZWRab25lLmZyb21Mb29rdXAodGhpcywgJ0hvc3RlZFpvbmUnLCB7XG4gICAgICBkb21haW5OYW1lOiAnYnJpYW5zdW50ZXIuY29tJyxcbiAgICAgIHByaXZhdGVab25lOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgQ2VydGlmaWNhdGUodGhpcywgJ0NlcnRpZmljYXRlJywge1xuICAgICAgZG9tYWluTmFtZTogJ3JlYWN0LmJyaWFuc3VudGVyLmNvbScsXG4gICAgICB2YWxpZGF0aW9uOiBDZXJ0aWZpY2F0ZVZhbGlkYXRpb24uZnJvbURucyhob3N0ZWRab25lKSxcbiAgICB9KTtcblxuICAgIC8vIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uKHRoaXMsICdDbG91ZGZyb250Jywge1xuICAgIC8vICAgb3JpZ2luQ29uZmlnczogW1xuICAgIC8vICAgICB7XG4gICAgLy8gICAgICAgczNPcmlnaW5Tb3VyY2U6IHtcbiAgICAvLyAgICAgICAgIHMzQnVja2V0U291cmNlOiB3ZWJhcHBCdWNrZXQsXG4gICAgLy8gICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogY2xvdWRGcm9udE9BSVxuICAgIC8vICAgICAgIH0sXG4gICAgLy8gICAgICAgYmVoYXZpb3JzOiBbXG4gICAgLy8gICAgICAgICB7aXNEZWZhdWx0QmVoYXZpb3I6IHRydWV9XG4gICAgLy8gICAgICAgXVxuICAgIC8vICAgICB9XG4gICAgLy8gICBdLFxuICAgIC8vICAgZXJyb3JDb25maWd1cmF0aW9uczogW1xuICAgIC8vICAgICB7XG4gICAgLy8gICAgICAgZXJyb3JDb2RlOiA0MDQsXG4gICAgLy8gICAgICAgcmVzcG9uc2VDb2RlOiAyMDAsXG4gICAgLy8gICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9pbmRleC5odG1sJyxcbiAgICAvLyAgICAgICBlcnJvckNhY2hpbmdNaW5UdGw6IDBcbiAgICAvLyAgICAgfVxuICAgIC8vICAgXSxcbiAgICAvLyAgIHByaWNlQ2xhc3M6IFByaWNlQ2xhc3MuUFJJQ0VfQ0xBU1NfMTAwLFxuICAgIC8vICAgYWxpYXNDb25maWd1cmF0aW9uOiB7XG4gICAgLy8gICAgIGFjbUNlcnRSZWY6IGNlcnRpZmljYXRlLmNlcnRpZmljYXRlQXJuLFxuICAgIC8vICAgICBuYW1lczogWydyZWFjdC5icmlhbnN1bnRlci5jb20nXVxuICAgIC8vICAgfVxuICAgIC8vIH0pO1xuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uKHRoaXMsICdTaXRlRGlzdHJpYnV0aW9uJywge1xuICAgICAgYWxpYXNDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgYWNtQ2VydFJlZjogY2VydGlmaWNhdGUuY2VydGlmaWNhdGVBcm4sXG4gICAgICAgICAgbmFtZXM6IFsgJ3JlYWN0LmJyaWFuc3VudGVyLmNvbSddLFxuICAgICAgICAgIHNzbE1ldGhvZDogU1NMTWV0aG9kLlNOSSxcbiAgICAgICAgICBzZWN1cml0eVBvbGljeTogU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMV8yMDE2LFxuICAgICAgfSxcbiAgICAgIG9yaWdpbkNvbmZpZ3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgIGN1c3RvbU9yaWdpblNvdXJjZToge1xuICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogd2ViYXBwQnVja2V0LmJ1Y2tldFdlYnNpdGVEb21haW5OYW1lLFxuICAgICAgICAgICAgICAgICAgb3JpZ2luUHJvdG9jb2xQb2xpY3k6IE9yaWdpblByb3RvY29sUG9saWN5LkhUVFBfT05MWSxcbiAgICAgICAgICAgICAgfSwgICAgICAgICAgXG4gICAgICAgICAgICAgIGJlaGF2aW9ycyA6IFsge2lzRGVmYXVsdEJlaGF2aW9yOiB0cnVlfV0sXG4gICAgICAgICAgfVxuICAgICAgXVxuICB9KTtcbiAgICBuZXcgQVJlY29yZCh0aGlzLCAnQWxpYXMnLCB7XG4gICAgICB6b25lOiBob3N0ZWRab25lLFxuICAgICAgcmVjb3JkTmFtZTogJ3JlYWN0LXRlc3QnLFxuICAgICAgdGFyZ2V0OiBSZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyBDbG91ZEZyb250VGFyZ2V0KGRpc3RyaWJ1dGlvbikpXG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBidWlsZEh0bWxPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ2Jhc2UnKTtcbiAgICBjb25zdCBidWlsZFN0YXRpY091dHB1dCA9IG5ldyBBcnRpZmFjdCgnc3RhdGljJyk7XG5cbiAgICBuZXcgUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgc3RhZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdTb3VyY2UnLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAvLyBXaGVyZSB0aGUgc291cmNlIGNhbiBiZSBmb3VuZFxuICAgICBuZXcgR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdHaXRIdWInLFxuICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvYXV0aFRva2VuOiBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignZ2l0aHViLXRva2VuJyksXG4gICAgICBvd25lcjogJ2JyaWFuc3VudGVyJyxcbiAgICAgIHJlcG86ICdjZGstcmVhY3QnLFxuICAgICAgdHJpZ2dlcjogR2l0SHViVHJpZ2dlci5XRUJIT09LLFxuICAgIH0pLFxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YWdlTmFtZTogJ0J1aWxkJyxcbiAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgICAgICAgYWN0aW9uTmFtZTogJ1dlYmFwcCcsXG4gICAgICAgICAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ0J1aWxkJywge1xuICAgICAgICAgICAgICAgIHByb2plY3ROYW1lOiAnUmVhY3RTYW1wbGUnLFxuICAgICAgICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICAgICAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgICAgICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnY2QgZnJvbnRlbmQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ25wbSBpbnN0YWxsJ1xuICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kczogJ25wbSBydW4gYnVpbGQnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ3NlY29uZGFyeS1hcnRpZmFjdHMnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgW2J1aWxkSHRtbE91dHB1dC5hcnRpZmFjdE5hbWUgYXMgc3RyaW5nXToge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2Jhc2UtZGlyZWN0b3J5JzogJ2Zyb250ZW5kL2J1aWxkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgW2J1aWxkU3RhdGljT3V0cHV0LmFydGlmYWN0TmFtZSBhcyBzdHJpbmddOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnZnJvbnRlbmQvYnVpbGQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ3N0YXRpYy8qKi8qJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNF8wLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgICAgICAgIG91dHB1dHM6IFtidWlsZFN0YXRpY091dHB1dCwgYnVpbGRIdG1sT3V0cHV0XVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdEZXBsb3knLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgIG5ldyBTM0RlcGxveUFjdGlvbih7XG4gICAgICAgICAgICAgIGFjdGlvbk5hbWU6ICdTdGF0aWMtQXNzZXRzJyxcbiAgICAgICAgICAgICAgaW5wdXQ6IGJ1aWxkU3RhdGljT3V0cHV0LFxuICAgICAgICAgICAgICBidWNrZXQ6IHdlYmFwcEJ1Y2tldCxcbiAgICAgICAgICAgICAgY2FjaGVDb250cm9sOiBbQ2FjaGVDb250cm9sLnNldFB1YmxpYygpLCBDYWNoZUNvbnRyb2wubWF4QWdlKER1cmF0aW9uLmRheXMoNSkpXSxcbiAgICAgICAgICAgICAgcnVuT3JkZXI6IDFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IFMzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICAgICAgYWN0aW9uTmFtZTogJ0hUTUwtQXNzZXRzJyxcbiAgICAgICAgICAgICAgaW5wdXQ6IGJ1aWxkSHRtbE91dHB1dCxcbiAgICAgICAgICAgICAgYnVja2V0OiB3ZWJhcHBCdWNrZXQsXG4gICAgICAgICAgICAgIGNhY2hlQ29udHJvbDogW0NhY2hlQ29udHJvbC5ub0NhY2hlKCldLFxuICAgICAgICAgICAgICBydW5PcmRlcjogMlxuICAgICAgICAgICAgfSlcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9KTtcbiAgfVxufVxuIl19