import React from 'react';
import { X, Database, Cpu, Layers, Cloud, Users, CheckCircle } from 'lucide-react';

interface SAPMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SAPMappingModal: React.FC<SAPMappingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const mappings = [
    {
      domain: 'Persistent Memory Store',
      prototype: 'MemoryStore Interface (SQLite / Local JSON)',
      sapTarget: 'SAP HANA Cloud (Relational + Vector Engine)',
      description: 'Career memories, profile, and skill confidence levels persist into structured SAP HANA Cloud tables, with vector embeddings for semantic skill matching.',
      status: 'Ready for Adapter Integration',
    },
    {
      domain: 'LLM & Agent Reasoning',
      prototype: 'Server-Side Google GenAI SDK (gemini-3.8-flash)',
      sapTarget: 'SAP AI Core / Generative AI Hub',
      description: 'Orchestrated prompt engineering, JSON schema enforcement, and ATS token matching execute via the enterprise-governed SAP Generative AI Hub proxy.',
      status: 'Direct API Endpoint Swap',
    },
    {
      domain: 'Conversational Orchestration',
      prototype: 'Single Career Companion + Sub-Agents',
      sapTarget: 'SAP Joule (Enterprise Digital Assistant)',
      description: 'ReturnPath companion capabilities can be exposed as specialized Joule skills and cards inside the SAP Fiori launchpad.',
      status: 'Skill Architecture Aligned',
    },
    {
      domain: 'Hosting & Deployment Target',
      prototype: 'Node.js Express + React Vite Server',
      sapTarget: 'SAP Business Technology Platform (SAP BTP Kyma / Cloud Foundry)',
      description: 'Multi-tenant enterprise container deployment running natively on SAP BTP with SAP Cloud Connector integration.',
      status: 'Container Ready',
    },
    {
      domain: 'Workforce & Talent Profile',
      prototype: 'Structured JSON Profile & Skill History',
      sapTarget: 'SAP SuccessFactors (Opportunity Marketplace & Learning)',
      description: 'Bi-directional synchronization: completed return-to-work milestones update employee talent profiles and open mentoring slots.',
      status: 'OData API Compatible',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-2xl bg-white rounded-[6px] border border-[#D5DADD] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEDEF] bg-[#F5F6F7]">
          <div>
            <span className="section-label text-[#0070F2]">Phase 8 Architecture Mapping</span>
            <h3 className="text-base font-bold font-display text-[#1D2D3E]">
              SAP Ecosystem Enterprise Alignment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#556B82] hover:text-[#1D2D3E] hover:bg-white rounded-[4px] border border-transparent hover:border-[#D5DADD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          <div className="p-3 bg-[#EBF5FF] border border-[#0070F2]/20 rounded-[6px] text-xs text-[#1D2D3E] leading-relaxed">
            <strong>Enterprise Architecture Design:</strong> ReturnPath is intentionally decoupled through clean interfaces (<code className="font-mono text-[#0070F2]">MemoryStore</code>, <code className="font-mono text-[#0070F2]">LLMProvider</code>). In production, this architecture drops directly into SAP BTP, connecting SAP HANA Cloud, Joule, and SAP SuccessFactors.
          </div>

          <div className="space-y-3">
            {mappings.map((m, idx) => (
              <div key={idx} className="p-3.5 border border-[#D5DADD] rounded-[6px] bg-white space-y-1.5 hover:border-[#0070F2] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display text-[#1D2D3E]">{m.domain}</span>
                  <span className="text-[11px] font-semibold text-[#188918] bg-[#188918]/10 px-2 py-0.5 rounded-[4px]">
                    {m.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#F5F6F7] p-2 rounded-[4px] border border-[#EAEDEF]">
                    <span className="text-[10px] uppercase font-bold text-[#556B82] block">Current Prototype</span>
                    <span className="font-mono text-[#1D2D3E] text-[11px]">{m.prototype}</span>
                  </div>
                  <div className="bg-[#EBF5FF] p-2 rounded-[4px] border border-[#0070F2]/20">
                    <span className="text-[10px] uppercase font-bold text-[#0070F2] block">SAP Target Service</span>
                    <span className="font-semibold text-[#1D2D3E] text-[11px]">{m.sapTarget}</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#556B82] pt-1">{m.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[#EAEDEF] bg-[#F5F6F7] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
