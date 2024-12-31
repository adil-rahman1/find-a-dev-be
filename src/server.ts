import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import client from "./db";
import filePath from "./filePath";

dotenv.config();

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

//Route handlers for /developers/

app.get("/developers", async (_req, res) => {
  try {
    const sqlQuery = "SELECT * FROM developers ORDER BY id";
    const queryResult = await client.query(sqlQuery);
    res.status(200).json(queryResult.rows);
  } catch (error) {
    console.error("Error running query:", error);
    res.status(500).send("Database query error");
  }
});

app.get("/developers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const sqlQuery = "SELECT * FROM developers WHERE id = $1";
    const queryResult = await client.query(sqlQuery, [id]);
    if (queryResult.rows.length === 0) {
      res.status(404).json({ error: "Developer not found" });
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error("Error running query:", error);
    res.status(500).send("Database query error");
  }
});

app.post("/developers", async (req, res) => {
  try {
    const { name, profile_image, about_me } = req.body;
    const sqlQuery =
      "INSERT INTO developers (name, profile_image, about_me) values ($1, $2, $3) returning *";
    const queryResult = await client.query(sqlQuery, [
      name,
      profile_image,
      about_me,
    ]);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating developer" });
  }
});

app.patch("/developers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, profile_image, about_me } = req.body;
    const setClauses = [];
    const queryValues = [];

    if (name) {
      setClauses.push(`name = ($${setClauses.length + 1})`);
      queryValues.push(name);
    }
    if (profile_image) {
      setClauses.push(`profile_image = ($${setClauses.length + 1})`);
      queryValues.push(profile_image);
    }
    if (about_me) {
      setClauses.push(`"about_me" = ($${setClauses.length + 1})`);
      queryValues.push(about_me);
    }

    queryValues.push(id);

    const sqlQuery = `UPDATE developers SET ${setClauses.join(
      ", "
    )} WHERE id = ($${queryValues.length}) returning *`;
    const queryResult = await client.query(sqlQuery, queryValues);
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error("Error running query:", error);
    res.status(500).send("Error updating developer");
  }
});

//Route handlers for /developers/:id/social-links

app.get("/developers/:id/social-links", async (req, res) => {
  try {
    const id = req.params.id;
    const sqlQuery = "SELECT * FROM social_links WHERE developer_id = $1";
    const queryResult = await client.query(sqlQuery, [id]);
    if (queryResult.rows.length === 0) {
      res.status(404).json({ error: "Developer's social links not found" });
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error("Error running query:", error);
    res.status(500).send("Database query error");
  }
});

app.post("/developers/:id/social-links", async (req, res) => {
  try {
    const id = req.params.id;
    const { linkedin, github, website, other } = req.body;

    const insertClauses = ["developer_id"];
    const queryValues = [id];
    const placeholders = ["$1"];

    if (linkedin) {
      insertClauses.push("linkedin");
      queryValues.push(linkedin);
      placeholders.push(`$${queryValues.length}`);
    }

    if (github) {
      insertClauses.push("github");
      queryValues.push(github);
      placeholders.push(`$${queryValues.length}`);
    }

    if (website) {
      insertClauses.push("website");
      queryValues.push(website);
      placeholders.push(`$${queryValues.length}`);
    }

    if (other) {
      insertClauses.push("other");
      queryValues.push(other);
      placeholders.push(`$${queryValues.length}`);
    }

    const sqlQuery = `INSERT INTO social_links (${insertClauses.join(", ")}) values (${placeholders.join(", ")}) returning *`;
    console.log(sqlQuery);
    console.log(queryValues);
    const queryResult = await client.query(sqlQuery, queryValues);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating social links" });
  }
});

app.patch("/developers/:id/social-links", async (req, res) => {
  try {
    const id = req.params.id;
    const { linkedin, github, website, other } = req.body;

    const setClauses = [];
    const queryValues = [id];

    if (linkedin) {
      setClauses.push(`linkedin = $${queryValues.length + 1}`);
      queryValues.push(linkedin);
    }

    if (github) {
      setClauses.push(`github = $${queryValues.length + 1}`);
      queryValues.push(github);
    }

    if (website) {
      setClauses.push(`website = $${queryValues.length + 1}`);
      queryValues.push(website);
    }

    if (other) {
      setClauses.push(`other = $${queryValues.length + 1}`);
      queryValues.push(other);
    }

    const sqlQuery = `UPDATE social_links SET ${setClauses.join(", ")} WHERE developer_id = $1 returning *`;
    console.log(sqlQuery);
    console.log(queryValues);
    const queryResult = await client.query(sqlQuery, queryValues);
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error updating social links" });
  }
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
