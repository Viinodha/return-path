import { getAiClient } from './_lib/ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, profile, skills, tools } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const aiClient = getAiClient();

  if (aiClient) {
    try {
      const systemInstruction = `You are ReturnPath's Career Companion for returning professionals.
Candidate current profile: Target role = "${profile?.targetRole || 'Not specified'}", Career break = "${profile?.careerGapReason || 'Not specified'}".
Tone: Professional, warm, structured, honest (consultant style). No fake persona or platitudes.
Task: Answer the user's message thoughtfully. If they ask career advice, answer in 4 parts: Assessment, Options with trade-offs, Recommendation, Next Step.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.status(200).json({
        reply: response.text || '',
        source: 'gemini-3.8-flash',
      });
    } catch (err: any) {
      console.warn('Gemini API call failed or offline, using deterministic engine fallback:', err?.message);
    }
  }

  return res.status(200).json({
    reply: null,
    source: 'offline-deterministic-fallback',
  });
}
