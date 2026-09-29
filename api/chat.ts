import { getAiClient } from './_lib/ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, profile, skills, tools, history } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const aiClient = getAiClient();

  if (aiClient) {
    try {
      const systemInstruction = `You are ReturnPath's Senior Career Companion and Executive Re-entry Coach for professionals returning from career breaks (family caregiving, parenting sabbatical, illness, relocation, or burnout recovery).

Candidate Profile Context:
- Target Career Role: "${profile?.targetRole || 'Financial & Business Data Analyst'}"
- Candidate Full Name: "${profile?.fullName || 'Sarah Jenkins'}"
- Career Break / Gap Reason: "${profile?.careerGapReason || 'Family caregiving sabbatical'}"
- Known Skills: ${Array.isArray(skills) && skills.length > 0 ? skills.map((s: any) => `${s.name} (Level ${s.level}/5)`).join(', ') : 'SQL, Excel modeling, Variance reporting, Power BI, Python Pandas, SAP HANA Cloud'}
- Known Tools & Platforms: ${Array.isArray(tools) && tools.length > 0 ? tools.map((t: any) => t.name).join(', ') : 'SAP HANA Cloud, Power BI, Excel, SQL, Python'}

Coaching & Response Guidelines:
1. Be directly responsive, thoughtful, and insightful. NEVER give generic canned boilerplate or repetitive responses.
2. If the user introduces themselves or their career break, acknowledge their past experience with high respect, reframe their break as an asset, and propose a concrete 3-step action plan to validate their readiness.
3. If the user asks for advice on explaining their gap in interviews, provide exact STAR phrasing (Situation, Task, Action, Result) with strong confidence.
4. If they ask about learning or upskilling, recommend high-value modern bridge milestones (such as SAP HANA Cloud in-memory modeling, Python Pandas reconciliation, and Power BI executive dashboards).
5. Always maintain a warm, empowering, executive consultant tone. Format with clear bullet points and bold highlights for readability.`;

      // Build conversation contents with history if present
      let contents: any = message;
      if (Array.isArray(history) && history.length > 0) {
        const turns = history
          .filter((h: any) => h.text && typeof h.text === 'string' && (h.sender === 'user' || h.sender === 'companion'))
          .slice(-8) // Take last 8 turns for tight context
          .map((h: any) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          }));

        turns.push({
          role: 'user',
          parts: [{ text: message }],
        });
        contents = turns;
      }

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || '';
      if (reply) {
        return res.status(200).json({
          reply,
          source: 'gemini-2.5-flash',
        });
      }
    } catch (err: any) {
      console.warn('Gemini API call warning in chat:', err?.message || err);
    }
  }

  return res.status(200).json({
    reply: null,
    source: 'offline-fallback',
  });
}
