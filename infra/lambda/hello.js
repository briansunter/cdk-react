const DynamoDB = require('aws-sdk/clients/dynamodb');
const documentClient = new DynamoDB.DocumentClient({region: "us-east-1"});
import { v4 as uuidv4 } from 'uuid';

const params = {
    TableName : process.env.TABLE_NAME
};
exports.handler = async (event) => {
    // TODO implement

    const entries = await documentClient.put({ 
        Item: {
          id: uuidv4(),
          name: JSON.parse(event.body).name
        },
        TableName: process.env.TABLE_NAME
      }).promise()
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!' + JSON.stringify(entries)),
    };
    return response;
}; 