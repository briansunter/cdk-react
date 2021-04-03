"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactStack = void 0;
const cdk = require("@aws-cdk/core");
const aws_s3_1 = require("@aws-cdk/aws-s3");
const aws_cloudfront_1 = require("@aws-cdk/aws-cloudfront");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_route53_1 = require("@aws-cdk/aws-route53");
const aws_certificatemanager_1 = require("@aws-cdk/aws-certificatemanager");
const aws_route53_targets_1 = require("@aws-cdk/aws-route53-targets");
class ReactStack extends cdk.Stack {
    constructor(scope, id, envName, props) {
        super(scope, id, props);
        const webappBucket = new aws_s3_1.Bucket(this, "ReactBucket", {
            bucketName: `reactbriansunter-${envName}`,
            websiteIndexDocument: "index.html",
            websiteErrorDocument: "error.html",
        });
        const cloudFrontOAI = new aws_cloudfront_1.OriginAccessIdentity(this, "OAI", {
            comment: "OAI for react sample webapp.",
        });
        const cloudfrontS3Access = new aws_iam_1.PolicyStatement();
        cloudfrontS3Access.addActions("s3:GetBucket*");
        cloudfrontS3Access.addActions("s3:GetObject*");
        cloudfrontS3Access.addActions("s3:List*");
        cloudfrontS3Access.addResources(webappBucket.bucketArn);
        cloudfrontS3Access.addResources(`${webappBucket.bucketArn}/*`);
        cloudfrontS3Access.addCanonicalUserPrincipal(cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId);
        webappBucket.addToResourcePolicy(cloudfrontS3Access);
        const hostedZone = aws_route53_1.HostedZone.fromLookup(this, "HostedZone", {
            domainName: "briansunter.com",
            privateZone: false,
        });
        const certificate = new aws_certificatemanager_1.Certificate(this, "Certificate", {
            domainName: `${envName}.briansunter.com`,
            validation: aws_certificatemanager_1.CertificateValidation.fromDns(hostedZone),
        });
        const distribution = new aws_cloudfront_1.CloudFrontWebDistribution(this, "Cloudfront", {
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
            priceClass: aws_cloudfront_1.PriceClass.PRICE_CLASS_100,
            aliasConfiguration: {
                acmCertRef: certificate.certificateArn,
                names: [`${envName}.briansunter.com`],
            },
        });
        new aws_route53_1.ARecord(this, "Alias", {
            zone: hostedZone,
            recordName: envName,
            target: aws_route53_1.RecordTarget.fromAlias(new aws_route53_targets_1.CloudFrontTarget(distribution)),
        });
    }
}
exports.ReactStack = ReactStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3Qtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFFckMsNENBQXlDO0FBQ3pDLDREQUlpQztBQUNqQyw4Q0FBbUQ7QUFDbkQsc0RBQXlFO0FBQ3pFLDRFQUd5QztBQUN6QyxzRUFBZ0U7QUFFaEUsTUFBYSxVQUFXLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDdkMsWUFDRSxLQUFvQixFQUNwQixFQUFVLEVBQ1YsT0FBZSxFQUNmLEtBQXNCO1FBRXRCLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLE1BQU0sWUFBWSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDbkQsVUFBVSxFQUFFLG9CQUFvQixPQUFPLEVBQUU7WUFDekMsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxvQkFBb0IsRUFBRSxZQUFZO1NBQ25DLENBQUMsQ0FBQztRQUNILE1BQU0sYUFBYSxHQUFHLElBQUkscUNBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUMxRCxPQUFPLEVBQUUsOEJBQThCO1NBQ3hDLENBQUMsQ0FBQztRQUVILE1BQU0sa0JBQWtCLEdBQUcsSUFBSSx5QkFBZSxFQUFFLENBQUM7UUFDakQsa0JBQWtCLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQy9DLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUMvQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4RCxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxZQUFZLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQztRQUMvRCxrQkFBa0IsQ0FBQyx5QkFBeUIsQ0FDMUMsYUFBYSxDQUFDLCtDQUErQyxDQUM5RCxDQUFDO1FBRUYsWUFBWSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFckQsTUFBTSxVQUFVLEdBQUcsd0JBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUMzRCxVQUFVLEVBQUUsaUJBQWlCO1lBQzdCLFdBQVcsRUFBRSxLQUFLO1NBQ25CLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLElBQUksb0NBQVcsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3ZELFVBQVUsRUFBRSxHQUFHLE9BQU8sa0JBQWtCO1lBQ3hDLFVBQVUsRUFBRSw4Q0FBcUIsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO1NBQ3RELENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksMENBQXlCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNyRSxhQUFhLEVBQUU7Z0JBQ2I7b0JBQ0UsY0FBYyxFQUFFO3dCQUNkLGNBQWMsRUFBRSxZQUFZO3dCQUM1QixvQkFBb0IsRUFBRSxhQUFhO3FCQUNwQztvQkFDRCxTQUFTLEVBQUUsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDO2lCQUN6QzthQUNGO1lBQ0QsbUJBQW1CLEVBQUU7Z0JBQ25CO29CQUNFLFNBQVMsRUFBRSxHQUFHO29CQUNkLFlBQVksRUFBRSxHQUFHO29CQUNqQixnQkFBZ0IsRUFBRSxhQUFhO29CQUMvQixrQkFBa0IsRUFBRSxDQUFDO2lCQUN0QjthQUNGO1lBQ0QsVUFBVSxFQUFFLDJCQUFVLENBQUMsZUFBZTtZQUN0QyxrQkFBa0IsRUFBRTtnQkFDbEIsVUFBVSxFQUFFLFdBQVcsQ0FBQyxjQUFjO2dCQUN0QyxLQUFLLEVBQUUsQ0FBQyxHQUFHLE9BQU8sa0JBQWtCLENBQUM7YUFDdEM7U0FDRixDQUFDLENBQUM7UUFDSCxJQUFJLHFCQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUN6QixJQUFJLEVBQUUsVUFBVTtZQUNoQixVQUFVLEVBQUUsT0FBTztZQUNuQixNQUFNLEVBQUUsMEJBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxzQ0FBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNuRSxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFyRUQsZ0NBcUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gXCJAYXdzLWNkay9jb3JlXCI7XG5cbmltcG9ydCB7IEJ1Y2tldCB9IGZyb20gXCJAYXdzLWNkay9hd3MtczNcIjtcbmltcG9ydCB7XG4gIENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24sXG4gIE9yaWdpbkFjY2Vzc0lkZW50aXR5LFxuICBQcmljZUNsYXNzLFxufSBmcm9tIFwiQGF3cy1jZGsvYXdzLWNsb3VkZnJvbnRcIjtcbmltcG9ydCB7IFBvbGljeVN0YXRlbWVudCB9IGZyb20gXCJAYXdzLWNkay9hd3MtaWFtXCI7XG5pbXBvcnQgeyBBUmVjb3JkLCBIb3N0ZWRab25lLCBSZWNvcmRUYXJnZXQgfSBmcm9tIFwiQGF3cy1jZGsvYXdzLXJvdXRlNTNcIjtcbmltcG9ydCB7XG4gIENlcnRpZmljYXRlLFxuICBDZXJ0aWZpY2F0ZVZhbGlkYXRpb24sXG59IGZyb20gXCJAYXdzLWNkay9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyXCI7XG5pbXBvcnQgeyBDbG91ZEZyb250VGFyZ2V0IH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1yb3V0ZTUzLXRhcmdldHNcIjtcbmltcG9ydCB7IEFydGlmYWN0LCBQaXBlbGluZSB9IGZyb20gXCJAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lXCI7XG5leHBvcnQgY2xhc3MgUmVhY3RTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHNjb3BlOiBjZGsuQ29uc3RydWN0LFxuICAgIGlkOiBzdHJpbmcsXG4gICAgZW52TmFtZTogc3RyaW5nLFxuICAgIHByb3BzPzogY2RrLlN0YWNrUHJvcHNcbiAgKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG4gICAgY29uc3Qgd2ViYXBwQnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLCBcIlJlYWN0QnVja2V0XCIsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGByZWFjdGJyaWFuc3VudGVyLSR7ZW52TmFtZX1gLFxuICAgICAgd2Vic2l0ZUluZGV4RG9jdW1lbnQ6IFwiaW5kZXguaHRtbFwiLFxuICAgICAgd2Vic2l0ZUVycm9yRG9jdW1lbnQ6IFwiZXJyb3IuaHRtbFwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGNsb3VkRnJvbnRPQUkgPSBuZXcgT3JpZ2luQWNjZXNzSWRlbnRpdHkodGhpcywgXCJPQUlcIiwge1xuICAgICAgY29tbWVudDogXCJPQUkgZm9yIHJlYWN0IHNhbXBsZSB3ZWJhcHAuXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbG91ZGZyb250UzNBY2Nlc3MgPSBuZXcgUG9saWN5U3RhdGVtZW50KCk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZEFjdGlvbnMoXCJzMzpHZXRCdWNrZXQqXCIpO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRBY3Rpb25zKFwiczM6R2V0T2JqZWN0KlwiKTtcbiAgICBjbG91ZGZyb250UzNBY2Nlc3MuYWRkQWN0aW9ucyhcInMzOkxpc3QqXCIpO1xuICAgIGNsb3VkZnJvbnRTM0FjY2Vzcy5hZGRSZXNvdXJjZXMod2ViYXBwQnVja2V0LmJ1Y2tldEFybik7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZFJlc291cmNlcyhgJHt3ZWJhcHBCdWNrZXQuYnVja2V0QXJufS8qYCk7XG4gICAgY2xvdWRmcm9udFMzQWNjZXNzLmFkZENhbm9uaWNhbFVzZXJQcmluY2lwYWwoXG4gICAgICBjbG91ZEZyb250T0FJLmNsb3VkRnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eVMzQ2Fub25pY2FsVXNlcklkXG4gICAgKTtcblxuICAgIHdlYmFwcEJ1Y2tldC5hZGRUb1Jlc291cmNlUG9saWN5KGNsb3VkZnJvbnRTM0FjY2Vzcyk7XG5cbiAgICBjb25zdCBob3N0ZWRab25lID0gSG9zdGVkWm9uZS5mcm9tTG9va3VwKHRoaXMsIFwiSG9zdGVkWm9uZVwiLCB7XG4gICAgICBkb21haW5OYW1lOiBcImJyaWFuc3VudGVyLmNvbVwiLFxuICAgICAgcHJpdmF0ZVpvbmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgQ2VydGlmaWNhdGUodGhpcywgXCJDZXJ0aWZpY2F0ZVwiLCB7XG4gICAgICBkb21haW5OYW1lOiBgJHtlbnZOYW1lfS5icmlhbnN1bnRlci5jb21gLFxuICAgICAgdmFsaWRhdGlvbjogQ2VydGlmaWNhdGVWYWxpZGF0aW9uLmZyb21EbnMoaG9zdGVkWm9uZSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbih0aGlzLCBcIkNsb3VkZnJvbnRcIiwge1xuICAgICAgb3JpZ2luQ29uZmlnczogW1xuICAgICAgICB7XG4gICAgICAgICAgczNPcmlnaW5Tb3VyY2U6IHtcbiAgICAgICAgICAgIHMzQnVja2V0U291cmNlOiB3ZWJhcHBCdWNrZXQsXG4gICAgICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogY2xvdWRGcm9udE9BSSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJlaGF2aW9yczogW3sgaXNEZWZhdWx0QmVoYXZpb3I6IHRydWUgfV0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgZXJyb3JDb25maWd1cmF0aW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgZXJyb3JDb2RlOiA0MDQsXG4gICAgICAgICAgcmVzcG9uc2VDb2RlOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogXCIvaW5kZXguaHRtbFwiLFxuICAgICAgICAgIGVycm9yQ2FjaGluZ01pblR0bDogMCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBwcmljZUNsYXNzOiBQcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCxcbiAgICAgIGFsaWFzQ29uZmlndXJhdGlvbjoge1xuICAgICAgICBhY21DZXJ0UmVmOiBjZXJ0aWZpY2F0ZS5jZXJ0aWZpY2F0ZUFybixcbiAgICAgICAgbmFtZXM6IFtgJHtlbnZOYW1lfS5icmlhbnN1bnRlci5jb21gXSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgbmV3IEFSZWNvcmQodGhpcywgXCJBbGlhc1wiLCB7XG4gICAgICB6b25lOiBob3N0ZWRab25lLFxuICAgICAgcmVjb3JkTmFtZTogZW52TmFtZSxcbiAgICAgIHRhcmdldDogUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pKSxcbiAgICB9KTtcbiAgfVxufVxuIl19