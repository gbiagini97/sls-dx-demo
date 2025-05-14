# Iteration 2: Improved Testing - Architecture

## Overview

This iteration builds on the initial spike by adding proper testing with Gherkin-style nomenclature and improved error handling.

## Components

### CDK Stack (`SlsDxDemoStack`)

A single stack containing all resources, with improved exports:

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

Same as Iteration 1, but with better access from the stack:

1. **AuctionItems Table**
   - Partition Key: `ID` (String)
   - Exposed as a public property of the stack

2. **Auctions Table**
   - Partition Key: `itemID` (String)
   - Sort Key: `startDate` (String)
   - Exposed as a public property of the stack

3. **Bids Table**
   - Partition Key: `auctionID` (String)
   - Sort Key: `userID` (String)
   - Exposed as a public property of the stack

### Lambda Function

1. **PlaceBidFunction**
   - Improved error handling with specific error messages
   - Better validation of input parameters
   - More detailed logging

### API Gateway

1. **AuctionApi**
   - Endpoint: `/bids` (POST)
   - URL exposed as a public property of the stack

## Testing Approach

Tests are structured using Gherkin-style nomenclature:

```typescript
describe('Given an open auction', () => {
  // Setup the open auction
  
  describe('When a valid bid is placed', () => {
    // Place a valid bid
    
    it('Then the bid should be accepted', async () => {
      // Verify the bid was accepted
    });
  });
});
```

### Test Scenarios

1. **Given an open auction, when a valid bid is placed, then the bid should be accepted**
   - Creates an auction with OPEN status
   - Places a valid bid
   - Verifies the bid is stored in DynamoDB

2. **Given an open auction, when a bid with invalid price is placed, then the bid should be rejected**
   - Creates an auction with OPEN status
   - Places a bid with negative price
   - Verifies the bid is rejected with appropriate error

3. **Given a closed auction, when a bid is placed, then the bid should be rejected**
   - Creates an auction with CLOSED status
   - Places a valid bid
   - Verifies the bid is rejected with appropriate error

## Utility Functions

Added utility functions to support testing:

1. **createAuction**: Create an auction in DynamoDB
2. **getAuction**: Retrieve an auction from DynamoDB
3. **createAuctionItem**: Create an auction item in DynamoDB

## Limitations

- Still no authentication or authorization
- No automatic auction lifecycle management
- No multi-environment support
