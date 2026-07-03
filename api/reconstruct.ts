import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { title, text, summary } = req.body;
    if (!text && !summary) {
      return res.status(400).json({ error: "Sermon text or summary is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const systemInstruction = `
너는 존 맥아더(John MacArthur)의 강해설교 신학(Expository Preaching)을 철저히 따르는 수석 목사야.
사용자가 이전에 입력한 설교의 본문과 주제를 기반으로, 존 맥아더라면 이 본문(또는 주제)을 어떻게 설교했을지 20분 분량의 강해설교문으로 작성해줘.

[작성 조건]
1. 설교 제목과 핵심 주제는 사용자가 제공한 내용(또는 요약)을 그대로 활용하여 존 맥아더 스타일로 약간 패러프레이징할 것.
2. 철저한 본문 중심(Exegesis): 역사적, 문화적, 언어적 맥락에 충실하게 본문을 설명할 것.
3. 그리스도 중심성: 결론이나 핵심 동력이 예수 그리스도와 그분의 사역으로 귀결되게 할 것.
4. 성경을 성경으로 해석(상호 참조)하는 방식을 적극적으로 활용할 것.
5. 인간적인 감정 자극이나 강제 적용, 개인적 예화를 지양하고 말씀을 명확히 선포할 것.
6. 전체 설교문은 서론, 본론(대지 2~3개), 결론의 명확한 구조를 갖출 것.
`;

    const prompt = `
[원설교 제목]: ${title || '제목 없음'}
[원설교 텍스트/요약]: ${text || summary || '내용 없음'}

위 내용을 바탕으로 존 맥아더 관점의 20분 분량 강해설교문을 작성해줘.
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
