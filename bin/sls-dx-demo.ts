#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SlsDxDemoStack } from '../lib/sls-dx-demo-stack';

const app = new cdk.App();

new SlsDxDemoStack(app, 'SlsDxDemoStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});

app.synth()