# Orchestra

Orchestra is a hackathon judging platform that lets organizers upload a CSV of team submissions and get back detailed AI-generated scores, rankings, and feedback. The idea is simple: instead of five judges manually reviewing thirty pitch decks and twenty GitHub repos, you upload one spreadsheet and come back to a leaderboard.

The system runs each submission through a pipeline of specialized AI agents that each focus on a different dimension of the project. A bias auditor checks their work, and a chief judge produces the final score. Organizers can then review results, read team-level feedback, and manually override any score they disagree with.

---

## Features

- Upload a CSV of hackathon submissions and let evaluation run in the background
- Five specialized AI judges scoring on innovation, technical quality, business viability, presentation, and clarity
- Bias auditor that checks judge outputs before the final score is calculated
- Chief judge that aggregates scores and assigns a confidence tier (High, Medium, or Low)
- Auto-generated feedback report for each team
- Live progress tracking while the batch job is running
- Global and per-hackathon leaderboard
- Score override system so human judges can adjust AI scores with a reason and their name
- Stores everything in a local SQLite database

---

## Scoring System

Each submission is scored out of 100 points spread across five categories:

| Category     | Max Score | What it looks at |
|--------------|-----------|------------------|
| Innovation   | 25        | Uniqueness of the idea and creative problem-solving |
| Technical    | 25        | Code quality, architecture, and technical complexity |
| Business     | 15        | Market opportunity, feasibility, and monetization |
| Presentation | 15        | Clarity of the pitch deck and storytelling |
| Clarity      | 20        | How clearly the problem and solution are communicated |

After the five judges run in parallel, the bias auditor reviews their outputs and flags any potential issues. The chief judge then sums up the scores and assigns a confidence tier based on the quality of information available.

---

## Project Structure

```
ORBIX/
├── backend/
│   ├── agents/
│   │   ├── innovationJudge.js      # Scores originality and creativity
│   │   ├── technicalJudge.js       # Scores code quality and architecture
│   │   ├── businessJudge.js        # Scores market viability and business sense
│   │   ├── presentationJudge.js    # Scores the pitch deck
│   │   ├── clarityJudge.js         # Scores communication quality
│   │   ├── biasAuditor.js          # Flags potential bias in judge outputs
│   │   └── chiefJudge.js           # Aggregates scores and assigns confidence
│   ├── db/
│   │   └── database.js             # SQLite setup and table creation
│   ├── models/
│   │   └── schemas.js              # Zod validation schema for the upload form
│   ├── pipeline/
│   │   ├── orchestrator.js         # Runs the full evaluation pipeline
│   │   ├── parser.js               # Fetches and parses GitHub repos and PPTX files
│   │   └── feedbackEngine.js       # Generates the written feedback report
│   ├── uploads/                    # Temporary folder for uploaded CSV files
│   ├── utils.js                    # Shared helper utilities
│   └── server.js                   # Express server and all API routes
│
└── frontend/
    ├── app/
    │   ├── dashboard/              # Main dashboard page
    │   ├── hackathons/             # Hackathon list and detail views
    │   ├── upload/                 # CSV upload form
    │   ├── results/                # Individual team result page
    │   ├── login/                  # Login page
    │   └── signup/                 # Signup page
    ├── components/
    │   └── ui/                     # Shared UI components
    └── public/                     # Static assets
```

---

## CSV Format

Your spreadsheet needs at least these columns. Column names are matched case-insensitively so minor variations like "Team Name" or "team name" both work.

| Column         | Accepted Variations                                         | Required |
|----------------|-------------------------------------------------------------|----------|
| Team name      | team name, team, project name, project                      | Yes      |
| GitHub URL     | github url, github, repo url, repo                          | Yes*     |
| Pitch deck URL | pitch deck url, pitch deck, presentation, pptx url          | Yes*     |
| Prototype URL  | prototype url, prototype, demo link, demo                   | No       |

*At least one of GitHub URL or Pitch deck URL must be present for a row to be evaluated.

---

## API Reference

| Method | Endpoint                          | What it does |
|--------|-----------------------------------|--------------|
| POST   | /api/hackathon/upload             | Upload CSV and start batch evaluation |
| GET    | /api/hackathon/progress/:id       | Check progress of a running batch job |
| GET    | /api/hackathons                   | List all hackathons |
| GET    | /api/leaderboard                  | Global leaderboard across all hackathons |
| GET    | /api/leaderboard/:hackathon_id    | Leaderboard for a specific hackathon |
| GET    | /api/results/:id                  | Full result for a single submission |
| GET    | /api/stats                        | Summary stats (total submissions, average score, top team) |
| PUT    | /api/override/:id                 | Submit a manual score override |

---

## Setup

**Requirements:** Node.js 18 or above, and an OpenAI API key.

**Backend**

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:

```
OPENAI_API_KEY=your_key_here
PORT=8000
```

Then start the server:

```bash
npm run dev
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open your browser and go to `http://localhost:3000`.

---

## How It Works

1. Organizer fills in the hackathon name and uploads the CSV file from the upload page
2. The backend reads each row and kicks off a background evaluation job
3. For each team, the parser fetches the GitHub repo and downloads the PPTX if a link is provided
4. Five judge agents run at the same time using GPT-4o, each scoring one dimension
5. The bias auditor reviews the outputs and flags anything suspicious
6. The chief judge calculates the final score and confidence tier
7. A feedback engine writes a summary report for the team
8. Everything is saved to the SQLite database and the leaderboard updates
9. Organizers can open any team's result page to see the full breakdown and write an override if needed
