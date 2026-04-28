import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const NAV = [
  "About",
  "Skills",
  "Experience",
  "Education",
  "Projects",
  "Thinking",
  "Contact",
];

const EDUCATION = [
  {
    degree: "B.E. Computer Science",
    school: "PES Institute of Technology",
    details: ["Specialized in software engineering and systems design"],
    period: "Jan 2012",
  },
];

const SKILLS = [
  {
    label: "Program Management",
    icon: "◉",
    items: [
      "Agile",
      "SAFe",
      "Waterfall",
      "PI Planning",
      "Sprint Planning",
      "Release Management",
      "Backlog Grooming",
    ],
  },
  {
    label: "Domains",
    icon: "⌗",
    items: [
      "BFSI",
      "Loyalty & Rewards",
      "Benefits Administration",
      "Redemption Workflows",
      "Travel Booking",
    ],
  },
  {
    label: "Quality & Automation",
    icon: "⚙",
    items: [
      "Selenium",
      "TestNG",
      "CI/CD Integration",
      "Regression Automation",
      "Root Cause Analysis",
    ],
  },
  {
    label: "Tooling & Reporting",
    icon: "▣",
    items: [
      "JIRA",
      "Governance Dashboards",
      "Defect Density Tracking",
      "Velocity Metrics",
      "Throughput Metrics",
    ],
  },
  {
    label: "Stakeholder Mgmt",
    icon: "⇄",
    items: [
      "Cross-functional Leadership",
      "Engineering",
      "QA",
      "DevOps",
      "UI/UX",
      "Analytics",
      "C-level Alignment",
    ],
  },
];

const EXPERIENCE = [
  {
    role: "Lead Program Manager",
    company: "Reward360 Global Services",
    location: "Bangalore, India",
    period: "Mar 2022 – Present",
    context:
      "Enterprise loyalty, rewards, and BFSI delivery platform — clients include ICICI Bank and Kotak Mahindra",
    highlights: [
      "Directed end-to-end delivery of a multi-module loyalty platform (rewards, benefits, redemptions, travel booking, customer engagement) for 30+ cross-functional team members; executed 12+ major releases with zero schedule delays.",
      "Improved on-time delivery from 75% to 92% by optimizing sprint cadence, prioritizing backlog, and eliminating cross-team dependency bottlenecks.",
      "Reduced post-production defects by 30% by introducing quality gates, structured root-cause analysis discipline, and deployment readiness frameworks across all release cycles.",
      "Accelerated feature rollout by 50% by streamlining requirement approvals, unblocking dependency chains, and standardizing change request workflows.",
      "Established governance dashboards tracking throughput, defect density, velocity, and release stability — providing executive visibility across all active programs.",
      "Partnered with Product Heads and Technology Leads at senior banking clients to align roadmaps, manage expectations, and translate complex business requirements into actionable delivery plans.",
      "Facilitated PI planning, sprint ceremonies, stakeholder showcases, and signoff cycles; enhanced team productivity by 25% through structured Agile cadences.",
    ],
  },
  {
    role: "QA Lead",
    company: "Reward360 Global Services",
    location: "Bangalore, India",
    period: "Feb 2019 – Mar 2022",
    context:
      "Led QA strategy for enterprise loyalty modules — functional, regression, and automation",
    highlights: [
      "Reduced regression execution time by 40% through Selenium/TestNG frameworks integrated into CI/CD pipelines.",
      "Managed cross-functional defect triage, release quality gates, and root-cause analysis; mentored QA team on automation best practices.",
    ],
  },
  {
    role: "Test Automation Engineer → Software Test Engineer",
    company: "Hyva IT Solutions",
    location: "Bangalore, India",
    period: "Mar 2014 – Feb 2019",
    context:
      "Designed automation frameworks and executed end-to-end test cycles for enterprise clients",
    highlights: [
      "Designed and implemented automation frameworks for web applications; reduced manual testing effort significantly and improved release stability.",
      "Executed end-to-end test cycles (functional, integration, regression, UAT) and tracked defect resolution through JIRA across multiple client engagements.",
    ],
  },
];

const PROJECTS = [
  {
    title: "Enterprise Loyalty Management System",
    tag: "BFSI",
    src: "/payment.png",
    description:
      "Multi-module loyalty platform across rewards, benefits, redemptions, and customer engagement for major banking clients.",
    details: {
      problem:
        "Fragmented loyalty capabilities across siloed systems led to inconsistent user experience and delayed feature releases.",
      approach:
        "Adopted Agile/SAFe framework with structured PI planning, cross-functional coordination, and governance dashboards to track throughput and defect density.",
      stack: [
        "Agile",
        "SAFe",
        "JIRA",
        "Governance Dashboards",
        "Release Management",
      ],
      impact:
        "Managed 30+ team members with zero major release delays; improved on-time delivery from 75% to 92%.",
    },
    links: { github: "#" },
  },
  {
    title: "Rewards Management & Travel Booking Platform",
    tag: "Loyalty",
    src: "/icash.png",
    description:
      "Real-time reward calculation engine integrated with multiple partners and payment gateways; flights and hotels booking portal with loyalty points.",
    details: {
      problem:
        "Complex reward rules and third-party integrations caused slow reward processing and reconciliation issues.",
      approach:
        "Streamlined requirement approvals, unblocked dependency chains, and standardized change request workflows across engineering and product teams.",
      stack: [
        "Real-time Engine",
        "Payment Gateways",
        "Travel APIs",
        "Mobile-responsive UI",
        "QA Automation",
      ],
      impact:
        "Accelerated feature rollout by 50% and reduced post-production defects by 30% with quality gates and root-cause analysis.",
    },
    links: { github: "#" },
  },
  {
    title: "Governance & Release Management Framework",
    tag: "Process",
    src: "/hotel-service.png",
    description:
      "Enterprise-grade dashboards for tracking throughput, defect density, velocity, and release stability across active programs.",
    details: {
      problem:
        "Lack of executive visibility into program health and release readiness caused last-minute firefighting.",
      approach:
        "Built JIRA-based governance dashboards with real-time metrics on team velocity, defect trends, and release predictability.",
      stack: ["JIRA", "Dashboards", "Metrics", "Release Management"],
      impact:
        "Provided C-level visibility and improved release predictability by 40% across all active programs.",
    },
    links: { github: "#" },
  },
];

const THINKING = [
  {
    num: "01",
    heading: "Delivery excellence is a system, not heroics",
    body: "When on-time delivery depends on individual overtime, the system is broken. I build repeatable processes — quality gates, clear dependency maps, and iterative refinement of sprint cadence — so the team consistently delivers without burning out.",
  },
  {
    num: "02",
    heading: "Transparency is your best risk management tool",
    body: "Hidden bottlenecks and unspoken delays kill programs. I establish governance dashboards that show real-time throughput, defect density, and velocity. When everyone sees the same data, problems get solved faster and stakeholders trust the process.",
  },
  {
    num: "03",
    heading: "Quality gates > hero QA at the end",
    body: "Finding defects a day before release means you've already lost. I push quality left — automated regression in CI/CD, structured root-cause analysis, and deployment readiness frameworks so post-production surprises drop to near zero.",
  },
  {
    num: "04",
    heading: "Align roadmaps to business outcomes, not features",
    body: "I partner with product heads and banking clients to translate complex requirements into delivery plans that matter. Every PI planning session starts with 'what business problem are we solving?' — not 'which tickets are we moving?'",
  },
  {
    num: "05",
    heading: "Cross-functional leadership is orchestration, not command",
    body: "Engineering, QA, DevOps, UI/UX, analytics — each has different incentives. My job is to unblock dependency chains, align sprint goals, and create shared accountability. When teams move together, velocity compounds naturally.",
  },
];

/* ─────────────────────────────────────────────
   CSS (exactly as you provided – truncated for brevity)
   Please keep your full GLOBAL_CSS here.
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }

  :root {
    --bg: #000;
    --bg1: #0a0a0a;
    --bg2: #111;
    --bg3: #1a1a1a;
    --bg4: #242424;
    --t1: #fff;
    --t2: #999;
    --t3: #444;
    --border: rgba(255,255,255,0.07);
    --bordermd: rgba(255,255,255,0.12);
    --borderhi: rgba(255,255,255,0.22);
    --ease: cubic-bezier(0.16,1,0.3,1);
    --nav-h: 58px;
    --max: 980px;
    --serif: 'Instrument Serif', Georgia, serif;
    --mono: 'DM Mono', monospace;
    --body: 'Outfit', system-ui, sans-serif;
  }
  [data-theme="light"] {
    --bg: #fafafa;
    --bg1: #f4f4f4;
    --bg2: #ebebeb;
    --bg3: #e0e0e0;
    --bg4: #d4d4d4;
    --t1: #0a192f;
    --t2: #475569;
    --t3: #94a3b8;
    --border: rgba(10,25,47,0.07);
    --bordermd: rgba(10,25,47,0.12);
    --borderhi: rgba(10,25,47,0.24);
  }

  body {
    background: var(--bg);
    color: var(--t1);
    font-family: var(--body);
    font-size: 15px;
    line-height: 1.65;
    transition: background 0.35s, color 0.35s;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--borderhi); border-radius: 99px; }
  ::selection { background: var(--t1); color: var(--bg); }

  /* CURSOR */
  .cdot {
    position: fixed; pointer-events: none; z-index: 9999;
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--t1);
    transform: translate(-50%,-50%);
    transition: width .25s var(--ease), height .25s var(--ease);
    mix-blend-mode: difference;
  }
  .cring {
    position: fixed; pointer-events: none; z-index: 9998;
    width: 38px; height: 38px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.25);
    transform: translate(-50%,-50%);
    mix-blend-mode: difference;
    transition: width .4s var(--ease), height .4s var(--ease), border-color .25s;
  }
  .cring.big { width: 70px; height: 70px; border-color: rgba(255,255,255,0.55); }

  /* NAV */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 300;
    height: var(--nav-h);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem;
    transition: background .4s, border-color .4s, backdrop-filter .4s;
  }
  .nav.solid {
    background: rgba(0,0,0,0.88);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--border);
  }
  [data-theme="light"] .nav.solid { background: rgba(250,250,250,0.88); }
  .nav-logo {
    font-family: var(--serif); font-style: italic;
    font-size: 1.45rem; color: var(--t1); cursor: pointer;
    user-select: none; letter-spacing: -0.01em;
    transition: opacity .2s;
  }
  .nav-logo:hover { opacity: .55; }
  .nav-links { display: flex; gap: 2.5rem; }
  .nlink {
    font-family: var(--mono); font-size: .67rem;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--t3); cursor: pointer; border: none; background: none;
    padding: 4px 0; position: relative; transition: color .2s;
  }
  .nlink::after {
    content: ''; position: absolute; bottom: 0; left: 0;
    width: 0; height: 1px; background: var(--t1);
    transition: width .35s var(--ease);
  }
  .nlink:hover, .nlink.on { color: var(--t1); }
  .nlink:hover::after, .nlink.on::after { width: 100%; }
  .theme-btn {
    width: 32px; height: 32px; border-radius: 50%;
    border: 1px solid var(--bordermd);
    background: transparent; color: var(--t2); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: .8rem; transition: all .2s;
  }
  .theme-btn:hover { border-color: var(--borderhi); color: var(--t1); }
  .menu-btn {
    display: none; width: 32px; height: 32px; border-radius: 6px;
    border: 1px solid var(--bordermd); background: transparent;
    color: var(--t2); cursor: pointer; align-items: center;
    justify-content: center; font-size: .95rem;
  }

  /* HERO */
  .hero-wrap {
    min-height: 100vh;
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 0 2rem 5rem;
    max-width: var(--max); margin: 0 auto; position: relative;
  }
  .hero-eyebrow {
    font-family: var(--mono); font-size: .6rem;
    letter-spacing: .18em; text-transform: uppercase; color: var(--t3);
    display: flex; align-items: center; gap: .75rem;
    margin-bottom: 1.5rem;
    animation: rise .85s var(--ease) .1s both;
  }
  .hero-eyebrow::before {
    content: ''; display: block; width: 22px; height: 1px; background: var(--t3);
  }
  .hero-name {
    font-family: var(--serif);
    font-size: clamp(5.5rem, 15vw, 10.5rem);
    font-weight: 400; line-height: .88;
    letter-spacing: -0.03em; color: var(--t1);
    margin-bottom: 2rem;
  }
  .hero-name em { font-style: italic; color: var(--t3); }
  .hline { display: block; overflow: hidden; }
  .hliner {
    display: block;
    animation: rise .92s var(--ease) both;
  }
  .hline:nth-child(2) .hliner { animation-delay: .07s; }
  @keyframes rise {
    from { transform: translateY(110%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .hero-desc {
    font-size: 1.05rem; font-weight: 300; color: var(--t2);
    max-width: 460px; line-height: 1.8; margin-bottom: 2.5rem;
    animation: rise .9s var(--ease) .3s both;
  }
  .hero-ctas {
    display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;
    animation: rise .9s var(--ease) .42s both;
  }
  .hero-status {
    font-family: var(--mono); font-size: .62rem;
    letter-spacing: .08em; color: var(--t3);
    display: flex; align-items: center; gap: 7px;
  }
  @keyframes gp {
    0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,.5); }
    50% { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
  }
  .gdot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4ade80; animation: gp 2.2s infinite;
  }
  .scroll-hint {
    position: absolute; right: 2rem; bottom: 5rem;
    writing-mode: vertical-rl;
    font-family: var(--mono); font-size: .58rem;
    letter-spacing: .14em; text-transform: uppercase; color: var(--t3);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    animation: float 3s ease-in-out infinite;
  }
  .scroll-hint::after {
    content: ''; display: block; width: 1px; height: 44px;
    background: linear-gradient(to bottom, var(--t3), transparent);
  }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(8px); }
  }

  /* STATS */
  .stats {
    display: flex; overflow: hidden;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .stat {
    flex: 1 1 180px; padding: 2rem 2rem;
    border-right: 1px solid var(--border);
    position: relative; overflow: hidden; cursor: default;
  }
  .stat:last-child { border-right: none; }
  .stat::before {
    content: ''; position: absolute; inset: 0;
    background: var(--bg2);
    transform: translateY(100%);
    transition: transform .55s var(--ease);
  }
  .stat:hover::before { transform: translateY(0); }
  .sv {
    font-family: var(--serif); font-size: 2.1rem;
    color: var(--t1); line-height: 1; position: relative; z-index: 1;
  }
  .sl {
    font-family: var(--mono); font-size: .58rem;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--t3); margin-top: 6px; position: relative; z-index: 1;
  }

  /* SECTION */
  .sec { max-width: var(--max); margin: 0 auto; padding: 6.5rem 2rem; }
  .sec-hd {
    display: flex; align-items: baseline; gap: 1.25rem;
    margin-bottom: 3.5rem; padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .sec-num {
    font-family: var(--mono); font-size: .58rem;
    color: var(--t3); letter-spacing: .1em;
  }
  .sec-title {
    font-family: var(--serif);
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    font-weight: 400; line-height: 1; letter-spacing: -0.02em; color: var(--t1);
  }
  .sec-title em { font-style: italic; color: var(--t3); }

  /* SKILLS */
  .skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 1px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
  }
  .sk-cell {
    background: var(--bg1); padding: 1.5rem;
    position: relative; overflow: hidden;
    transition: background .35s var(--ease);
  }
  .sk-cell::after {
    content: ''; position: absolute; inset: 0;
    border: 1px solid var(--borderhi); opacity: 0;
    transition: opacity .25s; pointer-events: none;
  }
  .sk-cell:hover { background: var(--bg2); }
  .sk-cell:hover::after { opacity: 1; }
  .sk-hd {
    display: flex; align-items: center; gap: .65rem; margin-bottom: 1rem;
  }
  .sk-icon {
    font-family: var(--mono); font-size: .8rem; color: var(--t3);
    width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    transition: border-color .25s, color .25s;
  }
  .sk-cell:hover .sk-icon { border-color: var(--borderhi); color: var(--t1); }
  .sk-name {
    font-family: var(--mono); font-size: .63rem;
    font-weight: 500; letter-spacing: .1em; text-transform: uppercase;
    color: var(--t2); transition: color .25s;
  }
  .sk-cell:hover .sk-name { color: var(--t1); }
  .sk-tags { display: flex; flex-wrap: wrap; gap: .35rem; }
  .sk-tag {
    font-family: var(--mono); font-size: .63rem;
    color: var(--t3); background: var(--bg3);
    border: 1px solid var(--border); border-radius: 4px;
    padding: 3px 9px; transition: all .18s; letter-spacing: .02em;
  }
  .sk-tag:hover { color: var(--t1); border-color: var(--borderhi); }

  /* EXP */
  .exp-block {
    display: grid; grid-template-columns: 220px 1fr;
    gap: 0 4rem; padding: 3rem 0;
    border-bottom: 1px solid var(--border);
  }
  .exp-block:last-child { border-bottom: none; }
  .exp-role { font-family: var(--serif); font-size: 1.5rem; color: var(--t1); margin-bottom: .3rem; }
  .exp-co { font-family: var(--mono); font-size: .67rem; color: var(--t2); letter-spacing: .05em; margin-bottom: .45rem; }
  .exp-period { font-family: var(--mono); font-size: .58rem; color: var(--t3); letter-spacing: .08em; display: block; margin-bottom: .75rem; }
  .exp-ctx { font-size: .8rem; color: var(--t3); font-style: italic; line-height: 1.55; }
  .exp-bullets { list-style: none; }
  .exp-li {
    display: grid; grid-template-columns: 14px 1fr; gap: 0 .75rem;
    padding: .6rem 0; border-bottom: 1px solid var(--border);
    font-size: .875rem; color: var(--t2); line-height: 1.65;
    transition: color .2s;
  }
  .exp-li:last-child { border-bottom: none; }
  .exp-li:hover { color: var(--t1); }
  .exp-li::before {
    content: '→'; font-family: var(--mono); color: var(--t3); font-size: .68rem; padding-top: 2px;
  }
  .more-btn {
    font-family: var(--mono); font-size: .63rem; letter-spacing: .08em;
    color: var(--t3); background: none; border: none; cursor: pointer;
    padding: .75rem 0 0; display: flex; align-items: center; gap: 5px;
    transition: color .2s;
  }
  .more-btn:hover { color: var(--t1); }

  /* EDU */
  .edu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1px;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}
  .edu-cell {
    background: var(--bg1); padding: 2rem;
    transition: background .35s var(--ease);
  }
  .edu-cell:hover { background: var(--bg2); }
  .edu-deg { font-family: var(--serif); font-size: 1.3rem; color: var(--t1); margin-bottom: .3rem; }
  .edu-per { font-family: var(--mono); font-size: .58rem; color: var(--t3); letter-spacing: .08em; display: block; margin-bottom: .6rem; }
  .edu-sch { font-family: var(--mono); font-size: .67rem; color: var(--t3); margin-bottom: .85rem; letter-spacing: .03em; }
  .edu-det { font-size: .82rem; color: var(--t2); line-height: 1.6; padding-left: .85rem; border-left: 1px solid var(--bordermd); margin-top: .35rem; }

  /* PROJECTS */
  .proj-grid {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
  }
  .pcard {
    background: var(--bg1); padding: 1.75rem;
    cursor: pointer; position: relative; overflow: hidden;
    display: flex; flex-direction: column; gap: .9rem;
    transition: background .35s var(--ease);
  }
  .pcard::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 2px; background: var(--t1);
    transform: scaleX(0); transform-origin: left;
    transition: transform .55s var(--ease);
  }
  .pcard:hover { background: var(--bg2); }
  .pcard:hover::before, .pcard.sel::before { transform: scaleX(1); }
  .pcard.sel { background: var(--bg2); }
  .pnum { font-family: var(--mono); font-size: .58rem; color: var(--t3); letter-spacing: .1em; }
  .ptitle { font-family: var(--serif); font-size: 1.1rem; color: var(--t1); line-height: 1.2; flex: 1; }
  .pdesc { font-size: .77rem; color: var(--t3); line-height: 1.6; }
  .ptag {
    font-family: var(--mono); font-size: .58rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--t3); border: 1px solid var(--border); border-radius: 99px;
    padding: 3px 10px; display: inline-block; align-self: flex-start;
    transition: all .2s;
  }
  .pcard:hover .ptag { border-color: var(--borderhi); color: var(--t2); }
  .parrow {
    font-family: var(--mono); font-size: .72rem; color: var(--t3);
    transition: transform .35s var(--ease), color .2s; display: inline-block;
  }
  .pcard:hover .parrow { transform: translate(4px,-4px); color: var(--t1); }
  
  /* Project image inside card */
  .pcard-img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    background: var(--bg3);
  }

  /* MODAL */
  .moverlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,.88); backdrop-filter: blur(14px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem; animation: fover .25s ease;
  }
  [data-theme="light"] .moverlay { background: rgba(250,250,250,.8); }
  @keyframes fover { from { opacity: 0; } to { opacity: 1; } }
  .mbox {
    background: var(--bg1); border: 1px solid var(--bordermd);
    border-radius: 16px; max-width: 680px; width: 100%;
    max-height: 86vh; overflow-y: auto; position: relative;
    animation: mscale .32s var(--ease);
  }
  @keyframes mscale {
    from { opacity: 0; transform: translateY(28px) scale(.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .mclose {
    position: absolute; top: 1.25rem; right: 1.25rem;
    width: 32px; height: 32px; border-radius: 50%;
    border: 1px solid var(--bordermd); background: var(--bg3);
    color: var(--t2); font-size: .85rem; cursor: pointer; z-index: 10;
    display: flex; align-items: center; justify-content: center; transition: all .2s;
  }
  .mclose:hover { background: var(--t1); color: var(--bg); border-color: var(--t1); }
  .minner { padding: 2.5rem; display: flex; flex-direction: column; gap: 1.75rem; }
  
  /* Modal image */
  .modal-img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 0.5rem;
  }
  
  .mtitle { font-family: var(--serif); font-size: 2rem; color: var(--t1); line-height: 1.1; }
  .mbl {
    font-family: var(--mono); font-size: .56rem; letter-spacing: .14em;
    text-transform: uppercase; color: var(--t3); margin-bottom: .5rem;
  }
  .mbt { font-size: .875rem; color: var(--t2); line-height: 1.75; }
  .mimpact {
    font-family: var(--mono); font-size: .72rem; color: var(--t1);
    background: var(--bg3); border: 1px solid var(--bordermd);
    border-left: 2px solid var(--t1);
    padding: .85rem 1.1rem; border-radius: 0 8px 8px 0; letter-spacing: .02em;
  }
  .mpills { display: flex; flex-wrap: wrap; gap: .4rem; }
  .mpill {
    font-family: var(--mono); font-size: .63rem; color: var(--t2);
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 4px; padding: 4px 10px; transition: all .18s;
  }
  .mpill:hover { border-color: var(--borderhi); color: var(--t1); }

  /* THINKING */
  .think-row {
    display: grid; grid-template-columns: 76px 1fr;
    gap: 0 3rem; padding: 2.75rem 0;
    border-bottom: 1px solid var(--border);
    cursor: default; position: relative; overflow: hidden;
  }
  .think-row:last-child { border-bottom: none; }
  .think-row::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 0; background: var(--bg2); z-index: 0;
    transition: width .55s var(--ease);
  }
  .think-row:hover::before { width: 100%; }
  .tnum {
    font-family: var(--serif); font-style: italic;
    font-size: 3.2rem; color: var(--t3); line-height: 1;
    position: relative; z-index: 1; padding-top: .1rem;
    transition: color .3s;
  }
  .think-row:hover .tnum { color: var(--t2); }
  .tcnt { position: relative; z-index: 1; }
  .thead {
    font-family: var(--serif); font-size: 1.22rem; color: var(--t1);
    margin-bottom: .5rem; transition: letter-spacing .45s var(--ease);
  }
  .think-row:hover .thead { letter-spacing: .012em; }
  .tbody { font-size: .875rem; color: var(--t2); line-height: 1.75; }

  /* CONTACT */
  .ct-mega { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
  .ct-hl {
    font-family: var(--serif);
    font-size: clamp(2.8rem, 6vw, 4.2rem);
    color: var(--t1); line-height: 1.0; letter-spacing: -0.02em; margin-bottom: 1rem;
  }
  .ct-sub { font-size: .9rem; color: var(--t2); line-height: 1.75; max-width: 340px; }
  .ct-links {
    display: flex; flex-direction: column; gap: 1px;
    border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
  }
  .ct-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.2rem 1.5rem; background: var(--bg1);
    text-decoration: none; transition: background .25s, padding-left .35s var(--ease);
  }
  .ct-row:hover { background: var(--bg2); padding-left: 2rem; }
  .ct-lbl { font-family: var(--mono); font-size: .58rem; letter-spacing: .12em; text-transform: uppercase; color: var(--t3); margin-bottom: 3px; }
  .ct-val { font-size: .83rem; color: var(--t2); font-family: var(--mono); transition: color .2s; }
  .ct-row:hover .ct-val { color: var(--t1); }
  .ct-arr { font-family: var(--mono); font-size: .78rem; color: var(--t3); transition: transform .3s var(--ease); }
  .ct-row:hover .ct-arr { transform: translate(4px,-4px); color: var(--t1); }

  /* BUTTONS */
  .bsolid {
    font-family: var(--mono); font-size: .68rem; letter-spacing: .08em; text-transform: uppercase;
    padding: 11px 24px; background: var(--t1); color: var(--bg);
    border: none; border-radius: 6px; cursor: pointer; text-decoration: none;
    display: inline-flex; align-items: center; gap: 8px; transition: opacity .2s, transform .2s;
  }
  .bsolid:hover { opacity: .78; transform: translateY(-1px); }
  .boutline {
    font-family: var(--mono); font-size: .68rem; letter-spacing: .08em; text-transform: uppercase;
    padding: 11px 22px; background: transparent; color: var(--t2);
    border: 1px solid var(--bordermd); border-radius: 6px; cursor: pointer;
    text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: all .2s;
  }
  .boutline:hover { border-color: var(--borderhi); color: var(--t1); transform: translateY(-1px); }

  /* FOOTER */
  .footer-strip {
    border-top: 1px solid var(--border); max-width: var(--max); margin: 0 auto;
    padding: 2rem; display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: .75rem;
    font-family: var(--mono); font-size: .6rem;
    letter-spacing: .1em; text-transform: uppercase; color: var(--t3);
  }

  /* MOBILE NAV */
  .mmenu {
    position: fixed; top: var(--nav-h); left: 0; right: 0; z-index: 299;
    background: var(--bg1); border-bottom: 1px solid var(--border);
    padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: .85rem;
    animation: fover .2s ease;
  }

  /* REVEAL */
  .reveal { opacity: 0; transform: translateY(22px); transition: opacity .7s var(--ease), transform .7s var(--ease); }
  .reveal.in { opacity: 1; transform: translateY(0); }

  /* RESPONSIVE */
  @media (max-width:900px) {
    .exp-block { grid-template-columns: 1fr; gap: 1.5rem; }
    .ct-mega { grid-template-columns: 1fr; gap: 2.5rem; }
    .proj-grid { grid-template-columns: repeat(2,1fr); }
  }
  @media (max-width:600px) {
    .hero-name { font-size: clamp(3.5rem,17vw,6rem); }
    .sec { padding: 4.5rem 1.25rem; }
    .hero-wrap { padding: 0 1.25rem 4rem; }
    .stats { flex-wrap: wrap; }
    .stat { flex: 1 1 50%; border-bottom: 1px solid var(--border); }
    .proj-grid { grid-template-columns: 1fr; }
    .skills-grid { grid-template-columns: 1fr 1fr; }
    .think-row { grid-template-columns: 46px 1fr; gap: 0 1.25rem; }
    .tnum { font-size: 2rem; }
    .nav-links { display: none; }
    .menu-btn { display: flex; }
    .hero-wrap {
    min-height: auto;
    justify-content: flex-start;
    padding: calc(var(--nav-h) + 1.5rem) 1.25rem 3rem;
  }
  
  .hero-name {
    font-size: clamp(3rem, 12vw, 5rem);
    margin-bottom: 1rem;
  }
  
  .hero-desc {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
  
  .scroll-hint {
    display: none; /* hides the vertical scroll hint on mobile to save space */
  }
  }
`;

/* ── Helper functions (must be fully implemented) ── */
function useRev(t = 0.1) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.unobserve(e.target);
        }
      },
      { threshold: t },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [t]);
  return [ref, vis];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, vis] = useRev();
  return (
    <div
      ref={ref}
      className={`reveal${vis ? " in" : ""}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const rpos = useRef({ x: -100, y: -100 });
  const [big, setBig] = useState(false);
  const raf = useRef(null);

  useEffect(() => {
    const mv = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    const on = () => setBig(true);
    const off = () => setBig(false);
    window.addEventListener("mousemove", mv);
    const els = document.querySelectorAll("a,button,[data-h]");
    els.forEach((el) => {
      el.addEventListener("mouseenter", on);
      el.addEventListener("mouseleave", off);
    });
    const tick = () => {
      if (dot.current) {
        dot.current.style.left = pos.current.x + "px";
        dot.current.style.top = pos.current.y + "px";
      }
      rpos.current.x += (pos.current.x - rpos.current.x) * 0.11;
      rpos.current.y += (pos.current.y - rpos.current.y) * 0.11;
      if (ring.current) {
        ring.current.style.left = rpos.current.x + "px";
        ring.current.style.top = rpos.current.y + "px";
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", mv);
      cancelAnimationFrame(raf.current);
    };
  }, []);
  return (
    <>
      <div ref={dot} className="cdot" />
      <div ref={ring} className={`cring${big ? " big" : ""}`} />
    </>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Portfolio() {
  const [active, setActive] = useState("About");
  const [modal, setModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [scrolled, setScrolled] = useState(false);
  const [expExp, setExpExp] = useState(false);

  useEffect(() => {
    const id = "pf-v4";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 30);
      const secs = NAV.map((id) => document.getElementById(id)).filter(Boolean);
      for (const s of secs) {
        const r = s.getBoundingClientRect();
        if (r.top <= 120 && r.bottom >= 120) {
          setActive(s.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modal !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const hl = EXPERIENCE[0].highlights;
  const vis = expExp ? hl : hl.slice(0, 3);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Cursor />

      {/* NAV */}
      <nav className={`nav${scrolled ? " solid" : ""}`}>
        <span className="nav-logo" onClick={() => goTo("About")} data-h>
          chand.dev
        </span>
        <div className="nav-links">
          {NAV.map((n) => (
            <button
              key={n}
              onClick={() => goTo(n)}
              className={`nlink${active === n ? " on" : ""}`}
              data-h
            >
              {n}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
          <button
            className="theme-btn"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            data-h
          >
            {theme === "dark" ? "○" : "●"}
          </button>
          <button
            className="menu-btn"
            onClick={() => setMenuOpen((m) => !m)}
            data-h
          >
            {menuOpen ? "✕" : "≡"}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mmenu">
          {NAV.map((n) => (
            <button
              key={n}
              className={`nlink${active === n ? " on" : ""}`}
              onClick={() => goTo(n)}
              style={{ fontSize: ".9rem", textAlign: "left" }}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* HERO */}
      <section id="About">
        <div className="hero-wrap">
          <p className="hero-eyebrow">
            Program Management Leader · BFSI · Loyalty & Rewards
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "2.5rem",
              flexWrap: "wrap",
              marginBottom: "2rem",
            }}
          >
            <h1 className="hero-name" style={{ marginBottom: 0, flex: 1 }}>
              <span className="hline">
                <span className="hliner">Chand</span>
              </span>
              <span className="hline">
                <span className="hliner" style={{ animationDelay: ".07s" }}>
                  <em>Basha</em>
                </span>
              </span>
            </h1>
            <div
              style={{
                width: "clamp(160px, 22vw, 240px)",
                height: "clamp(160px, 22vw, 240px)",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid var(--bordermd)",
                animation: "rise .9s var(--ease) .5s both",
                flexShrink: 0,
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
              }}
            >
              <img
                src="/profile2.png"
                alt="Chand Basha"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          </div>
          <p className="hero-desc">
            Program Management Leader with 11+ years delivering large-scale
            loyalty, rewards, and BFSI platforms for major banking clients —
            spanning end-to-end program delivery, Agile/SAFe execution,
            cross-functional team leadership, and enterprise release governance.
          </p>
          <div className="hero-ctas">
            <a
              href="/Chand_Basha_Lead_Program_Manager.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="bsolid"
              data-h
            >
              View Resume ↗
            </a>
            <a
              href="/Chand_Basha_Lead_Program_Manager.pdf"
              download
              className="boutline"
              data-h
            >
              Download ↓
            </a>
            <span className="hero-status">
              <span className="gdot" /> Open to Program Leadership roles
            </span>
          </div>
          <div className="scroll-hint">scroll</div>
        </div>

        <div className="stats">
          {[
            ["11+", "Years experience"],
            ["30+", "Team size led"],
            ["12+", "Major releases"],
            ["92%", "On-time delivery"],
          ].map(([v, l]) => (
            <div key={v} className="stat">
              <div className="sv">{v}</div>
              <div className="sl">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SKILLS */}
      <section id="Skills" className="sec">
        <Reveal>
          <div className="sec-hd">
            <span className="sec-num">01</span>
            <h2 className="sec-title">
              Technical <em>Skills</em>
            </h2>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="skills-grid">
            {SKILLS.map(({ label, icon, items }) => (
              <div key={label} className="sk-cell">
                <div className="sk-hd">
                  <div className="sk-icon">{icon}</div>
                  <span className="sk-name">{label}</span>
                </div>
                <div className="sk-tags">
                  {items.map((i) => (
                    <span key={i} className="sk-tag">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* EXPERIENCE */}
      <section id="Experience" className="sec" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="sec-hd">
            <span className="sec-num">02</span>
            <h2 className="sec-title">
              Work <em>Experience</em>
            </h2>
          </div>
        </Reveal>
        {EXPERIENCE.map((exp, idx) => (
          <Reveal key={exp.company}>
            <div className="exp-block">
              <div>
                <div className="exp-role">{exp.role}</div>
                <div className="exp-co">{exp.company}</div>
                <span className="exp-period">
                  {exp.location} · {exp.period}
                </span>
                <p className="exp-ctx">{exp.context}</p>
              </div>
              <div>
                <ul className="exp-bullets">
                  {(idx === 0 ? vis : exp.highlights).map((h, i) => (
                    <li key={i} className="exp-li">
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                {idx === 0 && hl.length > 3 && (
                  <button
                    className="more-btn"
                    onClick={() => setExpExp((e) => !e)}
                    data-h
                  >
                    {expExp ? "▲ Show less" : `▼ Show ${hl.length - 3} more`}
                  </button>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* EDUCATION */}
      <section id="Education" className="sec" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="sec-hd">
            <span className="sec-num">03</span>
            <h2 className="sec-title">Education</h2>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="edu-grid">
            {EDUCATION.map((e, i) => (
              <div key={i} className="edu-cell">
                <div className="edu-deg">{e.degree}</div>
                <span className="edu-per">{e.period}</span>
                <div className="edu-sch">{e.school}</div>
                {e.details.map((d, j) => (
                  <p key={j} className="edu-det">
                    {d}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* PROJECTS */}
      <section id="Projects" className="sec" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="sec-hd">
            <span className="sec-num">04</span>
            <h2 className="sec-title">
              Selected <em>Projects</em>
            </h2>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="proj-grid">
            {PROJECTS.map((p, i) => (
              <div
                key={p.title}
                className={`pcard${modal === i ? " sel" : ""}`}
                onClick={() => setModal(i)}
                data-h
              >
                <img src={p.src} alt={p.title} className="pcard-img" />
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span className="pnum">0{i + 1}</span>
                  <span className="parrow">↗</span>
                </div>
                <div className="ptitle">{p.title}</div>
                <p className="pdesc">{p.description}</p>
                <span className="ptag">{p.tag}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Modal */}
      {modal !== null && (
        <div className="moverlay" onClick={() => setModal(null)}>
          <div className="mbox" onClick={(e) => e.stopPropagation()}>
            <button className="mclose" onClick={() => setModal(null)} data-h>
              ✕
            </button>
            <div className="minner">
              <img
                src={PROJECTS[modal].src}
                alt={PROJECTS[modal].title}
                className="modal-img"
              />
              <div
                style={{
                  display: "flex",
                  gap: ".75rem",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <h2 className="mtitle">{PROJECTS[modal].title}</h2>
                <span className="ptag" style={{ marginTop: ".5rem" }}>
                  {PROJECTS[modal].tag}
                </span>
              </div>
              <div>
                <p className="mbl">Problem</p>
                <p className="mbt">{PROJECTS[modal].details.problem}</p>
              </div>
              <div>
                <p className="mbl">Approach</p>
                <p className="mbt">{PROJECTS[modal].details.approach}</p>
              </div>
              <div>
                <p className="mbl">Stack</p>
                <div className="mpills">
                  {PROJECTS[modal].details.stack.map((s) => (
                    <span key={s} className="mpill">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mimpact">✓ {PROJECTS[modal].details.impact}</div>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {PROJECTS[modal].links.github &&
                  PROJECTS[modal].links.github !== "#" && (
                    <a
                      href={PROJECTS[modal].links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="boutline"
                      data-h
                    >
                      GitHub ↗
                    </a>
                  )}
                <button
                  className="boutline"
                  onClick={() => setModal((m) => (m + 1) % PROJECTS.length)}
                  data-h
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THINKING */}
      <section id="Thinking" className="sec" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="sec-hd">
            <span className="sec-num">05</span>
            <h2 className="sec-title">
              Leadership <em>Thinking</em>
            </h2>
          </div>
        </Reveal>
        {THINKING.map((t, i) => (
          <Reveal key={t.num} delay={i * 55}>
            <div className="think-row">
              <div className="tnum">{t.num}</div>
              <div className="tcnt">
                <h3 className="thead">{t.heading}</h3>
                <p className="tbody">{t.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* CONTACT */}
      <section id="Contact" className="sec" style={{ paddingBottom: "8rem" }}>
        <Reveal>
          <div className="sec-hd">
            <span className="sec-num">06</span>
            <h2 className="sec-title">
              Get in <em>Touch</em>
            </h2>
          </div>
        </Reveal>
        <div className="ct-mega">
          <Reveal>
            <div>
              <h3 className="ct-hl">
                Let's
                <br />
                build
                <br />
                programs.
              </h3>
              <p className="ct-sub">
                Open to Program Management leadership roles — BFSI, Loyalty,
                Rewards, or high-scale delivery. Based in Bangalore. Response
                within 24 hours.
              </p>
              <div
                style={{
                  marginTop: "2rem",
                  display: "flex",
                  gap: ".6rem",
                  flexWrap: "wrap",
                }}
              >
                <a
                  href="/Chand_Basha_Lead_Program_Manager.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bsolid"
                  data-h
                >
                  View Resume ↗
                </a>
                <a
                  href="/Chand_Basha_Lead_Program_Manager.pdf"
                  download
                  className="boutline"
                  data-h
                >
                  Download ↓
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="ct-links">
              {[
                {
                  l: "Email",
                  v: "yess.chand@gmail.com",
                  h: "mailto:yess.chand@gmail.com",
                },
                { l: "LinkedIn", v: "linkedin.com/in/chand-basha", h: "#" },
                { l: "Phone", v: "+91 99007 74876", h: "tel:+919900774876" },
              ].map(({ l, v, h }) => (
                <a
                  key={l}
                  href={h}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ct-row"
                  data-h
                >
                  <div>
                    <div className="ct-lbl">{l}</div>
                    <div className="ct-val">{v}</div>
                  </div>
                  <span className="ct-arr">↗</span>
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <div className="footer-strip">
        <span>© {new Date().getFullYear()} Chand Basha</span>
        <span>Program Management Leader · Bangalore</span>
        <span>Built with React</span>
      </div>
    </div>
  );
}
