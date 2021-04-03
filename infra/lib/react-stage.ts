import { ReactStack } from "./react-stack";
import { Stage, Construct, StageProps } from "@aws-cdk/core";

export class ReactStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    envName: string,
    props?: StageProps
  ) {
    super(scope, id, props);
    const reactStack = new ReactStack(this, "React", envName);
  }
}
