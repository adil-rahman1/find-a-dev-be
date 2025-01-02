import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import client from "./db";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

const port = process.env.PORT ?? 3000;

// ROUTE HANDLERS FOR /developers/

app.get("/developers", async (_req, res) => {
  try {
    const sqlQuery = "SELECT * FROM developers ORDER BY id";
    const queryResult = await client.query(sqlQuery);
    res.status(200).json(queryResult.rows);
  } catch (error) {
    console.error("Error occurred while retrieving developers ->", error);
    res
      .status(500)
      .send("Internal server error. Could not retrieve developers.");
  }
});

app.get("/developers/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const sqlQuery = "SELECT * FROM developers WHERE id = $1";
    const queryResult = await client.query(sqlQuery, [id]);
    if (queryResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} does not exist` });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while retrieving developer with ID = ${id} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not retrieve developer information with ID = ${id}.`
      );
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
    console.error("Error occurred while creating developer ->", error);
    res
      .status(500)
      .json({ error: "Internal server error. Could not create developer." });
  }
});

app.patch("/developers/:id", async (req, res) => {
  const id = req.params.id;
  try {
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
    if (queryResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} does not exist` });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while updating developer with ID = ${id} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not update developer information with ID = ${id}.`
      );
  }
});

// ROUTE HANDLERS FOR /developers/:id/social-links

app.get("/developers/:id/social-links", async (req, res) => {
  const id = req.params.id;
  try {
    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [id]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} does not exist` });
      return;
    }
    const sqlQuery = "SELECT * FROM social_links WHERE developer_id = $1";
    const queryResult = await client.query(sqlQuery, [id]);
    if (queryResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} has no social links` });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while retrieving social links for developer with ID = ${id} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not retrieve social links for developers with ID = ${id}.`
      );
  }
});

app.post("/developers/:id/social-links", async (req, res) => {
  const id = req.params.id;
  try {
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
    const queryResult = await client.query(sqlQuery, queryValues);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while adding social links for developer with ID = ${id} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not add social links for developer with ID = ${id}.`,
    });
  }
});

app.patch("/developers/:id/social-links", async (req, res) => {
  const id = req.params.id;
  try {
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

    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [id]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} does not exist` });
      return;
    }

    const sqlQuery = `UPDATE social_links SET ${setClauses.join(", ")} WHERE developer_id = $1 returning *`;
    const queryResult = await client.query(sqlQuery, queryValues);
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while updating social links for developer with ID = ${id} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not update social links for developer with ID = ${id}.`,
    });
  }
});

// ROUTE HANDLERS FOR /developers/:id/services

app.get("/developers/:id/services", async (req, res) => {
  const id = req.params.id;
  try {
    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [id]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} does not exist` });
      return;
    }

    const sqlQuery =
      "SELECT developer_services.id, services.title FROM developer_services INNER JOIN services ON developer_services.service_id = services.id WHERE developer_services.developer_id = $1";
    const queryResult = await client.query(sqlQuery, [id]);
    if (queryResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} has no services` });
      return;
    }
    res.status(200).json(queryResult.rows);
  } catch (error) {
    console.error(
      `Error occurred while retrieving services for developer with ID = ${id} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not retrieve services for developer with ID = ${id}.`
      );
  }
});

// ROUTE HANDLERS FOR /businesses

app.get("/businesses", async (_req, res) => {
  try {
    const sqlQuery = "SELECT * FROM businesses ORDER BY id";
    const queryResult = await client.query(sqlQuery);
    res.status(200).json(queryResult.rows);
  } catch (error) {
    console.error("Error occurred while retrieving businesses ->", error);
    res
      .status(500)
      .send("Internal server error. Could not retrieve businesses.");
  }
});

app.get("/businesses/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const sqlQuery = "SELECT * FROM businesses WHERE id = $1";
    const queryResult = await client.query(sqlQuery, [id]);
    if (queryResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Business with ID = ${id} does not exist` });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while retrieving business with ID = ${id} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not retrieve business with ID = ${id}.`
      );
  }
});

app.post("/businesses", async (req, res) => {
  try {
    const { name, company_logo, industry, description } = req.body;
    const sqlQuery =
      "INSERT INTO businesses (name, company_logo, industry, description) values ($1, $2, $3, $4) returning *";
    const queryResult = await client.query(sqlQuery, [
      name,
      company_logo,
      industry,
      description,
    ]);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.error("Error occurred while creating business ->", error);
    res
      .status(500)
      .json({ error: "Internal server error. Could not create business." });
  }
});

app.patch("/businesses/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const { name, company_logo, industry, description } = req.body;
    const setClauses = [];
    const queryValues = [];

    if (name) {
      setClauses.push(`name = ($${setClauses.length + 1})`);
      queryValues.push(name);
    }
    if (company_logo) {
      setClauses.push(`company_logo = ($${setClauses.length + 1})`);
      queryValues.push(company_logo);
    }
    if (industry) {
      setClauses.push(`"industry" = ($${setClauses.length + 1})`);
      queryValues.push(industry);
    }

    if (description) {
      setClauses.push(`"description" = ($${setClauses.length + 1})`);
      queryValues.push(description);
    }

    queryValues.push(id);

    const sqlQuery = `UPDATE businesses SET ${setClauses.join(
      ", "
    )} WHERE id = ($${queryValues.length}) returning *`;
    const queryResult = await client.query(sqlQuery, queryValues);
    if (queryResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Business with ID = ${id} does not exist` });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while updating business with ID = ${id} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not update business information with ID = ${id}.`
      );
  }
});

// ROUTE HANDLERS FOR /developers/:id/testimonials

app.get("/developers/:id/testimonials", async (req, res) => {
  const id = req.params.id;
  try {
    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [id]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} does not exist` });
      return;
    }

    const sqlQuery =
      "SELECT testimonials.developer_id, businesses.name, testimonials.rating, testimonials.feedback FROM testimonials INNER JOIN businesses ON testimonials.testimonial_owner = businesses.id WHERE testimonials.developer_id = $1";
    const queryResult = await client.query(sqlQuery, [id]);
    if (queryResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} has no testimonials` });
      return;
    }
    res.status(200).json(queryResult.rows);
  } catch (error) {
    console.error(
      `Error occurred while retrieving testimonials for developer with ID = ${id} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not retrieve testimonials for developer with ID = ${id}.`
      );
  }
});

app.post("/developers/:id/testimonials", async (req, res) => {
  const id = req.params.id;
  try {
    const { testimonial_owner, rating, feedback } = req.body;

    const sqlQuery = `INSERT INTO testimonials (developer_id, testimonial_owner, rating, feedback) values ($1, $2, $3, $4) returning *`;
    const queryResult = await client.query(sqlQuery, [
      id,
      testimonial_owner,
      rating,
      feedback,
    ]);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while adding a testimonial for developer with ID = ${id} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not add a testimonial for developer with ID = ${id}.`,
    });
  }
});

app.patch("/developers/:id/testimonials", async (req, res) => {
  const id = req.params.id;
  try {
    const { testimonial_owner, rating, feedback } = req.body;
    const setClauses = [];
    const queryValues = [id, testimonial_owner];

    if (rating) {
      setClauses.push(`rating = $${queryValues.length + 1}`);
      queryValues.push(rating);
    }

    if (feedback) {
      setClauses.push(`feedback = $${queryValues.length + 1}`);
      queryValues.push(feedback);
    }

    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [id]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} does not exist` });
      return;
    }

    const sqlQuery = `UPDATE testimonials SET ${setClauses.join(", ")} WHERE developer_id = $1 AND testimonial_owner = $2 returning *`;
    const queryResult = await client.query(sqlQuery, queryValues);
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while updating testimonial for developer with ID = ${id} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not update testimonial for developer with ID = ${id}.`,
    });
  }
});

// ROUTE HANDLERS FOR /business-projects

app.get("/business-projects", async (_req, res) => {
  try {
    const sqlQuery = "SELECT * FROM business_projects ORDER BY id";
    const queryResult = await client.query(sqlQuery);
    res.status(200).json(queryResult.rows);
  } catch (error) {
    console.error(
      "Error occurred while retrieving business projects ->",
      error
    );
    res
      .status(500)
      .send("Internal server error. Could not retrieve business projects.");
  }
});

app.post("/business-projects", async (req, res) => {
  try {
    const { project_owner, title, brief, desired_skill, status, deadline } =
      req.body;
    const sqlQuery = `INSERT INTO business_projects (project_owner, title, brief, desired_skill, deadline, status) values ($1, $2, $3, $4, $5, $6) returning *`;
    const queryResult = await client.query(sqlQuery, [
      project_owner,
      title,
      brief,
      desired_skill,
      deadline,
      status,
    ]);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.error("Error occurred while creating business project ->", error);
    res.status(500).json({
      error: "Internal server error. Could not create business project.",
    });
  }
});

app.patch("/business-projects/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  const { projectOwner, title, brief, desired_skil, status, deadline } =
    req.body;
  try {
    const setClauses = [];
    const queryValues = [projectId];

    if (projectOwner) {
      setClauses.push(`project_owner = $${queryValues.length + 1}`);
      queryValues.push(projectOwner);
    }

    if (title) {
      setClauses.push(`title = $${queryValues.length + 1}`);
      queryValues.push(title);
    }

    if (brief) {
      setClauses.push(`brief = $${queryValues.length + 1}`);
      queryValues.push(brief);
    }

    if (desired_skil) {
      setClauses.push(`desired_skil = $${queryValues.length + 1}`);
      queryValues.push(desired_skil);
    }

    if (status) {
      setClauses.push(`status = $${queryValues.length + 1}`);
      queryValues.push(status);
    }

    if (deadline) {
      setClauses.push(`deadline = $${queryValues.length + 1}`);
      queryValues.push(deadline);
    }

    const businessResult = await client.query(
      "SELECT * FROM businesses WHERE id = $1",
      [projectOwner]
    );
    if (businessResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Business with ID = ${projectOwner} does not exist` });
      return;
    }

    const sqlQuery = `UPDATE business_projects SET ${setClauses.join(", ")} WHERE id = $1 returning *`;
    const queryResult = await client.query(sqlQuery, queryValues);
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while updating project for business with ID = ${projectOwner} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not update project for business with project_owner = ${projectOwner}.`,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
