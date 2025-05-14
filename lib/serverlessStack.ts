import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import { HttpApi, HttpIntegrationSubtype, HttpMethod, ParameterMapping } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpStepFunctionsIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { DefinitionBody, LogLevel, StateMachine, StateMachineType } from 'aws-cdk-lib/aws-stepfunctions';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { StateMachine as StepFunction } from 'aws-cdk-lib/aws-stepfunctions';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface ServerlessStackProps extends StackProps {
  stage: string;
  branch: string;
  removalPolicy: RemovalPolicy;
  auctionsTable: Table;
  bidsTable: Table;
  auctionItemsTable: Table;
  auctionLifecycleSfn: StepFunction;
  processAuctionStreamFunction: NodejsFunction;
}

export class ServerlessStack extends Stack {
  public readonly apiGateway: HttpApi;
  public readonly placeBidSfn: StateMachine;

  constructor(scope: Construct, id: string, props: ServerlessStackProps) {
    super(scope, id, props);

    // Create API Gateway
    this.apiGateway = new HttpApi(this, 'HttpApi', {
      apiName: `${props.branch}-AuctionAPI`,
      description: 'Entry point for demo auction application'
    });

    // Create a log group for the bid placement step function
    const placeBidLogGroup = new LogGroup(this, "PlaceBidExpSfnLG", {
      logGroupName: `${props.branch}-PlaceBidExpSfnLG`,
      removalPolicy: props.removalPolicy
    });

    // Create the bid placement step function
    this.placeBidSfn = new StateMachine(this, "PlaceBidExpSfn", {
      stateMachineName: `${props.branch}-PlaceBidExpSfn`,
      definitionBody: DefinitionBody.fromFile("src/placeBid.asl.yaml"),
      stateMachineType: StateMachineType.EXPRESS,
      definitionSubstitutions: {
        "AuctionsTableName": props.auctionsTable.tableName,
        "BidsTableName": props.bidsTable.tableName
      },
      logs: {
        destination: placeBidLogGroup,
        includeExecutionData: true,
        level: LogLevel.ALL
      },
    });

    // Grant the step function permissions to access the tables
    props.auctionsTable.grantFullAccess(this.placeBidSfn);
    props.bidsTable.grantFullAccess(this.placeBidSfn);

    // Add the bid placement route to API Gateway
    this.apiGateway.addRoutes({
      path: '/bids',
      methods: [HttpMethod.POST],
      integration: new HttpStepFunctionsIntegration("PlaceBidSfnIntegration", {
        stateMachine: this.placeBidSfn,
        subtype: HttpIntegrationSubtype.STEPFUNCTIONS_START_SYNC_EXECUTION,
        parameterMapping: new ParameterMapping()
          .custom('StateMachineArn', this.placeBidSfn.stateMachineArn)
          .custom('Input', '$request.body')
      })
    });

    // Outputs with clear, descriptive names
    new CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGateway.apiEndpoint,
      description: 'URL of the API Gateway endpoint',
      exportName: `${props.branch}-ApiGatewayUrl`
    });

    new CfnOutput(this, 'PlaceBidExpSfnName', {
      value: this.placeBidSfn.stateMachineName,
      description: 'Name of the Place Bid Express Step Function',
      exportName: `${props.branch}-PlaceBidExpSfnName`
    });

    new CfnOutput(this, 'PlaceBidExpSfnArn', {
      value: this.placeBidSfn.stateMachineArn,
      description: 'ARN of the Place Bid Express Step Function',
      exportName: `${props.branch}-PlaceBidExpSfnArn`
    });

    new CfnOutput(this, 'Region', {
      value: Stack.of(this).region,
      description: 'AWS Region',
      exportName: `${props.branch}-Region`
    });

    new CfnOutput(this, 'Branch', {
      value: props.branch,
      description: 'Branch name',
      exportName: `${props.branch}-Branch`
    });

    new CfnOutput(this, 'Stage', {
      value: props.stage,
      description: 'Deployment stage',
      exportName: `${props.branch}-Stage`
    });
  }
}
