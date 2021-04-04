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
            entry: __dirname + '/lambda/hello.js',
        });
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFFOUMsa0VBQTBEO0FBQzFELE1BQWEsV0FBWSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBRXhDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsT0FBZSxFQUFHLEtBQXNCO1FBQ3BGLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sWUFBWSxHQUFHLElBQUksa0NBQWMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzVELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsZ0NBQWdDO1lBQ2hDLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLHFEQUFxRDtZQUNyRCxLQUFLLEVBQUUsU0FBUyxHQUFHLGtCQUFrQjtTQUN0QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFiRCxrQ0FhQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcbmltcG9ydCB7QnVja2V0fSBmcm9tIFwiQGF3cy1jZGsvYXdzLXMzXCI7XG5pbXBvcnQge05vZGVqc0Z1bmN0aW9ufSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhLW5vZGVqcyc7XG5leHBvcnQgY2xhc3MgTGFtYmRhU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBlbnZOYW1lOiBzdHJpbmcsICBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBwb3N0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1Bvc3RGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xMl9YLFxuICAgICAgLy8gbmFtZSBvZiB0aGUgZXhwb3J0ZWQgZnVuY3Rpb25cbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIC8vIGZpbGUgdG8gdXNlIGFzIGVudHJ5IHBvaW50IGZvciBvdXIgTGFtYmRhIGZ1bmN0aW9uXG4gICAgICBlbnRyeTogX19kaXJuYW1lICsgJy9sYW1iZGEvaGVsbG8uanMnLFxuICAgIH0pO1xuICB9XG59Il19