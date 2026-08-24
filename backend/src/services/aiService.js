import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

export const chatWithAI = async (prompt) => {
  try {
    const genAI = getGeminiClient();
    if (!genAI) {
      return `[Kyeto AI]: Xin chào! Tôi là Trợ lý AI Kyeto. (API key hiện chưa được cấu hình, đây là phản hồi mẫu cho: "${prompt}")`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Lỗi AI Service (chat):", error.message);
    return "Rất tiếc, Trợ lý AI đang gặp sự cố kết nối. Vui lòng thử lại sau!";
  }
};

export const translateText = async (text, targetLang = "Vietnamese") => {
  try {
    const genAI = getGeminiClient();
    if (!genAI) {
      return `[Dịch sang ${targetLang}]: ${text}`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Translate the following text accurately into ${targetLang}. Return ONLY the translated text without extra comments:\n\n"${text}"`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Lỗi AI Service (translate):", error.message);
    return text;
  }
};

export const summarizeConversation = async (messages = []) => {
  try {
    const genAI = getGeminiClient();
    const formatted = messages.map((m) => `${m.senderName}: ${m.content}`).join("\n");

    if (!genAI) {
      return `Tóm tắt nhanh (${messages.length} tin nhắn): Cuộc trò chuyện xoay quanh trao đổi công việc và thảo luận kế hoạch nhóm Kyeto Chat.`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Hãy tóm tắt cuộc trò chuyện sau đây thành 3-4 ý chính bằng tiếng Việt một cách ngắn gọn, súc tích:\n\n${formatted}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Lỗi AI Service (summarize):", error.message);
    return "Không thể tạo tóm tắt vào lúc này.";
  }
};

export const moderateContent = async (text) => {
  try {
    const TOXIC_WORDS = ["thô tục", "scam", "chửi", "lừa đảo"];
    const isFlagged = TOXIC_WORDS.some((word) => text.toLowerCase().includes(word));
    return { isFlagged, reason: isFlagged ? "Chứa từ ngữ vi phạm quy chuẩn cộng đồng" : null };
  } catch (error) {
    return { isFlagged: false };
  }
};
