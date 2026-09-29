import { pushDataToHana } from '../_lib/hana';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const result = await pushDataToHana(req.body || {});
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to push data to SAP HANA Cloud',
      error: error.message,
      errorCode: String(error.code || error.errno || 'ERR_PUSH'),
    });
  }
}
