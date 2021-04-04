"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaStack = void 0;
const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const apigateway = require("@aws-cdk/aws-apigatewayv2");
const aws_apigatewayv2_integrations_1 = require("@aws-cdk/aws-apigatewayv2-integrations");
const aws_lambda_nodejs_1 = require("@aws-cdk/aws-lambda-nodejs");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const aws_apigatewayv2_1 = require("@aws-cdk/aws-apigatewayv2");
class LambdaStack extends cdk.Stack {
    constructor(scope, id, envName, props) {
        super(scope, id, props);
        const table = new dynamodb.Table(this, 'DevEntriesTable', {
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        });
        const postFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'PostFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            // name of the exported function
            handler: 'handler',
            // file to use as entry point for our Lambda function
            entry: 'lambda/hello.js',
            environment: {
                TABLE_NAME: table.tableName
            },
        });
        table.grantWriteData(postFunction);
        const getFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: 'handler',
            entry: 'lambda/hello2.js',
            environment: {
                TABLE_NAME: table.tableName
            },
        });
        table.grantReadData(getFunction);
        const api = new apigateway.HttpApi(this, 'hello-api', {});
        const getIntegration = new aws_apigatewayv2_integrations_1.LambdaProxyIntegration({ handler: getFunction });
        const postIntegration = new aws_apigatewayv2_integrations_1.LambdaProxyIntegration({ handler: postFunction });
        api.addRoutes({
            path: "/entries",
            methods: [aws_apigatewayv2_1.HttpMethod.GET],
            integration: getIntegration
        });
        api.addRoutes({
            path: "/entries",
            methods: [aws_apigatewayv2_1.HttpMethod.POST],
            integration: postIntegration
        });
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsd0RBQXdEO0FBQ3hELDBGQUErRTtBQUUvRSxrRUFBMEQ7QUFDMUQsa0RBQWtEO0FBQ2xELGdFQUF1RDtBQUV2RCxNQUFhLFdBQVksU0FBUSxHQUFHLENBQUMsS0FBSztJQUV4QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLE9BQWUsRUFBRyxLQUFzQjtRQUNwRixLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEtBQUssR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3hELFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pFLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7U0FDbEQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxZQUFZLEdBQUcsSUFBSSxrQ0FBYyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDNUQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxnQ0FBZ0M7WUFDaEMsT0FBTyxFQUFFLFNBQVM7WUFDbEIscURBQXFEO1lBQ3JELEtBQUssRUFBRSxpQkFBaUI7WUFDeEIsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUzthQUM1QjtTQUNGLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFbkMsTUFBTSxXQUFXLEdBQUcsSUFBSSxrQ0FBYyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDMUQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsU0FBUztZQUNsQixLQUFLLEVBQUUsa0JBQWtCO1lBQ3pCLFdBQVcsRUFBRTtnQkFDWCxVQUFVLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDNUI7U0FDRixDQUFDLENBQUM7UUFFSCxLQUFLLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRWpDLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLEVBQUcsQ0FBQyxDQUFDO1FBQzNELE1BQU0sY0FBYyxHQUFHLElBQUksc0RBQXNCLENBQUMsRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFDLENBQUMsQ0FBQztRQUMxRSxNQUFNLGVBQWUsR0FBRyxJQUFJLHNEQUFzQixDQUFDLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBQyxDQUFDLENBQUM7UUFDNUUsR0FBRyxDQUFDLFNBQVMsQ0FBQztZQUNaLElBQUksRUFBRSxVQUFVO1lBQ2hCLE9BQU8sRUFBRSxDQUFDLDZCQUFVLENBQUMsR0FBRyxDQUFDO1lBQ3pCLFdBQVcsRUFBRSxjQUFjO1NBQzVCLENBQUMsQ0FBQTtRQUNGLEdBQUcsQ0FBQyxTQUFTLENBQUM7WUFDWixJQUFJLEVBQUUsVUFBVTtZQUNoQixPQUFPLEVBQUUsQ0FBQyw2QkFBVSxDQUFDLElBQUksQ0FBQztZQUMxQixXQUFXLEVBQUUsZUFBZTtTQUM3QixDQUFDLENBQUE7SUFDSixDQUFDO0NBQ0Y7QUFoREQsa0NBZ0RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheXYyJztcbmltcG9ydCB7IExhbWJkYVByb3h5SW50ZWdyYXRpb259IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5djItaW50ZWdyYXRpb25zJztcbmltcG9ydCB7QnVja2V0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLXMzXCI7XG5pbXBvcnQge05vZGVqc0Z1bmN0aW9ufSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdAYXdzLWNkay9hd3MtZHluYW1vZGInO1xuaW1wb3J0IHsgSHR0cE1ldGhvZCB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5djInO1xuXG5leHBvcnQgY2xhc3MgTGFtYmRhU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBlbnZOYW1lOiBzdHJpbmcsICBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB0YWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnRGV2RW50cmllc1RhYmxlJywge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNUXG4gICAgfSk7XG5cbiAgICBjb25zdCBwb3N0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1Bvc3RGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xMl9YLFxuICAgICAgLy8gbmFtZSBvZiB0aGUgZXhwb3J0ZWQgZnVuY3Rpb25cbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIC8vIGZpbGUgdG8gdXNlIGFzIGVudHJ5IHBvaW50IGZvciBvdXIgTGFtYmRhIGZ1bmN0aW9uXG4gICAgICBlbnRyeTogJ2xhbWJkYS9oZWxsby5qcycsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiB0YWJsZS50YWJsZU5hbWVcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0YWJsZS5ncmFudFdyaXRlRGF0YShwb3N0RnVuY3Rpb24pO1xuXG4gICAgY29uc3QgZ2V0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldEZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzEyX1gsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBlbnRyeTogJ2xhbWJkYS9oZWxsbzIuanMnLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGFibGUuZ3JhbnRSZWFkRGF0YShnZXRGdW5jdGlvbik7XG4gICAgXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuSHR0cEFwaSh0aGlzLCAnaGVsbG8tYXBpJywgeyB9KTtcbiAgICBjb25zdCBnZXRJbnRlZ3JhdGlvbiA9IG5ldyBMYW1iZGFQcm94eUludGVncmF0aW9uKHtoYW5kbGVyOiBnZXRGdW5jdGlvbn0pO1xuICAgIGNvbnN0IHBvc3RJbnRlZ3JhdGlvbiA9IG5ldyBMYW1iZGFQcm94eUludGVncmF0aW9uKHtoYW5kbGVyOiBwb3N0RnVuY3Rpb259KTtcbiAgICBhcGkuYWRkUm91dGVzKHtcbiAgICAgIHBhdGg6IFwiL2VudHJpZXNcIixcbiAgICAgIG1ldGhvZHM6IFtIdHRwTWV0aG9kLkdFVF0sXG4gICAgICBpbnRlZ3JhdGlvbjogZ2V0SW50ZWdyYXRpb25cbiAgICB9KVxuICAgIGFwaS5hZGRSb3V0ZXMoe1xuICAgICAgcGF0aDogXCIvZW50cmllc1wiLFxuICAgICAgbWV0aG9kczogW0h0dHBNZXRob2QuUE9TVF0sXG4gICAgICBpbnRlZ3JhdGlvbjogcG9zdEludGVncmF0aW9uXG4gICAgfSlcbiAgfVxufSJdfQ==