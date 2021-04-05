const DynamoDB = require('aws-sdk/clients/dynamodb');
const documentClient = new DynamoDB.DocumentClient({region: "us-east-1"});
const params = {
    TableName : process.env.TABLE_NAME
};
exports.handler = async (event) => {
    const entries = await documentClient.scan(params).promise()
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            "Access-Control-Allow-Origin" : "*", 
            "Access-Control-Allow-Credentials" : true 
          },
        body: JSON.stringify(entries.Items),
    };
    return response;
}; 