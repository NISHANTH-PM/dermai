const { Mistral } = require("@mistralai/mistralai");

const DISEASE_RISK = {
  akiec: "Moderate",
  bcc:   "Moderate",
  bkl:   "Low",
  df:    "Low",
  mel:   "High",
  nv:    "Low",
  vasc:  "Low"
};

const SYSTEM_PROMPT = `You are DermAI, an expert medical AI assistant with deep knowledge in dermatology and skin lesion analysis.
You provide accurate, evidence-based medical information to help patients understand their skin conditions.

Your expertise includes:
- Detailed knowledge of skin diseases, their causes, symptoms, and progression
- Understanding of dermatological risk factors and warning signs
- Current clinical guidelines for skin condition management
- Ability to explain complex medical concepts in simple, compassionate language

Response guidelines:
- Start by clearly explaining what the diagnosed condition is
- Describe the typical appearance, causes, and risk factors
- Explain what the confidence score means in practical terms
- Give specific, actionable next steps based on the risk level
- Mention any warning signs the patient should watch for
- Be reassuring for low-risk findings, appropriately serious for high-risk ones (especially melanoma)
- Keep first response to 200-250 words — detailed but digestible
- Always end your FIRST response with: "⚕️ Important: Please consult a board-certified dermatologist for a definitive diagnosis and treatment plan."
- For follow-up questions, give accurate, detailed medical answers
- If asked about treatment options, medications, or procedures — provide factual information but remind them a doctor must prescribe
- Never downplay a high-risk finding like melanoma`;

async function getChatReply({ classCode, diseaseName, confidence, history }) {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    console.error("MISTRAL_API_KEY is missing from .env");
    throw new Error("MISTRAL_API_KEY is not set.");
  }

  const risk = DISEASE_RISK[classCode] || "Unknown";
  const client = new Mistral({ apiKey });

  const isFirstMessage = history.length === 1;

  // First message: inject full diagnosis context so Mistral gives accurate explanation
  const userMessage = isFirstMessage
    ? `A patient's skin lesion image was analyzed by an AI screening tool and detected:
       - Condition: ${diseaseName} (${classCode})
       - AI Confidence: ${confidence}%
       - Risk Level: ${risk}

       Please provide a thorough medical explanation of this condition for the patient.
       Include: what it is, what causes it, what it looks like, risk factors, and recommended next steps.`
    : history[history.length - 1].content;

  // Build full conversation for Mistral
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    // Include prior conversation turns for context
    ...history.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await client.chat.complete({
    model: "mistral-small-latest",   // free tier, strong medical knowledge
    messages,
    maxTokens: 500,
    temperature: 0.3,                // lower = more accurate, less creative
  });

  const raw = response.choices[0].message.content;
  return raw.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").trim();
  
}

module.exports = { getChatReply };