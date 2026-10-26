import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Sparkles, Laugh, RotateCw, Terminal, Copy, Check, WandSparkles, Mail } from "lucide-react";
import "./styles.css";

const API_URL = "http://localhost:8080/api/jokes";
const SUBSCRIPTION_API_URL = "http://localhost:8080/api/subscriptions";

function App() {
  const [prompt, setPrompt] = useState("A kid friendly joke please");
  const [joke, setJoke] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionOutcome, setSubscriptionOutcome] = useState(null);

  async function subscribe(event) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    setSubscribing(true);
    setSubscriptionOutcome(null);

    try {
      const response = await fetch(SUBSCRIPTION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json, text/plain, */*" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const body = await response.text();
      let message = body;
      try {
        const data = JSON.parse(body);
        message = data.message ?? data.error ?? data.detail ?? body;
      } catch {
        // The service may return a plain-text response.
      }

      if (!response.ok) {
        throw new Error(message || `The subscription service returned HTTP ${response.status}.`);
      }

      setSubscriptionOutcome({ success: true, message: message || "You're subscribed! Keep an eye on your inbox for a little laughter." });
      setEmail("");
    } catch (err) {
      setSubscriptionOutcome({
        success: false,
        message: err instanceof TypeError
          ? "Couldn't reach the subscription service. Please try again when the service is available."
          : err.message || "We couldn't complete your subscription. Please try again.",
      });
    } finally {
      setSubscribing(false);
    }
  }

  async function getJoke(event) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Give Jack a topic first!");
      return;
    }

    setLoading(true);
    setError("");
    setJoke("");
    setCopied(false);

    try {
      const url = `${API_URL}?prompt=${encodeURIComponent(trimmedPrompt)}`;
      const response = await fetch(url, { method: "GET", headers: { Accept: "application/json, text/plain, */*" } });
      if (!response.ok) {
        throw new Error(`The joke service returned HTTP ${response.status}.`);
      }
      const contentType = response.headers.get("content-type") || "";
      // const data = contentType.includes("application/json") ? await response.json() : await response.text();
      // const result = typeof data === "string"
      //   ? data
      //   : data.joke ?? data.content ?? data.message ?? JSON.stringify(data, null, 2);
      // setJoke(result || "Jack's speechless. Try another prompt!");
      const data = await response.text();

      let result = data;

      try {
        const parsed = JSON.parse(data);

        if (typeof parsed === "string") {
          result = parsed;
        } else {
          result =
            parsed.joke ??
            parsed.content ??
            parsed.message ??
            JSON.stringify(parsed, null, 2);
        }
      } catch {
        // The response is plain text, not JSON.
        result = data;
      }

      setJoke(result || "Jack's speechless. Try another prompt!");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Couldn't reach the joke service. Make sure your backend is running on localhost:8080 and allows requests from this page (CORS)."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyJoke() {
    try {
      await navigator.clipboard.writeText(joke);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Copy isn't available in this browser context. You can select the joke and copy it manually.");
    }
  }

  return (
    <main className="page-shell">
      <div className="glow glow-one" aria-hidden="true" />
      <div className="glow glow-two" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="Jack the Joker home">
          <span className="brand-mark"><Laugh size={19} strokeWidth={2.3} /></span>
          <span>JACK <b>THE JOKER</b></span>
        </a>
        <span className="status"><span className="status-dot" /> YOUR DAILY DOSE OF FUN</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={14} /> A LITTLE LAUGH GOES A LONG WAY</div>
        <h1>Jack the <span>Joker.</span></h1>
        <p className="subtitle">Got a topic? Jack's got a joke.<br className="mobile-break" /> Let's make your day a little funnier.</p>

        <div className="joker-card">
          <div className="card-topline">
            <div className="avatar-wrap">
              <img src="/jack-the-joker-logo.png" alt="Jack the Joker laughing face" className="joker-logo" />
            </div>
            <div className="card-intro">
              <span className="mini-label">MEET YOUR COMEDY SIDEKICK</span>
              <h2>What's the joke?</h2>
              <p>Tell Jack what you're in the mood for.</p>
            </div>
            <WandSparkles className="card-sparkle" size={26} />
          </div>

          <form onSubmit={getJoke}>
            <label htmlFor="prompt">YOUR JOKE PROMPT</label>
            <div className="input-wrap">
              <input
                id="prompt"
                type="text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="e.g. A joke about cats"
                maxLength={300}
              />
              <span className="input-emoji" aria-hidden="true">✦</span>
            </div>
            <div className="suggestions">
              <span>TRY:</span>
              {["Dad jokes", "Funny animals", "School"].map((suggestion) => (
                <button type="button" className="chip" key={suggestion} onClick={() => setPrompt(suggestion)}>{suggestion}</button>
              ))}
            </div>
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? <><RotateCw className="spin" size={18} /> Cooking up a laugh...</> : <><Sparkles size={18} /> Tell me a joke <span className="button-arrow">→</span></>}
            </button>
          </form>

          {error && <div className="message error-message" role="alert"><span>!</span><p>{error}</p></div>}
          {joke && (
            <section className="joke-result" aria-live="polite">
              <div className="result-heading"><span className="result-icon"><Laugh size={18} /></span><div><span className="mini-label">FRESH FROM JACK</span><h3>Here's your joke!</h3></div><button className="copy-button" type="button" onClick={copyJoke} aria-label="Copy joke">{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
              <p className="joke-text">{joke}</p>
              <div className="result-footer"><span>MADE WITH MISCHIEF <span className="tiny-star">✦</span></span><button type="button" onClick={getJoke} className="another-button" disabled={loading}><RotateCw size={14} /> Another one</button></div>
            </section>
          )}
        </div>
        <section className="subscribe-card" aria-labelledby="subscribe-title">
          <div className="subscribe-icon"><Mail size={19} /></div>
          <div className="subscribe-copy">
            <span className="mini-label">A LITTLE FUN IN YOUR INBOX</span>
            <h2 id="subscribe-title">Get jokes by email</h2>
            <p>Subscribe with your email and let Jack brighten your day.</p>
          </div>
          <form className="subscribe-form" onSubmit={subscribe}>
            <label className="sr-only" htmlFor="subscriber-email">Email address</label>
            <input
              id="subscriber-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-describedby={subscriptionOutcome ? "subscription-outcome" : undefined}
              disabled={subscribing}
            />
            <button className="subscribe-button" type="submit" disabled={subscribing}>
              {subscribing ? <><RotateCw className="spin" size={16} /> Subscribing...</> : "Subscribe"}
            </button>
          </form>
          {subscriptionOutcome && (
            <p id="subscription-outcome" className={`subscription-outcome ${subscriptionOutcome.success ? "success" : "failure"}`} role={subscriptionOutcome.success ? "status" : "alert"}>
              {subscriptionOutcome.success && <Check size={15} />}{subscriptionOutcome.message}
            </p>
          )}
        </section>
        <div className="under-card"><span>NO BAD DAYS ALLOWED</span><span className="under-star">✳</span><span>JUST GOOD JOKES</span></div>
      </section>

      <footer><span>© {new Date().getFullYear()} JACK THE JOKER</span><span><Terminal size={13} /> POWERED BY YOUR IMAGINATION</span></footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
