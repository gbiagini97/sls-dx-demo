# Serverless Auction System with AWS CDK

This project implements a serverless auction system using AWS CDK with TypeScript. The system allows users to create auctions, place bids, and automatically manages the auction lifecycle from creation to completion.

## Architecture Overview

The system consists of two main stacks:

1. **StatefulStack**: Contains all stateful resources
   - DynamoDB tables for auction items, auctions, and bids
   - Step Functions for auction lifecycle management
   - EventBridge Pipes for event-driven workflows
   - Lambda function for processing DynamoDB streams
   - SQS queue for dead-letter handling

2. **ServerlessStack**: Contains all serverless compute resources
   - API Gateway for bid placement
   - Express Step Functions for transaction management

## Key Components

### DynamoDB Tables (StatefulStack)

- **AuctionItems**: Stores information about items available for auction
- **Auctions**: Stores auction details including status, start and end times
- **Bids**: Stores bids placed on auctions

### Step Functions

- **PlaceBidExpSfn**: Express Step Function for handling bid placement transactions
- **AuctionLifecycleSfn**: Standard Step Function for managing auction lifecycle

### Event-Driven Architecture

- **DynamoDB Streams**: Trigger Lambda functions when auction records change
- **EventBridge Pipes**: Connect DynamoDB streams to Step Functions for auction lifecycle management

## Auction Lifecycle

1. An auction is created with CLOSED status and a future start date
2. When the start time is reached, the auction status is updated to OPEN (via ProcessAuctionStream Lambda)
3. Users can place bids on open auctions
4. When the end time is reached, the auction is closed and the winning bid is determined

## Performance Optimizations

- The DynamoDB stream processor is optimized for fast processing (3-5 seconds)
- The Step Function for bid placement uses transactions to ensure data consistency
- EventBridge Pipes provide efficient event routing with filtering capabilities

## Development Workflow

This project follows the GitFlow workflow:

- **Feature branches**: Deploy to dev account with branch name prefix
- **Test branch**: Deploy to test account with automated testing
- **Prod branch**: Deploy to production account with automated testing

## Testing

The system includes comprehensive tests:
- Unit tests for individual components
- Integration tests for the DynamoDB stream processor
- End-to-end tests for the bid placement workflow

## Future Enhancements

- Add authentication and authorization
- Implement notifications for auction events
- Add support for auction categories and search
- Implement a UI for auction management and bidding
