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
// 🔄 generateScenario(): Picks 1–2 stressors at the current difficulty level
// ─────────────────────────────────────────────────────────────────────────────
function generateScenario(level) {
  const levelCrops = crops.filter((crop) => crop.levels.includes(level));
  const crop = levelCrops[Math.floor(Math.random() * levelCrops.length)];

  // All stressors at this level
  const allStressorsAtLevel = crop.stressors.filter((s) => s.level === level);

  // Choose either one or two stressors (randomly)
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

  // Start with perfect environment
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

  // Distort stats according to chosen stressors
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

  // Combine all symptoms into a single array
  const combinedSymptoms = chosenStressors
    .map((s) => s.symptoms)
    .flat();

  // Combine causes (joined by “ + ” if multiple)
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
    difficulty: level,
  };
}

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

  if (scenarioType === "generated") {
    // ── Built-in Scenario Mode ──

    // Make sure the Symptoms panel is visible
    document.getElementById("symptomsBox").style.display = "block";

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

    // 4) Build Separate “Likely Trigger” Quiz for each symptom
    const allPossibleCauses = Array.from(
      new Set(scenario.crop.stressors.map((s) => s.cause))
    );

    let perSymptomQuizHTML = "";
    scenario.symptoms.forEach((symptom, idx) => {
      // Find the stressor object that contains this symptom
      const matchingStressor = scenario.stressors.find((s) =>
        s.symptoms.includes(symptom)
      );
      const correctCause = matchingStressor.cause;

      // Build a set of options: correct cause + random distractors
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
    // ── AI-Generated Scenario Mode ──

    // Hide the “Observed Symptoms” panel entirely
    document.getElementById("symptomsBox").style.display = "none";

    // Show loading text in Environment panel
    document.getElementById(
      "environmentBox"
    ).innerHTML = `
      <h3>🧪 AI Scenario (Symptoms & Your Task)</h3>
      <p>Loading AI scenario…</p>`;

    // Clear quizBox (no built-in quiz in AI mode)
    document.getElementById("quizBox").innerHTML = "";

    // Show the AI recommendation textarea
    document.getElementById("aiContainer").style.display = "block";

    // Fetch AI scenario
    fetchGPTScenario();
  }

  // 5) Reset sliders to default on every render
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
  if (scenarioType === "generated") {
    // ─── 1) Reveal all “?” in the Likely Trigger column ───
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

    // 2) Gather user slider inputs
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

    // 3) Per-symptom “Likely Trigger” quiz: check each separately
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

    // 4) Score calculation: quiz points (symptomPoints) + slider points
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

    // 5) Build per-parameter (slider) feedback
    const cropName = scenario.crop.name;
    const cropExplanations = {
      Lettuce: {
        temp: {
          pos:
            "Lettuce prefers 16–22 °C because cooler temperatures promote compact leaf growth and prevent premature bolting.",
          neg: (val) =>
            val < 16
              ? "Below 16 °C, lettuce metabolism slows; growth becomes spindly and heads remain small."
              : "Above 22 °C, lettuce is likely to bolt, taste bitter, and develop tip burn. If heat persists, harvest window is missed.",
        },
        humidity: {
          pos:
            "Maintaining 50–70 % RH prevents excessive VPD stress, keeping leaves turgid without encouraging fungal growth.",
          neg: (val) =>
            val < 50
              ? "Below 50 % RH, VPD is high and plants lose water faster than they can uptake it. Sustained low RH leads to wilting."
              : "Above 70 % RH, fungal issues (e.g., Botrytis) become likely. Persistent humidity causes wet bottom and mold on the head.",
        },
        light: {
          pos:
            "8–12 hrs light (DLI ~12–18 mol/m²/day) supplies enough energy without photoinhibition or legginess.",
          neg: (val) =>
            val < 8
              ? "Less than 8 hrs (DLI <12) yields elongated, weak leaves and slow head formation. Heads end up under-sized."
              : "More than 12 hrs (DLI >18) can cause photoinhibition or heat stress. Sustained high DLI leads to crispy leaf margins.",
        },
        co2: {
          pos:
            "350–450 ppm CO₂ supports normal photosynthesis for leafy greens without excessive stretch.",
          neg: (val) =>
            val < 350
              ? "Below 350 ppm, photosynthesis is CO₂-limited, reducing biomass. Heads never fully develop."
              : "Above 450 ppm yields minimal benefit; too much CO₂ can upset stomatal function. Shelf life drops over time.",
        },
        dli: {
          pos:
            "12–18 mol/m²/day prevents legginess while providing sufficient energy for crisp head formation.",
          neg: (val) =>
            val < 12
              ? "If DLI < 12, leaves become weak and pale, slowing head fill. Extended low DLI → underdeveloped, floppy lettuce."
              : "If DLI > 18, risk of photoinhibition; leaves appear bleached and stunted. Continued excess light halts growth.",
        },
        ec: {
          pos:
            "0.5–0.8 mS/cm avoids salt stress while supplying adequate nutrients for leafy growth.",
          neg: (val) =>
            val < 0.5
              ? "Below 0.5 mS/cm, nutrient deficiency (especially N) clamps growth. Heads are small and pale."
              : "Above 0.8 mS/cm, salt stress damages roots, causing tip burn. Persistent high EC → brown root tips and leaf burn.",
        },
        ph: {
          pos:
            "pH 5.5–6.2 maximizes micronutrient availability (Fe, Mn, Zn) for bright green leaves.",
          neg: (val) =>
            val < 5.5
              ? "Below 5.5, Ca & Mg uptake is inhibited, causing internal tip burn, root damage over time."
              : "Above 6.2, Fe and other micronutrients precipitate, leading to interveinal chlorosis. Extended high pH → stunted growth.",
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
              ? "Under 12 hrs (DLI <20), fruit set is delayed and plants become leggy. Continued low light → fewer, small tomatoes."
              : "Over 18 hrs (DLI >30), leaves may photoinhibit or burn if other parameters (temp, airflow) aren’t optimized. Prolonged high DLI stalls fruit fill.",
        },
        co2: {
          pos:
            "400–500 ppm CO₂ supports high photosynthetic flux needed for heavy fruit production.",
          neg: (val) =>
            val < 400
              ? "Below 400 ppm, photosynthesis is CO₂-limited and yield drops. If maintained low, fruits are pale and low-sugar."
              : "Above 500 ppm yields diminishing returns; stomata may close, risking tip burn. Sustained high CO₂ → uneven ripening.",
        },
        dli: {
          pos:
            "20–30 mol/m²/day encourages robust fruit set while avoiding leaf scorch.",
          neg: (val) =>
            val < 20
              ? "Under 20 mol, flowering is weak and fruit set is poor. Over time, harvest is delayed and yields drop significantly."
              : "Above 30 mol, risk of leaf scorch under high irradiance. Prolonged excess leads to leaf burn and slowed fruit expansion.",
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

    // 6) Build per-symptom quiz feedback (detailed “why wrong/why right”)
    let symptomFeedbackHTML = "";
    symptomResults.forEach((res) => {
      // Get the correct stressor’s symptoms
      const correctObj = scenario.crop.stressors.find(
        (s) => s.cause === res.correctCause
      );
      const correctSymptoms = correctObj
        ? correctObj.symptoms.join(" or ")
        : res.symptom;

      // Build a “why wrong” line if answer is incorrect
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

    // 7) Populate resultBox and unhide it
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
    return;
  }

  // ── AI-Generated Scenario Mode ──
  // (No built-in quiz here; the AI recommendation and feedback flow runs separately.)
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔍 fetchGPTScenario(): Called when “Scenario Type” = AI
// ─────────────────────────────────────────────────────────────────────────────
async function fetchGPTScenario() {
  // Hide “Observed Symptoms” in AI mode
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
// 🚀 Initialize: Hook sliders + dropdowns + call renderScenario() on load
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  // Hide result & history initially
  document.getElementById("resultBox").style.display = "none";
  document.getElementById("historyBox").style.display = "none";

  // Bind sliders to updateLabels
  ["temp", "humidity", "light", "co2", "dli", "ec", "ph"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", updateLabels);
  });

  // Default dropdown values
  document.getElementById("levelSelect").value = difficultyLevel;
  document.getElementById("scenarioType").value = "generated";

  // When difficulty changes, re-render
  document.getElementById("levelSelect").addEventListener("change", () => {
    difficultyLevel = parseInt(
      document.getElementById("levelSelect").value,
      10
    );
    renderScenario();
  });

  // When scenario type changes, re-render
  document.getElementById("scenarioType").addEventListener("change", () => {
    renderScenario();
  });

  // Initial UI render
  updateLabels();
  renderScenario();
});

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
// 🌀 shuffle(): Fisher–Yates shuffle
// ─────────────────────────────────────────────────────────────────────────────
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
