import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';
import {Bucket} from "@aws-cdk/aws-s3";
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { CorsHttpMethod, DomainName, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { ApiGatewayv2Domain } from "@aws-cdk/aws-route53-targets";
import { Certificate, CertificateValidation } from '@aws-cdk/aws-certificatemanager';
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
    
    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: "briansunter.com",
      privateZone: false,
    });


    const certificate = Certificate.fromCertificateArn(this, "Certificate", 'arn:aws:acm:us-east-1:847136656635:certificate/371a8024-f788-4e43-a685-5cdb52c40abf')
    
    // new Certificate(this, "Certificate", {
    //   domainName: `api-dev.briansunter.com`,
    //   validation: CertificateValidation.fromDns(hostedZone),
    // });

const domain = new DomainName(this, 'api_domain', {
  domainName: `api-dev.briansunter.com`,
  certificate:certificate 
})

    const api = new apigateway.HttpApi(this, 'hello-api', { 
defaultDomainMapping: {
    domainName: domain
    
  },
  corsPreflight: {
    allowCredentials: true,
    allowHeaders: ['Content-Type'],
    allowMethods: [CorsHttpMethod.ANY],
    allowOrigins: [
      'https://api-dev.briansunter.com',
      'http://localhost:3001'
    ]
  },
  apiName: 'devAPI',
    });

    // new ARecord(this, 'AliasRecord', {
    //   zone: hostedZone,
    //   target: RecordTarget.fromAlias(new ApiGatewayv2Domain(domain)),
    // });

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