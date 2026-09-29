import { executeSqlSandbox } from '../_lib/hana';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sql } = req.body || {};
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'SQL statement is required' });
  }

  try {
    const result = await executeSqlSandbox(sql);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      rows: [],
      columns: [],
      rowCount: 0,
      latencyMs: 0,
      source: 'Error',
      error: error.message || 'Execution error',
      errorCode: String(error.code || error.errno || 'ERR_EXEC'),
    });
  }
}
