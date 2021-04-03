import { LambdaStack } from "./lambda-stack";
import { Stage, Construct, StageProps } from "@aws-cdk/core";

export class LambdaStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    envName: string,
bucketName: string, objectName:string,
    props?: StageProps
  ) {
    super(scope, id, props);
    const lambdaStack= new LambdaStack(this, "Lambda", envName, bucketName , objectName);
  }
}
