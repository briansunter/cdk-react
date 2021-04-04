const AWS = require('aws-sdk')
AWS.config.region = process.env.AWS_REGION
const documentClient = new AWS.DynamoDB.DocumentClient()
const params = {
    TableName : process.env.TABLE_NAME

};
exports.handler = async (event) => {
    // TODO implement
    const entries = await documentClient.scan(params)
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda! 2' + JSON.stringify(entries.Items) ),
    };
    return response;
}; 