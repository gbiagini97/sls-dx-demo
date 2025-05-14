import { readFileSync } from "fs";

/**
 * Common outputs from CloudFormation stacks
 */
export type Outputs = {
    // StatefulStack outputs
    AuctionItemsTableName: string;
    AuctionsTableName: string;
    AuctionsTableArn?: string;
    AuctionsTableStreamArn?: string;
    BidsTableName: string;
    BidsTableArn?: string;
    AuctionLifecycleStateMachineName: string;
    AuctionLifecycleStateMachineArn: string;
    AuctionEventsDLQUrl: string;
    AuctionEventsDLQArn: string;
    AuctionPipeName: string;
    ProcessAuctionStreamFunctionName: string;
    
    // ServerlessStack outputs
    ApiGatewayUrl?: string;
    PlaceBidExpSfnName?: string;
    PlaceBidExpSfnArn?: string;
    
    // Common outputs
    Region: string;
    Branch: string;
    Stage: string;
}

/**
 * Load CloudFormation outputs from the outputs.json file
 * @param path Path to the outputs.json file
 * @param baseStackName Base name of the stack (StatefulStack or ServerlessStack)
 * @returns Stack outputs
 */
export const loadConfig = (path: string, baseStackName: string): Outputs => {
    try {
        const file = readFileSync(path);
        const data = JSON.parse(file.toString());
        const branch = process.env.BRANCH || 'dev';
        const stackKey = `${branch}-${baseStackName}`;
        
        if (!data[stackKey]) {
            throw new Error(`Stack outputs not found for ${stackKey}`);
        }
        
        return data[stackKey] as Outputs;
    } catch (error) {
        console.error(`Error loading config from ${path}: ${error}`);
        throw error;
    }
};
