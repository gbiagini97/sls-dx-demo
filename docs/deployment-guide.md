# Deployment Guide

This guide explains how to deploy the Serverless Auction System to different environments.

## Prerequisites

- Node.js 18+
- AWS CLI installed and configured
- AWS CDK installed
- Git

## AWS Credentials Setup

Configure AWS profiles in `~/.aws/credentials`:

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

## Development Workflow

This project follows the GitFlow workflow:

1. **Feature Branches**: For new features and bug fixes
   - Branch naming: `feature/feature-name` or `bugfix/bug-name`
   - Deploy to dev account with branch name prefix

2. **Test Branch**: For integration testing
   - Branch name: `test`
   - Deploy to test account

3. **Production Branch**: For production deployment
   - Branch name: `prod`
   - Deploy to production account

## Deployment Commands

### Development Environment

```bash
# Switch to your feature branch
git checkout feature/my-feature

# Install dependencies
npm install

# Deploy to dev account
npm run deploy:dev -- --all

# Run tests
npm run test:dev

# Destroy resources when done
npm run destroy:dev -- --all
```

### Test Environment

```bash
# Switch to test branch
git checkout test

# Install dependencies
npm install

# Deploy to test account
npm run deploy:test -- --all

# Run tests
npm run test:test

# Destroy resources if needed
npm run destroy:test -- --all
```

### Production Environment

```bash
# Switch to production branch
git checkout prod

# Install dependencies
npm install

# Deploy to production account
npm run deploy:prod -- --all

# Run tests
npm run test:prod

# Destroy resources (use with caution)
npm run destroy:prod -- --all
```

## Deployment Outputs

After deployment, the stack outputs are saved to `outputs.json`. This file is used by tests to locate resources.

Example outputs:
```json
{
  "dev-StatefulStack": {
    "AuctionItemsTableName": "dev-AuctionItems",
    "AuctionsTableName": "dev-Auctions",
    "BidsTableName": "dev-Bids",
    "AuctionLifecycleStateMachineName": "dev-AuctionLifecycleSfn"
  },
  "dev-ServerlessStack": {
    "ApiUrl": "https://abc123.execute-api.eu-central-1.amazonaws.com",
    "PlaceBidExpSfnName": "dev-PlaceBidExpSfn"
  }
}
```

## CI/CD Integration

The project includes GitHub Actions workflows for CI/CD:

1. **Deploy on Push**:
   - Deploys resources when code is pushed to feature, test, or prod branches
   - Uses appropriate AWS account based on branch name

2. **Run Tests**:
   - Automatically runs tests for test and prod branches
   - Uses environment-specific configuration

3. **Cleanup**:
   - Cleans up resources when pull requests are closed

## Switching Between Iterations

To switch between different iterations of the project, use the provided script:

```bash
# Switch to a specific iteration
./scripts/switch-iteration.sh [iteration-number]

# Example: Switch to iteration 3
./scripts/switch-iteration.sh 3

# Switch to the final state
./scripts/switch-iteration.sh main
```

Available iterations:
1. Initial Spike - Basic functionality with Lambda
2. Improved Testing - Gherkin-style tests and better error handling
3. Multi-Account Setup - Configuration for multi-account deployment
4. Express Step Function - Transaction handling for bid placement
5. Stack Separation - Split into StatefulStack and ServerlessStack
6. Auction Lifecycle - EventBridge Pipes and automatic status updates
