// index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

// ────────────────────────────────────────────────────────────────
// 0) FAQ/Glossary OF KEY FACTS (prepended to every prompt)
// ────────────────────────────────────────────────────────────────
const FAQ = `
Glossary of Key Facts:
- Lettuce seedling EC: 0.5 – 0.8 mS/cm; vegetative EC: 1.2 – 1.4 mS/cm; mature EC: 1.5 – 2.0 mS/cm.
- Lettuce DLI: 10 – 14 mol/m²/day.
- Tomato seedling EC: 0.8 – 1.2 mS/cm; fruiting EC: 2.0 – 3.0 mS/cm.
- Tomato DLI: 15 – 20 mol/m²/day.
- Cannabis seedling EC: 1.0 – 1.2 mS/cm; vegetative EC: 1.2 – 1.6 mS/cm; flowering EC: 1.6 – 2.0 mS/cm.
- Cannabis DLI: 30 – 40 mol/m²/day.
- Strawberry EC (fruiting): 1.2 – 1.6 mS/cm; Strawberry DLI: 15 – 25 mol/m²/day.
`;

// ────────────────────────────────────────────────────────────────
// 1) PING endpoint
// ────────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => {
  return res.json({ pong: true });
});

// ────────────────────────────────────────────────────────────────
// 2) OPENAI SETUP
// ────────────────────────────────────────────────────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const levels = [
  "Seedling Scout",
  "Vegetative Voyager",
  "Budding Specialist",
  "Fruit & Flower Strategist",
  "Yield Champion",
  "Greenhouse Grandmaster",
];

// ────────────────────────────────────────────────────────────────
// 3) /scenario endpoint (with FAQ prepended)
// ────────────────────────────────────────────────────────────────
app.post('/scenario', async (req, res) => {
  const { level } = req.body;
  if (typeof level !== 'number' || level < 1 || level > 6) {
    return res.status(400).json({ error: "Invalid level (must be 1–6)" });
  }

  const scenarioInstructions = `
You are a world-class controlled-environment agriculture (CEA) consultant.  
Generate a **diagnostic scenario** for a player at **Level ${level}**: **"${levels[level - 1]}"**.  

**Please include exactly these four sections, in this order, and do NOT omit any of them:**

1) Crop Type and Growing System:
- List one of the exact crops used in our simulation (choose from: Lettuce in media bed/DWC/NFT; Tomato/Cucurbit/Pepper in media bed/Kratky/rockwool-gutter; Cannabis in coco-coir pots [indoor or greenhouse + lighting]; Strawberries in troughs; Edible flowers in NFT; Microgreens in rack-with-trays).
- Be very specific (e.g., “Lettuce in an ebb-and-flow media bed,” or “Tomatoes in a Kratky bucket system”).

2) Current Environmental Conditions:
- Temperature (°C and °F in parentheses)
- Relative Humidity (%)
- CO₂ (ppm, if relevant)
- Photoperiod or DLI (must specify “X hours light / Y hours dark” or “Z mol/m²/day”)
- EC (e.g., “1.2 mS/cm”)
- pH
- Water Temperature (°C/°F) OR Substrate Type (if media-based)
- Airflow description (e.g., “No HAF fans,” or “Light mixing from overhead vents”)

3) Observed Plant Symptoms:
- Bullet-list 2–4 symptoms (e.g., “– Interveinal chlorosis on new leaves,” etc.)
- Do NOT reveal the cause—only list what you see.

4) Your Task:
- At the end, append exactly three numbered questions, like:

  Your Task:
  1. Identify the primary suspected issue(s).
  2. Recommend corrective actions to fix the problem.
  3. Explain the underlying plant physiology or system-level rationale.

- Do not put any additional text after question 3.
- Keep the total response under 200 words.
`;

  const prompt = FAQ + scenarioInstructions;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    const responseText = completion.choices[0].message.content.trim();
    return res.json({ scenario: responseText });
  } catch (error) {
    console.error("❌ GPT Error (scenario):", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to generate scenario" });
  }
});

// ────────────────────────────────────────────────────────────────
// 4) /evaluate endpoint (with FAQ prepended)
// ────────────────────────────────────────────────────────────────
app.post('/evaluate', async (req, res) => {
  const { level, scenarioText, sliders, recommendation } = req.body;
  if (
    typeof level !== 'number' ||
    !scenarioText ||
    typeof sliders !== 'object' ||
    !recommendation
  ) {
    return res.status(400).json({ error: "Malformed request" });
  }

  function toF(c) {
    return Math.round((c * 9) / 5 + 32);
  }

  const evaluationInstructions = `
You are a CEA training AI. Below is the full AI-generated diagnostic scenario (including "Your Task" questions) for Level ${level}.  
The player has now provided their slider adjustments and a written recommendation.

---- AI SCENARIO (FULL TEXT) ----
${scenarioText}

---- PLAYER’S SLIDER SETTINGS ----
- Temperature: ${sliders.temp}°C (${toF(sliders.temp)}°F)
- Humidity: ${sliders.humidity}%
- Photoperiod: ${sliders.light} hrs
- CO₂: ${sliders.co2} ppm
- DLI: ${sliders.dli} mol/m²/day

---- PLAYER’S WRITTEN RECOMMENDATION ----
${recommendation}

Your task:
1. Evaluate whether the player's slider adjustments and written recommendation correctly diagnose and fix the scenario’s root cause.
2. Provide constructive feedback in bullet form:
   a) ✅ What the player got right.
   b) ❌ What they missed or partially answered.
   c) How they could improve their slider settings or their written strategy.
Keep your feedback concise (<200 words) and do NOT repeat the entire scenario—focus on their solution.
`;

  const evaluationPrompt = FAQ + evaluationInstructions;

  try {
    const evalCompletion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: evaluationPrompt }],
      temperature: 0.7,
    });
    const feedbackText = evalCompletion.choices[0].message.content.trim();
    return res.json({ feedback: feedbackText });
  } catch (error) {
    console.error("❌ GPT Evaluate Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to evaluate recommendation" });
  }
});

// ────────────────────────────────────────────────────────────────
// 5) Start the server
// ────────────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🌱 GPT Scenario server running at http://localhost:${PORT}`);
});
