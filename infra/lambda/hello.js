import { v4 as uuidv4, v4 } from 'uuid';
exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!' + uuidv4()),
    };
    return response;
}; 