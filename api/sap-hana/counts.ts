import { getLiveHanaTableCounts } from '../_lib/hana.js';

export default async function handler(req: any, res: any) {
  try {
    const counts = await getLiveHanaTableCounts();
    return res.status(200).json({ counts });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'Failed to fetch table counts',
    });
  }
}
