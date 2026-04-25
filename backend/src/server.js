
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs/promises");
const path = require("path");
const { loadModel, runInference } = require("./services/modelService");
const { imageBufferToTensor } = require("./services/preprocess");
const { getRiskAssessment } = require("./utils/risk");

dotenv.config({ path: require("path").resolve(__dirname, "../.env") });
const { getChatReply } = require("./services/chatService");
const app = express();
const port = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });
let classCodeById = {};

const FALLBACK_ID_TO_LABEL = {
  0: "akiec",
  1: "bcc",
  2: "bkl",
  3: "df",
  4: "mel",
  5: "nv",
  6: "vasc"
};

const DISEASE_NAMES = {
  akiec: "Actinic keratoses / Intraepithelial carcinoma",
  bcc: "Basal cell carcinoma",
  bkl: "Benign keratosis-like lesions",
  df: "Dermatofibroma",
  mel: "Melanoma",
  nv: "Melanocytic nevi",
  vasc: "Vascular lesions"
};

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dermai-frontend-gnd4.onrender.com"
  ]
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Image file is required." });
    }

    const inputTensor = await imageBufferToTensor(req.file.buffer);
    const prediction = await runInference(inputTensor);
    const classCode =
      classCodeById[prediction.classIndex] ||
      prediction.classCode ||
      FALLBACK_ID_TO_LABEL[prediction.classIndex] ||
      "unknown";
    const diseaseName = DISEASE_NAMES[classCode] || classCode;
    const confidence = Number((prediction.probability * 100).toFixed(2));
    const { risk, recommendation, based_on, riskReason } = getRiskAssessment(
      classCode,
      confidence
    );

    return res.json({
      disease: diseaseName,
      confidence,
      risk,
      recommendation,
      based_on,
      riskReason
    });
  } catch (error) {
    console.error("Prediction failed:", error);
    return res.status(500).json({
      error: "Failed to process image. Please try again."
    });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { classCode, diseaseName, confidence, history } = req.body;
    if (!classCode || !history || !Array.isArray(history)) {
      return res.status(400).json({ error: "classCode and history are required." });
    }
    const reply = await getChatReply({ classCode, diseaseName, confidence, history });
    return res.json({ reply });
  } catch (error) {
    console.error("Chat failed:", error);
    return res.status(500).json({ error: "Chat service unavailable." });
  }
});

async function loadLabelMap() {
  const configuredPath = process.env.LABEL_MAP_PATH || "../Output/label_map.json";
  const labelMapPath = path.resolve(process.cwd(), configuredPath);

  try {
    const raw = await fs.readFile(labelMapPath, "utf8");
    const parsed = JSON.parse(raw);
    classCodeById = parsed.id_to_label || {};
  } catch (error) {
    console.warn("Could not load label map, using fallback map:", error.message);
    classCodeById = FALLBACK_ID_TO_LABEL;
  }
}

async function startServer() {
  try {
    await loadLabelMap();
    await loadModel();
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
