# Iteration 4: Express Step Function - Architecture

## Overview

This iteration replaces the direct Lambda function with an Express Step Function for bid placement, providing better transaction handling and improved monitoring.

## Components

### CDK Stack (`SlsDxDemoStack`)

Single stack with Express Step Function:

```
SlsDxDemoStack
├── DynamoDB Tables
│   ├── AuctionItemsTable
│   ├── AuctionsTable
│   └── BidsTable
├── Step Functions
│   └── PlaceBidExpSfn (Express)
├── CloudWatch Logs
│   └── PlaceBidExpSfnLG
└── API Gateway
    └── /bids (POST) -> Step Functions Integration
```

### Express Step Function

Added Express Step Function for bid placement:

```yaml
Comment: "Express Step Function for placing bids on auctions"
StartAt: ValidateInput
States:
  ValidateInput:
    Type: Pass
    Next: GetAuction
    ResultPath: null

  GetAuction:
    Type: Task
    Resource: arn:aws:states:::aws-sdk:dynamodb:getItem
    Parameters:
      TableName: ${AuctionsTableName}
      Key:
        itemID:
          S.$: "States.ArrayGetItem(States.StringSplit($.auctionID, '#'), 0)"
        startDate:
          S.$: "States.ArrayGetItem(States.StringSplit($.auctionID, '#'), 1)"
    ResultPath: "$.auction"
    Next: CheckAuctionStatus
    Catch:
      - ErrorEquals: ["States.ALL"]
        ResultPath: "$.error"
        Next: FailState

  CheckAuctionStatus:
    Type: Choice
    Choices:
      - Variable: "$.auction.Item.status.S"
        StringEquals: "open"
        Next: PlaceBid
    Default: AuctionNotOpen

  AuctionNotOpen:
    Type: Pass
    Result: "Auction is not open for bidding"
    ResultPath: "$.error"
    Next: FailState

  PlaceBid:
    Type: Task
    Resource: arn:aws:states:::aws-sdk:dynamodb:putItem
    Parameters:
      TableName: ${BidsTableName}
      Item:
        auctionID:
          S.$: "$.auctionID"
        userID:
          S.$: "$.userID"
        bidPrice:
          N.$: "States.Format('{}', $.bidPrice)"
        createdAt:
          S.$: "$$.Execution.StartTime"
    ResultPath: "$.bidResult"
    Next: SuccessState
    Catch:
      - ErrorEquals: ["States.ALL"]
        ResultPath: "$.error"
        Next: FailState

  SuccessState:
    Type: Pass
    End: true
    Result:
      status: "success"
      message: "Bid placed successfully"
      bid:
        auctionID.$: "$.auctionID"
        userID.$: "$.userID"
        bidPrice.$: "$.bidPrice"
        createdAt.$: "$$.Execution.StartTime"

  FailState:
    Type: Fail
    Error: "BidPlacementError"
    Cause: "Failed to place bid"
```

### API Gateway Integration

Changed API Gateway integration to use Step Functions:

```typescript
httpApi.addRoutes({
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
```

### Testing

Enhanced testing to work with Step Functions:

```typescript
describe("Bid Placement", () => {
  const outputs: Outputs = loadConfig("outputs.json");
  
  describe("Given an open auction", () => {
    // ...
    
    describe("When a valid bid is placed", () => {
      beforeEach(async () => {
        // Place a bid using the API
        const res = await makeRequest<PlaceBidRequest>({
          url: outputs.ApiUrl,
          method: 'POST',
          path: "/bids"
        }, {
          auctionID: auctionID,
          userID: userID,
          bidPrice: bidPrice
        });

        placedBid = res.body;
      });

      it("Then the bid should be accepted", async () => {
        // Verify the response
        expect(placedBid.status).toEqual("success");
        
        // Verify the bid was stored in DynamoDB
        const retrievedBid = await getBid(outputs.BidsTableName, { 
          auctionID: auctionID, 
          userID: userID 
        });

        expect(retrievedBid).toBeDefined();
        expect(retrievedBid.auctionID).toEqual(auctionID);
        expect(retrievedBid.userID).toEqual(userID);
        expect(retrievedBid.bidPrice).toEqual(bidPrice);
      });
    });
  });
});
```

## Benefits of Express Step Function

1. **Transaction Handling**:
   - Atomic operations for bid placement
   - Better error handling with specific states

2. **Improved Monitoring**:
   - Detailed logging of each step
   - Visual workflow representation in AWS Console

3. **Simplified Code**:
   - No need for custom Lambda code
   - Direct integration with DynamoDB using AWS SDK service integrations

4. **Better Error Handling**:
   - Specific error states for different failure scenarios
   - Consistent error responses

## Limitations

- Still using a single stack for all resources
- No automatic auction lifecycle management
