require("dotenv").config();
const http = require("http");
const express = require("express");
const httpProxy = require("express-http-proxy");
const helmet = require("helmet");
const app = express();
const authRouter = require("./auth");
const { middleware } = require("./auth");

const championshipsServiceProxy = httpProxy(
  process.env.CHAMPIONSHIPS_SERVICE_URL
);
const companiesServiceProxy = httpProxy(process.env.COMPANIES_SERVICE_URL);

app.all("/championships(/*)?", middleware, championshipsServiceProxy);
app.all("/companies(/*)?", middleware, companiesServiceProxy);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(authRouter);

const server = http.createServer(app);
server.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
