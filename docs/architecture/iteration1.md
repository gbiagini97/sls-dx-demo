# Iteration 1: Initial Spike - Architecture

## Overview

The initial spike implements a basic serverless auction system with a single CDK stack containing all resources.

## Components

### CDK Stack (`SlsDxDemoStack`)

A single stack containing all resources:

```
SlsDxDemoStack
├── DynamoDB Tables
│   ├── AuctionItemsTable
│   ├── AuctionsTable
│   └── BidsTable
├── Lambda Function
│   └── PlaceBidFunction
└── API Gateway
    └── /bids (POST)
```

### DynamoDB Tables

1. **AuctionItems Table**
   - Partition Key: `ID` (String)
   - Purpose: Store information about items available for auction

2. **Auctions Table**
   - Partition Key: `itemID` (String)
   - Sort Key: `startDate` (String)
   - Purpose: Store auction details including status, start and end times

3. **Bids Table**
   - Partition Key: `auctionID` (String)
   - Sort Key: `userID` (String)
   - Purpose: Store bids placed on auctions

### Lambda Function

1. **PlaceBidFunction**
   - Purpose: Handle bid placement requests
   - Input: API Gateway event with bid details
   - Process:
     1. Validate input parameters
     2. Check if auction exists and is open
     3. Place bid in DynamoDB
     4. Return success/failure response

### API Gateway

1. **AuctionApi**
   - Endpoint: `/bids` (POST)
   - Integration: Lambda integration with PlaceBidFunction
   - Purpose: Expose bid placement functionality to clients

## Data Flow

1. Client sends POST request to `/bids` with bid details
2. API Gateway forwards request to PlaceBidFunction
3. PlaceBidFunction validates request and checks auction status
4. If valid, PlaceBidFunction stores bid in Bids table
5. Response is returned to client

## Limitations

- No authentication or authorization
- No automatic auction lifecycle management
- Limited error handling
- Basic testing that doesn't work properly
- No multi-environment support
