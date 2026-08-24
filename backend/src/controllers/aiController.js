import {
  chatWithAI,
  translateText,
  summarizeConversation,
  moderateContent,
} from "../services/aiService.js";

export const handleAIChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Vui lòng nhập prompt" });

    const reply = await chatWithAI(prompt);
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Lỗi handleAIChat:", error);
    return res.status(500).json({ message: "Lỗi xử lý AI" });
  }
};

export const handleAITranslate = async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text) return res.status(400).json({ message: "Vui lòng cung cấp văn bản cần dịch" });

    const translatedText = await translateText(text, targetLang);
    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error("Lỗi handleAITranslate:", error);
    return res.status(500).json({ message: "Lỗi xử lý dịch thuật AI" });
  }
};

export const handleAISummarize = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Vui lòng cung cấp danh sách tin nhắn" });
    }

    const summary = await summarizeConversation(messages);
    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Lỗi handleAISummarize:", error);
    return res.status(500).json({ message: "Lỗi tóm tắt hội thoại" });
  }
};

export const handleAIModerate = async (req, res) => {
  try {
    const { text } = req.body;
    const result = await moderateContent(text || "");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi handleAIModerate:", error);
    return res.status(500).json({ message: "Lỗi kiểm duyệt nội dung" });
  }
};
