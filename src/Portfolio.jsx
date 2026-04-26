import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   DATA — UNCHANGED
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
  { label: "Languages", items: ["Java 8 / 11 / 17", "SQL", "Shell Scripting"] },
  {
    label: "Frameworks",
    items: [
      "Spring Boot",
      "Spring Security",
      "Hibernate / JPA",
      "Resilience4j",
    ],
  },
  {
    label: "Messaging",
    items: [
      "Apache Kafka (event-driven processing, retry handling)",
      "Event-driven design",
      "Dead-letter queues",
    ],
  },
  {
    label: "Databases",
    items: ["MySQL", "Redis (caching, idempotency, Lua scripting)", "MongoDB"],
  },
  { label: "Auth & Security", items: ["JWT", "OAuth2", "RBAC"] },
  {
    label: "Infrastructure",
    items: [
      "AWS (EC2, S3, RDS, SQS)",
      "Docker",
      "Kubernetes",
      "CI/CD pipelines",
    ],
  },
  {
    label: "Observability",
    items: ["Grafana", "CloudWatch", "Structured logging", "Custom metrics"],
  },
];

const PROJECTS = [
  {
    title: "Payment Gateway Integration",
    subtitle: "Razorpay / Phicommerce · Fintech",
    tag: "Production · ICICI Bank / Kotak",
    problem:
      "The existing system had no standard contract for payment providers. Each provider was wired directly into business logic, making it hard to onboard new ones and impossible to guarantee exactly-once processing when callbacks arrived late or duplicated.",
    architecture:
      "Defined a provider-agnostic PaymentGatewayClient interface with three concerns: order creation, status polling, and webhook ingestion. Each provider (Razorpay, Phicommerce) is an isolated adapter behind this interface. Webhook events land on a Kafka topic first — the consumer owns all state transitions using Redis-backed idempotency keys and a DB-level unique constraint as a hard backstop. Settlement files from ICICI Bank are parsed and matched against internal transaction records through a stored-procedure pipeline that runs nightly.",
    stack: [
      "Java 17",
      "Spring Boot",
      "Kafka (event-driven processing, retry handling)",
      "Redis (caching, idempotency, Lua scripting)",
      "MySQL",
      "Resilience4j",
      "AWS SQS",
    ],
    diagram: [
      "Client → API → Kafka → Consumer → DB",
      "              ↓",
      "         Redis (idempotency)",
    ],
    challenges: [
      "Duplicate webhook delivery: same payment success event arriving 3–4 times due to provider retries. Solved with Redis SETNX idempotency key + DB unique constraint as a two-layer guard.",
      "Phicommerce onboarding without breaking the existing ICICI stored procedure — handled via a provider_code column and conditional routing in the settlement parser.",
      "Late webhook arrivals after order timeout — state machine was designed to reject terminal-state transitions cleanly.",
    ],
    impact:
      "Zero duplicate transactions across 6 months of production traffic. New payment provider onboarded in under a week.",
  },
  {
    title: "Travel Booking – Unified Partner Client Layer",
    subtitle: "Cleartrip / MMT / Yatra · Hotels & Flights",
    tag: "Production · R360",
    problem:
      "Each travel provider API (Cleartrip, MMT, Yatra) had its own SDK, error format, and retry behavior. Services were making direct HTTP calls, mixing provider-specific logic with booking logic, and logging inconsistently — making production debugging a nightmare.",
    architecture:
      "Designed and built a unified provider client layer (CleartripV4Client and equivalent clients for MMT and Yatra) that acts as a structured HTTP boundary between business logic and external travel APIs. This layer handles auth token lifecycle (refresh and expiry), request/response DTO mapping into a common internal format, and structured logging (provider, endpoint, latency, status, error codes) for observability. Provider-specific errors are normalised into a canonical ApiException hierarchy to ensure consistent handling across services. Resilience4j circuit breakers and retry mechanisms are applied at the client boundary to prevent cascading failures from unstable external APIs. Implemented caching for non-volatile data (hotel metadata and availability windows) using Redis with TTL tuned based on data volatility, and cached aggregated search/list responses in MongoDB for ~15 minutes to reduce repeated provider calls and improve latency. This abstraction simplified onboarding of new providers and improved debugging through consistent logging and error handling.",
    stack: [
      "Java 11",
      "Spring Boot",
      "Redis (caching, idempotency, Lua scripting)",
      "Resilience4j",
      "Grafana",
      "Logback (structured JSON)",
    ],
    challenges: [
      "Provider-specific auth flows (some token-based, some API-key) had to be hidden behind a common interface without leaking provider concerns upward.",
      "Inconsistent error shapes from providers — built a canonical error taxonomy so callers always handle the same exception types.",
      "Cache invalidation for hotel room availability — used short TTLs with a background refresher rather than event-driven invalidation since providers don't emit change events.",
    ],
    diagram: [
      "Client → API → Aggregator Service",
      "                  ↓",
      "         Provider Clients",
      "        → Cleartrip",
      "        → MMT",
      "        → Yatra",
      "                  ↓",
      "         MongoDB (cached responses · 15 min TTL)",
      "                  ↓",
      "                 UI",
    ],
    impact:
      "Reduced provider-call latency by ~30% (500ms → 350ms). Debug time reduced by ~40% due to structured logging.",
  },
  {
    title: "Redis Budget / Rate-Limit Service",
    subtitle: "Internal Platform · Rewards Engine",
    tag: "Production",
    problem:
      "Multiple services were independently checking and decrementing a shared budget in MySQL — causing race conditions under concurrent load and occasional over-disbursement of rewards.",
    architecture:
      "Moved the budget counter to Redis with an atomic Lua script that checks the current balance and decrements it in a single operation (no check-then-act race). SETNX initialises the key exactly once even under concurrent startup. A scheduled reconciler reads MySQL truth and patches the Redis counter if drift is detected. All operations emit structured logs with caller identity, budget key, and pre/post values for audit.",
    stack: [
      "Java 17",
      "Spring Boot",
      "Redis (caching, idempotency, Lua scripting)",
      "MySQL",
      "Scheduled tasks",
    ],
    challenges: [
      "Concurrent service startup causing multiple SETNX races during Redis cold-start — handled by letting SETNX be idempotent and sourcing the canonical value from MySQL on init.",
      "Redis eviction under memory pressure could silently zero a budget counter — added a guard that refuses to initialise to zero if MySQL shows a non-zero value.",
    ],
    impact:
      "Eliminated reward over-disbursement completely. Counter operations are now O(1) and atomic regardless of concurrent callers.",
  },
];

const THINKING = [
  {
    heading: "When production breaks at 2am",
    body: "I start with the symptom and walk backwards through the request path — logs, then metrics, then traces. I don't guess. Most issues I've seen had one root cause but showed up in three places simultaneously, so jumping to the most obvious alert usually wastes time. Once I've isolated the call that's failing, I look at what changed in the last deploy and what the external dependency returned (or didn't).",
  },
  {
    heading: "Designing for failure, not the happy path",
    body: "Every external call I write has a timeout, a retry policy, and a fallback. I think about what happens when the third-party API hangs for 30 seconds — does it cascade? Circuit breakers are table stakes in a microservices world, not an optimization. I draw the failure paths before I write the success path.",
  },
  {
    heading: "Idempotency is not optional in payment systems",
    body: "In payment flows, the dangerous assumption is that your service receives each event exactly once. Providers retry. Networks split. Clients time out and retry. I design every write operation to be safe to execute twice — idempotency key in Redis, unique constraint in the DB, and a state machine that explicitly rejects illegal transitions rather than silently ignoring them.",
  },
  {
    heading: "Caching requires a strategy, not just Redis.set()",
    body: "I think about cache before writing any data access code: what's the read-to-write ratio? How stale is too stale? Who is responsible for invalidation? For hotel metadata it's fine to be 10 minutes stale — for a payment status it isn't. TTL-based expiry is not the same as event-driven invalidation and they solve different problems.",
  },
  {
    heading: "Observability is part of the feature, not a post-launch chore",
    body: "If I can't tell from logs whether a request succeeded in production, the feature isn't done. I treat structured logging (request ID, provider, latency, status, error code) as a first-class requirement. Grafana dashboards get set up when the feature ships, not after the first on-call incident.",
  },
];

/* ─────────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }

  :root {
    /* Light theme */
    --bg: #f8f8f5;
    --bg-card: #ffffff;
    --bg-card-hover: #fafaf8;
    --bg-subtle: #f1f1ec;
    --text-primary: #111110;
    --text-secondary: #52524e;
    --text-muted: #a09f9a;
    --border: rgba(0,0,0,0.07);
    --border-strong: rgba(0,0,0,0.12);
    --accent: #1a1a18;
    --accent-soft: rgba(26,26,24,0.06);
    --accent-border: rgba(26,26,24,0.15);
    --highlight: #2563eb;
    --highlight-soft: rgba(37,99,235,0.08);
    --highlight-border: rgba(37,99,235,0.2);
    --green: #16803c;
    --green-soft: rgba(22,128,60,0.08);
    --green-border: rgba(22,128,60,0.2);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04);
    --shadow-lg: 0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
    --radius: 10px;
    --radius-sm: 6px;
    --radius-lg: 16px;
    --nav-bg: rgba(248,248,245,0.92);
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --font-serif: 'Lora', serif;
    --font-body: 'Syne', sans-serif;
  }

  [data-theme="dark"] {
    --bg: #0e0e0c;
    --bg-card: #161614;
    --bg-card-hover: #1c1c19;
    --bg-subtle: #131311;
    --text-primary: #eeeee9;
    --text-secondary: #9b9b94;
    --text-muted: #5c5c56;
    --border: rgba(255,255,255,0.06);
    --border-strong: rgba(255,255,255,0.1);
    --accent: #eeeee9;
    --accent-soft: rgba(238,238,233,0.06);
    --accent-border: rgba(238,238,233,0.12);
    --highlight: #3b82f6;
    --highlight-soft: rgba(59,130,246,0.1);
    --highlight-border: rgba(59,130,246,0.22);
    --green: #22c55e;
    --green-soft: rgba(34,197,94,0.08);
    --green-border: rgba(34,197,94,0.2);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.3);
    --shadow-lg: 0 16px 48px rgba(0,0,0,0.4);
    --nav-bg: rgba(14,14,12,0.92);
  }

  body {
    background: var(--bg);
    color: var(--text-primary);
    font-family: var(--font-body);
    transition: background 0.3s ease, color 0.3s ease;
  }

  /* ── scrollbar ── */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }

  /* ── selection ── */
  ::selection { background: var(--highlight-soft); color: var(--text-primary); }

  /* ── typography ── */
  .display {
    font-family: var(--font-display);
    font-size: clamp(2.8rem, 7vw, 5rem);
    font-weight: 800;
    line-height: 1.04;
    letter-spacing: -0.03em;
    color: var(--text-primary);
  }

  .section-heading {
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 3.5vw, 2.2rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  .mono-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--highlight);
    font-weight: 500;
  }

  .body-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.8;
    font-weight: 400;
  }

  /* ── nav ── */
  .nav-link {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    cursor: pointer;
    position: relative;
    padding: 4px 0;
    transition: color 0.18s ease;
    user-select: none;
  }

  .nav-link:hover { color: var(--text-secondary); }

  .nav-link.active {
    color: var(--text-primary);
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    height: 1px;
    width: 0;
    background: var(--text-primary);
    transition: width 0.22s ease;
  }

  .nav-link.active::after { width: 100%; }

  /* ── buttons ── */
  .btn-primary {
    padding: 10px 24px;
    background: var(--text-primary);
    color: var(--bg);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--text-primary);
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .btn-primary:hover {
    opacity: 0.88;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-primary:active { transform: translateY(0); opacity: 1; }

  .btn-ghost {
    padding: 10px 20px;
    border: 1px solid var(--border-strong);
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .btn-ghost:hover {
    color: var(--text-primary);
    border-color: var(--border-strong);
    background: var(--bg-subtle);
    transform: translateY(-1px);
  }

  .btn-ghost:active { transform: translateY(0); }

  /* ── cards ── */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
  }

  /* ── skill pill ── */
  .skill-pill {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-secondary);
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 3px 10px;
    transition: all 0.15s ease;
    letter-spacing: 0.02em;
  }

  .skill-pill:hover {
    color: var(--highlight);
    border-color: var(--highlight-border);
    background: var(--highlight-soft);
  }

  /* ── contact ── */
  .contact-card {
    padding: 1.1rem 1.4rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: border-color 0.18s, box-shadow 0.18s;
  }

  .contact-card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-sm);
  }

  .contact-action {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.05em;
    border: 1px solid var(--border-strong);
    padding: 6px 14px;
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted);
    text-decoration: none;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .contact-action:hover {
    color: var(--text-primary);
    border-color: var(--border-strong);
    background: var(--bg-subtle);
  }

  /* ── thinking ── */
  .thinking-card {
    padding: 1.5rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: 1rem;
    align-items: start;
    transition: border-color 0.18s, box-shadow 0.18s;
  }

  .thinking-card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-sm);
  }

  /* ── project-card ── */
  .project-card {
    border-radius: var(--radius);
    overflow: hidden;
    transition: border-color 0.18s, box-shadow 0.18s;
  }

  .project-card:hover {
    box-shadow: var(--shadow-sm);
  }

  /* ── section ── */
  .section {
    max-width: 880px;
    margin: 0 auto;
    padding: 5rem 2rem;
    border-top: 1px solid var(--border);
  }

  /* ── animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .fade-in { animation: fadeUp 0.5s ease forwards; }
  .fade-in-delay { animation: fadeUp 0.5s 0.12s ease both; }
  .fade-in-delay2 { animation: fadeUp 0.5s 0.24s ease both; }

  /* ── experience row ── */
  .exp-row {
    display: grid;
    grid-template-columns: 130px 1fr;
    gap: 1rem 1.5rem;
  }

  /* ── tag ── */
  .tag {
    font-family: var(--font-mono);
    font-size: 0.64rem;
    letter-spacing: 0.06em;
    padding: 3px 9px;
    border-radius: 4px;
    display: inline-block;
    line-height: 1.5;
  }

  .tag-accent {
    background: var(--highlight-soft);
    color: var(--highlight);
    border: 1px solid var(--highlight-border);
  }

  .tag-neutral {
    background: var(--bg-subtle);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }

  /* ── divider ── */
  .divider {
    height: 1px;
    background: var(--border);
  }

  /* ── nav desktop ── */
  .nav-desktop { display: flex; }
  .nav-mobile-btn { display: none; }

  /* ── responsive ── */
  @media (max-width: 768px) {
    .nav-desktop { display: none; }
    .nav-mobile-btn { display: block; }
    .section { padding: 3.5rem 1.25rem; }
    .contact-card { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .hero-inner { flex-direction: column-reverse; align-items: flex-start; gap: 2rem; }
    .hero-image-wrap { align-self: center; }
    .exp-row { grid-template-columns: 1fr; gap: 0.25rem; }
    .hero-stats { gap: 1.5rem; }
  }
`;

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function Tag({ children, accent }) {
  return (
    <span className={`tag ${accent ? "tag-accent" : "tag-neutral"}`}>
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mono-label" style={{ marginBottom: "0.75rem" }}>
      ↳ {children}
    </p>
  );
}

function BlockLabel({ children }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-mono)",
        color: "var(--text-muted)",
        fontSize: "0.62rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: "0.6rem",
      }}
    >
      {children}
    </p>
  );
}

function ProjectBlock({ label, children }) {
  return (
    <div>
      <BlockLabel>{label}</BlockLabel>
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

  /* inject styles & fonts once */
  useEffect(() => {
    const id = "portfolio-global-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  /* apply theme to html element */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /* active section tracking */
  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV.map((id) => document.getElementById(id));
      let current = "About";
      sections.forEach((section) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) current = section.id;
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
        fontFamily: "var(--font-body)",
      }}
    >
      {/* ════════════════ NAV ════════════════ */}
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
          padding: "0 2rem",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-primary)",
            fontSize: "0.78rem",
            letterSpacing: "0.06em",
            fontWeight: 500,
            userSelect: "none",
          }}
        >
          faisal.dev
        </span>

        {/* Desktop links */}
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

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            style={{
              padding: "5px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-strong)",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              transition: "all 0.15s ease",
            }}
            title="Toggle theme"
          >
            {theme === "light" ? "◐" : "○"}
          </button>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="nav-mobile-btn"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "1.1rem",
              lineHeight: 1,
              padding: "4px 6px",
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 52,
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

      {/* ════════════════ HERO ════════════════ */}
      <section
        id="About"
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "clamp(5rem, 12vh, 8rem) 2rem 5rem",
        }}
      >
        {/* top row */}
        <div
          className="hero-inner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "4rem",
          }}
        >
          {/* LEFT text */}
          <div className="fade-in" style={{ flex: 1, minWidth: 260 }}>
            <p
              className="mono-label fade-in"
              style={{ marginBottom: "1.5rem" }}
            >
              ↳ Backend Engineer · Payment Systems · Idempotent &amp;
              Fault-Tolerant Design
            </p>

            <h1 className="display fade-in" style={{ marginBottom: "1.25rem" }}>
              Faisal Ali
            </h1>

            {/* availability badge */}
            <div
              className="fade-in-delay"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "5px 14px",
                fontSize: "0.68rem",
                color: "var(--green)",
                border: "1px solid var(--green-border)",
                borderRadius: 99,
                marginBottom: "1.75rem",
                fontFamily: "var(--font-mono)",
                background: "var(--green-soft)",
                letterSpacing: "0.04em",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--green)",
                  flexShrink: 0,
                  boxShadow: "0 0 0 2px var(--green-soft)",
                }}
              />
              Open to backend roles
            </div>

            <p
              className="fade-in-delay"
              style={{
                fontSize: "1rem",
                color: "var(--text-secondary)",
                maxWidth: 500,
                lineHeight: 1.75,
                fontWeight: 400,
              }}
            >
              I build production backend systems for payments and travel
              platforms — focusing on idempotent flows, event-driven processing,
              and failure-resistant design.
            </p>

            {/* CTA buttons */}
            <div
              className="fade-in-delay2"
              style={{
                marginTop: "2.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
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
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
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

          {/* RIGHT image */}
          <div
            className="hero-image-wrap fade-in-delay"
            style={{ flexShrink: 0 }}
          >
            <div
              style={{
                position: "relative",
                width: "clamp(140px, 20vw, 196px)",
                height: "clamp(140px, 20vw, 196px)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  border: "1.5px solid var(--border-strong)",
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
                  filter: "grayscale(8%)",
                }}
              />
            </div>
          </div>
        </div>

        {/* stats bar */}
        <div
          className="hero-stats fade-in-delay2"
          style={{
            display: "flex",
            gap: "0",
            marginTop: "4rem",
            paddingTop: "2.5rem",
            borderTop: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          {[
            ["3+ yrs", "Production backend systems"],
            ["Java (Spring Boot)", "Core backend stack"],
            ["Travel & Rewards", "Customer platforms"],
            ["Kafka + Redis", "Event-driven · idempotency"],
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
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                {val}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  marginTop: 5,
                  letterSpacing: "0.03em",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* about text */}
        <div
          className="hero-about-box fade-in-delay2"
          style={{
            marginTop: "2.5rem",
            padding: "1.75rem 2rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--highlight)",
            borderRadius: "0 var(--radius) var(--radius) 0",
            maxWidth: 680,
          }}
        >
          <p className="body-text">
            Most of what I've learned has come from production failures — a
            payment that got processed twice, a cache that silently evicted a
            budget counter, a partner API that started returning 500s at
            midnight. These situations taught me to design systems that
            anticipate failure rather than assume the happy path.
            <br />
            <br />
            Currently at R360 Global Services working on fintech microservices
            for ICICI Bank and Kotak. Actively preparing to move into a
            product-company backend role where I can work at larger scale and
            own deeper parts of the system.
          </p>
        </div>
      </section>

      {/* ════════════════ SKILLS ════════════════ */}
      <section id="Skills" className="section">
        <SectionLabel>Technical Skills</SectionLabel>
        <h2 className="section-heading" style={{ marginBottom: "2.5rem" }}>
          The tools I reach for
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {SKILLS.map((group) => (
            <div
              key={group.label}
              className="card"
              style={{ padding: "1.25rem 1.4rem" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "0.9rem",
                  fontWeight: 500,
                }}
              >
                {group.label}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {group.items.map((item) => (
                  <span key={item} className="skill-pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ EXPERIENCE ════════════════ */}
      <section id="Experience" className="section">
        <SectionLabel>Work Experience</SectionLabel>
        <h2 className="section-heading" style={{ marginBottom: "2.75rem" }}>
          Where I've built things
        </h2>

        <div
          style={{
            borderLeft: "1.5px solid var(--border-strong)",
            paddingLeft: "2rem",
          }}
        >
          <div style={{ position: "relative" }}>
            {/* timeline dot */}
            <div
              style={{
                position: "absolute",
                left: -35,
                top: 10,
                width: 9,
                height: 9,
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
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 5,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Software Engineer
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  R360 Global Services · Bangalore
                </p>
              </div>
              <Tag>May 2023 – Present</Tag>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              {[
                {
                  area: "Payment systems",
                  detail:
                    "Built and owned the payment gateway integration layer handling full lifecycle — initiation, webhook processing, and bank settlement file reconciliation. Worked directly with ICICI Bank and Kotak Mahindra Bank APIs.",
                },
                {
                  area: "Reliability engineering",
                  detail:
                    "Implemented Resilience4j circuit breakers, exponential backoff retries, and Redis-backed idempotency across external API calls. Zero duplicate transactions across 6 months of live payment traffic.",
                },
                {
                  area: "Travel partner integrations",
                  detail:
                    "Built structured HTTP client layers for Cleartrip V4, MMT, and Yatra APIs. Standardised error handling, auth token management, and observability across all providers.",
                },
                {
                  area: "Performance & caching",
                  detail:
                    "Reduced external API latency by ~30% through Redis caching of hotel metadata and availability windows. Designed TTL strategies based on data volatility.",
                },
                {
                  area: "Observability",
                  detail:
                    "Set up structured JSON logging (provider, request ID, latency, status, error codes), Grafana dashboards, and CloudWatch alarms for critical payment flows.",
                },
              ].map(({ area, detail }) => (
                <div key={area} className="exp-row">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-muted)",
                      fontSize: "0.68rem",
                      paddingTop: 3,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {area}
                  </span>
                  <span className="body-text">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ PROJECTS ════════════════ */}
      <section id="Projects" className="section">
        <SectionLabel>Key Projects</SectionLabel>
        <h2 className="section-heading" style={{ marginBottom: "2.5rem" }}>
          What I've actually built
        </h2>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {PROJECTS.map((p, i) => {
            const isOpen = openProject === i;
            return (
              <div
                key={p.title}
                className="project-card"
                style={{
                  background: isOpen
                    ? "var(--highlight-soft)"
                    : "var(--bg-card)",
                  border: `1px solid ${isOpen ? "var(--highlight-border)" : "var(--border)"}`,
                }}
              >
                {/* header */}
                <div
                  onClick={() => setOpenProject(isOpen ? null : i)}
                  style={{
                    padding: "1.35rem 1.5rem",
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
                        marginBottom: "0.6rem",
                      }}
                    >
                      <Tag accent>{p.tag}</Tag>
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {p.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
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
                      fontSize: "1.1rem",
                      flexShrink: 0,
                      lineHeight: 1,
                      marginTop: 4,
                      fontWeight: 300,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </div>

                {/* expanded content */}
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
                      <p className="body-text">{p.problem}</p>
                    </ProjectBlock>

                    <ProjectBlock label="Architecture">
                      <p className="body-text">{p.architecture}</p>
                      {p.diagram && (
                        <div
                          style={{
                            marginTop: "1rem",
                            padding: "1rem 1.25rem",
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.72rem",
                            color: "var(--text-secondary)",
                            lineHeight: 2,
                          }}
                        >
                          {p.diagram.map((line, idx) => (
                            <div key={idx}>{line}</div>
                          ))}
                        </div>
                      )}
                    </ProjectBlock>

                    <ProjectBlock label="Stack">
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.4rem",
                        }}
                      >
                        {p.stack.map((s) => (
                          <Tag key={s}>{s}</Tag>
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

      {/* ════════════════ INCIDENT ════════════════ */}
      <section id="Incident" className="section">
        <SectionLabel>Production Incident</SectionLabel>
        <h2 className="section-heading" style={{ marginBottom: "2rem" }}>
          Handling real failures
        </h2>

        <div
          className="card"
          style={{
            padding: "1.75rem 2rem",
            borderLeft: "3px solid var(--highlight)",
            borderRadius: "0 var(--radius) var(--radius) 0",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              marginBottom: "1rem",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Duplicate Payment Issue
          </h3>

          <p className="body-text" style={{ marginBottom: "1.25rem" }}>
            Duplicate transactions were occurring due to retry race conditions
            between API retries and webhook processing.
          </p>

          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.55rem",
              listStyle: "none",
            }}
          >
            {[
              "Implemented Redis-based idempotency using SETNX to ensure single processing per transaction",
              "Added database-level unique constraints as a secondary safeguard",
              "Standardised retry handling across async and webhook flows",
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
              padding: "0.75rem 1rem",
              background: "var(--green-soft)",
              border: "1px solid var(--green-border)",
              borderRadius: "var(--radius-sm)",
              display: "inline-block",
            }}
          >
            <p
              style={{
                color: "var(--green)",
                fontSize: "0.78rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              ✓ Result: Zero duplicate transactions across live production
              traffic
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════ THINKING ════════════════ */}
      <section id="Thinking" className="section">
        <SectionLabel>Engineering Thinking</SectionLabel>
        <h2 className="section-heading">How I approach problems</h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            marginTop: "0.5rem",
            marginBottom: "2.5rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em",
          }}
        >
          These aren't rules I follow — they're patterns I've developed from
          getting things wrong in production.
        </p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {THINKING.map((t, i) => (
            <div key={t.heading} className="thinking-card">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  paddingTop: 4,
                  userSelect: "none",
                  opacity: 0.6,
                }}
              >
                0{i + 1}
              </span>
              <div>
                <h4
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    marginBottom: "0.55rem",
                    lineHeight: 1.4,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t.heading}
                </h4>
                <p className="body-text">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ CONTACT ════════════════ */}
      <section
        id="Contact"
        className="section"
        style={{ paddingBottom: "7rem" }}
      >
        <SectionLabel>Contact</SectionLabel>
        <h2 className="section-heading">Let's talk</h2>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.82rem",
            marginTop: "0.5rem",
            marginBottom: "2.5rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.03em",
          }}
        >
          Open to backend / distributed systems roles at product companies.
        </p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}
        >
          {[
            {
              label: "Email",
              value: "faisal.dev.ali@gmail.com",
              href: "mailto:faisal.dev.ali@gmail.com",
              action: "Send mail →",
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
              action: "View projects →",
            },
            {
              label: "Phone",
              value: "+91 9144914356",
              href: "tel:+919144914356",
              action: "Call →",
            },
          ].map(({ label, value, href, action }) => (
            <div key={label} className="contact-card">
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)",
                    fontSize: "0.62rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 6,
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
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    wordBreak: "break-all",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.01em",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.color = "var(--highlight)")
                  }
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
                className="contact-action"
              >
                {action}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <div
        style={{
          textAlign: "center",
          padding: "1.5rem 2rem",
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: "0.68rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
        }}
      >
        faisal ali · backend engineer · bangalore · {new Date().getFullYear()}
      </div>
    </div>
  );
}
