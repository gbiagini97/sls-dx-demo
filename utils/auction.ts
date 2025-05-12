import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

export interface Auction {
    itemID: string
    startDate: string
    status: AuctionStatus
    createdAt: string
}

export enum AuctionStatus {
    OPEN = 'open',
    CLOSED = 'closed'
}

export interface AuctionParams {
    itemID: string
    startDate: string
}

export const createAuction = async (tableName: string, auction: AuctionParams, docClient?: DynamoDBDocumentClient): Promise<Auction> => {
    const client = docClient || DynamoDBDocumentClient.from(new DynamoDBClient({}))

    const item: Auction = {
        ...auction,
        status: AuctionStatus.CLOSED,
        createdAt: new Date().toISOString()
    }

    try {
        await client.send(new PutCommand({
            TableName: tableName,
            Item: item
        }));
        return item;
    } catch (error: any) {
        throw new Error(`Failed to create item in DynamoDB: ${error.message}`);
    }
}
