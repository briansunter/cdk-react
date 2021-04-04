import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';
import {Bucket} from "@aws-cdk/aws-s3";
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { HttpMethod } from '@aws-cdk/aws-apigatewayv2';

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
      entry: 'lambda/createEntry.js',
      environment: {
        TABLE_NAME: table.tableName
      },
    });

    table.grantWriteData(postFunction);

    const getFunction = new NodejsFunction(this, 'GetFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'handler',
      entry: 'lambda/getEntries.js',
      environment: {
        TABLE_NAME: table.tableName
      },
    });

    table.grantReadData(getFunction);
    
    const api = new apigateway.HttpApi(this, 'hello-api', { });
    const getIntegration = new LambdaProxyIntegration({handler: getFunction});
    const postIntegration = new LambdaProxyIntegration({handler: postFunction});
    api.addRoutes({
      path: "/entries",
      methods: [HttpMethod.GET],
      integration: getIntegration
    })
    api.addRoutes({
      path: "/entries",
      methods: [HttpMethod.POST],
      integration: postIntegration
    })
  }
}