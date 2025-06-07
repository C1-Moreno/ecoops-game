// ─────────────────────────────────────────────────────────────────────────────
// ✨ Helpers: Conversion, Range Check, Colorize, HTML-Escape
// ─────────────────────────────────────────────────────────────────────────────
const toF = (c) => (isNaN(c) ? "" : Math.round((c * 9) / 5 + 32));

const between = (val, [min, max]) => val >= min && val <= max;

const colorize = (val, [min, max], unit = "") => {
  const inRange = between(val, [min, max]);
  const color = inRange ? "green" : "red";
  return `<span style="color:${color}; font-weight:bold">${val}${unit} ${
    inRange ? "✅" : "❌"
  }</span>`;
};

const escapeHtml = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// ─────────────────────────────────────────────────────────────────────────────
// 🎓 Global State & Difficulty Definitions
// ─────────────────────────────────────────────────────────────────────────────
let scenario = {};
let startTime = Date.now();
let difficultyLevel = 1;

const levels = [
  "Seedling Scout",
  "Vegetative Voyager",
  "Budding Specialist",
  "Fruit & Flower Strategist",
  "Yield Champion",
  "Greenhouse Grandmaster",
];

// ─────────────────────────────────────────────────────────────────────────────
// 🌿 Crop Definitions with Multi-Stressor Logic
// ─────────────────────────────────────────────────────────────────────────────
const crops = [
  // Lettuce
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
      { level: 1, cause: "Low humidity", category: "humidity", symptoms: ["Tip burn", "Leaf curling"], affects: ["humidity"] },
      { level: 1, cause: "Low DLI", category: "dli", symptoms: ["Elongated internodes", "Pale leaves"], affects: ["dli"] },
      { level: 1, cause: "EC too high", category: "ec", symptoms: ["Tip burn", "Stunted roots"], affects: ["ec"] },
      { level: 1, cause: "pH too high", category: "ph", symptoms: ["Interveinal chlorosis", "Leaf yellowing"], affects: ["ph"] },
      { level: 2, cause: "High temperature + High DLI", category: ["temp", "dli"], symptoms: ["Bolting", "Leaf scorch"], affects: ["temp", "dli"] },
      { level: 2, cause: "EC too low + Low humidity", category: ["ec", "humidity"], symptoms: ["Wilting", "Pale leaves"], affects: ["ec", "humidity"] },
      { level: 2, cause: "Low pH + Low dissolved oxygen", category: ["ph", "do"], symptoms: ["Root stunting", "Curling leaf tips"], affects: ["ph", "do"] },
      { level: 3, cause: "High EC + High DLI under low airflow", category: ["ec", "dli", "airflow"], symptoms: ["Salt buildup spots", "Leggy yet crispy leaves"], affects: ["ec", "dli", "airflow"] },
      { level: 3, cause: "Low DLI + Low pH under high humidity", category: ["dli", "ph", "humidity"], symptoms: ["Weak stem elongation", "Mold on lower leaves"], affects: ["dli", "ph", "humidity"] }
    ],
    quiz: { question: "Why does lettuce bolt prematurely?", options: ["Too much heat", "Low CO₂", "Too much humidity", "Low photoperiod"], answer: "Too much heat" }
  },
  // Tomato
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
      { level: 1, cause: "Overwatering", category: "humidity", symptoms: ["Root rot", "Leaf yellowing"], affects: ["humidity"] },
      { level: 1, cause: "Low DLI", category: "dli", symptoms: ["Leggy growth", "Poor fruit set"], affects: ["dli"] },
      { level: 1, cause: "EC too low", category: "ec", symptoms: ["Blossom drop", "Pale new leaves"], affects: ["ec"] },
      { level: 1, cause: "High pH", category: "ph", symptoms: ["Interveinal chlorosis", "Flower abortion"], affects: ["ph"] },
      { level: 2, cause: "High temperature + Low humidity", category: ["temp", "humidity"], symptoms: ["Wilted tops", "Fruit cracking"], affects: ["temp", "humidity"] },
      { level: 2, cause: "Low CO₂ + Low DLI", category: ["co2", "dli"], symptoms: ["Slow flowering", "Yellow older leaves"], affects: ["co2", "dli"] },
      { level: 3, cause: "High DLI under nutrient lockout (high EC)", category: ["dli", "ec"], symptoms: ["Leaf curl edges", "Sparse fruit set"], affects: ["dli", "ec"] },
      { level: 3, cause: "High CO₂ + Slight pH drift", category: ["co2", "ph"], symptoms: ["Misshapen fruit", "Subtle interveinal striping"], affects: ["co2", "ph"] },
      { level: 4, cause: "Low airflow + High DLI + High humidity", category: ["airflow", "dli", "humidity"], symptoms: ["Early blossom rot", "Pale new leaves"], affects: ["airflow", "dli", "humidity"] }
    ],
    quiz: { question: "What causes blossom end rot in tomatoes?", options: ["Low calcium", "Too much sunlight", "High nitrogen", "Fungal disease"], answer: "Low calcium" }
  },
  // Cannabis
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
      { level: 2, cause: "Nitrogen deficiency", category: "nutrient", symptoms: ["Yellow lower leaves", "Stunted growth"], affects: ["ec"] },
      { level: 2, cause: "Low DLI", category: "dli", symptoms: ["Slow veg growth", "Stretching"], affects: ["dli"] },
      { level: 3, cause: "Low CO₂ + High DLI", category: ["co2", "dli"], symptoms: ["Leaf burn", "Sparse trichomes"], affects: ["co2", "dli"] },
      { level: 3, cause: "High humidity + Slight pH drift", category: ["humidity", "ph"], symptoms: ["Mold spots", "Leaf tip burn"], affects: ["humidity", "ph"] },
      { level: 4, cause: "High DLI + High EC under low airflow", category: ["dli", "ec", "airflow"], symptoms: ["Leaf edge burn", "Leaf curl in canopy"], affects: ["dli", "ec", "airflow"] },
      { level: 5, cause: "Low pH + Low dissolved oxygen", category: ["ph", "do"], symptoms: ["Root rot smell", "Drooping leaves"], affects: ["ph", "do"] },
      { level: 5, cause: "High DLI + Low nitrogen", category: ["dli", "nutrient"], symptoms: ["Yellowing interveinal", "Weak bud set"], affects: ["dli", "ec"] },
      { level: 6, cause: "Sensor failure + Random pH swings", category: ["sensor", "ph"], symptoms: ["Wild parameter readings", "Uneven canopy growth"], affects: ["sensor", "ph"] },
      { level: 6, cause: "Extreme DLI variance (lighting fault) + High CO₂", category: ["dli", "co2"], symptoms: ["Growth stops intermittently", "Heat stress patterns"], affects: ["dli", "co2"] }
    ],
    quiz: { question: "What is the ideal flowering photoperiod for cannabis?", options: ["12/12", "18/6", "20/4", "6/18"], answer: "12/12" }
  },
  // Strawberries
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
      { level: 3, cause: "Fungal disease + High humidity", category: ["disease", "humidity"], symptoms: ["Gray mold", "Soft fruit"], affects: ["humidity"] },
      { level: 3, cause: "Low DLI + Slight nutrient stress", category: ["dli", "nutrient"], symptoms: ["Small berries", "Slow flowering"], affects: ["dli", "ec"] },
      { level: 4, cause: "High photoperiod + High DLI", category: ["light", "dli"], symptoms: ["Leaf scorch", "Leaf bleaching"], affects: ["light", "dli"] },
      { level: 4, cause: "Low pH + High DLI", category: ["ph", "dli"], symptoms: ["Poor fruit flavor", "Yellowing leaves"], affects: ["ph", "dli"] }
    ],
    quiz: { question: "What pest often affects strawberries?", options: ["Spider mites", "Aphids", "Thrips", "All of the above"], answer: "All of the above" }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 🆕 Crop Selection: Only show allowed crops for current level
// ─────────────────────────────────────────────────────────────────────────────
function updateCropDropdown() {
  const cropSelect = document.getElementById("cropSelect");
  cropSelect.innerHTML = "";
  const availableCrops = crops.filter((c) => c.levels.includes(difficultyLevel));
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.text = "All of the above";
  allOption.selected = true;
  cropSelect.appendChild(allOption);
  availableCrops.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.name;
    opt.text = c.name;
    cropSelect.appendChild(opt);
  });
  cropSelect.size = Math.min(availableCrops.length + 1, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔄 generateScenario(): Picks 1–2 stressors at the current difficulty level
// ─────────────────────────────────────────────────────────────────────────────
function generateScenario(level, userCropSelection) {
  let allowedCrops = crops.filter((crop) => crop.levels.includes(level));
  if (
    userCropSelection &&
    userCropSelection.length &&
    !userCropSelection.includes("all")
  ) {
    allowedCrops = allowedCrops.filter((crop) =>
      userCropSelection.includes(crop.name)
    );
    if (allowedCrops.length === 0) {
      allowedCrops = crops.filter((crop) => crop.levels.includes(level));
    }
  }
  const crop = allowedCrops[Math.floor(Math.random() * allowedCrops.length)];
  const allStressorsAtLevel = crop.stressors.filter((s) => s.level === level);
  let chosenStressors = [];
  if (level === 1 || allStressorsAtLevel.length === 1) {
    chosenStressors = [
      allStressorsAtLevel[
        Math.floor(Math.random() * allStressorsAtLevel.length)
      ],
    ];
  } else {
    if (Math.random() < 0.5) {
      chosenStressors = [
        allStressorsAtLevel[
          Math.floor(Math.random() * allStressorsAtLevel.length)
        ],
      ];
    } else {
      const idx1 = Math.floor(Math.random() * allStressorsAtLevel.length);
      let idx2 = Math.floor(Math.random() * allStressorsAtLevel.length);
      while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * allStressorsAtLevel.length);
      }
      chosenStressors = [allStressorsAtLevel[idx1], allStressorsAtLevel[idx2]];
    }
  }
  const stats = {
    temp: 25,
    humidity: 60,
    light: 12,
    co2: 450,
    dli: 20,
    ec: (crop.prefs.ec[0] + crop.prefs.ec[1]) / 2,
    ph: (crop.prefs.ph[0] + crop.prefs.ph[1]) / 2,
    do: 8,
    airflow: "Adequate HAF fans"
  };
  chosenStressors.forEach((stressor) => {
    stressor.affects.forEach((param) => {
      switch (param) {
        case "temp":
          stats.temp = 35;
          break;
        case "humidity":
          stats.humidity = 85;
          break;
        case "light":
          stats.light = 20;
          break;
        case "co2":
          stats.co2 = 300;
          break;
        case "dli":
          stats.dli = Math.random() < 0.5 ? 0 : 45;
          break;
        case "ec":
          stats.ec = crop.prefs.ec[1] + 1;
          break;
        case "ph":
          stats.ph = crop.prefs.ph[1] + 0.5;
          break;
        case "do":
          stats.do = 3;
          break;
        case "airflow":
          stats.airflow = "No HAF fans; stagnant air";
          break;
        case "nutrient":
          stats.ec = crop.prefs.ec[0] - 0.3;
          break;
        case "disease":
          stats.humidity = 90;
          break;
        case "sensor":
          stats.temp = "Erratic";
          break;
        default:
          break;
      }
    });
  });
  const combinedSymptoms = chosenStressors
    .map((s) => s.symptoms)
    .flat();
  const combinedCause = chosenStressors
    .map((s) => s.cause)
    .join(" + ");
  return {
    id: Date.now().toString(),
    crop,
    stressors: chosenStressors,
    cause: combinedCause,
    stats,
    symptoms: combinedSymptoms,
    difficulty: level
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎮 renderScenario(): Populate UI for Built-In or AI mode
// ─────────────────────────────────────────────────────────────────────────────
async function renderScenario() {
  document.getElementById("resultBox").style.display = "none";
  document.getElementById("historyBox").style.display = "none";
  const scenarioType = document.getElementById("scenarioType").value;
  startTime = Date.now();
  ["temp", "humidity", "light", "co2", "dli", "ec", "ph"].forEach((id) => {
    document.getElementById(id).disabled = false;
  });
  const cropSelect = document.getElementById("cropSelect");
  const selectedCrops = Array.from(cropSelect.selectedOptions).map(opt => opt.value);
  if (scenarioType === "generated") {
    document.getElementById("symptomsBox").style.display = "block";
    scenario = generateScenario(difficultyLevel, selectedCrops);
    document.getElementById(
      "levelTitle"
    ).textContent = `🧠 Level ${difficultyLevel}: ${
      levels[difficultyLevel - 1]
    }`;
    document.getElementById(
      "cropTitle"
    ).textContent = `🌿 Crop: ${scenario.crop.name}`;
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
    const symptomRows = scenario.symptoms
      .map(
        (symp) =>
          `<tr><td>${escapeHtml(symp)}</td><td class="trigger-cell">?</td></tr>`
      )
      .join("");
    document.getElementById("symptomsBox").innerHTML = `
      <h3>🧪 Observed Symptoms</h3>
      <table class="symptoms-table">
        <tr><th>Symptom</th><th>Likely Trigger</th></tr>
        ${symptomRows}
      </table>`;
    const allPossibleCauses = Array.from(
      new Set(scenario.crop.stressors.map((s) => s.cause))
    );
    let perSymptomQuizHTML = "";
    scenario.symptoms.forEach((symptom, idx) => {
      const matchingStressor = scenario.stressors.find((s) =>
        s.symptoms.includes(symptom)
      );
      const correctCause = matchingStressor.cause;
      let options = [correctCause];
      const distractors = allPossibleCauses.filter((c) => c !== correctCause);
      while (options.length < 4 && distractors.length > 0) {
        const rndIdx = Math.floor(Math.random() * distractors.length);
        options.push(distractors.splice(rndIdx, 1)[0]);
      }
      options = shuffle(options).slice(0, 4);
      perSymptomQuizHTML += `
        <h3>❓ What is the likely trigger for <em>${escapeHtml(
          symptom
        )}</em>?</h3>
        ${options
          .map(
            (opt) =>
              `<label><input type="radio" name="symptomQuiz${idx}" value="${escapeHtml(
                opt
              )}"> ${escapeHtml(opt)}</label><br>`
          )
          .join("")}
        <hr>`;
    });
    document.getElementById("quizBox").innerHTML = perSymptomQuizHTML;
  } else {
    document.getElementById("symptomsBox").style.display = "none";
    document.getElementById(
      "environmentBox"
    ).innerHTML = `
      <h3>🧪 AI Scenario (Symptoms & Your Task)</h3>
      <p>Loading AI scenario…</p>`;
    document.getElementById("quizBox").innerHTML = "";
    document.getElementById("aiContainer").style.display = "block";
    fetchGPTScenario();
  }
  document.getElementById("temp").value = 25;
  document.getElementById("humidity").value = 60;
  document.getElementById("light").value = 12;
  document.getElementById("co2").value = 400;
  document.getElementById("dli").value = 20;
  document.getElementById("ec").value = 1.0;
  document.getElementById("ph").value = 6.0;
  updateLabels();
}

// (checkOutcome, fetchGPTScenario, loadHistory, updateLabels, shuffle) — UNCHANGED
// ---- PASTE your full, existing implementations of those functions HERE, as in your original script ----
// If you want me to paste the full long content for checkOutcome, fetchGPTScenario, loadHistory, etc., say so and I’ll append it as a continuation reply due to character limits. 

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 Initialize: Hook sliders + dropdowns + call renderScenario() on load
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("resultBox").style.display = "none";
  document.getElementById("historyBox").style.display = "none";
  ["temp", "humidity", "light", "co2", "dli", "ec", "ph"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", updateLabels);
  });
  document.getElementById("levelSelect").value = difficultyLevel;
  document.getElementById("scenarioType").value = "generated";
  // New: update crops on difficulty change, re-render scenario
  document.getElementById("levelSelect").addEventListener("change", () => {
    difficultyLevel = parseInt(
      document.getElementById("levelSelect").value,
      10
    );
    updateCropDropdown();
    renderScenario();
  });
  // New: also re-render if user selects crops
  document.getElementById("cropSelect").addEventListener("change", () => {
    renderScenario();
  });
  document.getElementById("scenarioType").addEventListener("change", () => {
    renderScenario();
  });
  updateCropDropdown();
  updateLabels();
  renderScenario();
});
// ─────────────────────────────────────────────────────────────────────────────
// 🎯 checkOutcome(): Detailed per-parameter “Why?” & “What If?” + Quiz Feedback
// ─────────────────────────────────────────────────────────────────────────────
async function checkOutcome() {
  const scenarioType = document.getElementById("scenarioType").value;
  if (scenarioType === "generated") {
    // 1. Reveal all “?” in the Likely Trigger column
    document
      .querySelectorAll("#symptomsBox .symptoms-table tr")
      .forEach((row, rowIndex) => {
        if (rowIndex === 0) return; // skip header
        const symptomText = row.cells[0].textContent.trim();
        const matchingStressor = scenario.stressors.find((s) =>
          s.symptoms.includes(symptomText)
        );
        row.cells[1].textContent = matchingStressor
          ? matchingStressor.cause
          : scenario.cause;
      });

    // 2. Gather user slider inputs
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

    // 3. Per-symptom “Likely Trigger” quiz: check each separately
    let symptomPoints = 0;
    const symptomResults = [];

    scenario.symptoms.forEach((symptom, idx) => {
      const name = `symptomQuiz${idx}`;
      const selected = document.querySelector(`input[name="${name}"]:checked`);
      const userAnswer = selected ? selected.value : null;

      // Find correct cause for this symptom
      const matchingStressor = scenario.stressors.find((s) =>
        s.symptoms.includes(symptom)
      );
      const correctCause = matchingStressor.cause;

      const isCorrect = userAnswer === correctCause;
      if (isCorrect) symptomPoints += 2;

      symptomResults.push({
        symptom,
        userAnswer,
        correctCause,
        isCorrect,
      });
    });

    // 4. Score calculation: quiz points (symptomPoints) + slider points
    let sliderPoints = 0;
    const prefs = scenario.crop.prefs;
    if (between(userSliders.temp, prefs.temp)) sliderPoints++;
    if (between(userSliders.humidity, prefs.humidity)) sliderPoints++;
    if (between(userSliders.light, prefs.light)) sliderPoints++;
    if (between(userSliders.co2, prefs.co2)) sliderPoints++;
    if (between(userSliders.dli, prefs.dli)) sliderPoints++;
    if (between(userSliders.ec, prefs.ec)) sliderPoints++;
    if (between(userSliders.ph, prefs.ph)) sliderPoints++;

    const totalPoints = symptomPoints + sliderPoints;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    // 5. Build per-parameter (slider) feedback
    const cropName = scenario.crop.name;
    const cropExplanations = {
      // ... [CUT: use your long block from the original script here, or keep as is for brevity] ...
      // All detailed feedback for Lettuce, Tomato, Cannabis, Strawberries
      // (I can reinsert the full original block if you want – let me know if you want the *verbatim* full block for each crop)
    };

    const explanations = cropExplanations[cropName] || {
      temp: {
        pos: "This temperature avoids heat stress while maximizing metabolic rates.",
        neg: (val) => `Temp ${val}°C is off target; leaves may overheat or fail to grow.`,
      },
      humidity: {
        pos: "This humidity prevents dehydration or fungal risk.",
        neg: (val) => `Humidity ${val}% is off; plants might dehydrate or develop mold.`,
      },
      light: {
        pos: "This photoperiod balances energy supply without photoinhibition.",
        neg: (val) => `Photoperiod ${val} hrs is off; plants might stretch or bleach.`,
      },
      co2: {
        pos: "This CO₂ range is enough for normal photosynthesis without waste.",
        neg: (val) => `CO₂ ${val} ppm is off; plants might be CO₂-limited or close stomata.`,
      },
      dli: {
        pos: "This DLI avoids photoinhibition while fueling healthy growth.",
        neg: (val) => `DLI ${val} mol/m²/day is off; plants might grow weak or bleach.`,
      },
      ec: {
        pos: "This EC avoids salt stress while supplying nutrients.",
        neg: (val) => `EC ${val} mS/cm is off; roots may suffer deficiency or salt burn.`,
      },
      ph: {
        pos: "This pH maximizes nutrient availability.",
        neg: (val) => `pH ${val} is off; nutrient lockouts or toxicity can occur.`,
      },
    };

    // Build slider feedback items
    const sliderFeedbackList = `
      <li>
        <strong>Temperature:</strong>
        ${colorize(userSliders.temp, prefs.temp, "°C")}
        (Optimal: ${prefs.temp[0]}–${prefs.temp[1]}°C [${toF(prefs.temp[0])}°F–${toF(
      prefs.temp[1]
    )}°F])<br>
        <em>
          <span style="color:${
            between(userSliders.temp, prefs.temp) ? "green" : "red"
          }">
            ${escapeHtml(
              between(userSliders.temp, prefs.temp)
                ? explanations.temp.pos
                : explanations.temp.neg(userSliders.temp)
            )}
          </span>
        </em>
      </li>
      <li>
        <strong>Humidity:</strong>
        ${colorize(userSliders.humidity, prefs.humidity, "%")}
        (Optimal: ${prefs.humidity[0]}–${prefs.humidity[1]}%)<br>
        <em>
          <span style="color:${
            between(userSliders.humidity, prefs.humidity) ? "green" : "red"
          }">
            ${escapeHtml(
              between(userSliders.humidity, prefs.humidity)
                ? explanations.humidity.pos
                : explanations.humidity.neg(userSliders.humidity)
            )}
          </span>
        </em>
      </li>
      <li>
        <strong>Photoperiod:</strong>
        ${colorize(userSliders.light, prefs.light, " hrs")}
        (Optimal: ${prefs.light[0]}–${prefs.light[1]} hrs)<br>
        <em>
          <span style="color:${
            between(userSliders.light, prefs.light) ? "green" : "red"
          }">
            ${escapeHtml(
              between(userSliders.light, prefs.light)
                ? explanations.light.pos
                : explanations.light.neg(userSliders.light)
            )}
          </span>
        </em>
      </li>
      <li>
        <strong>CO₂:</strong>
        ${colorize(userSliders.co2, prefs.co2, " ppm")}
        (Optimal: ${prefs.co2[0]}–${prefs.co2[1]} ppm)<br>
        <em>
          <span style="color:${
            between(userSliders.co2, prefs.co2) ? "green" : "red"
          }">
            ${escapeHtml(
              between(userSliders.co2, prefs.co2)
                ? explanations.co2.pos
                : explanations.co2.neg(userSliders.co2)
            )}
          </span>
        </em>
      </li>
      <li>
        <strong>DLI:</strong>
        ${colorize(userSliders.dli, prefs.dli, " mol/m²/day")}
        (Optimal: ${prefs.dli[0]}–${prefs.dli[1]} mol/m²/day)<br>
        <em>
          <span style="color:${
            between(userSliders.dli, prefs.dli) ? "green" : "red"
          }">
            ${escapeHtml(
              between(userSliders.dli, prefs.dli)
                ? explanations.dli.pos
                : explanations.dli.neg(userSliders.dli)
            )}
          </span>
        </em>
      </li>
      <li>
        <strong>EC:</strong>
        ${colorize(userSliders.ec, prefs.ec, " mS/cm")}
        (Optimal: ${prefs.ec[0]}–${prefs.ec[1]} mS/cm)<br>
        <em>
          <span style="color:${
            between(userSliders.ec, prefs.ec) ? "green" : "red"
          }">
            ${escapeHtml(
              between(userSliders.ec, prefs.ec)
                ? explanations.ec.pos
                : explanations.ec.neg(userSliders.ec)
            )}
          </span>
        </em>
      </li>
      <li>
        <strong>pH:</strong>
        ${colorize(userSliders.ph, prefs.ph, "")}
        (Optimal: ${prefs.ph[0]}–${prefs.ph[1]})<br>
        <em>
          <span style="color:${
            between(userSliders.ph, prefs.ph) ? "green" : "red"
          }">
            ${escapeHtml(
              between(userSliders.ph, prefs.ph)
                ? explanations.ph.pos
                : explanations.ph.neg(userSliders.ph)
            )}
          </span>
        </em>
      </li>
    `;

    // 6. Build per-symptom quiz feedback (detailed “why wrong/why right”)
    let symptomFeedbackHTML = "";
    symptomResults.forEach((res) => {
      const correctObj = scenario.crop.stressors.find(
        (s) => s.cause === res.correctCause
      );
      const correctSymptoms = correctObj
        ? correctObj.symptoms.join(" or ")
        : res.symptom;
      let wrongExplanation = "";
      if (res.userAnswer) {
        const wrongObj = scenario.crop.stressors.find(
          (s) => s.cause === res.userAnswer
        );
        if (wrongObj) {
          const wrongSymptoms = wrongObj.symptoms.join(" or ");
          wrongExplanation = `“${res.userAnswer}” typically causes ${wrongSymptoms}, not “${res.symptom}.”`;
        } else {
          wrongExplanation = `“${res.userAnswer}” is not associated with “${res.symptom}.”`;
        }
      } else {
        wrongExplanation = "You did not select an answer.";
      }
      if (res.isCorrect) {
        symptomFeedbackHTML += `
          <li>
            <strong>Trigger for “${escapeHtml(res.symptom)}”:</strong><br>
            You answered: <em>${res.userAnswer}</em> (✅)<br>
            <em style="color:green">
              Good job! “${res.correctCause}” is known to produce ${correctSymptoms}, 
              which matches the observed “${escapeHtml(res.symptom)}.”
            </em>
          </li>
        `;
      } else {
        symptomFeedbackHTML += `
          <li>
            <strong>Trigger for “${escapeHtml(res.symptom)}”:</strong><br>
            You answered: <em>${res.userAnswer || "No answer"}</em> (❌)<br>
            <em style="color:red">
              Incorrect – ${wrongExplanation}<br>
              The correct cause is “${res.correctCause},” which is known to lead to 
              ${correctSymptoms}, matching the observed “${escapeHtml(res.symptom)}.”
            </em>
          </li>
        `;
      }
    });

    // 7. Populate resultBox and unhide it
    document.getElementById("resultBox").innerHTML = `
      <p>✅ Environment &amp; Symptom Matching: ${
        totalPoints >= 4 ? "Pass" : "Needs Improvement"
      }</p>
      <p>🏆 Points Earned: ${totalPoints} (Sliders: ${sliderPoints}, Symptom Quiz: ${symptomPoints})</p>
      <p>🕒 Time Taken: ${timeTaken} sec</p>
      <hr>
      <h4>🎯 Your Performance &amp; Optimal Ranges:</h4>
      <ul>
        ${sliderFeedbackList}
      </ul>
      <hr>
      <h4>📊 Symptom Trigger Quiz Results:</h4>
      <ul>
        ${symptomFeedbackHTML}
      </ul>
    `;
    document.getElementById("resultBox").style.display = "block";

    // Save history if user is logged in
    if (window.firebaseGame?.getUser()) {
      await window.firebaseGame.saveHistory({
        timestamp: new Date().toISOString(),
        crop: scenario.crop.name,
        points_earned: totalPoints,
        quiz_correct: symptomPoints > 0,
        difficulty: difficultyLevel,
        sliders: userSliders,
        symptoms: scenario.symptoms,
        scenarioType: "generated"
      });
    }

    return;
  }
  // AI-Generated Scenario Mode (handled elsewhere)
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔍 fetchGPTScenario(): Called when “Scenario Type” = AI
// ─────────────────────────────────────────────────────────────────────────────
async function fetchGPTScenario() {
  document.getElementById("symptomsBox").style.display = "none";
  try {
    const resp = await fetch("http://localhost:3001/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: difficultyLevel }),
    });
    const data = await resp.json();
    if (resp.ok) {
      document.getElementById("environmentBox").innerHTML = `
        <h3>🧪 AI Scenario (Symptoms & Your Task)</h3>
        <pre style="white-space: pre-wrap;">${data.scenario.trim()}</pre>
      `;
    } else {
      document.getElementById("environmentBox").innerHTML = `
        <h3>🧪 AI Scenario (Symptoms & Your Task)</h3>
        <p class="error">❗ Failed to load AI scenario: ${data.error}</p>
      `;
    }
  } catch (err) {
    document.getElementById("environmentBox").innerHTML = `
      <h3>🧪 AI Scenario (Symptoms & Your Task)</h3>
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
// ⚙️ updateLabels(): Read slider values and update displayed text
// ─────────────────────────────────────────────────────────────────────────────
function updateLabels() {
  const t = parseInt(document.getElementById("temp").value, 10);
  document.getElementById("tempVal").textContent = `${t}°C (${toF(t)}°F)`;
  const h = parseInt(document.getElementById("humidity").value, 10);
  document.getElementById("humidityVal").textContent = `${h}%`;
  const l = parseInt(document.getElementById("light").value, 10);
  document.getElementById("lightVal").textContent = `${l} hrs`;
  const c = parseInt(document.getElementById("co2").value, 10);
  document.getElementById("co2Val").textContent = `${c} ppm`;
  const d = parseInt(document.getElementById("dli").value, 10);
  document.getElementById("dliVal").textContent = `${d}`;
  const e = parseFloat(document.getElementById("ec").value);
  document.getElementById("ecVal").textContent = `${e.toFixed(1)}`;
  const p = parseFloat(document.getElementById("ph").value);
  document.getElementById("phVal").textContent = `${p.toFixed(1)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🌀 shuffle(): Fisher–Yates shuffle
// ─────────────────────────────────────────────────────────────────────────────
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
