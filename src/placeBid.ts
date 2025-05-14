import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { createBid } from "../utils/bid";

const { BIDS_TABLE_NAME } = process.env

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);


export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {

    if(!BIDS_TABLE_NAME) throw new Error("BIDS_TABLE_NAME is not defined");

    console.log("EVENT:", JSON.stringify(event))

    if (!event.body) {
        console.error("Missing body")
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing body, provide arguments: [auctionID, userID, bidPrice]" })
        }
    }

    const { auctionID, userID, bidPrice } = JSON.parse(event.body);

    if (bidPrice <= 0) {
        console.error("Invalid bid price")
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid bid price" })
        }
    }

    const response = await createBid(BIDS_TABLE_NAME, {
        auctionID,
        userID,
        bidPrice
    }, docClient);

    if (response)
        return {
            statusCode: 200,
            body: JSON.stringify(response)
        }


    return {
        statusCode: 500,
        body: JSON.stringify({ message: "Server error" })
    }
}
