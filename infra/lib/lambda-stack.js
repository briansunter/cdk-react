"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaStack = void 0;
const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const apigateway = require("@aws-cdk/aws-apigateway");
const aws_lambda_nodejs_1 = require("@aws-cdk/aws-lambda-nodejs");
const dynamodb = require("@aws-cdk/aws-dynamodb");
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
        });
        const getFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: 'handler',
            entry: 'lambda/hello2.js',
            environment: {
                TABLE_NAME: table.tableName
            },
        });
        table.grantReadData(getFunction);
        const api = new apigateway.RestApi(this, 'hello-api', {});
        const getIntegration = new apigateway.LambdaIntegration(getFunction);
        const postIntegration = new apigateway.LambdaIntegration(postFunction);
        const v1 = api.root.addResource('v1');
        const echo = v1.addResource('entries');
        const getEntries = echo.addMethod('GET', getIntegration);
        const postEntry = echo.addMethod('POST', postIntegration);
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsc0RBQXNEO0FBRXRELGtFQUEwRDtBQUMxRCxrREFBa0Q7QUFFbEQsTUFBYSxXQUFZLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFFeEMsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxPQUFlLEVBQUcsS0FBc0I7UUFDcEYsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUN4RCxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1NBQ2xELENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksa0NBQWMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzVELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsZ0NBQWdDO1lBQ2hDLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLHFEQUFxRDtZQUNyRCxLQUFLLEVBQUUsaUJBQWlCO1NBQ3pCLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLElBQUksa0NBQWMsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQzFELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLFNBQVM7WUFDbEIsS0FBSyxFQUFFLGtCQUFrQjtZQUN6QixXQUFXLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLEtBQUssQ0FBQyxTQUFTO2FBQzVCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNqQyxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFHLENBQUMsQ0FBQztRQUMzRCxNQUFNLGNBQWMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVyRSxNQUFNLGVBQWUsR0FBRyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN2RSxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sU0FBUyxHQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7Q0FDRjtBQXJDRCxrQ0FxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCB7QnVja2V0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLXMzXCI7XG5pbXBvcnQge05vZGVqc0Z1bmN0aW9ufSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdAYXdzLWNkay9hd3MtZHluYW1vZGInO1xuXG5leHBvcnQgY2xhc3MgTGFtYmRhU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBlbnZOYW1lOiBzdHJpbmcsICBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB0YWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnRGV2RW50cmllc1RhYmxlJywge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNUXG4gICAgfSk7XG5cbiAgICBjb25zdCBwb3N0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1Bvc3RGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xMl9YLFxuICAgICAgLy8gbmFtZSBvZiB0aGUgZXhwb3J0ZWQgZnVuY3Rpb25cbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIC8vIGZpbGUgdG8gdXNlIGFzIGVudHJ5IHBvaW50IGZvciBvdXIgTGFtYmRhIGZ1bmN0aW9uXG4gICAgICBlbnRyeTogJ2xhbWJkYS9oZWxsby5qcycsXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTJfWCxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIGVudHJ5OiAnbGFtYmRhL2hlbGxvMi5qcycsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiB0YWJsZS50YWJsZU5hbWVcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0YWJsZS5ncmFudFJlYWREYXRhKGdldEZ1bmN0aW9uKTtcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdoZWxsby1hcGknLCB7IH0pO1xuICAgIGNvbnN0IGdldEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0RnVuY3Rpb24pO1xuXG4gICAgY29uc3QgcG9zdEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocG9zdEZ1bmN0aW9uKTtcbiAgICBjb25zdCB2MSA9IGFwaS5yb290LmFkZFJlc291cmNlKCd2MScpO1xuICAgIGNvbnN0IGVjaG8gPSB2MS5hZGRSZXNvdXJjZSgnZW50cmllcycpO1xuICAgICAgICAgICAgIGNvbnN0IGdldEVudHJpZXMgPSBlY2hvLmFkZE1ldGhvZCgnR0VUJywgZ2V0SW50ZWdyYXRpb24pO1xuICAgICAgICAgICAgIGNvbnN0IHBvc3RFbnRyeSA9ICBlY2hvLmFkZE1ldGhvZCgnUE9TVCcsIHBvc3RJbnRlZ3JhdGlvbik7XG4gIH1cbn0iXX0=