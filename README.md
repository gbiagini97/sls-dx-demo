# Serverless Auction System

A serverless auction system built with AWS CDK, implementing a GitFlow workflow with environment segregation.

## Architecture

The system consists of two main stacks:

1. **StatefulStack**: Contains all stateful resources
   - DynamoDB tables for auction items, auctions, and bids
   - Step Functions for auction lifecycle management
   - EventBridge Pipes for event-driven workflows
   - SQS queue for dead-letter handling

2. **ServerlessStack**: Contains all serverless compute resources
   - API Gateway for bid placement
   - Lambda functions for processing DynamoDB streams
   - Express Step Functions for transaction management

## Development Workflow

This project follows the GitFlow workflow:

- **Feature branches**: Deploy to dev account with branch name prefix
- **Test branch**: Deploy to test account with automated testing
- **Prod branch**: Deploy to production account with automated testing

## Setup

### Prerequisites

- Node.js 18+
- AWS CLI configured with profiles for dev, test, and prod accounts
- AWS CDK installed

### Installation

```bash
npm install
```

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

## CI/CD

The project includes GitHub Actions workflows for:

- Deploying resources on push to feature, test, and prod branches
- Running tests automatically for test and prod branches
- Rolling back on test failures
- Cleaning up resources when pull requests are closed

## Testing

```bash
# Run all tests
npm test

# Run specific tests
npm test -- -t "Auction Stream Processor"
npm test -- -t "Auction demo E2E"
```
