import { readFileSync } from "fs";
import { Auction, createAuction } from "../utils/auction";
import { AuctionItem, createAuctionItem } from "../utils/auctionItem";
import { handler } from "../src/placeBid";

type Outputs = {
    ApiGatewayUrl: string,
    ItemsTableName: string,
    AuctionsTableName: string,
    BidsTableName: string
    Region: string
    PlaceBidFunctionName: string
}


describe("Place Bid Lambda", () => {
    const file = readFileSync("outputs.json")
    const data = JSON.parse(file.toString())
    const stackName = "SlsDxDemoStack"

    const outputs: Outputs = data[stackName]

    describe("", () => {
        let item: AuctionItem
        let auction: Auction
        let auctionID = ""

        beforeEach(async () => {
            item = await createAuctionItem(outputs.ItemsTableName, { name: "chandelier" })
            console.log(item)
            expect(item.ID).toBeDefined()

            auction = await createAuction(outputs.AuctionsTableName, { itemID: item.ID, startDate: new Date().toISOString() })
            console.log(auction)
            expect(auction.status).toBeDefined()

            auctionID = `${item.ID}#${auction.startDate}`
        })

        it("hopefully it places a bid", async () => {

            const response = await handler({
                requestContext: {
                    accountId: "string",
                    apiId: "string",
                    domainName: "string",
                    domainPrefix: "string",
                    http: {
                        method: "string",
                        path: "string",
                        protocol: "string",
                        sourceIp: "string",
                        userAgent: "string",
                    },
                    requestId: "string",
                    routeKey: "string",
                    stage: "string",
                    time: "string",
                    timeEpoch: 123456789,
                },
                headers: {
                    "Content-Type": "application/json"
                },
                version: "1.0",
                rawPath: "/bids",
                isBase64Encoded: false,
                rawQueryString: "",
                routeKey: "string",
                body: JSON.stringify({
                    auctionID: auctionID,
                    bidPrice: 100,
                    userID: 'random@example.com'
                })
            })

            console.log(response)
        })
    })

})