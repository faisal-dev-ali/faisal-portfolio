import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   DATA — your resume content (unchanged)
───────────────────────────────────────────── */
const NAV = [
  "About",
  "Skills",
  "Experience",
  "Projects",
  "Thinking",
  "Contact",
];

const SKILLS = [
  {
    label: "Languages",
    icon: "{ }",
    items: ["Java 8", "Java 11", "Java 17", "SQL"],
  },
  {
    label: "Frameworks",
    icon: "⚙",
    items: ["Spring Boot", "Spring MVC", "Spring Security", "Hibernate / JPA"],
  },
  {
    label: "Distributed Systems",
    icon: "⇄",
    items: ["Apache Kafka", "Redis (Lua, atomic ops, TTL)", "Resilience4j"],
  },
  {
    label: "Databases",
    icon: "▣",
    items: ["MySQL", "MongoDB", "Stored procedures", "Composite indexing"],
  },
  {
    label: "Auth & Security",
    icon: "⌗",
    items: ["JWT", "OAuth2", "RBAC"],
  },
  {
    label: "Cloud & DevOps",
    icon: "◈",
    items: [
      "AWS EC2",
      "API Gateway",
      "CloudWatch",
      "Secrets Manager",
      "Docker",
      "CI/CD",
      "Maven",
      "Git",
    ],
  },
  {
    label: "Observability",
    icon: "◎",
    items: ["Grafana", "Swagger / OpenAPI", "Distributed tracing", "HLD / LLD"],
  },
];

const EXPERIENCE = [
  {
    role: "Software Engineer",
    company: "R360 Global Services",
    location: "Bangalore, India",
    period: "May 2023 – Present",
    context:
      "Fintech-backed Travel & Rewards platform — microservices serving ICICI Bank and Kotak Mahindra",
    highlights: [
      "Reduced duplicate financial transactions to zero by designing end-to-end idempotency across the Phicommerce payment gateway — covering initiation, async webhook handling, settlement reconciliation, and dead-letter retry workflows.",
      "Cut API p99 latency by 30% by introducing Redis caching on high-frequency read paths and rewriting N+1 MySQL queries with composite indexes; improvements held under real production traffic spikes.",
      "Onboarded Phicommerce as a second live payment provider alongside the existing ICICI Bank settlement flow — zero stored procedure breakage, zero schema migrations, two providers live in parallel from day one.",
      "Eliminated cascading failures across 4 dependent microservices by applying Resilience4j circuit breakers, exponential-backoff retries, and thread-pool bulkheads — a single downstream timeout no longer takes out the caller.",
      "Built the iCash Loyalty Engine — rule-based reward crediting with atomic Lua scripts in Redis and SETNX-based initialization, making concurrent reward requests fully idempotent with zero duplicate credits.",
      "Designed a Hotel Booking Service that unified MMT, Cleartrip, Yatra, and Tripsure behind one abstraction — search, pricing, booking, and cancellation through a single interface with per-provider error isolation.",
      "Improved production incident mean-time-to-detect by setting up Grafana + CloudWatch dashboards tracking p50/p99 latency, error rates, and Kafka consumer lag across all services.",
    ],
  },
];

const PROJECTS = [
  {
    title: "Payment Gateway Integration",
    tag: "Fintech",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=300&fit=crop",
    description:
      "End-to-end idempotent payment processing across multiple providers with zero duplicate transactions in 6+ months of production.",
    details: {
      problem:
        "No standard contract existed for payment providers — each was wired directly into business logic. Webhook retries caused the same payment event to land 3–4 times with no safeguard against double-processing.",
      approach:
        "Defined a provider-agnostic PaymentGatewayClient interface. Webhook events land on Kafka — the consumer owns all state transitions using Redis SETNX idempotency keys with a DB-level unique constraint as a hard backstop. Bank settlement files parsed through a stored-procedure pipeline.",
      stack: [
        "Java 17",
        "Spring Boot",
        "Kafka",
        "Redis",
        "MySQL",
        "Resilience4j",
        "AWS SQS",
      ],
      impact:
        "Zero duplicate financial transactions. New provider onboarded in under a week with zero downtime.",
    },
    links: { github: "#", live: null },
  },
  {
    title: "iCash Loyalty Engine",
    tag: "Rewards",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop",
    description:
      "Atomic reward crediting engine with Redis Lua scripts — eliminated race conditions and over-disbursement entirely.",
    details: {
      problem:
        "Multiple services independently checking and decrementing a shared rewards budget in MySQL — causing race conditions and occasional over-disbursement under concurrent load.",
      approach:
        "Moved budget counter to Redis with atomic Lua script that checks balance and decrements in a single operation. SETNX initializes keys exactly once. Scheduled reconciler reads MySQL truth and patches Redis if drift detected.",
      stack: [
        "Java 17",
        "Spring Boot",
        "Redis (Lua)",
        "MySQL",
        "Scheduled tasks",
      ],
      impact:
        "Counter operations now O(1) and fully atomic. Zero over-disbursement regardless of concurrent callers.",
    },
    links: { github: "#", live: null },
  },
  {
    title: "Unified Travel Partner Layer",
    tag: "Travel",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=300&fit=crop",
    description:
      "Single abstraction over MMT, Cleartrip, Yatra, and Tripsure — 30% latency reduction, 40% faster debugging.",
    details: {
      problem:
        "Each travel provider SDK had its own error format, auth flow, and retry behavior. Production debugging required reading four different log formats.",
      approach:
        "Built structured HTTP boundary layer hiding auth token lifecycle, mapping provider DTOs into canonical format, normalizing all errors into shared exception hierarchy. Resilience4j at client boundary. Redis + MongoDB caching with TTL-tuned invalidation.",
      stack: [
        "Java 11",
        "Spring Boot",
        "Redis",
        "MongoDB",
        "Resilience4j",
        "Grafana",
      ],
      impact:
        "Provider-call latency down 30%. Debug time reduced ~40%. New providers onboard without touching booking logic.",
    },
    links: { github: "#", live: null },
  },
  {
    title: "HotelX — Booking Platform",
    tag: "Full-Stack",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=300&fit=crop",
    description:
      "Production-style hotel booking system with JWT auth, room search, full booking lifecycle, and React frontend.",
    details: {
      problem:
        "Build an end-to-end booking system demonstrating production patterns — from authentication to confirmation.",
      approach:
        "Spring Boot REST APIs secured with JWT. Room availability search with filtering. Full booking lifecycle: create → confirm → cancel. React frontend consuming the APIs. Clean layered architecture mirroring production OMS design.",
      stack: ["Spring Boot", "React", "MySQL", "JWT", "REST APIs"],
      impact:
        "End-to-end working booking platform. Demonstrates full-stack capability and production architecture patterns.",
    },
    links: {
      github: "https://github.com/faisal-dev-ali/hotel-service",
      live: null,
    },
  },
  {
    title: "Order Management Service",
    tag: "Backend",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=300&fit=crop",
    description:
      "Centralized multi-domain order creation, state transitions, and cancellation behind a single service.",
    details: {
      problem:
        "Multiple domains needed consistent order handling — creation, state management, and cancellation logic were scattered.",
      approach:
        "Built centralized OMS with clean layered architecture. Handles order creation, state transitions (pending → confirmed → shipped → delivered → cancelled), and cancellation with validation at each step. Mirrors the production OMS design.",
      stack: ["Spring Boot", "MySQL", "REST APIs"],
      impact:
        "Clean, reusable order management pattern. Used as reference architecture for production systems.",
    },
    links: {
      github: "https://github.com/faisal-dev-ali/order-service",
      live: null,
    },
  },
  {
    title: "Coupon & Promotions Engine",
    tag: "Backend",
    image:
      "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=300&fit=crop",
    description:
      "Rule-based coupon engine with one-time usage enforcement, customer segmentation, and expiry logic.",
    details: {
      problem:
        "Need a reusable coupon engine with one-time usage guarantees, customer eligibility rules, and automatic expiry — patterns drawn from production rewards work.",
      approach:
        "Rule-based engine with coupon validation, one-time usage enforcement via Redis, customer segmentation, and TTL-based expiry. Idempotency patterns from Kotak Rewards production work applied throughout.",
      stack: ["Spring Boot", "Redis", "MySQL"],
      impact:
        "Production-grade coupon patterns. Reusable across multiple domains with configurable rules.",
    },
    links: {
      github: "https://github.com/faisal-dev-ali/coupon-service",
      live: null,
    },
  },
];

const THINKING = [
  {
    num: "01",
    heading: "Idempotency is a contract, not a feature flag",
    body: "In payment systems, the dangerous assumption is that your service receives each event exactly once. Providers retry. Networks split. Clients time out and retry. I design every write operation to be safe to execute twice — idempotency key in Redis, unique constraint in the DB, and a state machine that explicitly rejects illegal transitions.",
  },
  {
    num: "02",
    heading: "Design failure paths before success paths",
    body: "Every external call I write has a timeout, a retry policy, and a fallback. I think about what happens when the third-party API hangs for 30 seconds before I think about what happens when it returns 200. Circuit breakers aren't an optimisation — they're table stakes.",
  },
  {
    num: "03",
    heading: "Caching requires a strategy, not just Redis.set()",
    body: "Before writing any data access layer I ask: what's the read-to-write ratio? How stale is too stale? Who owns invalidation? TTL-based expiry and event-driven invalidation solve different problems — I pick based on the data, not convenience.",
  },
  {
    num: "04",
    heading: "Observability ships with the feature, not after the incident",
    body: "If I can't tell from logs whether a request succeeded in production, the feature isn't done. Structured logging and Grafana dashboards are first-class requirements — the first on-call incident shouldn't be when I find out the dashboards are missing.",
  },
  {
    num: "05",
    heading: "When production breaks at 2am",
    body: "Symptom first, then walk backwards through the request path — logs, metrics, traces. Most incidents I've seen had one root cause but manifested in three places simultaneously; jumping to the loudest alert wastes time.",
  },
];

/* ─────────────────────────────────────────────
   GLOBAL CSS  (black & white / navy & white)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }

  :root {
    /* DARK THEME: black & white */
    --bg: #000000;
    --bg-card: #0a0a0a;
    --bg-card-hover: #141414;
    --bg-subtle: #0f0f0f;
    --bg-inset: #1a1a1a;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --text-muted: #666666;
    --border: rgba(255,255,255,0.08);
    --border-hover: rgba(255,255,255,0.18);
    --accent: #ffffff;
    --accent-inverse: #000000;
    --accent-soft: rgba(255,255,255,0.06);
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.5);
    --shadow-md: 0 8px 30px rgba(0,0,0,0.6);
    --shadow-lg: 0 16px 50px rgba(0,0,0,0.8);
    --r: 12px;
    --r-sm: 8px;
    --r-lg: 20px;
    --nav-bg: rgba(0,0,0,0.85);
    --font-display: 'Instrument Serif', Georgia, serif;
    --font-mono: 'DM Mono', monospace;
    --font-body: 'Inter', system-ui, -apple-system, sans-serif;
    --nav-h: 56px;
    --max-w: 960px;
    --transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  [data-theme="light"] {
    /* LIGHT THEME: white & navy */
    --bg: #ffffff;
    --bg-card: #ffffff;
    --bg-card-hover: #f8fafc;
    --bg-subtle: #f5f5f5;
    --bg-inset: #f0f0f0;
    --text-primary: #0a192f;
    --text-secondary: #334155;
    --text-muted: #64748b;
    --border: rgba(10,25,47,0.08);
    --border-hover: rgba(10,25,47,0.18);
    --accent: #0a192f;
    --accent-inverse: #ffffff;
    --accent-soft: rgba(10,25,47,0.04);
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 8px 25px rgba(0,0,0,0.06);
    --shadow-lg: 0 16px 40px rgba(0,0,0,0.08);
    --nav-bg: rgba(255,255,255,0.85);
  }

  body {
    background: var(--bg);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.65;
    transition: background 0.3s, color 0.3s;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 99px; }
  ::selection { background: var(--accent); color: var(--accent-inverse); }

  /* Typography */
  .t-display {
    font-family: var(--font-display);
    font-size: clamp(3.5rem, 8vw, 6rem);
    font-weight: 400;
    line-height: 0.92;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }
  .t-display em { font-style: italic; color: var(--text-secondary); }

  .t-section {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin-bottom: 2.5rem;
    position: relative;
    display: inline-block;
  }
  .t-section::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 40px;
    height: 2px;
    background: var(--text-primary);
    transition: width 0.4s ease;
    border-radius: 2px;
  }
  .t-section:hover::after { width: 100%; }

  .t-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-muted);
    font-weight: 500;
  }

  .t-body {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.8;
    font-weight: 400;
  }

  .t-body-lg {
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.8;
    font-weight: 400;
  }

  .t-mono {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-muted);
    letter-spacing: 0.03em;
  }

  /* Nav */
  .nav-link {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    cursor: pointer;
    padding: 8px 0;
    position: relative;
    transition: color 0.2s;
    background: none;
    border: none;
  }
  .nav-link:hover { color: var(--text-primary); }
  .nav-link.active { color: var(--text-primary); }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 0; height: 1px;
    background: var(--text-primary);
    transition: width 0.3s ease;
  }
  .nav-link.active::after,
  .nav-link:hover::after { width: 100%; }

  /* Buttons */
  .btn-primary {
    padding: 10px 24px;
    background: var(--text-primary);
    color: var(--accent-inverse);
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    cursor: pointer;
    transition: var(--transition-base);
    white-space: nowrap;
    font-weight: 600;
  }
  .btn-primary:hover {
    background: var(--text-secondary);
    color: var(--bg);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  .btn-primary:active { transform: translateY(0); }

  .btn-ghost {
    padding: 10px 20px;
    border: 1px solid var(--border);
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
    transition: var(--transition-base);
    white-space: nowrap;
    font-weight: 500;
  }
  .btn-ghost:hover {
    color: var(--text-primary);
    background: var(--bg-card);
    border-color: var(--border-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  .btn-ghost:active { transform: translateY(0); }

  /* Cards */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 1.75rem;
    transition: var(--transition-base);
  }
  .card:hover {
    background: var(--bg-card-hover);
    border-color: var(--border-hover);
    box-shadow: var(--shadow-md);
    transform: translateY(-3px);
  }

  /* Tags */
  .tag {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    padding: 3px 10px;
    border-radius: 5px;
    display: inline-block;
    font-weight: 600;
    border: 1px solid var(--border);
  }

  /* Skill pills */
  .skill-pill {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--text-secondary);
    background: var(--bg-inset);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 5px 12px;
    transition: var(--transition-base);
    letter-spacing: 0.02em;
    font-weight: 500;
  }
  .skill-pill:hover {
    color: var(--text-primary);
    border-color: var(--text-primary);
    background: var(--bg-card-hover);
    transform: translateY(-1px);
  }

  /* Layout */
  .container {
    max-width: var(--max-w);
    margin: 0 auto;
    padding: 0 1.75rem;
  }
  .section {
    padding: 5rem 0;
    border-top: 1px solid var(--border);
  }
  .section:first-of-type { border-top: none; }

  /* Hero */
  .hero-section {
    padding: clamp(7rem, 14vh, 10rem) 0 4rem;
    border-bottom: 1px solid var(--border);
  }
  .hero-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 3rem;
    flex-wrap: wrap;
  }
  .hero-text { flex: 1; min-width: 280px; }
  .hero-visual {
    flex-shrink: 0;
    width: clamp(130px, 18vw, 180px);
    height: clamp(130px, 18vw, 180px);
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--border);
    transition: transform 0.4s ease, border-color 0.4s;
  }
  .hero-visual:hover {
    transform: scale(1.05);
    border-color: var(--text-primary);
  }
  .hero-visual img { width: 100%; height: 100%; object-fit: cover; }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 7px 18px;
    border-radius: 99px;
    border: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--text-secondary);
    letter-spacing: 0.04em;
    margin-bottom: 1.5rem;
  }
  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--text-primary);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.4); }
  }

  /* Stats */
  .stats-row {
    display: flex;
    flex-wrap: wrap;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }
  .stat-item {
    flex: 1 1 140px;
    padding: 0 1.5rem;
    border-right: 1px solid var(--border);
  }
  .stat-item:last-child { border-right: none; padding-right: 0; }
  .stat-value {
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 400;
    color: var(--text-primary);
    line-height: 1.2;
  }
  .stat-label {
    font-family: var(--font-mono);
    font-size: 0.63rem;
    color: var(--text-muted);
    margin-top: 5px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  /* Skills */
  .skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }
  .skill-category {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 1.35rem 1.5rem;
    transition: var(--transition-base);
  }
  .skill-category:hover {
    border-color: var(--text-primary);
    background: var(--bg-card-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  /* Experience */
  .exp-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 2rem 2rem 1.5rem;
    transition: var(--transition-base);
  }
  .exp-card:hover {
    border-color: var(--border-hover);
    box-shadow: var(--shadow-md);
  }
  .exp-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 1.5rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }
  .exp-role { font-family: var(--font-display); font-size: 1.3rem; color: var(--text-primary); }
  .exp-company { font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-secondary); letter-spacing: 0.04em; }
  .exp-period { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted); letter-spacing: 0.04em; margin-left: auto; }
  .exp-context { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem; font-style: italic; }
  .exp-highlights { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; }
  .exp-highlights li {
    font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65;
    padding-left: 1.25rem; position: relative;
  }
  .exp-highlights li::before {
    content: '';
    position: absolute; left: 0; top: 0.55rem;
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--text-muted);
  }

  /* Project cards */
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }
  .project-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--r);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition-base);
    display: flex;
    flex-direction: column;
  }
  .project-card:hover {
    border-color: var(--text-primary);
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
  .project-card.selected {
    border-color: var(--text-primary);
    background: var(--bg-card-hover);
  }
  .project-card-img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    display: block;
  }
  .project-card-content {
    padding: 1.5rem 1.75rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }
  .project-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .project-card-title {
    font-family: var(--font-display);
    font-size: 1.2rem;
    color: var(--text-primary);
    line-height: 1.2;
  }
  .project-card-desc {
    font-size: 0.83rem;
    color: var(--text-secondary);
    line-height: 1.6;
    flex: 1;
  }
  .project-card-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: auto;
    padding-top: 0.5rem;
  }
  .project-card-links {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .project-card-link {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--text-secondary);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 5px;
    border: 1px solid var(--border);
    background: transparent;
    transition: var(--transition-base);
  }
  .project-card-link:hover {
    color: var(--text-primary);
    border-color: var(--text-primary);
  }
  .project-expand {
    margin-top: 0.25rem;
    font-family: var(--font-mono);
    font-size: 0.62rem;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    transition: color 0.2s;
  }
  .project-card:hover .project-expand { color: var(--text-primary); }

  .project-detail-panel {
    margin-top: 1.25rem;
    background: var(--bg-card);
    border: 1px solid var(--text-primary);
    border-radius: var(--r-lg);
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: slideDown 0.3s ease;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-15px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .detail-block-label {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }
  .detail-block-content {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.7;
  }
  .detail-impact {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-primary);
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 0.75rem 1rem;
    background: var(--bg-inset);
    border-radius: var(--r-sm);
  }

  /* Thinking */
  .thinking-item {
    padding: 2rem 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 1.5rem;
    transition: padding-left 0.2s;
  }
  .thinking-item:hover { padding-left: 0.75rem; }
  .thinking-item:last-child { border-bottom: none; }
  .thinking-num {
    font-family: var(--font-display);
    font-size: 2.8rem;
    color: var(--text-muted);
    min-width: 60px;
    line-height: 0.8;
    opacity: 0.2;
    transition: opacity 0.3s;
  }
  .thinking-item:hover .thinking-num { opacity: 0.5; }
  .thinking-heading {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 400;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  /* Contact */
  .contact-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    transition: var(--transition-base);
  }
  .contact-card:hover {
    border-color: var(--text-primary);
    box-shadow: var(--shadow-md);
  }

  .footer {
    text-align: center;
    padding: 2.5rem 0;
    border-top: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }

  /* Scroll reveal animation */
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Mobile */
  .nav-desktop { display: flex; gap: 2.5rem; align-items: center; }
  .nav-mobile-btn { display: none; }

  @media (max-width: 768px) {
    .container { padding: 0 1.25rem; }
    .section { padding: 3.5rem 0; }
    .hero-inner { flex-direction: column-reverse; gap: 2rem; }
    .hero-visual { width: 110px; height: 110px; }
    .stats-row { flex-direction: column; gap: 1rem; }
    .stat-item { border-right: none; border-bottom: 1px solid var(--border); padding: 0.75rem 0; }
    .stat-item:last-child { border-bottom: none; }
    .exp-header { flex-direction: column; gap: 0.25rem; }
    .exp-period { margin-left: 0; }
    .projects-grid { grid-template-columns: 1fr; }
    .project-card-content { padding: 1.25rem; }
    .thinking-item { flex-direction: column; gap: 0.5rem; }
    .thinking-num { font-size: 2rem; }
    .contact-card { padding: 1.5rem; }
    .nav-desktop { display: none; }
    .nav-mobile-btn { display: flex; }
  }
`;

/* ── Helper components ── */
function BlockHeading({ children }) {
  return <p className="detail-block-label">{children}</p>;
}

function ProjectBlock({ label, children }) {
  return (
    <div className="detail-block">
      <BlockHeading>{label}</BlockHeading>
      <div className="detail-block-content">{children}</div>
    </div>
  );
}

/* ── Custom hook for scroll reveal ── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

/* ── Reusable reveal wrapper ── */
function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useScrollReveal(0.12);
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("About");
  const [selectedProject, setSelectedProject] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

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
        if (r.top <= 120 && r.bottom >= 120) {
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

  const toggleProject = (idx) => {
    setSelectedProject(selectedProject === idx ? null : idx);
  };

  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--text-primary)",
        minHeight: "100vh",
      }}
    >
      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "var(--nav-bg)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--border)",
          height: "var(--nav-h)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.75rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.4rem",
            fontStyle: "italic",
            color: "var(--text-primary)",
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => scrollTo("About")}
        >
          fa.
        </span>

        <div className="nav-desktop">
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
            style={{
              padding: "6px 12px",
              fontSize: "0.68rem",
              border: "1px solid var(--border)",
            }}
          >
            {theme === "light" ? "☽" : "☀"}
          </button>
          <button
            onClick={() => setMenuOpen((m) => !m)}
            className="nav-mobile-btn"
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              padding: "6px 10px",
              borderRadius: "var(--r-sm)",
              fontSize: "1rem",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
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
            backdropFilter: "blur(24px)",
            borderBottom: "1px solid var(--border)",
            padding: "1.5rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {NAV.map((n) => (
            <span
              key={n}
              onClick={() => scrollTo(n)}
              className={`nav-link${activeSection === n ? " active" : ""}`}
              style={{ fontSize: "0.95rem" }}
            >
              {n}
            </span>
          ))}
        </div>
      )}

      {/* HERO */}
      <section id="About" className="hero-section">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-text">
              <Reveal className="fade-in">
                <p className="t-label" style={{ marginBottom: "1.25rem" }}>
                  ↳ Backend Engineer · Fintech · Distributed Systems
                </p>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="t-display" style={{ marginBottom: "1.25rem" }}>
                  Faisal
                  <br />
                  <em>Ali</em>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <div className="status-badge">
                  <span className="status-dot" />
                  Open to backend roles
                </div>
              </Reveal>

              <Reveal delay={300}>
                <p
                  className="t-body-lg"
                  style={{ maxWidth: 520, marginBottom: "1.75rem" }}
                >
                  Backend Engineer building production systems in fintech and
                  travel — focused on payment workflows, distributed caching,
                  event-driven pipelines, and fault-tolerant microservices using
                  Java, Spring Boot, Kafka, and Redis.
                </p>
              </Reveal>

              <Reveal delay={400}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    <a
                      href="/Faisal_Ali_Backend_Engineer.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      View Resume ↗
                    </a>
                    <a
                      href="/Faisal_Ali_Backend_Engineer.pdf"
                      download
                      className="btn-primary"
                    >
                      Download ↓
                    </a>
                  </div>
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    <a
                      href="mailto:faisal.dev.ali@gmail.com"
                      className="btn-ghost"
                    >
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
              </Reveal>
            </div>

            <Reveal delay={200}>
              <div className="hero-visual">
                <img
                  src="/profile.png"
                  alt="Faisal Ali"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </div>
            </Reveal>
          </div>

          <Reveal delay={500}>
            <div className="stats-row">
              {[
                ["3+ yrs", "Production backend"],
                ["Java / Spring Boot", "Core stack"],
                ["Fintech & Travel", "Domain"],
                ["0 duplicate txns", "6 months live"],
              ].map(([val, label], i) => (
                <div key={i} className="stat-item">
                  <div className="stat-value">{val}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SKILLS */}
      <section id="Skills" className="section">
        <div className="container">
          <Reveal>
            <h2 className="t-section">Technical Skills</h2>
          </Reveal>
          <div className="skills-grid">
            {SKILLS.map(({ label, icon, items }, i) => (
              <Reveal key={label} delay={i * 80}>
                <div className="skill-category">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      marginBottom: "0.85rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.1rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {icon}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        letterSpacing: "0.03em",
                      }}
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="Experience" className="section">
        <div className="container">
          <Reveal>
            <h2 className="t-section">Experience</h2>
          </Reveal>
          {EXPERIENCE.map((exp) => (
            <Reveal key={exp.company}>
              <div className="exp-card">
                <div className="exp-header">
                  <span className="exp-role">{exp.role}</span>
                  <span className="exp-company">{exp.company}</span>
                  <span className="exp-period">
                    {exp.location} · {exp.period}
                  </span>
                </div>
                <p className="exp-context">{exp.context}</p>
                <ul className="exp-highlights">
                  {exp.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PROJECTS */}
      <section id="Projects" className="section">
        <div className="container">
          <Reveal>
            <h2 className="t-section">Projects</h2>
          </Reveal>
          <div className="projects-grid">
            {PROJECTS.map((project, idx) => (
              <Reveal key={project.title} delay={idx * 80}>
                <div
                  className={`project-card${selectedProject === idx ? " selected" : ""}`}
                  onClick={() => toggleProject(idx)}
                >
                  {project.image && (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="project-card-img"
                    />
                  )}
                  <div className="project-card-content">
                    <div className="project-card-header">
                      <h3 className="project-card-title">{project.title}</h3>
                      <span className="tag">{project.tag}</span>
                    </div>
                    <p className="project-card-desc">{project.description}</p>
                    <div className="project-card-stack">
                      {project.details.stack.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="skill-pill"
                          style={{ fontSize: "0.62rem", padding: "3px 8px" }}
                        >
                          {s}
                        </span>
                      ))}
                      {project.details.stack.length > 4 && (
                        <span
                          className="skill-pill"
                          style={{
                            fontSize: "0.62rem",
                            padding: "3px 8px",
                            opacity: 0.6,
                          }}
                        >
                          +{project.details.stack.length - 4}
                        </span>
                      )}
                    </div>
                    <div className="project-card-links">
                      {project.links.github && project.links.github !== "#" && (
                        <a
                          href={project.links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-card-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Code ↗
                        </a>
                      )}
                      {project.links.live && (
                        <a
                          href={project.links.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-card-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Live ↗
                        </a>
                      )}
                    </div>
                    <span className="project-expand">
                      {selectedProject === idx
                        ? "Click to collapse ▲"
                        : "Click for details ▼"}
                    </span>
                  </div>
                </div>

                {selectedProject === idx && (
                  <div className="project-detail-panel">
                    <ProjectBlock label="Problem">
                      {project.details.problem}
                    </ProjectBlock>
                    <ProjectBlock label="Approach">
                      {project.details.approach}
                    </ProjectBlock>
                    <ProjectBlock label="Stack">
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.4rem",
                        }}
                      >
                        {project.details.stack.map((s) => (
                          <span key={s} className="skill-pill">
                            {s}
                          </span>
                        ))}
                      </div>
                    </ProjectBlock>
                    <div className="detail-impact">
                      ✓ {project.details.impact}
                    </div>
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* THINKING */}
      <section id="Thinking" className="section">
        <div className="container">
          <Reveal>
            <h2 className="t-section">Engineering Thinking</h2>
          </Reveal>
          {THINKING.map(({ num, heading, body }) => (
            <Reveal key={num}>
              <div className="thinking-item">
                <div className="thinking-num">{num}</div>
                <div>
                  <h3 className="thinking-heading">{heading}</h3>
                  <p className="t-body">{body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="Contact" className="section">
        <div className="container">
          <Reveal>
            <h2 className="t-section">Get in touch</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="contact-card">
              <p className="t-body-lg" style={{ maxWidth: 560 }}>
                I'm currently open to backend engineering roles — especially
                those involving distributed systems, payments, or
                high-availability services. Based in Bangalore, India. I'll
                respond within 24 hours.
              </p>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <a
                  href="mailto:faisal.dev.ali@gmail.com"
                  className="btn-primary"
                >
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
              <p className="t-mono" style={{ marginTop: "0.5rem" }}>
                Bangalore, India · +91 91449 14356
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} Faisal Ali — Built with React. No
        frameworks, no bloat.
      </footer>
    </div>
  );
}
