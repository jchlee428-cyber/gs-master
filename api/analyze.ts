import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from "@google/genai";

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { title, text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Sermon text is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        suggestedTitle: {
          description: "사용자가 설교 제목을 입력하지 않았을 경우, 혹은 더 적합한 제목을 제안하기 위해 맥아더 스타일의 설교 제목 제안 (Suggested Sermon Title)",
          type: Type.STRING
        },
        summary: {
          description: "분석 대상 설교의 핵심 내용을 3문장 이내로 요약 (Sermon Summary)",
          type: Type.STRING
        },
        strengths: {
          description: "존 맥아더의 원칙에 부합하는 긍정적인 부분 목록 (Strengths)",
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        concerns: {
          description: "본문 이탈, 인본주의적 요소, 그리스도 부재 등 맥아더가 경계한 요소들 지적 (Theological Concerns/Critiques)",
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        evaluation: {
          description: "이 설교가 더 참된 '강해설교'가 되기 위해 보완해야 할 점 총평 (Overall Evaluation & Suggestions)",
          type: Type.STRING
        },
        macArthurIndex: {
          description: "맥아더의 강해설교 철학에 얼마나 일치하는지 수치화 (0~100) (MacArthur Index)",
          type: Type.INTEGER
        }
      },
      required: ["suggestedTitle", "summary", "strengths", "concerns", "evaluation", "macArthurIndex"]
    };

    const systemInstruction = `
너는 존 맥아더(John MacArthur)의 강해설교 신학(Expository Preaching)을 완벽하게 숙지한 전문 신학 분석가야.
사용자가 제공하는 설교 텍스트나 요약본을 존 맥아더의 '강해설교 마스터 클래스' 원칙에 따라 분석하고 엄격하게 평가하는 것이 네 임무야.

[분석 핵심 기준 (5가지 지표)]
1. 하나님의 권위 vs 설교자의 권위: 설교자가 본문을 정확히 풀어내어 하나님의 음성을 전달하는가, 자신의 생각/견해를 앞세우는가?
2. 본문의 원래 의미(Exegesis): 현대적 적용을 위해 본문을 왜곡하지 않는가? 역사적/문화적/언어적 맥락에 충실한가?
3. 그리스도 중심성: 설교의 결론이나 핵심 동력이 예수 그리스도와 그분의 사역으로 귀결되는가?
4. 성령의 사역과 적용: 인위적인 감정 자극이나 강제 적용을 피하고 말씀을 명확히 설명하여 성령께 적용을 맡기는가?
5. 설교자의 태도: 자신을 주인공으로 삼거나 개인적 예화를 남발하여 하나님의 영광을 가리지 않는가?

제공된 설교 내용을 심도있게 분석하고, 지정된 JSON 스키마 형식에 맞추어 한국어로 응답해줘.
    `;

    let response;
    let attempt = 0;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: text,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.2
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
            throw new Error("API 할당량을 초과했습니다. 잠시 후 오류가 지속되면 관리자에게 문의하세요.");
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

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response generated from Gemini.");
    }

    const parsedResult = JSON.parse(responseText);
    const finalTitle = title ? title.substring(0, 100) : (parsedResult.suggestedTitle || parsedResult.summary.substring(0, 50) + "...");
    const historyItem = {
      title: finalTitle,
      sermonText: text,
      result: parsedResult
    };

    res.status(200).json(historyItem);

  } catch (error: any) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
}
