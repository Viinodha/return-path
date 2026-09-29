import { getPublicConfigStatus, getLiveHanaTableCounts } from '../_lib/hana';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const status = getPublicConfigStatus();
    let liveCounts = null;
    try {
      liveCounts = await getLiveHanaTableCounts(2000);
    } catch {
      // fallback smoothly without error
    }

    return res.status(200).json({
      ...status,
      liveCounts,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(200).json({
      isConfigured: false,
      error: error.message || 'Failed to retrieve SAP HANA status',
      serverTime: new Date().toISOString(),
    });
  }
}
