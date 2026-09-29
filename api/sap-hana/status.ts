import { getPublicConfigStatus, getLiveHanaTableCounts } from '../_lib/hana.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const status = getPublicConfigStatus();
    const liveCounts = await getLiveHanaTableCounts();

    return res.status(200).json({
      ...status,
      liveCounts,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'Failed to retrieve SAP HANA status',
    });
  }
}
