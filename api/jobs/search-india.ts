import { getAiClient } from '../_lib/ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { role, location = 'India', city } = req.body || {};
  const targetQueryRole = role || 'Data Analyst';
  const targetLocation = city ? `${city}, India` : (location || 'India');

  const aiClient = getAiClient();

  if (aiClient) {
    try {
      const searchPrompt = `Find 3 to 5 real, active job postings in ${targetLocation} for the role "${targetQueryRole}".
Prioritize employers known for inclusive hiring, return-to-work programs, or companies hiring in Indian tech hubs (e.g., Bengaluru, Hyderabad, Pune, Mumbai, Gurugram, Chennai).
Search query: "${targetQueryRole} jobs in ${targetLocation} hiring 2025 2026 return to work"

For each job posting found, provide structured JSON matching:
{
  "jobs": [
    {
      "id": "job-live-1",
      "title": "...",
      "company": "...",
      "location": "...",
      "city": "...",
      "country": "India",
      "isIndia": true,
      "sector": "Technology",
      "url": "...",
      "fullText": "...",
      "requiredSkills": ["..."],
      "preferredSkills": ["..."],
      "requiredTools": ["..."],
      "experienceYears": 1,
      "education": "...",
      "gapRestriction": "returner_friendly",
      "gapAnalysisNote": "..."
    }
  ]
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.jobs && Array.isArray(parsed.jobs)) {
          return res.status(200).json({ jobs: parsed.jobs, grounded: true });
        }
      }
    } catch (err: any) {
      console.warn('Grounding search failed:', err?.message);
    }
  }

  return res.status(200).json({ jobs: [], grounded: false });
}
