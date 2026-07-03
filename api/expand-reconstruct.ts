import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { title, reconstructedSermon } = req.body;
    if (!reconstructedSermon) {
      return res.status(400).json({ error: "Reconstructed sermon text is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const systemInstruction = `
너는 존 맥아더(John MacArthur)의 강해설교 신학(Expository Preaching)을 철저히 따르는 수석 목사야.
제공된 '재구성된 강해설교문'을 바탕으로, 다음의 추가 요청사항을 반영하여 설교문을 다시 작성해줘.

[추가 요청사항]
"강해설교의 본문의 권위를 높여주고, 또는 집중력을 위한 예화를 넣어서 30분 정도의 길이로 작성해달라"

[작성 조건]
1. 존 맥아더 스타일을 유지하되, 성경 본문 자체의 권위를 드러내는 데 효과적인 예화를 적절히 추가할 것. (개인적인 신변잡기적 예화는 금물, 성경적 권위를 뒷받침하는 역사적 예화나 객관적인 비유 활용)
2. 분량을 30분 설교 길이에 맞게 내용을 더 깊이 있고 풍성하게 확장할 것 (각 대지에 대한 설명, 성경 상호 참조, 적용점 등을 충분히 전개).
3. 결론과 핵심은 오직 예수 그리스도를 향하도록 할 것.
`;

    const prompt = `
[원설교 제목]: ${title || '제목 없음'}

[재구성된 20분 분량 강해설교문]:
${reconstructedSermon}

위 설교문을 바탕으로, 본문의 권위를 높이고 집중력을 위한 예화를 포함하여 30분 분량으로 풍성하게 확장 작성해줘.
`;

    let response;
    let attempt = 0;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.3
          },
        });
        break;
      } catch (err: any) {
        attempt++;
        console.error(`Gemini API Error (Attempt ${attempt}):`, err.message || err);
        
        const errString = String(err.message || err).toLowerCase();
        const isRetryable = err.status === 503 || err.status === 429 || err.code === 503 || err.code === 429 ||
                            errString.includes("503") || errString.includes("429") ||
                            errString.includes("high demand") || errString.includes("quota") ||
                            errString.includes("unavailable");
        
        if (attempt >= maxRetries || !isRetryable) {
          if (errString.includes("503") || errString.includes("high demand") || errString.includes("unavailable")) {
            throw new Error("구글 AI(Gemini) 서버에 일시적으로 트래픽이 몰려 지연되고 있습니다. 1~2분 뒤에 다시 시도해주세요.");
          } else if (errString.includes("429") || errString.includes("quota")) {
            throw new Error("API 할당량을 초과했습니다. 잠시 후 에러 현상이 계속되면 관리자에게 문의하세요.");
          }
          throw err;
        }
        
        const waitTime = (Math.pow(2, attempt) * 1000) + (Math.random() * 500);
        console.log(`Waiting ${Math.round(waitTime)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!response) {
      throw new Error("Failed to generate content from Gemini after retries.");
    }

    res.status(200).json({ sermon: response.text });

  } catch (error: any) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
}
