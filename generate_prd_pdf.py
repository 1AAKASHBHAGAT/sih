import subprocess
import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SIH 26043 - Product Requirements Document (PRD)</title>
    <style>
        @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
            @bottom-right {
                content: "Page " counter(page);
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                font-size: 9pt;
                color: #64748b;
            }
        }
        
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }

        /* Cover Page */
        .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            padding: 40px 20px;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            border-radius: 12px;
        }

        .cover-header {
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
        }

        .govt-badge {
            display: inline-block;
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 9.5pt;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            border: 1px solid rgba(96, 165, 250, 0.3);
            margin-bottom: 15px;
        }

        .cover-title {
            font-size: 28pt;
            font-weight: 800;
            line-height: 1.2;
            color: #ffffff;
            margin: 10px 0;
        }

        .cover-subtitle {
            font-size: 14pt;
            color: #94a3b8;
            font-weight: 400;
            margin-top: 5px;
        }

        .cover-meta {
            background: rgba(255, 255, 255, 0.05);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 40px 0;
        }

        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .meta-item {
            font-size: 10pt;
        }

        .meta-label {
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 8pt;
            letter-spacing: 0.5px;
        }

        .meta-value {
            color: #f8fafc;
            font-weight: 500;
            margin-top: 2px;
        }

        .cover-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 20px;
            font-size: 9pt;
            color: #64748b;
            display: flex;
            justify-content: space-between;
        }

        /* Typography & Headings */
        h1 {
            font-size: 20pt;
            color: #0f172a;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 8px;
            margin-top: 35px;
            margin-bottom: 15px;
            page-break-after: avoid;
        }

        h2 {
            font-size: 14pt;
            color: #1e3a8a;
            margin-top: 25px;
            margin-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            page-break-after: avoid;
        }

        h3 {
            font-size: 11.5pt;
            color: #2563eb;
            margin-top: 18px;
            margin-bottom: 8px;
            page-break-after: avoid;
        }

        p {
            margin-top: 0;
            margin-bottom: 12px;
            text-align: justify;
        }

        ul, ol {
            margin-top: 0;
            margin-bottom: 14px;
            padding-left: 22px;
        }

        li {
            margin-bottom: 5px;
        }

        /* Table of Contents */
        .toc-container {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px 30px;
            margin-bottom: 30px;
            page-break-after: always;
        }

        .toc-title {
            font-size: 16pt;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 15px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 6px;
        }

        .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .toc-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dashed #cbd5e1;
            font-size: 10.5pt;
        }

        .toc-item span.title {
            font-weight: 500;
            color: #1e293b;
        }

        .toc-item span.num {
            font-weight: 700;
            color: #2563eb;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0 20px 0;
            font-size: 9.5pt;
            page-break-inside: avoid;
        }

        th {
            background: #1e293b;
            color: #ffffff;
            font-weight: 600;
            text-align: left;
            padding: 10px 12px;
            border: 1px solid #1e293b;
        }

        td {
            padding: 9px 12px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }

        tr:nth-child(even) {
            background-color: #f8fafc;
        }

        /* Alert / Callout Boxes */
        .callout {
            padding: 14px 18px;
            border-radius: 6px;
            margin: 16px 0;
            font-size: 9.5pt;
            page-break-inside: avoid;
        }

        .callout-note {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            color: #1e40af;
        }

        .callout-important {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            color: #991b1b;
        }

        .callout-tip {
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            color: #166534;
        }

        .callout-title {
            font-weight: 700;
            margin-bottom: 4px;
            text-transform: uppercase;
            font-size: 8.5pt;
            letter-spacing: 0.5px;
        }

        /* Code & ASCII Boxes */
        pre {
            background: #0f172a;
            color: #f8fafc;
            padding: 14px 18px;
            border-radius: 6px;
            font-family: "Courier New", Courier, monospace;
            font-size: 8.5pt;
            line-height: 1.4;
            overflow-x: auto;
            margin: 15px 0;
            border: 1px solid #334155;
            page-break-inside: avoid;
            white-space: pre-wrap;
        }

        code {
            font-family: "Courier New", Courier, monospace;
            background: #f1f5f9;
            color: #0f172a;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 9pt;
        }

        .page-break {
            page-break-before: always;
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-p0 { background: #fee2e2; color: #991b1b; }
        .badge-p1 { background: #fef3c7; color: #92400e; }
        .badge-p2 { background: #e0e7ff; color: #3730a3; }
    </style>
</head>
<body>

    <!-- COVER PAGE -->
    <div class="cover-page">
        <div class="cover-header">
            <div class="govt-badge">Government of Jharkhand • Department of Higher & Technical Education</div>
            <div class="cover-title">Product Requirements Document (PRD)</div>
            <div class="cover-subtitle">Societal Innovation Collaboration Platform</div>
            <div style="margin-top: 15px; color: #60a5fa; font-weight: 600; font-size: 11pt;">
                SIH Problem Statement 26043 — Software / Disaster & Societal Management
            </div>
        </div>

        <div class="cover-meta">
            <div class="meta-grid">
                <div class="meta-item">
                    <div class="meta-label">Document Version</div>
                    <div class="meta-value">v1.0 (Production / Prototype MVP)</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Date of Creation</div>
                    <div class="meta-value">August 2026</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Target Organization</div>
                    <div class="meta-value">Dept of Higher & Technical Education, Jharkhand</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Classification</div>
                    <div class="meta-value">Official Hackathon Prototype Specification</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Core Technologies</div>
                    <div class="meta-value">FastAPI, React.js, Supabase PostgreSQL, Hugging Face AI</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">NEP Alignment</div>
                    <div class="meta-value">NEP 2020 Experiential & Community Innovation</div>
                </div>
            </div>
        </div>

        <div class="cover-footer">
            <span>Prepared by SIH 26043 Technical Innovation Team</span>
            <span>Confidential & Internal Hackathon Guide</span>
        </div>
    </div>

    <!-- TABLE OF CONTENTS -->
    <div class="toc-container">
        <div class="toc-title">Table of Contents</div>
        <ul class="toc-list">
            <li class="toc-item"><span class="title">1. Executive Summary</span><span class="num">01</span></li>
            <li class="toc-item"><span class="title">2. Project Overview & SIH 26043 Context</span><span class="num">02</span></li>
            <li class="toc-item"><span class="title">3. Problem Statement & Gap Analysis</span><span class="num">03</span></li>
            <li class="toc-item"><span class="title">4. Vision, Mission & Core Strategic Objectives</span><span class="num">04</span></li>
            <li class="toc-item"><span class="title">5. User Personas (Primary Stakeholders)</span><span class="num">05</span></li>
            <li class="toc-item"><span class="title">6. Comprehensive Functional Requirements (Modules 1-7)</span><span class="num">06</span></li>
            <li class="toc-item"><span class="title">7. Non-Functional Requirements (Performance, Security, NFRs)</span><span class="num">07</span></li>
            <li class="toc-item"><span class="title">8. Technical Architecture & Tech Stack Specifications</span><span class="num">08</span></li>
            <li class="toc-item"><span class="title">9. Relational Database Schema & Data Models</span><span class="num">09</span></li>
            <li class="toc-item"><span class="title">10. User Interface Layouts & ASCII Wireframes</span><span class="num">10</span></li>
            <li class="toc-item"><span class="title">11. Data Flow Diagrams & Sequence Models</span><span class="num">11</span></li>
            <li class="toc-item"><span class="title">12. Security, Privacy & DPDP Compliance</span><span class="num">12</span></li>
            <li class="toc-item"><span class="title">13. Phased Implementation Roadmap & Milestones</span><span class="num">13</span></li>
            <li class="toc-item"><span class="title">14. Key Performance Indicators (KPIs) & Success Metrics</span><span class="num">14</span></li>
            <li class="toc-item"><span class="title">15. Appendix: 5-Minute Internal Hackathon Demo Script</span><span class="num">15</span></li>
        </ul>
    </div>

    <!-- SECTION 1: EXECUTIVE SUMMARY -->
    <h1>1. Executive Summary</h1>
    <p>The <strong>Societal Innovation Collaboration Platform</strong> is an end-to-end, AI-powered digital ecosystem built specifically to solve the systemic disconnect between grassroots citizen problems in Jharkhand and the academic, research, and technical capabilities of Higher Education Institutions (HEIs) and industry leaders.</p>
    
    <p>Currently, citizens across urban and rural Jharkhand identify thousands of urgent localized challenges in education, public healthcare, clean drinking water, sanitation, agricultural management, and disaster resilience. However, there is no structured digital channel to submit, auto-classify, route, and track these challenges to completion. Simultaneously, universities possess talent and research mandates under <strong>National Education Policy (NEP) 2020</strong> but lack direct exposure to validated real-world problems.</p>

    <div class="callout callout-note">
        <div class="callout-title">Core Value Proposition</div>
        This platform acts as an intelligent bridge: transforming crowdsourced community challenges into active university research projects, student capstone innovations, and corporate social responsibility (CSR) funded industry ventures with full lifecycle transparency and real-time visual analytics.
    </div>

    <!-- SECTION 2: PROJECT OVERVIEW -->
    <h1>2. Project Overview & SIH 26043 Context</h1>
    <table>
        <tr>
            <th>Parameter</th>
            <th>Specification Details</th>
        </tr>
        <tr>
            <td><strong>Problem Statement ID</strong></td>
            <td>26043</td>
        </tr>
        <tr>
            <td><strong>Problem Statement Title</strong></td>
            <td>A digital platform to crowdsource societal challenges and facilitate collaborative problem solving through universities and industry partnerships</td>
        </tr>
        <tr>
            <td><strong>Category</strong></td>
            <td>Software Development (JAMstack + AI Integration)</td>
        </tr>
        <tr>
            <td><strong>Theme</strong></td>
            <td>Disaster Management & Societal Welfare</td>
        </tr>
        <tr>
            <td><strong>Nodal Organization</strong></td>
            <td>Department of Higher & Technical Education, Government of Jharkhand</td>
        </tr>
        <tr>
            <td><strong>Target Scope</strong></td>
            <td>Statewide deployment across 24 districts, 50+ HEIs, and 500+ student research teams</td>
        </tr>
    </table>

    <!-- SECTION 3: PROBLEM STATEMENT & GAP ANALYSIS -->
    <h1>3. Problem Statement & Gap Analysis</h1>
    <h2>3.1 Current Challenges in Jharkhand</h2>
    <p>Communities across Jharkhand regularly encounter critical domain-specific challenges:</p>
    <ul>
        <li><strong>Water & Sanitation:</strong> Groundwater contamination, lack of filtration in rural schools, open drainage issues.</li>
        <li><strong>Agriculture:</strong> Soil acidity, irregular rainfall monitoring, lack of local cold chain technology.</li>
        <li><strong>Healthcare:</strong> Remote telemedicine gaps, maternal health monitoring in tribal belts.</li>
        <li><strong>Education & Skill:</strong> Digital literacy divide, vocational lab infrastructure constraints.</li>
    </ul>

    <h2>3.2 Key Systemic Gaps Identified</h2>
    <table>
        <tr>
            <th>Identified Gap</th>
            <th>Impact on Ecosystem</th>
            <th>Platform Solution</th>
        </tr>
        <tr>
            <td><strong>No Central Channel</strong></td>
            <td>Citizens cannot report issues to academic experts.</td>
            <td>Mobile-responsive crowdsourcing form with GPS & media.</td>
        </tr>
        <tr>
            <td><strong>Manual Triage Delay</strong></td>
            <td>Manual routing of problems takes weeks or months.</td>
            <td>Zero-Shot NLP AI classification & auto-routing in &lt;2 sec.</td>
        </tr>
        <tr>
            <td><strong>Unrealized NEP 2020</strong></td>
            <td>Students work on synthetic/theoretical projects.</td>
            <td>Real-world demand-driven problem assignments.</td>
        </tr>
        <tr>
            <td><strong>Siloed Industry CSR</strong></td>
            <td>Corporates fail to discover viable social projects.</td>
            <td>Dedicated Industry Partnership & Funding portal.</td>
        </tr>
    </table>

    <div class="page-break"></div>

    <!-- SECTION 4: VISION, MISSION & OBJECTIVES -->
    <h1>4. Vision, Mission & Core Strategic Objectives</h1>
    <h2>4.1 Vision</h2>
    <p>To establish a transparent, scalable, and AI-driven innovation ecosystem that transforms grassroots community challenges into practical research, sustainable startups, and measurable social impact across Jharkhand.</p>

    <h2>4.2 Mission</h2>
    <p>To empower citizens, university researchers, student teams, government officials, and industry sponsors through a unified digital platform that automates problem identification, intelligent matching, milestone tracking, and solution deployment.</p>

    <h2>4.3 Key Performance Targets</h2>
    <table>
        <tr>
            <th>Strategic Objective</th>
            <th>Year 1 Target</th>
            <th>Year 2 Target</th>
        </tr>
        <tr>
            <td>Crowdsourced Submissions</td>
            <td>1,000+ Verified Challenges</td>
            <td>10,000+ Verified Challenges</td>
        </tr>
        <tr>
            <td>University Onboarding</td>
            <td>50+ Higher Education Institutions</td>
            <td>150+ Technical Institutions</td>
        </tr>
        <tr>
            <td>AI Categorization Accuracy</td>
            <td>90%+ Zero-Shot Accuracy</td>
            <td>95%+ Fine-Tuned NLP Accuracy</td>
        </tr>
        <tr>
            <td>Project Resolution Rate</td>
            <td>60% Active Lifecycle Progress</td>
            <td>85% Completed & Deployed Solutions</td>
        </tr>
    </table>

    <!-- SECTION 5: USER PERSONAS -->
    <h1>5. User Personas</h1>
    
    <h3>Persona 1: Citizen Reporter (Grassroots User)</h3>
    <p><strong>Name:</strong> Suresh Kumar (Ranchi District) | <strong>Role:</strong> Agriculturalist & Community Leader</p>
    <ul>
        <li><strong>Needs:</strong> Simple UI, regional language support, voice/photo submission, location tagging.</li>
        <li><strong>Pain Point:</strong> Complaints sent to district offices are delayed or lost without tracking numbers.</li>
        <li><strong>Platform Workflow:</strong> Submits issue via mobile web with photo and GPS location; receives SMS tracking updates.</li>
    </ul>

    <h3>Persona 2: University Administrator / Dean of Research</h3>
    <p><strong>Name:</strong> Dr. Priya Sharma | <strong>Role:</strong> Dean of R&D, Central University of Jharkhand</p>
    <ul>
        <li><strong>Needs:</strong> Automated queue of domain-relevant challenges, team assignment tools, milestone validation.</li>
        <li><strong>Pain Point:</strong> Difficulty finding validated real-world problems for final-year engineering students.</li>
        <li><strong>Platform Workflow:</strong> Accepts auto-routed "Water Management" challenges and assigns student project teams.</li>
    </ul>

    <h3>Persona 3: Student Project Lead</h3>
    <p><strong>Name:</strong> Aishwarya Patel | <strong>Role:</strong> Final Year B.Tech Computer Science Student</p>
    <ul>
        <li><strong>Needs:</strong> Task board, repository upload, mentor guidance, clear project milestones.</li>
        <li><strong>Platform Workflow:</strong> Submits project proposals, updates status from <i>Assigned → In Progress → Deployed</i>.</li>
    </ul>

    <h3>Persona 4: Industry CSR & Funding Sponsor</h3>
    <p><strong>Name:</strong> Mr. Ravi Desai | <strong>Role:</strong> Head of CSR Innovation, Tata Steel</p>
    <ul>
        <li><strong>Needs:</strong> Project discovery catalog, verifiable social impact metrics, IP/startup co-incubation.</li>
        <li><strong>Platform Workflow:</strong> Filters high-impact agriculture prototypes and allocates CSR grant funding.</li>
    </ul>

    <h3>Persona 5: Government Nodal Official</h3>
    <p><strong>Name:</strong> Mr. Aman Singh | <strong>Role:</strong> Secretary, Dept. of Higher & Technical Education</p>
    <ul>
        <li><strong>Needs:</strong> High-level visual dashboard, district heatmaps, university leaderboard, analytics export.</li>
        <li><strong>Platform Workflow:</strong> Monitors district-wise challenge resolution rates for executive decision-making.</li>
    </ul>

    <div class="page-break"></div>

    <!-- SECTION 6: FUNCTIONAL REQUIREMENTS -->
    <h1>6. Functional Requirements</h1>

    <h2>Module 1: Citizen Engagement Module (Web & Mobile)</h2>
    <table>
        <tr>
            <th>Req ID</th>
            <th>Requirement Description</th>
            <th>Priority</th>
            <th>Acceptance Criteria</th>
        </tr>
        <tr>
            <td>CE-1.1</td>
            <td>Responsive submission interface across mobile and desktop.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>100% responsive layout, &lt;3s mobile initial load.</td>
        </tr>
        <tr>
            <td>CE-1.2</td>
            <td>Multi-media attachments support (Photos, Videos, PDFs).</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Upload PNG, JPG, MP4 up to 20MB with preview.</td>
        </tr>
        <tr>
            <td>CE-1.3</td>
            <td>Automatic GPS geolocation & interactive Map interface.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Captures lat/long via browser API & Leaflet/Mapbox map pin.</td>
        </tr>
        <tr>
            <td>CE-1.4</td>
            <td>Multi-lingual UI support (English, Hindi, Santali).</td>
            <td><span class="badge badge-p1">P1</span></td>
            <td>Instant client-side translation toggle.</td>
        </tr>
        <tr>
            <td>CE-1.5</td>
            <td>Citizen status tracking page via Unique Ticket ID.</td>
            <td><span class="badge badge-p1">P1</span></td>
            <td>Public lookup page rendering live lifecycle stage.</td>
        </tr>
    </table>

    <h2>Module 2: AI-Enabled Problem Management & Auto-Routing</h2>
    <table>
        <tr>
            <th>Req ID</th>
            <th>Requirement Description</th>
            <th>Priority</th>
            <th>Acceptance Criteria</th>
        </tr>
        <tr>
            <td>AI-2.1</td>
            <td>Zero-Shot NLP classification of problem description text.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Uses Hugging Face BART-Large-MNLI model with &gt;85% confidence score.</td>
        </tr>
        <tr>
            <td>AI-2.2</td>
            <td>Automatic Intelligent Routing to relevant Universities.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Maps predicted domain (e.g. Healthcare → Central Univ of Jharkhand) instantly.</td>
        </tr>
        <tr>
            <td>AI-2.3</td>
            <td>Duplicate Problem Detection.</td>
            <td><span class="badge badge-p1">P1</span></td>
            <td>Flags existing submissions with &gt;80% semantic textual similarity.</td>
        </tr>
        <tr>
            <td>AI-2.4</td>
            <td>Urgency & Social Impact Scoring.</td>
            <td><span class="badge badge-p2">P2</span></td>
            <td>Algorithmic priority score (1-10) based on severity keywords and votes.</td>
        </tr>
    </table>

    <h2>Module 3: University Collaboration & Project Lifecycle</h2>
    <table>
        <tr>
            <th>Req ID</th>
            <th>Requirement Description</th>
            <th>Priority</th>
            <th>Acceptance Criteria</th>
        </tr>
        <tr>
            <td>UC-3.1</td>
            <td>University Queue & Challenge Acceptance/Rejection Interface.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>University admins can accept/reject routed issues with notes.</td>
        </tr>
        <tr>
            <td>UC-3.2</td>
            <td>Team Formation & Faculty Mentor Assignment.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Assign lead student, team members, and faculty advisor.</td>
        </tr>
        <tr>
            <td>UC-3.3</td>
            <td>Kanban Board Lifecycle Management.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Drag-and-drop state transitions: <i>Assigned → In Progress → Testing → Deployed</i>.</td>
        </tr>
        <tr>
            <td>UC-3.4</td>
            <td>Milestone Deliverable Tracking.</td>
            <td><span class="badge badge-p1">P1</span></td>
            <td>Track stages: Proposal, Prototype, Field Testing, Deployment.</td>
        </tr>
    </table>

    <h2>Module 4: Industry Partnership & CSR Engagement</h2>
    <table>
        <tr>
            <th>Req ID</th>
            <th>Requirement Description</th>
            <th>Priority</th>
            <th>Acceptance Criteria</th>
        </tr>
        <tr>
            <td>IP-4.1</td>
            <td>Project Discovery Catalog for Industry Sponsors.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Searchable directory filtered by domain, stage, funding needed.</td>
        </tr>
        <tr>
            <td>IP-4.2</td>
            <td>CSR Funding & Resource Pledge Portal.</td>
            <td><span class="badge badge-p1">P1</span></td>
            <td>Record grant pledges, equipment donations, and mentorship allocations.</td>
        </tr>
    </table>

    <h2>Module 5: Real-Time Visual Analytics Dashboard</h2>
    <table>
        <tr>
            <th>Req ID</th>
            <th>Requirement Description</th>
            <th>Priority</th>
            <th>Acceptance Criteria</th>
        </tr>
        <tr>
            <td>AD-5.1</td>
            <td>Executive Metric Cards (Total, Active, Resolved, HEIs).</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Real-time count cards with auto-refresh every 30 seconds.</td>
        </tr>
        <tr>
            <td>AD-5.2</td>
            <td>Domain Distribution Pie/Bar Charts.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Interactive Recharts visualization of challenges by sector.</td>
        </tr>
        <tr>
            <td>AD-5.3</td>
            <td>University Participation & Resolution Leaderboard.</td>
            <td><span class="badge badge-p0">P0</span></td>
            <td>Rankings of top participating universities by projects completed.</td>
        </tr>
        <tr>
            <td>AD-5.4</td>
            <td>District-Level Heatmap / Geo-analytics.</td>
            <td><span class="badge badge-p1">P1</span></td>
            <td>Spatial plot of challenges across Jharkhand's 24 districts.</td>
        </tr>
    </table>

    <div class="page-break"></div>

    <!-- SECTION 7: NON-FUNCTIONAL REQUIREMENTS -->
    <h1>7. Non-Functional Requirements (NFRs)</h1>
    
    <h2>7.1 Performance Requirements</h2>
    <ul>
        <li><strong>Page Load Time:</strong> Client-side initial render &lt;2.5 seconds on 3G networks.</li>
        <li><strong>API Latency:</strong> FastAPI endpoint response time &lt;300ms for 95th percentile requests.</li>
        <li><strong>AI Response Time:</strong> Zero-shot classification inference &lt;2.0 seconds per submission.</li>
        <li><strong>Concurrency:</strong> Support 1,000+ simultaneous active users during peak hours.</li>
    </ul>

    <h2>7.2 Security & Data Privacy</h2>
    <ul>
        <li><strong>Authentication:</strong> Secure JWT (JSON Web Tokens) with 24-hour expiration and refresh tokens.</li>
        <li><strong>Authorization:</strong> Strict Role-Based Access Control (RBAC) across Citizen, Student, University, Industry, and Admin roles.</li>
        <li><strong>Data Protection:</strong> TLS 1.3 encryption in transit; AES-256 storage encryption on Supabase PostgreSQL.</li>
        <li><strong>Compliance:</strong> Strict adherence to the <i>Digital Personal Data Protection (DPDP) Act 2023</i> and <i>Indian IT Act 2000</i>.</li>
    </ul>

    <h2>7.3 Scalability & Reliability</h2>
    <ul>
        <li><strong>Stateless Architecture:</strong> FastAPI REST container designed for auto-scaling on Railway/Render.</li>
        <li><strong>Database Scalability:</strong> Managed Supabase PostgreSQL with automated daily database snapshots.</li>
        <li><strong>Availability Target:</strong> 99.9% uptime for public crowdsourcing endpoints.</li>
    </ul>

    <!-- SECTION 8: TECHNICAL ARCHITECTURE -->
    <h1>8. Technical Architecture & Tech Stack</h1>
    
    <h2>8.1 Architectural Layers</h2>
    <pre>
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                             │
│   React.js 18 + Vite  │  Tailwind CSS  │  Recharts  │  Leaflet Maps     │
└─────────────────────────────────────────────────────────────────────────┘
                                   │  (HTTPS / REST APIs)
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                             │
│   FastAPI (Python 3.10+) Backend Server                                  │
│   ├── /api/submit-problem (Crowdsourcing Endpoint)                      │
│   ├── /api/classify      (Hugging Face Inference Integration)           │
│   ├── /api/projects      (University Kanban & Project State)           │
│   └── /api/analytics     (Real-time Aggregations)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                   │  (SQLAlchemy / Async PG Driver)
┌─────────────────────────────────────────────────────────────────────────┐
│                             DATA & AI LAYER                             │
│   Supabase PostgreSQL DB  │  Hugging Face Zero-Shot Model (BART-MNLI)   │
└─────────────────────────────────────────────────────────────────────────┘
    </pre>

    <h2>8.2 Technology Component Matrix</h2>
    <table>
        <tr>
            <th>Component</th>
            <th>Technology Chosen</th>
            <th>Selection Rationale</th>
        </tr>
        <tr>
            <td><strong>Frontend Framework</strong></td>
            <td>React 18 (Vite)</td>
            <td>Lighting fast client startup, component modularity, ideal for rich dashboards.</td>
        </tr>
        <tr>
            <td><strong>Styling Engine</strong></td>
            <td>Tailwind CSS</td>
            <td>Rapid layout construction, modern aesthetic tokens, responsive utilities.</td>
        </tr>
        <tr>
            <td><strong>Backend API</strong></td>
            <td>FastAPI (Python)</td>
            <td>Asynchronous, automatic Swagger UI docs, native Python AI SDK compatibility.</td>
        </tr>
        <tr>
            <td><strong>Database</strong></td>
            <td>Supabase (PostgreSQL)</td>
            <td>Robust relational integrity, free tier hosting, built-in Auth & Realtime engine.</td>
        </tr>
        <tr>
            <td><strong>AI Engine</strong></td>
            <td>Hugging Face Inference API</td>
            <td>Pre-trained Zero-Shot BART model; eliminates offline ML training overhead.</td>
        </tr>
        <tr>
            <td><strong>Mapping</strong></td>
            <td>Leaflet.js / OpenStreetMap</td>
            <td>Open-source, light footprint, interactive lat/long map picker.</td>
        </tr>
    </table>

    <div class="page-break"></div>

    <!-- SECTION 9: DATABASE SCHEMA -->
    <h1>9. Relational Database Schema & Data Models</h1>
    
    <pre>
-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('citizen', 'university_admin', 'student_lead', 'industry', 'government')),
    university_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Problems / Challenges Table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    user_category VARCHAR(100),
    ai_predicted_category VARCHAR(100),
    assigned_university VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Assigned', 'In Progress', 'Testing', 'Deployed', 'Rejected')),
    urgency_score INT DEFAULT 5,
    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    university_name VARCHAR(255) NOT NULL,
    team_lead_name VARCHAR(255) NOT NULL,
    faculty_advisor VARCHAR(255),
    lifecycle_stage VARCHAR(50) DEFAULT 'Proposed',
    proposal_summary TEXT,
    budget_allocated DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Industry Sponsorships Table
CREATE TABLE industry_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    company_name VARCHAR(255) NOT NULL,
    grant_amount DECIMAL(12,2),
    mentorship_lead VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
    </pre>

    <!-- SECTION 10: USER INTERFACE WIREFRAMES -->
    <h1>10. User Interface Layouts & ASCII Wireframes</h1>
    
    <h2>10.1 Citizen Challenge Submission Page</h2>
    <pre>
┌─────────────────────────────────────────────────────────────────────────┐
│ 🌐 SIH 26043 - Societal Innovation Platform         [Language: English ▼]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   📢 Submit a Local Community Challenge                                 │
│   -------------------------------------------------------------------   │
│   Problem Title *                                                       │
│   [ Enter a brief title describing the issue...                       ] │
│                                                                         │
│   Problem Description *                                                 │
│   [ Detailed explanation of what is happening, who is affected...     ] │
│   [                                                                   ] │
│                                                                         │
│   Category Domain (Optional)                                            │
│   [ Select Category ▼ ] (AI will auto-validate: Water, Health, etc.)    │
│                                                                         │
│   Location & Geolocation *                                              │
│   [ Enter District/Village ]  [ 📍 Auto-Detect GPS Location ]           │
│                                                                         │
│   Upload Photo / Attachment                                             │
│   [ 📁 Choose File: water_sample.jpg ]                                  │
│                                                                         │
│   [  🚀 SUBMIT CHALLENGE TO AI ROUTER  ]                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
    </pre>

    <h2>10.2 University & Government Analytics Dashboard</h2>
    <pre>
┌─────────────────────────────────────────────────────────────────────────┐
│ 📊 Government of Jharkhand - Executive Innovation Dashboard             │
├───────────────┬───────────────┬───────────────┬─────────────────────────┤
│ Total Problems│ Active In-Prog│ Deployed Sol. │ Participating HEIs      │
│     1,247     │      412      │      189      │         48              │
├───────────────┴───────────────┴───────────────┴─────────────────────────┤
│                                                                         │
│ ┌───────────────────────────────┐ ┌───────────────────────────────────┐ │
│ │ Domain Distribution (Pie)     │ │ Project Status Lifecycle (Kanban) │ │
│ │  ■ Water: 35%                 │ │ [Submitted] -> [Assigned] ->      │ │
│ │  ■ Health: 25%                │ │ [In Progress] -> [Deployed]       │ │
│ │  ■ Agri:   20%                │ │                                   │ │
│ └───────────────────────────────┘ └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
    </pre>

    <div class="page-break"></div>

    <!-- SECTION 11: DATA FLOW DIAGRAMS -->
    <h1>11. Data Flow Diagrams & Sequence Models</h1>
    <pre>
[ Citizen User ] ──( 1. Submits Problem with Text & GPS )──> [ FastAPI Server ]
                                                                   │
                                                                   ▼
[ Hugging Face BART Model ] <──( 2. Zero-Shot Inference Req )──────┤
            │                                                      │
            └──( 3. Returns Category: "Water Management" )────────>│
                                                                   │
                                                                   ▼
[ University Matcher ] <──( 4. Maps to "Central Univ Jharkhand" )──┤
                                                                   │
                                                                   ▼
[ Supabase PostgreSQL DB ] <──( 5. Persists Problem Record )───────┘
    </pre>

    <!-- SECTION 12: SECURITY & COMPLIANCE -->
    <h1>12. Security, Privacy & Compliance</h1>
    <ul>
        <li><strong>DPDP Act 2023 Alignment:</strong> Explicit user consent collected prior to processing GPS coordinates and personal contact metadata.</li>
        <li><strong>API Rate Limiting:</strong> Standard rate limiting of 60 requests/minute per IP to defend against Denial-of-Service (DoS) attacks.</li>
        <li><strong>Sanitization:</strong> Strict XSS input escaping on description text inputs and SQL parameter binding via ORM.</li>
    </ul>

    <!-- SECTION 13: IMPLEMENTATION ROADMAP -->
    <h1>13. Phased Implementation Roadmap</h1>
    <table>
        <tr>
            <th>Phase</th>
            <th>Duration</th>
            <th>Key Deliverables</th>
        </tr>
        <tr>
            <td><strong>Phase 1: MVP Hackathon Prototype</strong></td>
            <td>Days 1 - 3</td>
            <td>FastAPI auto-categorization endpoint, React submission form, basic visual dashboard, demo script.</td>
        </tr>
        <tr>
            <td><strong>Phase 2: Beta Pilot</strong></td>
            <td>Months 1 - 3</td>
            <td>Supabase Auth integration, multi-language toggles, university project workflow, 10 HEI onboarding.</td>
        </tr>
        <tr>
            <td><strong>Phase 3: Statewide Launch</strong></td>
            <td>Months 4 - 6</td>
            <td>50+ HEIs onboarded, industry CSR portal, offline mobile PWA, automated SMS notifications.</td>
        </tr>
    </table>

    <!-- SECTION 14: SUCCESS METRICS -->
    <h1>14. Key Performance Indicators (KPIs)</h1>
    <ul>
        <li><strong>Average Triage Time:</strong> Reduction in challenge assignment time from 14 days to &lt;5 seconds.</li>
        <li><strong>University Participation:</strong> At least 80% of registered HEIs actively working on assigned challenges.</li>
        <li><strong>Student Engagement:</strong> 1,000+ engineering and research students engaged in real-world NEP 2020 projects.</li>
    </ul>

    <!-- SECTION 15: APPENDIX - DEMO SCRIPT -->
    <h1>15. Appendix: 5-Minute Internal Hackathon Demo Script</h1>
    <div class="callout callout-tip">
        <div class="callout-title">Hackathon Presentation Strategy</div>
        Structure your 5-minute presentation as a live narrative demonstrating real-world impact.
    </div>

    <ol>
        <li><strong>0:00 - 0:45 (The Problem & Vision):</strong> "Imagine a farmer in Bokaro facing water contamination. Currently, there is no direct channel to reach technical experts..."</li>
        <li><strong>0:45 - 2:00 (Live Citizen Submission):</strong> Open the React web app. Type a challenge: <i>"High turbidity and arsenic suspected in school drinking water near Chas village."</i> Click Submit.</li>
        <li><strong>2:00 - 3:15 (The AI Magic):</strong> Highlight the FastAPI response showing instant zero-shot prediction: <strong>"Water Management"</strong> automatically routed to <strong>"IIT (ISM) Dhanbad - Water Research Division"</strong>.</li>
        <li><strong>3:15 - 4:30 (University & Admin Dashboard):</strong> Switch to the University Admin tab. Accept the problem, move Kanban stage to <i>In Progress</i>, assign a student project team, show real-time analytics chart update.</li>
        <li><strong>4:30 - 5:00 (Conclusion & NEP 2020 Linkage):</strong> Conclude with policy alignment: "This turns real-world challenges into academic research pipelines under NEP 2020."</li>
    </ol>

</body>
</html>
"""

html_path = "c:\\Users\\sk860\\sih\\prd.html"
pdf_path = "c:\\Users\\sk860\\sih\\SIH_26043_PRD_Societal_Innovation_Portal.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML PRD saved successfully to:", html_path)

# Execute Edge headless print-to-pdf
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={pdf_path}",
    "--no-margins",
    html_path
]

print("Rendering PDF via Edge headless...")
result = subprocess.run(cmd, capture_output=True, text=True)

if os.path.exists(pdf_path):
    size_kb = os.path.getsize(pdf_path) / 1024
    print(f"SUCCESS: PDF generated at {pdf_path} (Size: {size_kb:.2f} KB)")
else:
    print("ERROR generating PDF:", result.stderr)
