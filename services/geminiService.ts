
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client following coding guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeIncident = async (title: string, description: string, area: string): Promise<string> => {
  try {
    const prompt = `
      Bạn là một chuyên gia bảo trì hệ thống khách sạn và khu du lịch chuyên nghiệp.
      Hãy phân tích sự cố sau đây và đưa ra gợi ý xử lý ngắn gọn (dưới 100 từ) và ước lượng thời gian sửa chữa.

      Sự cố: ${title}
      Mô tả: ${description}
      Khu vực: ${area}

      Định dạng trả về:
      - **Chẩn đoán:** [Nguyên nhân có thể]
      - **Giải pháp:** [Các bước xử lý]
      - **Thời gian:** [Ước lượng]
      - **Cần thiết bị:** [Dụng cụ/Vật tư dự kiến]
    `;

    // Use gemini-3-flash-preview for summarization and reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Không thể phân tích sự cố lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi kết nối AI. Vui lòng thử lại sau.";
  }
};
