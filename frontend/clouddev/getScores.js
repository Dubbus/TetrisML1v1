const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { ScanCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const ddbDoc = DynamoDBDocumentClient.from(ddb);
const TABLE_NAME = process.env.SCORES_TABLE_NAME || process.env.TABLE_NAME;

exports.handler = async (event) => {
  try {
    // Simple scan then sort in Lambda (ok for small table)
    const data = await ddbDoc.send(new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 1000
    }));
    const items = (data.Items || []).sort((a, b) => b.score - a.score).slice(0, 50);
    return { statusCode: 200, body: JSON.stringify(items) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};