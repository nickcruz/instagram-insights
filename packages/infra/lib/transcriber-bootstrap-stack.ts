import {
  CfnOutput,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

type TranscriberBootstrapStackProps = StackProps & {
  repositoryName: string;
};

export class TranscriberBootstrapStack extends Stack {
  readonly repository: ecr.Repository;

  constructor(
    scope: Construct,
    id: string,
    props: TranscriberBootstrapStackProps,
  ) {
    super(scope, id, props);

    this.repository = new ecr.Repository(this, "TranscriberRepository", {
      repositoryName: props.repositoryName,
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.RETAIN,
      emptyOnDelete: false,
    });

    new CfnOutput(this, "RepositoryName", {
      value: this.repository.repositoryName,
    });

    new CfnOutput(this, "RepositoryUri", {
      value: this.repository.repositoryUri,
    });
  }
}
