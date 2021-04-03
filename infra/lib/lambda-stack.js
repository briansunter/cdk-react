"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaStack = void 0;
const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const aws_s3_1 = require("@aws-cdk/aws-s3");
class LambdaStack extends cdk.Stack {
    constructor(scope, id, envName, bucketName, objectName, props) {
        super(scope, id, props);
        // defines an AWS Lambda resource
        const codeBucket = aws_s3_1.Bucket.fromBucketName(this, "CodeBucket", bucketName);
        const hello = new lambda.Function(this, 'HelloHandler', {
            runtime: lambda.Runtime.NODEJS_10_X,
            code: lambda.Code.fromBucket(codeBucket, objectName),
            handler: 'hello.handler' // file is "hello", function is "handler"
        });
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsNENBQXVDO0FBRXZDLE1BQWEsV0FBWSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3hDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsT0FBZSxFQUFFLFVBQWtCLEVBQUUsVUFBaUIsRUFBRSxLQUFzQjtRQUMxSCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4QixpQ0FBaUM7UUFDakMsTUFBTSxVQUFVLEdBQUcsZUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFBO1FBQ3hFLE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3RELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBQyxVQUFVLENBQUM7WUFDbkQsT0FBTyxFQUFFLGVBQWUsQ0FBZ0IseUNBQXlDO1NBQ2xGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQVhELGtDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHtCdWNrZXR9IGZyb20gXCJAYXdzLWNkay9hd3MtczNcIjtcblxuZXhwb3J0IGNsYXNzIExhbWJkYVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIGVudk5hbWU6IHN0cmluZywgYnVja2V0TmFtZTogc3RyaW5nLCBvYmplY3ROYW1lOnN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuICAgIC8vIGRlZmluZXMgYW4gQVdTIExhbWJkYSByZXNvdXJjZVxuICAgIGNvbnN0IGNvZGVCdWNrZXQgPSBCdWNrZXQuZnJvbUJ1Y2tldE5hbWUodGhpcywgXCJDb2RlQnVja2V0XCIsIGJ1Y2tldE5hbWUpXG4gICAgY29uc3QgaGVsbG8gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdIZWxsb0hhbmRsZXInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTBfWCwgICAgLy8gZXhlY3V0aW9uIGVudmlyb25tZW50XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQnVja2V0KGNvZGVCdWNrZXQsb2JqZWN0TmFtZSksXG4gICAgICBoYW5kbGVyOiAnaGVsbG8uaGFuZGxlcicgICAgICAgICAgICAgICAgLy8gZmlsZSBpcyBcImhlbGxvXCIsIGZ1bmN0aW9uIGlzIFwiaGFuZGxlclwiXG4gICAgfSk7XG4gIH1cbn0iXX0=