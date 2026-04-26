import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   DATA  (unchanged)
───────────────────────────────────────────── */
const NAV = [
  "About",
  "Skills",
  "Experience",
  "Projects",
  "Incident",
  "Thinking",
  "Contact",
];

const SKILLS = [
  {
    label: "Languages",
    icon: "{ }",
    items: ["Java 8", "Java 11", "Java 17", "SQL", "Shell Scripting"],
  },
  {
    label: "Frameworks",
    icon: "⚙",
    items: [
      "Spring Boot",
      "Spring MVC",
      "Spring Security",
      "Hibernate / JPA",
      "Resilience4j",
    ],
  },
  {
    label: "Messaging & Events",
    icon: "⇄",
    items: [
      "Apache Kafka",
      "Event-driven design",
      "Dead-letter queues",
      "AWS SQS",
    ],
  },
  {
    label: "Databases",
    icon: "▣",
    items: [
      "MySQL",
      "Redis (Lua, atomic ops, TTL)",
      "MongoDB",
      "Stored procedures",
    ],
  },
  {
    label: "Auth & Security",
    icon: "⌗",
    items: ["JWT", "OAuth2", "RBAC", "Spring Security"],
  },
  {
    label: "Cloud & Infrastructure",
    icon: "◈",
    items: [
      "AWS EC2",
      "AWS RDS",
      "CloudWatch",
      "Secrets Manager",
      "Docker",
      "CI/CD",
      "Maven",
    ],
  },
  {
    label: "Observability",
    icon: "◎",
    items: [
      "Grafana",
      "CloudWatch Alarms",
      "Structured JSON logging",
      "Distributed tracing",
      "Swagger / OpenAPI",
    ],
  },
];

const EXPERIENCE = [
  {
    area: "Payment idempotency",
    detail:
      "Eliminated duplicate financial transactions entirely by architecting end-to-end idempotency across the Phicommerce gateway — covering initiation, async webhook handling, settlement reconciliation, and dead-letter retry workflows. Zero duplicates across 6+ months of live production.",
  },
  {
    area: "Latency & throughput",
    detail:
      "Cut p99 API latency by 30% (500ms → 350ms) by introducing Redis caching on high-frequency read paths and rewriting N+1 MySQL queries with composite indexes. Gains held under real production traffic spikes.",
  },
  {
    area: "Payment provider expansion",
    detail:
      "Onboarded Phicommerce as a second live payment gateway alongside the existing ICICI Bank settlement flow — zero stored procedure breakage, zero schema migrations, two providers live in parallel from day one.",
  },
  {
    area: "Resilience engineering",
    detail:
      "Eliminated cascading failures across 4 dependent microservices by applying Resilience4j circuit breakers, exponential-backoff retries, and thread-pool bulkheads. A single downstream timeout no longer takes out the calling service.",
  },
  {
    area: "Loyalty & rewards",
    detail:
      "Built the iCash Loyalty Engine — rule-based reward crediting with atomic Lua scripts in Redis and SETNX-based initialisation, making concurrent reward requests fully idempotent with zero duplicate credits.",
  },
  {
    area: "Travel platform",
    detail:
      "Designed a Hotel Booking Service unifying MMT, Cleartrip, Yatra, and Tripsure behind one abstraction — search, pricing, booking, and cancellation through a single interface with per-provider error isolation.",
  },
  {
    area: "Observability",
    detail:
      "Improved mean-time-to-detect across all services by setting up Grafana + CloudWatch dashboards tracking p50/p99 latency, error rates, and Kafka consumer lag. Dashboards ship with the feature, not after the first incident.",
  },
];

const PROJECTS = [
  {
    title: "Payment Gateway Integration",
    subtitle: "Razorpay · Phicommerce · ICICI Bank · Kotak Mahindra",
    tag: "Fintech · Production",
    problem:
      "No standard contract existed for payment providers — each was wired directly into business logic. New provider onboarding required invasive changes across the codebase. Webhook retries from providers caused the same payment event to land 3–4 times, with no safeguard against double-processing.",
    architecture:
      "Defined a provider-agnostic PaymentGatewayClient interface (order creation, status polling, webhook ingestion). Each provider is an isolated adapter. Webhook events land on a Kafka topic first — the consumer owns all state transitions using Redis SETNX idempotency keys with a DB-level unique constraint as a hard backstop. Bank settlement files from ICICI and Kotak are parsed and matched against internal records through a stored-procedure pipeline running nightly.",
    stack: [
      "Java 17",
      "Spring Boot",
      "Kafka",
      "Redis (Lua + SETNX)",
      "MySQL",
      "Resilience4j",
      "AWS SQS",
    ],
    diagram: [
      "Client → REST API → Kafka Topic",
      "                         ↓",
      "              Webhook Consumer",
      "                   ↓        ↓",
      "        Redis (SETNX)    State Machine",
      "                              ↓",
      "                     MySQL (unique constraint)",
    ],
    challenges: [
      "Duplicate webhook delivery: same payment success event arriving 3–4× due to provider retries. Resolved with Redis SETNX idempotency key + DB unique constraint as a two-layer guard.",
      "Phicommerce onboarding without touching the existing ICICI stored procedure — added provider_code column and conditional routing in the settlement parser.",
      "Late webhook arrivals after order timeout — state machine explicitly rejects illegal terminal-state transitions rather than silently ignoring them.",
    ],
    impact:
      "Zero duplicate financial transactions across 6+ months of live production traffic. New payment provider onboarded in under a week with zero downtime.",
  },
  {
    title: "iCash Loyalty Engine",
    subtitle: "Internal Platform · Rewards Engine · Kotak",
    tag: "Fintech · Production",
    problem:
      "Multiple services were independently checking and decrementing a shared rewards budget in MySQL — causing race conditions under concurrent load and occasional over-disbursement. The check-then-act pattern was fundamentally broken at scale.",
    architecture:
      "Moved the budget counter to Redis with an atomic Lua script that checks balance and decrements in a single operation — eliminating the check-then-act race entirely. SETNX initialises the key exactly once even under concurrent service startup. A scheduled reconciler reads MySQL truth and patches the Redis counter if drift is detected. All ops emit structured logs with caller identity, budget key, and pre/post values for audit.",
    stack: [
      "Java 17",
      "Spring Boot",
      "Redis (Lua scripting)",
      "MySQL",
      "Scheduled tasks",
    ],
    diagram: [
      "Reward Request → Redis Lua Script",
      "                    ↓",
      "          Atomic check + decrement",
      "                    ↓",
      "     MySQL (scheduled reconciler · truth source)",
    ],
    challenges: [
      "Concurrent service startup causing multiple SETNX races during Redis cold-start — handled by letting SETNX be idempotent and sourcing the canonical value from MySQL on init.",
      "Redis eviction under memory pressure could silently zero a budget counter — added a guard that refuses to initialise to zero when MySQL shows a non-zero value.",
    ],
    impact:
      "Eliminated reward over-disbursement completely. Counter operations are now O(1) and fully atomic regardless of concurrent callers.",
  },
  {
    title: "Unified Travel Partner Client Layer",
    subtitle: "Cleartrip V4 · MMT · Yatra · Tripsure",
    tag: "Travel · Production",
    problem:
      "Each travel provider SDK had its own error format, auth flow, and retry behavior. Services mixed provider-specific logic with booking logic and logged inconsistently — making production debugging require reading four different log formats across three providers.",
    architecture:
      "Built a structured HTTP boundary layer (CleartripV4Client and equivalents for MMT, Yatra, Tripsure) that hides auth token lifecycle, maps provider DTOs into a canonical internal format, and normalises all provider errors into a shared ApiException hierarchy. Resilience4j circuit breakers and retries sit at the client boundary. Redis caches hotel metadata and availability windows (TTL tuned per data volatility); MongoDB caches aggregated search responses for ~15 minutes.",
    stack: [
      "Java 11",
      "Spring Boot",
      "Redis",
      "MongoDB",
      "Resilience4j",
      "Grafana",
      "Logback (JSON)",
    ],
    diagram: [
      "Business Logic → Aggregator Service",
      "                        ↓",
      "         Unified Client Interface",
      "        ↓          ↓          ↓",
      "  Cleartrip      MMT       Yatra",
      "                        ↓",
      "          MongoDB (search cache · 15 min TTL)",
    ],
    challenges: [
      "Provider auth flows varied — token-based, API-key, session-scoped — all hidden behind a common interface without leaking provider concerns to callers.",
      "Inconsistent error shapes required building a canonical error taxonomy so callers always handle the same exception types regardless of provider.",
      "Cache invalidation for room availability — providers emit no change events, so short TTLs with a background refresher were used rather than event-driven invalidation.",
    ],
    impact:
      "Provider-call latency reduced by ~30% (500ms → 350ms). Production debug time reduced ~40% due to consistent structured logging. New providers onboard without touching booking logic.",
  },
];

const THINKING = [
  {
    num: "01",
    heading: "Idempotency is a contract, not a feature flag",
    body: "In payment systems, the dangerous assumption is that your service receives each event exactly once. Providers retry. Networks split. Clients time out and retry. I design every write operation to be safe to execute twice — idempotency key in Redis, unique constraint in the DB, and a state machine that explicitly rejects illegal transitions. The two-layer guard isn't redundancy for its own sake — each layer covers a failure mode the other can't.",
  },
  {
    num: "02",
    heading: "Design failure paths before success paths",
    body: "Every external call I write has a timeout, a retry policy, and a fallback. I think about what happens when the third-party API hangs for 30 seconds before I think about what happens when it returns 200. Circuit breakers aren't an optimisation — they're table stakes in a microservices world. I draw failure modes on the architecture diagram first.",
  },
  {
    num: "03",
    heading: "Caching requires a strategy, not just Redis.set()",
    body: "Before writing any data access layer I ask: what's the read-to-write ratio? How stale is too stale? Who owns invalidation? For hotel metadata, 10 minutes stale is fine. For payment status, it isn't. TTL-based expiry and event-driven invalidation solve different problems and I pick based on the data, not convenience.",
  },
  {
    num: "04",
    heading: "Observability ships with the feature, not after the incident",
    body: "If I can't tell from logs whether a request succeeded in production, the feature isn't done. Structured logging (request ID, provider, latency, status, error code) and Grafana dashboards are first-class requirements — scoped into the same ticket as the code. The first on-call incident shouldn't be when I find out the dashboards are missing.",
  },
  {
    num: "05",
    heading: "When production breaks at 2am",
    body: "Symptom first, then walk backwards through the request path — logs, metrics, traces. I don't guess. Most incidents I've seen had one root cause but manifested in three places simultaneously; jumping to the loudest alert wastes time. Once I've isolated the failing call, I look at what changed in the last deploy and what the external dependency returned — or didn't.",
  },
];

/* ─────────────────────────────────────────────
   GLOBAL CSS  (completely reworked)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Geist:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }

  :root {
    /* Light theme (default) – clean, high‑contrast */
    --bg: #ffffff;
    --bg-card: #ffffff;
    --bg-subtle: #f5f5f5;
    --bg-inset: #ebebeb;
    --text-primary: #0a0a0a;
    --text-secondary: #3d3d3d;
    --text-muted: #737373;
    --border: rgba(0,0,0,0.06);
    --border-strong: rgba(0,0,0,0.12);
    --accent: #0a0a0a;
    --blue: #1d4ed8;
    --blue-soft: rgba(29,78,216,0.06);
    --blue-border: rgba(29,78,216,0.16);
    --green: #0f7b3b;
    --green-soft: rgba(15,123,59,0.08);
    --green-border: rgba(15,123,59,0.16);
    --amber: #b45309;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03);
    --shadow-lg: 0 16px 40px rgba(0,0,0,0.07), 0 4px 8px rgba(0,0,0,0.04);
    --r: 10px;
    --r-sm: 6px;
    --r-lg: 16px;
    --nav-bg: rgba(255,255,255,0.92);
    --font-display: 'Instrument Serif', Georgia, serif;
    --font-mono: 'DM Mono', monospace;
    --font-body: 'Geist', system-ui, -apple-system, sans-serif;
    --nav-h: 56px;
    --space-4: 16px;
    --space-6: 24px;
    --space-8: 32px;
  }

  [data-theme="dark"] {
    --bg: #0a0a0a;
    --bg-card: #111111;
    --bg-subtle: #1a1a1a;
    --bg-inset: #1f1f1f;
    --text-primary: #f5f5f5;
    --text-secondary: #a3a3a3;
    --text-muted: #525252;
    --border: rgba(255,255,255,0.06);
    --border-strong: rgba(255,255,255,0.11);
    --accent: #f5f5f5;
    --blue: #3b82f6;
    --blue-soft: rgba(59,130,246,0.09);
    --blue-border: rgba(59,130,246,0.22);
    --green: #22c55e;
    --green-soft: rgba(34,197,94,0.08);
    --green-border: rgba(34,197,94,0.18);
    --amber: #f59e0b;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.35);
    --shadow-lg: 0 20px 48px rgba(0,0,0,0.45);
    --nav-bg: rgba(10,10,10,0.92);
  }

  body {
    background: var(--bg);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.6;
    transition: background 0.25s, color 0.25s;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }
  ::selection { background: var(--blue-soft); }

  /* ---------- Typography ---------- */
  .t-display {
    font-family: var(--font-display);
    font-size: clamp(3rem, 7vw, 5.2rem);
    font-weight: 400;
    line-height: 1.0;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }
  .t-display em { font-style: italic; color: var(--text-secondary); }

  .t-section {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 400;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }

  .t-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--blue);
    font-weight: 400;
  }

  .t-body {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.75;
    font-weight: 400;
    font-family: var(--font-body);
  }

  .t-mono {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }

  /* ---------- Layout ---------- */
  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .section {
    padding: 5rem 0;
    border-top: 1px solid var(--border);
  }

  .divider { height: 1px; background: var(--border); }

  /* ---------- Nav ---------- */
  .nav-link {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px 0;
    position: relative;
    transition: color 0.2s;
    user-select: none;
    text-decoration: none;
  }
  .nav-link:hover { color: var(--text-secondary); }
  .nav-link.active { color: var(--text-primary); }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0;
    height: 2px;
    width: 0;
    background: var(--accent);
    transition: width 0.2s ease;
    border-radius: 2px;
  }
  .nav-link.active::after { width: 100%; }

  /* ---------- Buttons ---------- */
  .btn-primary {
    padding: 9px 20px;
    background: var(--text-primary);
    color: var(--bg);
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    font-weight: 500;
  }
  .btn-primary:hover { opacity: 0.85; transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .btn-primary:active { transform: translateY(0); opacity: 1; }

  .btn-ghost {
    padding: 9px 18px;
    border: 1px solid var(--border-strong);
    color: var(--text-secondary);
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    font-weight: 500;
  }
  .btn-ghost:hover { color: var(--text-primary); background: var(--bg-subtle); transform: translateY(-1px); }
  .btn-ghost:active { transform: translateY(0); }

  /* ---------- Card ---------- */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--r);
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  /* ---------- Tags ---------- */
  .tag {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.07em;
    padding: 3px 10px;
    border-radius: 4px;
    display: inline-block;
    line-height: 1.6;
    font-weight: 500;
  }
  .tag-blue { background: var(--blue-soft); color: var(--blue); border: 1px solid var(--blue-border); }
  .tag-neutral { background: var(--bg-subtle); color: var(--text-muted); border: 1px solid var(--border); }
  .tag-green { background: var(--green-soft); color: var(--green); border: 1px solid var(--green-border); }

  /* ---------- Skill pills ---------- */
  .skill-pill {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-secondary);
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 12px;
    transition: all 0.15s;
    letter-spacing: 0.02em;
    cursor: default;
    font-weight: 500;
  }
  .skill-pill:hover {
    color: var(--blue);
    border-color: var(--blue-border);
    background: var(--blue-soft);
    transform: translateY(-1px);
  }

  /* ---------- Hero ---------- */
  .hero-section {
    padding: clamp(6rem, 14vh, 9rem) 0 4rem;
    border-bottom: 1px solid var(--border);
  }
  .hero-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4rem;
  }
  .hero-image-wrap {
    flex-shrink: 0;
    position: relative;
    width: clamp(140px, 20vw, 200px);
    height: clamp(140px, 20vw, 200px);
  }
  .hero-image-border {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--border-strong);
    opacity: 0.6;
  }
  .hero-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    filter: grayscale(5%);
  }

  /* ---------- Status badge ---------- */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 99px;
    border: 1px solid var(--green-border);
    background: var(--green-soft);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--green);
    letter-spacing: 0.04em;
    margin-bottom: 1.75rem;
    transition: border-color 0.2s;
  }
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    flex-shrink: 0;
    animation: pulse-ring 2.4s infinite;
  }

  /* ---------- Stats bar ---------- */
  .stats-bar {
    display: flex;
    border-top: 1px solid var(--border);
    padding-top: 2rem;
    margin-top: 4rem;
  }
  .stat-item {
    flex: 1 1 160px;
    padding: 0 2rem 0 0;
    border-right: 1px solid var(--border);
    margin-right: 2rem;
  }
  .stat-item:last-child { border-right: none; margin-right: 0; padding-right: 0; }
  .stat-value {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 400;
    color: var(--text-primary);
    line-height: 1.2;
  }
  .stat-label {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--text-muted);
    margin-top: 6px;
    letter-spacing: 0.05em;
  }

  /* ---------- Section headings ---------- */
  .section-heading {
    margin-bottom: 2.5rem;
  }
  .block-heading {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  /* ---------- Experience row ---------- */
  .exp-grid {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 2rem;
    padding: 1.8rem 0;
    border-bottom: 1px solid var(--border);
  }
  .exp-grid:last-child { border-bottom: none; }
  .exp-title {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-primary);
    letter-spacing: 0.02em;
  }
  .exp-detail {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  /* ---------- Project expandable ---------- */
  .project-trigger {
    cursor: pointer;
    padding: 2rem 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.15s;
  }
  .project-trigger:hover { background: var(--bg-subtle); }
  .project-content {
    padding: 2rem 0 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  /* ---------- Thinking entries ---------- */
  .thinking-item {
    padding: 2rem 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 1.5rem;
  }
  .thinking-num {
    font-family: var(--font-display);
    font-size: 1.8rem;
    color: var(--text-muted);
    min-width: 50px;
    line-height: 1;
    opacity: 0.5;
  }

  /* ---------- Animations ---------- */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeUp 0.5s ease forwards; }
  .fade-in-1 { animation: fadeUp 0.5s 0.1s ease both; }
  .fade-in-2 { animation: fadeUp 0.5s 0.22s ease both; }
  .fade-in-3 { animation: fadeUp 0.5s 0.36s ease both; }

  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 var(--green); }
    70% { box-shadow: 0 0 0 4px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  /* ---------- Mobile ---------- */
  .nav-desktop { display: flex; }
  .nav-mobile-btn { display: none; }

  @media (max-width: 768px) {
    .container { padding: 0 1.5rem; }
    .section { padding: 3.5rem 0; }
    .hero-inner { flex-direction: column-reverse; align-items: flex-start; gap: 2rem; }
    .hero-image-wrap { align-self: center; width: 140px; height: 140px; }
    .stats-bar { flex-direction: column; gap: 1.25rem; }
    .stat-item { border-right: none !important; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; margin-right: 0; padding-right: 0; }
    .stat-item:last-child { border-bottom: none; }
    .contact-row { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .exp-grid { grid-template-columns: 1fr; gap: 0.5rem; }
    .nav-desktop { display: none; }
    .nav-mobile-btn { display: block; }
  }
`;

/* ── Helper components ── */
// function Label({ children }) {
//   return (
//     <p className="t-label" style={{ marginBottom: "0.85rem" }}>
//       ↳ {children}
//     </p>
//   );
// }

function BlockHeading({ children }) {
  return <p className="block-heading">{children}</p>;
}

function ProjectBlock({ label, children }) {
  return (
    <div>
      <BlockHeading>{label}</BlockHeading>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("About");
  const [openProject, setOpenProject] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  // Inject global CSS once
  useEffect(() => {
    const id = "pf-global-css";
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
    const onScroll = () => {
      const secs = NAV.map((id) => document.getElementById(id)).filter(Boolean);
      let cur = "About";
      for (const sec of secs) {
        const r = sec.getBoundingClientRect();
        if (r.top <= 100 && r.bottom >= 100) {
          cur = sec.id;
          break;
        }
      }
      setActiveSection(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
    setMenuOpen(false);
  };

  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--text-primary)",
        minHeight: "100vh",
      }}
    >
      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          height: "var(--nav-h)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2rem",
        }}
      >
        <span
          className="t-mono"
          style={{
            fontWeight: 500,
            userSelect: "none",
            color: "var(--text-primary)",
          }}
        >
          fa.dev
        </span>

        <div
          className="nav-desktop"
          style={{ gap: "2.5rem", alignItems: "center" }}
        >
          {NAV.map((n) => (
            <span
              key={n}
              onClick={() => scrollTo(n)}
              className={`nav-link${activeSection === n ? " active" : ""}`}
            >
              {n}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="btn-ghost"
            style={{ padding: "5px 12px", fontSize: "0.72rem" }}
          >
            {theme === "light" ? "◐" : "◑"}
          </button>
          <button
            onClick={() => setMenuOpen((m) => !m)}
            className="nav-mobile-btn btn-ghost"
            style={{ border: "none", padding: "4px 6px", fontSize: "1.1rem" }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: "var(--nav-h)",
            left: 0,
            right: 0,
            zIndex: 99,
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
            padding: "1.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {NAV.map((n) => (
            <span
              key={n}
              className={`nav-link${activeSection === n ? " active" : ""}`}
              onClick={() => scrollTo(n)}
              style={{ fontSize: "0.95rem" }}
            >
              {n}
            </span>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section id="About" className="hero-section">
        <div className="container hero-inner fade-in">
          {/* Left */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <p className="t-label fade-in" style={{ marginBottom: "1.5rem" }}>
              ↳ Backend Engineer · Fintech · Distributed Systems
            </p>

            <h1
              className="t-display fade-in-1"
              style={{ marginBottom: "1.5rem" }}
            >
              Faisal
              <br />
              <em>Ali</em>
            </h1>

            <div className="status-badge fade-in-1">
              <span className="status-dot" />
              Open to backend roles
            </div>

            <p
              className="fade-in-2"
              style={{
                fontSize: "1.05rem",
                maxWidth: 480,
                lineHeight: 1.7,
                fontWeight: 400,
                color: "var(--text-secondary)",
              }}
            >
              I build production backend systems for payments and travel —
              specialising in idempotent flows, event-driven processing, and
              fault-tolerant microservice design that holds under real load.
            </p>

            <div
              className="fade-in-3"
              style={{
                marginTop: "2.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <a
                  href="/Faisal_Ali_Backend_Engineer.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  View Resume →
                </a>
                <a
                  href="/Faisal_Ali_Backend_Engineer.pdf"
                  download
                  className="btn-primary"
                >
                  Download ↓
                </a>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <a href="mailto:faisal.dev.ali@gmail.com" className="btn-ghost">
                  Email
                </a>
                <a
                  href="https://linkedin.com/in/faisal-ali-877bb4219"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  LinkedIn
                </a>
                <a
                  href="https://github.com/faisal-dev-ali"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="hero-image-wrap fade-in-2">
            <div className="hero-image-border" />
            <img src="/profile.png" alt="Faisal Ali" className="hero-avatar" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="container stats-bar fade-in-3">
          {[
            ["3+ yrs", "Production backend"],
            ["Java / Spring Boot", "Core stack"],
            ["Fintech & Travel", "Domain expertise"],
            ["0 duplicate txns", "6 months live"],
          ].map(([val, label]) => (
            <div key={val} className="stat-item">
              <div className="stat-value">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section id="Skills" className="section">
        <div className="container">
          <h2 className="t-section section-heading">Skills</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {SKILLS.map(({ label, icon, items }) => (
              <div key={label} className="card" style={{ padding: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.2rem",
                    }}
                  >
                    {icon}
                  </span>
                  <span
                    className="t-mono"
                    style={{ fontWeight: 500, color: "var(--text-primary)" }}
                  >
                    {label}
                  </span>
                </div>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}
                >
                  {items.map((item) => (
                    <span key={item} className="skill-pill">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ── */}
      <section id="Experience" className="section">
        <div className="container">
          <h2 className="t-section section-heading">Experience Highlights</h2>
          {EXPERIENCE.map(({ area, detail }) => (
            <div key={area} className="exp-grid">
              <div className="exp-title">{area}</div>
              <div className="exp-detail">{detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section id="Projects" className="section">
        <div className="container">
          <h2 className="t-section section-heading">Selected Projects</h2>
          {PROJECTS.map((project, idx) => (
            <div key={project.title}>
              <div
                className="project-trigger"
                onClick={() => setOpenProject(openProject === idx ? null : idx)}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginBottom: "0.3rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                      }}
                    >
                      {project.title}
                    </span>
                    <span className="tag tag-blue">{project.tag}</span>
                  </div>
                  <div className="t-mono" style={{ fontSize: "0.7rem" }}>
                    {project.subtitle}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {openProject === idx ? "−" : "+"}
                </span>
              </div>

              {openProject === idx && (
                <div className="project-content">
                  <ProjectBlock label="Problem">{project.problem}</ProjectBlock>
                  <ProjectBlock label="Architecture">
                    {project.architecture}
                  </ProjectBlock>
                  <ProjectBlock label="Stack">
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                      }}
                    >
                      {project.stack.map((s) => (
                        <span key={s} className="skill-pill">
                          {s}
                        </span>
                      ))}
                    </div>
                  </ProjectBlock>
                  {project.diagram && (
                    <ProjectBlock label="Flow">
                      <pre
                        className="t-mono"
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.6,
                          background: "var(--bg-subtle)",
                          padding: "1rem",
                          borderRadius: "var(--r-sm)",
                        }}
                      >
                        {project.diagram.join("\n")}
                      </pre>
                    </ProjectBlock>
                  )}
                  <ProjectBlock label="Challenges">
                    <ul
                      style={{
                        paddingLeft: "1.2rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}
                    >
                      {project.challenges.map((c) => (
                        <li key={c} className="t-body">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </ProjectBlock>
                  <ProjectBlock label="Impact">
                    <p
                      style={{
                        color: "var(--green)",
                        fontWeight: 500,
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.78rem",
                      }}
                    >
                      {project.impact}
                    </p>
                  </ProjectBlock>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── INCIDENT (placeholder) ── */}
      <section id="Incident" className="section">
        <div className="container">
          <h2 className="t-section section-heading">Incident Response</h2>
          <div className="card" style={{ padding: "2rem" }}>
            <p className="t-body">
              Every production incident I’ve handled has followed a structured
              approach: isolate the failing component, verify recent changes,
              and trace the request through logs/metrics — never guess. More
              details available upon request.
            </p>
          </div>
        </div>
      </section>

      {/* ── THINKING ── */}
      <section id="Thinking" className="section">
        <div className="container">
          <h2 className="t-section section-heading">Engineering Thinking</h2>
          {THINKING.map(({ num, heading, body }) => (
            <div key={num} className="thinking-item">
              <div className="thinking-num">{num}</div>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.3rem",
                    fontWeight: 400,
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {heading}
                </h3>
                <p className="t-body">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="Contact" className="section">
        <div className="container">
          <h2 className="t-section section-heading">Let’s work together</h2>
          <div
            className="card"
            style={{
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <p className="t-body" style={{ maxWidth: "600px" }}>
              I’m currently open to backend engineering roles — especially those
              involving distributed systems, payments, or high‑availability
              services. Reach out and I’ll respond within 24 hours.
            </p>
            <div
              className="contact-row"
              style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
            >
              <a href="mailto:faisal.dev.ali@gmail.com" className="btn-primary">
                faisal.dev.ali@gmail.com
              </a>
              <a
                href="https://linkedin.com/in/faisal-ali-877bb4219"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                LinkedIn ↗
              </a>
              <a
                href="https://github.com/faisal-dev-ali"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: "2rem 0", textAlign: "center" }}>
        <p className="t-mono" style={{ fontSize: "0.65rem" }}>
          © {new Date().getFullYear()} Faisal Ali — Built with React. No
          frameworks, no bloat.
        </p>
      </footer>
    </div>
  );
}
