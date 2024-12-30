import { Client } from "pg";

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});

client
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL");
  })
  .catch((error) => {
    console.error("Error connecting to PostgreSQL:", error);
  });

export default client;
