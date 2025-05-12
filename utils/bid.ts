
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export interface Bid {
    auctionID: string
    userID: string
    bidPrice: number
    createdAt: string
}

export interface CreateBidParams {
    auctionID: string
    userID: string
    bidPrice: number
}

export interface GetBidParams {
    auctionID: string
    userID: string
}

export const createBid = async (tableName: string, params: CreateBidParams, docClient?: DynamoDBDocumentClient): Promise<Bid> => {
    const client = docClient || DynamoDBDocumentClient.from(new DynamoDBClient({}))

    const item: Bid = {
        ...params,
        createdAt: new Date().toISOString()
    }

    try {
        await client.send(new PutCommand({
            TableName: tableName,
            Item: item
        }))
        return item;
    } catch (error: any) {
        throw new Error(`Failed to create bid in DynamoDB: ${error.message}`);
    }
}

export const getBid = async(tableName: string, params: GetBidParams, docClient?: DynamoDBDocumentClient): Promise<Bid> => {
    const client = docClient || DynamoDBDocumentClient.from(new DynamoDBClient({}))

    try {
        const { Item } = await client.send(new GetCommand({
            TableName: tableName,
            Key: {
                auctionID: params.auctionID,
                userID: params.userID
            }
        }))
        return Item as Bid;
    } catch (error: any) {
        throw new Error(`Failed to get bid from DynamoDB: ${error.message}`);
    }

}