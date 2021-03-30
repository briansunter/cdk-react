import {App, Duration, SecretValue, Stack, StackProps} from "@aws-cdk/core";
import {Bucket} from "@aws-cdk/aws-s3";
import {CloudFrontWebDistribution, OriginAccessIdentity, PriceClass} from '@aws-cdk/aws-cloudfront'
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {BuildSpec, LinuxBuildImage, PipelineProject} from "@aws-cdk/aws-codebuild";
import {Artifact, Pipeline} from "@aws-cdk/aws-codepipeline";
import {
  CacheControl,
  CodeBuildAction,
  GitHubSourceAction,
  GitHubTrigger,
  S3DeployAction
} from "@aws-cdk/aws-codepipeline-actions";
import {ARecord, HostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {Certificate, CertificateValidation} from '@aws-cdk/aws-certificatemanager';

import {CloudFrontTarget} from "@aws-cdk/aws-route53-targets";

export class ReactSampleStack extends Stack {

  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    const webappBucket = new Bucket(this, 'ReactBucket', {
      bucketName: 'brians-react-cdk'
    });

    const cloudFrontOAI = new OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for react sample webapp.',
    });

    const cloudfrontS3Access = new PolicyStatement();
    cloudfrontS3Access.addActions('s3:GetBucket*');
    cloudfrontS3Access.addActions('s3:GetObject*');
    cloudfrontS3Access.addActions('s3:List*');
    cloudfrontS3Access.addResources(webappBucket.bucketArn);
    cloudfrontS3Access.addResources(`${webappBucket.bucketArn}/*`);
    cloudfrontS3Access.addCanonicalUserPrincipal(
      cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );

    webappBucket.addToResourcePolicy(cloudfrontS3Access);

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'briansunter.com',
      privateZone: false
    });

    const certificate = new Certificate(this, 'Certificate', {
      domainName: 'react.briansunter.com',
      validation: CertificateValidation.fromDns(hostedZone),
    });

    const distribution = new CloudFrontWebDistribution(this, 'Cloudfront', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: webappBucket,
            originAccessIdentity: cloudFrontOAI
          },
          behaviors: [
            {isDefaultBehavior: true}
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
      priceClass: PriceClass.PRICE_CLASS_100,
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
        names: ['react.briansunter.com']
      }
    });

    new ARecord(this, 'Alias', {
      zone: hostedZone,
      recordName: 'react-test',
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution))
    });

    const sourceOutput = new Artifact();
    const buildHtmlOutput = new Artifact('base');
    const buildStaticOutput = new Artifact('static');

    new Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
    // Where the source can be found
     new GitHubSourceAction({
      actionName: 'GitHub',
      output: sourceOutput,
      oauthToken: SecretValue.secretsManager('github-token'),
      owner: 'briansunter',
      repo: 'cdk-react',
      trigger: GitHubTrigger.WEBHOOK,
    }),
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new CodeBuildAction({
              actionName: 'Webapp',
              project: new PipelineProject(this, 'Build', {
                projectName: 'ReactSample',
                buildSpec: BuildSpec.fromObject({
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
                      [buildHtmlOutput.artifactName as string]: {
                        'base-directory': 'build',
                        files: [
                          '*'
                        ]
                      },
                      [buildStaticOutput.artifactName as string]: {
                        'base-directory': 'build',
                        files: [
                          'static/**/*'
                        ]
                      }
                    }
                  }
                }),
                environment: {
                  buildImage: LinuxBuildImage.STANDARD_4_0,
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
            new S3DeployAction({
              actionName: 'Static-Assets',
              input: buildStaticOutput,
              bucket: webappBucket,
              cacheControl: [CacheControl.setPublic(), CacheControl.maxAge(Duration.days(5))],
              runOrder: 1
            }),
            new S3DeployAction({
              actionName: 'HTML-Assets',
              input: buildHtmlOutput,
              bucket: webappBucket,
              cacheControl: [CacheControl.noCache()],
              runOrder: 2
            })
          ]
        }
      ]
    });
  }
}
