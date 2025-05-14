# Serverless Auction System with AWS CDK

This project implements a serverless auction system using AWS CDK with TypeScript. The system allows users to create auctions, place bids, and automatically manages the auction lifecycle from creation to completion.

## Architecture Overview

The system consists of two main stacks:

1. **StatefulStack**: Contains all stateful resources
   - DynamoDB tables for auction items, auctions, and bids
   - Step Functions for auction lifecycle management
   - EventBridge Pipes for event-driven workflows
   - SQS queue for dead-letter handling

2. **ServerlessStack**: Contains all serverless compute resources
   - API Gateway for bid placement
   - Express Step Functions for transaction management

## Development Iterations

This project was developed through several iterations, each building on the previous one:

1. **Iteration 1: Initial Spike** (`iteration1/spike`)
   - Single stack with basic functionality
   - Simple Lambda function for bid placement
   - Basic DynamoDB tables

2. **Iteration 2: Improved Testing** (`iteration2/testing`)
   - Gherkin-style test nomenclature (Given/When/Then)
   - Better error handling
   - Improved validation

3. **Iteration 3: Multi-Account Setup** (`iteration3/multi-account`)
   - Configuration for multi-account deployment
   - GitFlow workflow implementation
   - Environment-specific resource naming

4. **Iteration 4: Express Step Function** (`iteration4/express-step-function`)
   - Replace Lambda with Express Step Function
   - Transaction handling for bid placement
   - Better logging and monitoring

5. **Iteration 5: Stack Separation** (`iteration5/stack-separation`)
   - Split into StatefulStack and ServerlessStack
   - Better separation of concerns
   - Cleaner lifecycle management

6. **Iteration 6: Auction Lifecycle** (`iteration6/auction-lifecycle`)
   - EventBridge Pipes for event-driven architecture
   - Step Function for auction lifecycle management
   - Automatic status updates
   - End-to-end testing

## Setup

### Prerequisites

- Node.js 18+
- AWS CLI configured with profiles for dev, test, and prod accounts
- AWS CDK installed

### Configuration

AWS profiles should be configured in `~/.aws/credentials`:

```
[dev]
aws_access_key_id=...
aws_secret_access_key=...

[test]
aws_access_key_id=...
aws_secret_access_key=...

[prod]
aws_access_key_id=...
aws_secret_access_key=...
```

## Deployment

### Development (Local)

```bash
# Deploy to dev account with current branch name
npm run deploy:dev -- --all

# Run tests
npm run test:dev

# Destroy resources
npm run destroy:dev -- --all
```

### Test Environment

```bash
# Deploy to test account
npm run deploy:test -- --all

# Run tests
npm run test:test

# Destroy resources
npm run destroy:test -- --all
```

### Production

```bash
# Deploy to production account
npm run deploy:prod -- --all

# Run tests
npm run test:prod

# Destroy resources (use with caution)
npm run destroy:prod -- --all
```

## Testing

```bash
# Run all tests
npm test

# Run specific tests
npm test -- -t "Auction Lifecycle"
npm test -- -t "Bid Placement"
```

## Future Enhancements

- Add authentication and authorization
- Implement notifications for auction events
- Add support for auction categories and search
- Implement a UI for auction management and bidding
