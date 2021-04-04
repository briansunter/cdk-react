import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import {Bucket} from "@aws-cdk/aws-s3";
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export class LambdaStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, envName: string,  props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'DevEntriesTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const postFunction = new NodejsFunction(this, 'PostFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      // name of the exported function
      handler: 'handler',
      // file to use as entry point for our Lambda function
      entry: 'lambda/hello.js',
    });

    const getFunction = new NodejsFunction(this, 'GetFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'handler',
      entry: 'lambda/hello2.js',
      environment: {
        TABLE_NAME: table.tableName
      },
    });

    table.grantReadData(getFunction);
    const api = new apigateway.RestApi(this, 'hello-api', { });
    const getIntegration = new apigateway.LambdaIntegration(getFunction);

    const postIntegration = new apigateway.LambdaIntegration(postFunction);
    const v1 = api.root.addResource('v1');
    const echo = v1.addResource('entries');
             const getEntries = echo.addMethod('GET', getIntegration);
             const postEntry =  echo.addMethod('POST', postIntegration);
  }
}