const HIGH_CONCERN_CLASSES = new Set(["mel", "akiec", "bcc"]);
const MODERATE_CONCERN_CLASSES = new Set(["bkl"]);
const LOW_CONCERN_CLASSES = new Set(["nv", "df", "vasc"]);

function getRiskAssessment(classCode, confidencePercent) {
  if (HIGH_CONCERN_CLASSES.has(classCode)) {
    return {
      risk: "High Risk",
      recommendation: "Consult a specialist immediately",
      based_on: "disease_class",
      riskReason:
        "Predicted class (melanoma, actinic lesion, or BCC) maps to higher-priority triage in this demo."
    };
  }

  if (MODERATE_CONCERN_CLASSES.has(classCode)) {
    return {
      risk: "Moderate Risk",
      recommendation: "Monitor and consider medical advice",
      based_on: "disease_class",
      riskReason:
        "Predicted class (benign keratosis-like) is flagged for monitoring and optional clinical review."
    };
  }

  if (LOW_CONCERN_CLASSES.has(classCode)) {
    return {
      risk: "Low Risk",
      recommendation: "Low concern, regular observation suggested",
      based_on: "disease_class",
      riskReason:
        "Predicted class (nevus, dermatofibroma, or vascular) maps to lower-priority triage in this demo."
    };
  }

  if (confidencePercent >= 80) {
    return {
      risk: "Moderate Risk",
      recommendation: "Monitor and consider medical advice",
      based_on: "confidence_fallback",
      riskReason:
        "Unmapped predicted class; high model confidence (≥80%) triggers moderate triage as a safety fallback."
    };
  }

  return {
    risk: "Low Risk",
    recommendation: "Low concern, regular observation suggested",
    based_on: "confidence_fallback",
    riskReason:
      "Unmapped predicted class; lower confidence suggests lower urgency for this demo triage."
  };
}

module.exports = {
  getRiskAssessment
};
