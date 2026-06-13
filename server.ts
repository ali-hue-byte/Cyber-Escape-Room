import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Client from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory active game cases store
const activeGames = new Map<string, any>();

let aiClient: any = null;

function getFoundryClient() {
  if (!aiClient) {
    const endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT;
    const key = process.env.AZURE_AI_FOUNDRY_KEY;
    if (!endpoint || !key) {
      throw new Error("AZURE_AI_FOUNDRY_ENDPOINT and AZURE_AI_FOUNDRY_KEY environment variables are required.");
    }
    aiClient = Client(endpoint, new AzureKeyCredential(key));
  }
  return aiClient;
}

// 1. Generate Cybersecurity Incident
app.post("/api/incident/generate", async (req, res) => {
  try {
    const client = getFoundryClient();
    const { difficulty } = req.body;
    
    if (!difficulty || !['Beginner', 'Intermediate', 'Expert'].includes(difficulty)) {
      res.status(400).json({ error: "Invalid difficulty level provided." });
      return;
    }

    const categories = ['Phishing', 'Ransomware', 'Insider Threat', 'Data Breach', 'Social Engineering', 'Malware Infection'];
    const chosenCategory = categories[Math.floor(Math.random() * categories.length)];

    const systemInstruction = `You are an elite cyber warfare simulator. Generate a highly immersive, technical, and logically consistent cybersecurity incident case study for an interactive educational game.
The difficulty level is: "${difficulty}".
The attack category is: "${chosenCategory}".

For each difficulty, follow these complexity rules:
- Beginner: Single obvious trace or attacker footprint. The compromised system log has clear anomalous fields. Short and readable emails/interview logs. Minimal noise.
- Intermediate: Multi-step attack vector (e.g. initial access via phishing link leading to malware installation, then lateral movement captured in server logs). The network activity has minor anomalies, logs are moderately extensive, employee statements might be slightly misleading.
- Expert: Extremely quiet, state-sponsored APT style or highly obfuscated insider threat. Multiple files, subtle log anomalies (like abnormal operating hours, unusual user-agent strings, small sizes of data payloads), lateral movement, data exfiltration through compromised channels, and misleading clues (noise) included.

The generated output MUST follow the exact schema requested, providing a company name, description, chronologically consistent timeline of events, detailed employees profiles with interviews/statements, highly realistic mock server logs, convincing emails with technical headers or phishing tells, network activities, and system alerts.

Also, compile exactly 3 progressive hints:
- Hint 1: Subtle, points the analyst's focus to a specific file, log, or employee (cryptic).
- Hint 2: More explicit, points to the precise area of concern and what anomaly to look for.
- Hint 3: Plainly explains what they should look at (highly specific).

Configure a hidden logical correct solution block containing concrete strings for:
1. attackType (the precise cybersecurity attack classification)
2. entryPoint (where the threat actor first breached the security boundary)
3. vulnerability (what architectural, software, or human weakness was exploited)
4. mitigation (the proper incident response remediation steps)`;

    const prompt = `Generate a realistic incident case for difficulty "${difficulty}" and category "${chosenCategory}". Give it a unique cyberpunk or high-tech corporate setting. Create highly realistic IP addresses, email addresses, employee names, and system logs. Do not mention the solution in the general description or evidence areas. Ensure all dates and logs are consistent.`;

    // Standard JSON Schema definition for Azure AI Inference structure definitions
    const jsonSchema = {
      type: "object",
      properties: {
        companyName: { type: "string" },
        category: { type: "string" },
        scenarioDescription: { type: "string" },
        timeline: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time: { type: "string" },
              event: { type: "string" }
            },
            required: ["time", "event"]
          }
        },
        employees: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              role: { type: "string" },
              department: { type: "string" },
              accessLevel: { type: "string" },
              statement: { type: "string" }
            },
            required: ["name", "role", "department", "accessLevel", "statement"]
          }
        },
        logs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              timestamp: { type: "string" },
              sourceIp: { type: "string" },
              destinationIp: { type: "string" },
              protocol: { type: "string" },
              action: { type: "string" },
              status: { type: "string" },
              details: { type: "string" }
            },
            required: ["timestamp", "sourceIp", "destinationIp", "action", "status", "details"]
          }
        },
        emails: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              sender: { type: "string" },
              recipient: { type: "string" },
              date: { type: "string" },
              subject: { type: "string" },
              body: { type: "string" }
            },
            required: ["id", "sender", "recipient", "date", "subject", "body"]
          }
        },
        networkActivity: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time: { type: "string" },
              source: { type: "string" },
              destination: { type: "string" },
              bytesTransferred: { type: "number" },
              alertFlag: { type: "boolean" }
            },
            required: ["time", "source", "destination", "bytesTransferred", "alertFlag"]
          }
        },
        alerts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              timestamp: { type: "string" },
              severity: { type: "string" },
              message: { type: "string" },
              system: { type: "string" }
            },
            required: ["id", "timestamp", "severity", "message", "system"]
          }
        },
        hintsProgressive: {
          type: "array",
          items: { type: "string" }
        },
        solution: {
          type: "object",
          properties: {
            attackType: { type: "string" },
            entryPoint: { type: "string" },
            vulnerability: { type: "string" },
            mitigation: { type: "string" },
            attackPathExplanation: { type: "string" }
          },
          required: ["attackType", "entryPoint", "vulnerability", "mitigation", "attackPathExplanation"]
        }
      },
      required: [
        "companyName", "category", "scenarioDescription", "timeline", 
        "employees", "logs", "emails", "networkActivity", "alerts", 
        "hintsProgressive", "solution"
      ]
    };

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_object",
          schema: jsonSchema
        },
        temperature: 0.8
      }
    });

    const contentText = response.body.choices[0].message.content;
    const parsedData = JSON.parse(contentText || "{}");
    const id = "case_" + Math.random().toString(36).substring(2, 10);
    parsedData.id = id;
    parsedData.difficulty = difficulty; // Store explicitly to support cache lookups

    // Cache the whole configuration with solution in memory
    activeGames.set(id, parsedData);

    // Return to the client WITHOUT the solution or the hints list content 
    const { solution, hintsProgressive, ...publicCase } = parsedData;

    res.json({
      caseData: {
        ...publicCase,
        hintsLeftCount: 3
      }
    });

  } catch (error: any) {
    console.error("Incident Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate cybersecurity incident." });
  }
});

// 2. Chat with the CSOC Lead / Incident Database
app.post("/api/incident/chat", async (req, res) => {
  try {
    const client = getFoundryClient();
    const { incidentId, message, chatHistory } = req.body;

    if (!incidentId || !message) {
      res.status(400).json({ error: "Missing incidentId or message inside body." });
      return;
    }

    const fullCaseObj = activeGames.get(incidentId);
    if (!fullCaseObj) {
      res.status(404).json({ error: "Active game case session not found or expired. Please start a new game." });
      return;
    }

    const formattedHistory = (chatHistory || []).slice(-10).map((m: any) => {
      return `${m.role === 'user' ? 'Junior Analyst' : 'Lead Investigator'}: ${m.content}`;
    }).join("\n");

    const systemInstruction = `You are the Lead Cybersecurity Incident Investigator guiding a junior security analyst in the Cyber Security Operations Center (CSOC).
Your junior analyst is currently investigating a live threat incident details below.

COMPANY NAME: "${fullCaseObj.companyName}"
INCIDENT CATEGORY: "${fullCaseObj.category}"
DIFFICULTY: "${fullCaseObj.difficulty}"
SCENARIO DETAILS: "${fullCaseObj.scenarioDescription}"

TRUE SOLUTION (GROUND TRUTH):
- Attack Type: "${fullCaseObj.solution.attackType}"
- Initial Entry Point: "${fullCaseObj.solution.entryPoint}"
- Vulnerability Exploited: "${fullCaseObj.solution.vulnerability}"
- Mitigation Strategy: "${fullCaseObj.solution.mitigation}"
- Hidden Attack Path: "${fullCaseObj.solution.attackPathExplanation}"

YOUR STRICTOR RULES OF ENGAGEMENT:
1. Act in character. You are slightly cynical, highly technical, and professional. Speak in short, punchy SOC-analyst sentences.
2. Under no circumstances should you ever tell them the correct answers directly. The junior analyst must find them by studying the evidence (Logs, Emails, Employee interviews, Alerts, Network activity).
3. If they ask "Who did this?", "What is the vulnerability?", or "Tell me the answer", push back. Remind them they have specific logs, access list timestamps, email senders, or netflows to check. Say things like "Check the network bytes column, analyst" or "Who had access to mail-server-01 around 03:00 UTC? Check client profiles."
4. If they notice an anomaly, praise them and guide them to understand its correlation to other evidence.
5. Keep answers concise, direct, and monospace friendly. No excessive explanations. Keep paragraphs short (maximum 2-3 sentences), with clean structures.`;

    const userPrompt = `Here is our conversation so far:
${formattedHistory}

Junior Analyst: "${message}"

Generate your response as the Lead Investigator. Guide me without giving away the core solution. Highlight details in logs, employee statements, or emails relevant to my question.`;

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }
    });

    res.json({ response: response.body.choices[0].message.content });
  } catch (error: any) {
    console.error("Chat Integration Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI assistant." });
  }
});

// 3. Request progressive hints
app.post("/api/incident/hint", async (req, res) => {
  try {
    const { incidentId, hintLevel } = req.body;

    if (!incidentId || typeof hintLevel !== "number" || hintLevel < 1 || hintLevel > 3) {
      res.status(400).json({ error: "Invalid parameters. Require incidentId and hintLevel (1, 2, or 3)." });
      return;
    }

    const fullCaseObj = activeGames.get(incidentId);
    if (!fullCaseObj) {
      res.status(404).json({ error: "Active case not found." });
      return;
    }

    const hints = fullCaseObj.hintsProgressive || [];
    const requestedHint = hints[hintLevel - 1] || "Check the suspicious email content and logs closely, analyst!";

    res.json({ hint: requestedHint });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Accusation evaluation system (AI Grading)
app.post("/api/incident/accuse", async (req, res) => {
  try {
    const client = getFoundryClient();
    const { incidentId, submission, timeSpentSeconds, hintsUsed } = req.body;

    if (!incidentId || !submission) {
      res.status(400).json({ error: "Missing incidentId or submission details." });
      return;
    }

    const fullCaseObj = activeGames.get(incidentId);
    if (!fullCaseObj) {
      res.status(404).json({ error: "Case session expired or was not found." });
      return;
    }

    const trueSol = fullCaseObj.solution;

    const systemInstruction = `You are a strict, top-tier cybersecurity certification evaluator.
You will assess the junior analyst's final incident report findings against the absolute GROUND TRUTH solution.

GROUND TRUTH:
- Attack Type: "${trueSol.attackType}"
- Entry Point: "${trueSol.entryPoint}"
- Vulnerability Exploited: "${trueSol.vulnerability}"
- Mitigation Strategy: "${trueSol.mitigation}"
- Attack Path Explanation: "${trueSol.attackPathExplanation}"

USER REPORT SUBMISSION:
- Attack Type Answered: "${submission.attackType}"
- Entry Point Answered: "${submission.entryPoint}"
- Vulnerability Answered: "${submission.vulnerability}"
- Mitigation Answered: "${submission.mitigation}"

GRADING CRITERIA:
Compare each answer to the Ground Truth scientifically.
- Give a score from 0 to 25 for each of these 4 fields.
- 25 = Perfectly correct. Synonym or identical semantic concept matches perfectly.
- 10-24 = Partially correct. They got the general idea but missed an important system detail or explanation.
- 0-9 = Incorrect. Completely off or wrong component category.
The sum of all four scores will be the accuracyScore (out of 100).

Determine a concise status for each field: "CORRECT", "PARTIAL", or "INCORRECT".
Provide a clear, brief, constructive evaluation and justification feedback message for each of the four fields explaining why they got that score and how it relates to the true solution.

Return the grading strictly in JSON format matching the schema rules. No markdown blocks.`;

    const evaluationSchema = {
      type: "object",
      properties: {
        accuracyScore: { type: "integer" },
        feedback: {
          type: "object",
          properties: {
            attackType: {
              type: "object",
              properties: {
                score: { type: "integer" },
                status: { type: "string" },
                explanation: { type: "string" }
              },
              required: ["score", "status", "explanation"]
            },
            entryPoint: {
              type: "object",
              properties: {
                score: { type: "integer" },
                status: { type: "string" },
                explanation: { type: "string" }
              },
              required: ["score", "status", "explanation"]
            },
            vulnerability: {
              type: "object",
              properties: {
                score: { type: "integer" },
                status: { type: "string" },
                explanation: { type: "string" }
              },
              required: ["score", "status", "explanation"]
            },
            mitigation: {
              type: "object",
              properties: {
                score: { type: "integer" },
                status: { type: "string" },
                explanation: { type: "string" }
              },
              required: ["score", "status", "explanation"]
            }
          },
          required: ["attackType", "entryPoint", "vulnerability", "mitigation"]
        }
      },
      required: ["accuracyScore", "feedback"]
    };

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: "Run the final grading evaluation and output the JSON scoring results." }
        ],
        response_format: {
          type: "json_object",
          schema: evaluationSchema
        }
      }
    });

    const evalResult = JSON.parse(response.body.choices[0].message.content || "{}");

    // Perform calculated metrics
    const accuracy = evalResult.accuracyScore || 0;
    const timeSpent = timeSpentSeconds || 0;
    const hints = hintsUsed || 0;

    const hintPenalty = hints * 10;
    const timeBonus = Math.max(0, Math.min(100, 100 - Math.floor(timeSpent / 20)));
    const finalScore = Math.max(0, Math.min(150, accuracy + Math.floor(timeBonus * 0.5) - hintPenalty));

    let rating = "Junior SOC Level I Analyst";
    if (finalScore >= 95) {
      rating = "Elite Cyber Threat Hunter (level III)";
    } else if (finalScore >= 80) {
      rating = "Incident Response Lead (level II)";
    } else if (finalScore >= 60) {
      rating = "Capably Certified Security Associate";
    }

    res.json({
      evaluation: {
        accuracyScore: accuracy,
        timeBonus: Math.floor(timeBonus * 0.5),
        hintPenalty,
        totalScore: finalScore,
        rating,
        feedback: evalResult.feedback,
        correctSolution: {
          attackType: trueSol.attackType,
          entryPoint: trueSol.entryPoint,
          vulnerability: trueSol.vulnerability,
          mitigation: trueSol.mitigation,
          attackPathExplanation: trueSol.attackPathExplanation
        }
      }
    });

  } catch (error: any) {
    console.error("Accusation Evaluation Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during evaluation." });
  }
});

// Static files and Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server executing at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server Start Failed:", err);
});
