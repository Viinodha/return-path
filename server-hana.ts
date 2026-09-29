import express from 'express';
import {
  getPublicConfigStatus,
  testHanaConnection,
  bootstrapHanaSchema,
  pushDataToHana,
  executeSqlSandbox,
  getLiveHanaTableCounts,
} from './api/_lib/hana.js';

export function registerSAPHanaRoutes(app: express.Application) {
  // 1. Connection Status & Environment Config (Masked, no secret exposure)
  app.get('/api/sap-hana/status', async (_req, res) => {
    try {
      const status = getPublicConfigStatus();
      const liveCounts = await getLiveHanaTableCounts();
      res.json({
        ...status,
        liveCounts,
        serverTime: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Status check failed' });
    }
  });

  // 2. Test Live Connection (Strictly reads process.env on server, no secrets accepted from client)
  app.post('/api/sap-hana/test-connection', async (_req, res) => {
    try {
      const status = await testHanaConnection();
      let liveCounts = null;
      if (status.success) {
        liveCounts = await getLiveHanaTableCounts();
      }
      res.json({
        ...status,
        liveCounts,
      });
    } catch (err: any) {
      res.status(500).json({
        tested: true,
        success: false,
        errorMessage: err.message || 'Connection test failed',
        errorCode: String(err.code || err.errno || 'ERR_CONN'),
        lastTestedAt: new Date().toISOString(),
      });
    }
  });

  // 3. Schema Bootstrap
  app.post('/api/sap-hana/bootstrap', async (_req, res) => {
    try {
      const result = await bootstrapHanaSchema();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Schema bootstrap failed',
        tablesCreated: [],
        latencyMs: 0,
      });
    }
  });

  // 4. Live Table Row Counts & Schema Metadata
  app.get('/api/sap-hana/counts', async (_req, res) => {
    try {
      const counts = await getLiveHanaTableCounts();
      res.json({ counts });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch table counts' });
    }
  });

  app.get('/api/sap-hana/schema-info', async (_req, res) => {
    try {
      const liveCounts = await getLiveHanaTableCounts();
      const tables = [
        {
          name: 'RETURNPATH_PROFILES',
          type: 'COLUMN TABLE',
          columns: ['ID', 'FULL_NAME', 'EMAIL', 'TARGET_ROLE', 'CAREER_GAP_MONTHS', 'CAREER_GAP_REASON', 'READINESS_SCORE', 'UPDATED_AT'],
          recordCount: liveCounts.RETURNPATH_PROFILES,
          isLiveCount: true,
        },
        {
          name: 'RETURNPATH_SKILLS',
          type: 'COLUMN TABLE',
          columns: ['ID', 'PROFILE_ID', 'NAME', 'CATEGORY', 'LEVEL', 'SOURCE', 'VERIFIED', 'CONFIDENCE', 'LAST_PRACTICED'],
          recordCount: liveCounts.RETURNPATH_SKILLS,
          isLiveCount: true,
        },
        {
          name: 'RETURNPATH_MILESTONES',
          type: 'COLUMN TABLE',
          columns: ['ID', 'PROFILE_ID', 'TITLE', 'CATEGORY', 'DURATION', 'COMPLETED', 'PROGRESS', 'TARGET_DATE'],
          recordCount: liveCounts.RETURNPATH_MILESTONES,
          isLiveCount: true,
        },
        {
          name: 'RETURNPATH_READINESS_LOG',
          type: 'COLUMN TABLE',
          columns: ['ID', 'PROFILE_ID', 'ROLE_NAME', 'TOTAL_SCORE', 'SKILLS_SCORE', 'TOOLS_SCORE', 'LEARNING_SCORE', 'PRACTICE_SCORE', 'VERDICT', 'CREATED_AT'],
          recordCount: liveCounts.RETURNPATH_READINESS_LOG,
          isLiveCount: true,
        },
      ];
      res.json({ tables });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch schema info' });
    }
  });

  // 5. Push ReturnPath Data to SAP HANA (UPSERT / INSERT + COMMIT)
  app.post('/api/sap-hana/push', async (req, res) => {
    try {
      const result = await pushDataToHana(req.body || {});
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Push to SAP HANA failed',
        error: err.message,
        errorCode: String(err.code || err.errno || 'ERR_PUSH'),
      });
    }
  });

  // 6. Interactive SQL Sandbox Query Execution
  app.post('/api/sap-hana/query', async (req, res) => {
    const { sql } = req.body || {};
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL statement is required' });
    }

    try {
      const result = await executeSqlSandbox(sql);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        rows: [],
        columns: [],
        rowCount: 0,
        latencyMs: 0,
        source: 'Error',
        error: err.message || 'Execution failed',
        errorCode: String(err.code || err.errno || 'ERR_EXEC'),
      });
    }
  });
}
