import { Construct } from 'constructs';
import { TableV2, AttributeType, Billing } from 'aws-cdk-lib/aws-dynamodb';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class SlsDxDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    // PK: id
    const itemsTable = new TableV2(this, 'ItemsTable', {
      tableName: 'Items',
      partitionKey: {
        name: 'ID',
        type: AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY,
      billing: Billing.onDemand()
    });


    // PK: itemID, SK: startDate
    const auctionsTable = new TableV2(this, 'AuctionsTable', {
      tableName: 'Auctions',
      partitionKey: {
        name: 'itemID',
        type: AttributeType.STRING
      },
      sortKey: {
        name: "startDate",
        type: AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY,
      billing: Billing.onDemand()
    });

    // PK: itemID#startDate, SK: userID
    const bidsTable = new TableV2(this, 'BidsTable', {
      tableName: 'Bids',
      partitionKey: {
        name: 'auctionID',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'userID',
        type: AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY,
      billing: Billing.onDemand()
    });


    const apigw = new HttpApi(this, 'HttpApi', {
      apiName: 'AuctionAPI',
      description: 'Entry point for demo auction application'
    })

    const placeBidFunction = new NodejsFunction(this, 'PlaceBid', {
      functionName: 'PlaceBid',
      runtime: Runtime.NODEJS_LATEST,
      architecture: Architecture.ARM_64,
      timeout: Duration.minutes(1),
      entry: './src/placeBid.ts',
      environment: {
        BIDS_TABLE_NAME: bidsTable.tableName
      }
    })

    bidsTable.grantReadWriteData(placeBidFunction)

    apigw.addRoutes({
      path: '/bids',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('PlaceBidFunction', placeBidFunction)
    })

    new CfnOutput(this, 'ApiGatewayUrl', {
      value: apigw.apiEndpoint
    })
    new CfnOutput(this, 'ItemsTableName', {
      value: itemsTable.tableName
    })
    new CfnOutput(this, "AuctionsTableName", {
      value: auctionsTable.tableName
    })
    new CfnOutput(this, "BidsTableName", {
      value: bidsTable.tableName
    })
    new CfnOutput(this, "Region", {
      value: Stack.of(this).region
    })
    new CfnOutput(this, "PlaceBidFunctionName", {
      value: placeBidFunction.functionName
    })

  }
}
