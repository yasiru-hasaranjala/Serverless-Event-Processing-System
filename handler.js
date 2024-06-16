import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Readable } from 'stream';

const s3Client = new S3Client();
const dynamoClient = new DynamoDBClient();

const processS3Event = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

  const getObjectParams = {
    Bucket: bucket,
    Key: key,
  };

  try {
    console.log(`Processing S3 event for bucket: ${bucket}, key: ${key}`);
    const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));
    const data = await streamToString(Body);
    const logEntries = parseLogEntries(data);

    for (const entry of logEntries) {
      const transformedData = transformLogEntry(entry);
      console.log(`Inserting log entry into DynamoDB: ${JSON.stringify(transformedData)}`);
      const putItemParams = {
        TableName: 'ProcessedLogsTbl',
        Item: transformedData,
      };

      await dynamoClient.send(new PutItemCommand(putItemParams));
    }

    return { status: 'success' };
  } catch (error) {
    console.error(`Error processing S3 event: ${error.message}`);
    return { status: 'error', error };
  }
};

const processSQSEvent = async (event) => {
  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      const logEntries = parseLogEntries(body.logData);

      for (const entry of logEntries) {
        const transformedData = transformLogEntry(entry);
        console.log(`Inserting log entry into DynamoDB: ${JSON.stringify(transformedData)}`);
        const putItemParams = {
          TableName: 'ProcessedLogsTbl',
          Item: transformedData,
        };

        await dynamoClient.send(new PutItemCommand(putItemParams));
      }
    }

    return { status: 'success' };
  } catch (error) {
    console.error(`Error processing SQS event: ${error.message}`);
    return { status: 'error', error };
  }
};

const processEvent = async (event) => {
  console.log(`Received event: ${JSON.stringify(event)}`);
  if (event.Records && event.Records[0].eventSource === 'aws:s3') {
    return await processS3Event(event);
  } else if (event.Records && event.Records[0].eventSource === 'aws:sqs') {
    return await processSQSEvent(event);
  } else {
    console.error('Unsupported event source');
    return { status: 'error', error: 'Unsupported event source' };
  }
};

const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
};

const parseLogEntries = (data) => {
  return data.split('\n').filter(line => line.trim() !== '').map(line => {
    const [timestamp, ip, method, url, statusCode, userAgent] = line.split(/ (.+?) (.+?) (.+?) (.+?) (.+?)$/);
    return { timestamp, ip, method, url, statusCode, userAgent };
  });
};

const transformLogEntry = (entry) => {
  return {
    ID: { S: `${entry.timestamp}-${entry.ip}` },
    Timestamp: { S: entry.timestamp },
    IP: { S: entry.ip },
    Method: { S: entry.method },
    URL: { S: entry.url },
    StatusCode: { N: entry.statusCode.toString() },
    UserAgent: { S: entry.userAgent },
  };
};

export { processEvent };
