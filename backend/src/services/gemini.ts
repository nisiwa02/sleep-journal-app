import { VertexAI } from '@google-cloud/vertexai';

const projectId = process.env.GCP_PROJECT_ID!;
const location = process.env.GCP_REGION || 'asia-northeast1';
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const vertexAI = new VertexAI({ project: projectId, location });
const model = vertexAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1024,
    topP: 0.95,
  },
});

const SYSTEM_PROMPT = `あなたは睡眠ジャーナリングの傾聴的アシスタントです。
ユーザーの就寝前のジャーナル（日記）を受け取り、以下のJSON形式でフィードバックを返してください。

重要: 必ず有効なJSONのみを返してください。説明文やマークダウンは含めないでください。
文字列内の改行は\\nでエスケープし、引用符は\\\"でエスケープしてください。

必須キー:
- summary: 内容の短い要約（1-2文）
- empathic_feedback: 共感的・傾聴的なフィードバック（2-3文、優しく具体的に）
- tags: 内容に関連するタグ配列（例: ["ストレス", "仕事", "睡眠不足"]）
- risk_score: メンタルヘルスリスクスコア（0.0〜1.0。下記ルーブリックに基づいて計算）
- next_actions: 提案する次のアクション配列（1-3個、具体的で実行可能）
- safety_note: 自傷他害や危機的内容を検知した場合のみ記入。それ以外はnull。

メンタルヘルスリスクスコア ルーブリック:
- 0.0-0.2: ポジティブな内容、充実感、問題なし
- 0.3-0.4: 軽度のストレスや疲労、一時的な落ち込み
- 0.5-0.6: 中程度のストレス、継続的な不安や睡眠問題
- 0.7-0.8: 高いストレスレベル、著しい気分の落ち込み、日常生活への影響
- 0.9-1.0: 深刻な状態、自傷他害の可能性、緊急対応が必要

フィードバック方針:
- stress（1-7）が高い（5以上）場合: より共感的で寄り添うフィードバックを重視
- mood（1-5）が低い（2以下）場合: 積極的介入として具体的な対処法や行動を提案

重要な制約:
1. 医療的診断や治療指示は絶対に行わない
2. 自傷他害の懸念がある場合、safety_noteに「緊急時は地域の相談窓口や緊急連絡先へご連絡ください」等の一般的案内を入れる
3. フィードバックは短く、共感と次の一歩を示す
4. 必ず有効なJSONのみを返す（マークダウンや説明文は不要）`;

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

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();

    // Remove markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Try to extract JSON object if there's extra text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const parsedResponse: GeminiResponse = JSON.parse(jsonText);

    // Validate required fields
    if (!parsedResponse.summary || !parsedResponse.empathic_feedback ||
        !Array.isArray(parsedResponse.tags) ||
        typeof parsedResponse.risk_score !== 'number' ||
        !Array.isArray(parsedResponse.next_actions)) {
      throw new Error('Response missing required fields');
    }

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
