const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3010;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

server.listen(port, () => {
  console.log(`Server Running on port ${port}`);
});

function generateBase64Id(length) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

let onlineCount = 0;
console.log('onlineCount:', onlineCount);

async function fetchChatData() {
  try {
    const res = await pool.query('SELECT * FROM chat');
    return res.rows;
  }
  catch (err) {
    console.error('Error fetching chat data:', err);
    return [];
  }
}

async function insertChatData(properties) {
  const insertQuery = `
    INSERT INTO chat (properties)
    VALUES ($1)
    RETURNING *;
  `;
  try {
    const res = await pool.query(insertQuery, [properties]);
    return res.rows[0];
  }
  catch (err) {
    console.error('Error inserting chat data:', err);
  }
}

wss.on('connection', async (ws) => {
  onlineCount++;
  console.log('onlineCount:', onlineCount);

  const userId = generateBase64Id(16);
  const idMessage = JSON.stringify({ userId }, null, 2);
  ws.send(idMessage);

  const chatData = await fetchChatData();
  const chatDataMessage = JSON.stringify(
    {createMessage: chatData},
    null, 2
  );
  ws.send(chatDataMessage);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ onlineCount }, null, 2));
    }
  });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const isValidUserId = data.userId && data.userId.length === 16 && data.userId !== 'null';
      const isValidMessage = data.message && Buffer.byteLength(data.message, 'utf8') <= 256;
      const hasValidKeys = Object.keys(data).length === 2 && 'userId' in data && 'message' in data;
      if (isValidMessage && isValidUserId && hasValidKeys) {
        const timestampedData = {
          time: new Date().toISOString(),
          ...data
        };
        console.log('received:', JSON.stringify(timestampedData, null, 2));

        const insertedData = await insertChatData(timestampedData);
        if (insertedData) {
          const broadcastData = JSON.stringify({ createMessage: [insertedData] }, null, 2);
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        }
      }
    }
    catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });

  ws.on('close', () => {
    onlineCount--;
    console.log('onlineCount:', onlineCount);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ onlineCount }, null, 2));
      }
    });
  });
});

async function deleteOutdatedMessages() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const deleteQuery = `
      DELETE FROM chat
      WHERE properties->>'time' < $1;
    `;
    const res = await pool.query(deleteQuery, [twentyFourHoursAgo]);
    console.log(`Deleted ${res.rowCount} outdated messages.`);
  } catch (err) {
    console.error('Error deleting outdated messages:', err);
  }
}
deleteOutdatedMessages();
setInterval(deleteOutdatedMessages, 8640000);
