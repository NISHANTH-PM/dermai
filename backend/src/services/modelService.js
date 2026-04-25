const path = require("path");
const fs = require("fs/promises");
const ort = require("onnxruntime-node");

let session = null;
let inputName = null;
let outputName = null;
let idToLabel = null;

async function loadLabelMap() {
  const labelMapPath = process.env.LABEL_MAP_PATH || "Output/label_map.json";
  const resolvedPath = path.resolve(process.cwd(), labelMapPath);

  try {
    const data = await fs.readFile(resolvedPath, "utf8");
    const labelMap = JSON.parse(data);
    idToLabel = labelMap.id_to_label;
  } catch (error) {
    console.warn("Failed to load label_map.json, using fallback mapping:", error.message);
    idToLabel = {
      "0": "akiec",
      "1": "bcc",
      "2": "bkl",
      "3": "df",
      "4": "mel",
      "5": "nv",
      "6": "vasc"
    };
  }
}

async function loadModel() {
  if (session) {
    return session;
  }

  const configuredPath = process.env.MODEL_PATH || "Output/model_ham10000.onnx";
  const modelPath = path.resolve(process.cwd(), configuredPath);

  await fs.access(modelPath);
  session = await ort.InferenceSession.create(modelPath);
  inputName = session.inputNames[0];
  outputName = session.outputNames[0];

  await loadLabelMap();

  return session;
}

function softmax(logits) {
  let maxLogit = Number.NEGATIVE_INFINITY;
  for (const value of logits) {
    if (value > maxLogit) {
      maxLogit = value;
    }
  }

  const exps = logits.map((value) => Math.exp(value - maxLogit));
  const sum = exps.reduce((acc, value) => acc + value, 0);
  return exps.map((value) => value / sum);
}

async function runInference(inputTensor) {
  if (!session || !inputName || !outputName) {
    throw new Error("Model session is not initialized.");
  }

  const feeds = {
    [inputName]: inputTensor
  };

  const results = await session.run(feeds);
  const outputTensor = results[outputName];

  if (!outputTensor || !outputTensor.data || outputTensor.data.length === 0) {
    throw new Error("Model returned an empty output.");
  }

  const logits = Array.from(outputTensor.data);
  const probabilities = softmax(logits);

  let predictedIndex = 0;
  let predictedProbability = probabilities[0];

  for (let i = 1; i < probabilities.length; i += 1) {
    if (probabilities[i] > predictedProbability) {
      predictedProbability = probabilities[i];
      predictedIndex = i;
    }
  }

  return {
    classIndex: predictedIndex,
    classCode: idToLabel ? idToLabel[predictedIndex.toString()] || "unknown" : "unknown",
    probability: predictedProbability
  };
}

module.exports = {
  loadModel,
  runInference
};
