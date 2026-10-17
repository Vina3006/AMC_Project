const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();
 
// A hosted database (like Aiven) only accepts an encrypted connection.
// On your own computer DB_SSL is not set, so nothing changes there.
function sslOptions() {
  if (process.env.DB_SSL !== 'true') return undefined;
 
  // best: the certificate file from Aiven (ca.pem)
  if (process.env.DB_SSL_CA_PATH) {
    return { ca: fs.readFileSync(process.env.DB_SSL_CA_PATH, 'utf8') };
  }
  // or the certificate text pasted into a setting
  if (process.env.DB_SSL_CA) {
    return { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') };
  }
  // last resort: encrypted but without checking the certificate (less safe)
  return { rejectUnauthorized: false };
}
 
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslOptions(),
  waitForConnections: true,
  connectionLimit: 10,
});
 
module.exports = pool;
 
