import { DynamoDBStreamEvent, DynamoDBRecord, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: DynamoDBStreamEvent, context: Context): Promise<void> => {
  console.log('Processing DynamoDB Stream event:', JSON.stringify(event, null, 2));
  
  // Process each record in the stream
  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error('Error processing record:', error);
      console.error('Record:', JSON.stringify(record, null, 2));
    }
  }
};

async function processRecord(record: DynamoDBRecord): Promise<void> {
  // Only process INSERT and MODIFY events
  if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
    console.log(`Skipping ${record.eventName} event`);
    return;
  }

  // Skip if there's no new image
  if (!record.dynamodb?.NewImage) {
    console.log('No new image in the record, skipping');
    return;
  }

  const newImage = record.dynamodb.NewImage;
  
  // Extract auction details
  const itemID = newImage.itemID?.S;
  const startDate = newImage.startDate?.S;
  const status = newImage.status?.S;
  
  if (!itemID || !startDate) {
    console.log('Missing required fields in the record, skipping');
    return;
  }

  // Check if this is a closed auction with a start date in the past
  if (status === 'closed') {
    const startDateTime = new Date(startDate).getTime();
    const now = Date.now();
    
    if (startDateTime <= now) {
      console.log(`Auction ${itemID} start time has passed, updating status to OPEN`);
      
      // Update the auction status to OPEN
      await docClient.send(new UpdateCommand({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: {
          itemID,
          startDate
        },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'open'
        }
      }));
      
      console.log(`Successfully updated auction ${itemID} status to OPEN`);
    } else {
      console.log(`Auction ${itemID} start time is in the future, no action needed`);
    }
  } else {
    console.log(`Auction ${itemID} status is ${status}, no action needed`);
  }
}
