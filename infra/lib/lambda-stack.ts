import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import {Bucket} from "@aws-cdk/aws-s3";

export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, envName: string, bucketName: string, objectName:string, props?: cdk.StackProps) {
    super(scope, id, props);
    // defines an AWS Lambda resource
    const codeBucket = Bucket.fromBucketName(this, "CodeBucket", bucketName)
    const lambdaCode = lambda.Code.fromBucket(codeBucket,objectName);
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,    // execution environment
      code: lambdaCode,
      handler: 'hello.handler'                // file is "hello", function is "handler"
    });
  }
}