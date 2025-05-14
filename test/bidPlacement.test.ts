import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Auction, createAuction, AuctionStatus } from "../utils/auction";
import { AuctionItem, createAuctionItem } from "../utils/auctionItem";
import { Bid, getBid } from "../utils/bid";
import { loadConfig, Outputs } from "../types/output";
import { makeRequest, PlaceBidRequest } from "../utils/apigwRequest";

describe("Bid Placement", () => {
  const statefulOutputs: Outputs = loadConfig("outputs.json", "StatefulStack");
  const serverlessOutputs: Outputs = loadConfig("outputs.json", "ServerlessStack");
  
  const ddbClient = new DynamoDBClient({ region: statefulOutputs.Region });
  const docClient = DynamoDBDocumentClient.from(ddbClient);

  describe("When placing a bid on an open auction", () => {
    let item: AuctionItem;
    let auction: Auction;
    let auctionID: string;
    const userID = 'testUser1@gmail.com';
    const bidPrice = 1234;
    let placedBid: any;

    beforeAll(async () => {
      // Create an auction item
      item = await createAuctionItem(statefulOutputs.AuctionItemsTableName, { 
        name: "test-item" 
      });
      console.log("Created auction item:", item);
      expect(item.ID).toBeDefined();

      // Create an open auction
      auction = await createAuction(statefulOutputs.AuctionsTableName, { 
        itemID: item.ID, 
        startDate: new Date().toISOString(),
        status: AuctionStatus.OPEN  // Set status to OPEN directly
      });
      console.log("Created auction:", auction);
      expect(auction.status).toEqual(AuctionStatus.OPEN);

      auctionID = `${item.ID}#${auction.startDate}`;
    }, 20000);

    it("should successfully place a bid", async () => {
      // Place a bid using the API
      const res = await makeRequest<PlaceBidRequest>({
        url: serverlessOutputs.ApiGatewayUrl!,
        method: 'POST',
        path: "/bids"
      }, {
        auctionID: auctionID,
        userID: userID,
        bidPrice: bidPrice
      });

      placedBid = res.body;
      console.log("Bid placement response:", placedBid);
      
      // Verify the response
      expect(placedBid.status).toEqual("SUCCEEDED");
      
      // Verify the bid was stored in DynamoDB
      const retrievedBid = await getBid(statefulOutputs.BidsTableName, { 
        auctionID: auctionID, 
        userID: userID 
      });

      console.log("Retrieved bid:", retrievedBid);
      expect(retrievedBid).toBeDefined();
      expect(retrievedBid.auctionID).toEqual(auctionID);
      expect(retrievedBid.userID).toEqual(userID);
      expect(retrievedBid.bidPrice).toEqual(bidPrice);
    });
  });
});
