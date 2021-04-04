import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import {Bucket} from "@aws-cdk/aws-s3";
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
export class LambdaStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, envName: string,  props?: cdk.StackProps) {
    super(scope, id, props);

    const postFunction = new NodejsFunction(this, 'PostFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      // name of the exported function
      handler: 'handler',
      // file to use as entry point for our Lambda function
      entry: 'lambda/hello.js',
    });

    const getFunction = new NodejsFunction(this, 'GetFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      // name of the exported function
      handler: 'handler2',
      // file to use as entry point for our Lambda function
      entry: 'lambda/hello2.js',
    });
    const api = new apigateway.RestApi(this, 'hello-api', { });
    const integration = new apigateway.LambdaIntegration(getFunction);

    const v1 = api.root.addResource('v1');
    const echo = v1.addResource('echo');
    const echoMethod = echo.addMethod('GET', integration);

  }
}