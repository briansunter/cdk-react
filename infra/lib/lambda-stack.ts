import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { CorsHttpMethod, DomainName, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { ApiGatewayv2Domain } from "@aws-cdk/aws-route53-targets";
import { Certificate, CertificateValidation } from '@aws-cdk/aws-certificatemanager';
import { UserPool } from '@aws-cdk/aws-cognito';
import { HttpUserPoolAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers";

const origins = {
  local: 'http://localhost:3001',
  dev: 'https://dev.briansunter.com'
}
function getOrigins(env:string){
  if (env==='local'){
    return origins.local;
  } else {
    return origins.dev;
  }
}

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
        TABLE_NAME: table.tableName,
        CORS_ORIGIN: getOrigins(envName)
      },
    });

    table.grantWriteData(postFunction);

    const getFunction = new NodejsFunction(this, 'GetFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'handler',
      entry: 'lambda/getEntries.js',
      environment: {
        TABLE_NAME: table.tableName,
        CORS_ORIGIN: getOrigins(envName)
      },
    });

    table.grantReadData(getFunction);
    
    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: "briansunter.com",
      privateZone: false,
    });


    const certificate = Certificate.fromCertificateArn(this, "Certificate", 'arn:aws:acm:us-east-1:847136656635:certificate/b3d402d7-84e0-4329-863e-fad53ae4a2d2')
    
    // new Certificate(this, "Certificate", {
    //   domainName: `api-dev.briansunter.com`,
    //   validation: CertificateValidation.fromDns(hostedZone),
    // });

const domain = new DomainName(this, 'api_domain', {
  domainName: `api-dev.briansunter.com`,
  certificate:certificate 
})
const userPool = new UserPool(this, 'UserPool');
const userPoolClient = userPool.addClient('UserPoolClient');

const authorizer = new HttpUserPoolAuthorizer({
  userPool,
  userPoolClient,
});

    const api = new apigateway.HttpApi(this, 'hello-api', { 
      defaultAuthorizer: authorizer,
      defaultDomainMapping: {
      domainName: domain
  },
  corsPreflight: {
    allowCredentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: [CorsHttpMethod.ANY],
    allowOrigins: [
      getOrigins(envName)
    ]
  },
  apiName: 'devAPI',
    });

    new ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: "api-dev.briansunter.com",
      target: RecordTarget.fromAlias(new ApiGatewayv2Domain(domain)),
     });

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