# Iteration 6: Auction Lifecycle - Architecture

## Overview

This iteration adds auction lifecycle management with Step Functions and EventBridge Pipes for event-driven workflows.

## Components

### StatefulStack

Enhanced with auction lifecycle management:

```
StatefulStack
├── DynamoDB Tables
│   ├── AuctionItemsTable
│   ├── AuctionsTable (with Stream)
│   └── BidsTable
├── Step Functions
│   └── AuctionLifecycleSfn (Standard)
├── EventBridge Pipes
│   └── AuctionStreamToStepFunction
├── CloudWatch Logs
│   └── AuctionLifecycleLogGroup
└── SQS Queue
    └── AuctionEventsDLQ
```

### ServerlessStack

Same as Iteration 5:

```
ServerlessStack
├── Step Functions
│   └── PlaceBidExpSfn (Express)
├── CloudWatch Logs
│   └── PlaceBidExpSfnLG
└── API Gateway
    └── /bids (POST) -> Step Functions Integration
```

### Auction Lifecycle Step Function

Added Standard Step Function for auction lifecycle management:

```yaml
Comment: "State machine to manage auction lifecycle from start to end"
StartAt: LogInput
States:
  LogInput:
    Type: Pass
    Result: "Received input"
    ResultPath: "$.logging.input"
    Next: ExtractAuctionDetails

  ExtractAuctionDetails:
    Type: Pass
    Parameters:
      "itemID.$": "$.dynamodb.NewImage.itemID.S"
      "startDate.$": "$.dynamodb.NewImage.startDate.S"
      "endDate.$": "$.dynamodb.NewImage.endDate.S"
      "status.$": "$.dynamodb.NewImage.status.S"
    ResultPath: "$.auction"
    Next: CheckAuctionStatus

  CheckAuctionStatus:
    Type: Choice
    Choices:
      - Variable: "$.auction.status"
        StringEquals: "closed"
        Next: WaitForAuctionStart
      - Variable: "$.auction.status"
        StringEquals: "open"
        Next: WaitForAuctionEnd
    Default: SuccessState

  WaitForAuctionStart:
    Type: Wait
    TimestampPath: "$.auction.startDate"
    Next: UpdateAuctionToOpen

  UpdateAuctionToOpen:
    Type: Task
    Resource: arn:aws:states:::aws-sdk:dynamodb:updateItem
    Parameters:
      TableName: ${AuctionsTableName}
      Key:
        itemID:
          S.$: "$.auction.itemID"
        startDate:
          S.$: "$.auction.startDate"
      UpdateExpression: "SET #status = :status"
      ExpressionAttributeNames:
        "#status": "status"
      ExpressionAttributeValues:
        ":status":
          S: "open"
      ReturnValues: "ALL_NEW"
    ResultPath: "$.updateResult"
    Next: WaitForAuctionEnd

  WaitForAuctionEnd:
    Type: Wait
    TimestampPath: "$.auction.endDate"
    Next: GetWinningBid

  GetWinningBid:
    Type: Task
    Resource: arn:aws:states:::aws-sdk:dynamodb:query
    Parameters:
      TableName: ${BidsTableName}
      KeyConditionExpression: "auctionID = :auctionID"
      ExpressionAttributeValues:
        ":auctionID":
          S.$: "States.Format('{}#{}', $.auction.itemID, $.auction.startDate)"
      ScanIndexForward: false
      Limit: 1
    ResultPath: "$.winningBid"
    Next: CheckIfBidsExist

  CheckIfBidsExist:
    Type: Choice
    Choices:
      - Variable: "$.winningBid.Items[0]"
        IsPresent: true
        Next: CloseAuctionWithWinner
    Default: CloseAuctionWithoutWinner

  CloseAuctionWithWinner:
    Type: Task
    Resource: arn:aws:states:::aws-sdk:dynamodb:updateItem
    Parameters:
      TableName: ${AuctionsTableName}
      Key:
        itemID:
          S.$: "$.auction.itemID"
        startDate:
          S.$: "$.auction.startDate"
      UpdateExpression: "SET #status = :status, winningBidId = :winningBidId, winningUserId = :winningUserId, finalPrice = :finalPrice"
      ExpressionAttributeNames:
        "#status": "status"
      ExpressionAttributeValues:
        ":status":
          S: "closed"
        ":winningBidId":
          S.$: "$.winningBid.Items[0].auctionID.S"
        ":winningUserId":
          S.$: "$.winningBid.Items[0].userID.S"
        ":finalPrice":
          N.$: "$.winningBid.Items[0].bidPrice.N"
      ReturnValues: "ALL_NEW"
    ResultPath: "$.closeResult"
    Next: SuccessState

  CloseAuctionWithoutWinner:
    Type: Task
    Resource: arn:aws:states:::aws-sdk:dynamodb:updateItem
    Parameters:
      TableName: ${AuctionsTableName}
      Key:
        itemID:
          S.$: "$.auction.itemID"
        startDate:
          S.$: "$.auction.startDate"
      UpdateExpression: "SET #status = :status"
      ExpressionAttributeNames:
        "#status": "status"
      ExpressionAttributeValues:
        ":status":
          S: "closed"
      ReturnValues: "ALL_NEW"
    ResultPath: "$.closeResult"
    Next: SuccessState

  SuccessState:
    Type: Succeed
```

### EventBridge Pipe

Added EventBridge Pipe to connect DynamoDB stream to Step Function:

```typescript
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
```

### Testing

Added test for auction lifecycle:

```typescript
describe("Auction Lifecycle", () => {
  const outputs: Outputs = loadConfig("outputs.json", "StatefulStack");
  const ddbClient = new DynamoDBClient({ region: outputs.Region });
  const docClient = DynamoDBDocumentClient.from(ddbClient);

  describe("When an auction is created with a future start date", () => {
    let auction: Auction;
    
    beforeAll(async () => {
      // Create an auction with a start date in the near future
      const futureDate = new Date();
      futureDate.setSeconds(futureDate.getSeconds() + 3);
      
      const endDate = new Date(futureDate);
      endDate.setMinutes(endDate.getMinutes() + 5);
      
      auction = await createAuction(outputs.AuctionsTableName!, {
        itemID: `test-item-${Date.now()}`,
        startDate: futureDate.toISOString(),
        endDate: endDate.toISOString(),
        status: AuctionStatus.CLOSED
      });

      console.log("Created auction with future start time:", auction);
      expect(auction.status).toEqual(AuctionStatus.CLOSED);
    });

    it("should be automatically updated to OPEN status by the Step Function when start time is reached", async () => {
      // Wait for the Step Function to process the auction
      console.log("Waiting for start time to be reached and Step Function to process...");
      await sleep(8000); // Wait 8 seconds
      
      // Check if the auction status has been updated
      const { Item } = await docClient.send(new GetCommand({
        TableName: outputs.AuctionsTableName!,
        Key: {
          itemID: auction.itemID,
          startDate: auction.startDate
        }
      }));
      
      console.log("Retrieved auction after waiting:", Item);
      
      // Verify the auction was automatically updated to OPEN
      expect(Item).toBeDefined();
      expect(Item?.status).toEqual(AuctionStatus.OPEN);
      console.log("Auction was automatically updated to OPEN status by the Step Function");
    });
  });
});
```

## Auction Lifecycle

1. An auction is created with CLOSED status and a future start date
2. When the start time is reached, the auction status is updated to OPEN
3. Users can place bids on open auctions
4. When the end time is reached, the auction is closed and the winning bid is determined

## Benefits of Event-Driven Architecture

1. **Automatic Status Updates**:
   - Auctions automatically open when start time is reached
   - Auctions automatically close when end time is reached

2. **Decoupled Components**:
   - DynamoDB stream events trigger Step Function executions
   - No need for polling or scheduled tasks

3. **Scalable Architecture**:
   - EventBridge Pipes handle high-volume event processing
   - Step Functions manage long-running workflows

4. **Improved Reliability**:
   - Dead-letter queue for failed events
   - Retry mechanisms for transient failures
