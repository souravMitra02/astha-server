const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const askAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "বার্তা দেওয়া আবশ্যক",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: message,
    });

    return res.status(200).json({
      success: true,
      reply: response.text,
    });
  } catch (error) {
    console.error("AI error:", error);

    return res.status(500).json({
      success: false,
      message: "AI response আনতে সমস্যা হয়েছে",
    });
  }
};

module.exports = {
  askAI,
};