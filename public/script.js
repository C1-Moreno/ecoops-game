// ─────────────────────────────────────────────────────────────────────────────
// ✨ Helpers: Conversion, Range Check, Colorize, HTML‐Escape, Shuffle
// ─────────────────────────────────────────────────────────────────────────────
const toF = (c) => (isNaN(c) ? "" : Math.round((c * 9) / 5 + 32));
const between = (val, [min, max]) => val >= min && val <= max;
const colorize = (val, [min, max], unit = "") => {
  const inRange = between(val, [min, max]);
  const color = inRange ? "green" : "red";
  return `<span style="color:${color}; font-weight:bold">${val}${unit} ${inRange ? "✅" : "❌"}</span>`;
};
const escapeHtml = (str) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Fisher–Yates shuffle: returns a new array shuffled
 */
function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
  
}
// ─────────────────────────────────────────────────────────────────────────────
// 🎨 Enhanced Quiz Results with Color Coding
// ─────────────────────────────────────────────────────────────────────────────

// Helper function to create color-coded quiz result HTML
function formatQuizResult(isCorrect, userAnswer, correctAnswer, questionText, explanation) {
  const statusIcon = isCorrect ? "✅" : "❌";
  const statusColor = isCorrect ? "#2e7d32" : "#d32f2f";
  const bgColor = isCorrect ? "rgba(46, 125, 50, 0.05)" : "rgba(211, 47, 47, 0.05)";
  
  return `
    <div style="background: ${bgColor}; border-left: 4px solid ${statusColor}; padding: 0.8rem; margin: 0.5rem 0; border-radius: 4px;">
      <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
        <span style="font-size: 1.2rem; margin-right: 0.5rem;">${statusIcon}</span>
        <strong style="color: ${statusColor};">${questionText}</strong>
      </div>
      <div style="margin-left: 1.7rem;">
        <div style="margin: 0.3rem 0;">
          <strong>Your answer:</strong> 
          <span style="color: ${isCorrect ? '#2e7d32' : '#d32f2f'}; font-weight: 600;">
            ${escapeHtml(userAnswer || "No answer")}
          </span>
        </div>
        <div style="margin: 0.3rem 0;">
          <strong>Correct answer:</strong> 
          <span style="color: #2e7d32; font-weight: 600;">${escapeHtml(correctAnswer)}</span>
        </div>
        <div style="margin-top: 0.5rem; font-style: italic; color: #555;">
          ${escapeHtml(explanation)}
        </div>
      </div>
    </div>
  `;
}

// Generate physiological quiz HTML
function generatePhysiologicalQuizHTML(mainCorrect, mainAnswer, scenario, bonusCorrect, bonusAnswer, bonusExp) {
  const mainQuizHTML = formatQuizResult(
    mainCorrect,
    mainAnswer,
    scenario.cause,
    "What is the likely trigger for these symptoms?",
    mainCorrect 
      ? `The trigger "${scenario.cause}" directly leads to the observed symptoms (${scenario.symptoms.join(" and ")}).`
      : `The trigger "${mainAnswer || "nothing"}" does not match these symptoms; only "${scenario.cause}" explains them.`
  );

  const bonusQuizHTML = formatQuizResult(
    bonusCorrect,
    bonusAnswer,
    scenario.crop.quiz.answer,
    scenario.crop.quiz.question,
    bonusCorrect 
      ? bonusExp.pos 
      : bonusExp.neg(bonusAnswer || "nothing")
  );

  return `
    <hr>
    <h4>📊 Quiz Results:</h4>
    ${mainQuizHTML}
    ${bonusQuizHTML}
  `;
}

// Generate IPM quiz HTML
function generateIPMQuizHTML(pestCorrect, pestAnswer, ipmScenario, damageCorrect, damageAnswer, evidenceCorrect, evidenceAnswer, ipmCorrect, ipmAnswer) {
  const pestQuizHTML = formatQuizResult(
    pestCorrect,
    pestAnswer,
    ipmScenario.pest,
    "Pest Identification",
    pestCorrect 
      ? `Correct identification of ${ipmScenario.pest} based on the damage patterns and biological evidence.`
      : `Look for the specific damage patterns and biological signs that distinguish ${ipmScenario.pest} from other pests.`
  );

  const damageQuizHTML = formatQuizResult(
    damageCorrect,
    damageAnswer,
    "Pest damage",
    "Damage Type Classification", 
    damageCorrect
      ? "Correctly identified this as pest damage rather than environmental stress or disease."
      : "The symptoms shown are characteristic of pest damage, not environmental or nutritional issues."
  );

  const evidenceQuizHTML = formatQuizResult(
    evidenceCorrect,
    evidenceAnswer,
    "Biological evidence",
    "Evidence Type Classification",
    evidenceCorrect
      ? "Correctly identified biological evidence such as pest presence, frass, or feeding patterns."
      : "The signs described are biological evidence of pest activity, not chemical or physical damage indicators."
  );

  const treatmentQuizHTML = formatQuizResult(
    ipmCorrect,
    ipmAnswer,
    ipmScenario.correctTreatment,
    ipmScenario.question,
    ipmScenario.explanation
  );

  return `
    <hr>
    <h4>📊 Quiz Results:</h4>
    ${pestQuizHTML}
    ${damageQuizHTML}
    ${evidenceQuizHTML}
    ${treatmentQuizHTML}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔢 Scenario Pool per level (to avoid repeats in a session)
// ─────────────────────────────────────────────────────────────────────────────
const scenarioPool = {};
const scenarioPoolIndex = {};
function initScenarioPool(level) {
  const entries = [];
  crops.forEach((crop, ci) => {
    if (crop.levels.includes(level)) {
      const stressors = crop.stressors.filter((s) => s.level === level);
      // single stressors
      stressors.forEach((s) => {
        const idx = crop.stressors.indexOf(s);
        entries.push({ cropIdx: ci, stressIdx: [idx] });
      });
      // pairs of stressors
      for (let i = 0; i < stressors.length; i++) {
        for (let j = i + 1; j < stressors.length; j++) {
          const idx1 = crop.stressors.indexOf(stressors[i]);
          const idx2 = crop.stressors.indexOf(stressors[j]);
          entries.push({ cropIdx: ci, stressIdx: [idx1, idx2] });
        }
      }
    }
  });
  scenarioPool[level] = shuffle(entries);
  scenarioPoolIndex[level] = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔄 generateScenario(): Uses a pool to ensure no repeats until exhaustion
// ─────────────────────────────────────────────────────────────────────────────
function generateScenario(level) {
  // Initialize or refill pool when empty
  if (!scenarioPool[level] || scenarioPool[level].length === 0) {
    initScenarioPool(level);
  }
  let idx = scenarioPoolIndex[level]++;
  if (idx >= scenarioPool[level].length) {
    initScenarioPool(level);
    idx = scenarioPoolIndex[level]++;
  }
  const entry = scenarioPool[level][idx];

// Get selected crop from dropdown, or fallback to random if none selected
const selectedCrops = Array.from(document.getElementById("cropSelect").selectedOptions)
    .map(option => option.value)
    .filter(value => value !== "");

let crop;
if (selectedCrops.length > 0) {
    // Use randomly selected crop from user's choices
    const randomCropName = selectedCrops[Math.floor(Math.random() * selectedCrops.length)];
    crop = crops.find(c => c.name.toLowerCase() === randomCropName);
} else {
    // Fallback to original random method
    crop = crops[entry.cropIdx];
}  const chosenStressors = entry.stressIdx.map((i) => crop.stressors[i]);

  // Build base stats
  const stats = {
    temp: 25,
    humidity: 60,
    light: 12,
    co2: 450,
    dli: 20,
    ec: (crop.prefs.ec[0] + crop.prefs.ec[1]) / 2,
    ph: (crop.prefs.ph[0] + crop.prefs.ph[1]) / 2,
    do: 8,
    airflow: "Adequate HAF fans",
  };

  // Distort stats based on chosen stressors (reuse your existing switch logic)
  chosenStressors.forEach((stressor) => {
    stressor.affects.forEach((param) => {
      switch (param) {
        case "temp": stats.temp = 35; break;
        case "humidity": stats.humidity = 85; break;
        case "light": stats.light = 20; break;
        case "co2": stats.co2 = 300; break;
        case "dli": stats.dli = Math.random() < 0.5 ? 0 : 45; break;
        case "ec": stats.ec = crop.prefs.ec[1] + 1; break;
        case "ph": stats.ph = crop.prefs.ph[1] + 0.5; break;
        case "do": stats.do = 3; break;
        case "airflow": stats.airflow = "No HAF fans; stagnant air"; break;
        case "nutrient": stats.ec = crop.prefs.ec[0] - 0.3; break;
        case "disease": stats.humidity = 90; break;
        case "sensor": stats.temp = "Erratic"; break;
        default: break;
      }
    });
  });

  const combinedSymptoms = chosenStressors.map((s) => s.symptoms).flat();
  const combinedCause = chosenStressors.map((s) => s.cause).join(" + ");

  return {
    id: Date.now().toString(),
    crop,
    stressors: chosenStressors,
    cause: combinedCause,
    stats,
    symptoms: combinedSymptoms,
    difficulty: level,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️ updateLabels(): Read slider values and update displayed text
// ─────────────────────────────────────────────────────────────────────────────
function updateLabels() {
  // Temperature
  const t = parseInt(document.getElementById("temp").value, 10);
  document.getElementById("tempVal").textContent = `${t}°C (${toF(t)}°F)`;

  // Humidity
  const h = parseInt(document.getElementById("humidity").value, 10);
  document.getElementById("humidityVal").textContent = `${h}%`;

  // Photoperiod
  const l = parseInt(document.getElementById("light").value, 10);
  document.getElementById("lightVal").textContent = `${l} hrs`;

  // CO₂
  const c = parseInt(document.getElementById("co2").value, 10);
  document.getElementById("co2Val").textContent = `${c} ppm`;

  // DLI
  const d = parseInt(document.getElementById("dli").value, 10);
  document.getElementById("dliVal").textContent = `${d}`;

  // EC
  const e = parseFloat(document.getElementById("ec").value);
  document.getElementById("ecVal").textContent = `${e.toFixed(1)}`;

  // pH
  const p = parseFloat(document.getElementById("ph").value);
  document.getElementById("phVal").textContent = `${p.toFixed(1)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎓 Global State & Difficulty Definitions
// ─────────────────────────────────────────────────────────────────────────────
let scenario = {};
let startTime = Date.now();
let difficultyLevel = 1;
let correctStreak = 0;

const levels = [
  "Seedling Scout",
  "Vegetative Voyager",
  "Budding Specialist",
  "Fruit & Flower Strategist",
  "Yield Champion",
  "Greenhouse Grandmaster",
];

// ─────────────────────────────────────────────────────────────────────────────
// 🌿 Crop Definitions with Multi‐Stressor Logic
// ─────────────────────────────────────────────────────────────────────────────
const crops = [
  // ── Lettuce ──
  {
    name: "Lettuce",
    levels: [1, 2, 3],
    prefs: {
      temp: [16, 22],
      humidity: [50, 70],
      light: [8, 12],
      co2: [350, 450],
      dli: [12, 18],
      ec: [0.5, 0.8],
      ph: [5.5, 6.2],
    },
    stressors: [
      // Level 1
      {
        level: 1,
        cause: "Low humidity",
        category: "humidity",
        symptoms: ["Tip burn", "Leaf curling"],
        affects: ["humidity"],
      },
      {
        level: 1,
        cause: "Low DLI",
        category: "dli",
        symptoms: ["Elongated internodes", "Pale leaves"],
        affects: ["dli"],
      },
      {
        level: 1,
        cause: "EC too high",
        category: "ec",
        symptoms: ["Tip burn", "Stunted roots"],
        affects: ["ec"],
      },
      {
        level: 1,
        cause: "pH too high",
        category: "ph",
        symptoms: ["Interveinal chlorosis", "Leaf yellowing"],
        affects: ["ph"],
      },
      // Level 2
      {
        level: 2,
        cause: "High temperature + High DLI",
        category: ["temp", "dli"],
        symptoms: ["Bolting", "Leaf scorch"],
        affects: ["temp", "dli"],
      },
      {
        level: 2,
        cause: "EC too low + Low humidity",
        category: ["ec", "humidity"],
        symptoms: ["Wilting", "Pale leaves"],
        affects: ["ec", "humidity"],
      },
      {
        level: 2,
        cause: "Low pH + Low dissolved oxygen",
        category: ["ph", "do"],
        symptoms: ["Root stunting", "Curling leaf tips"],
        affects: ["ph", "do"],
      },
      // Level 3
      {
        level: 3,
        cause: "High EC + High DLI under low airflow",
        category: ["ec", "dli", "airflow"],
        symptoms: ["Salt buildup spots", "Leggy yet crispy leaves"],
        affects: ["ec", "dli", "airflow"],
      },
      {
        level: 3,
        cause: "Low DLI + Low pH under high humidity",
        category: ["dli", "ph", "humidity"],
        symptoms: ["Weak stem elongation", "Mold on lower leaves"],
        affects: ["dli", "ph", "humidity"],
      },
    ],
    quiz: {
      question: "Why does lettuce bolt prematurely?",
      options: [
        "Too much heat",
        "Low CO₂",
        "Too much humidity",
        "Low photoperiod",
      ],
      answer: "Too much heat",
    },
  },

  // ── Tomato ──
  {
    name: "Tomato",
    levels: [1, 2, 3, 4],
    prefs: {
      temp: [22, 28],
      humidity: [55, 70],
      light: [12, 18],
      co2: [400, 500],
      dli: [20, 30],
      ec: [0.8, 1.2],
      ph: [5.8, 6.5],
    },
    stressors: [
      // Level 1
      {
        level: 1,
        cause: "Overwatering",
        category: "humidity",
        symptoms: ["Root rot", "Leaf yellowing"],
        affects: ["humidity"],
      },
      {
        level: 1,
        cause: "Low DLI",
        category: "dli",
        symptoms: ["Leggy growth", "Poor fruit set"],
        affects: ["dli"],
      },
      {
        level: 1,
        cause: "EC too low",
        category: "ec",
        symptoms: ["Blossom drop", "Pale new leaves"],
        affects: ["ec"],
      },
      {
        level: 1,
        cause: "High pH",
        category: "ph",
        symptoms: ["Interveinal chlorosis", "Flower abortion"],
        affects: ["ph"],
      },
      // Level 2
      {
        level: 2,
        cause: "High temperature + Low humidity",
        category: ["temp", "humidity"],
        symptoms: ["Wilted tops", "Fruit cracking"],
        affects: ["temp", "humidity"],
      },
      {
        level: 2,
        cause: "Low CO₂ + Low DLI",
        category: ["co2", "dli"],
        symptoms: ["Slow flowering", "Yellow older leaves"],
        affects: ["co2", "dli"],
      },
      // Level 3
      {
        level: 3,
        cause: "High DLI under nutrient lockout (high EC)",
        category: ["dli", "ec"],
        symptoms: ["Leaf curl edges", "Sparse fruit set"],
        affects: ["dli", "ec"],
      },
      {
        level: 3,
        cause: "High CO₂ + Slight pH drift",
        category: ["co2", "ph"],
        symptoms: ["Misshapen fruit", "Subtle interveinal striping"],
        affects: ["co2", "ph"],
      },
      // Level 4
      {
        level: 4,
        cause: "Low airflow + High DLI + High humidity",
        category: ["airflow", "dli", "humidity"],
        symptoms: ["Early blossom rot", "Pale new leaves"],
        affects: ["airflow", "dli", "humidity"],
      },
    ],
    quiz: {
      question: "What causes blossom end rot in tomatoes?",
      options: ["Low calcium", "Too much sunlight", "High nitrogen", "Fungal disease"],
      answer: "Low calcium",
    },
  },

  // ── Cannabis ──
  {
    name: "Cannabis",
    levels: [2, 3, 4, 5, 6],
    prefs: {
      temp: [22, 28],
      humidity: [50, 60],
      light: [18, 20],
      co2: [600, 800],
      dli: [30, 40],
      ec: [1.0, 1.2],
      ph: [5.8, 6.0],
    },
    stressors: [
      // Level 2
      {
        level: 2,
        cause: "Nitrogen deficiency",
        category: "nutrient",
        symptoms: ["Yellow lower leaves", "Stunted growth"],
        affects: ["ec"],
      },
      {
        level: 2,
        cause: "Low DLI",
        category: "dli",
        symptoms: ["Slow veg growth", "Stretching"],
        affects: ["dli"],
      },
      // Level 3
      {
        level: 3,
        cause: "Low CO₂ + High DLI",
        category: ["co2", "dli"],
        symptoms: ["Leaf burn", "Sparse trichomes"],
        affects: ["co2", "dli"],
      },
      {
        level: 3,
        cause: "High humidity + Slight pH drift",
        category: ["humidity", "ph"],
        symptoms: ["Mold spots", "Leaf tip burn"],
        affects: ["humidity", "ph"],
      },
      // Level 4
      {
        level: 4,
        cause: "High DLI + High EC under low airflow",
        category: ["dli", "ec", "airflow"],
        symptoms: ["Leaf edge burn", "Leaf curl in canopy"],
        affects: ["dli", "ec", "airflow"],
      },
      // Level 5
      {
        level: 5,
        cause: "Low pH + Low dissolved oxygen",
        category: ["ph", "do"],
        symptoms: ["Root rot smell", "Drooping leaves"],
        affects: ["ph", "do"],
      },
      {
        level: 5,
        cause: "High DLI + Low nitrogen",
        category: ["dli", "nutrient"],
        symptoms: ["Yellowing interveinal", "Weak bud set"],
        affects: ["dli", "ec"],
      },
      // Level 6
      {
        level: 6,
        cause: "Sensor failure + Random pH swings",
        category: ["sensor", "ph"],
        symptoms: ["Wild parameter readings", "Uneven canopy growth"],
        affects: ["sensor", "ph"],
      },
      {
        level: 6,
        cause: "Extreme DLI variance (lighting fault) + High CO₂",
        category: ["dli", "co2"],
        symptoms: ["Growth stops intermittently", "Heat stress patterns"],
        affects: ["dli", "co2"],
      },
    ],
    quiz: {
      question: "What is the ideal flowering photoperiod for cannabis?",
      options: ["12/12", "18/6", "20/4", "6/18"],
      answer: "12/12",
    },
  },

  // ── Strawberries ──
  {
    name: "Strawberries",
    levels: [3, 4],
    prefs: {
      temp: [18, 24],
      humidity: [60, 75],
      light: [10, 16],
      co2: [400, 500],
      dli: [15, 25],
      ec: [1.2, 1.6],
      ph: [5.8, 6.2],
    },
    stressors: [
      // Level 3
      {
        level: 3,
        cause: "Fungal disease + High humidity",
        category: ["disease", "humidity"],
        symptoms: ["Gray mold", "Soft fruit"],
        affects: ["humidity"],
      },
      {
        level: 3,
        cause: "Low DLI + Slight nutrient stress",
        category: ["dli", "nutrient"],
        symptoms: ["Small berries", "Slow flowering"],
        affects: ["dli", "ec"],
      },
      // Level 4
      {
        level: 4,
        cause: "High photoperiod + High DLI",
        category: ["light", "dli"],
        symptoms: ["Leaf scorch", "Leaf bleaching"],
        affects: ["light", "dli"],
      },
      {
        level: 4,
        cause: "Low pH + High DLI",
        category: ["ph", "dli"],
        symptoms: ["Poor fruit flavor", "Yellowing leaves"],
        affects: ["ph", "dli"],
      },
    ],
    quiz: {
      question: "What pest often affects strawberries?",
      options: ["Spider mites", "Aphids", "Thrips", "All of the above"],
      answer: "All of the above",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 🐛 IPM Pest Scenarios Database (Comprehensive)
// ─────────────────────────────────────────────────────────────────────────────
const pestScenarios = [
  // Cannabis Scenarios
  {
    id: "spider_mites_cannabis",
    crop: "Cannabis",
    pest: "Two-Spotted Spider Mites",
    severity: "Heavy",
    description: "Fine webbing on leaf undersides, tiny yellow or white specks (stippling) on leaves",
    symptoms: [
      "Fine webbing on leaf undersides",
      "Tiny yellow or white specks (stippling) on leaves", 
      "Leaves becoming bronzed or scorched",
      "Reduced resin production"
    ],
    environmentalFactors: { temp: 29, humidity: 35, airflow: "Poor circulation" },
    biologicalSigns: ["Moving specks on leaf undersides", "Dense webbing in severe areas"],
    correctTreatment: "Increase humidity + Predatory mites",
    incorrectTreatments: ["Decrease humidity", "Manual webbing removal", "Pyrethroid spray"],
    question: "What integrated approach controls spider mites?",
    explanation: "Higher humidity stresses mites while predatory mites provide biological control."
  },
  
  {
    id: "broad_mites_cannabis",
    crop: "Cannabis", 
    pest: "Broad Mites",
    severity: "Moderate",
    description: "Leaves cupping downward, brittle appearance, distorted new growth",
    symptoms: [
      "Leaves cupping downward, brittle appearance",
      "Distorted new growth, stunted shoots", 
      "Brownish scarring along leaf margins"
    ],
    environmentalFactors: { temp: 26, humidity: 60, airflow: "Warm, humid conditions" },
    biologicalSigns: ["Microscopic mites invisible to naked eye", "Damage starts on new growth"],
    correctTreatment: "Predatory mites + Sulfur spray",
    incorrectTreatments: ["Increase temperature", "Remove all damaged leaves", "Broad spectrum insecticide"],
    question: "How do you control broad mites without seeing them?",
    explanation: "Predatory mites hunt broad mites while sulfur creates hostile environment for reproduction."
  },

  {
    id: "thrips_cannabis",
    crop: "Cannabis",
    pest: "Western Flower Thrips", 
    severity: "Light",
    description: "Silver or white streaking patterns on leaves, black fecal spots",
    symptoms: [
      "Silver or white streaking patterns on leaves",
      "Black fecal spots on foliage underside",
      "Brittle, distorted new leaf growth"
    ],
    environmentalFactors: { temp: 25, humidity: 50, airflow: "Moderate airflow" },
    biologicalSigns: ["Tiny elongated insects moving rapidly", "Damage follows air currents"],
    correctTreatment: "Blue sticky traps + Predatory mites",
    incorrectTreatments: ["Yellow sticky traps only", "Increase humidity to 80%", "Daily leaf washing"],
    question: "What color traps work best for thrips?",
    explanation: "Blue traps attract thrips more effectively than yellow, while predatory mites control larvae."
  },

  {
    id: "russet_mites_cannabis",
    crop: "Cannabis",
    pest: "Russet Mites",
    severity: "Moderate", 
    description: "Yellowish or bronzed foliage beginning at lower canopy",
    symptoms: [
      "Yellowish or bronzed foliage beginning at lower canopy",
      "Extremely small mites difficult to see without magnification",
      "Gradual upward progression of leaf damage"
    ],
    environmentalFactors: { temp: 28, humidity: 40, airflow: "Dry, warm conditions" },
    biologicalSigns: ["Bronze coloring starting from bottom", "Microscopic mites require magnification"],
    correctTreatment: "Sulfur spray + Environmental control",
    incorrectTreatments: ["Increase humidity only", "Neem oil spray", "Remove lower leaves"],
    question: "How do you identify russet mites?",
    explanation: "Russet mites cause distinctive bronze coloring from bottom up and require sulfur treatment."
  },

  {
    id: "cutworms_cannabis", 
    crop: "Cannabis",
    pest: "Cutworms",
    severity: "High",
    description: "Seedlings or young plants cut at soil line overnight",
    symptoms: [
      "Seedlings or young plants cut at soil line overnight",
      "Large caterpillars curled beneath soil surface or mulch", 
      "Damage primarily nocturnal and rapidly destructive"
    ],
    environmentalFactors: { temp: 22, humidity: 65, airflow: "Ground level activity" },
    biologicalSigns: ["Plants cut cleanly at soil line", "Caterpillars hidden during day"],
    correctTreatment: "Beneficial nematodes + Physical barriers",
    incorrectTreatments: ["Daytime spraying only", "Remove all mulch", "Increase watering"],
    question: "How do you prevent cutworm damage?",
    explanation: "Beneficial nematodes attack soil-dwelling larvae while barriers protect plant stems."
  },

  // Lettuce Scenarios
  {
    id: "aphids_lettuce",
    crop: "Lettuce", 
    pest: "Green Peach Aphids",
    severity: "Light",
    description: "Leaves curled and distorted, sticky honeydew residue",
    symptoms: [
      "Leaves curled and distorted",
      "Sticky honeydew residue on foliage", 
      "Presence of black sooty mold on leaf surfaces",
      "Ants farming aphid colonies"
    ],
    environmentalFactors: { temp: 24, humidity: 45, airflow: "Poor circulation" },
    biologicalSigns: ["Clusters of soft-bodied insects", "Honeydew attracts ants"],
    correctTreatment: "Beneficial insects (ladybugs/lacewings)",
    incorrectTreatments: ["Broad-spectrum insecticide", "Increase humidity", "Remove all affected leaves"],
    question: "What's the best biological control for aphids?",
    explanation: "Ladybugs and lacewings provide long-term aphid control without ecosystem disruption."
  },

  {
    id: "fungus_gnats_lettuce",
    crop: "Lettuce",
    pest: "Fungus Gnats", 
    severity: "Moderate",
    description: "Small black insects hovering around plants",
    symptoms: [
      "Small black insects hovering around plants",
      "Larvae in root zone causing poor root development",
      "Seedlings wilting despite sufficient watering"
    ],
    environmentalFactors: { temp: 23, humidity: 75, airflow: "Overwatered conditions" },
    biologicalSigns: ["Tiny mosquito-like flies around soil", "Larvae visible in growing medium"],
    correctTreatment: "Reduce watering + Yellow sticky traps",
    incorrectTreatments: ["Increase watering frequency", "Apply systemic insecticide", "Remove all organic matter"],
    question: "What causes fungus gnat outbreaks?",
    explanation: "Overwatering creates ideal breeding conditions; reducing moisture and traps control populations."
  },

  {
    id: "whiteflies_lettuce",
    crop: "Lettuce",
    pest: "Greenhouse Whitefly",
    severity: "Moderate",
    description: "Small white insects flying when disturbed", 
    symptoms: [
      "Small white insects flying when disturbed",
      "Honeydew droplets and subsequent sooty mold",
      "Leaf yellowing and premature leaf drop"
    ],
    environmentalFactors: { temp: 26, humidity: 70, airflow: "Warm, humid conditions" },
    biologicalSigns: ["Adults fly up when plants disturbed", "Immature scales on undersides"],
    correctTreatment: "Yellow sticky traps + Parasitic wasps",
    incorrectTreatments: ["Blue sticky traps", "Daily water spraying", "Increase temperature"],
    question: "What's the best trap color for whiteflies?",
    explanation: "Yellow traps attract whiteflies effectively while parasitic wasps provide biological control."
  },

  {
    id: "cabbage_loopers_lettuce",
    crop: "Lettuce",
    pest: "Cabbage Loopers",
    severity: "High", 
    description: "Circular holes chewed into leaves",
    symptoms: [
      "Circular holes chewed into leaves",
      "Pale green caterpillars looping motion observed feeding",
      "Greenish frass (droppings) present on leaves"
    ],
    environmentalFactors: { temp: 25, humidity: 60, airflow: "Moderate conditions" },
    biologicalSigns: ["Caterpillars with distinctive looping movement", "Large holes in leaves"],
    correctTreatment: "Bt spray + Hand removal",
    incorrectTreatments: ["Broad spectrum insecticide", "Increase humidity to 90%", "Remove all damaged plants"],
    question: "What biological control targets caterpillars?",
    explanation: "Bt (Bacillus thuringiensis) specifically targets caterpillar digestive systems safely."
  },

  {
    id: "shore_flies_lettuce",
    crop: "Lettuce", 
    pest: "Shore Flies",
    severity: "Light",
    description: "Small dark flies landing frequently on leaves",
    symptoms: [
      "Small dark flies landing frequently on leaves",
      "Black fecal specks on leaf surfaces",
      "Presence in overly moist or algae-rich conditions"
    ],
    environmentalFactors: { temp: 24, humidity: 80, airflow: "High moisture conditions" },
    biologicalSigns: ["Dark flies different from fungus gnats", "Associated with algae growth"],
    correctTreatment: "Reduce moisture + Improve sanitation",
    incorrectTreatments: ["Increase watering", "Apply insecticide spray", "Remove all plants"],
    question: "What conditions promote shore flies?",
    explanation: "Shore flies thrive in wet, algae-rich conditions; reducing moisture eliminates breeding sites."
  },

  // Tomato Scenarios  
  {
    id: "whiteflies_tomato",
    crop: "Tomato",
    pest: "Silverleaf Whitefly",
    severity: "Moderate",
    description: "Small white flying insects when leaves disturbed",
    symptoms: [
      "Small white flying insects when leaves disturbed", 
      "Leaves turning yellow, sticky honeydew residue",
      "Sooty mold fungus on upper leaf surfaces"
    ],
    environmentalFactors: { temp: 27, humidity: 65, airflow: "Warm greenhouse conditions" },
    biologicalSigns: ["Adults fly when disturbed", "Honeydew promotes sooty mold"],
    correctTreatment: "Yellow sticky traps + Parasitic wasps",
    incorrectTreatments: ["Blue sticky traps only", "Increase humidity to 85%", "Daily water spraying"],
    question: "How do you manage whiteflies on fruiting plants?",
    explanation: "Yellow traps and parasitic wasps control whiteflies without affecting fruit development."
  },

  {
    id: "leafminers_tomato",
    crop: "Tomato",
    pest: "Serpentine Leafminer", 
    severity: "Light",
    description: "Distinct winding, white trails inside leaves",
    symptoms: [
      "Distinct winding, white trails inside leaves",
      "Leaves become brittle, dried, and drop prematurely",
      "Small fly-like adults occasionally visible"
    ],
    environmentalFactors: { temp: 26, humidity: 55, airflow: "Moderate greenhouse conditions" },
    biologicalSigns: ["Serpentine mines in leaf tissue", "Pupae visible at mine ends"],
    correctTreatment: "Remove affected leaves + Parasitic wasps",
    incorrectTreatments: ["Spray entire plant", "Increase watering", "Apply broad spectrum pesticide"],
    question: "How do you control leafminers?",
    explanation: "Removing mined leaves eliminates larvae while parasitic wasps prevent future generations."
  },

  {
    id: "leafhoppers_tomato",
    crop: "Tomato",
    pest: "Potato Leafhopper",
    severity: "Moderate",
    description: "Small white stippling on leaves, giving speckled appearance", 
    symptoms: [
      "Small white stippling on leaves, giving speckled appearance",
      "Leaves becoming yellowish or bronze, curling downward",
      "Small jumping insects visible upon disturbance"
    ],
    environmentalFactors: { temp: 28, humidity: 50, airflow: "Dry, warm conditions" },
    biologicalSigns: ["Insects jump when disturbed", "Stippling damage pattern"],
    correctTreatment: "Reflective mulch + Beneficial insects",
    incorrectTreatments: ["Remove mulch completely", "Increase temperature", "Daily insecticide spray"],
    question: "What cultural control helps with leafhoppers?",
    explanation: "Reflective mulch confuses leafhoppers while beneficial insects provide biological control."
  },

  // Strawberry Scenarios
  {
    id: "thrips_strawberry",
    crop: "Strawberries",
    pest: "Western Flower Thrips",
    severity: "Moderate", 
    description: "Silver streaking or discoloration on leaf surfaces",
    symptoms: [
      "Silver streaking or discoloration on leaf surfaces",
      "Deformed fruit with scarring or russet marks",
      "Tiny elongated insects moving rapidly on leaves"
    ],
    environmentalFactors: { temp: 24, humidity: 60, airflow: "Moderate conditions" },
    biologicalSigns: ["Thrips visible in flowers", "Fruit scarring at harvest"],
    correctTreatment: "Blue sticky traps + Predatory mites",
    incorrectTreatments: ["Yellow traps only", "Remove all flowers", "Increase humidity to 90%"],
    question: "How do you protect strawberry fruit from thrips?", 
    explanation: "Blue traps catch adult thrips while predatory mites control larvae without affecting fruit."
  },

  {
    id: "spider_mites_strawberry",
    crop: "Strawberries",
    pest: "Two-spotted Spider Mites",
    severity: "Heavy",
    description: "Fine webbing on leaf surfaces, yellow stippling", 
    symptoms: [
      "Fine webbing on leaf surfaces",
      "Yellow stippling progressing to bronze leaves", 
      "Premature leaf drop affecting fruit production"
    ],
    environmentalFactors: { temp: 30, humidity: 30, airflow: "Hot, dry conditions" },
    biologicalSigns: ["Webbing increases with population", "Mites visible with magnification"],
    correctTreatment: "Increase humidity + Predatory mites",
    incorrectTreatments: ["Decrease humidity", "Remove all webbing", "Apply miticide weekly"],
    question: "What environmental change helps control spider mites?",
    explanation: "Increasing humidity stresses spider mites while predatory mites provide biological control."
  },

  {
    id: "broad_mites_strawberry", 
    crop: "Strawberries",
    pest: "Broad Mites",
    severity: "High",
    description: "New leaves cupped downward and shiny",
    symptoms: [
      "New leaves cupped downward and shiny",
      "Growth stunted, distorted runners",
      "Brown speckling along leaf veins"
    ],
    environmentalFactors: { temp: 25, humidity: 70, airflow: "Warm, humid conditions" },
    biologicalSigns: ["Microscopic mites", "Damage on newest growth"],
    correctTreatment: "Predatory mites + Miticide rotation",
    incorrectTreatments: ["Increase temperature", "Remove all new growth", "Single miticide only"],
    question: "Why is broad mite damage hard to diagnose?",
    explanation: "Broad mites are microscopic; predatory mites and rotated miticides provide effective control."
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 🐛 IPM Scenario Generator 
// ─────────────────────────────────────────────────────────────────────────────
function generateIPMScenario() {
  // Get selected crop from dropdown, or use random if none selected
  const selectedCrops = Array.from(document.getElementById("cropSelect").selectedOptions)
    .map(option => option.value)
    .filter(value => value !== "");

  let availableScenarios = pestScenarios;
  
  if (selectedCrops.length > 0) {
    // Filter scenarios by selected crops
    const cropNames = selectedCrops.map(crop => 
      crop.charAt(0).toUpperCase() + crop.slice(1)
    );
    availableScenarios = pestScenarios.filter(scenario => 
      cropNames.includes(scenario.crop)
    );
  }
  
  // If no scenarios available for selected crops, use all scenarios
  if (availableScenarios.length === 0) {
    availableScenarios = pestScenarios;
  }
  
  // Random selection from available scenarios
  const randomScenario = availableScenarios[
    Math.floor(Math.random() * availableScenarios.length)
  ];
  
  return randomScenario;
}
// ─────────────────────────────────────────────────────────────────────────────
// 🎨 Enhanced Performance Card Generation
// ─────────────────────────────────────────────────────────────────────────────

// Helper function to determine status and progress percentage
function getMetricStatus(value, optimal, unit = "") {
  const [min, max] = optimal;
  const inRange = value >= min && value <= max;
  
  let status, statusClass, progressWidth;
  
  if (inRange) {
    // Perfect range - show full progress
    status = "Perfect";
    statusClass = "status-perfect";
    progressWidth = 100;
  } else {
    // Calculate how far off we are
    const distance = value < min ? min - value : value - max;
    const range = max - min;
    const percentOff = (distance / range) * 100;
    
    if (percentOff <= 25) {
      status = "Good";
      statusClass = "status-good";
      progressWidth = 75;
    } else if (percentOff <= 50) {
      status = "Warning";
      statusClass = "status-warning";
      progressWidth = 50;
    } else {
      status = "Critical";
      statusClass = "status-critical";
      progressWidth = 25;
    }
  }
  
  return {
    status,
    statusClass,
    progressWidth,
    progressClass: inRange ? "progress-optimal" : 
                  (status === "Warning" ? "progress-warning" : "progress-critical")
  };
}

// Helper function to create individual metric card
function createMetricCard(icon, title, currentValue, optimal, unit = "", explanation = "") {
  const metricData = getMetricStatus(currentValue, optimal, unit);
  
  return `
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-icon">${icon}</span>
        <h4 class="metric-title">${title}</h4>
      </div>
      
      <div class="metric-value">
        <span class="metric-current">${currentValue}${unit}</span>
        <span class="metric-status ${metricData.statusClass}">${metricData.status}</span>
      </div>
      
      <div class="metric-optimal">
        Optimal: ${optimal[0]}–${optimal[1]}${unit}
      </div>
      
      <div class="metric-progress">
        <div class="progress-bar ${metricData.progressClass}" 
             style="width: ${metricData.progressWidth}%"></div>
      </div>
      
      ${explanation ? `<div class="metric-explanation">${explanation}</div>` : ''}
    </div>
  `;
}

// Enhanced function to generate performance metrics display
function generatePerformanceDisplay(userSliders, scenario) {
  const p = scenario.crop.prefs;
  
  // Get explanations for this crop
  const cropExplanations = getCropExplanations(scenario.crop.name);
  
  const cards = [
    createMetricCard(
      "🌡️", "Temperature", 
      userSliders.temp, p.temp, "°C",
      between(userSliders.temp, p.temp) ? 
        cropExplanations.temp.pos : 
        cropExplanations.temp.neg(userSliders.temp)
    ),
    createMetricCard(
      "💧", "Humidity", 
      userSliders.humidity, p.humidity, "%",
      between(userSliders.humidity, p.humidity) ? 
        cropExplanations.humidity.pos : 
        cropExplanations.humidity.neg(userSliders.humidity)
    ),
    createMetricCard(
      "☀️", "Photoperiod", 
      userSliders.light, p.light, " hrs",
      between(userSliders.light, p.light) ? 
        cropExplanations.light.pos : 
        cropExplanations.light.neg(userSliders.light)
    ),
    createMetricCard(
      "🧪", "CO₂", 
      userSliders.co2, p.co2, " ppm",
      between(userSliders.co2, p.co2) ? 
        cropExplanations.co2.pos : 
        cropExplanations.co2.neg(userSliders.co2)
    ),
    createMetricCard(
      "☀️", "DLI", 
      userSliders.dli, p.dli, " mol/m²/day",
      between(userSliders.dli, p.dli) ? 
        cropExplanations.dli.pos : 
        cropExplanations.dli.neg(userSliders.dli)
    ),
    createMetricCard(
      "💧", "EC", 
      userSliders.ec, p.ec, " mS/cm",
      between(userSliders.ec, p.ec) ? 
        cropExplanations.ec.pos : 
        cropExplanations.ec.neg(userSliders.ec)
    ),
    createMetricCard(
      "🌿", "pH", 
      userSliders.ph.toFixed(1), p.ph, "",
      between(userSliders.ph, p.ph) ? 
        cropExplanations.ph.pos : 
        cropExplanations.ph.neg(userSliders.ph)
    )
  ];
  
  return `
    <h4>🎯 Your Performance & Optimal Ranges:</h4>
    <div class="performance-grid">
      ${cards.join('')}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎯 Enhanced Quiz Results Display
// ─────────────────────────────────────────────────────────────────────────────

// Enhanced quiz result card function
function createQuizCard(isCorrect, questionText, userAnswer, correctAnswer, explanation) {
  const cardClass = isCorrect ? "quiz-card-correct" : "quiz-card-incorrect";
  const icon = isCorrect ? "✅" : "❌";
  
  return `
    <div class="quiz-card ${cardClass}">
      <div class="quiz-card-header">
        <span class="quiz-card-icon">${icon}</span>
        <h4 class="quiz-card-title">${questionText}</h4>
      </div>
      <div class="quiz-card-content">
        <div class="quiz-answer-row">
          <span class="quiz-answer-label">Your answer:</span>
          <span class="quiz-answer-value" style="color: ${isCorrect ? '#2e7d32' : '#d32f2f'}">
            ${escapeHtml(userAnswer || "No answer")}
          </span>
        </div>
        <div class="quiz-answer-row">
          <span class="quiz-answer-label">Correct answer:</span>
          <span class="quiz-answer-value" style="color: #2e7d32">
            ${escapeHtml(correctAnswer)}
          </span>
        </div>
        <div class="quiz-explanation">
          ${escapeHtml(explanation)}
        </div>
      </div>
    </div>
  `;
}

// Helper function to get crop explanations (moved from checkOutcome)
function getCropExplanations(cropName) {
  const cropExplanations = {
    Lettuce: {
      temp: {
        pos: "Lettuce prefers 16–22°C for compact leaf growth and prevents bolting.",
        neg: (val) => val < 16 ? "Below 16°C slows growth and yields small heads." : "Above 22°C causes bolting and bitter taste."
      },
      humidity: {
        pos: "50–70% RH prevents VPD stress while avoiding fungal issues.",
        neg: (val) => val < 50 ? "Low humidity causes wilting from excessive water loss." : "High humidity promotes fungal diseases."
      },
      light: {
        pos: "8–12 hrs provides energy without photoinhibition.",
        neg: (val) => val < 8 ? "Insufficient light causes weak, elongated growth." : "Excess light can cause leaf burn and stress."
      },
      co2: {
        pos: "350–450 ppm supports normal photosynthesis.",
        neg: (val) => val < 350 ? "Low CO₂ limits photosynthesis and growth." : "Excess CO₂ provides minimal benefit."
      },
      dli: {
        pos: "12–18 mol/m²/day prevents legginess while providing energy.",
        neg: (val) => val < 12 ? "Low DLI causes weak, pale leaves." : "High DLI risks photoinhibition."
      },
      ec: {
        pos: "0.5–0.8 mS/cm avoids salt stress while supplying nutrients.",
        neg: (val) => val < 0.5 ? "Low EC causes nutrient deficiency." : "High EC causes salt stress and tip burn."
      },
      ph: {
        pos: "pH 5.5–6.2 maximizes nutrient availability.",
        neg: (val) => val < 5.5 ? "Low pH inhibits calcium uptake." : "High pH causes micronutrient deficiency."
      }
    },
    Tomato: {
      temp: {
        pos: "22–28°C optimizes flower set and enzymatic ripening.",
        neg: (val) => val < 22 ? "Below 22°C reduces fruit set and causes blossom drop." : "Above 28°C causes heat stress and poor fruit quality."
      },
      humidity: {
        pos: "55–70% RH balances disease risk and proper fruit expansion.",
        neg: (val) => val < 55 ? "Low humidity impedes sugar translocation to fruit." : "High humidity promotes fungal diseases and blossom end rot."
      },
      light: {
        pos: "12–18 hrs supports vegetative growth and fruit set.",
        neg: (val) => val < 12 ? "Insufficient light delays fruit set and reduces yield." : "Excess light may cause photoinhibition if other factors aren't optimized."
      },
      co2: {
        pos: "400–500 ppm supports high photosynthetic flux for fruit production.",
        neg: (val) => val < 400 ? "Low CO₂ limits photosynthesis and reduces fruit quality." : "Excess CO₂ may cause stomatal closure and tip burn."
      },
      dli: {
        pos: "20–30 mol/m²/day encourages robust fruit set without leaf scorch.",
        neg: (val) => val < 20 ? "Low DLI weakens flowering and reduces harvest." : "High DLI risks leaf scorch and slowed fruit expansion."
      },
      ec: {
        pos: "0.8–1.2 mS/cm supplies balanced nutrients for fruiting.",
        neg: (val) => val < 0.8 ? "Low EC causes nutrient deficiency and blossom end rot." : "High EC causes salt injury and stunted growth."
      },
      ph: {
        pos: "pH 5.8–6.5 keeps calcium available, preventing blossom end rot.",
        neg: (val) => val < 5.8 ? "Low pH risks manganese toxicity and root damage." : "High pH causes calcium deficiency and chlorosis."
      }
    },
    Cannabis: {
      temp: {
        pos: "22–28°C maximizes terpene production and prevents heat stress.",
        neg: (val) => val < 22 ? "Low temperature slows metabolism and reduces resin production." : "High temperature causes heat stress and reduces cannabinoid production."
      },
      humidity: {
        pos: "50–60% RH reduces mold risk while maintaining proper stomatal function.",
        neg: (val) => val < 50 ? "Low humidity causes excessive transpiration and growth stall." : "High humidity increases mold and bud rot risk."
      },
      light: {
        pos: "18–20 hrs in veg promotes compact branching; 12/12 for bloom.",
        neg: (val) => val < 18 ? "Insufficient light causes stretching and poor canopy structure." : "Excess light without adequate CO₂ can stress plants."
      },
      co2: {
        pos: "600–800 ppm under high light boosts cannabinoid yield.",
        neg: (val) => val < 600 ? "Low CO₂ limits photosynthesis and reduces yield." : "Excess CO₂ causes stomatal closure and poor nutrient uptake."
      },
      dli: {
        pos: "30–40 mol/m²/day meets high photosynthetic demand.",
        neg: (val) => val < 30 ? "Low DLI weakens bud formation and reduces potency." : "High DLI causes photoinhibition and leaf bleaching."
      },
      ec: {
        pos: "1.0–1.2 mS/cm supplies balanced nutrients without burn.",
        neg: (val) => val < 1.0 ? "Low EC causes nitrogen deficiency and poor flower development." : "High EC triggers nutrient burn and stunted growth."
      },
      ph: {
        pos: "pH 5.8–6.0 ensures optimal nutrient uptake in hydro.",
        neg: (val) => val < 5.8 ? "Low pH causes root rot and manganese toxicity." : "High pH reduces calcium and phosphorus uptake."
      }
    },
    Strawberries: {
      temp: {
        pos: "18–24°C encourages fruit set and sugar accumulation.",
        neg: (val) => val < 18 ? "Low temperature slows bloom and reduces sugar content." : "High temperature causes heat stress and poor fruit quality."
      },
      humidity: {
        pos: "60–75% RH reduces fungal risk while preserving fruit turgor.",
        neg: (val) => val < 60 ? "Low humidity causes fruit shriveling and blossom abortion." : "High humidity fosters gray mold and fruit rot."
      },
      light: {
        pos: "10–16 hrs drives sugar accumulation and consistent berry sizing.",
        neg: (val) => val < 10 ? "Insufficient light produces small, tart berries." : "Excess light risks photoinhibition and reduced flavor."
      },
      co2: {
        pos: "400–500 ppm ensures efficient photosynthesis for fruit development.",
        neg: (val) => val < 400 ? "Low CO₂ reduces fruit set and sweetness." : "Excess CO₂ can produce bland fruit with poor flavor."
      },
      dli: {
        pos: "15–25 mol/m²/day provides balanced bloom without bleaching.",
        neg: (val) => val < 15 ? "Low DLI slows flowering and produces small berries." : "High DLI can bleach leaves and degrade fruit flavor."
      },
      ec: {
        pos: "1.2–1.6 mS/cm provides balanced nutrients for fruit development.",
        neg: (val) => val < 1.2 ? "Low EC causes potassium deficiency and poor fruit set." : "High EC causes salt buildup and root damage."
      },
      ph: {
        pos: "pH 5.8–6.2 optimizes calcium and boron uptake.",
        neg: (val) => val < 5.8 ? "Low pH reduces calcium uptake and causes internal tip burn." : "High pH causes calcium and boron lockout."
      }
    }
  };
  
  return cropExplanations[cropName] || {
    temp: { pos: "Optimal temperature range.", neg: (val) => `Temperature ${val}°C is outside ideal range.` },
    humidity: { pos: "Optimal humidity range.", neg: (val) => `Humidity ${val}% is outside ideal range.` },
    light: { pos: "Optimal light duration.", neg: (val) => `Light ${val} hrs is outside ideal range.` },
    co2: { pos: "Optimal CO₂ range.", neg: (val) => `CO₂ ${val} ppm is outside ideal range.` },
    dli: { pos: "Optimal DLI range.", neg: (val) => `DLI ${val} is outside ideal range.` },
    ec: { pos: "Optimal EC range.", neg: (val) => `EC ${val} is outside ideal range.` },
    ph: { pos: "Optimal pH range.", neg: (val) => `pH ${val} is outside ideal range.` }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎓 Quiz Explanation Texts (Bonus Only)
// ─────────────────────────────────────────────────────────────────────────────
const bonusQuizExplanations = {
  Lettuce: {
    question: "Why does lettuce bolt prematurely?",
    pos:
      "Bolting is triggered by prolonged exposure to high temperatures, causing lettuce to shift energy from leaf production to seed formation.",
    neg: (val) =>
      `${val} does not trigger bolting. Only excessive heat causes lettuce to bolt prematurely.`,
  },
  Tomato: {
    question: "What causes blossom end rot in tomatoes?",
    pos:
      "Blossom end rot is caused by insufficient calcium uptake, which weakens cell walls at the fruit’s blossom end.",
    neg: (val) =>
      `${val} is not the cause of blossom end rot. Low calcium levels prevent proper cell wall formation in the fruit.`,
  },
  Cannabis: {
    question: "What is the ideal flowering photoperiod for cannabis?",
    pos:
      "Cannabis requires a 12/12 light/dark cycle to trigger the flowering hormone pathways and maximize bud production.",
    neg: (val) =>
      `${val} does not provide the necessary equal light/dark cycle needed to initiate and sustain flowering in cannabis.`,
  },
  Strawberries: {
    question: "What pest often affects strawberries?",
    pos:
      "All of the above pests—spider mites, aphids, and thrips—commonly infest strawberries and damage foliage and fruit.",
    neg: (val) =>
      `${val} alone is not comprehensive; strawberries are attacked by multiple pests, including spider mites, aphids, and thrips.`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 🎮 renderScenario(): Populate UI for Built-In or AI mode
// ─────────────────────────────────────────────────────────────────────────────
async function renderScenario() {
  // Hide result & history on each new scenario
  document.getElementById("resultBox").style.display = "none";
  document.getElementById("historyBox").style.display = "none";

  const scenarioType = document.getElementById("scenarioType").value;
  startTime = Date.now();

  // Re-enable sliders each time
  ["temp", "humidity", "light", "co2", "dli", "ec", "ph"].forEach((id) => {
    document.getElementById(id).disabled = false;
  });

  // Hide AI textarea by default
  document.getElementById("aiRecommendation").style.display = "none";

  if (scenarioType === "physiological") {   
   // ── Built-In Scenario Mode ──
    scenario = generateScenario(difficultyLevel);

    // 1) Titles
    document.getElementById(
      "levelTitle"
    ).textContent = `🧠 Level ${difficultyLevel}: ${
      levels[difficultyLevel - 1]
    }`;
    document.getElementById(
      "cropTitle"
    ).textContent = `🌿 Crop: ${scenario.crop.name}`;

    // 2) Simulated Environment
    document.getElementById("environmentBox").innerHTML = `
      <h3>🌡️ Simulated Environment</h3>
      <div class="env-grid">
        <div><strong>Temperature:</strong> ${
          typeof scenario.stats.temp === "number"
            ? scenario.stats.temp + "°C (" + toF(scenario.stats.temp) + "°F)"
            : scenario.stats.temp
        }</div>
        <div><strong>CO₂:</strong> ${scenario.stats.co2} ppm</div>
        <div><strong>Humidity:</strong> ${scenario.stats.humidity}%</div>
        <div><strong>DLI:</strong> ${scenario.stats.dli} mol/m²/day</div>
        <div><strong>Photoperiod:</strong> ${scenario.stats.light} hrs</div>
        <div><strong>EC:</strong> ${
          typeof scenario.stats.ec === "number"
            ? scenario.stats.ec + " mS/cm"
            : scenario.stats.ec
        }</div>
        <div><strong>pH:</strong> ${
          typeof scenario.stats.ph === "number"
            ? scenario.stats.ph.toFixed(1)
            : scenario.stats.ph
        }</div>
        <div><strong>Dissolved O₂:</strong> ${scenario.stats.do} mg/L</div>
        <div class="full-row"><strong>Airflow:</strong> ${
          scenario.stats.airflow
        }</div>
      </div>`;

    // 3) Build Symptoms Table (with “?” placeholders)
    const symptomRows = scenario.symptoms
      .map((symp) => `<tr><td>${escapeHtml(symp)}</td><td class="trigger-cell">?</td></tr>`)
      .join("");
    document.getElementById("symptomsBox").innerHTML = `
      <h3>🧪 Observed Symptoms</h3>
      <table class="symptoms-table">
        <tr><th>Symptom</th><th>Likely Trigger</th></tr>
        ${symptomRows}
      </table>`;

    // 4) Build Main “Likely Trigger” Quiz
    const atomicCauses = scenario.cause
      .split(" + ")
      .map((c) => c.trim());
    let options = [...atomicCauses, scenario.cause];
    const allPossibleCauses = Array.from(
      new Set(scenario.crop.stressors.map((s) => s.cause))
    );
    while (options.length < 4) {
      const remaining = allPossibleCauses.filter((c) => !options.includes(c));
      if (!remaining.length) break;
      const rnd = remaining[Math.floor(Math.random() * remaining.length)];
      options.push(rnd);
    }
    if (options.length > 4) {
      options = shuffle(options).slice(0, 4);
    }
    options = shuffle(options);
    const mainQuizHTML = `
      <h3>❓ What is the likely trigger for these symptoms?</h3>
      ${options
        .map(
          (opt) =>
            `<label><input type="radio" name="mainQuiz" value="${escapeHtml(
              opt
            )}"> ${escapeHtml(opt)}</label><br>`
        )
        .join("")}
    `;

    // 5) Build Bonus Quiz
    const q = scenario.crop.quiz;
    const bonusQuizHTML = `
      <hr>
      <h3>📘 Bonus Quiz:</h3>
      <p>${escapeHtml(q.question)}</p>
      ${q.options
        .map(
          (opt) =>
            `<label><input type="radio" name="bonusQuiz" value="${escapeHtml(
              opt
            )}"> ${escapeHtml(opt)}</label><br>`
        )
        .join("")}
    `;

    document.getElementById("quizBox").innerHTML =
      mainQuizHTML + bonusQuizHTML;

} else if (scenarioType === "ipm") {
    // ── IPM Pest Scenario Mode ──
    const ipmScenario = generateIPMScenario();
    
    // 1) Titles  
    document.getElementById("levelTitle").textContent = `🐛 IPM Challenge: ${ipmScenario.severity} Infestation`;
    document.getElementById("cropTitle").textContent = `🌿 Crop: ${ipmScenario.crop}`;
    
    // 2) Simulated Environment (Environmental Factors) - HIDE the pest identification
    document.getElementById("environmentBox").innerHTML = `
      <h3>🌡️ Environmental Conditions</h3>
      <div class="env-grid">
        <div><strong>Temperature:</strong> ${ipmScenario.environmentalFactors.temp}°C (${toF(ipmScenario.environmentalFactors.temp)}°F)</div>
        <div><strong>Humidity:</strong> ${ipmScenario.environmentalFactors.humidity}%</div>
        <div><strong>Airflow:</strong> ${ipmScenario.environmentalFactors.airflow}</div>
        <div class="full-row"><strong>Pest Identified:</strong> <span id="pestReveal" class="trigger-cell">?</span></div>
        <div class="full-row"><strong>Description:</strong> ${ipmScenario.description}</div>
      </div>`;

    // 3) Symptoms & Biological Signs with HIDDEN types (using "?" like physiological mode)
    const symptomRows = ipmScenario.symptoms
      .map(symptom => `<tr><td>${escapeHtml(symptom)}</td><td class="trigger-cell">?</td></tr>`)
      .join("");
    
    const biologicalRows = ipmScenario.biologicalSigns
      .map(sign => `<tr><td>${escapeHtml(sign)}</td><td class="trigger-cell">?</td></tr>`)
      .join("");

    document.getElementById("symptomsBox").innerHTML = `
      <h3>🧪 Observed Symptoms & Signs</h3>
      <table class="symptoms-table">
        <tr><th>Plant Damage</th><th>Type</th></tr>
        ${symptomRows}
        <tr><th>Biological Evidence</th><th>Type</th></tr>
        ${biologicalRows}
      </table>`;

    // 4) IPM Treatment Quiz + Damage Type Quiz + PEST IDENTIFICATION QUIZ
    const allTreatments = [
      ipmScenario.correctTreatment,
      ...ipmScenario.incorrectTreatments
    ];
    const shuffledTreatments = shuffle(allTreatments);
    
    // Create pest options (correct pest + 3 random wrong pests)
    const allPests = [
      "Two-Spotted Spider Mites", "Broad Mites", "Western Flower Thrips", "Russet Mites", 
      "Cutworms", "Green Peach Aphids", "Fungus Gnats", "Greenhouse Whitefly", 
      "Cabbage Loopers", "Shore Flies", "Silverleaf Whitefly", "Serpentine Leafminer", 
      "Potato Leafhopper"
    ];
    
    let pestOptions = [ipmScenario.pest];
    const otherPests = allPests.filter(pest => pest !== ipmScenario.pest);
    
    // Add 3 random incorrect pests
    while (pestOptions.length < 4) {
      const randomPest = otherPests[Math.floor(Math.random() * otherPests.length)];
      if (!pestOptions.includes(randomPest)) {
        pestOptions.push(randomPest);
      }
    }
    pestOptions = shuffle(pestOptions);
    
    // Damage type options for the quiz
    const damageTypes = ["Pest damage", "Environmental stress", "Nutrient deficiency", "Disease"];
    const evidenceTypes = ["Biological evidence", "Chemical residue", "Physical damage", "Growth abnormality"];
    
    const ipmQuizHTML = `
      <h3>🐛 IPM Challenge Questions</h3>
      
      <div style="margin-bottom: 1.5rem;">
        <h4>🐛 What pest is causing this damage?</h4>
        ${pestOptions
          .map(pest => 
            `<label><input type="radio" name="pestIdQuiz" value="${escapeHtml(pest)}"> ${escapeHtml(pest)}</label><br>`
          )
          .join("")}
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h4>❓ What type of damage are the plant symptoms?</h4>
        ${damageTypes
          .map(type => 
            `<label><input type="radio" name="damageTypeQuiz" value="${escapeHtml(type)}"> ${escapeHtml(type)}</label><br>`
          )
          .join("")}
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h4>🔬 What type of evidence supports your diagnosis?</h4>
        ${evidenceTypes
          .map(type => 
            `<label><input type="radio" name="evidenceTypeQuiz" value="${escapeHtml(type)}"> ${escapeHtml(type)}</label><br>`
          )
          .join("")}
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h4>🌿 ${escapeHtml(ipmScenario.question)}</h4>
        ${shuffledTreatments
          .map(treatment => 
            `<label><input type="radio" name="ipmQuiz" value="${escapeHtml(treatment)}"> ${escapeHtml(treatment)}</label><br>`
          )
          .join("")}
      </div>
    `;

    document.getElementById("quizBox").innerHTML = ipmQuizHTML;
    
    // Store the current IPM scenario globally for checking answers
    window.currentIPMScenario = ipmScenario;

  } else {

    // ── AI-Generated Scenario Mode ──
    document.getElementById(
      "levelTitle"
    ).textContent = `🤖 AI Scenario (Level ${difficultyLevel}: ${
      levels[difficultyLevel - 1]
    })`;
    document.getElementById("cropTitle").textContent =
      "🌿 Crop: [AI-generated scenario]";
    document.getElementById("environmentBox").innerHTML = `
      <h3>🌡️ Simulated Environment</h3>
      <p>See symptoms & “Your Task” below</p>`;
    document.getElementById("symptomsBox").innerHTML = `
      <h3>🧪 AI Scenario (Symptoms & Your Task)</h3>
      <p>Loading AI scenario…</p>`;
    document.getElementById("quizBox").innerHTML = "";
    document.getElementById("aiRecommendation").style.display = "none";
    fetchGPTScenario();
  }

  // 6) Reset sliders to default every time
  document.getElementById("temp").value = 25;
  document.getElementById("humidity").value = 60;
  document.getElementById("light").value = 12;
  document.getElementById("co2").value = 400;
  document.getElementById("dli").value = 20;
  document.getElementById("ec").value = 1.0;
  document.getElementById("ph").value = 6.0;
  updateLabels();
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎯 checkOutcome(): Detailed per-parameter “Why?” & “What If?” + Quiz Feedback
// ─────────────────────────────────────────────────────────────────────────────
async function checkOutcome() {
  const scenarioType = document.getElementById("scenarioType").value;

  // ── BUILT-IN SCENARIO MODE ──
  if (scenarioType === "physiological") {    // 1) Gather user slider inputs
    const userSliders = {
      temp: parseInt(document.getElementById("temp").value, 10),
      humidity: parseInt(document.getElementById("humidity").value, 10),
      light: parseInt(document.getElementById("light").value, 10),
      co2: parseInt(document.getElementById("co2").value, 10),
      dli: parseInt(document.getElementById("dli").value, 10),
      ec: parseFloat(document.getElementById("ec").value),
      ph: parseFloat(document.getElementById("ph").value),
      do: scenario.stats.do,
      airflow: scenario.stats.airflow,
    };

    // 2) Main “Likely Trigger” quiz
    const mainSelected = document.querySelector('input[name="mainQuiz"]:checked');
    const mainAnswer = mainSelected ? mainSelected.value : null;
    const mainCorrect = mainAnswer === scenario.cause;

    // 3) Bonus quiz
    const bonusSelected = document.querySelector('input[name="bonusQuiz"]:checked');
    const bonusAnswer = bonusSelected ? bonusSelected.value : null;
    const bonusCorrect =
      bonusAnswer === scenario.crop.quiz.answer;

   // 4) Reveal "Likely Trigger" placeholders with GREEN highlighting
    document.querySelectorAll(".trigger-cell").forEach((cell) => {
      cell.textContent = scenario.cause;
      cell.style.color = "green";
      cell.style.fontWeight = "bold";
    });
    
    // 5) Score calculation
    let points = 0;
    if (mainCorrect) points += 3; // 3 pts for correct trigger
    if (bonusCorrect) points += 1; // 1 pt for bonus quiz
    if (between(userSliders.temp, scenario.crop.prefs.temp)) points++;
    if (between(userSliders.humidity, scenario.crop.prefs.humidity)) points++;
    if (between(userSliders.light, scenario.crop.prefs.light)) points++;
    if (between(userSliders.co2, scenario.crop.prefs.co2)) points++;
    if (between(userSliders.dli, scenario.crop.prefs.dli)) points++;
    if (between(userSliders.ec, scenario.crop.prefs.ec)) points++;
    if (between(userSliders.ph, scenario.crop.prefs.ph)) points++;

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    // ─────────────────────────────────────────────────────────────────────────
    // 📚 Crop-Specific "Why?" and "What If?" Explanations
    // ─────────────────────────────────────────────────────────────────────────
    const cropName = scenario.crop.name;

    // Each crop’s detailed feedback per parameter
    const cropExplanations = {
      Lettuce: {
        temp: {
          pos:
            "Lettuce prefers 16–22 °C because cooler temperatures promote compact leaf growth and prevent premature bolting.",
          neg: (val) =>
            val < 16
              ? "Below 16 °C, lettuce metabolism slows. If kept this cold, growth becomes spindly and heads remain small."
              : "Above 22 °C, lettuce is likely to bolt, taste bitter, and develop tip burn. If heat persists, harvest window is missed.",
        },
        humidity: {
          pos:
            "Maintaining 50–70 % RH prevents excessive VPD stress, keeping new leaves turgid without encouraging fungal growth.",
          neg: (val) =>
            val < 50
              ? "Below 50 % RH, VPD is high and plants lose water faster than they can uptake it. Sustained low RH leads to wilting and uneven heads."
              : "Above 70 % RH, fungal issues (e.g., Botrytis) become likely. Persistent humidity causes wet bottom and mold on the head.",
        },
        light: {
          pos:
            "8–12 hrs light (DLI ~12–18 mol/m²/day) supplies enough energy without causing photoinhibition or legginess.",
          neg: (val) =>
            val < 8
              ? "Less than 8 hrs (DLI <12) yields elongated, weak leaves and slow head formation. Over time, heads are under‐sized."
              : "More than 12 hrs (DLI >18) can cause photoinhibition or heat stress. Sustained high DLI leads to crispy leaf margins.",
        },
        co2: {
          pos:
            "350–450 ppm CO₂ supports normal photosynthesis for leafy greens without pushing excessive stretch.",
          neg: (val) =>
            val < 350
              ? "Below 350 ppm, photosynthesis is CO₂-limited, reducing biomass. If prolonged, heads never fully develop."
              : "Above 450 ppm yields minimal benefit for lettuce; too much CO₂ can upset stomatal function. Over‐time, shelf life drops.",
        },
        dli: {
          pos:
            "12–18 mol/m²/day prevents legginess while providing sufficient energy for crisp head formation.",
          neg: (val) =>
            val < 12
              ? "If DLI <12, leaves become weak and pale, slowing head fill. Extended low DLI → underdeveloped, floppy lettuce."
              : "If DLI >18, risk of photoinhibition; leaves appear bleached and stunted. Continued excess light halts head growth.",
        },
        ec: {
          pos:
            "0.5–0.8 mS/cm avoids salt stress while supplying adequate nutrients for leafy growth.",
          neg: (val) =>
            val < 0.5
              ? "Below 0.5 mS/cm, nutrient deficiency (especially nitrogen) clogs growth. If kept low, heads are small and pale."
              : "Above 0.8 mS/cm, salt stress damages roots, causing tip burn. Persistent high EC → brown root tips and leaf burn.",
        },
        ph: {
          pos:
            "pH 5.5–6.2 maximizes micronutrient availability (Fe, Mn, Zn) for crisp, bright green leaves.",
          neg: (val) =>
            val < 5.5
              ? "Below 5.5, Ca and Mg uptake is inhibited, causing internal tip burn and root damage in prolonged conditions."
              : "Above 6.2, iron and other micronutrients precipitate, leading to interveinal chlorosis. Extended high pH → stunted growth.",
        },
      },

      Tomato: {
        temp: {
          pos:
            "22–28 °C optimizes flower set, enzymatic ripening, and maintains pollen viability.",
          neg: (val) =>
            val < 22
              ? "Below 22 °C, pollen tube growth slows, reducing fruit set. Prolonged cold causes blossom abortion and poor yield."
              : "Above 28 °C, pollen viability drops and blossom drop increases. Continued heat results in sunscald on fruit.",
        },
        humidity: {
          pos:
            "55–70 % RH balances disease risk (too high) and excessive VPD (too low) for proper fruit expansion.",
          neg: (val) =>
            val < 55
              ? "Below 55 % RH, high VPD causes stomatal closure, impeding sugar translocation. Over time, fruit size and flavor suffer."
              : "Above 70 % RH, fungal disease (Botrytis/bacterial) is likely. Sustained humidity yields blossom end rot and rot.",
        },
        light: {
          pos:
            "12–18 hrs light (DLI ~20–30 mol/m²/day) fuels vegetative growth and fruit set without photoinhibition.",
          neg: (val) =>
            val < 12
              ? "Under 12 hrs, fruit set is delayed and plants become leggy. Continued low light → fewer, small tomatoes."
              : "Over 18 hrs, leaves may photoinhibit or burn if other parameters (temp, airflow) aren’t optimized. Prolonged high DLI stalls fruit fill.",
        },
        co2: {
          pos:
            "400–500 ppm CO₂ supports high photosynthetic flux needed for heavy fruit production.",
          neg: (val) =>
            val < 400
              ? "Below 400 ppm, photosynthesis is CO₂-limited and yield drops. If maintained low, fruits are pale and low‐sugar."
              : "Above 500 ppm yields diminishing returns; stomata may close, risking tip burn. Sustained high CO₂ → uneven ripening.",
        },
        dli: {
          pos:
            "20–30 mol/m²/day encourages robust fruit set while avoiding leaf scorch.",
          neg: (val) =>
            val < 20
              ? "Under 20 mol, flowering is weak and fruit set is poor. Over time, harvest is delayed and yields drop significantly."
              : "Above 30 mol risks leaf scorch under high irradiance. Prolonged excess leads to leaf burn and slowed fruit expansion.",
        },
        ec: {
          pos:
            "0.8–1.2 mS/cm supplies balanced nutrients for fruiting without salt buildup.",
          neg: (val) =>
            val < 0.8
              ? "Below 0.8 mS/cm, nutrient deficiency (especially K, Ca) causes blossom end rot. Prolonged low EC → fruit disorders."
              : "Above 1.2 mS/cm, salt injury damages roots, causing tip burn and nutrient lockout. Extended high EC → stunted growth.",
        },
        ph: {
          pos:
            "pH 5.8–6.5 keeps calcium and other cations available, preventing blossom end rot.",
          neg: (val) =>
            val < 5.8
              ? "Below 5.8, risk of Mn toxicity and Fe overavailability—leaf cupping and black spots. Continued low pH → root damage."
              : "Above 6.5, Ca becomes unavailable leading to blossom end rot. Persistently high pH → chlorosis on new leaves.",
        },
      },

      Cannabis: {
        temp: {
          pos:
            "22–28 °C maximizes terpene/flavonoid production and prevents heat stress during flowering.",
          neg: (val) =>
            val < 22
              ? "Below 22 °C, metabolic processes slow and bud density is compromised. Extended cold → poor resin and yield loss."
              : "Above 28 °C, cannabinoid production drops and heat stress appears as bud tip burn. Sustained high heat → bud rot in dense canopies.",
        },
        humidity: {
          pos:
            "50–60 % RH reduces mold risk in buds while maintaining proper stomatal function in dense canopies.",
          neg: (val) =>
            val < 50
              ? "Below 50 % RH, VPD is too high leading to stomatal closure and reduced CO₂ uptake. Over time, growth stalls and resin production falls."
              : "Above 60 % RH, mold and bud rot risk skyrockets. Prolonged high humidity → powdery mildew and bud loss.",
        },
        light: {
          pos:
            "18–20 hrs (DLI ~30–40 mol/m²/day) during veg promotes compact branching; switch to 12/12 for bloom.",
          neg: (val) =>
            val < 18
              ? "Under 18 hrs in veg, plants stretch and become leggy. Extended low photoperiod → wide internodes, poor canopy structure."
              : "Over 20 hrs in veg can confuse flowering hormones without adequate CO₂. Continual excess → hermaphrodite triggers and stress.",
        },
        co2: {
          pos:
            "600–800 ppm CO₂ under high light intensities boosts cannabinoid yield and faster growth.",
          neg: (val) =>
            val < 600
              ? "Below 600 ppm, photosynthesis is limited, reducing yield and density. If low CO₂ continues, buds remain small."
              : "Above 800 ppm yields diminishing returns; prolonged high CO₂ leads to stomatal closure and poor uptake of water/nutrients.",
        },
        dli: {
          pos:
            "30–40 mol/m²/day (12–16 hrs strong LED) meets high photosynthetic demand in veg and early bloom.",
          neg: (val) =>
            val < 30
              ? "Under 30 mol, bud formation weakens and internodes stretch. Over time, buds remain sparse and lack weight."
              : "Above 40 mol causes photoinhibition and heat stress. Prolonged high DLI → leaf bleach and growth stalls.",
        },
        ec: {
          pos:
            "1.0–1.2 mS/cm supplies balanced nutrients for veg and early flower without burn.",
          neg: (val) =>
            val < 1.0
              ? "Below 1.0 mS/cm, N deficiency occurs—fan leaves yellow. If maintained, flower development lags and yields drop."
              : "Above 1.2 mS/cm triggers nutrient burn and root tip death. Extended high EC → leaf brown tips, stalled growth.",
        },
        ph: {
          pos:
            "pH 5.8–6.0 ensures optimal uptake of NPK and micronutrients in coco or hydro.",
          neg: (val) =>
            val < 5.8
              ? "Below 5.8, Mn toxicity or root rot arises. Continued low pH → brown roots, leaf tip burn, poor nutrient uptake."
              : "Above 6.0, Ca and P uptake drop, causing bud rot and interveinal yellowing. Sustained high pH → stunted, weak roots.",
        },
      },

      Strawberries: {
        temp: {
          pos:
            "18–24 °C encourages fruit set and sugar accumulation without heat stress on blossoms.",
          neg: (val) =>
            val < 18
              ? "Below 18 °C, bloom slows and sugar content remains low. Extended cold → poor flavor and uneven ripening."
              : "Above 24 °C, heat stress causes blossom drop and sunscald on berries. Sustained high heat → small, pale fruit.",
        },
        humidity: {
          pos:
            "60–75 % RH reduces fungal risk (e.g., Botrytis) while preserving turgor in developing fruit.",
          neg: (val) =>
            val < 60
              ? "Below 60 % RH, transpirational water loss causes fruit shriveling. Prolonged dryness → blossom abortion."
              : "Above 75 % RH fosters gray mold and fungal rot. If high humidity persists, harvest is lost to decay.",
        },
        light: {
          pos:
            "10–16 hrs light (DLI 15–25 mol/m²/day) drives sugar accumulation and consistent berry sizing.",
          neg: (val) =>
            val < 10
              ? "Under 10 hrs, sugar synthesis is insufficient and yields small, tart berries. Continued low light → minimal harvest."
              : "Over 16 hrs risks photoinhibition and leaf scorch. Sustained extreme light → bleached foliage, reduced flavor.",
        },
        co2: {
          pos:
            "400–500 ppm CO₂ ensures efficient photosynthesis for flower initiation and fruit expansion.",
          neg: (val) =>
            val < 400
              ? "Below 400 ppm, CO₂-limited photosynthesis reduces fruit set and sweetness. If low CO₂ continues, yield drops 20–30%."
              : "Above 500 ppm yields bland fruit as transpiration unbalances. Prolonged high CO₂ → poor berry flavor.",
        },
        dli: {
          pos:
            "15–25 mol/m²/day (moderate light) steers balanced bloom without bleaching foliage.",
          neg: (val) =>
            val < 15
              ? "Under 15 mol, flowering slows and berries remain small. Continued low DLI → sparse yield."
              : "Over 25 mol can bleach leaves and fruit. If kept too bright, fruit flavor degrades and leaves crisp.",
        },
        ec: {
          pos:
            "1.2–1.6 mS/cm provides balanced nutrients (especially K) for fruit development.",
          neg: (val) =>
            val < 1.2
              ? "Below 1.2 mS/cm, K deficiency leads to small, underdeveloped berries. Prolonged low EC → poor fruit set."
              : "Above 1.6 mS/cm, salt buildup causes tip burn and wilting. Sustained high EC → root damage and wilt.",
        },
        ph: {
          pos:
            "pH 5.8–6.2 optimizes Ca and B uptake, reducing blossom end rot and promoting uniform berries.",
          neg: (val) =>
            val < 5.8
              ? "Below 5.8, Ca uptake declines → internal tip burn and lopsided fruit. Continued low pH → root damage."
              : "Above 6.2, Ca and B lockout yields poor flavor and brittle fruit. Prolonged high pH → uneven ripening.",
        },
      },
    };

    // Fallback if cropName missing
    const explanations = cropExplanations[cropName] || {
      temp: {
        pos: "This temperature range avoids heat stress while maximizing metabolic rates.",
        neg: (val) =>
          `Temp ${val}°C is off target; leaves may either fail to grow or overheat if persisted.`,
      },
      humidity: {
        pos: "This humidity prevents excessive transpiration or fungal risk.",
        neg: (val) =>
          `Humidity ${val}% is outside ideal; plants would either dehydrate or develop mold.`,
      },
      light: {
        pos: "This photoperiod/DLI balances energy supply without photoinhibition.",
        neg: (val) =>
          `Photoperiod ${val} hrs or DLI ${val} is off; plants would either stretch or bleach.`,
      },
      co2: {
        pos: "This CO₂ range is enough for normal photosynthesis without waste.",
        neg: (val) =>
          `CO₂ ${val} ppm is off; plants would be CO₂-limited or close stomata if excessive.`,
      },
      dli: {
        pos: "This DLI avoids photoinhibition while fueling healthy growth.",
        neg: (val) =>
          `DLI ${val} mol/m²/day is off; plants might grow weak or bleach.`,
      },
      ec: {
        pos: "This EC avoids salt stress while supplying nutrients.",
        neg: (val) =>
          `EC ${val} mS/cm is off; roots suffer deficiency or salt burn.`,
      },
      ph: {
        pos: "This pH maximizes nutrient availability.",
        neg: (val) =>
          `pH ${val} is outside ideal; nutrient lockouts or toxicity occur over time.`,
      },
    };

    // 6) Build Results + per-parameter feedback + Quiz Results
    const p = scenario.crop.prefs;

    // Main quiz explanation (dynamic)
    const mainPosExp = `The trigger "${scenario.cause}" directly leads to the observed symptoms (${scenario.symptoms.join(
      " and "
    )}).`;
    const mainNegExp = (val) =>
      `The trigger "${val}" does not match these symptoms; only "${scenario.cause}" explains them.`;

    // Bonus quiz explanation (static mapping)
    const bonusExp =
      bonusQuizExplanations[cropName] || {
        pos: "Correct!",
        neg: (val) => `${val} is not correct.`,
      };

      document.getElementById("resultBox").innerHTML = `
        <p>✅ Environment Match &amp; Quiz Points: ${
          points >= 4 ? "Pass" : "Needs Improvement"
        }</p>
        <p>🏆 Points Earned: ${points} ${
          mainCorrect ? "(+Trigger Bonus)" : ""
        } ${bonusCorrect ? "(+Quiz Bonus)" : ""}</p>
        <p>🕒 Time Taken: ${timeTaken} sec</p>
        <hr>
        ${generatePerformanceDisplay(userSliders, scenario)}
        <hr>
        ${generatePhysiologicalQuizHTML(mainCorrect, mainAnswer, scenario, bonusCorrect, bonusAnswer, bonusExp)}
      `;

    // 7) Unhide the results panel
    document.getElementById("resultBox").style.display = "block";

    return;
  }

  // ── IPM SCENARIO MODE ──  
  if (scenarioType === "ipm") {
    if (!window.currentIPMScenario) {
      document.getElementById("resultBox").innerHTML = `
        <p class="error">❗ No IPM scenario data found.</p>
      `;
      document.getElementById("resultBox").style.display = "block";
      return;
    }

    const ipmScenario = window.currentIPMScenario;
    
    // Get quiz answers
    const pestSelected = document.querySelector('input[name="pestIdQuiz"]:checked');
    const pestAnswer = pestSelected ? pestSelected.value : null;
    const pestCorrect = pestAnswer === ipmScenario.pest;
    
    const damageSelected = document.querySelector('input[name="damageTypeQuiz"]:checked');
    const damageAnswer = damageSelected ? damageSelected.value : null;
    const damageCorrect = damageAnswer === "Pest damage";
    
    const evidenceSelected = document.querySelector('input[name="evidenceTypeQuiz"]:checked');
    const evidenceAnswer = evidenceSelected ? evidenceSelected.value : null;
    const evidenceCorrect = evidenceAnswer === "Biological evidence";
    
    const ipmSelected = document.querySelector('input[name="ipmQuiz"]:checked');
    const ipmAnswer = ipmSelected ? ipmSelected.value : null;
    const ipmCorrect = ipmAnswer === ipmScenario.correctTreatment;

    // Reveal the pest identification with GREEN highlight
    const pestRevealElement = document.getElementById("pestReveal");
    if (pestRevealElement) {
      pestRevealElement.textContent = ipmScenario.pest;
      pestRevealElement.style.color = "green";
      pestRevealElement.style.fontWeight = "bold";
    }

    // Reveal the "Type" columns with GREEN highlights (always green when revealed)
    document.querySelectorAll(".trigger-cell").forEach((cell, index) => {
      // Skip the pest reveal cell (already handled above)
      if (cell.id === "pestReveal") return;
      
      if (index < ipmScenario.symptoms.length) {
        // First set of cells are symptoms - show "Pest damage"
        cell.textContent = "Pest damage";
      } else {
        // Second set of cells are biological signs - show "Biological evidence"  
        cell.textContent = "Biological evidence";
      }
      // Always show green when revealing answers
      cell.style.color = "green";
      cell.style.fontWeight = "bold";
    });

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    
    // Calculate points: 1.5 pts each for pest ID, damage type, evidence type, and treatment
    let points = 0;
    if (pestCorrect) points += 1.5;
    if (damageCorrect) points += 1.5;
    if (evidenceCorrect) points += 1.5; 
    if (ipmCorrect) points += 1.5;
    points = Math.round(points * 10) / 10; // Round to 1 decimal

    document.getElementById("resultBox").innerHTML = `
      <h4>🐛 IPM Challenge Results</h4>
      <p>🏆 Points Earned: ${points}/6 ${points >= 4 ? "(Pass!)" : "(Needs Improvement)"}</p>
      <p>🕒 Time Taken: ${timeTaken} sec</p>
      ${generateIPMQuizHTML(pestCorrect, pestAnswer, ipmScenario, damageCorrect, damageAnswer, evidenceCorrect, evidenceAnswer, ipmCorrect, ipmAnswer)}      <hr>
      <h4>🎯 Treatment Analysis:</h4>
      <ul>
        <li>
          <strong>Explanation:</strong><br>
          <em>${escapeHtml(ipmScenario.explanation)}</em>
        </li>
      </ul>
      <hr>
      <h4>📋 Pest Summary:</h4>
      <ul>
        <li><strong>Pest:</strong> ${escapeHtml(ipmScenario.pest)}</li>
        <li><strong>Severity:</strong> ${escapeHtml(ipmScenario.severity)}</li>
        <li><strong>Key Environmental Factor:</strong> Temperature ${ipmScenario.environmentalFactors.temp}°C, Humidity ${ipmScenario.environmentalFactors.humidity}%</li>
      </ul>
      ${!ipmCorrect ? `
        <hr>
        <h4>❌ Why Other Treatments Don't Work:</h4>
        <ul>
          ${ipmScenario.incorrectTreatments.map(treatment => 
            `<li><strong>${escapeHtml(treatment)}:</strong> Can cause resistance, harm beneficials, or worsen the problem</li>`
          ).join('')}
        </ul>
      ` : ''}
    `;

    document.getElementById("resultBox").style.display = "block";
    return;
  }


  // ── AI-Generated Scenario Mode ──
  const scenarioText = document.getElementById("symptomsBox").textContent.trim();
  const userSliders = {
    temp: parseInt(document.getElementById("temp").value, 10),
    humidity: parseInt(document.getElementById("humidity").value, 10),
    light: parseInt(document.getElementById("light").value, 10),
    co2: parseInt(document.getElementById("co2").value, 10),
    dli: parseInt(document.getElementById("dli").value, 10),
  };
  const recommendation = document
    .getElementById("aiRecommendation")
    .value.trim();

  if (!scenarioText || recommendation.length < 5) {
    document.getElementById("resultBox").innerHTML = `
      <p class="error">❗ Please wait for the AI scenario to load and type at least a few words of recommendation.</p>
    `;
    document.getElementById("resultBox").style.display = "block";
    return;
  }

  try {
    const resp = await fetch("http://localhost:3001/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: difficultyLevel,
        scenarioText,
        sliders: userSliders,
        recommendation,
      }),
    });
    const data = await resp.json();
    if (resp.ok) {
      document.getElementById("resultBox").innerHTML = `
        <h4>🤖 AI Feedback:</h4>
        <pre style="white-space: pre-wrap; background: #f2f2f2; padding: 0.8rem; border-radius: 4px;">
${data.feedback.trim()}
        </pre>
      `;
    } else {
      document.getElementById("resultBox").innerHTML = `
        <p class="error">❗ Failed to get feedback: ${data.error}</p>
      `;
    }
  } catch (err) {
    document.getElementById("resultBox").innerHTML = `
      <p class="error">❗ Failed to get feedback: ${err.message}</p>
    `;
  }
  document.getElementById("resultBox").style.display = "block";
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔍 fetchGPTScenario(): Called when “Scenario Type” = AI
// ─────────────────────────────────────────────────────────────────────────────
async function fetchGPTScenario() {
  document.getElementById("symptomsBox").innerHTML = `<p>Loading AI scenario…</p>`;
  document.getElementById("resultBox").style.display = "none";

  try {
    const resp = await fetch("http://localhost:3001/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: difficultyLevel }),
    });
    const data = await resp.json();
    if (resp.ok) {
      document.getElementById("symptomsBox").innerHTML = `
        <h3>🧪 AI Scenario (Symptoms & Your Task)</h3>
        <pre style="white-space: pre-wrap;">${data.scenario.trim()}</pre>
      `;
      // Show the AI recommendation textarea
      document.getElementById("aiRecommendation").style.display = "block";
    } else {
      document.getElementById("symptomsBox").innerHTML = `
        <p class="error">❗ Failed to load AI scenario: ${data.error}</p>
      `;
    }
  } catch (err) {
    document.getElementById("symptomsBox").innerHTML = `
      <p class="error">❗ Failed to load AI scenario: ${err.message}</p>
    `;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 📜 loadHistory(): Shows past results from Firebase (if logged in)
// ─────────────────────────────────────────────────────────────────────────────
async function loadHistory() {
  if (!window.firebaseGame?.getUser()) {
    document.getElementById("historyBox").innerHTML = `
      <p class="error">❗ Log in to view your history.</p>
    `;
    document.getElementById("historyBox").style.display = "block";
    return;
  }
  const history = await window.firebaseGame.loadHistory();
  if (!history.length) {
    document.getElementById("historyBox").innerHTML = "<p>No history yet.</p>";
    document.getElementById("historyBox").style.display = "block";
    return;
  }
  let html = "<h3>📜 Past Scenarios</h3><ul>";
  history.forEach((entry) => {
    html += `<li>
      ${entry.crop} – ${entry.points_earned} pts – Quiz: ${
      entry.quiz_correct ? "✅" : "❌"
    } (${entry.timestamp.slice(0, 10)})
    </li>`;
  });
  html += "</ul>";
  document.getElementById("historyBox").innerHTML = html;
  document.getElementById("historyBox").style.display = "block";
}

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 Initialize: Hook sliders + dropdowns + call renderScenario() on load
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  // 1) Hide result & history initially
  document.getElementById("resultBox").style.display = "none";
  document.getElementById("historyBox").style.display = "none";

  // 2) Bind sliders to updateLabels
  ["temp", "humidity", "light", "co2", "dli", "ec", "ph"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", updateLabels);
  });

  // 3) Default dropdown values
  document.getElementById("levelSelect").value = difficultyLevel;
  document.getElementById("scenarioType").value = "physiological";
  // 4) When difficulty changes, re-render
  document.getElementById("levelSelect").addEventListener("change", () => {
    difficultyLevel = parseInt(
      document.getElementById("levelSelect").value,
      10
    );
    correctStreak = 0;
    renderScenario();
  });

  // 5) When scenario type changes, re-render
  document.getElementById("scenarioType").addEventListener("change", () => {
    renderScenario();
  });

  // 6) Initial UI render
  updateLabels();
  renderScenario();
});

// ─── Update Crop Options Based on Difficulty Level ─────────────────
function updateCropOptions() {
    const difficultyLevel = parseInt(document.getElementById("levelSelect").value, 10);
    const cropSelect = document.getElementById("cropSelect");
    
    // Clear existing options
    cropSelect.innerHTML = '<option value="">All Crops</option>';
    
    // Get available crops for this difficulty level
    const availableCrops = [];
    
    // Check each crop's available levels
    if ([1, 2, 3].includes(difficultyLevel)) {
        availableCrops.push({name: "Lettuce", value: "lettuce"});
    }
    if ([1, 2, 3, 4].includes(difficultyLevel)) {
        availableCrops.push({name: "Tomato", value: "tomato"});
    }
    if ([2, 3, 4, 5, 6].includes(difficultyLevel)) {
        availableCrops.push({name: "Cannabis", value: "cannabis"});
    }
    if ([3, 4].includes(difficultyLevel)) {
        availableCrops.push({name: "Strawberries", value: "strawberries"});
    }
    
    // Add crop options to dropdown
    availableCrops.forEach(crop => {
        const option = document.createElement("option");
        option.value = crop.value;
        option.textContent = crop.name;
        cropSelect.appendChild(option);
    });
}

// Call updateCropOptions when difficulty changes
document.getElementById("levelSelect").addEventListener("change", () => {
    difficultyLevel = parseInt(
        document.getElementById("levelSelect").value,
        10
    );
    correctStreak = 0;
    updateCropOptions(); // Add this line
    renderScenario();
});

// Initialize crop options on page load
updateCropOptions();

// When crop selection changes, re-render
document.getElementById("cropSelect").addEventListener("change", () => {
    const selectedCrops = Array.from(document.getElementById("cropSelect").selectedOptions)
        .map(option => option.value)
        .filter(value => value !== "");
    
    console.log("Selected crops:", selectedCrops); // For testing
    renderScenario();
});

// Toggle crop selection dropdown
document.getElementById("cropToggle").addEventListener("click", () => {
  const container = document.getElementById("cropSelectContainer");
  const button = document.getElementById("cropToggle");
  
  if (container.style.display === "none") {
    container.style.display = "block";
    button.textContent = "🌱 Hide Crop Selection";
  } else {
    container.style.display = "none";
    button.textContent = "🌱 Select Specific Crops";
  }
});