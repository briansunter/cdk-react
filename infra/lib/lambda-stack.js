"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaStack = void 0;
const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const aws_lambda_nodejs_1 = require("@aws-cdk/aws-lambda-nodejs");
class LambdaStack extends cdk.Stack {
    constructor(scope, id, envName, props) {
        super(scope, id, props);
        const postFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'PostFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            // name of the exported function
            handler: 'handler',
            // file to use as entry point for our Lambda function
            entry: '../lambda/hello.js',
        });
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFFOUMsa0VBQTBEO0FBQzFELE1BQWEsV0FBWSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBRXhDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsT0FBZSxFQUFHLEtBQXNCO1FBQ3BGLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sWUFBWSxHQUFHLElBQUksa0NBQWMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzVELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsZ0NBQWdDO1lBQ2hDLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLHFEQUFxRDtZQUNyRCxLQUFLLEVBQUUsb0JBQW9CO1NBQzVCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWJELGtDQWFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHtCdWNrZXR9IGZyb20gXCJAYXdzLWNkay9hd3MtczNcIjtcbmltcG9ydCB7Tm9kZWpzRnVuY3Rpb259IGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEtbm9kZWpzJztcbmV4cG9ydCBjbGFzcyBMYW1iZGFTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIGVudk5hbWU6IHN0cmluZywgIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHBvc3RGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnUG9zdEZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzEyX1gsXG4gICAgICAvLyBuYW1lIG9mIHRoZSBleHBvcnRlZCBmdW5jdGlvblxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgLy8gZmlsZSB0byB1c2UgYXMgZW50cnkgcG9pbnQgZm9yIG91ciBMYW1iZGEgZnVuY3Rpb25cbiAgICAgIGVudHJ5OiAnLi4vbGFtYmRhL2hlbGxvLmpzJyxcbiAgICB9KTtcbiAgfVxufSJdfQ==