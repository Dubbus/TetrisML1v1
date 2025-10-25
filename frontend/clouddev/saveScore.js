const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const ddbDoc = DynamoDBDocumentClient.from(ddb);
const TABLE_NAME = process.env.SCORES_TABLE_NAME || process.env.TABLE_NAME; // Amplify may set env var differently

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, score } = body;
    if (!username || score == null) {
      return { statusCode: 400, body: JSON.stringify({ error: "username and score required" }) };
    }

    const item = {
      username,
      score: Number(score),
      timestamp: Date.now(),
    };

    await ddbDoc.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Saved", item })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};