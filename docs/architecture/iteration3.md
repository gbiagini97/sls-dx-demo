# Iteration 3: Multi-Account Setup - Architecture

## Overview

This iteration adds multi-account deployment capabilities and GitFlow workflow integration.

## Components

### Configuration (`config.ts`)

Added configuration for multi-account deployment:

```typescript
export const getDeployConfig = (branchName: string): DeployConfig => {
  // Test branch configuration
  if (branchName === Stage.test) {
    return {
      account: "791918578647",
      region: Region.frankfurt,
      stage: Stage.test,
      removalPolicy: RemovalPolicy.RETAIN
    };
  }
  
  // Production configuration
  if (branchName === Stage.prod) {
    return {
      account: "164628550684",
      region: Region.frankfurt,
      stage: Stage.prod,
      removalPolicy: RemovalPolicy.RETAIN
    };
  }
  
  // Development configuration (default for feature branches)
  return {
    account: "027625171711",
    region: Region.frankfurt,
    stage: Stage.dev,
    removalPolicy: RemovalPolicy.DESTROY
  };
};
```

### CDK Stack (`SlsDxDemoStack`)

Enhanced stack with environment-specific configuration:

```
SlsDxDemoStack
├── DynamoDB Tables
│   ├── AuctionItemsTable (environment-specific name)
│   ├── AuctionsTable (environment-specific name)
│   └── BidsTable (environment-specific name)
├── Lambda Function
│   └── PlaceBidFunction (environment-specific name)
└── API Gateway
    └── /bids (POST)
```

### CI/CD Workflow

Added GitHub Actions workflow for CI/CD:

1. **Deploy on Push**:
   - Deploys resources when code is pushed to feature, test, or prod branches
   - Uses appropriate AWS account based on branch name

2. **Run Tests**:
   - Automatically runs tests for test and prod branches
   - Uses environment-specific configuration

3. **Cleanup**:
   - Cleans up resources when pull requests are closed

## Deployment Strategy

### Development

- Feature branches deploy to dev account with branch name prefix
- Resources are destroyed when feature branch is deleted

### Test

- Test branch deploys to test account
- Resources are retained between deployments

### Production

- Prod branch deploys to production account
- Resources are retained between deployments

## NPM Scripts

Added environment-specific npm scripts:

```json
{
  "scripts": {
    "deploy:dev": "BRANCH=$(git branch --show-current) cdk deploy --outputs-file outputs.json --profile dev",
    "deploy:test": "BRANCH=test cdk deploy --outputs-file outputs.json --profile test",
    "deploy:prod": "BRANCH=prod cdk deploy --outputs-file outputs.json --profile prod",
    "test:dev": "AWS_SDK_LOAD_CONFIG=1 AWS_PROFILE=dev BRANCH=$(git branch --show-current) jest",
    "test:test": "AWS_SDK_LOAD_CONFIG=1 AWS_PROFILE=test BRANCH=test jest",
    "test:prod": "AWS_SDK_LOAD_CONFIG=1 AWS_PROFILE=prod BRANCH=prod jest"
  }
}
```

## Outputs

Enhanced outputs with environment-specific names:

```typescript
new cdk.CfnOutput(this, 'ApiUrl', {
  value: this.apiUrl,
  description: 'URL of the API Gateway endpoint',
  exportName: `${props.branch}-ApiUrl`
});
```

## Limitations

- Still using a single stack for all resources
- No automatic auction lifecycle management
