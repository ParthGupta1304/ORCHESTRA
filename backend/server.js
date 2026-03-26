require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const csvParser = require("csv-parser");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const GOOGLE_CLIENT_ID = (
  process.env.GOOGLE_CLIENT_ID || "placeholder_client_id"
).trim();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ success: false, error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ success: false, error: "Forbidden" });
    req.user = user;
    next();
  });
}

const { submitSchema } = require("./models/schemas");
const { orchestrate } = require("./pipeline/orchestrator");

const app = express();
app.use(
  cors({
    origin: ["https://orchestra-eosin.vercel.app"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads/" });
const db = require("./db/database");

const activeJobs = {}; // In-memory dictionary tracking batch process status

app.post("/api/auth/google", async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { rows: uRows } = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [payload.email],
    );
    let user = uRows[0];

    if (!user) {
      const user_id = crypto.randomUUID();
      await db.query(
        `
        INSERT INTO users (id, email, name, picture, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          user_id,
          payload.email,
          payload.name,
          payload.picture,
          new Date().toISOString(),
        ],
      );
      user = {
        id: user_id,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    }

    const backendToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ success: true, data: { token: backendToken, user } });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ success: false, error: "Invalid Google token" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });

    const { rows: euRows } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    const existingUser = euRows[0];
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, error: "Email is already registered" });

    const user_id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, 10);

    await db.query(
      `
      INSERT INTO users (id, email, name, password_hash, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [user_id, email, name, password_hash, new Date().toISOString()],
    );

    const user = { id: user_id, email, name, picture: null };
    const backendToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ success: true, data: { token: backendToken, user } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required" });

    const { rows: userRows } = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    const user = userRows[0];
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });

    if (!user.password_hash) {
      return res
        .status(401)
        .json({
          success: false,
          error:
            "This account was created using Google Sign-In. Please sign in with Google.",
        });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });

    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
    const backendToken = jwt.sign(
      { id: publicUser.id, email: publicUser.email, name: publicUser.name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      data: { token: backendToken, user: publicUser },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post(
  "/api/hackathon/upload",
  authenticateToken,
  upload.single("csv_file"),
  async (req, res) => {
    try {
      const data = req.body;
      const parsed = submitSchema.safeParse(data);

      if (!parsed.success)
        return res
          .status(400)
          .json({ success: false, error: parsed.error.format() });
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, error: "CSV file is required." });

      const hackathon_id = crypto.randomUUID();
      const ts = new Date().toISOString();

      await db.query(
        `
      INSERT INTO hackathons (id, judge_id, name, description, created_at) VALUES ($1, $2, $3, $4, $5)
    `,
        [
          hackathon_id,
          req.user.id,
          parsed.data.hackathon_name,
          parsed.data.description || null,
          ts,
        ],
      );

      const rows = [];
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on("data", (row) => rows.push(row))
        .on("end", () => {
          // Start background batch evaluation
          activeJobs[hackathon_id] = {
            total: rows.length,
            completed: 0,
            status: "processing",
            errors: [],
          };
          processBatch(hackathon_id, rows);

          res.json({
            success: true,
            data: {
              hackathon_id,
              message: "Batch process started",
              total_submissions: rows.length,
            },
          });
        });
    } catch (err) {
      console.error("Submit error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

async function processBatch(hackathon_id, rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Support lenient header matching from the CSV (case-insensitive keys mapping)
    const getVal = (possibleKeys) => {
      const key = Object.keys(row).find((k) =>
        possibleKeys.includes(k.trim().toLowerCase()),
      );
      return key ? row[key] : "";
    };

    const team_name = getVal(["team name", "team", "project name", "project"]);
    const github_url = getVal(["github url", "github", "repo url", "repo"]);
    const pptx_url = getVal([
      "pitch deck url",
      "pitch deck",
      "presentation",
      "pptx url",
    ]);
    const prototype_url = getVal([
      "prototype url",
      "prototype",
      "demo link",
      "demo",
    ]);

    if (!team_name || (!github_url && !pptx_url)) {
      activeJobs[hackathon_id].completed++;
      activeJobs[hackathon_id].errors.push(
        `Row ${i + 1}: Missing essential team name, or both repo and pitch missing. Skipped.`,
      );
      continue;
    }

    try {
      const inputs = { github_url, pptx_url, prototype_url };
      const pipelineResult = await orchestrate(null, inputs);
      const { judgeOutputs, audit, chief, feedback, rawContent } =
        pipelineResult;

      const submission_id = crypto.randomUUID();
      await db.query(
        `
        INSERT INTO submissions (id, hackathon_id, team_name, raw_content, prototype_url, total_score, confidence_tier, dimension_scores, agent_outputs, feedback_report, bias_flags, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
        [
          submission_id,
          hackathon_id,
          team_name,
          rawContent,
          prototype_url || null,
          chief.total_score,
          chief.confidence_tier,
          JSON.stringify(chief.dimension_scores),
          JSON.stringify(judgeOutputs),
          feedback,
          JSON.stringify(audit.flags || []),
          new Date().toISOString(),
        ],
      );
    } catch (e) {
      console.error(`Evaluation failed for team ${team_name}:`, e);
      activeJobs[hackathon_id].errors.push(`Team ${team_name}: ${e.message}`);
    }

    activeJobs[hackathon_id].completed++;
  }

  activeJobs[hackathon_id].status = "completed";
}

app.get("/api/hackathon/progress/:id", (req, res) => {
  const job = activeJobs[req.params.id];
  if (!job)
    return res.json({
      success: true,
      data: { status: "unknown or finished", completed: 0, total: 0 },
    });
  res.json({ success: true, data: job });
});

app.get("/api/organizer/hackathons", authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM hackathons WHERE judge_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/hackathons", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM hackathons ORDER BY created_at DESC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id as submission_id, team_name, total_score, confidence_tier, dimension_scores, prototype_url, hackathon_id FROM submissions ORDER BY total_score DESC",
    );
    const rankedRows = rows.map((r, i) => ({
      ...r,
      rank: i + 1,
      dimension_scores: JSON.parse(r.dimension_scores),
    }));
    res.json({ success: true, data: rankedRows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/leaderboard/:hackathon_id", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id as submission_id, team_name, total_score, confidence_tier, dimension_scores, prototype_url, hackathon_id FROM submissions WHERE hackathon_id = $1 ORDER BY total_score DESC",
      [req.params.hackathon_id],
    );
    const rankedRows = rows.map((r, i) => ({
      ...r,
      rank: i + 1,
      dimension_scores: JSON.parse(r.dimension_scores),
    }));
    res.json({ success: true, data: rankedRows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const { rows: statsRows } = await db.query(
      "SELECT COUNT(*) as c, AVG(total_score) as a FROM submissions",
    );
    const summary = statsRows[0];
    const { rows: topTeamRows } = await db.query(
      "SELECT team_name, total_score FROM submissions ORDER BY total_score DESC LIMIT 1",
    );
    const topTeam = topTeamRows[0] || null;

    res.json({
      success: true,
      data: {
        total_submissions: summary.c,
        average_score: Math.round(summary.a * 10) / 10 || 0,
        top_team: topTeam,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Used by individual results page
app.get("/api/results/:id", async (req, res) => {
  try {
    const { rows: rowRes } = await db.query(
      "SELECT * FROM submissions WHERE id = $1",
      [req.params.id],
    );
    const row = rowRes[0];
    if (!row)
      return res
        .status(404)
        .json({ success: false, error: "Submission not found" });

    const { rows: overrides } = await db.query(
      "SELECT * FROM overrides WHERE submission_id = $1 ORDER BY created_at ASC",
      [req.params.id],
    );
    const data = {
      ...row,
      dimension_scores: JSON.parse(row.dimension_scores),
      agent_outputs: JSON.parse(row.agent_outputs),
      bias_flags: JSON.parse(row.bias_flags),
      overrides,
    };
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Standard Override API
app.put("/api/override/:id", async (req, res) => {
  try {
    const sub_id = req.params.id;
    const { dimension, new_score, reason, judge_name } = req.body;
    const { rows: subRes } = await db.query(
      "SELECT * FROM submissions WHERE id = $1",
      [sub_id],
    );
    const sub = subRes[0];
    if (!sub)
      return res
        .status(404)
        .json({ success: false, error: "Submission not found" });

    let dimScores = JSON.parse(sub.dimension_scores);
    const original_score = dimScores[dimension] || 0;

    await db.query(
      `
      INSERT INTO overrides (id, submission_id, dimension, original_score, new_score, reason, judge_name, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        crypto.randomUUID(),
        sub_id,
        dimension,
        original_score,
        new_score,
        reason,
        judge_name,
        new Date().toISOString(),
      ],
    );

    const { rows: latestOverrides } = await db.query(
      "SELECT dimension, new_score FROM overrides WHERE submission_id = $1 ORDER BY created_at DESC",
      [sub_id],
    );
    const overrideMap = {};
    latestOverrides.forEach((o) => {
      if (!(o.dimension in overrideMap)) overrideMap[o.dimension] = o.new_score;
    });

    let totalScore = 0;
    Object.keys(dimScores).forEach((dim) => {
      totalScore +=
        overrideMap[dim] !== undefined ? overrideMap[dim] : dimScores[dim];
    });

    await db.query("UPDATE submissions SET total_score = $1 WHERE id = $2", [
      totalScore,
      sub_id,
    ]);
    res.json({
      success: true,
      data: { message: "Override recorded", total_score: totalScore },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`Orchestra Backend running on port ${PORT}`),
);
