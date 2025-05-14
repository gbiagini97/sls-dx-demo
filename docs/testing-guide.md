# Testing Guide

This guide explains how to run tests for the Serverless Auction System.

## Test Structure

Tests are organized using Gherkin-style nomenclature:

- **Given**: The initial state or context
- **When**: The action being tested
- **Then**: The expected outcome

Example:
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

## Test Types

### 1. Bid Placement Tests

Tests the ability to place bids on auctions:

- Verifies that bids can be placed on open auctions
- Verifies that bids are rejected for closed auctions
- Verifies that invalid bids are rejected

### 2. Auction Lifecycle Tests

Tests the automatic lifecycle management of auctions:

- Verifies that auctions automatically open when start time is reached
- Verifies that auctions automatically close when end time is reached
- Verifies that winning bids are correctly determined

## Running Tests

### Local Development

```bash
# Run all tests against dev environment
npm run test:dev

# Run specific tests
npm run test:dev -- -t "Bid Placement"
npm run test:dev -- -t "Auction Lifecycle"
```

### Test Environment

```bash
# Run all tests against test environment
npm run test:test

# Run specific tests
npm run test:test -- -t "Bid Placement"
npm run test:test -- -t "Auction Lifecycle"
```

### Production Environment

```bash
# Run all tests against production environment
npm run test:prod

# Run specific tests
npm run test:prod -- -t "Bid Placement"
npm run test:prod -- -t "Auction Lifecycle"
```

## Test Prerequisites

Before running tests, ensure:

1. The stacks are deployed to the target environment
2. The outputs.json file is up to date
3. AWS credentials are configured for the target environment

## Test Utilities

The project includes several utility functions to support testing:

### Auction Utilities

- `createAuction`: Create an auction in DynamoDB
- `getAuction`: Retrieve an auction from DynamoDB

### Auction Item Utilities

- `createAuctionItem`: Create an auction item in DynamoDB

### Bid Utilities

- `getBid`: Retrieve a bid from DynamoDB

### API Gateway Utilities

- `makeRequest`: Make a request to the API Gateway

### Miscellaneous Utilities

- `sleep`: Wait for a specified number of milliseconds
- `loadConfig`: Load CloudFormation outputs from outputs.json
