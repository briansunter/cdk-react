const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify(`Hello from Lambda! ${uuidv4}`),
    };
    return response;
}; 