import express from 'express';
import hanaPkg from '@sap/hana-client';

interface HanaConfig {
  host: string;
  port: number | string;
  user: string;
  password?: string;
  schema?: string;
  encrypt?: boolean;
  sslValidateCertificate?: boolean;
}

// In-memory runtime configuration (initialized from environment)
let currentConfig: HanaConfig = {
  host: process.env.HANA_HOST || '',
  port: process.env.HANA_PORT || '443',
  user: process.env.HANA_USER || 'DBADMIN',
  password: process.env.HANA_PASSWORD || '',
  schema: process.env.HANA_SCHEMA || 'RETURNPATH',
  encrypt: process.env.HANA_ENCRYPT !== 'false',
  sslValidateCertificate: process.env.HANA_VALIDATE_CERT === 'true',
};

let lastConnectionStatus = {
  tested: false,
  success: false,
  latencyMs: 0,
  serverVersion: '',
  databaseName: '',
  currentUser: '',
  currentSchema: '',
  errorMessage: '',
  errorCode: '',
  lastTestedAt: '',
};

// Sandbox mock database tables for offline / trial standby mode
interface SandboxData {
  profiles: any[];
  skills: any[];
  milestones: any[];
  readinessLog: any[];
}

const sandboxStore: SandboxData = {
  profiles: [
    {
      ID: 'usr_returnpath_demo',
      FULL_NAME: 'Sarah Jenkins',
      EMAIL: 'sarah.j@example.com',
      TARGET_ROLE: 'Financial & Business Data Analyst',
      CAREER_GAP_MONTHS: 24,
      CAREER_GAP_REASON: 'Family caregiving / parent eldercare sabbatical',
      READINESS_SCORE: 72,
      UPDATED_AT: new Date().toISOString(),
    },
  ],
  skills: [
    {
      ID: 'sk_1',
      PROFILE_ID: 'usr_returnpath_demo',
      NAME: 'SQL Querying & Joins',
      CATEGORY: 'Technical',
      LEVEL: 4,
      SOURCE: 'Verified Project',
      VERIFIED: true,
      CONFIDENCE: 88,
      LAST_PRACTICED: new Date().toISOString(),
    },
    {
      ID: 'sk_2',
      PROFILE_ID: 'usr_returnpath_demo',
      NAME: 'Financial Variance Analysis',
      CATEGORY: 'Domain',
      LEVEL: 4,
      SOURCE: 'Prior Career Experience',
      VERIFIED: true,
      CONFIDENCE: 90,
      LAST_PRACTICED: new Date().toISOString(),
    },
    {
      ID: 'sk_3',
      PROFILE_ID: 'usr_returnpath_demo',
      NAME: 'Power BI Dashboard Design',
      CATEGORY: 'Technical',
      LEVEL: 3,
      SOURCE: 'Self Study / Guided',
      VERIFIED: true,
      CONFIDENCE: 75,
      LAST_PRACTICED: new Date().toISOString(),
    },
    {
      ID: 'sk_4',
      PROFILE_ID: 'usr_returnpath_demo',
      NAME: 'Python Pandas Data Wrangling',
      CATEGORY: 'Technical',
      LEVEL: 2,
      SOURCE: 'Learning Path Active',
      VERIFIED: false,
      CONFIDENCE: 50,
      LAST_PRACTICED: new Date().toISOString(),
    },
  ],
  milestones: [
    {
      ID: 'm_1',
      PROFILE_ID: 'usr_returnpath_demo',
      TITLE: 'Modern SQL Window Functions & Aggregations',
      CATEGORY: 'Foundation',
      DURATION: '1 week',
      COMPLETED: true,
      PROGRESS: 100,
      TARGET_DATE: '2026-03-15',
    },
    {
      ID: 'm_2',
      PROFILE_ID: 'usr_returnpath_demo',
      TITLE: 'SAP HANA Cloud In-Memory Analytics & Calculation Views',
      CATEGORY: 'SAP Ecosystem',
      DURATION: '2 weeks',
      COMPLETED: true,
      PROGRESS: 100,
      TARGET_DATE: '2026-03-25',
    },
    {
      ID: 'm_3',
      PROFILE_ID: 'usr_returnpath_demo',
      TITLE: 'Automated Financial Reconciliation Portfolio Project',
      CATEGORY: 'Capstone Project',
      DURATION: '2 weeks',
      COMPLETED: false,
      PROGRESS: 60,
      TARGET_DATE: '2026-04-10',
    },
  ],
  readinessLog: [
    {
      ID: 'rd_log_1',
      PROFILE_ID: 'usr_returnpath_demo',
      ROLE_NAME: 'Financial & Business Data Analyst',
      TOTAL_SCORE: 72,
      SKILLS_SCORE: 75,
      TOOLS_SCORE: 80,
      LEARNING_SCORE: 65,
      PRACTICE_SCORE: 70,
      VERDICT: 'Strong Candidate - Ready for Interviews',
      CREATED_AT: new Date().toISOString(),
    },
  ],
};

function escapeSql(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/'/g, "''");
}

// Helper to run query via @sap/hana-client
function runHanaLiveQuery(config: HanaConfig, sql: string, params: any[] = []): Promise<{ rows: any[]; latencyMs: number }> {
  return new Promise((resolve, reject) => {
    if (!config.host || !config.password) {
      return reject(new Error('SAP HANA Cloud host and password are required.'));
    }

    const conn = (hanaPkg as any).createConnection();
    const connParams: Record<string, any> = {
      serverNode: `${config.host}:${config.port || 443}`,
      uid: config.user || 'DBADMIN',
      pwd: config.password,
      encrypt: config.encrypt !== false ? 'TRUE' : 'FALSE',
      sslValidateCertificate: config.sslValidateCertificate === true ? 'TRUE' : 'FALSE',
    };

    if (config.schema) {
      connParams.currentSchema = config.schema;
    }

    const start = Date.now();
    conn.connect(connParams, (err: any) => {
      if (err) {
        return reject(err);
      }

      conn.exec(sql, params, (execErr: any, rows: any) => {
        const latencyMs = Date.now() - start;
        conn.disconnect(() => {
          if (execErr) {
            return reject(execErr);
          }
          resolve({
            rows: Array.isArray(rows) ? rows : (rows ? [rows] : []),
            latencyMs,
          });
        });
      });
    });
  });
}

// Helper to execute a sequence of SQL DML/DDL statements and explicitly COMMIT
function runHanaTransaction(config: HanaConfig, statements: string[]): Promise<{ executed: number; latencyMs: number }> {
  return new Promise((resolve, reject) => {
    if (!config.host || !config.password) {
      return reject(new Error('SAP HANA Cloud host and password are required.'));
    }

    const conn = (hanaPkg as any).createConnection();
    const connParams: Record<string, any> = {
      serverNode: `${config.host}:${config.port || 443}`,
      uid: config.user || 'DBADMIN',
      pwd: config.password,
      encrypt: config.encrypt !== false ? 'TRUE' : 'FALSE',
      sslValidateCertificate: config.sslValidateCertificate === true ? 'TRUE' : 'FALSE',
    };

    if (config.schema) {
      connParams.currentSchema = config.schema;
    }

    const start = Date.now();
    conn.connect(connParams, async (err: any) => {
      if (err) {
        return reject(err);
      }

      try {
        for (const sql of statements) {
          await new Promise<void>((resSql, rejSql) => {
            conn.exec(sql, (execErr: any) => {
              if (execErr) {
                return rejSql(new Error(`SQL Execution Error on [${sql.substring(0, 100)}]: ${execErr.message || execErr}`));
              }
              resSql();
            });
          });
        }

        // Explicitly commit the transaction to disk in HANA
        await new Promise<void>((resCommit, rejCommit) => {
          conn.exec('COMMIT', (commitErr: any) => {
            if (commitErr) {
              if (typeof conn.commit === 'function') {
                conn.commit((cErr: any) => {
                  if (cErr) return rejCommit(new Error(`COMMIT Error: ${cErr.message || cErr}`));
                  resCommit();
                });
              } else {
                return rejCommit(new Error(`COMMIT Error: ${commitErr.message || commitErr}`));
              }
            } else {
              resCommit();
            }
          });
        });

        const latencyMs = Date.now() - start;
        conn.disconnect(() => {
          resolve({ executed: statements.length, latencyMs });
        });
      } catch (txErr: any) {
        conn.exec('ROLLBACK', () => {
          conn.disconnect(() => {
            reject(txErr);
          });
        });
      }
    });
  });
}

// Query live row counts directly from SAP HANA tables using SELECT COUNT(*)
async function getLiveHanaTableCounts(config: HanaConfig): Promise<{
  RETURNPATH_PROFILES: number;
  RETURNPATH_SKILLS: number;
  RETURNPATH_MILESTONES: number;
  RETURNPATH_READINESS_LOG: number;
}> {
  const counts = {
    RETURNPATH_PROFILES: 0,
    RETURNPATH_SKILLS: 0,
    RETURNPATH_MILESTONES: 0,
    RETURNPATH_READINESS_LOG: 0,
  };

  const tables = ['RETURNPATH_PROFILES', 'RETURNPATH_SKILLS', 'RETURNPATH_MILESTONES', 'RETURNPATH_READINESS_LOG'] as const;

  for (const tbl of tables) {
    try {
      const res = await runHanaLiveQuery(config, `SELECT COUNT(*) AS TABLE_ROW_COUNT FROM ${tbl}`);
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        const val = row.TABLE_ROW_COUNT !== undefined ? row.TABLE_ROW_COUNT : Object.values(row)[0];
        counts[tbl] = Number(val) || 0;
      }
    } catch {
      counts[tbl] = 0;
    }
  }

  return counts;
}

export function registerSAPHanaRoutes(app: express.Express) {
  // 1. Get current SAP HANA Connection status
  app.get('/api/sap-hana/status', (_req, res) => {
    const isConfigured = Boolean(currentConfig.host && currentConfig.host.trim().length > 0);
    return res.json({
      configured: isConfigured,
      host: currentConfig.host ? `${currentConfig.host.substring(0, 8)}...` : '',
      fullHost: currentConfig.host || '',
      port: currentConfig.port,
      user: currentConfig.user,
      schema: currentConfig.schema,
      encrypt: currentConfig.encrypt,
      sslValidateCertificate: currentConfig.sslValidateCertificate,
      connectionStatus: lastConnectionStatus,
      mode: lastConnectionStatus.success ? 'LIVE_HANA_CLOUD' : 'SANDBOX_SIMULATOR',
    });
  });

  // 2. Test Connection
  app.post('/api/sap-hana/test-connection', async (req, res) => {
    const { host, port, user, password, schema, encrypt, sslValidateCertificate } = req.body;

    if (host) currentConfig.host = host.trim();
    if (port) currentConfig.port = port;
    if (user) currentConfig.user = user.trim();
    if (password !== undefined) currentConfig.password = password;
    if (schema) currentConfig.schema = schema.trim();
    if (encrypt !== undefined) currentConfig.encrypt = Boolean(encrypt);
    if (sslValidateCertificate !== undefined) currentConfig.sslValidateCertificate = Boolean(sslValidateCertificate);

    if (!currentConfig.host) {
      return res.status(400).json({
        success: false,
        error: 'Hostname is required (e.g. xxxxxxxx-xxxx-xxxx.hanacloud.ondemand.com)',
      });
    }

    try {
      // Run diagnostic query on live HANA instance with explicit non-reserved aliases and FROM DUMMY
      const result = await runHanaLiveQuery(
        currentConfig,
        'SELECT CURRENT_USER AS CONNECTED_USER, CURRENT_SCHEMA AS CONNECTED_SCHEMA FROM DUMMY'
      );

      let versionInfo = 'SAP HANA Cloud 4.0';
      try {
        const verResult = await runHanaLiveQuery(currentConfig, 'SELECT VERSION FROM M_DATABASE');
        if (verResult.rows && verResult.rows.length > 0 && verResult.rows[0].VERSION) {
          versionInfo = verResult.rows[0].VERSION;
        }
      } catch {
        // M_DATABASE may require sys admin rights
      }

      const activeUser = result.rows[0]?.CONNECTED_USER || result.rows[0]?.CURRENT_USER || currentConfig.user;
      const activeSchema = result.rows[0]?.CONNECTED_SCHEMA || result.rows[0]?.CURRENT_SCHEMA || currentConfig.schema;

      lastConnectionStatus = {
        tested: true,
        success: true,
        latencyMs: result.latencyMs,
        serverVersion: versionInfo,
        databaseName: 'HXE (HANA Cloud)',
        currentUser: activeUser,
        currentSchema: activeSchema,
        errorMessage: '',
        errorCode: '',
        lastTestedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        latencyMs: result.latencyMs,
        serverVersion: versionInfo,
        currentUser: activeUser,
        currentSchema: activeSchema,
        message: `Successfully connected to SAP HANA Cloud in ${result.latencyMs}ms! Authenticated as ${activeUser} in schema ${activeSchema}.`,
      });
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const errorCode = err?.code || '';

      lastConnectionStatus = {
        tested: true,
        success: false,
        latencyMs: 0,
        serverVersion: '',
        databaseName: '',
        currentUser: '',
        errorMessage: errorMsg,
        errorCode: String(errorCode),
        lastTestedAt: new Date().toISOString(),
      };

      // Construct helpful diagnostic advice based on common SAP BTP HANA Cloud errors
      const troubleshooting: string[] = [];
      if (errorMsg.includes('-10709') || errorMsg.toLowerCase().includes('connection failed')) {
        troubleshooting.push('Instance Paused/Stopped: Free Trial instances automatically stop every 24 hours. Open SAP BTP Cockpit -> SAP HANA Cloud, check instance status, and click "Start".');
        troubleshooting.push('IP Allowlist: In SAP HANA Cloud instance settings, verify "Allowed IP Addresses" includes 0.0.0.0/0 ("Allow all IP addresses").');
        troubleshooting.push('Hostname & Port: Ensure Hostname has NO protocol prefix ("https://") and port is 443.');
      } else if (errorMsg.includes('-4004') || errorMsg.toLowerCase().includes('authentication') || errorMsg.toLowerCase().includes('password')) {
        troubleshooting.push('Authentication Error: Verify the password for user "' + currentConfig.user + '". If you forgot it, reset it from the SAP BTP Cockpit.');
      } else if (errorMsg.toLowerCase().includes('certificate') || errorMsg.toLowerCase().includes('ssl')) {
        troubleshooting.push('SSL Validation: Ensure "Validate Certificate" is turned OFF for trial instances, or check that SSL Encryption is enabled.');
      } else {
        troubleshooting.push('Check that your SAP BTP Trial account is active and the HANA Cloud service is not expired.');
      }

      return res.status(200).json({
        success: false,
        error: errorMsg,
        errorCode,
        troubleshooting,
        fallbackMode: 'SANDBOX_SIMULATOR',
      });
    }
  });

  // 3. Initialize ReturnPath Schema in SAP HANA (DDL)
  app.post('/api/sap-hana/init-schema', async (_req, res) => {
    const ddlStatements = [
      `CREATE COLUMN TABLE RETURNPATH_PROFILES (
        ID VARCHAR(64) PRIMARY KEY,
        FULL_NAME NVARCHAR(255),
        EMAIL NVARCHAR(255),
        TARGET_ROLE NVARCHAR(255),
        CAREER_GAP_MONTHS INTEGER,
        CAREER_GAP_REASON NVARCHAR(255),
        READINESS_SCORE INTEGER,
        UPDATED_AT TIMESTAMP
      )`,
      `CREATE COLUMN TABLE RETURNPATH_SKILLS (
        ID VARCHAR(64) PRIMARY KEY,
        PROFILE_ID VARCHAR(64),
        NAME NVARCHAR(255),
        CATEGORY NVARCHAR(64),
        LEVEL INTEGER,
        SOURCE NVARCHAR(64),
        VERIFIED BOOLEAN,
        CONFIDENCE INTEGER,
        LAST_PRACTICED TIMESTAMP
      )`,
      `CREATE COLUMN TABLE RETURNPATH_MILESTONES (
        ID VARCHAR(64) PRIMARY KEY,
        PROFILE_ID VARCHAR(64),
        TITLE NVARCHAR(255),
        CATEGORY NVARCHAR(64),
        DURATION NVARCHAR(64),
        COMPLETED BOOLEAN,
        PROGRESS INTEGER,
        TARGET_DATE NVARCHAR(64)
      )`,
      `CREATE COLUMN TABLE RETURNPATH_READINESS_LOG (
        ID VARCHAR(64) PRIMARY KEY,
        PROFILE_ID VARCHAR(64),
        ROLE_NAME NVARCHAR(255),
        TOTAL_SCORE INTEGER,
        SKILLS_SCORE INTEGER,
        TOOLS_SCORE INTEGER,
        LEARNING_SCORE INTEGER,
        PRACTICE_SCORE INTEGER,
        VERDICT NVARCHAR(255),
        CREATED_AT TIMESTAMP
      )`,
    ];

    if (lastConnectionStatus.success && currentConfig.host) {
      try {
        const results: string[] = [];
        for (const sql of ddlStatements) {
          try {
            await runHanaLiveQuery(currentConfig, sql);
            results.push('Created: ' + sql.split('(')[0].trim());
          } catch (e: any) {
            // If table already exists, continue
            if (e?.message?.includes('already exists') || e?.message?.includes('-288')) {
              results.push('Already exists: ' + sql.split('(')[0].trim());
            } else {
              results.push('Error on ' + sql.split('(')[0].trim() + ': ' + e?.message);
            }
          }
        }
        return res.json({
          success: true,
          mode: 'LIVE_HANA_CLOUD',
          results,
          message: 'SAP HANA Cloud tables verified and ready!',
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message });
      }
    }

    // Sandbox execution fallback
    return res.json({
      success: true,
      mode: 'SANDBOX_SIMULATOR',
      results: [
        'Created COLUMN TABLE: RETURNPATH_PROFILES (Sandbox)',
        'Created COLUMN TABLE: RETURNPATH_SKILLS (Sandbox)',
        'Created COLUMN TABLE: RETURNPATH_MILESTONES (Sandbox)',
        'Created COLUMN TABLE: RETURNPATH_READINESS_LOG (Sandbox)',
      ],
      message: 'ReturnPath schema initialized in SAP HANA Simulator Sandbox!',
    });
  });

  // 4. Push ReturnPath Memory State into SAP HANA Tables
  app.post('/api/sap-hana/sync-push', async (req, res) => {
    const { profile, skills = [], learningMilestones = [], readinessScore = 0 } = req.body;

    const profileId = profile?.id || 'usr_active';
    const profileRecord = {
      ID: profileId,
      FULL_NAME: profile?.fullName || 'Returning Professional',
      EMAIL: profile?.email || 'user@example.com',
      TARGET_ROLE: profile?.targetRole || 'Data Analyst',
      CAREER_GAP_MONTHS: Number(profile?.careerGapMonths) || 24,
      CAREER_GAP_REASON: profile?.careerGapReason || 'Personal / Family Caregiving Hiatus',
      READINESS_SCORE: Number(readinessScore) || 75,
      UPDATED_AT: new Date().toISOString(),
    };

    // Update sandbox store as secondary replica
    const existingProfIdx = sandboxStore.profiles.findIndex(p => p.ID === profileId);
    if (existingProfIdx >= 0) {
      sandboxStore.profiles[existingProfIdx] = profileRecord;
    } else {
      sandboxStore.profiles.push(profileRecord);
    }

    const skillsToSync = (skills && Array.isArray(skills) && skills.length > 0)
      ? skills
      : [
          { id: 'sk_sql', name: 'SQL & Relational Databases', category: 'Technical', level: 4, source: 'Verified Experience', verified: true, confidence: 90 },
          { id: 'sk_hana', name: 'SAP HANA In-Memory Modeling', category: 'SAP Ecosystem', level: 3, source: 'Active Training', verified: true, confidence: 85 },
          { id: 'sk_bi', name: 'Power BI & Tableau Reporting', category: 'Technical', level: 3, source: 'Self Study', verified: true, confidence: 80 },
        ];

    sandboxStore.skills = skillsToSync.map((s: any, idx: number) => ({
      ID: s.id || `sk_${idx + 1}`,
      PROFILE_ID: profileId,
      NAME: s.name,
      CATEGORY: s.category || 'Technical',
      LEVEL: Number(s.level) || 1,
      SOURCE: s.source || 'Assessed',
      VERIFIED: Boolean(s.verified),
      CONFIDENCE: Number(s.confidence) || 75,
      LAST_PRACTICED: new Date().toISOString(),
    }));

    const milestonesToSync = (learningMilestones && Array.isArray(learningMilestones) && learningMilestones.length > 0)
      ? learningMilestones
      : [
          { id: 'm_1', title: 'Advanced SQL Query Optimization', category: 'Foundation', duration: '1 week', completed: true, progress: 100, targetDate: '2026-03-15' },
          { id: 'm_2', title: 'SAP HANA Cloud Calculation Views', category: 'SAP Ecosystem', duration: '2 weeks', completed: true, progress: 100, targetDate: '2026-03-25' },
          { id: 'm_3', title: 'Financial Analytics Capstone Project', category: 'Capstone', duration: '2 weeks', completed: false, progress: 60, targetDate: '2026-04-10' },
        ];

    sandboxStore.milestones = milestonesToSync.map((m: any, idx: number) => ({
      ID: m.id || `m_${idx + 1}`,
      PROFILE_ID: profileId,
      TITLE: m.title,
      CATEGORY: m.category || 'Curriculum',
      DURATION: m.duration || '1 week',
      COMPLETED: Boolean(m.completed),
      PROGRESS: m.completed ? 100 : (Number(m.progress) || 0),
      TARGET_DATE: m.targetDate || '2026-04-01',
    }));

    const readinessLogRecord = {
      ID: `rd_log_${Date.now()}`,
      PROFILE_ID: profileId,
      ROLE_NAME: profile?.targetRole || 'Financial & Business Data Analyst',
      TOTAL_SCORE: Number(readinessScore) || 78,
      SKILLS_SCORE: Math.min(100, Math.round((Number(readinessScore) || 78) * 1.05)),
      TOOLS_SCORE: Math.min(100, Math.round((Number(readinessScore) || 78) * 0.95)),
      LEARNING_SCORE: Math.min(100, Math.round((Number(readinessScore) || 78) * 0.9)),
      PRACTICE_SCORE: Math.min(100, Math.round((Number(readinessScore) || 78) * 1.0)),
      VERDICT: (Number(readinessScore) || 78) >= 75 ? 'Ready for Interviews' : 'In Upskilling Phase',
      CREATED_AT: new Date().toISOString(),
    };
    sandboxStore.readinessLog.unshift(readinessLogRecord);

    // If HANA Cloud is configured, execute real UPSERT statements across all 4 tables and COMMIT
    if (currentConfig.host && currentConfig.password) {
      try {
        const statements: string[] = [];

        // 1. Upsert Profile
        statements.push(`UPSERT RETURNPATH_PROFILES (ID, FULL_NAME, EMAIL, TARGET_ROLE, CAREER_GAP_MONTHS, CAREER_GAP_REASON, READINESS_SCORE, UPDATED_AT) VALUES (
          '${escapeSql(profileRecord.ID)}',
          '${escapeSql(profileRecord.FULL_NAME)}',
          '${escapeSql(profileRecord.EMAIL)}',
          '${escapeSql(profileRecord.TARGET_ROLE)}',
          ${profileRecord.CAREER_GAP_MONTHS},
          '${escapeSql(profileRecord.CAREER_GAP_REASON)}',
          ${profileRecord.READINESS_SCORE},
          CURRENT_TIMESTAMP
        ) WITH PRIMARY KEY`);

        // 2. Upsert Skills
        for (const s of sandboxStore.skills) {
          statements.push(`UPSERT RETURNPATH_SKILLS (ID, PROFILE_ID, NAME, CATEGORY, LEVEL, SOURCE, VERIFIED, CONFIDENCE, LAST_PRACTICED) VALUES (
            '${escapeSql(s.ID)}',
            '${escapeSql(s.PROFILE_ID)}',
            '${escapeSql(s.NAME)}',
            '${escapeSql(s.CATEGORY)}',
            ${s.LEVEL},
            '${escapeSql(s.SOURCE)}',
            ${s.VERIFIED ? 'TRUE' : 'FALSE'},
            ${s.CONFIDENCE},
            CURRENT_TIMESTAMP
          ) WITH PRIMARY KEY`);
        }

        // 3. Upsert Milestones
        for (const m of sandboxStore.milestones) {
          statements.push(`UPSERT RETURNPATH_MILESTONES (ID, PROFILE_ID, TITLE, CATEGORY, DURATION, COMPLETED, PROGRESS, TARGET_DATE) VALUES (
            '${escapeSql(m.ID)}',
            '${escapeSql(m.PROFILE_ID)}',
            '${escapeSql(m.TITLE)}',
            '${escapeSql(m.CATEGORY)}',
            '${escapeSql(m.DURATION)}',
            ${m.COMPLETED ? 'TRUE' : 'FALSE'},
            ${m.PROGRESS},
            '${escapeSql(m.TARGET_DATE)}'
          ) WITH PRIMARY KEY`);
        }

        // 4. Upsert Readiness Log
        statements.push(`UPSERT RETURNPATH_READINESS_LOG (ID, PROFILE_ID, ROLE_NAME, TOTAL_SCORE, SKILLS_SCORE, TOOLS_SCORE, LEARNING_SCORE, PRACTICE_SCORE, VERDICT, CREATED_AT) VALUES (
          '${escapeSql(readinessLogRecord.ID)}',
          '${escapeSql(readinessLogRecord.PROFILE_ID)}',
          '${escapeSql(readinessLogRecord.ROLE_NAME)}',
          ${readinessLogRecord.TOTAL_SCORE},
          ${readinessLogRecord.SKILLS_SCORE},
          ${readinessLogRecord.TOOLS_SCORE},
          ${readinessLogRecord.LEARNING_SCORE},
          ${readinessLogRecord.PRACTICE_SCORE},
          '${escapeSql(readinessLogRecord.VERDICT)}',
          CURRENT_TIMESTAMP
        ) WITH PRIMARY KEY`);

        // Execute all statements and COMMIT to SAP HANA Cloud
        const txResult = await runHanaTransaction(currentConfig, statements);

        // Run live SELECT COUNT(*) queries on all 4 tables in SAP HANA
        const liveCounts = await getLiveHanaTableCounts(currentConfig);

        lastConnectionStatus.success = true;

        return res.json({
          success: true,
          mode: 'LIVE_HANA_CLOUD',
          realHanaCounts: liveCounts,
          syncedRecords: {
            profile: 1,
            skills: sandboxStore.skills.length,
            milestones: sandboxStore.milestones.length,
            readinessLogs: 1,
          },
          statementsExecuted: statements.length,
          latencyMs: txResult.latencyMs,
          message: `Successfully executed & COMMITTED ${statements.length} statements into SAP HANA Cloud (${txResult.latencyMs}ms)! Live counts: PROFILES: ${liveCounts.RETURNPATH_PROFILES}, SKILLS: ${liveCounts.RETURNPATH_SKILLS}, MILESTONES: ${liveCounts.RETURNPATH_MILESTONES}, READINESS_LOG: ${liveCounts.RETURNPATH_READINESS_LOG}.`,
        });
      } catch (err: any) {
        console.error('Live HANA sync failed:', err);
        return res.status(400).json({
          success: false,
          mode: 'LIVE_HANA_CLOUD',
          error: err?.message || String(err),
          message: `SQL execution failed against SAP HANA Cloud: ${err?.message || err}. Ensure tables are initialized.`,
        });
      }
    }

    return res.json({
      success: true,
      mode: 'SANDBOX_SIMULATOR',
      realHanaCounts: {
        RETURNPATH_PROFILES: sandboxStore.profiles.length,
        RETURNPATH_SKILLS: sandboxStore.skills.length,
        RETURNPATH_MILESTONES: sandboxStore.milestones.length,
        RETURNPATH_READINESS_LOG: sandboxStore.readinessLog.length,
      },
      syncedRecords: {
        profile: 1,
        skills: sandboxStore.skills.length,
        milestones: sandboxStore.milestones.length,
        readinessLogs: sandboxStore.readinessLog.length,
      },
      message: 'State stored in local simulator memory. To push to your real SAP HANA instance, configure and test your connection first.',
    });
  });

  // 5. Pull State from SAP HANA Tables
  app.get('/api/sap-hana/sync-pull', async (_req, res) => {
    if (lastConnectionStatus.success && currentConfig.host) {
      try {
        const skillsQuery = await runHanaLiveQuery(currentConfig, 'SELECT * FROM RETURNPATH_SKILLS');
        const profilesQuery = await runHanaLiveQuery(currentConfig, 'SELECT * FROM RETURNPATH_PROFILES LIMIT 1');
        return res.json({
          success: true,
          mode: 'LIVE_HANA_CLOUD',
          data: {
            profile: profilesQuery.rows[0] || sandboxStore.profiles[0],
            skills: skillsQuery.rows || sandboxStore.skills,
            milestones: sandboxStore.milestones,
            readinessLog: sandboxStore.readinessLog,
          },
        });
      } catch (err: any) {
        console.warn('Live HANA pull failed, using sandbox:', err?.message);
      }
    }

    return res.json({
      success: true,
      mode: 'SANDBOX_SIMULATOR',
      data: {
        profile: sandboxStore.profiles[0],
        skills: sandboxStore.skills,
        milestones: sandboxStore.milestones,
        readinessLog: sandboxStore.readinessLog,
      },
    });
  });

  // 6. Live SQL Query Runner / Sandbox
  app.post('/api/sap-hana/query', async (req, res) => {
    const { sql } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query string is required' });
    }

    const trimmed = sql.trim();
    let executableSql = trimmed;

    // Normalize reserved keyword aliases: HANA throws syntax error on unquoted reserved words as aliases
    executableSql = executableSql
      .replace(/\bAS\s+CURRENT_USER\b/gi, 'AS CONNECTED_USER')
      .replace(/\bAS\s+CURRENT_SCHEMA\b/gi, 'AS CONNECTED_SCHEMA')
      .replace(/\bAS\s+CURRENT_TIMESTAMP\b/gi, 'AS CURRENT_SERVER_TIME')
      .replace(/\bAS\s+USER\b/gi, 'AS CONNECTED_USER')
      .replace(/\bAS\s+DATE\b/gi, 'AS RECORD_DATE')
      .replace(/\bAS\s+TIME\b/gi, 'AS CURRENT_SERVER_TIME')
      .replace(/\bAS\s+TIMESTAMP\b/gi, 'AS CURRENT_SERVER_TIME');

    // HANA requires FROM DUMMY for scalar/function SELECT queries (e.g., SELECT CURRENT_USER or SELECT CURRENT_TIMESTAMP)
    if (/^\s*SELECT\b/i.test(executableSql) && !/\bFROM\b/i.test(executableSql)) {
      executableSql = `${executableSql} FROM DUMMY`;
    }

    // If live connected, execute against real SAP HANA Cloud
    if (lastConnectionStatus.success && currentConfig.host) {
      try {
        const result = await runHanaLiveQuery(currentConfig, executableSql);
        const rows = result.rows || [];
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        return res.json({
          success: true,
          mode: 'LIVE_HANA_CLOUD',
          columns,
          rows,
          rowCount: rows.length,
          executionMs: result.latencyMs,
          engine: `SAP HANA Cloud (${lastConnectionStatus.serverVersion || 'Instance'})`,
        });
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          error: err?.message || 'SAP HANA Query Execution Error',
          code: err?.code,
          mode: 'LIVE_HANA_CLOUD',
        });
      }
    }

    // Dynamic In-Memory Sandbox Query Parser
    const upper = executableSql.toUpperCase();
    const start = Date.now();

    let rows: any[] = [];

    if (upper.includes('RETURNPATH_SKILLS')) {
      rows = [...sandboxStore.skills];
      if (upper.includes('ORDER BY LEVEL DESC')) {
        rows.sort((a, b) => b.LEVEL - a.LEVEL);
      }
    } else if (upper.includes('RETURNPATH_PROFILES')) {
      rows = [...sandboxStore.profiles];
    } else if (upper.includes('RETURNPATH_MILESTONES')) {
      rows = [...sandboxStore.milestones];
      if (upper.includes('WHERE COMPLETED = TRUE')) {
        rows = rows.filter(m => m.COMPLETED);
      }
    } else if (upper.includes('RETURNPATH_READINESS_LOG')) {
      rows = [...sandboxStore.readinessLog];
    } else if (upper.includes('M_DATABASE') || upper.includes('M_SERVICES')) {
      rows = [
        {
          DATABASE_NAME: 'HXE',
          HOST: currentConfig.host || 'hanacloud.trial.ondemand.com',
          SQL_PORT: 443,
          VERSION: '4.00.000.00.1712345678',
          STATUS: 'ONLINE',
          TOTAL_MEMORY_GB: 32,
          ACTIVE_CONNECTIONS: 4,
          START_TIME: '2026-03-29 06:00:00',
        },
      ];
    } else if (upper.includes('M_TABLES')) {
      rows = [
        { SCHEMA_NAME: currentConfig.schema, TABLE_NAME: 'RETURNPATH_PROFILES', TABLE_TYPE: 'COLUMN', RECORD_COUNT: sandboxStore.profiles.length },
        { SCHEMA_NAME: currentConfig.schema, TABLE_NAME: 'RETURNPATH_SKILLS', TABLE_TYPE: 'COLUMN', RECORD_COUNT: sandboxStore.skills.length },
        { SCHEMA_NAME: currentConfig.schema, TABLE_NAME: 'RETURNPATH_MILESTONES', TABLE_TYPE: 'COLUMN', RECORD_COUNT: sandboxStore.milestones.length },
        { SCHEMA_NAME: currentConfig.schema, TABLE_NAME: 'RETURNPATH_READINESS_LOG', TABLE_TYPE: 'COLUMN', RECORD_COUNT: sandboxStore.readinessLog.length },
      ];
    } else if (upper.includes('DUMMY') || upper.includes('CURRENT_USER') || upper.includes('CURRENT_TIMESTAMP') || upper.includes('CONNECTED_USER') || upper.includes('CONNECTED_SCHEMA')) {
      rows = [
        {
          DUMMY: 'X',
          CONNECTED_USER: currentConfig.user,
          CONNECTED_SCHEMA: currentConfig.schema,
          CURRENT_USER: currentConfig.user,
          CURRENT_SCHEMA: currentConfig.schema,
          CURRENT_SERVER_TIME: new Date().toISOString(),
          CURRENT_TIMESTAMP: new Date().toISOString(),
          SERVER_TIME: new Date().toISOString(),
          SERVER_TIMESTAMP: new Date().toISOString(),
        },
      ];
    } else {
      // Default sample query response
      rows = [
        {
          RESULT: 'Query simulated in SAP HANA In-Memory Sandbox',
          EXECUTED_SQL: trimmed,
          STATUS: 'SUCCESS',
          TIME: new Date().toISOString(),
        },
      ];
    }

    const latencyMs = Math.max(1, Date.now() - start + 8);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return res.json({
      success: true,
      mode: 'SANDBOX_SIMULATOR',
      columns,
      rows,
      rowCount: rows.length,
      executionMs: latencyMs,
      engine: 'SAP HANA Cloud Simulator Sandbox',
      note: 'To run directly against your SAP HANA Cloud instance, enter your trial host & password in the Connection Manager.',
    });
  });

  // 7. Schema info endpoint with real live SELECT COUNT(*) from SAP HANA
  app.get('/api/sap-hana/schema-info', async (_req, res) => {
    let isLive = false;
    let liveCounts: Record<string, number> | null = null;
    let queryError: string | null = null;

    if (currentConfig.host && currentConfig.password) {
      try {
        liveCounts = await getLiveHanaTableCounts(currentConfig);
        isLive = true;
      } catch (err: any) {
        queryError = err?.message || String(err);
      }
    }

    const tableDefs = [
      {
        name: 'RETURNPATH_PROFILES',
        type: 'COLUMN TABLE',
        columns: ['ID (VARCHAR)', 'FULL_NAME (NVARCHAR)', 'EMAIL (NVARCHAR)', 'TARGET_ROLE (NVARCHAR)', 'CAREER_GAP_MONTHS (INT)', 'READINESS_SCORE (INT)', 'UPDATED_AT (TIMESTAMP)'],
      },
      {
        name: 'RETURNPATH_SKILLS',
        type: 'COLUMN TABLE',
        columns: ['ID (VARCHAR)', 'PROFILE_ID (VARCHAR)', 'NAME (NVARCHAR)', 'CATEGORY (NVARCHAR)', 'LEVEL (INT)', 'SOURCE (NVARCHAR)', 'VERIFIED (BOOL)', 'CONFIDENCE (INT)'],
      },
      {
        name: 'RETURNPATH_MILESTONES',
        type: 'COLUMN TABLE',
        columns: ['ID (VARCHAR)', 'PROFILE_ID (VARCHAR)', 'TITLE (NVARCHAR)', 'CATEGORY (NVARCHAR)', 'DURATION (NVARCHAR)', 'COMPLETED (BOOL)', 'PROGRESS (INT)'],
      },
      {
        name: 'RETURNPATH_READINESS_LOG',
        type: 'COLUMN TABLE',
        columns: ['ID (VARCHAR)', 'PROFILE_ID (VARCHAR)', 'ROLE_NAME (NVARCHAR)', 'TOTAL_SCORE (INT)', 'SKILLS_SCORE (INT)', 'TOOLS_SCORE (INT)', 'VERDICT (NVARCHAR)', 'CREATED_AT (TIMESTAMP)'],
      },
    ];

    const tables = tableDefs.map(t => ({
      name: t.name,
      type: t.type,
      columns: t.columns,
      recordCount: isLive && liveCounts ? (liveCounts[t.name] ?? 0) : 0,
      isLiveCount: isLive,
    }));

    return res.json({
      schema: currentConfig.schema,
      isLive,
      queryError,
      liveCounts: isLive ? liveCounts : null,
      tables,
    });
  });
}
