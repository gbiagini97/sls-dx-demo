import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Auction, createAuction, AuctionStatus } from "../utils/auction";
import { loadConfig, Outputs } from "../types/output";
import { sleep } from "../utils/sleep";

describe("Auction Lifecycle", () => {
  const outputs: Outputs = loadConfig("outputs.json", "StatefulStack");
  const ddbClient = new DynamoDBClient({ region: outputs.Region });
  const docClient = DynamoDBDocumentClient.from(ddbClient);

  describe("When an auction is created with a past start date", () => {
    let auction: Auction;
    
    beforeAll(async () => {
      // Create an auction with a start date in the past (5 seconds ago)
      const pastDate = new Date();
      pastDate.setSeconds(pastDate.getSeconds() - 5);
      
      const endDate = new Date(pastDate);
      endDate.setMinutes(endDate.getMinutes() + 5);
      
      auction = await createAuction(outputs.AuctionsTableName, {
        itemID: `test-item-${Date.now()}`,
        startDate: pastDate.toISOString(),
        endDate: endDate.toISOString(),
        status: AuctionStatus.CLOSED
      });

      console.log("Created auction with past start time:", auction);
      expect(auction.status).toEqual(AuctionStatus.CLOSED);
    }, 10000);

    it("should be automatically updated to OPEN status by the Lambda function", async () => {
      // Wait for the Lambda to process the auction
      let updated = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!updated && attempts < maxAttempts) {
        attempts++;
        await sleep(2000); // Wait 2 seconds between checks
        
        const { Item } = await docClient.send(new GetCommand({
          TableName: outputs.AuctionsTableName,
          Key: {
            itemID: auction.itemID,
            startDate: auction.startDate
          }
        }));
        
        console.log(`Attempt ${attempts}: Auction status is ${Item?.status}`);
        
        if (Item && Item.status === AuctionStatus.OPEN) {
          updated = true;
          console.log(`Auction status updated to OPEN after ${attempts} attempts`);
        }
      }
      
      // Get the final state of the auction
      const { Item } = await docClient.send(new GetCommand({
        TableName: outputs.AuctionsTableName,
        Key: {
          itemID: auction.itemID,
          startDate: auction.startDate
        }
      }));
      
      console.log("Final auction state:", Item);
      
      // Verify the auction was automatically updated to OPEN
      expect(Item).toBeDefined();
      expect(Item?.status).toEqual(AuctionStatus.OPEN);
      console.log("Auction was automatically updated to OPEN status by the Lambda function");
    }, 30000);
  });
});
