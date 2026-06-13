# Cyber Escape Room 


> **An AI-powered cybersecurity investigation game where you act as a SOC analyst solving realistic incident-response cases.**
> **Developed with the assistance of GitHub Copilot as part of the Microsoft AI Skills Fest 2026 - Agents League Hackathon.**



<div align="center">

### 🏆 Built for Microsoft AI Skills Fest 2026

An interactive game experience combining React, TypeScript, and Gemini AI with a secure backend architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org)
[![Gemini API](https://img.shields.io/badge/Gemini-API-purple)](https://ai.google.dev)

</div>

---

##  SECURITY ARCHITECTURE

```
FRONTEND                        BACKEND                        GEMINI API
(No API Keys)                (API Key Protected)            (Secure Connection)

   React App    ─────────────►  Express Server   ────────────►  Google
                  Same-Origin     
                               🔒 API Key: SAFE
                               🔒 Environment Vars
                               🔒 Rate Limited
```

###  Security Features

- **API Key Isolation** - Stored only on backend, never exposed to client
- **Environment Variables** - All secrets protected in `.env` files (gitignored)
- **Session Management** - Solutions tracked server-side, not sent to client
- **Rate Limiting** - Per-IP request caps on all `/api` routes
- **Error Handling** - No sensitive info in error messages

---

## Features

- **AI-Generated Incidents** - Gemini generates unique, realistic cybersecurity scenarios
- **Interactive Investigation** - Query the incident database with natural language
- **Evidence Analysis** - Examine emails, logs, network activity, and employee interviews
- **Progressive Hints** - Get up to 3 increasingly specific clues (with score penalties)
- **Difficulty Levels** - Beginner, Intermediate, and Expert modes
- **Scoring System** - Ranked investigation performance with investigator titles
- **Cyberpunk UI** - Dark theme with terminal green accents and glowing effects

---

##  Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎮 Cyber Escape Room UI                      │
├─────────────────────────────────────────────────────────────────┤
│  React + TypeScript + Tailwind (NO API KEYS)                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Same-origin requests
                       ▼
        ┌──────────────────────────────┐
        │  🛡️ Secure Backend Server    │
        ├──────────────────────────────┤
        │  Express.js + Vite            │
        │  ✓ API Key Protected         │
        │  ✓ Input Validated           │
        │  ✓ Rate Limited              │
        └──────────────┬───────────────┘
                       │ HTTPS (API_KEY protected)
                       ▼
        ┌──────────────────────────────┐
        │  🤖 Gemini AI API             │
        │  (gemini-3.5-flash)           │
        └──────────────────────────────┘
```

---

## 🚀 Live Demo

Try it instantly — no setup, no API key required:

**[Cyber-Escape-Room](https://cyber-escape-room-ai.onrender.com)**

---

## Quick Start


### Prerequisites
- Node.js 18+
- npm
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ali-hue-byte/Cyber-Escape-Room.git
   cd Cyber-Escape-Room
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create your environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_Gemini_api_key
   ```

   Don't have a key yet? Get one free at [aistudio.google.com](https://aistudio.google.com).

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## Project Structure

```
cyber-escape-room/
├── server.ts                    # Express + Vite server (single process)
├── .env.example                 # Environment variable template
├── src/
│   ├── components/              # React components
│   ├── App.tsx                  # Main game UI and state
│   └── types.ts                 # TypeScript interfaces
├── package.json                 # Frontend + backend deps
└── README.md                    # This file
```

---

## How to Play

### 1️⃣ **Select Difficulty**
Choose between Beginner, Intermediate, or Expert difficulty levels.

### 2️⃣ **Generate Incident**
Gemini AI creates a unique cybersecurity incident. Solution is stored **securely on backend** (never sent to the client).

### 3️⃣ **Investigate**
Ask the backend database questions about:
- Employee activities and statements
- Security logs and events
- Email communications
- Network connections

### 4️⃣ **Analyze Evidence**
Review evidence in the Evidence Panel:
- **Emails**: Communications and headers
- **Logs**: Security events and severity
- **Network**: Traffic and protocols
- **Interviews**: Employee statements
- **Alerts**: Security warnings

### 5️⃣ **Use Hints** (Optional)
Request up to 3 progressive hints (with a score penalty per hint).

### 6️⃣ **Submit Accusation**
Provide your findings:
- Attack Type
- Entry Point
- Vulnerability
- Mitigation Strategy

### 7️⃣ **View Results**
See your AI-graded score and the correct solution, evaluated by the secure backend.

---

## Scoring System

| Component | Points | Formula |
|-----------|--------|---------|
| Accuracy | 0-100 | 4 fields (Attack Type, Entry Point, Vulnerability, Mitigation), 0-25 each, AI-graded |
| Time Bonus | 0-50 | `floor(min(100, max(0, 100 - timeSpentSeconds / 20)) × 0.25)` |
| Hint Penalty | -10/hint | `hintsUsed × 10` |
| **Total Score** | 0-150 | `clamp(0, 150, Accuracy + Time Bonus - Hint Penalty)` |

### Investigator Ranks

| Rank | Total Score |
|------|--------|
| Junior SOC Level I Analyst | 0-59 |
| Capably Certified Security Associate | 60-79 |
| Incident Response Lead (level II) | 80-94 |
| Elite Cyber Threat Hunter (level III) | 95-150 |

---

## 🛡️ Backend API Reference

All endpoints run on the same Express server as the frontend (port 3000 by default).

### POST `/api/incident/generate`
Generate a new incident. Solution is stored server-side and **not** returned to the client.
```bash
curl -X POST http://localhost:3000/api/incident/generate \
  -H "Content-Type: application/json" \
  -d '{"difficulty": "Intermediate"}'
```
Returns `{ caseData: { id, companyName, category, scenarioDescription, timeline, employees, logs, emails, networkActivity, alerts, hintsLeftCount } }`

### POST `/api/incident/chat`
Chat with the incident database / Lead Investigator.
```bash
curl -X POST http://localhost:3000/api/incident/chat \
  -H "Content-Type: application/json" \
  -d '{
    "incidentId": "case_xxxxxxxx",
    "message": "Tell me about the employees"
  }'
```

### POST `/api/incident/hint`
Get a progressive hint (1, 2, or 3).
```bash
curl -X POST http://localhost:3000/api/incident/hint \
  -H "Content-Type: application/json" \
  -d '{
    "incidentId": "case_xxxxxxxx",
    "hintLevel": 1
  }'
```

### POST `/api/incident/accuse`
Submit and AI-grade a final accusation. The ground-truth solution is never sent to the client.
```bash
curl -X POST http://localhost:3000/api/incident/accuse \
  -H "Content-Type: application/json" \
  -d '{
    "incidentId": "case_xxxxxxxx",
    "submission": {
      "attackType": "Phishing",
      "entryPoint": "Email",
      "vulnerability": "User clicked link",
      "mitigation": "Security awareness training"
    },
    "timeSpentSeconds": 420,
    "hintsUsed": 1
  }'
```
Returns `{ evaluation: { accuracyScore, timeBonus, hintPenalty, totalScore, rating, feedback, correctSolution } }`

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | Component UI |
| **Styling** | Tailwind CSS | Dark theme UI |
| **Build** | Vite | Fast bundling, also serves the frontend in dev |
| **Backend** | Express.js | API server (single process with Vite) |
| **AI** | Gemini API (`gemini-3.5-flash`) | Content generation & grading |
| **Security** | dotenv + express-rate-limit | Protected secrets, abuse prevention |
| **Development** | Github Copilot | AI pair-programming assistant |

---


## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

MIT Licence

---

## Support

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join GitHub Discussions

---

<div align="center">

**Built with 🔐 Security in Mind**

[GitHub](https://github.com/ali-hue-byte/Cyber-Escape-Room) · [Microsoft AI Skills Fest 2026](https://microsoft.com)



</div>
