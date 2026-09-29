import { bootstrapHanaSchema } from '../_lib/hana';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const result = await bootstrapHanaSchema();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to bootstrap SAP HANA schema',
      tablesCreated: [],
      latencyMs: 0,
    });
  }
}
