const DynamoDB = require('aws-sdk/clients/dynamodb');
const documentClient = new DynamoDB.DocumentClient({region: "us-east-1"});
import { v4 as uuidv4 } from 'uuid';

exports.handler = async (event) => {
  const {title, body} = JSON.parse(event.body);
  const currentTime = new Date();

  const newItem = {
          id: uuidv4(),
          title,
          body,
          date: currentTime.toISOString()
        };

    const entry = await documentClient.put({ 
        Item: newItem,
        TableName: process.env.TABLE_NAME
      }).promise()

    const response = {
        statusCode: 200,
        body: JSON.stringify(newItem),
        headers: {
            "Access-Control-Allow-Origin" : process.env.CORS_ORIGIN, 
          },
    };

    return response;
}; 