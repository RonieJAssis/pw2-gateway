const { Pool, Client } = require("pg");
const express = require("express");
const jwt = require("jsonwebtoken");

const dbConfigs = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(dbConfigs);
const client = new Client(dbConfigs);

pool.query(
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (email)
)`,
  (err, res) => {
    if (err) {
      console.log(err);
    }
    console.log(res);
    client.connect();
    pool.end();
  }
);

const router = express.Router();

router.post("/login", (request, response) => {
  const { email, password } = request.body;
  if (!email || !password) {
    return response
      .status(400)
      .json({ error: "Email and password are required" });
  }
  client.query(
    `SELECT * FROM users WHERE email = $1 AND password = $2`,
    [email, password],
    (err, res) => {
      if (err) {
        console.log(err);
        response.status(500).send(err);
      } else {
        if (res.rows.length === 0) {
          response.status(401).send("Invalid credentials");
        } else {
          const user = res.rows[0];
          const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
          });
          response.status(200).send({ token });
        }
      }
    }
  );
});

router.post("/register", (request, response) => {
  const { name, email, password } = request.body;
  if (!name || !email || !password) {
    response.status(400).send("Missing required fields");
  }
  client.query(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3)`,
    [name, email, password],
    (err, res) => {
      if (err) {
        console.log(err);
        response.status(500).send(err);
      } else {
        response.status(200).send("User created");
      }
    }
  );
});

const authMiddleware = (request, response, next) => {
  const token = request.headers["x-access-token"];
  if (!token) {
    return response.status(401).send("No token provided");
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return response.status(401).send("Invalid token");
    }
    request.user = decoded;
    next();
  });
};

module.exports = router;
module.exports.middleware = authMiddleware;
