import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   DATA
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
   GLOBAL CSS
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Geist:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }

  :root {
    --bg: #f9f8f6;
    --bg-card: #ffffff;
    --bg-subtle: #f2f1ee;
    --bg-inset: #eceae5;
    --text-primary: #0f0f0d;
    --text-secondary: #44433f;
    --text-muted: #908f89;
    --border: rgba(15,15,13,0.07);
    --border-strong: rgba(15,15,13,0.13);
    --accent: #0f0f0d;
    --blue: #1d4ed8;
    --blue-soft: rgba(29,78,216,0.07);
    --blue-border: rgba(29,78,216,0.18);
    --green: #15803d;
    --green-soft: rgba(21,128,61,0.07);
    --green-border: rgba(21,128,61,0.2);
    --amber: #b45309;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.03);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    --shadow-lg: 0 16px 40px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
    --r: 8px;
    --r-sm: 5px;
    --r-lg: 14px;
    --nav-bg: rgba(249,248,246,0.94);
    --font-display: 'Instrument Serif', Georgia, serif;
    --font-mono: 'DM Mono', monospace;
    --font-body: 'Geist', system-ui, sans-serif;
    --nav-h: 54px;
  }

  [data-theme="dark"] {
    --bg: #0c0c0a;
    --bg-card: #131311;
    --bg-subtle: #181815;
    --bg-inset: #1e1e1a;
    --text-primary: #f0efe9;
    --text-secondary: #9d9c95;
    --text-muted: #555450;
    --border: rgba(240,239,233,0.06);
    --border-strong: rgba(240,239,233,0.1);
    --accent: #f0efe9;
    --blue: #3b82f6;
    --blue-soft: rgba(59,130,246,0.09);
    --blue-border: rgba(59,130,246,0.2);
    --green: #22c55e;
    --green-soft: rgba(34,197,94,0.07);
    --green-border: rgba(34,197,94,0.18);
    --amber: #f59e0b;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.35);
    --shadow-lg: 0 20px 48px rgba(0,0,0,0.45);
    --nav-bg: rgba(12,12,10,0.94);
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

  /* Typography */
  .t-display {
    font-family: var(--font-display);
    font-size: clamp(3rem, 7vw, 5.2rem);
    font-weight: 400;
    line-height: 1.0;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }
  .t-display em {
    font-style: italic;
    color: var(--text-secondary);
  }

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
    font-size: 0.63rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--blue);
    font-weight: 400;
  }

  .t-body {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.8;
    font-weight: 400;
    font-family: var(--font-body);
  }

  .t-mono {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }

  /* Nav */
  .nav-link {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px 0;
    position: relative;
    transition: color 0.15s;
    user-select: none;
  }
  .nav-link:hover { color: var(--text-secondary); }
  .nav-link.active { color: var(--text-primary); }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    height: 1px; width: 0;
    background: var(--text-primary);
    transition: width 0.2s;
  }
  .nav-link.active::after { width: 100%; }

  /* Buttons */
  .btn-primary {
    padding: 9px 22px;
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
    transition: all 0.15s;
    white-space: nowrap;
  }
  .btn-primary:hover { opacity: 0.82; transform: translateY(-1px); box-shadow: var(--shadow-md); }
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
    transition: all 0.15s;
    white-space: nowrap;
  }
  .btn-ghost:hover { color: var(--text-primary); background: var(--bg-subtle); transform: translateY(-1px); }
  .btn-ghost:active { transform: translateY(0); }

  /* Card */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--r);
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }

  /* Tag */
  .tag {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.07em;
    padding: 2px 8px;
    border-radius: 3px;
    display: inline-block;
    line-height: 1.6;
  }
  .tag-blue { background: var(--blue-soft); color: var(--blue); border: 1px solid var(--blue-border); }
  .tag-neutral { background: var(--bg-subtle); color: var(--text-muted); border: 1px solid var(--border); }
  .tag-green { background: var(--green-soft); color: var(--green); border: 1px solid var(--green-border); }

  /* Skill pill */
  .skill-pill {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-secondary);
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 3px 10px;
    transition: all 0.13s;
    letter-spacing: 0.02em;
    cursor: default;
  }
  .skill-pill:hover {
    color: var(--blue);
    border-color: var(--blue-border);
    background: var(--blue-soft);
  }

  /* Section */
  .section {
    max-width: 900px;
    margin: 0 auto;
    padding: 5rem 2rem;
    border-top: 1px solid var(--border);
  }

  /* Divider */
  .divider { height: 1px; background: var(--border); }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeUp 0.5s ease forwards; }
  .fade-in-1 { animation: fadeUp 0.5s 0.1s ease both; }
  .fade-in-2 { animation: fadeUp 0.5s 0.22s ease both; }
  .fade-in-3 { animation: fadeUp 0.5s 0.36s ease both; }

  /* Pulse dot */
  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 var(--green); }
    70% { box-shadow: 0 0 0 4px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }
  .pulse-dot {
    animation: pulse-ring 2.4s infinite;
  }

  /* Nav desktop/mobile */
  .nav-desktop { display: flex; }
  .nav-mobile-btn { display: none; }

  /* Responsive */
  @media (max-width: 768px) {
    .nav-desktop { display: none; }
    .nav-mobile-btn { display: block; }
    .section { padding: 3.5rem 1.25rem; }
    .hero-inner { flex-direction: column-reverse; align-items: flex-start; gap: 2rem; }
    .hero-image-wrap { align-self: center; }
    .stats-bar { flex-direction: column; gap: 1.25rem; }
    .stats-bar > div { border-right: none !important; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; }
    .stats-bar > div:last-child { border-bottom: none; }
    .contact-row { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .exp-row { grid-template-columns: 1fr; }
  }
`;

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */
function Label({ children }) {
  return (
    <p className="t-label" style={{ marginBottom: "0.85rem" }}>
      ↳ {children}
    </p>
  );
}

function BlockHeading({ children }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.6rem",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: "var(--text-muted)",
        marginBottom: "0.65rem",
      }}
    >
      {children}
    </p>
  );
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
   MAIN
───────────────────────────────────────────── */
export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("About");
  const [openProject, setOpenProject] = useState(null);
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
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          height: "var(--nav-h)",
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
            fontWeight: 500,
            userSelect: "none",
            color: "var(--text-primary)",
          }}
        >
          fa.dev
        </span>

        <div
          className="nav-desktop"
          style={{ gap: "2rem", alignItems: "center" }}
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
            style={{
              padding: "5px 10px",
              borderRadius: "var(--r-sm)",
              border: "1px solid var(--border-strong)",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.72rem",
              fontFamily: "var(--font-mono)",
              transition: "all 0.15s",
            }}
          >
            {theme === "light" ? "◐" : "○"}
          </button>
          <button
            onClick={() => setMenuOpen((m) => !m)}
            className="nav-mobile-btn"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "1rem",
              padding: "4px 6px",
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
            borderBottom: "1px solid var(--border)",
            padding: "1.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {NAV.map((n) => (
            <span
              key={n}
              className={`nav-link${activeSection === n ? " active" : ""}`}
              onClick={() => scrollTo(n)}
              style={{ fontSize: "0.9rem" }}
            >
              {n}
            </span>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section
        id="About"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "clamp(6rem, 14vh, 9rem) 2rem 5rem",
        }}
      >
        <div
          className="hero-inner fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "4rem",
          }}
        >
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

            {/* Status badge */}
            <div
              className="fade-in-1"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 14px",
                borderRadius: 99,
                border: "1px solid var(--green-border)",
                background: "var(--green-soft)",
                marginBottom: "1.75rem",
              }}
            >
              <span
                className="pulse-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--green)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: "var(--green)",
                  letterSpacing: "0.05em",
                }}
              >
                Open to backend roles
              </span>
            </div>

            <p
              className="fade-in-2"
              style={{
                fontSize: "1rem",
                color: "var(--text-secondary)",
                maxWidth: 480,
                lineHeight: 1.75,
                fontWeight: 400,
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
          <div className="hero-image-wrap fade-in-2" style={{ flexShrink: 0 }}>
            <div
              style={{
                position: "relative",
                width: "clamp(130px, 18vw, 188px)",
                height: "clamp(130px, 18vw, 188px)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  border: "1px solid var(--border-strong)",
                }}
              />
              <img
                src="/profile.png"
                alt="Faisal Ali"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="stats-bar fade-in-3"
          style={{
            display: "flex",
            marginTop: "4rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          {[
            ["3+ yrs", "Production backend"],
            ["Java / Spring Boot", "Core stack"],
            ["Fintech & Travel", "Domain expertise"],
            ["0 duplicate txns", "6 months live"],
          ].map(([val, label], i) => (
            <div
              key={val}
              style={{
                flex: "1 1 160px",
                padding: "0 2rem 0 0",
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
                marginRight: i < 3 ? "2rem" : 0,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.15rem",
                  fontWeight: 400,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                }}
              >
                {val}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                  marginTop: 5,
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* About blurb */}
        <div
          style={{
            marginTop: "2.25rem",
            padding: "1.5rem 1.75rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderLeft: "2px solid var(--blue)",
            borderRadius: "0 var(--r) var(--r) 0",
            maxWidth: 680,
          }}
        >
          <p className="t-body">
            Most of what I've learned has come from production failures — a
            payment processed twice, a cache that silently evicted a budget
            counter, a partner API returning 500s at midnight. These experiences
            taught me to design systems that anticipate failure modes rather
            than assume the happy path.
            <br />
            <br />
            Currently at{" "}
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              R360 Global Services
            </strong>{" "}
            building fintech microservices for ICICI Bank and Kotak Mahindra.
            Actively looking for a backend role at a product company where I can
            work at larger scale and own deeper parts of the system.
          </p>
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section id="Skills" className="section">
        <Label>Technical Skills</Label>
        <h2 className="t-section" style={{ marginBottom: "2.5rem" }}>
          The tools I reach for
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {SKILLS.map((g) => (
            <div
              key={g.label}
              className="card"
              style={{ padding: "1.2rem 1.35rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  marginBottom: "0.9rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    opacity: 0.7,
                  }}
                >
                  {g.icon}
                </span>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  {g.label}
                </p>
              </div>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}
              >
                {g.items.map((item) => (
                  <span key={item} className="skill-pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXPERIENCE ── */}
      <section id="Experience" className="section">
        <Label>Work Experience</Label>
        <h2 className="t-section" style={{ marginBottom: "2.5rem" }}>
          Where I've built things
        </h2>

        <div
          style={{
            borderLeft: "1.5px solid var(--border-strong)",
            paddingLeft: "2rem",
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: -35,
                top: 10,
                width: 8,
                height: 8,
                background: "var(--text-primary)",
                borderRadius: "50%",
                border: "2px solid var(--bg)",
                boxShadow: "0 0 0 2px var(--text-primary)",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginBottom: "2rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.15rem",
                    fontWeight: 400,
                    color: "var(--text-primary)",
                    marginBottom: 5,
                  }}
                >
                  Software Engineer
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                  }}
                >
                  R360 Global Services · Bangalore
                </p>
              </div>
              <span className="tag tag-neutral">May 2023 – Present</span>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {EXPERIENCE.map(({ area, detail }) => (
                <div
                  key={area}
                  className="exp-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr",
                    gap: "1rem 1.5rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-muted)",
                      fontSize: "0.67rem",
                      paddingTop: 3,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {area}
                  </span>
                  <span className="t-body">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section id="Projects" className="section">
        <Label>Key Projects</Label>
        <h2 className="t-section" style={{ marginBottom: "2.25rem" }}>
          What I've actually built
        </h2>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}
        >
          {PROJECTS.map((p, i) => {
            const isOpen = openProject === i;
            return (
              <div
                key={p.title}
                style={{
                  borderRadius: "var(--r)",
                  overflow: "hidden",
                  background: isOpen ? "var(--blue-soft)" : "var(--bg-card)",
                  border: `1px solid ${isOpen ? "var(--blue-border)" : "var(--border)"}`,
                  transition: "all 0.18s",
                }}
              >
                {/* Header */}
                <div
                  onClick={() => setOpenProject(isOpen ? null : i)}
                  style={{
                    padding: "1.25rem 1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    userSelect: "none",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.4rem",
                        flexWrap: "wrap",
                        marginBottom: "0.55rem",
                      }}
                    >
                      <span className="tag tag-blue">{p.tag}</span>
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1rem",
                        fontWeight: 400,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {p.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {p.subtitle}
                    </p>
                  </div>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "1rem",
                      flexShrink: 0,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 300,
                      marginTop: 4,
                    }}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div
                    className="fade-in"
                    style={{
                      padding: "0 1.5rem 1.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    <div className="divider" />

                    <ProjectBlock label="Problem">
                      <p className="t-body">{p.problem}</p>
                    </ProjectBlock>

                    <ProjectBlock label="Architecture">
                      <p className="t-body">{p.architecture}</p>
                      <div
                        style={{
                          marginTop: "1rem",
                          padding: "1rem 1.25rem",
                          background: "var(--bg-inset)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-sm)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          color: "var(--text-secondary)",
                          lineHeight: 2,
                        }}
                      >
                        {p.diagram.map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    </ProjectBlock>

                    <ProjectBlock label="Stack">
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.35rem",
                        }}
                      >
                        {p.stack.map((s) => (
                          <span key={s} className="tag tag-neutral">
                            {s}
                          </span>
                        ))}
                      </div>
                    </ProjectBlock>

                    <ProjectBlock label="Key challenges">
                      <ul
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.65rem",
                          listStyle: "none",
                        }}
                      >
                        {p.challenges.map((c, ci) => (
                          <li
                            key={ci}
                            style={{
                              display: "flex",
                              gap: "0.75rem",
                              fontSize: "0.875rem",
                              color: "var(--text-secondary)",
                              lineHeight: 1.75,
                            }}
                          >
                            <span
                              style={{
                                color: "var(--text-muted)",
                                flexShrink: 0,
                                marginTop: 3,
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              →
                            </span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </ProjectBlock>

                    <ProjectBlock label="Impact">
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--green)",
                          lineHeight: 1.75,
                          fontWeight: 500,
                        }}
                      >
                        {p.impact}
                      </p>
                    </ProjectBlock>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── INCIDENT ── */}
      <section id="Incident" className="section">
        <Label>Production Incident</Label>
        <h2 className="t-section" style={{ marginBottom: "2rem" }}>
          Handling real failures
        </h2>

        <div
          className="card"
          style={{
            padding: "1.75rem 2rem",
            borderLeft: "2px solid var(--blue)",
            borderRadius: "0 var(--r) var(--r) 0",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <span className="tag tag-blue">P0 · Fintech</span>
            <span className="tag tag-neutral">Payment Idempotency</span>
          </div>

          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.05rem",
              color: "var(--text-primary)",
              marginBottom: "0.9rem",
              fontWeight: 400,
            }}
          >
            Duplicate payment transactions in production
          </h3>

          <p className="t-body" style={{ marginBottom: "1.25rem" }}>
            Duplicate financial transactions were occurring due to a race
            condition between API retries and webhook processing — the same
            payment success event would arrive 3–4× from the provider, and each
            was being processed independently with no deduplication layer.
          </p>

          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              listStyle: "none",
            }}
          >
            {[
              "Root cause: no idempotency layer between Kafka webhook consumer and DB write — each event landed a separate transaction record",
              "Fix: Redis SETNX idempotency key checked before processing; key TTL set to 24h to cover the full provider retry window",
              "Backstop: DB-level unique constraint on (payment_id, provider_event_type) as a hard guard if Redis is unavailable",
              "State machine hardened: terminal-state transitions (success → success) now explicitly rejected rather than silently applied",
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: "flex",
                  gap: "0.65rem",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                }}
              >
                <span
                  style={{
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    marginTop: 3,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  →
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div
            style={{
              marginTop: "1.5rem",
              padding: "0.7rem 1rem",
              background: "var(--green-soft)",
              border: "1px solid var(--green-border)",
              borderRadius: "var(--r-sm)",
              display: "inline-block",
            }}
          >
            <p
              style={{
                color: "var(--green)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              ✓ Zero duplicate transactions across 6+ months of live production
              traffic
            </p>
          </div>
        </div>
      </section>

      {/* ── THINKING ── */}
      <section id="Thinking" className="section">
        <Label>Engineering Thinking</Label>
        <h2 className="t-section">How I approach problems</h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.82rem",
            marginTop: "0.5rem",
            marginBottom: "2.5rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em",
          }}
        >
          Not rules I follow — patterns developed from getting things wrong in
          production.
        </p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}
        >
          {THINKING.map((t) => (
            <div
              key={t.num}
              style={{
                padding: "1.4rem 1.5rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                display: "grid",
                gridTemplateColumns: "42px 1fr",
                gap: "0.75rem",
                alignItems: "start",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  fontSize: "0.65rem",
                  paddingTop: 3,
                  opacity: 0.5,
                }}
              >
                {t.num}
              </span>
              <div>
                <h4
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "0.95rem",
                    color: "var(--text-primary)",
                    fontWeight: 400,
                    marginBottom: "0.5rem",
                    lineHeight: 1.4,
                  }}
                >
                  {t.heading}
                </h4>
                <p className="t-body">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section
        id="Contact"
        className="section"
        style={{ paddingBottom: "7rem" }}
      >
        <Label>Contact</Label>
        <h2 className="t-section">Let's talk</h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            marginTop: "0.5rem",
            marginBottom: "2.5rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.03em",
          }}
        >
          Open to backend / distributed systems roles at product companies.
        </p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
        >
          {[
            {
              label: "Email",
              value: "faisal.dev.ali@gmail.com",
              href: "mailto:faisal.dev.ali@gmail.com",
              action: "Send →",
            },
            {
              label: "LinkedIn",
              value: "linkedin.com/in/faisal-ali-877bb4219",
              href: "https://linkedin.com/in/faisal-ali-877bb4219",
              action: "View profile →",
            },
            {
              label: "GitHub",
              value: "github.com/faisal-dev-ali",
              href: "https://github.com/faisal-dev-ali",
              action: "View code →",
            },
            {
              label: "Phone",
              value: "+91 91449 14356",
              href: "tel:+919144914356",
              action: "Call →",
            },
          ].map(({ label, value, href, action }) => (
            <div
              key={label}
              className="contact-row"
              style={{
                padding: "1rem 1.35rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)",
                    fontSize: "0.6rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 5,
                  }}
                >
                  {label}
                </div>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    wordBreak: "break-all",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.01em",
                    transition: "color 0.13s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--blue)")}
                  onMouseLeave={(e) =>
                    (e.target.style.color = "var(--text-secondary)")
                  }
                >
                  {value}
                </a>
              </div>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.67rem",
                  letterSpacing: "0.05em",
                  border: "1px solid var(--border-strong)",
                  padding: "6px 14px",
                  borderRadius: "4px",
                  background: "transparent",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.13s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "var(--bg-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {action}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div
        style={{
          textAlign: "center",
          padding: "1.5rem 2rem",
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: "0.65rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
        }}
      >
        faisal ali · backend engineer · bangalore · {new Date().getFullYear()}
      </div>
    </div>
  );
}
