"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaStack = void 0;
const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const apigateway = require("@aws-cdk/aws-apigateway");
const aws_lambda_nodejs_1 = require("@aws-cdk/aws-lambda-nodejs");
class LambdaStack extends cdk.Stack {
    constructor(scope, id, envName, props) {
        super(scope, id, props);
        const postFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'PostFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            // name of the exported function
            handler: 'handler',
            // file to use as entry point for our Lambda function
            entry: 'lambda/hello.js',
        });
        const getFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            // name of the exported function
            handler: 'handler2',
            // file to use as entry point for our Lambda function
            entry: 'lambda/hello2.js',
        });
        const api = new apigateway.RestApi(this, 'hello-api', {});
        const integration = new apigateway.LambdaIntegration(getFunction);
        const v1 = api.root.addResource('v1');
        const echo = v1.addResource('echo');
        const echoMethod = echo.addMethod('GET', integration, { apiKeyRequired: true });
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsc0RBQXNEO0FBRXRELGtFQUEwRDtBQUMxRCxNQUFhLFdBQVksU0FBUSxHQUFHLENBQUMsS0FBSztJQUV4QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLE9BQWUsRUFBRyxLQUFzQjtRQUNwRixLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLFlBQVksR0FBRyxJQUFJLGtDQUFjLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUM1RCxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLGdDQUFnQztZQUNoQyxPQUFPLEVBQUUsU0FBUztZQUNsQixxREFBcUQ7WUFDckQsS0FBSyxFQUFFLGlCQUFpQjtTQUN6QixDQUFDLENBQUM7UUFFSCxNQUFNLFdBQVcsR0FBRyxJQUFJLGtDQUFjLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUMxRCxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLGdDQUFnQztZQUNoQyxPQUFPLEVBQUUsVUFBVTtZQUNuQixxREFBcUQ7WUFDckQsS0FBSyxFQUFFLGtCQUFrQjtTQUMxQixDQUFDLENBQUM7UUFDSCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFHLENBQUMsQ0FBQztRQUMzRCxNQUFNLFdBQVcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVsRSxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRWxGLENBQUM7Q0FDRjtBQTVCRCxrQ0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCB7QnVja2V0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLXMzXCI7XG5pbXBvcnQge05vZGVqc0Z1bmN0aW9ufSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhLW5vZGVqcyc7XG5leHBvcnQgY2xhc3MgTGFtYmRhU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBlbnZOYW1lOiBzdHJpbmcsICBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBwb3N0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1Bvc3RGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xMl9YLFxuICAgICAgLy8gbmFtZSBvZiB0aGUgZXhwb3J0ZWQgZnVuY3Rpb25cbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIC8vIGZpbGUgdG8gdXNlIGFzIGVudHJ5IHBvaW50IGZvciBvdXIgTGFtYmRhIGZ1bmN0aW9uXG4gICAgICBlbnRyeTogJ2xhbWJkYS9oZWxsby5qcycsXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTJfWCxcbiAgICAgIC8vIG5hbWUgb2YgdGhlIGV4cG9ydGVkIGZ1bmN0aW9uXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcjInLFxuICAgICAgLy8gZmlsZSB0byB1c2UgYXMgZW50cnkgcG9pbnQgZm9yIG91ciBMYW1iZGEgZnVuY3Rpb25cbiAgICAgIGVudHJ5OiAnbGFtYmRhL2hlbGxvMi5qcycsXG4gICAgfSk7XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnaGVsbG8tYXBpJywgeyB9KTtcbiAgICBjb25zdCBpbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldEZ1bmN0aW9uKTtcblxuICAgIGNvbnN0IHYxID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3YxJyk7XG4gICAgY29uc3QgZWNobyA9IHYxLmFkZFJlc291cmNlKCdlY2hvJyk7XG4gICAgY29uc3QgZWNob01ldGhvZCA9IGVjaG8uYWRkTWV0aG9kKCdHRVQnLCBpbnRlZ3JhdGlvbiwgeyBhcGlLZXlSZXF1aXJlZDogdHJ1ZSB9KTtcblxuICB9XG59Il19