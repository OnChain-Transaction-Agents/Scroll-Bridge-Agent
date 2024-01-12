import type { AWS } from '@serverless/typescript';

import { createDailyAverage, createHourlyRate } from '@functions/data';
import { processTransactionNode, tokenMetaData, getPrediction } from '@functions/Transactions';
import { addEmail, sendEmail } from '@functions/Wallet';

const serverlessConfiguration: AWS = {
  service: 'scroller',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-dynamodb-local'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    iam: {
      role: {
        statements: [{
          Effect: "Allow",
          Action: [
            "dynamodb:DescribeTable",
            "dynamodb:Query",
            "dynamodb:Scan",
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
          ],
          Resource: "arn:aws:dynamodb:*",
        }],
      },

    },
  },
  // import the function via paths
  functions: { createDailyAverage, createHourlyRate, processTransactionNode, tokenMetaData, getPrediction, addEmail, sendEmail},
  package: { individually: true },
  custom:{
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    dynamodb:{
      start:{
        port: 5000,
        inMemory: true,
        migrate: true,
      },
      stages: ['dev', 'test', 'prod'],
    }
  },
  resources: {
    Resources: {
      TransactionTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "TransactionTable",
          AttributeDefinitions: [{
            AttributeName: "TIMESTAMP",
            AttributeType: "N",
          }],
          KeySchema: [{
            AttributeName: "TIMESTAMP",
            KeyType: "HASH"
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          },
          
        }
      },
      TrackingTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "TrackingTable",
          AttributeDefinitions: [{
            AttributeName: "ID",
            AttributeType: "N",
          }],
          KeySchema: [{
            AttributeName: "ID",
            KeyType: "HASH"
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          },
          
        }
      },
      DailyHistoricalTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "DailyHistoricalTable",
          AttributeDefinitions: [{
            AttributeName: "TIMESTAMP",
            AttributeType: "N",
          }],
          KeySchema: [{
            AttributeName: "TIMESTAMP",
            KeyType: "HASH"
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          },
          
        }
      },
      HourlyHistoricalTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "HourlyHistoricalTable",
          AttributeDefinitions: [{
            AttributeName: "TIMESTAMP",
            AttributeType: "N",
          }],
          KeySchema: [{
            AttributeName: "TIMESTAMP",
            KeyType: "HASH"
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          },
          
        }
      },
      WalletTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "WalletTable",
          AttributeDefinitions: [{
            AttributeName: "TBA",
            AttributeType: "S",
          }],
          KeySchema: [{
            AttributeName: "TBA",
            KeyType: "HASH"
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          },
          
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
