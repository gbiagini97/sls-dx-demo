import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { DefinitionBody, LogLevel, StateMachine, StateMachineType } from 'aws-cdk-lib/aws-stepfunctions';
import { Table, AttributeType, BillingMode, StreamViewType } from 'aws-cdk-lib/aws-dynamodb';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { CfnPipe } from 'aws-cdk-lib/aws-pipes';
import { Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Architecture, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

interface StatefulStackProps extends StackProps {
  stage: string;
  branch: string;
  removalPolicy: RemovalPolicy;
}

export class StatefulStack extends Stack {
  public readonly auctionsTable: Table;
  public readonly bidsTable: Table;
  public readonly auctionItemsTable: Table;
  public readonly auctionLifecycleSfn: StateMachine;
  public readonly processAuctionStreamFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: StatefulStackProps) {
    super(scope, id, props);

    // PK: id
    this.auctionItemsTable = new Table(this, 'AuctionItemsTable', {
      tableName: `${props.branch}-AuctionItems`,
      partitionKey: {
        name: 'ID',
        type: AttributeType.STRING
      },
      removalPolicy: props.removalPolicy,
      billingMode: BillingMode.PAY_PER_REQUEST
    });

    // PK: itemID, SK: startDate
    this.auctionsTable = new Table(this, 'AuctionsTable', {
      tableName: `${props.branch}-Auctions`,
      partitionKey: {
        name: 'itemID',
        type: AttributeType.STRING
      },
      sortKey: {
        name: "startDate",
        type: AttributeType.STRING
      },
      removalPolicy: props.removalPolicy,
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE
    });

    // PK: auctionID, SK: userID
    this.bidsTable = new Table(this, 'BidsTable', {
      tableName: `${props.branch}-Bids`,
      partitionKey: {
        name: 'auctionID',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'userID',
        type: AttributeType.STRING
      },
      removalPolicy: props.removalPolicy,
      billingMode: BillingMode.PAY_PER_REQUEST
    });

    // Create a log group for the auction lifecycle state machine
    const auctionLifecycleLogGroup = new LogGroup(this, 'AuctionLifecycleLogGroup', {
      logGroupName: `${props.branch}-AuctionLifecycleLogGroup`,
      removalPolicy: props.removalPolicy
    });

    // Create the auction lifecycle state machine
    this.auctionLifecycleSfn = new StateMachine(this, 'AuctionLifecycleSfn', {
      stateMachineName: `${props.branch}-AuctionLifecycleSfn`,
      stateMachineType: StateMachineType.STANDARD,
      definitionBody: DefinitionBody.fromFile('src/auctionLifecycle.asl.yaml'),
      definitionSubstitutions: {
        "AuctionsTableName": this.auctionsTable.tableName,
        "BidsTableName": this.bidsTable.tableName
      },
      logs: {
        destination: auctionLifecycleLogGroup,
        includeExecutionData: true,
        level: LogLevel.ALL
      },
      timeout: Duration.days(1) // Maximum allowed for Standard state machines
    });

    // Grant the state machine permissions to access the tables
    this.auctionsTable.grantReadWriteData(this.auctionLifecycleSfn);
    this.bidsTable.grantReadWriteData(this.auctionLifecycleSfn);

    // Create a DLQ for failed events
    const dlq = new Queue(this, 'AuctionEventsDLQ', {
      queueName: `${props.branch}-AuctionEventsDLQ`,
      removalPolicy: props.removalPolicy
    });

    // Create a role for the EventBridge Pipe
    const pipeRole = new Role(this, 'AuctionPipeRole', {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
      roleName: `${props.branch}-AuctionPipeRole`
    });

    // Grant the pipe role permissions to read from the DynamoDB stream
    pipeRole.addToPolicy(
      new PolicyStatement({
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams'
        ],
        resources: [this.auctionsTable.tableStreamArn!]
      })
    );

    // Grant the pipe role permissions to start execution of the state machine
    this.auctionLifecycleSfn.grantStartExecution(pipeRole);

    // Grant the pipe role permissions to send messages to the DLQ
    dlq.grantSendMessages(pipeRole);

    // Create the EventBridge Pipe to connect DynamoDB stream to Step Function
    const auctionPipe = new CfnPipe(this, 'AuctionStreamToStepFunction', {
      name: `${props.branch}-AuctionStreamToStepFunction`,
      source: this.auctionsTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
          batchSize: 1,
          maximumRetryAttempts: 3,
          deadLetterConfig: {
            arn: dlq.queueArn
          }
        },
        filterCriteria: {
          filters: [
            {
              pattern: JSON.stringify({
                eventName: ["INSERT", "MODIFY"]
              })
            }
          ]
        }
      },
      target: this.auctionLifecycleSfn.stateMachineArn,
      roleArn: pipeRole.roleArn
    });

    // Create the Lambda function to process the DynamoDB stream
    this.processAuctionStreamFunction = new NodejsFunction(this, 'ProcessAuctionStream', {
      functionName: `${props.branch}-ProcessAuctionStream`,
      runtime: Runtime.NODEJS_LATEST,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(30),
      entry: './src/processAuctionStream.ts',
      environment: {
        AUCTIONS_TABLE_NAME: this.auctionsTable.tableName
      },
      memorySize: 512 // Increase memory for faster processing
    });

    // Grant the Lambda function read/write permissions to the auctions table
    this.auctionsTable.grantReadWriteData(this.processAuctionStreamFunction);

    // Add the DynamoDB stream as an event source for the Lambda function
    this.processAuctionStreamFunction.addEventSource(new DynamoEventSource(this.auctionsTable, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 10,
      retryAttempts: 3,
      bisectBatchOnError: true, // Helps with error handling
      maxBatchingWindow: Duration.seconds(1) // Process events more quickly
    }));

    // Outputs with clear, descriptive names
    new CfnOutput(this, 'AuctionItemsTableName', {
      value: this.auctionItemsTable.tableName,
      description: 'Name of the AuctionItems table',
      exportName: `${props.branch}-AuctionItemsTableName`
    });

    new CfnOutput(this, 'AuctionsTableName', {
      value: this.auctionsTable.tableName,
      description: 'Name of the Auctions table',
      exportName: `${props.branch}-AuctionsTableName`
    });

    new CfnOutput(this, 'AuctionsTableArn', {
      value: this.auctionsTable.tableArn,
      description: 'ARN of the Auctions table',
      exportName: `${props.branch}-AuctionsTableArn`
    });

    new CfnOutput(this, 'AuctionsTableStreamArn', {
      value: this.auctionsTable.tableStreamArn!,
      description: 'ARN of the Auctions table stream',
      exportName: `${props.branch}-AuctionsTableStreamArn`
    });

    new CfnOutput(this, 'BidsTableName', {
      value: this.bidsTable.tableName,
      description: 'Name of the Bids table',
      exportName: `${props.branch}-BidsTableName`
    });

    new CfnOutput(this, 'BidsTableArn', {
      value: this.bidsTable.tableArn,
      description: 'ARN of the Bids table',
      exportName: `${props.branch}-BidsTableArn`
    });

    new CfnOutput(this, 'AuctionLifecycleStateMachineName', {
      value: this.auctionLifecycleSfn.stateMachineName,
      description: 'Name of the Auction Lifecycle State Machine',
      exportName: `${props.branch}-AuctionLifecycleStateMachineName`
    });

    new CfnOutput(this, 'AuctionLifecycleStateMachineArn', {
      value: this.auctionLifecycleSfn.stateMachineArn,
      description: 'ARN of the Auction Lifecycle State Machine',
      exportName: `${props.branch}-AuctionLifecycleStateMachineArn`
    });

    new CfnOutput(this, 'AuctionEventsDLQUrl', {
      value: dlq.queueUrl,
      description: 'URL of the Auction Events DLQ',
      exportName: `${props.branch}-AuctionEventsDLQUrl`
    });

    new CfnOutput(this, 'AuctionEventsDLQArn', {
      value: dlq.queueArn,
      description: 'ARN of the Auction Events DLQ',
      exportName: `${props.branch}-AuctionEventsDLQArn`
    });

    new CfnOutput(this, 'AuctionPipeName', {
      value: auctionPipe.name!,
      description: 'Name of the Auction EventBridge Pipe',
      exportName: `${props.branch}-AuctionPipeName`
    });

    new CfnOutput(this, 'ProcessAuctionStreamFunctionName', {
      value: this.processAuctionStreamFunction.functionName,
      description: 'Name of the Process Auction Stream Lambda Function',
      exportName: `${props.branch}-ProcessAuctionStreamFunctionName`
    });
  }
}
