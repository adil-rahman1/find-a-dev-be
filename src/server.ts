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
    const { name, profileImage, aboutMe } = req.body;
    const sqlQuery =
      "INSERT INTO developers (name, profile_image, about_me) values ($1, $2, $3) returning *";
    const queryResult = await client.query(sqlQuery, [
      name,
      profileImage,
      aboutMe,
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
    const { name, profileImage, aboutMe } = req.body;
    const setClauses = [];
    const queryValues = [];

    if (name) {
      setClauses.push(`name = ($${setClauses.length + 1})`);
      queryValues.push(name);
    }
    if (profileImage) {
      setClauses.push(`profile_image = ($${setClauses.length + 1})`);
      queryValues.push(profileImage);
    }
    if (aboutMe) {
      setClauses.push(`"about_me" = ($${setClauses.length + 1})`);
      queryValues.push(aboutMe);
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

app.get("/developers/:id/skills", async (req, res) => {
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
      "SELECT ds.developer_id, string_agg(s.name, ', ') as skills FROM skills s JOIN developer_skills ds ON ds.skill_id = s.id WHERE ds.developer_id = $1 GROUP BY ds.developer_id;";
    const queryResult = await client.query(sqlQuery, [id]);
    if (queryResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} has no skills` });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while retrieving skills for developer with ID = ${id} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not retrieve skills for developer with ID = ${id}.`
      );
  }
});

app.post("/developers/:id/skills", async (req, res) => {
  const devId = req.params.id;
  const { skillId } = req.body;

  try {
    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [devId]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${devId} does not exist` });
      return;
    }
    const skillResult = await client.query(
      "SELECT * FROM skills WHERE id = $1",
      [skillId]
    );
    if (skillResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Skill with ID = ${skillId} does not exist` });
      return;
    }

    const sqlQuery =
      "INSERT INTO developer_skills (developer_id, skill_id) values ($1, $2) returning *";
    const queryResult = await client.query(sqlQuery, [devId, skillId]);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while creating skill for developer with ID = ${devId} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not create skill for developer with ID = ${devId}.`,
    });
  }
});

app.delete("/developers/:id/skills", async (req, res) => {
  const devId = req.params.id;
  const { skillId } = req.body;
  try {
    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [devId]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${devId} does not exist` });
      return;
    }
    const skillResult = await client.query(
      "SELECT * FROM skills WHERE id = $1",
      [skillId]
    );
    if (skillResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Skill with ID = ${skillId} does not exist` });
      return;
    }

    const sqlQuery = `DELETE FROM developer_skills WHERE developer_id = $1 AND skill_id = $2 returning *`;
    const queryResult = await client.query(sqlQuery, [devId, skillId]);

    if (queryResult.rowCount === 0) {
      res.status(404).json({ error: "Developer's skill not found." });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(`Error occurred while deleting developer's skill->`, error);
    res.status(500).json({
      error: `Internal server error. Could not delete developer's skill.`,
    });
  }
});

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
    const { name, companyLogo, industry, description } = req.body;
    const sqlQuery =
      "INSERT INTO businesses (name, company_logo, industry, description) values ($1, $2, $3, $4) returning *";
    const queryResult = await client.query(sqlQuery, [
      name,
      companyLogo,
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
    const { name, companyLogo, industry, description } = req.body;
    const setClauses = [];
    const queryValues = [];

    if (name) {
      setClauses.push(`name = ($${setClauses.length + 1})`);
      queryValues.push(name);
    }
    if (companyLogo) {
      setClauses.push(`company_logo = ($${setClauses.length + 1})`);
      queryValues.push(companyLogo);
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
  const { testimonialOwner, rating, feedback } = req.body;
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

    const businessResult = await client.query(
      "SELECT * FROM businesses WHERE id = $1",
      [testimonialOwner]
    );
    if (businessResult.rows.length === 0) {
      res.status(404).json({
        error: `Business with ID = ${testimonialOwner} does not exist`,
      });
      return;
    }

    const sqlQuery = `INSERT INTO testimonials (developer_id, testimonial_owner, rating, feedback) values ($1, $2, $3, $4) returning *`;
    const queryResult = await client.query(sqlQuery, [
      id,
      testimonialOwner,
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
  const { testimonialOwner, rating, feedback } = req.body;

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

    const businessResult = await client.query(
      "SELECT * FROM businesses WHERE id = $1",
      [testimonialOwner]
    );
    if (businessResult.rows.length === 0) {
      res.status(404).json({
        error: `Business with ID = ${testimonialOwner} does not exist`,
      });
      return;
    }

    const setClauses = [];
    const queryValues = [id, testimonialOwner];

    if (rating) {
      setClauses.push(`rating = $${queryValues.length + 1}`);
      queryValues.push(rating);
    }

    if (feedback) {
      setClauses.push(`feedback = $${queryValues.length + 1}`);
      queryValues.push(feedback);
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

app.delete("/developers/:id/testimonials", async (req, res) => {
  const devId = req.params.id;
  const { testimonialOwner } = req.body;
  try {
    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [devId]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${devId} does not exist` });
      return;
    }
    const businessResult = await client.query(
      "SELECT * FROM businesses WHERE id = $1",
      [testimonialOwner]
    );
    if (businessResult.rows.length === 0) {
      res.status(404).json({
        error: `Business with ID = ${testimonialOwner} does not exist`,
      });
      return;
    }

    const sqlQuery = `DELETE FROM testimonials WHERE developer_id = $1 AND testimonial_owner = $2 returning *`;
    const queryResult = await client.query(sqlQuery, [devId, testimonialOwner]);

    if (queryResult.rowCount === 0) {
      res.status(404).json({
        error: `Developer's testimonial not found from business with ID = ${testimonialOwner}.`,
      });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while deleting developer's testimonial->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not delete developer's testimonial.`,
    });
  }
});

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
    const { projectOwner, title, brief, desiredSkill, status, deadline } =
      req.body;
    const sqlQuery = `INSERT INTO business_projects (project_owner, title, brief, desired_skill, deadline, status) values ($1, $2, $3, $4, $5, $6) returning *`;
    const queryResult = await client.query(sqlQuery, [
      projectOwner,
      title,
      brief,
      desiredSkill,
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

app.patch("/business-projects/:id", async (req, res) => {
  const projectId = req.params.id;
  const { projectOwner, title, brief, desiredSkill, status, deadline } =
    req.body;
  try {
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

    if (desiredSkill) {
      setClauses.push(`desired_skill = $${queryValues.length + 1}`);
      queryValues.push(desiredSkill);
    }

    if (status) {
      setClauses.push(`status = $${queryValues.length + 1}`);
      queryValues.push(status);
    }

    if (deadline) {
      setClauses.push(`deadline = $${queryValues.length + 1}`);
      queryValues.push(deadline);
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

app.delete("/business-projects/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const sqlQuery = `DELETE FROM business_projects WHERE id = $1 returning *`;
    const queryResult = await client.query(sqlQuery, [id]);

    if (queryResult.rowCount === 0) {
      res.status(404).json({ error: "Business project not found." });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while deleting business project with ID = ${id} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not delete business project with ID = ${id}.`,
    });
  }
});

app.get("/project-applications", async (_req, res) => {
  try {
    const sqlQuery = "SELECT * FROM project_applications ORDER BY id";
    const queryResult = await client.query(sqlQuery);
    res.status(200).json(queryResult.rows);
  } catch (error) {
    console.error(
      "Error occurred while retrieving project applications ->",
      error
    );
    res
      .status(500)
      .send("Internal server error. Could not retrieve project applications.");
  }
});

app.post("/project-applications", async (req, res) => {
  try {
    const { developerId, projectId, status } = req.body;
    const sqlQuery =
      "INSERT INTO project_applications (developer_id, project_id, status) values ($1, $2, $3) returning *";
    const queryResult = await client.query(sqlQuery, [
      developerId,
      projectId,
      status,
    ]);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.error("Error occurred while creating application ->", error);
    res
      .status(500)
      .json({ error: "Internal server error. Could not create application." });
  }
});

app.patch("/project-applications/:id", async (req, res) => {
  const applicationId = req.params.id;
  const status = req.body.status;
  try {
    const sqlQuery = `UPDATE project_applications SET status = $1 WHERE id = $2 returning *`;
    const queryResult = await client.query(sqlQuery, [status, applicationId]);
    if (queryResult.rows.length === 0) {
      res.status(404).json({
        error: `Application with ID = ${applicationId} does not exist`,
      });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while updating application with ID = ${applicationId} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not update application with ID = ${applicationId}.`
      );
  }
});

app.get("/developers/:id/projects", async (req, res) => {
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
      "SELECT dp.id, dp.project_owner, dp.image, dp.title, dp.description, string_agg(ps.skill_name, ', ') as skills FROM developer_projects dp JOIN project_skills ps ON dp.id = ps.project_id WHERE dp.project_owner = $1 GROUP BY 1, 2, 3, 4, 5;";
    const queryResult = await client.query(sqlQuery, [id]);
    if (queryResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${id} has no projects` });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while retrieving projects for developer with ID = ${id} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not retrieve projects for developer with ID = ${id}.`
      );
  }
});

app.post("/developers/:id/projects", async (req, res) => {
  const id = req.params.id;
  const { image, title, description } = req.body;
  try {
    const sqlQuery =
      "INSERT INTO developer_projects (project_owner, image, title, description) values ($1, $2, $3, $4) returning *";
    const queryResult = await client.query(sqlQuery, [
      id,
      image,
      title,
      description,
    ]);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while creating project for developer with ID = ${id} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not create project for developer with ID = ${id}.`,
    });
  }
});

app.patch("/developers/:devId/projects/:projectId", async (req, res) => {
  const devId = req.params.devId;
  const projectId = req.params.projectId;
  const { image, title, description } = req.body;
  try {
    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [devId]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${devId} does not exist` });
      return;
    }

    const projectResult = await client.query(
      "SELECT * FROM developer_projects WHERE id = $1",
      [projectId]
    );
    if (projectResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Project with ID = ${projectId} does not exist` });
      return;
    }

    const setClauses = [];
    const queryValues = [projectId];

    if (image) {
      setClauses.push(`image = $${queryValues.length + 1}`);
      queryValues.push(image);
    }

    if (title) {
      setClauses.push(`title = $${queryValues.length + 1}`);
      queryValues.push(title);
    }

    if (description) {
      setClauses.push(`description = $${queryValues.length + 1}`);
      queryValues.push(description);
    }

    const sqlQuery = `UPDATE developer_projects SET ${setClauses.join(", ")} WHERE id = $1 returning *`;
    const queryResult = await client.query(sqlQuery, queryValues);
    if (queryResult.rows.length === 0) {
      res.status(404).json({
        error: `Project with ID = ${projectId} does not exist`,
      });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while updating application with ID = ${projectId} ->`,
      error
    );
    res
      .status(500)
      .send(
        `Internal server error. Could not update project with ID = ${projectId}.`
      );
  }
});

app.delete("/developers/:devId/projects/:projectId", async (req, res) => {
  const { devId, projectId } = req.params;
  try {
    const developerResult = await client.query(
      "SELECT * FROM developers WHERE id = $1",
      [devId]
    );
    if (developerResult.rows.length === 0) {
      res
        .status(404)
        .json({ error: `Developer with ID = ${devId} does not exist` });
      return;
    }

    const sqlQuery = `DELETE FROM developer_projects WHERE id = $1 returning *`;
    const queryResult = await client.query(sqlQuery, [projectId]);

    if (queryResult.rowCount === 0) {
      res.status(404).json({ error: "Developer's project not found." });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(`Error occurred while deleting developer's project->`, error);
    res.status(500).json({
      error: `Internal server error. Could not delete developer's project.`,
    });
  }
});

app.post("/project-skills", async (req, res) => {
  const { skillName, projectId } = req.body;
  try {
    const sqlQuery = `INSERT INTO project_skills (skill_name, project_id) values ($1, $2) returning *`;
    const queryResult = await client.query(sqlQuery, [skillName, projectId]);
    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while adding a skill for project with ID = ${projectId} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not add a skill for project with ID = ${projectId}.`,
    });
  }
});

app.delete("/project-skills/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const sqlQuery = `DELETE FROM project_skills WHERE id = $1 returning *`;
    const queryResult = await client.query(sqlQuery, [id]);

    if (queryResult.rowCount === 0) {
      res.status(404).json({ error: "Project skill not found." });
      return;
    }
    res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error(
      `Error occurred while deleting a project skill with ID = ${id} ->`,
      error
    );
    res.status(500).json({
      error: `Internal server error. Could not delete project skill with ID = ${id}.`,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
