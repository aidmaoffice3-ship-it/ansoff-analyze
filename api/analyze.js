export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userContent } = req.body;
  if (!userContent) return res.status(400).json({ error: "userContent is required" });

  const SYSTEM = `あなたは優秀な経営戦略コンサルタントです。ユーザーが提供する企業情報（企業名またはURL・サイトテキスト）をもとに、その企業のビジネス・事業内容・市場を分析し、アンゾフの成長戦略マトリクスに基づいた詳細な戦略分析を行ってください。

以下のJSON形式のみで出力してください。マークダウン記号や余計なテキストは一切含めないこと:
{"companyName":"企業の正式名称","companyOverview":"企業概要100文字以内","industry":"業界","marketPenetration":{"title":"市場浸透戦略","subtitle":"既存市場 × 既存製品","strategies":[{"title":"戦略タイトル","description":"施策説明60文字程度","priority":"高"}],"keyMetric":"重要KPI例","risk":"低"},"marketDevelopment":{"title":"市場開発戦略","subtitle":"新規市場 × 既存製品","strategies":[{"title":"戦略タイトル","description":"施策説明60文字程度","priority":"中"}],"keyMetric":"重要KPI例","risk":"中"},"productDevelopment":{"title":"製品開発戦略","subtitle":"既存市場 × 新規製品","strategies":[{"title":"戦略タイトル","description":"施策説明60文字程度","priority":"中"}],"keyMetric":"重要KPI例","risk":"中"},"diversification":{"title":"多角化戦略","subtitle":"新規市場 × 新規製品","strategies":[{"title":"戦略タイトル","description":"施策説明60文字程度","priority":"低"}],"keyMetric":"重要KPI例","risk":"高"},"overallRecommendation":"総合戦略提言150文字以内"}
各象限のstrategiesは必ず3〜4件含めること。実態に即した具体的な分析をすること。`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5000,
        system: SYSTEM,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const raw = (data.content?.find((b) => b.type === "text")?.text || "")
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
