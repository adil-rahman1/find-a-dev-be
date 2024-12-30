import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { Client } from "pg";
import filePath from "./filePath";

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect();

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

const port = process.env.PORT ?? 3000;

// API info page`
app.get("/api", (_req, res) => {
  const pathToFile = filePath("../public/index.html");
  res.sendFile(pathToFile);
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
