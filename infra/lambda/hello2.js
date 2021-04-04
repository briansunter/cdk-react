const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const client = new DynamoDBClient({ region: "us-east-1" });
const params = {
    TableName : process.env.TABLE_NAME

};
exports.handler = async (event) => {
    // TODO implement
    const entries = await client.query(params)
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda! 2' + JSON.stringify(entries) ),
    };
    return response;
}; 