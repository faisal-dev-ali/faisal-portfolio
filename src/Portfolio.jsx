import { useState, useEffect } from "react";

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

function Tag({ children, accent }) {
  return (
    <span
      style={{
        background: accent ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.07)",
        color: accent ? "#eab308" : "#94a3b8",
        border: `1px solid ${accent ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.1)"}`,
        fontSize: "0.7rem",
        fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
        letterSpacing: "0.04em",
        padding: "2px 10px",
        borderRadius: "3px",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

function NavDot({ active }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: active ? 20 : 8,
        height: 2,
        background: active ? "#eab308" : "rgba(255,255,255,0.25)",
        borderRadius: 2,
        transition: "all 0.3s ease",
        marginLeft: 4,
      }}
    />
  );
}

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("About");
  const [openProject, setOpenProject] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV.map((id) => document.getElementById(id));

      let current = "About";

      sections.forEach((section) => {
        if (!section) return;

        const rect = section.getBoundingClientRect();

        if (rect.top <= 120 && rect.bottom >= 120) {
          current = section.id;
        }
      });

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        background: "#0b1120",
        color: "#e2e8f0",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      // ONLY showing CHANGED parts — rest remains same
      <style>{`
/* EXISTING CSS stays */

/* ================== RESPONSIVE ================== */

/* NAV */
.desktop-nav { display: flex; gap: 2rem; }
.mobile-btn { display: none; }

@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .mobile-btn { display: block; }
}

/* HERO */
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    text-align: center;
  }
}

/* EXPERIENCE */
.exp-item {
  display: grid;
  grid-template-columns: minmax(120px, 150px) 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .exp-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
}

/* MOBILE FIX */
@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    text-align: center;
  }

  .hero img {
    margin-top: 1.5rem;
  }
}

.nav-item::after {
  content: "";
  display: block;
  height: 2px;
  width: 0;
  background: #eab308;
  transition: width 0.3s ease;
}

.nav-item.active::after {
  width: 100%;
}

/* CONTACT */
.contact-row {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.desktop-nav {
  display: flex;
  gap: 2rem;
}

.mobile-btn {
  display: none;
}

/* MOBILE */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .mobile-btn {
    display: block;
  }
}

.mobile-btn {
  display: none;
  line-height: 1;
}

@media (max-width: 600px) {
  .contact-row {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* GLOBAL */
body { overflow-x: hidden; }

@media (max-width: 768px) {
  section {
    padding: 4rem 1.2rem !important;
  }
}
`}</style>
      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(11,17,32,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 2rem",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: "#eab308",
            fontSize: "0.85rem",
            letterSpacing: "0.05em",
          }}
        >
          faisal.dev
        </span>

        {/* Desktop nav */}
        <div className="desktop-nav">
          {NAV.map((n) => (
            <span
              key={n}
              onClick={() => scrollTo(n)}
              className="nav-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#94a3b8",
                fontSize: "0.9rem",
              }}
            >
              {n}
              <NavDot active={activeSection === n} />
            </span>
          ))}
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-btn"
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: "1.3rem",
          }}
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
            background: "#0f172a",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "1rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {NAV.map((n) => (
            <span
              key={n}
              className="nav-item"
              onClick={() => scrollTo(n)}
              style={{ color: "#94a3b8", fontSize: "0.9rem" }}
            >
              {n}
            </span>
          ))}
        </div>
      )}
      {/* ── HERO ── */}
      <section
        id="About"
        className="hero"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 900,
          margin: "0 auto",
          padding: "7rem 2rem 4rem",
          gap: "3rem",
        }}
      >
        {/* LEFT */}
        <div className="fade-in" style={{ flex: 1, minWidth: 280 }}>
          {/* TAGLINE */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "#eab308",
              fontSize: "0.78rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            ↳ Backend Engineer · Payment Systems · Idempotent & Fault-Tolerant
            Design
          </p>

          {/* NAME */}
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.8rem, 7vw, 5rem)",
              fontWeight: 900,
              lineHeight: 1.05,
              color: "#f1f5f9",
              marginBottom: "1rem",
            }}
          >
            Faisal Ali
          </h1>

          {/* AVAILABILITY BADGE */}
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              fontSize: "0.7rem",
              color: "#22c55e",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 20,
              marginBottom: "1.5rem",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ● Open to backend roles
          </div>

          {/* DESCRIPTION */}
          <p
            style={{
              fontSize: "1.1rem",
              color: "#94a3b8",
              maxWidth: 560,
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            I build production backend systems for payments and travel platforms
            — focusing on idempotent flows, event-driven processing, and
            failure-resistant design.
          </p>

          {/* CTA BUTTONS */}
          <div style={{ marginTop: "2.5rem" }}>
            {/* ROW 1 → RESUME (PRIMARY) */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <a
                href="/Faisal_Ali_Backend_Engineer.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 24px",
                  background: "#eab308",
                  color: "#0b1120",
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                }}
              >
                View Resume →
              </a>

              <a
                href="/Faisal_Ali_Backend_Engineer.pdf"
                download
                style={{
                  padding: "10px 24px",
                  border: "1px solid rgba(234,179,8,0.4)",
                  color: "#eab308",
                  borderRadius: 4,
                  fontWeight: 500,
                  fontSize: "0.82rem",
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                }}
              >
                Download ↓
              </a>
            </div>

            {/* ROW 2 → SECONDARY */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <a
                href="mailto:faisal.dev.ali@gmail.com"
                style={{
                  padding: "10px 20px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#94a3b8",
                  borderRadius: 4,
                  fontWeight: 500,
                  fontSize: "0.82rem",
                  textDecoration: "none",
                }}
              >
                Email
              </a>

              <a
                href="https://linkedin.com/in/faisal-ali-877bb4219"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 20px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#94a3b8",
                  borderRadius: 4,
                  fontWeight: 500,
                  fontSize: "0.82rem",
                  textDecoration: "none",
                }}
              >
                LinkedIn
              </a>

              <a
                href="https://github.com/faisal-dev-ali"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 20px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#94a3b8",
                  borderRadius: 4,
                  fontWeight: 500,
                  fontSize: "0.82rem",
                  textDecoration: "none",
                }}
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "2.5rem",
          }}
        >
          <img
            src="/profile.png"
            alt="Faisal Ali"
            style={{
              width: "clamp(140px, 40vw, 200px)",
              height: "clamp(140px, 40vw, 200px)",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid rgba(234,179,8,0.4)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
              display: "block",
              margin: "0 auto",
            }}
          />
        </div>

        {/* Quick facts bar */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            marginTop: "5rem",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: "2rem",
            flexWrap: "wrap",
          }}
        >
          {[
            ["3+ yrs", "Production backend systems"],
            ["Java (Spring Boot)", "Core backend stack"],
            ["Travel & Rewards", "Customer platforms"],
            ["Kafka + Redis", "Event-driven · idempotency"],
          ].map(([val, label]) => (
            <div key={val}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#eab308",
                }}
              >
                {val}
              </div>
              <div
                style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* About text */}
        <div
          style={{
            marginTop: "3rem",
            padding: "2rem",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            maxWidth: 700,
          }}
        >
          <p
            style={{ color: "#94a3b8", lineHeight: 1.85, fontSize: "0.95rem" }}
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
      {/* ── SKILLS ── */}
      <section
        id="Skills"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "5rem 2rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SectionLabel>Technical Skills</SectionLabel>
        <h2 style={h2Style}>The tools I reach for</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1.5rem",
            marginTop: "2.5rem",
          }}
        >
          {SKILLS.map((group) => (
            <div
              key={group.label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                padding: "1.25rem 1.5rem",
              }}
            >
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#eab308",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "0.85rem",
                }}
              >
                {group.label}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="skill-pill"
                    style={{
                      fontSize: "0.78rem",
                      color: "#cbd5e1",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 4,
                      padding: "3px 10px",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* ── EXPERIENCE ── */}
      <section
        id="Experience"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "5rem 2rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SectionLabel>Work Experience</SectionLabel>
        <h2 style={h2Style}>Where I've built things</h2>

        <div
          style={{
            marginTop: "2.5rem",
            borderLeft: "2px solid rgba(234,179,8,0.3)",
            paddingLeft: "2rem",
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: -33,
                top: 6,
                width: 10,
                height: 10,
                background: "#eab308",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    color: "#f1f5f9",
                  }}
                >
                  Software Engineer
                </h3>
                <p
                  style={{
                    color: "#eab308",
                    fontSize: "0.85rem",
                    marginTop: 2,
                  }}
                >
                  R360 Global Services · Bangalore
                </p>
              </div>
              <Tag>May 2023 – Present</Tag>
            </div>

            <div
              style={{
                marginTop: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
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
                <div
                  key={area}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(130px, 160px) 1fr",
                    gap: "1rem",
                    fontSize: "0.88rem",
                    lineHeight: 1.7,
                    paddingBottom: "0.8rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {/* LEFT */}
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#eab308",
                      fontSize: "0.75rem",
                    }}
                  >
                    {area}
                  </span>

                  {/* RIGHT */}
                  <span
                    style={{
                      color: "#94a3b8",
                    }}
                  >
                    {detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ── PROJECTS ── */}
      <section
        id="Projects"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "5rem 2rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SectionLabel>Key Projects</SectionLabel>
        <h2 style={h2Style}>What I've actually built</h2>

        <div
          style={{
            marginTop: "2.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {PROJECTS.map((p, i) => {
            const isOpen = openProject === i;
            return (
              <div
                key={p.title}
                className="project-card"
                style={{
                  background: isOpen
                    ? "rgba(234,179,8,0.04)"
                    : "rgba(255,255,255,0.025)",
                  border: `1px solid ${isOpen ? "rgba(234,179,8,0.35)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {/* Header — always visible */}
                <div
                  onClick={() => setOpenProject(isOpen ? null : i)}
                  style={{
                    padding: "1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <Tag accent>{p.tag}</Tag>
                    </div>
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        color: "#f1f5f9",
                      }}
                    >
                      {p.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#64748b",
                        marginTop: 3,
                      }}
                    >
                      {p.subtitle}
                    </p>
                  </div>
                  <span
                    style={{
                      color: "#eab308",
                      fontSize: "1.1rem",
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div
                    className="fade-in"
                    style={{
                      padding: "0 1.5rem 1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    <Divider />

                    <ProjectBlock label="Problem">
                      <p style={bodyText}>{p.problem}</p>
                    </ProjectBlock>

                    <ProjectBlock label="Architecture">
                      <p style={bodyText}>{p.architecture}</p>

                      {/* ✅ Diagram */}
                      {p.diagram && (
                        <div
                          style={{
                            marginTop: "1rem",
                            padding: "1rem",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 6,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "0.75rem",
                            color: "#cbd5e1",
                            lineHeight: 1.8,
                          }}
                        >
                          {p.diagram.map((line, i) => (
                            <div key={i}>{line}</div>
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
                          gap: "0.6rem",
                        }}
                      >
                        {p.challenges.map((c, ci) => (
                          <li
                            key={ci}
                            style={{
                              display: "flex",
                              gap: "0.75rem",
                              fontSize: "0.85rem",
                              color: "#94a3b8",
                              lineHeight: 1.7,
                            }}
                          >
                            <span
                              style={{
                                color: "#eab308",
                                flexShrink: 0,
                                marginTop: 2,
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
                      <p style={{ ...bodyText, color: "#a3e635" }}>
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
      <section
        id="Incident"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "5rem 2rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SectionLabel>Production Incident</SectionLabel>
        <h2 style={h2Style}>Handling real failures</h2>

        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <h3 style={{ color: "#f1f5f9", marginBottom: "1rem" }}>
            Duplicate Payment Issue
          </h3>

          <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>
            Duplicate transactions were occurring due to retry race conditions
            between API retries and webhook processing.
          </p>

          <ul
            style={{
              color: "#94a3b8",
              fontSize: "0.9rem",
              lineHeight: 1.7,
            }}
          >
            <li>
              Implemented Redis-based idempotency using SETNX to ensure single
              processing per transaction
            </li>
            <li>
              Added database-level unique constraints as a secondary safeguard
            </li>
            <li>Standardised retry handling across async and webhook flows</li>
          </ul>

          <p
            style={{
              marginTop: "1rem",
              color: "#eab308",
              fontSize: "0.85rem",
            }}
          >
            Result: Zero duplicate transactions across live production traffic
          </p>
        </div>
      </section>
      {/* ── THINKING ── */}
      <section
        id="Thinking"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "5rem 2rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SectionLabel>Engineering Thinking</SectionLabel>
        <h2 style={h2Style}>How I approach problems</h2>
        <p
          style={{
            color: "#64748b",
            fontSize: "0.9rem",
            marginTop: "0.5rem",
            marginBottom: "2.5rem",
          }}
        >
          These aren't rules I follow — they're patterns I've developed from
          getting things wrong in production.
        </p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {THINKING.map((t, i) => (
            <div
              key={t.heading}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "1.5rem",
                padding: "1.5rem",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                alignItems: "start",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#eab308",
                  fontSize: "1rem",
                  fontWeight: 500,
                  opacity: 0.5,
                  paddingTop: 2,
                }}
              >
                0{i + 1}
              </span>
              <div>
                <h4
                  style={{
                    color: "#f1f5f9",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {t.heading}
                </h4>
                <p style={bodyText}>{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* ── CONTACT ── */}
      <section
        id="Contact"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "5rem 2rem 8rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SectionLabel>Contact</SectionLabel>
        <h2 style={h2Style}>Let's talk</h2>

        <p
          style={{
            color: "#64748b",
            fontSize: "0.9rem",
            marginTop: "0.5rem",
            marginBottom: "2.5rem",
          }}
        >
          Open to backend / distributed systems roles at product companies.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.5rem",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 6,
                transition: "all 0.2s ease",
              }}
            >
              {/* LEFT SIDE */}
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#64748b",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>

                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#eab308",
                    fontSize: "0.9rem",
                    textDecoration: "none",
                  }}
                >
                  {value}
                </a>
              </div>

              {/* RIGHT CTA */}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "6px 12px",
                  borderRadius: 4,
                  textDecoration: "none",
                }}
              >
                {action}
              </a>
            </div>
          ))}
        </div>
      </section>
      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          color: "#334155",
          fontSize: "0.75rem",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        faisal ali · backend engineer · bangalore · {new Date().getFullYear()}
      </div>
    </div>
  );
}

/* ── HELPERS ── */
function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: "#eab308",
        fontSize: "0.7rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "0.6rem",
      }}
    >
      ↳ {children}
    </p>
  );
}

const h2Style = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
  fontWeight: 700,
  color: "#f1f5f9",
};

const bodyText = {
  fontSize: "0.88rem",
  color: "#94a3b8",
  lineHeight: 1.8,
};

function ProjectBlock({ label, children }) {
  return (
    <div>
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: "#64748b",
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />;
}
