# Contributing Guide

This guide explains how to contribute to the Serverless Auction System project.

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

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure AWS credentials for dev, test, and prod accounts
4. Deploy to dev environment: `npm run deploy:dev -- --all`
5. Run tests: `npm run test:dev`

## Project Structure

```
.
├── bin/                    # CDK app entry point
├── docs/                   # Documentation
│   ├── architecture/       # Architecture documentation for each iteration
│   ├── deployment-guide.md # Deployment guide
│   └── testing-guide.md    # Testing guide
├── lib/                    # CDK stack definitions
│   ├── config.ts           # Configuration for multi-account deployment
│   ├── serverlessStack.ts  # Serverless compute resources
│   └── statefulStack.ts    # Stateful resources
├── scripts/                # Utility scripts
│   └── switch-iteration.sh # Script to switch between iterations
├── src/                    # Source code
│   ├── auctionLifecycle.asl.yaml # Auction lifecycle Step Function definition
│   └── placeBid.asl.yaml   # Bid placement Step Function definition
├── test/                   # Tests
│   ├── auctionLifecycle.test.ts # Tests for auction lifecycle
│   └── bidPlacement.test.ts     # Tests for bid placement
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
└── README.md               # Project README
```

## Development Iterations

This project was developed through several iterations:

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

## Testing

See the [Testing Guide](./docs/testing-guide.md) for details on how to run tests.

## Deployment

See the [Deployment Guide](./docs/deployment-guide.md) for details on how to deploy the project.

## Architecture

See the architecture documentation for each iteration in the [docs/architecture](./docs/architecture) directory.
