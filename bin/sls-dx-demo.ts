#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServerlessStack } from '../lib/serverlessStack';
import { StatefulStack } from '../lib/statefulStack';
import { getDeployConfig, getResourcePrefix } from '../lib/config';

const app = new cdk.App();

// Get branch name from environment variable
const branch = process.env.BRANCH || 'dev';
const deployConfig = getDeployConfig(branch);
const resourcePrefix = getResourcePrefix(branch);

// Create the stateful stack first (contains database tables)
const statefulStack = new StatefulStack(app, `${resourcePrefix}-StatefulStack`, {
    env: {
        account: deployConfig.account,
        region: deployConfig.region
    },
    branch: resourcePrefix,
    stage: deployConfig.stage,
    removalPolicy: deployConfig.removalPolicy,
});

// Create the serverless stack that depends on the stateful stack
const serverlessStack = new ServerlessStack(app, `${resourcePrefix}-ServerlessStack`, {
    env: {
        account: deployConfig.account,
        region: deployConfig.region
    },
    branch: resourcePrefix,
    stage: deployConfig.stage,
    removalPolicy: deployConfig.removalPolicy,
    auctionsTable: statefulStack.auctionsTable,
    bidsTable: statefulStack.bidsTable,
    auctionItemsTable: statefulStack.auctionItemsTable,
    auctionLifecycleSfn: statefulStack.auctionLifecycleSfn,
    processAuctionStreamFunction: statefulStack.processAuctionStreamFunction
});

// Add dependency to ensure the stateful stack is deployed first
serverlessStack.addDependency(statefulStack);

// Add tags to all resources
const tags = {
    'Environment': deployConfig.stage,
    'Project': 'ServerlessAuction',
    'Branch': branch,
    'ManagedBy': 'CDK'
};

// Apply tags to both stacks
Object.entries(tags).forEach(([key, value]) => {
    cdk.Tags.of(statefulStack).add(key, value);
    cdk.Tags.of(serverlessStack).add(key, value);
});
