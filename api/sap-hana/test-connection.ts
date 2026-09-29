import { testHanaConnection, getLiveHanaTableCounts } from '../_lib/hana';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const status = await testHanaConnection();
    let liveCounts = null;

    if (status.success) {
      try {
        liveCounts = await getLiveHanaTableCounts(2500);
      } catch {}
    }

    return res.status(200).json({
      ...status,
      liveCounts,
    });
  } catch (error: any) {
    return res.status(200).json({
      tested: true,
      success: false,
      errorMessage: error.message || 'Connection test failed',
      errorCode: String(error.code || error.errno || 'ERR_CONN'),
      lastTestedAt: new Date().toISOString(),
    });
  }
}
