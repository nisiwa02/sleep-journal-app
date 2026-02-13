import { VertexAI } from '@google-cloud/vertexai';

const projectId = process.env.GCP_PROJECT_ID!;
const location = process.env.GCP_REGION || 'asia-northeast1';
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const vertexAI = new VertexAI({ project: projectId, location });
const model = vertexAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
    topP: 0.95,
    responseMimeType: 'application/json',
  },
});

const SYSTEM_PROMPT = `あなたは就寝前ジャーナリングの傾聴的アシスタントです。以下の形式でJSONを返してください：

{
  "summary": "内容の短い要約（1-2文）",
  "empathic_feedback": "共感的・傾聴的なフィードバック（2-3文、優しく具体的に）",
  "tags": ["関連タグ1", "関連タグ2"],
  "risk_score": 0.5,
  "next_actions": ["具体的アクション1", "具体的アクション2"],
  "safety_note": null
}

risk_score評価基準:
0.0-0.2=良好, 0.3-0.4=軽度ストレス, 0.5-0.6=中程度, 0.7-0.8=高ストレス・落ち込み, 0.9-1.0=深刻

フィードバック方針:
- stress高い（5以上）→より共感的に
- mood低い（2以下）→具体的な対処法を提案

制約: 医療診断禁止。危機時のみsafety_noteに相談窓口案内。通常はnull。`;

interface GeminiResponse {
  summary: string;
  empathic_feedback: string;
  tags: string[];
  risk_score: number;
  next_actions: string[];
  safety_note: string | null;
}

export async function generateFeedback(
  journalText: string,
  language: string = 'ja',
  mood?: number,
  stress?: number
): Promise<GeminiResponse> {
  let contextInfo = '';
  if (mood !== undefined) {
    contextInfo += `\n気分レベル: ${mood}/5（1=とても悪い、5=とても良い）`;
  }
  if (stress !== undefined) {
    contextInfo += `\nストレスレベル: ${stress}/7（1=とても低い、7=とても高い）`;
  }

  const userPrompt = `以下のジャーナル内容に対してフィードバックを返してください。言語: ${language}${contextInfo}\n\nジャーナル:\n${journalText}`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            { text: userPrompt }
          ]
        }
      ],
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response text from Gemini');
    }

    // With responseSchema, Gemini returns valid JSON matching the schema
    const parsedResponse: GeminiResponse = JSON.parse(text.trim());

    return parsedResponse;
  } catch (error) {
    console.error('Gemini API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      projectId,
      location,
      model: modelName
    });
    throw error;
  }
}
