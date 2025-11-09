import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for demo; restrict in production
  }
});

// MySQL connection config - adjust with your credentials
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your MySQL password here
  database: 'villagelink_db', // Correct database name as per your environment
};

// Polling interval in milliseconds
const POLL_INTERVAL = 3000;

let lastCheckTimes = {
  villagelink_users: new Date(0),
  villagelink_announcements: new Date(0),
  villagelink_comreqs: new Date(0),
  villagelink_emergencies: new Date(0),
  villagelink_faqs: new Date(0),
  villagelink_feedback: new Date(0),
  villagelink_officials: new Date(0),
  villagelink_visitorlogs: new Date(0),
};

const TABLES = Object.keys(lastCheckTimes);

// Generic function to fetch all rows from a table ordered by updated_at desc
async function fetchAllRows(connection, table) {
  const query = `SELECT * FROM ${table} ORDER BY updated_at DESC`;
  const [rows] = await connection.execute(query);
  return rows;
}

// Generic function to fetch new or updated rows since last check
async function fetchNewRows(connection, table, since) {
  const query = `SELECT * FROM ${table} WHERE updated_at > ? ORDER BY updated_at DESC`;
  const [rows] = await connection.execute(query, [since]);
  return rows;
}

// API endpoint to add a new user
app.post('/addUser', async (req, res) => {
  const { first_name, last_name } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO villagelink_users (first_name, last_name, updated_at) VALUES (?, ?, NOW())`;
    const [result] = await connection.execute(query, [first_name, last_name]);
    const newUser = { id: result.insertId, name: `${first_name} ${last_name}`, updated_at: new Date() };
    await connection.end();

    // Emit the new user to all connected clients
    io.emit('newData', newUser);

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error inserting user:', err);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

io.on('connection', async (socket) => {
  console.log('New client connected:', socket.id);

  try {
    const connection = await mysql.createConnection(dbConfig);
    const users = await fetchAllRows(connection, 'villagelink_users');
    await connection.end();

    // Send initial data to the client
    socket.emit('tableData', users);
  } catch (err) {
    console.error('Error fetching initial users:', err);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

async function startPolling() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('Connected to MySQL database');

  setInterval(async () => {
    try {
      for (const table of TABLES) {
        const lastCheckTime = lastCheckTimes[table];
        const newRows = await fetchNewRows(connection, table, lastCheckTime);
        if (newRows.length > 0) {
          console.log(`Detected ${newRows.length} new/updated rows in ${table}`);
          const allRows = await fetchAllRows(connection, table);
          io.emit('refreshData', { table, data: allRows });
          lastCheckTimes[table] = new Date();
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, POLL_INTERVAL);
}

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  startPolling().catch((err) => {
    console.error('Failed to start polling:', err);
  });
});
