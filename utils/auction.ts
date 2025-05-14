import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

export interface Auction {
    itemID: string
    startDate: string
    endDate?: string
    status: AuctionStatus
    createdAt: string
    winningBidId?: string
    winningUserId?: string
    finalPrice?: number
}

export enum AuctionStatus {
    OPEN = 'open',
    CLOSED = 'closed'
}

export interface AuctionParams {
    itemID: string
    startDate: string
    endDate?: string
    status?: AuctionStatus
}

export const createAuction = async (tableName: string, auction: AuctionParams, docClient?: DynamoDBDocumentClient): Promise<Auction> => {
    const client = docClient || DynamoDBDocumentClient.from(new DynamoDBClient({}))

    // If endDate is not provided, set it to 1 hour after startDate
    let endDate = auction.endDate;
    if (!endDate) {
        const startDateObj = new Date(auction.startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setHours(endDateObj.getHours() + 1);
        endDate = endDateObj.toISOString();
    }

    const item: Auction = {
        ...auction,
        endDate,
        status: auction.status || AuctionStatus.CLOSED,
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

export const updateAuctionStatus = async (tableName: string, itemID: string, startDate: string, status: AuctionStatus, docClient?: DynamoDBDocumentClient): Promise<Auction> => {
    const client = docClient || DynamoDBDocumentClient.from(new DynamoDBClient({}))

    try {
        // First get the auction to make sure it exists
        const getResult = await client.send(new GetCommand({
            TableName: tableName,
            Key: {
                itemID,
                startDate
            }
        }));

        if (!getResult.Item) {
            throw new Error(`Auction with itemID ${itemID} and startDate ${startDate} not found`);
        }

        const auction = getResult.Item as Auction;
        
        // Update the auction status
        const updateResult = await client.send(new UpdateCommand({
            TableName: tableName,
            Key: {
                itemID,
                startDate
            },
            UpdateExpression: "set #status = :status",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":status": status
            },
            ReturnValues: "ALL_NEW"
        }));

        return updateResult.Attributes as Auction;
    } catch (error: any) {
        throw new Error(`Failed to update auction status: ${error.message}`);
    }
}
