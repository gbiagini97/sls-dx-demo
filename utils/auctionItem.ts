import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

export interface AuctionItem {
    ID: string
    name: string
    createdAt: string
}

export interface AuctionItemParams {
    name: string
}

export const createAuctionItem = async (tableName: string, auctionItem: AuctionItemParams, docClient?: DynamoDBDocumentClient): Promise<AuctionItem> => {
    const client = docClient || DynamoDBDocumentClient.from(new DynamoDBClient({}))

    const item: AuctionItem = {
        ...auctionItem,
        ID: uuidv4(),
        createdAt: new Date().toISOString()
    }

    try {
        await client.send(new PutCommand({
            TableName: tableName,
            Item: item
        }))
        return item;
    } catch (error: any) {
        throw new Error(`Failed to create auction item in DynamoDB: ${error.message}`);
    }

}