# Serverless Event Processing System

## Introduction
This serverless application processes events from AWS S3 and SQS, transforms the data, and stores it in Amazon DynamoDB.

## Architecture Diagram
Architectural-Diagram.png

## Deployment Instructions
1. Clone the repository.
2. Install Serverless Framework: `npm install -g serverless`
3. Configure AWS credentials: `aws configure`
4. Deploy the application: `serverless deploy`

## Usage Instructions
1. Upload a file to the S3 bucket (`lps-logs-bckt`) to trigger the S3 event. (samples/webserver.log)
2. Send a message to the SQS queue (`lpsLogQueue`) to trigger the SQS event. (sample/sqs-message.txt)
3. Check the DynamoDB table (`ProcessedLogsTbl`) for transformed data.
4. Check the CloudWatch Logs for informations.

## Reflection
- **Challenges:** Learning Serverless Framework and AWS services quickly.
- **Lessons Learned:** Gained hands-on experience with AWS Lambda, S3, SQS, and DynamoDB.
- **Potential Improvements:** Add more sophisticated transformation logic and enhance error handling.

