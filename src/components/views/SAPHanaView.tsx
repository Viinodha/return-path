import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  CheckCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Server,
  Layers,
  Terminal,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { MemoryStore } from '../../lib/data/store';

interface SAPHanaViewProps {
  store: MemoryStore;
}

type TabKey = 'guide' | 'connection' | 'schema' | 'sync' | 'sandbox';

interface ConnectionStatus {
  configured: boolean;
  host: string;
  fullHost?: string;
  port: string | number;
  user: string;
  schema: string;
  encrypt: boolean;
  sslValidateCertificate: boolean;
  connectionStatus: {
    tested: boolean;
    success: boolean;
    latencyMs: number;
    serverVersion: string;
    databaseName: string;
    currentUser: string;
    currentSchema?: string;
    errorMessage: string;
    errorCode: string;
    lastTestedAt: string;
  };
  mode: 'LIVE_HANA_CLOUD' | 'SANDBOX_SIMULATOR';
}

const PRESET_QUERIES = [
  {
    name: 'Session & User Info',
    sql: 'SELECT CURRENT_USER AS CONNECTED_USER, CURRENT_SCHEMA AS CONNECTED_SCHEMA, CURRENT_TIMESTAMP AS CURRENT_SERVER_TIME FROM DUMMY',
  },
  {
    name: 'Top Verified Skills',
    sql: 'SELECT NAME, CATEGORY, LEVEL AS SKILL_LEVEL, CONFIDENCE, SOURCE AS SKILL_SOURCE FROM RETURNPATH_SKILLS ORDER BY LEVEL DESC',
  },
  {
    name: 'Readiness Score Audit Log',
    sql: 'SELECT ROLE_NAME, TOTAL_SCORE, SKILLS_SCORE, TOOLS_SCORE, VERDICT, CREATED_AT AS AUDIT_TIMESTAMP FROM RETURNPATH_READINESS_LOG ORDER BY CREATED_AT DESC',
  },
  {
    name: 'Candidate Profile Snapshot',
    sql: 'SELECT FULL_NAME, TARGET_ROLE, CAREER_GAP_MONTHS, CAREER_GAP_REASON, READINESS_SCORE FROM RETURNPATH_PROFILES',
  },
  {
    name: 'Active Learning Milestones',
    sql: 'SELECT TITLE, CATEGORY, DURATION, PROGRESS, TARGET_DATE FROM RETURNPATH_MILESTONES WHERE COMPLETED = FALSE',
  },
  {
    name: 'HANA Cloud Instance Metadata',
    sql: 'SELECT DATABASE_NAME, HOST, SQL_PORT, VERSION, STATUS FROM M_DATABASE',
  },
  {
    name: 'ReturnPath Tables Overview',
    sql: 'SELECT TABLE_NAME, TABLE_TYPE, RECORD_COUNT FROM M_TABLES WHERE SCHEMA_NAME = \'RETURNPATH\'',
  },
];

export const SAPHanaView: React.FC<SAPHanaViewProps> = ({ store }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('guide');
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
    realHanaCounts?: Record<string, number>;
    statementsExecuted?: number;
    latencyMs?: number;
  } | null>(null);

  // Connection form state
  const [hostInput, setHostInput] = useState('');
  const [portInput, setPortInput] = useState('443');
  const [userInput, setUserInput] = useState('DBADMIN');
  const [passwordInput, setPasswordInput] = useState('');
  const [schemaInput, setSchemaInput] = useState('RETURNPATH');
  const [encryptInput, setEncryptInput] = useState(true);
  const [validateCertInput, setValidateCertInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // SQL Query sandbox state
  const [sqlInput, setSqlInput] = useState(PRESET_QUERIES[0].sql);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[];
    rowCount: number;
    executionMs: number;
    engine: string;
    mode: string;
    error?: string;
  } | null>(null);

  // Schema state
  const [schemaInfo, setSchemaInfo] = useState<any>(null);
  const [schemaDeploying, setSchemaDeploying] = useState(false);
  const [schemaDeployLogs, setSchemaDeployLogs] = useState<string[]>([]);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
    fetchSchemaInfo();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/sap-hana/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.fullHost) setHostInput(data.fullHost);
        if (data.port) setPortInput(String(data.port));
        if (data.user) setUserInput(data.user);
        if (data.schema) setSchemaInput(data.schema);
        if (data.encrypt !== undefined) setEncryptInput(data.encrypt);
        if (data.sslValidateCertificate !== undefined) setValidateCertInput(data.sslValidateCertificate);
      }
    } catch (e) {
      console.error('Failed to fetch HANA status:', e);
    }
  };

  const fetchSchemaInfo = async () => {
    try {
      const res = await fetch('/api/sap-hana/schema-info');
      if (res.ok) {
        const data = await res.json();
        setSchemaInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch schema info:', e);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/sap-hana/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: hostInput,
          port: portInput,
          user: userInput,
          password: passwordInput,
          schema: schemaInput,
          encrypt: encryptInput,
          sslValidateCertificate: validateCertInput,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      await fetchStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err?.message || 'Connection test failed',
        troubleshooting: ['Verify network connectivity and Cloud Run outgoing access.'],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeploySchema = async () => {
    setSchemaDeploying(true);
    setSchemaDeployLogs([]);
    try {
      const res = await fetch('/api/sap-hana/init-schema', { method: 'POST' });
      const data = await res.json();
      if (data.results) {
        setSchemaDeployLogs(data.results);
      }
      await fetchSchemaInfo();
    } catch (err: any) {
      setSchemaDeployLogs(['Schema initialization error: ' + err?.message]);
    } finally {
      setSchemaDeploying(false);
    }
  };

  const handleSyncPush = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    setSyncResult(null);
    try {
      const userState = store.getState();
      const res = await fetch('/api/sap-hana/sync-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: userState.profile,
          skills: userState.skills,
          learningMilestones: userState.learningMilestones,
          readinessScore: 78,
        }),
      });
      const data = await res.json();
      setSyncResult(data);
      if (!res.ok || data.success === false) {
        setSyncMessage(data.message || data.error || 'Failed to sync data to SAP HANA Cloud');
      } else {
        setSyncMessage(data.message || 'Data synchronized & COMMITTED successfully into SAP HANA Cloud!');
      }
      await fetchSchemaInfo();
      await fetchStatus();
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: 'Network or server error executing push: ' + (err?.message || err),
        error: err?.message || String(err),
      });
      setSyncMessage('Sync failed: ' + err?.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleExecuteQuery = async (queryToRun?: string) => {
    const q = queryToRun || sqlInput;
    if (!q.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await fetch('/api/sap-hana/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: q }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setQueryResult({
          columns: [],
          rows: [],
          rowCount: 0,
          executionMs: 0,
          engine: 'SAP HANA Query Engine',
          mode: 'ERROR',
          error: data.error || 'SQL execution failed',
        });
      } else {
        setQueryResult(data);
      }
    } catch (err: any) {
      setQueryResult({
        columns: [],
        rows: [],
        rowCount: 0,
        executionMs: 0,
        engine: 'SAP HANA Query Engine',
        mode: 'ERROR',
        error: err?.message || 'Network error executing query',
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isLive = status?.connectionStatus?.success === true;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F5F6F7]">
      {/* Top Banner / Status Overview */}
      <div className="bg-white border-b border-[#D5DADD] px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-[6px] flex items-center justify-center border ${
              isLive 
                ? 'bg-[#188918]/10 border-[#188918]/30 text-[#188918]'
                : 'bg-[#0070F2]/10 border-[#0070F2]/30 text-[#0070F2]'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-[#1D2D3E]">
                  SAP HANA Cloud Integration Center
                </h2>
                <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold flex items-center gap-1 ${
                  isLive
                    ? 'bg-[#188918]/10 text-[#188918] border border-[#188918]/30'
                    : 'bg-[#E9730C]/10 text-[#E9730C] border border-[#E9730C]/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#188918] animate-pulse' : 'bg-[#E9730C]'}`} />
                  {isLive ? 'Live HANA Cloud Active' : 'Sandbox Simulator Mode'}
                </span>
              </div>
              <p className="text-xs text-[#556B82] mt-0.5">
                Connect your SAP BTP Free Trial instance or run live analytical queries in the sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('sandbox');
                handleExecuteQuery();
              }}
              className="px-3 py-1.5 bg-[#EBF5FF] hover:bg-[#d8ecff] text-[#0070F2] border border-[#0070F2]/30 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>SQL Sandbox</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('connection');
              }}
              className="px-3 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Configure Trial Instance</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-6 border-b border-[#EAEDEF] -mb-5">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-[#0070F2] text-[#0070F2]'
                : 'border-transparent text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Step-by-Step Trial Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('connection')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'connection'
                ? 'border-[#0070F2] text-[#0070F2]'
                : 'border-transparent text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Connection & Health</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-[#0070F2] text-[#0070F2]'
                : 'border-transparent text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schema & Tables</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'sync'
                ? 'border-[#0070F2] text-[#0070F2]'
                : 'border-transparent text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Live Data Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'sandbox'
                ? 'border-[#0070F2] text-[#0070F2]'
                : 'border-transparent text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live SQL Sandbox</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-6">

        {/* Global Live Connection Success Banner with Returned User and Schema */}
        {(isLive || testResult?.success) && (
          <div className="bg-[#E7F6E7] border border-[#188918]/40 p-4 rounded-[6px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#188918] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-[#188918]">
                    SAP HANA Cloud: Live Handshake Verified
                  </span>
                  <span className="text-[11px] bg-[#188918] text-white px-2 py-0.5 rounded font-mono font-bold">
                    {testResult?.latencyMs || status?.connectionStatus?.latencyMs || 24}ms Latency
                  </span>
                  <span className="text-[11px] bg-white text-[#556B82] border border-[#D5DADD] px-2 py-0.5 rounded font-mono">
                    {testResult?.serverVersion || status?.connectionStatus?.serverVersion || 'SAP HANA Cloud 4.0'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#1D2D3E]">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#556B82]">Connected User:</span>
                    <strong className="font-mono text-[#0070F2] bg-white px-2 py-0.5 rounded border border-[#188918]/30 font-bold">
                      {testResult?.currentUser || status?.connectionStatus?.currentUser || userInput || 'DBADMIN'}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#556B82]">Current Schema:</span>
                    <strong className="font-mono text-[#0070F2] bg-white px-2 py-0.5 rounded border border-[#188918]/30 font-bold">
                      {testResult?.currentSchema || status?.connectionStatus?.currentSchema || schemaInput || 'RETURNPATH'}
                    </strong>
                  </span>
                  {status?.fullHost && (
                    <span className="text-[#556B82] font-mono text-[11px]">
                      Endpoint: {status.fullHost}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                onClick={() => {
                  setActiveTab('sandbox');
                  const checkQuery = 'SELECT CURRENT_USER AS CONNECTED_USER, CURRENT_SCHEMA AS CONNECTED_SCHEMA, CURRENT_TIMESTAMP AS CURRENT_SERVER_TIME FROM DUMMY';
                  setSqlInput(checkQuery);
                  handleExecuteQuery(checkQuery);
                }}
                className="px-3 py-1.5 bg-white hover:bg-[#F5F6F7] text-[#188918] border border-[#188918]/40 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Run Query FROM DUMMY</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: BTP STEP-BY-STEP TRIAL GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            {/* Hero / Value Callout */}
            <div className="bg-gradient-to-r from-[#0070F2]/10 via-white to-transparent p-6 rounded-[6px] border border-[#0070F2]/30 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0070F2] block font-display">
                Option 1: SAP HANA Cloud SQL Connector & Live Query Sandbox
              </span>
              <h3 className="text-base font-bold text-[#1D2D3E] font-display">
                How to Connect Your SAP BTP Free Trial in 5 Simple Steps
              </h3>
              <p className="text-xs text-[#556B82] leading-relaxed max-w-3xl">
                You already have your SAP HANA Cloud free trial! This platform integrates natively via the official 
                <code className="text-[#0070F2] font-mono mx-1 px-1 bg-white border border-[#D5DADD] rounded">@sap/hana-client</code> driver.
                Follow the 5 steps below to extract your credentials from the SAP BTP Cockpit and test live queries right now.
              </p>
            </div>

            {/* Step-by-Step Card Flow */}
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="bg-white p-5 rounded-[6px] border border-[#D5DADD] hover:border-[#0070F2] transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#0070F2] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-sm font-bold text-[#1D2D3E] font-display">
                      Open SAP BTP Cockpit & Go to SAP HANA Cloud
                    </h4>
                  </div>
                  <a
                    href="https://cockpit.hanatrial.ondemand.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#0070F2] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Open SAP BTP Cockpit</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-[#556B82] pl-9 leading-relaxed">
                  Log in to your SAP BTP Trial account. Navigate to your <strong>Subaccount</strong> (usually named <code className="text-[#1D2D3E] bg-[#F5F6F7] px-1 py-0.5 rounded">trial</code>) &rarr; Click <strong>SAP HANA Cloud</strong> on the left menu (or launch SAP HANA Cloud Central).
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-5 rounded-[6px] border border-[#D5DADD] hover:border-[#0070F2] transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#0070F2] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-sm font-bold text-[#1D2D3E] font-display">
                      Ensure Instance Status is "Running" (Important for Free Trial!)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-[#E9730C] bg-[#E9730C]/10 px-2 py-0.5 rounded">
                    Nightly Sleep Policy
                  </span>
                </div>
                <div className="pl-9 space-y-2 text-xs text-[#556B82]">
                  <p className="leading-relaxed">
                    SAP BTP Free Trial instances automatically <strong>stop/pause every 24 hours</strong> to conserve trial credits.
                  </p>
                  <div className="p-3 bg-[#FFF8EB] border border-[#E9730C]/30 rounded-[4px] text-[#1D2D3E] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#E9730C] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>If your instance says "Stopped":</strong> Click the three dots (<code className="font-bold">...</code>) on the right side of your instance row and select <strong>"Start"</strong>. Wait 2–3 minutes until the green dot indicates <strong>"Running"</strong>.
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-5 rounded-[6px] border border-[#D5DADD] hover:border-[#0070F2] transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#0070F2] text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h4 className="text-sm font-bold text-[#1D2D3E] font-display">
                      Configure IP Allowlist: "Allow All IP Addresses"
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-[#188918] bg-[#188918]/10 px-2 py-0.5 rounded">
                    Required for Cloud Access
                  </span>
                </div>
                <div className="pl-9 space-y-2 text-xs text-[#556B82]">
                  <p className="leading-relaxed">
                    By default, SAP HANA Cloud blocks all incoming public traffic. To allow ReturnPath to connect:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-[#1D2D3E]">
                    <li>Click the three dots (<code className="font-bold">...</code>) on your HANA Cloud instance and choose <strong>"Manage Configuration"</strong>.</li>
                    <li>Scroll down to <strong>"Connections" / "Allowed IP Addresses"</strong>.</li>
                    <li>Select the radio button <strong>"Allow all IP addresses"</strong> (or add <code className="font-mono text-[#0070F2]">0.0.0.0/0</code>).</li>
                    <li>Click <strong>Save</strong> to apply.</li>
                  </ol>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white p-5 rounded-[6px] border border-[#D5DADD] hover:border-[#0070F2] transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#0070F2] text-white text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <h4 className="text-sm font-bold text-[#1D2D3E] font-display">
                      Copy Hostname, Port, and Master Password
                    </h4>
                  </div>
                </div>
                <div className="pl-9 space-y-2 text-xs text-[#556B82]">
                  <p>In SAP HANA Cloud Central, locate the connection details:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-[#F5F6F7] p-2.5 rounded-[4px] border border-[#EAEDEF]">
                      <span className="text-[10px] uppercase font-bold text-[#556B82] block">SQL Endpoint / Host</span>
                      <span className="font-mono text-[#1D2D3E] text-[11px]">
                        xxxx-xxxx.hanacloud.ondemand.com
                      </span>
                    </div>
                    <div className="bg-[#F5F6F7] p-2.5 rounded-[4px] border border-[#EAEDEF]">
                      <span className="text-[10px] uppercase font-bold text-[#556B82] block">Port & User</span>
                      <span className="font-mono text-[#1D2D3E] text-[11px]">Port: 443 | User: DBADMIN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-white p-5 rounded-[6px] border border-[#D5DADD] hover:border-[#0070F2] transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#0070F2] text-white text-xs font-bold flex items-center justify-center">
                      5
                    </span>
                    <h4 className="text-sm font-bold text-[#1D2D3E] font-display">
                      Test Connection & Sync Your ReturnPath Memory!
                    </h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('connection')}
                    className="px-3 py-1 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Go to Connection Tab</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-[#556B82] pl-9 leading-relaxed">
                  Enter your Host and Password in the Connection tab and click <strong>"Test Connection"</strong>.
                  Once verified, initialize the schema with 1 click to create your <code className="text-[#0070F2]">RETURNPATH_*</code> column tables in SAP HANA Cloud!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONNECTION & HEALTH DIAGNOSTIC */}
        {activeTab === 'connection' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Form */}
              <div className="lg:col-span-2 bg-white p-6 rounded-[6px] border border-[#D5DADD] space-y-5">
                <div className="border-b border-[#EAEDEF] pb-3">
                  <h3 className="text-sm font-bold font-display text-[#1D2D3E]">
                    SAP HANA Cloud Connection Parameters
                  </h3>
                  <p className="text-xs text-[#556B82] mt-0.5">
                    Credentials connect securely over TLS port 443 using the native SAP driver
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#1D2D3E] block mb-1">
                      SAP HANA Cloud Hostname <span className="text-[#D20A0A]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5cb97d19-xxxx-4062-a5ea-xxxxxxxxxxxx.hanacloud.ondemand.com"
                      value={hostInput}
                      onChange={e => setHostInput(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 border border-[#D5DADD] rounded-[4px] focus:outline-none focus:border-[#0070F2]"
                    />
                    <span className="text-[10px] text-[#556B82] mt-1 block">
                      Found in SAP HANA Cloud Central &rarr; Copy SQL Endpoint (do not include "https://" or ":443")
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#1D2D3E] block mb-1">
                        Port
                      </label>
                      <input
                        type="text"
                        value={portInput}
                        onChange={e => setPortInput(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 border border-[#D5DADD] rounded-[4px] focus:outline-none focus:border-[#0070F2]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#1D2D3E] block mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 border border-[#D5DADD] rounded-[4px] focus:outline-none focus:border-[#0070F2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#1D2D3E] block mb-1">
                        Master Password <span className="text-[#D20A0A]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Your DBADMIN password"
                          value={passwordInput}
                          onChange={e => setPasswordInput(e.target.value)}
                          className="w-full text-xs font-mono px-3 py-2 pr-9 border border-[#D5DADD] rounded-[4px] focus:outline-none focus:border-[#0070F2]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-[#556B82] hover:text-[#1D2D3E]"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#1D2D3E] block mb-1">
                        Schema
                      </label>
                      <input
                        type="text"
                        value={schemaInput}
                        onChange={e => setSchemaInput(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 border border-[#D5DADD] rounded-[4px] focus:outline-none focus:border-[#0070F2]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 text-xs text-[#1D2D3E] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={encryptInput}
                        onChange={e => setEncryptInput(e.target.checked)}
                        className="rounded border-[#D5DADD] text-[#0070F2] focus:ring-[#0070F2]"
                      />
                      <span>Enable TLS Encryption (<code className="text-[#0070F2]">encrypt=TRUE</code>)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#1D2D3E] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={validateCertInput}
                        onChange={e => setValidateCertInput(e.target.checked)}
                        className="rounded border-[#D5DADD] text-[#0070F2] focus:ring-[#0070F2]"
                      />
                      <span>Validate SSL Certificate (Disable for Trial)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAEDEF] flex items-center justify-between">
                  <div className="text-[11px] text-[#556B82]">
                    {isLive ? (
                      <span className="text-[#188918] font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Connected to SAP HANA Cloud
                      </span>
                    ) : (
                      <span>Running in Sandbox Mode until live connection is tested</span>
                    )}
                  </div>

                  <button
                    onClick={handleTestConnection}
                    disabled={loading || !hostInput}
                    className="px-4 py-2 bg-[#0070F2] hover:bg-[#0064D9] disabled:bg-[#556B82]/20 disabled:text-[#556B82] text-white rounded-[4px] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testing Connection Handshake...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Test Live Connection</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Col: Diagnostics & Test Feedback */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-[6px] border border-[#D5DADD] space-y-3">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[#556B82]">
                    Connection Diagnostics
                  </h4>

                  {testResult ? (
                    testResult.success ? (
                      <div className="p-3.5 bg-[#188918]/10 border border-[#188918]/30 rounded-[6px] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#188918] font-bold text-xs">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span>Handshake Successful!</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-[#188918] text-white px-2 py-0.5 rounded">
                            {testResult.latencyMs} ms
                          </span>
                        </div>

                        {/* Distinct User and Schema Badges */}
                        <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-[4px] border border-[#188918]/20">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#556B82] block">
                              Connected User
                            </span>
                            <span className="font-mono text-xs font-bold text-[#0070F2] break-all">
                              {testResult.currentUser}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#556B82] block">
                              Current Schema
                            </span>
                            <span className="font-mono text-xs font-bold text-[#0070F2] break-all">
                              {testResult.currentSchema}
                            </span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-[#EAEDEF]">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#556B82] block">
                              HANA DUMMY Query
                            </span>
                            <span className="font-mono text-[10px] text-[#188918] block leading-tight">
                              SELECT CURRENT_USER AS CONNECTED_USER, CURRENT_SCHEMA AS CONNECTED_SCHEMA FROM DUMMY
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-[#556B82] flex items-center justify-between">
                          <span>Server: <strong className="text-[#1D2D3E] font-mono">{testResult.serverVersion}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-[#D20A0A]/10 border border-[#D20A0A]/30 rounded-[4px] space-y-2">
                        <div className="flex items-center gap-2 text-[#D20A0A] font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>Connection Error</span>
                        </div>
                        <p className="text-[11px] font-mono text-[#D20A0A] bg-white p-2 rounded border border-[#D20A0A]/20 break-all">
                          {testResult.error}
                        </p>
                        {testResult.troubleshooting && (
                          <div className="pt-2 text-[11px] text-[#1D2D3E] space-y-1">
                            <strong className="block text-[10px] uppercase font-bold text-[#556B82]">
                              Troubleshooting Checklist:
                            </strong>
                            {testResult.troubleshooting.map((t: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <span className="text-[#0070F2] font-bold">&bull;</span>
                                <span>{t}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-[#556B82] p-4 bg-[#F5F6F7] rounded text-center">
                      Enter your SAP HANA host and password on the left and click "Test Live Connection".
                    </div>
                  )}
                </div>

                {/* Driver Info Card */}
                <div className="bg-white p-5 rounded-[6px] border border-[#D5DADD] space-y-2 text-xs">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[#556B82]">
                    Integration Driver
                  </h4>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#556B82]">Package:</span>
                    <span className="font-mono font-semibold text-[#1D2D3E]">@sap/hana-client</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#556B82]">Protocol:</span>
                    <span className="font-mono text-[#1D2D3E]">SQLDBC / TLS 1.3</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#556B82]">Target Platform:</span>
                    <span className="text-[#0070F2] font-semibold">SAP BTP Kyma / HANA Cloud</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SCHEMA & TABLE MANAGER */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold font-display text-[#1D2D3E]">
                  ReturnPath Relational Schema in SAP HANA
                </h3>
                <p className="text-xs text-[#556B82] mt-0.5">
                  High-performance Column Tables storing returner career profiles, dynamic skills, and readiness audits
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSchemaInfo}
                  className="px-3 py-1.5 bg-[#F5F6F7] hover:bg-[#EBF5FF] text-[#0070F2] border border-[#D5DADD] hover:border-[#0070F2]/40 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Counts (SELECT COUNT)</span>
                </button>

                <button
                  onClick={handleDeploySchema}
                  disabled={schemaDeploying}
                  className="px-3.5 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] disabled:opacity-50 text-white rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {schemaDeploying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing DDL...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>Deploy / Verify Tables</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {schemaDeployLogs.length > 0 && (
              <div className="p-4 bg-[#1D2D3E] text-white rounded-[6px] font-mono text-xs space-y-1">
                <span className="text-[#188918] font-bold block mb-2">&gt; DDL Execution Output:</span>
                {schemaDeployLogs.map((log, idx) => (
                  <p key={idx} className="text-[#D5DADD]">{log}</p>
                ))}
              </div>
            )}

            {/* Table Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemaInfo?.tables?.map((tbl: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-[6px] border border-[#D5DADD] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#EAEDEF] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#0070F2]" />
                      <span className="font-mono font-bold text-xs text-[#1D2D3E]">{tbl.name}</span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 font-mono ${
                      tbl.isLiveCount
                        ? 'text-[#188918] bg-[#188918]/10 border border-[#188918]/30 font-bold'
                        : 'text-[#556B82] bg-[#F5F6F7] border border-[#EAEDEF]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tbl.isLiveCount ? 'bg-[#188918]' : 'bg-[#556B82]'}`} />
                      <span>{tbl.recordCount} rows</span>
                      {tbl.isLiveCount && <span className="text-[9px] uppercase font-bold text-[#188918]">(Live COUNT)</span>}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#556B82] block">Columns</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tbl.columns.map((col: string, cIdx: number) => (
                        <span key={cIdx} className="text-[10px] font-mono bg-[#F5F6F7] text-[#1D2D3E] px-2 py-0.5 rounded border border-[#EAEDEF]">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-[11px] text-[#556B82]">
                    <span>Table Type: <strong className="text-[#1D2D3E]">{tbl.type}</strong></span>
                    <button
                      onClick={() => {
                        setActiveTab('sandbox');
                        const q = `SELECT * FROM ${tbl.name}`;
                        setSqlInput(q);
                        handleExecuteQuery(q);
                      }}
                      className="text-[#0070F2] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Query Table</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LIVE DATA SYNC */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[6px] border border-[#D5DADD] space-y-5 shadow-sm">
              <div className="border-b border-[#EAEDEF] pb-3">
                <h3 className="text-sm font-bold font-display text-[#1D2D3E]">
                  Synchronize ReturnPath Candidate Memory with SAP HANA Cloud
                </h3>
                <p className="text-xs text-[#556B82] mt-0.5">
                  Execute INSERT / UPSERT statements for all 4 tables directly against SAP HANA Cloud and COMMIT the transaction
                </p>
              </div>

              {/* Sync Feedback Message or Error */}
              {syncResult && (
                syncResult.success ? (
                  <div className="p-4 bg-[#188918]/10 border border-[#188918]/30 rounded-[6px] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#188918] font-bold text-xs">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Transaction COMMITTED to SAP HANA Cloud</span>
                      </div>
                      {syncResult.latencyMs !== undefined && (
                        <span className="text-[10px] font-mono font-bold bg-[#188918] text-white px-2 py-0.5 rounded">
                          {syncResult.latencyMs} ms
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#1D2D3E]">{syncResult.message}</p>

                    {syncResult.realHanaCounts && (
                      <div className="pt-2 border-t border-[#188918]/20">
                        <span className="text-[10px] uppercase font-bold text-[#556B82] block mb-1.5">
                          Verified Live Row Counts (SELECT COUNT from SAP HANA):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(syncResult.realHanaCounts).map(([tbl, cnt]) => (
                            <div key={tbl} className="bg-white p-2 rounded border border-[#188918]/30">
                              <span className="text-[9px] font-mono text-[#556B82] block truncate" title={tbl}>
                                {tbl.replace('RETURNPATH_', '')}
                              </span>
                              <span className="text-xs font-bold text-[#0070F2] font-mono">
                                {cnt} rows
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#D20A0A]/10 border border-[#D20A0A]/30 rounded-[6px] space-y-2">
                    <div className="flex items-center gap-2 text-[#D20A0A] font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>SAP HANA SQL Execution / Commit Error</span>
                    </div>
                    <p className="text-xs font-mono text-[#D20A0A] bg-white p-2.5 rounded border border-[#D20A0A]/20 break-all">
                      {syncResult.error || syncResult.message}
                    </p>
                    <p className="text-[11px] text-[#556B82]">
                      Tip: If tables do not exist yet in your schema, click <strong>"Deploy / Verify Tables"</strong> in the <strong>Schema & Tables</strong> tab first.
                    </p>
                  </div>
                )
              )}

              {syncMessage && !syncResult && (
                <div className="p-3 bg-[#EBF5FF] border border-[#0070F2]/30 rounded-[4px] text-xs text-[#0070F2] font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{syncMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F5F6F7] rounded-[4px] border border-[#EAEDEF] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#556B82] block">Local State to Push</span>
                  <div className="text-xs space-y-1 text-[#1D2D3E]">
                    <p>&bull; <strong>Candidate:</strong> {store.getState().profile.fullName || 'Sarah Jenkins'}</p>
                    <p>&bull; <strong>Skills to UPSERT:</strong> {store.getState().skills.length || 4} skills</p>
                    <p>&bull; <strong>Milestones to UPSERT:</strong> {store.getState().learningMilestones.length || 3} milestones</p>
                    <p>&bull; <strong>Readiness Score:</strong> 78 (Audit Log)</p>
                  </div>
                </div>

                <div className="p-4 bg-[#F5F6F7] rounded-[4px] border border-[#EAEDEF] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#556B82] block">Target Destination</span>
                  <div className="text-xs space-y-1 text-[#1D2D3E]">
                    <p>&bull; <strong>HANA Host:</strong> {status?.fullHost || 'Configured Instance'}</p>
                    <p>&bull; <strong>Target Schema:</strong> {schemaInput}</p>
                    <p>&bull; <strong>Transaction Strategy:</strong> Multi-Table UPSERT + COMMIT</p>
                  </div>
                </div>
              </div>

              {/* Current Live HANA Table Overview */}
              {schemaInfo?.tables && (
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-[#556B82] block mb-2">
                    Current Database Table Status in SAP HANA:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {schemaInfo.tables.map((t: any) => (
                      <div key={t.name} className="p-2 bg-[#F5F6F7] rounded border border-[#EAEDEF]">
                        <span className="text-[9px] font-mono text-[#556B82] block truncate">
                          {t.name.replace('RETURNPATH_', '')}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#1D2D3E]">
                          {t.recordCount} rows {t.isLiveCount ? '(live)' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#EAEDEF] flex items-center justify-between">
                <span className="text-[11px] text-[#556B82]">
                  Clicking push executes SQL statements on your live HANA connection and commits them to disk.
                </span>

                <button
                  onClick={handleSyncPush}
                  disabled={syncLoading}
                  className="px-4 py-2 bg-[#0070F2] hover:bg-[#0064D9] disabled:opacity-50 text-white rounded-[4px] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {syncLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing UPSERT &amp; COMMIT...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Push ReturnPath Data to SAP HANA</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LIVE SQL SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            {/* Presets & Query Input */}
            <div className="bg-white p-5 rounded-[6px] border border-[#D5DADD] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold font-display text-[#1D2D3E]">
                    Live SAP HANA SQL Query Sandbox
                  </h3>
                  <p className="text-xs text-[#556B82]">
                    Execute standard SAP HANA SQL commands against your database tables
                  </p>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#556B82] mr-1">Templates:</span>
                  {PRESET_QUERIES.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSqlInput(p.sql);
                        handleExecuteQuery(p.sql);
                      }}
                      className="px-2 py-1 text-[11px] bg-[#F5F6F7] hover:bg-[#EBF5FF] text-[#1D2D3E] hover:text-[#0070F2] border border-[#D5DADD] hover:border-[#0070F2]/40 rounded-[4px] font-medium transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* SQL Textarea */}
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={sqlInput}
                  onChange={e => setSqlInput(e.target.value)}
                  placeholder="SELECT * FROM RETURNPATH_SKILLS..."
                  className="w-full font-mono text-xs p-3 bg-[#1D2D3E] text-[#D5DADD] rounded-[4px] border border-[#D5DADD] focus:outline-none focus:border-[#0070F2]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] text-[#556B82]">
                  Engine: <strong className="text-[#1D2D3E]">{isLive ? 'SAP HANA Cloud (Live)' : 'Simulator Sandbox'}</strong>
                </div>

                <button
                  onClick={() => handleExecuteQuery()}
                  disabled={queryLoading || !sqlInput.trim()}
                  className="px-4 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] disabled:opacity-50 text-white rounded-[4px] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {queryLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Run Query (Ctrl + Enter)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Grid */}
            {queryResult && (
              <div className="bg-white rounded-[6px] border border-[#D5DADD] overflow-hidden space-y-0">
                {/* Result Header Bar */}
                <div className="px-5 py-3 bg-[#F5F6F7] border-b border-[#EAEDEF] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#1D2D3E] font-display">Query Results</span>
                    <span className="text-[#556B82]">
                      {queryResult.rowCount} rows returned in <strong className="text-[#0070F2]">{queryResult.executionMs}ms</strong>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#556B82]">
                    Engine: {queryResult.engine}
                  </span>
                </div>

                {queryResult.error ? (
                  <div className="p-4 bg-[#D20A0A]/10 text-[#D20A0A] font-mono text-xs">
                    Error: {queryResult.error}
                  </div>
                ) : queryResult.rows.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#556B82]">
                    No rows returned by query.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F5F6F7] border-b border-[#EAEDEF] text-[#556B82] uppercase text-[10px] font-bold">
                          {queryResult.columns.map((col, idx) => (
                            <th key={idx} className="p-3 font-semibold font-mono">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEDEF]">
                        {queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#F5F6F7]/60 transition-colors">
                            {queryResult.columns.map((col, cIdx) => {
                              const val = row[col];
                              return (
                                <td key={cIdx} className="p-3 font-mono text-[#1D2D3E] whitespace-nowrap">
                                  {typeof val === 'boolean'
                                    ? val ? 'TRUE' : 'FALSE'
                                    : val === null || val === undefined
                                    ? <span className="text-[#556B82] italic">null</span>
                                    : String(val)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
