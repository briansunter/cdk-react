import { v4 as uuidv4, v4 } from 'uuid';
exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda2!' + uuidv4()),
    };
    return response;
}; 