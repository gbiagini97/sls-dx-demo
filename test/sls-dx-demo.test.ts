import { readFileSync } from "fs";
import { makeRequest, PlaceBidRequest } from "../utils/apigwRequest";
import { Auction, createAuction } from "../utils/auction";
import { AuctionItem, createAuctionItem } from "../utils/auctionItem";
import { Bid, getBid } from "../utils/bid";

type Outputs = {
    ApiGatewayUrl: string,
    ItemsTableName: string,
    AuctionsTableName: string,
    BidsTableName: string
    Region: string
}


describe("Auction demo E2E", () => {
    const file = readFileSync("outputs.json")
    const data = JSON.parse(file.toString())
    const stackName = "SlsDxDemoStack"

    const outputs: Outputs = data[stackName]


    describe("Given an open auction", () => {

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

        describe("When an unauthenticated user places a bid", () => {
            const userID = 'testUser1@gmail.com'

            let placedBid: Bid
            beforeEach(async () => {

                const res = await makeRequest<PlaceBidRequest>({
                    url: outputs.ApiGatewayUrl,
                    method: 'POST',
                    path: "/bids"
                }, {
                    auctionID: `${item.ID}#${auction.startDate}`,
                    userID: userID,
                    bidPrice: 1234.1234
                })

                placedBid = res.body

                expect(placedBid.auctionID).toBe(auctionID)
            })

            it("Then the bid is placed", async () => {
                const retrievedBid = await getBid(outputs.BidsTableName, { auctionID: auctionID, userID: userID })


                console.log(retrievedBid)
                expect(retrievedBid).toBe(placedBid)
            })
        })
    })
})


