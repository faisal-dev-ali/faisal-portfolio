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
   DESIGN TOKENS (all design changes centralised here)
───────────────────────────────────────────── */
const T = {
  gold: "#e8b84b",
  goldDim: "rgba(232,184,75,0.12)",
  goldBorder: "rgba(232,184,75,0.28)",
  goldHover: "#f5cc6b",
  bg: "#090e1a",
  bgCard: "rgba(255,255,255,0.028)",
  bgCardHover: "rgba(255,255,255,0.045)",
  border: "rgba(255,255,255,0.075)",
  borderHover: "rgba(255,255,255,0.14)",
  textPrimary: "#eef2f7",
  textSecondary: "#8b98ae",
  textMuted: "#4e5a6e",
  green: "#4ade80",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  serif: "'Playfair Display', Georgia, serif",
  sans: "'DM Sans', 'Inter', 'Helvetica Neue', sans-serif",
  radius: "10px",
  radiusSm: "6px",
  shadow: "0 4px 24px rgba(0,0,0,0.45)",
  shadowCard: "0 2px 16px rgba(0,0,0,0.35)",
};

/* ─────────────────────────────────────────────
   GLOBAL STYLES — injected once
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
  body { background: ${T.bg}; color: ${T.textPrimary}; font-family: ${T.sans}; overflow-x: hidden; }

  /* ── scrollbar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(232,184,75,0.25); border-radius: 3px; }

  /* ── selection ── */
  ::selection { background: rgba(232,184,75,0.22); color: #fff; }

  /* ── typography scale ── */
  .display { font-family: ${T.serif}; font-size: clamp(3rem, 8vw, 5.5rem); font-weight: 900; line-height: 1.02; letter-spacing: -0.02em; color: ${T.textPrimary}; }
  .section-heading { font-family: ${T.serif}; font-size: clamp(1.75rem, 4vw, 2.6rem); font-weight: 700; line-height: 1.15; color: ${T.textPrimary}; }
  .mono-label { font-family: ${T.mono}; font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.gold}; }
  .body-text { font-size: 0.9rem; color: ${T.textSecondary}; line-height: 1.85; }

  /* ── nav items ── */
  .nav-link {
    font-size: 0.82rem;
    letter-spacing: 0.02em;
    color: ${T.textMuted};
    cursor: pointer;
    padding: 4px 0;
    position: relative;
    transition: color 0.2s;
    user-select: none;
  }
  .nav-link:hover { color: ${T.textSecondary}; }
  .nav-link.active { color: ${T.gold}; }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0;
    height: 1.5px;
    width: 0;
    background: ${T.gold};
    transition: width 0.25s ease;
    border-radius: 1px;
  }
  .nav-link.active::after { width: 100%; }

  /* ── buttons ── */
  .btn-primary {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 22px;
    background: ${T.gold};
    color: #08100f;
    border-radius: ${T.radiusSm};
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-decoration: none;
    transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
    box-shadow: 0 2px 12px rgba(232,184,75,0.22);
    white-space: nowrap;
  }
  .btn-primary:hover {
    background: ${T.goldHover};
    transform: translateY(-1px);
    box-shadow: 0 4px 18px rgba(232,184,75,0.35);
  }
  .btn-primary:active { transform: translateY(0); }

  .btn-outline-gold {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 22px;
    border: 1.5px solid ${T.goldBorder};
    color: ${T.gold};
    border-radius: ${T.radiusSm};
    font-weight: 500;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-decoration: none;
    transition: border-color 0.18s, background 0.18s, transform 0.15s;
    white-space: nowrap;
  }
  .btn-outline-gold:hover {
    border-color: ${T.gold};
    background: ${T.goldDim};
    transform: translateY(-1px);
  }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 18px;
    border: 1px solid ${T.border};
    color: ${T.textSecondary};
    border-radius: ${T.radiusSm};
    font-size: 0.8rem;
    text-decoration: none;
    transition: border-color 0.18s, color 0.18s, transform 0.15s;
    white-space: nowrap;
  }
  .btn-ghost:hover {
    border-color: ${T.borderHover};
    color: ${T.textPrimary};
    transform: translateY(-1px);
  }

  /* ── cards ── */
  .card {
    background: ${T.bgCard};
    border: 1px solid ${T.border};
    border-radius: ${T.radius};
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .card:hover {
    border-color: ${T.borderHover};
    background: ${T.bgCardHover};
    box-shadow: ${T.shadowCard};
  }

  /* ── skill pill ── */
  .skill-pill {
    font-size: 0.78rem;
    color: #b4c0d4;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px;
    padding: 3px 10px;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    cursor: default;
  }
  .skill-pill:hover {
    background: rgba(232,184,75,0.1);
    border-color: ${T.goldBorder};
    color: ${T.gold};
  }

  /* ── project card ── */
  .project-card {
    border-radius: ${T.radius};
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .project-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.3); }

  /* ── contact row ── */
  .contact-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.1rem 1.5rem;
    background: ${T.bgCard};
    border: 1px solid ${T.border};
    border-radius: ${T.radius};
    transition: border-color 0.2s, background 0.2s;
    gap: 1rem;
  }
  .contact-card:hover {
    border-color: ${T.borderHover};
    background: ${T.bgCardHover};
  }
  .contact-action {
    font-size: 0.73rem;
    color: ${T.textMuted};
    border: 1px solid rgba(255,255,255,0.09);
    padding: 5px 12px;
    border-radius: 4px;
    text-decoration: none;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
    white-space: nowrap;
  }
  .contact-action:hover {
    border-color: ${T.borderHover};
    color: ${T.textSecondary};
    background: rgba(255,255,255,0.04);
  }

  /* ── experience grid ── */
  .exp-row {
    display: grid;
    grid-template-columns: minmax(130px, 155px) 1fr;
    gap: 1.25rem;
    font-size: 0.875rem;
    line-height: 1.75;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  /* ── thinking card ── */
  .thinking-card {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
    background: ${T.bgCard};
    border: 1px solid ${T.border};
    border-radius: ${T.radius};
    transition: border-color 0.2s, background 0.2s;
    align-items: start;
  }
  .thinking-card:hover {
    border-color: ${T.borderHover};
    background: ${T.bgCardHover};
  }

  /* ── fade in ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeUp 0.55s ease both; }
  .fade-in-delay { animation: fadeUp 0.55s ease 0.12s both; }
  .fade-in-delay2 { animation: fadeUp 0.55s ease 0.24s both; }

  /* ── section spacing ── */
  .section { max-width: 900px; margin: 0 auto; padding: 5.5rem 2rem; border-top: 1px solid rgba(255,255,255,0.055); }

  /* ── horizontal rule / divider ── */
  .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 0; }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .section { padding: 4rem 1.25rem; }
    .exp-row { grid-template-columns: 1fr; gap: 2px; }
    .thinking-card { grid-template-columns: 24px 1fr; gap: 1rem; }
    .contact-card { flex-direction: column; align-items: flex-start; }
    .hero-inner { flex-direction: column-reverse !important; text-align: center; }
    .hero-image-wrap { display: flex; justify-content: center; margin-bottom: 0.5rem; }
    .hero-ctas { justify-content: center !important; }
    .hero-stats { justify-content: center !important; }
    .hero-about-box { text-align: left; }
    .nav-desktop { display: none !important; }
    .nav-mobile-btn { display: flex !important; }
  }
  @media (min-width: 769px) {
    .nav-mobile-btn { display: none !important; }
    .nav-desktop { display: flex !important; }
  }
`;

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function Tag({ children, accent }) {
  return (
    <span
      style={{
        background: accent ? T.goldDim : "rgba(255,255,255,0.055)",
        color: accent ? T.gold : T.textMuted,
        border: `1px solid ${accent ? T.goldBorder : "rgba(255,255,255,0.09)"}`,
        fontSize: "0.68rem",
        fontFamily: T.mono,
        letterSpacing: "0.05em",
        padding: "3px 10px",
        borderRadius: "4px",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mono-label" style={{ marginBottom: "0.6rem" }}>
      ↳ {children}
    </p>
  );
}

function ProjectBlock({ label, children }) {
  return (
    <div>
      <p
        style={{
          fontFamily: T.mono,
          color: T.textMuted,
          fontSize: "0.66rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </p>
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

  /* inject global CSS once */
  useEffect(() => {
    const id = "portfolio-global-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
    /* Google Fonts */
    const fonts = [
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
    ];
    fonts.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = href;
        document.head.appendChild(l);
      }
    });
  }, []);

  /* active section tracking */
  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV.map((id) => document.getElementById(id));
      let current = "About";
      sections.forEach((section) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) current = section.id;
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

  /* ── RENDER ── */
  return (
    <div
      style={{
        background: T.bg,
        color: T.textPrimary,
        minHeight: "100vh",
        fontFamily: T.sans,
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
          background: "rgba(9,14,26,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
          padding: "0 2rem",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: T.mono,
            color: T.gold,
            fontSize: "0.82rem",
            letterSpacing: "0.06em",
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

        {/* Mobile burger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="nav-mobile-btn"
          style={{
            background: "none",
            border: "none",
            color: T.textSecondary,
            cursor: "pointer",
            fontSize: "1.25rem",
            lineHeight: 1,
            padding: "4px 6px",
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 56,
            left: 0,
            right: 0,
            zIndex: 99,
            background: "#0d1425",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "1.25rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem",
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

      {/* ════════════════ HERO ════════════════ */}
      <section
        id="About"
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "7rem 2rem 5rem",
          paddingTop: "clamp(5rem, 12vh, 8rem)",
        }}
      >
        {/* — top row: text + avatar — */}
        <div
          className="hero-inner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "3.5rem",
          }}
        >
          {/* LEFT text */}
          <div className="fade-in" style={{ flex: 1, minWidth: 260 }}>
            <p
              className="mono-label fade-in"
              style={{ marginBottom: "1.25rem" }}
            >
              ↳ Backend Engineer · Payment Systems · Idempotent &amp;
              Fault-Tolerant Design
            </p>

            <h1 className="display fade-in" style={{ marginBottom: "1rem" }}>
              Faisal Ali
            </h1>

            {/* availability badge */}
            <div
              className="fade-in-delay"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 14px",
                fontSize: "0.7rem",
                color: T.green,
                border: "1px solid rgba(74,222,128,0.28)",
                borderRadius: 20,
                marginBottom: "1.5rem",
                fontFamily: T.mono,
                background: "rgba(74,222,128,0.06)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: T.green,
                  flexShrink: 0,
                }}
              />
              Open to backend roles
            </div>

            <p
              className="fade-in-delay"
              style={{
                fontSize: "1.05rem",
                color: T.textSecondary,
                maxWidth: 520,
                lineHeight: 1.75,
                fontWeight: 300,
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
                gap: "0.85rem",
              }}
            >
              {/* Row 1 — primary */}
              <div
                className="hero-ctas"
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
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
                  className="btn-outline-gold"
                >
                  Download ↓
                </a>
              </div>
              {/* Row 2 — secondary */}
              <div
                className="hero-ctas"
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
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
                width: "clamp(150px, 22vw, 210px)",
                height: "clamp(150px, 22vw, 210px)",
              }}
            >
              {/* gold ring */}
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: "50%",
                  border: `2px solid ${T.goldBorder}`,
                  boxShadow: `0 0 32px rgba(232,184,75,0.12)`,
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
                  boxShadow: T.shadow,
                }}
              />
            </div>
          </div>
        </div>

        {/* — stats bar — */}
        <div
          className="hero-stats fade-in-delay2"
          style={{
            display: "flex",
            gap: "2.5rem",
            marginTop: "4rem",
            paddingTop: "2rem",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            flexWrap: "wrap",
          }}
        >
          {[
            ["3+ yrs", "Production backend systems"],
            ["Java (Spring Boot)", "Core backend stack"],
            ["Travel & Rewards", "Customer platforms"],
            ["Kafka + Redis", "Event-driven · idempotency"],
          ].map(([val, label]) => (
            <div key={val} style={{ minWidth: 110 }}>
              <div
                style={{
                  fontFamily: T.serif,
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: T.gold,
                  lineHeight: 1.1,
                }}
              >
                {val}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: T.textMuted,
                  marginTop: 4,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* — about text — */}
        <div
          className="hero-about-box fade-in-delay2"
          style={{
            marginTop: "2.5rem",
            padding: "1.75rem 2rem",
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: T.radius,
            maxWidth: 720,
          }}
        >
          <p
            style={{
              color: T.textSecondary,
              lineHeight: 1.9,
              fontSize: "0.92rem",
            }}
          >
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
            gridTemplateColumns: "repeat(auto-fill, minmax(245px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {SKILLS.map((group) => (
            <div
              key={group.label}
              className="card"
              style={{ padding: "1.35rem 1.5rem" }}
            >
              <p className="mono-label" style={{ marginBottom: "0.85rem" }}>
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
        <h2 className="section-heading" style={{ marginBottom: "2.5rem" }}>
          Where I've built things
        </h2>

        <div
          style={{
            borderLeft: `2px solid ${T.goldBorder}`,
            paddingLeft: "2rem",
          }}
        >
          <div style={{ position: "relative" }}>
            {/* timeline dot */}
            <div
              style={{
                position: "absolute",
                left: -35,
                top: 8,
                width: 10,
                height: 10,
                background: T.gold,
                borderRadius: "50%",
                boxShadow: `0 0 10px rgba(232,184,75,0.35)`,
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "1.75rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: T.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Software Engineer
                </h3>
                <p style={{ color: T.gold, fontSize: "0.84rem" }}>
                  R360 Global Services · Bangalore
                </p>
              </div>
              <Tag>May 2023 – Present</Tag>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
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
                      fontFamily: T.mono,
                      color: T.gold,
                      fontSize: "0.72rem",
                      paddingTop: 2,
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

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {PROJECTS.map((p, i) => {
            const isOpen = openProject === i;
            return (
              <div
                key={p.title}
                className="project-card"
                style={{
                  background: isOpen ? "rgba(232,184,75,0.035)" : T.bgCard,
                  border: `1px solid ${isOpen ? T.goldBorder : T.border}`,
                  overflow: "hidden",
                }}
              >
                {/* header */}
                <div
                  onClick={() => setOpenProject(isOpen ? null : i)}
                  style={{
                    padding: "1.4rem 1.5rem",
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
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        marginBottom: "0.55rem",
                      }}
                    >
                      <Tag accent>{p.tag}</Tag>
                    </div>
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: T.textPrimary,
                        marginBottom: 3,
                      }}
                    >
                      {p.title}
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: T.textMuted }}>
                      {p.subtitle}
                    </p>
                  </div>
                  <span
                    style={{
                      color: T.gold,
                      fontSize: "1.25rem",
                      flexShrink: 0,
                      lineHeight: 1,
                      marginTop: 2,
                      fontWeight: 300,
                    }}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </div>

                {/* expanded */}
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
                            background: "rgba(255,255,255,0.028)",
                            border: `1px solid ${T.border}`,
                            borderRadius: T.radiusSm,
                            fontFamily: T.mono,
                            fontSize: "0.73rem",
                            color: "#b4c0d4",
                            lineHeight: 1.9,
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
                              color: T.textSecondary,
                              lineHeight: 1.75,
                            }}
                          >
                            <span
                              style={{
                                color: T.gold,
                                flexShrink: 0,
                                marginTop: 3,
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
                          color: T.green,
                          lineHeight: 1.75,
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
            borderLeft: `3px solid ${T.gold}`,
            borderRadius: T.radius,
          }}
        >
          <h3
            style={{
              color: T.textPrimary,
              marginBottom: "1rem",
              fontSize: "1.05rem",
              fontWeight: 600,
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
                  color: T.textSecondary,
                  lineHeight: 1.7,
                }}
              >
                <span style={{ color: T.gold, flexShrink: 0, marginTop: 3 }}>
                  →
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p
            style={{
              marginTop: "1.25rem",
              color: T.gold,
              fontSize: "0.82rem",
              fontFamily: T.mono,
              letterSpacing: "0.03em",
            }}
          >
            Result: Zero duplicate transactions across live production traffic
          </p>
        </div>
      </section>

      {/* ════════════════ THINKING ════════════════ */}
      <section id="Thinking" className="section">
        <SectionLabel>Engineering Thinking</SectionLabel>
        <h2 className="section-heading">How I approach problems</h2>
        <p
          style={{
            color: T.textMuted,
            fontSize: "0.88rem",
            marginTop: "0.5rem",
            marginBottom: "2.5rem",
          }}
        >
          These aren't rules I follow — they're patterns I've developed from
          getting things wrong in production.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {THINKING.map((t, i) => (
            <div key={t.heading} className="thinking-card">
              <span
                style={{
                  fontFamily: T.mono,
                  color: T.gold,
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  opacity: 0.55,
                  paddingTop: 3,
                  userSelect: "none",
                }}
              >
                0{i + 1}
              </span>
              <div>
                <h4
                  style={{
                    color: T.textPrimary,
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    marginBottom: "0.5rem",
                    lineHeight: 1.4,
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
            color: T.textMuted,
            fontSize: "0.88rem",
            marginTop: "0.5rem",
            marginBottom: "2.5rem",
          }}
        >
          Open to backend / distributed systems roles at product companies.
        </p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
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
                    fontFamily: T.mono,
                    color: T.textMuted,
                    fontSize: "0.66rem",
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
                    color: T.gold,
                    fontSize: "0.88rem",
                    textDecoration: "none",
                    transition: "color 0.18s",
                    wordBreak: "break-all",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = T.goldHover)}
                  onMouseLeave={(e) => (e.target.style.color = T.gold)}
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
          borderTop: "1px solid rgba(255,255,255,0.05)",
          color: T.textMuted,
          fontSize: "0.72rem",
          fontFamily: T.mono,
          letterSpacing: "0.05em",
        }}
      >
        faisal ali · backend engineer · bangalore · {new Date().getFullYear()}
      </div>
    </div>
  );
}
