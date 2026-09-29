import { jsPDF } from 'jspdf';
import { ATSScanResult, ResumeData, ConsultantReport, CustomJDAnalysis } from './types';

// Helper for clean multi-line text wrapping with automatic page overflow
function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  pageHeight: number = 280,
  bottomMargin: number = 20
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  let currentY = y;

  for (const line of lines) {
    if (currentY + lineHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

/**
 * Generates and downloads a clean, professional ATS Audit Diagnostic Report PDF
 */
export function exportATSScanToPDF(scan: ATSScanResult, targetRole: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header Banner
  doc.setFillColor(0, 112, 242); // #0070F2 Primary Blue
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RETURNPATH ATS SCANNER & DIAGNOSTIC REPORT', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Target Benchmark: ${targetRole}  |  Audit Date: ${new Date().toLocaleDateString()}`, margin + 6, y + 17);

  y += 28;

  // Overall Score Box
  doc.setFillColor(245, 246, 247);
  doc.setDrawColor(213, 218, 221);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  doc.setTextColor(29, 45, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OVERALL ATS COMPLIANCE SCORE:', margin + 6, y + 12);

  doc.setTextColor(0, 112, 242);
  doc.setFontSize(18);
  doc.text(`${scan.score} / 100 PTS`, margin + 120, y + 13);

  y += 26;

  // Breakdown Factors
  doc.setTextColor(29, 45, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AUDIT FACTOR BREAKDOWN', margin, y);
  y += 6;

  const factors = [
    { name: 'Keyword Alignment', score: `${scan.breakdown.keywordMatch} / 40 pts` },
    { name: 'Standard Section Structure', score: `${scan.breakdown.structure} / 20 pts` },
    { name: 'Bullet Action Verbs & Metrics', score: `${scan.breakdown.bulletQuality} / 20 pts` },
    { name: 'Header & Contact Parseability', score: `${scan.breakdown.parseability} / 10 pts` },
    { name: 'Readability & Word Count', score: `${scan.breakdown.readability} / 10 pts` },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  factors.forEach(f => {
    doc.setTextColor(85, 107, 130);
    doc.text(`• ${f.name}:`, margin + 4, y);
    doc.setTextColor(29, 45, 62);
    doc.setFont('helvetica', 'bold');
    doc.text(f.score, margin + 85, y);
    doc.setFont('helvetica', 'normal');
    y += 5.5;
  });

  y += 4;

  // Matched vs Missing Keywords
  doc.setDrawColor(234, 237, 239);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  doc.setTextColor(24, 137, 24); // Green
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Demonstrated Keywords (${scan.matchedKeywords.length}):`, margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  const matchedText = scan.matchedKeywords.length > 0 ? scan.matchedKeywords.join(', ') : 'None detected yet.';
  y = addWrappedText(doc, matchedText, margin + 4, y, contentWidth - 8, 4.5);

  y += 4;
  doc.setTextColor(231, 101, 0); // Orange
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Missing High-Priority Role Keywords (${scan.missingKeywords.length}):`, margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  const missingText = scan.missingKeywords.length > 0 ? scan.missingKeywords.join(', ') : 'All benchmark keywords present!';
  y = addWrappedText(doc, missingText, margin + 4, y, contentWidth - 8, 4.5);

  y += 6;

  // Prioritized Actionable Fixes
  if (scan.actionableFixes.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(29, 45, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('PRIORITIZED ACTIONABLE FIXES', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    scan.actionableFixes.forEach((fix, idx) => {
      doc.setTextColor(0, 112, 242);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}.`, margin + 2, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(29, 45, 62);
      y = addWrappedText(doc, fix, margin + 8, y, contentWidth - 12, 4.5);
      y += 2.5;
    });
  }

  // Weak Bullets Diagnostics
  if (scan.weakBullets.length > 0) {
    if (y > 210) {
      doc.addPage();
      y = 20;
    }

    y += 4;
    doc.setTextColor(231, 101, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('FLAGGED BULLETS & SUGGESTED ATS REWRITES', margin, y);
    y += 6;

    scan.weakBullets.forEach(wb => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(230, 230, 230);
      doc.rect(margin, y, contentWidth, 18, 'FD');

      doc.setTextColor(210, 10, 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`ORIGINAL (${wb.issue}):`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`"${wb.original.slice(0, 100)}"`, margin + 3, y + 8.5);

      doc.setTextColor(0, 112, 242);
      doc.setFont('helvetica', 'bold');
      doc.text('ATS SUGGESTED REWRITE:', margin + 3, y + 13);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`"${wb.suggestedRewrite.slice(0, 115)}"`, margin + 3, y + 16.5);

      y += 21;
    });
  }

  // Disclaimer footer
  if (y > 255) {
    doc.addPage();
    y = 20;
  }
  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  addWrappedText(
    doc,
    `Disclaimer: ${scan.disclaimer || 'ReturnPath provides deterministic formatting alignment and parser heuristics. Enterprise ATS systems vary by vendor and employer configuration.'}`,
    margin,
    y,
    contentWidth,
    3.5
  );

  doc.save(`ReturnPath_ATS_Scan_Report_${targetRole.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generates and downloads a clean, single-column ATS formatted Resume PDF
 */
export function exportResumeToPDF(resume: ResumeData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Candidate Name
  doc.setTextColor(29, 45, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text((resume.fullName || 'Candidate Name').toUpperCase(), margin, y);
  y += 6;

  // Contact Info Line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(85, 107, 130);
  const contactParts = [resume.email, resume.phone, resume.location].filter(Boolean);
  doc.text(contactParts.join('  |  '), margin, y);
  y += 4;

  // Horizontal divider
  doc.setDrawColor(0, 112, 242);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Section Generator
  const renderSectionHeader = (title: string) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(0, 112, 242);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(title.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(213, 218, 221);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;
  };

  // 1. Professional Summary
  if (resume.summary) {
    renderSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    y = addWrappedText(doc, resume.summary, margin, y, contentWidth, 4.5);
    y += 4;
  }

  // 2. Career Break / Narrative (if present)
  if (resume.careerBreakNarrative) {
    renderSectionHeader('Career Break & Re-entry Narrative');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    y = addWrappedText(doc, resume.careerBreakNarrative, margin, y, contentWidth, 4.5);
    y += 4;
  }

  // 3. Core Skills & Technical Tools
  renderSectionHeader('Core Competencies & Technical Stack');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(29, 45, 62);
  doc.text('Key Skills:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  const skillsText = resume.skills.length > 0 ? resume.skills.join(', ') : 'Data Analysis, SQL, Reporting, Communication';
  y = addWrappedText(doc, skillsText, margin + 22, y, contentWidth - 22, 4.5);
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 45, 62);
  doc.text('Tools & Software:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  const toolsText = resume.tools.length > 0 ? resume.tools.join(', ') : 'Excel, Power BI, SQL, Python';
  y = addWrappedText(doc, toolsText, margin + 30, y, contentWidth - 30, 4.5);
  y += 5;

  // 4. Professional Experience
  if (resume.experiences && resume.experiences.length > 0) {
    renderSectionHeader('Professional Experience');

    for (const exp of resume.experiences) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(29, 45, 62);
      doc.text(exp.role || (exp as any).roleTitle || 'Professional Role', margin, y);

      const dateStr = `${exp.startDate} - ${exp.endDate}`;
      const dateWidth = doc.getTextWidth(dateStr);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(85, 107, 130);
      doc.text(dateStr, margin + contentWidth - dateWidth, y);

      y += 4.5;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 112, 242);
      doc.text(exp.company, margin, y);
      y += 4.5;

      // Bullets
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);
      const bulletList = exp.bullets || (exp as any).bulletPoints || [];
      for (const bullet of bulletList) {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }
        doc.text('•', margin + 2, y);
        y = addWrappedText(doc, bullet, margin + 6, y, contentWidth - 8, 4.2);
        y += 1.5;
      }
      y += 3;
    }
  }

  // 5. Projects & Re-entry Portfolio
  if (resume.projects && resume.projects.length > 0) {
    renderSectionHeader('Portfolio Projects & Artifacts');

    for (const proj of resume.projects) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(29, 45, 62);
      doc.text(proj.title, margin, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(85, 107, 130);
      const stackStr = `Tech Stack: ${proj.technologies.join(', ')}`;
      doc.text(stackStr, margin, y);
      y += 4.5;

      doc.setTextColor(40, 40, 40);
      doc.text('•', margin + 2, y);
      y = addWrappedText(doc, proj.expectedOutcome || proj.problemStatement, margin + 6, y, contentWidth - 8, 4.2);
      y += 3;
    }
  }

  // 6. Education
  if (resume.education && resume.education.length > 0) {
    renderSectionHeader('Education & Credentials');

    for (const edu of resume.education) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(29, 45, 62);
      doc.text(edu.degree, margin, y);

      const yearWidth = doc.getTextWidth(edu.year);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(85, 107, 130);
      doc.text(edu.year, margin + contentWidth - yearWidth, y);

      y += 4.5;
      doc.text(edu.institution, margin, y);
      y += 4.5;
    }
  }

  const fileName = `${(resume.fullName || 'Candidate').replace(/\s+/g, '_')}_Resume_ATS.pdf`;
  doc.save(fileName);
}

/**
 * Generates and downloads a clean Consultant Strategic Career Report PDF
 */
export function exportConsultantReportToPDF(report: ConsultantReport) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header Banner
  doc.setFillColor(0, 112, 242);
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RETURNPATH CAREER ADVISORY PRACTICE', margin + 6, y + 9);

  doc.setFontSize(10);
  doc.text('STRATEGIC CAREER RE-ENTRY REPORT', margin + 6, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Candidate: ${report.candidateName}  |  Target Role: ${report.targetRole}  |  Date: ${report.generatedAt}`, margin + 6, y + 21);

  y += 30;

  // Executive Summary Box
  doc.setFillColor(245, 246, 247);
  doc.setDrawColor(213, 218, 221);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setTextColor(0, 112, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('EXECUTIVE ASSESSMENT & READINESS', margin + 5, y + 7);

  doc.setTextColor(29, 45, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  addWrappedText(doc, report.executiveSummary, margin + 5, y + 13, contentWidth - 10, 4.2);

  y += 30;

  // Strengths vs Risks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 137, 24);
  doc.text('VERIFIED CORE STRENGTHS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  report.strengths.forEach(s => {
    doc.text('✓', margin + 2, y);
    y = addWrappedText(doc, s, margin + 7, y, contentWidth - 9, 4.2);
    y += 1.5;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(231, 101, 0);
  doc.text('IDENTIFIED STRATEGIC GAPS & RISKS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  report.identifiedRisks.forEach(r => {
    doc.text('!', margin + 2, y);
    y = addWrappedText(doc, r, margin + 7, y, contentWidth - 9, 4.2);
    y += 1.5;
  });

  // 30-60-90 Roadmap
  if (y > 210) {
    doc.addPage();
    y = 20;
  } else {
    y += 6;
  }

  doc.setDrawColor(0, 112, 242);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  doc.setTextColor(0, 112, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('STRATEGIC 30 / 60 / 90-DAY EXECUTION ROADMAP', margin, y);
  y += 7;

  const phases = [
    { title: 'Days 1 - 30: Foundation & Skill Verification', items: report.plan30Days },
    { title: 'Days 31 - 60: Artifacts, Projects & ATS Tuning', items: report.plan60Days },
    { title: 'Days 61 - 90: Interview Mastery & Target Applications', items: report.plan90Days },
  ];

  phases.forEach(p => {
    if (y > 245) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(235, 245, 255);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setTextColor(0, 112, 242);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(p.title, margin + 4, y + 5);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    p.items.forEach(it => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.text('•', margin + 4, y);
      y = addWrappedText(doc, it, margin + 9, y, contentWidth - 12, 4.2);
      y += 1.5;
    });
    y += 3;
  });

  doc.save(`ReturnPath_Consultant_Report_${report.targetRole.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generates and downloads a clean, professional Job Diagnostic & Re-entry Impact Report PDF
 */
export function exportJDAuditToPDF(analysis: CustomJDAnalysis) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header Banner
  doc.setFillColor(0, 112, 242);
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RETURNPATH JOB FIT & RE-ENTRY DIAGNOSTIC REPORT', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Role: ${analysis.jobTitle}  |  Employer: ${analysis.companyName}  |  Location: ${analysis.location}`, margin + 6, y + 17);

  y += 28;

  // Match Score & Verdict Card
  doc.setFillColor(245, 247, 249);
  doc.setDrawColor(213, 218, 221);
  doc.rect(margin, y, contentWidth, 24, 'FD');

  doc.setTextColor(0, 112, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`${analysis.matchScore}%`, margin + 6, y + 12);

  doc.setFontSize(8);
  doc.setTextColor(85, 107, 130);
  doc.text('OVERALL FIT SCORE', margin + 6, y + 18);

  // Verdict
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (analysis.verdict === 'Strong Opportunity') {
    doc.setTextColor(24, 137, 24);
  } else if (analysis.verdict === 'Viable with Bridge Plan') {
    doc.setTextColor(0, 112, 242);
  } else {
    doc.setTextColor(190, 40, 40);
  }
  doc.text(`Verdict: ${analysis.verdict}`, margin + 45, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  addWrappedText(doc, analysis.executiveSummary, margin + 45, y + 16, contentWidth - 50, 3.8);

  y += 30;

  // SECTION: WHY THIS JOB WOULD HURT
  doc.setTextColor(180, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('CRITICAL VULNERABILITIES & RISK FLAGS ("WHY THIS JOB WOULD HURT")', margin, y);
  y += 6;

  analysis.whyThisJobHurts.forEach(risk => {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(255, 240, 240);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(180, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`[${risk.riskLevel.toUpperCase()} RISK] ${risk.title}`, margin + 3, y + 4.2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    y = addWrappedText(doc, `Vulnerability: ${risk.detail}`, margin + 3, y, contentWidth - 6, 3.8);
    y += 1.5;

    doc.setTextColor(0, 100, 180);
    doc.setFont('helvetica', 'bold');
    doc.text('Mitigation Strategy:', margin + 3, y);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(doc, risk.mitigationStrategy, margin + 30, y, contentWidth - 33, 3.8);
    y += 4;
  });

  y += 3;

  // SECTION: POSITIVE POINTS & STRENGTHS
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(24, 137, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('POSITIVE POINTS & COMPETITIVE ADVANTAGES', margin, y);
  y += 6;

  analysis.positivePoints.forEach(pos => {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(235, 248, 235);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(20, 120, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`[${pos.impact.toUpperCase()}] ${pos.title}`, margin + 3, y + 4.2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    y = addWrappedText(doc, `Asset: ${pos.detail}`, margin + 3, y, contentWidth - 6, 3.8);
    y += 1.5;

    doc.setTextColor(24, 137, 24);
    doc.setFont('helvetica', 'bold');
    doc.text('How to Leverage:', margin + 3, y);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(doc, pos.howToLeverage, margin + 28, y, contentWidth - 31, 3.8);
    y += 4;
  });

  y += 3;

  // SECTION: DYNAMIC SKILLSET COMPARISON MATRIX
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(0, 112, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('DYNAMIC SKILLSET COMPARISON MATRIX (RETURNPATH VS JD)', margin, y);
  y += 6;

  // Table header
  doc.setFillColor(235, 240, 245);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Competency Demanded', margin + 3, y + 4.2);
  doc.text('Req. Level', margin + 70, y + 4.2);
  doc.text('Your Level', margin + 95, y + 4.2);
  doc.text('Status / Re-entry Guidance', margin + 120, y + 4.2);
  y += 8;

  analysis.skillComparisons.forEach(s => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(s.skillName, margin + 3, y);

    doc.setFont('helvetica', 'normal');
    doc.text(`Level ${s.requiredLevel}/5`, margin + 70, y);
    doc.text(`Level ${s.userLevel}/5`, margin + 95, y);

    if (s.status === 'mastered') {
      doc.setTextColor(24, 137, 24);
      doc.text('Mastered / Verified', margin + 120, y);
    } else if (s.status === 'developing') {
      doc.setTextColor(200, 120, 0);
      doc.text('Developing in ReturnPath', margin + 120, y);
    } else {
      doc.setTextColor(190, 40, 40);
      doc.text('Critical Vulnerability Gap', margin + 120, y);
    }

    y += 4;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7.5);
    y = addWrappedText(doc, s.reentryAdvice, margin + 6, y, contentWidth - 10, 3.5);
    y += 2.5;
  });

  // SECTION: INTERVIEW TALKING POINT
  if (y > 235) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(240, 245, 255);
  doc.setDrawColor(0, 112, 242);
  doc.rect(margin, y, contentWidth, 24, 'FD');

  doc.setTextColor(0, 112, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('STRATEGIC CAREER BREAK SCRIPT (FOR THIS SPECIFIC EMPLOYER):', margin + 4, y + 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  addWrappedText(doc, analysis.careerGapEvaluation.interviewTalkingPoint, margin + 4, y + 11, contentWidth - 8, 3.8);

  doc.save(`ReturnPath_Job_Diagnostic_${analysis.jobTitle.replace(/\s+/g, '_')}.pdf`);
}
