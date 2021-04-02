import * as cdk from "@aws-cdk/core";
import {
  CacheControl,
  CodeBuildAction,
  ManualApprovalAction,
  S3DeployAction,
} from "@aws-cdk/aws-codepipeline-actions";
import { App, Duration, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import { BlockPublicAccessOptions, Bucket } from "@aws-cdk/aws-s3";
import {
  SecurityPolicyProtocol,
  OriginProtocolPolicy,
  SSLMethod,
  CloudFrontWebDistribution,
  OriginAccessIdentity,
  PriceClass,
} from "@aws-cdk/aws-cloudfront";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { ARecord, HostedZone, RecordTarget } from "@aws-cdk/aws-route53";
import {
  Certificate,
  CertificateValidation,
} from "@aws-cdk/aws-certificatemanager";
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
export class ReactStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    envName: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);
    const webappBucket = new Bucket(this, "ReactBucket", {
      bucketName: `reactbriansunter-${envName}`,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
    });
    const cloudFrontOAI = new OriginAccessIdentity(this, "OAI", {
      comment: "OAI for react sample webapp.",
    });

    const cloudfrontS3Access = new PolicyStatement();
    cloudfrontS3Access.addActions("s3:GetBucket*");
    cloudfrontS3Access.addActions("s3:GetObject*");
    cloudfrontS3Access.addActions("s3:List*");
    cloudfrontS3Access.addResources(webappBucket.bucketArn);
    cloudfrontS3Access.addResources(`${webappBucket.bucketArn}/*`);
    cloudfrontS3Access.addCanonicalUserPrincipal(
      cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );

    webappBucket.addToResourcePolicy(cloudfrontS3Access);

    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: "briansunter.com",
      privateZone: false,
    });

    const certificate = new Certificate(this, "Certificate", {
      domainName: `${envName}.briansunter.com`,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    const distribution = new CloudFrontWebDistribution(this, "Cloudfront", {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: webappBucket,
            originAccessIdentity: cloudFrontOAI,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: "/index.html",
          errorCachingMinTtl: 0,
        },
      ],
      priceClass: PriceClass.PRICE_CLASS_100,
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
        names: [`${envName}.briansunter.com`],
      },
    });
    new ARecord(this, "Alias", {
      zone: hostedZone,
      recordName: envName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });
  }
}
