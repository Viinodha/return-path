import React, { useState, useEffect } from 'react';
import { memoryStore } from './lib/data/store';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ReadinessModal } from './components/layout/ReadinessModal';
import { SAPMappingModal } from './components/layout/SAPMappingModal';

import { CompanionView } from './components/views/CompanionView';
import { DashboardView } from './components/views/DashboardView';
import { CareerMemoryView } from './components/views/CareerMemoryView';
import { LearningPathView } from './components/views/LearningPathView';
import { ResumeView } from './components/views/ResumeView';
import { InterviewView } from './components/views/InterviewView';
import { JobsView } from './components/views/JobsView';
import { ReportView } from './components/views/ReportView';

import { calculateCareerReadiness } from './lib/readiness';
import { SEEDED_ROLES } from './lib/data/seed';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('companion');
  const [isReadinessOpen, setIsReadinessOpen] = useState(false);
  const [isSAPModalOpen, setIsSAPModalOpen] = useState(false);
  const [, setTick] = useState(0);

  // Subscribe to memory store updates
  useEffect(() => {
    const unsubscribe = memoryStore.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  const state = memoryStore.getState();
  const profile = state.profile;
  const skills = state.skills;
  const tools = state.tools;
  const milestones = state.learningMilestones;
  const projects = state.projects;
  const certs = state.certificates;
  const interviews = state.interviews;

  const targetRoleObj = SEEDED_ROLES.find(
    r => r.roleName.toLowerCase() === profile.targetRole?.toLowerCase()
  );

  const readiness = calculateCareerReadiness(
    targetRoleObj,
    skills,
    tools,
    milestones,
    projects,
    certs,
    interviews
  );

  const pageTitles: Record<NavTab, string> = {
    companion: 'Career Companion',
    dashboard: 'Executive Dashboard',
    memory: 'Career Memory Store',
    learning: 'Adaptive Learning Path',
    resume: 'Resume & ATS Scanner',
    interview: 'Practice & Project Coach',
    jobs: 'Job Matching & Alignment',
    report: 'Consultant Report & Strategy',
  };

  return (
    <div className="flex min-h-screen bg-[#F5F6F7] text-[#1D2D3E] font-sans antialiased">
      {/* 240px Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        onResetData={() => {
          memoryStore.resetToEmpty();
          localStorage.removeItem('returnpath_chat_history');
          window.location.reload();
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          pageTitle={pageTitles[activeTab]}
          readiness={readiness}
          targetRole={profile.targetRole}
          onOpenReadiness={() => setIsReadinessOpen(true)}
          onOpenSAPModal={() => setIsSAPModalOpen(true)}
        />

        <main className="flex-1 flex overflow-y-auto">
          {activeTab === 'companion' && (
            <CompanionView
              store={memoryStore}
              onNavigateToTab={tab => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              store={memoryStore}
              onNavigateToTab={tab => setActiveTab(tab as NavTab)}
              onOpenReadinessModal={() => setIsReadinessOpen(true)}
            />
          )}

          {activeTab === 'memory' && (
            <CareerMemoryView store={memoryStore} />
          )}

          {activeTab === 'learning' && (
            <LearningPathView
              store={memoryStore}
              onNavigateToTab={tab => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'resume' && (
            <ResumeView store={memoryStore} />
          )}

          {activeTab === 'interview' && (
            <InterviewView
              store={memoryStore}
              onNavigateToTab={tab => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsView
              store={memoryStore}
              onNavigateToTab={tab => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'report' && (
            <ReportView store={memoryStore} />
          )}
        </main>
      </div>

      {/* Modals */}
      <ReadinessModal
        metrics={readiness}
        targetRoleName={profile.targetRole}
        isOpen={isReadinessOpen}
        onClose={() => setIsReadinessOpen(false)}
        onNavigateToTab={tab => setActiveTab(tab as NavTab)}
      />

      <SAPMappingModal
        isOpen={isSAPModalOpen}
        onClose={() => setIsSAPModalOpen(false)}
      />
    </div>
  );
}
