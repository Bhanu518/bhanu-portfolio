"use client";

import Image from "next/image";
import { ArrowDown, ArrowDownRight, ArrowUpRight, Github, Globe, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Agent = { name: string; color: string; x: number; y: number; tx: number; ty: number; active: boolean; element: HTMLElement | null; start: number; duration: number };
const AGENTS = [
  ["Scout", "#fb7185"], ["Layout", "#f59e0b"], ["Typeset", "#a78bfa"], ["Motion", "#34d399"],
  ["QA", "#f472b6"], ["Deploy", "#60a5fa"], ["Copy", "#facc15"], ["Lint", "#2dd4bf"],
  ["Index", "#c084fc"], ["Render", "#fb923c"], ["Palette", "#4ade80"], ["Review", "#e879f9"],
  ["Pixel", "#38bdf8"], ["Grid", "#f97316"], ["Vector", "#a3e635"], ["Trace", "#e879f9"],
  ["Shader", "#fda4af"], ["Orbit", "#67e8f9"], ["Frame", "#facc15"], ["Signal", "#c4b5fd"],
  ["Spark", "#fb923c"], ["Patch", "#86efac"], ["Build", "#93c5fd"], ["Finish", "#f0abfc"],
] as const;

const skills = ["Java", "Python", "C++", "JavaScript", "React.js", "Node.js", "Express.js", "HTML5", "CSS3", "MySQL", "MongoDB", "PostgreSQL", "Git", "GitHub", "Docker", "AWS", "VS Code", "Postman", "JIRA", "Figma", "Data Structures", "Algorithms", "OOP", "DBMS", "Operating Systems"];

function BuildAgents({ enabled, paused, setPaused, setEnabled, onTour, tourActive }: {
  enabled: boolean; paused: boolean; setPaused: (v: boolean) => void; setEnabled: (v: boolean) => void; onTour: () => void; tourActive: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [tablet, setTablet] = useState(false);
  const [agentDisplay, setAgentDisplay] = useState<Agent[]>([]);
  const pausedRef = useRef(paused);
  const previousEnabledRef = useRef(enabled);
  const agentsRef = useRef<Agent[]>([]);
  const queueRef = useRef<HTMLElement[]>([]);
  const activeRef = useRef<Set<HTMLElement>>(new Set());
  const builtRef = useRef<WeakSet<HTMLElement>>(new WeakSet());
  const rafRef = useRef<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cursorRefs = useRef<(HTMLDivElement | null)[]>([]);

  const reveal = useCallback((el: HTMLElement) => {
    if (builtRef.current.has(el)) return;
    builtRef.current.add(el);
    el.classList.remove("build-pending");
    if (el.dataset.build === "type") el.classList.add("build-typed");
    if (el.dataset.build === "pop") el.classList.add("build-popped");
    if (el.dataset.build === "wipe") el.classList.add("build-wiped");
    el.querySelectorAll(".build-outline").forEach((n) => n.classList.add("done"));
    activeRef.current.delete(el);
    const outline = el.querySelector<HTMLElement>(".build-outline");
    if (outline) window.setTimeout(() => outline.remove(), 420);
  }, []);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    if (enabled && !previousEnabledRef.current) {
      builtRef.current = new WeakSet<HTMLElement>();
      document.querySelectorAll<HTMLElement>("[data-build]").forEach((el) => {
        el.classList.remove("build-typed", "build-popped", "build-wiped", "build-pending");
        el.querySelectorAll(".build-outline").forEach((outline) => outline.remove());
      });
    }
    previousEnabledRef.current = enabled;
  }, [enabled]);

  const finishInstantly = useCallback(() => {
    document.querySelectorAll<HTMLElement>("[data-build]").forEach((el) => {
      el.classList.remove("build-pending");
      builtRef.current.add(el);
    });
    document.documentElement.classList.remove("build-mode");
    document.documentElement.classList.add("build-ready");
    queueRef.current = [];
    activeRef.current.clear();
    agentsRef.current.forEach((a) => { a.active = false; a.element = null; });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const tabletMq = window.matchMedia("(min-width: 761px) and (max-width: 1100px)");
    const update = () => { setMobile(mq.matches); setTablet(tabletMq.matches); };
    update(); mq.addEventListener("change", update); tabletMq.addEventListener("change", update);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("agents");
    const shouldAnimate = forced === "on" || (forced !== "off" && !reducedMotion && localStorage.getItem("bhanu-agents") !== "off");
    if (forced === "on") document.documentElement.classList.add("force-agents");
    else document.documentElement.classList.remove("force-agents");
    if (!shouldAnimate) { setEnabled(false); finishInstantly(); }
    const boot = window.setTimeout(() => setReady(true), 750);
    return () => { mq.removeEventListener("change", update); tabletMq.removeEventListener("change", update); window.clearTimeout(boot); };
  }, [finishInstantly, setEnabled]);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("agents") === "off" || (!enabled && params.get("agents") !== "on")) { document.documentElement.classList.remove("force-agents"); finishInstantly(); return; }
    if (params.get("agents") === "on") document.documentElement.classList.add("force-agents");
    if (params.get("agents") === "on" && !enabled) setEnabled(true);
    const count = mobile ? 6 : tablet ? 12 : 24;
    activeRef.current.clear();
    queueRef.current = [];
    agentsRef.current = AGENTS.slice(0, count).map(([name, color], i) => ({ name, color, x: i % 2 === 0 ? -90 : window.innerWidth + 90, y: 55 + (i % 6) * Math.max(48, window.innerHeight / 8), tx: 30 + (i % 4) * 35, ty: 30 + (i % 3) * 30, active: false, element: null, start: 0, duration: 1100 }));
    setAgentDisplay([...agentsRef.current]);
    document.documentElement.classList.add("build-mode");
    document.documentElement.classList.remove("build-ready");
    // Give every meaningful visual block a build instruction, including the smaller
    // labels, links, list items and footer details, so the crew constructs the full page.
    document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main p, main li, main a, main article, main .panel, main .timeline-item, main .principle, main .footer, main .contact-panel, main .site-wrap > .eyebrow, main .stat").forEach((el) => {
      if (!el.dataset.build) el.dataset.build = el.matches("h1, h2, h3") ? "wipe" : el.matches("article, .panel, .timeline-item, .principle, .stat") ? "pop" : "type";
    });
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-build]"));
    elements.forEach((el) => {
      if (builtRef.current.has(el)) return;
      el.classList.add("build-pending");
    });
    document.documentElement.classList.add("build-ready");
    const enqueue = (el: HTMLElement) => {
      if (builtRef.current.has(el) || queueRef.current.includes(el) || activeRef.current.has(el)) return;
      if (el.getBoundingClientRect().bottom < 0) { reveal(el); return; }
      queueRef.current.push(el);
      queueRef.current.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    };
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) enqueue(entry.target as HTMLElement);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    elements.forEach((el) => observerRef.current?.observe(el));

    let last = 0;
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (pausedRef.current) return;
      if (now - last > 120) {
        last = now;
        const free = agentsRef.current.filter((a) => !a.active);
        while (free.length && activeRef.current.size < 6 && queueRef.current.length) {
          const agent = free.shift()!;
          const el = queueRef.current.shift()!;
          if (builtRef.current.has(el)) continue;
          const rect = el.getBoundingClientRect();
          if (rect.bottom < 0) { reveal(el); continue; }
          agent.active = true; agent.element = el; agent.start = now; agent.duration = 650 + Math.min(650, rect.width * .45);
          agent.tx = Math.max(16, Math.min(window.innerWidth - 60, rect.left + Math.min(rect.width * .25, 80)));
          agent.ty = Math.max(18, Math.min(window.innerHeight - 70, rect.top + Math.min(rect.height * .2, 28)));
          activeRef.current.add(el);
          let outline = el.querySelector<HTMLElement>(":scope > .build-outline");
          if (!outline) { outline = document.createElement("div"); outline.className = "build-outline"; outline.dataset.label = agent.name; el.prepend(outline); }
          outline.dataset.label = agent.name;
          outline.classList.add("active");
        }
      }
      agentsRef.current.forEach((agent, i) => {
        const node = cursorRefs.current[i];
        if (!node) return;
        if (!agent.active) { node.classList.remove("visible"); return; }
        const elapsed = Math.min(1, (now - agent.start) / agent.duration);
        agent.x += (agent.tx - agent.x) * .22;
        agent.y += (agent.ty - agent.y) * .22;
        node.style.transform = `translate3d(${agent.x}px,${agent.y}px,0)`;
        node.classList.add("visible");
        if (elapsed >= 1) {
          const el = agent.element;
          if (el) reveal(el);
          agent.active = false; agent.element = null;
        }
      });
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); observerRef.current?.disconnect(); };
  }, [enabled, mobile, tablet, ready, reveal, finishInstantly, setEnabled]);

  useEffect(() => {
    if (!enabled) finishInstantly();
  }, [enabled, finishInstantly]);

  return <>
    {agentDisplay.map((agent, i) => <div key={agent.name} ref={(el) => { cursorRefs.current[i] = el; }} className="build-cursor" style={{ "--agent-color": agent.color } as React.CSSProperties}>
      <div className="cursor-trail" /><div className="cursor-tag"><span className="robot"><i /><i /></span>{agent.name}</div><div className="cursor-arrow" /><span className="cursor-coordinate">DRAW / {String(i + 1).padStart(2, "0")}</span>
    </div>)}
    <div className={`boot ${ready ? "done" : ""}`} aria-hidden="true"><div className="boot-inner"><div className="eyebrow">Initializing portfolio / 001</div><div className="boot-brand">BHANU<span className="red">.</span></div><div className="boot-line" /><div className="font-mono muted" style={{ fontSize: 9, marginTop: 10 }}>LOADING INTERFACE AGENTS</div></div></div>
    <nav className="agent-dock" aria-label="Animation controls">
      <button className="dock-btn" onClick={() => setPaused(!paused)} aria-pressed={paused} title="Pause or resume (P)">{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? "Resume" : "Pause"}</button>
      <button className="dock-btn" onClick={() => setEnabled(!enabled)} aria-pressed={enabled} title="Toggle agents (A)">{enabled ? <Volume2 size={13} /> : <VolumeX size={13} />}{enabled ? "Agents on" : "Agents off"}</button>
      <button className="dock-btn" onClick={onTour} aria-pressed={tourActive} title="Start guided tour (T)"><RotateCcw size={13} />Tour</button>
    </nav>
  </>;
}

export default function Portfolio() {
  const [agentsEnabled, setAgentsEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const tourFrame = useRef<number>(0);
  const tourStart = useRef(0);
  const tourFrom = useRef(0);
  const tourTo = useRef(0);
  const tourDuration = useRef(0);
  const userInterrupted = useRef(false);

  const setAgents = useCallback((value: boolean) => {
    setAgentsEnabled(value);
    try { localStorage.setItem("bhanu-agents", value ? "on" : "off"); } catch { /* storage can be unavailable */ }
  }, []);

  const clearTourQuery = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("tour");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const stopTour = useCallback(() => {
    cancelAnimationFrame(tourFrame.current);
    setTourActive(false);
    clearTourQuery();
  }, [clearTourQuery]);

  const startTour = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("agents", "on");
    params.set("tour", "1");
    window.location.search = params.toString();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("agents") === "off") setAgents(false);
    if (params.get("agents") === "on") setAgents(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "Escape" || ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) { userInterrupted.current = true; stopTour(); }
      if (event.key.toLowerCase() === "p") setPaused((v) => !v);
      if (event.key.toLowerCase() === "a") setAgents(!agentsEnabled);
      if (event.key.toLowerCase() === "t") startTour();
    };
    const onScroll = () => { if (new URLSearchParams(window.location.search).get("tour") === "1" && !userInterrupted.current) { userInterrupted.current = true; stopTour(); } };
    const onPointer = (event: PointerEvent) => {
      if (tourActive && event.isPrimary && !((event.target as HTMLElement | null)?.closest?.(".agent-dock"))) {
        userInterrupted.current = true; stopTour();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchstart", onScroll, { passive: true });
    window.addEventListener("pointerdown", onPointer);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("wheel", onScroll); window.removeEventListener("touchstart", onScroll); window.removeEventListener("pointerdown", onPointer); };
  }, [agentsEnabled, setAgents, startTour, stopTour, tourActive]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") !== "1") return;
    let tourDelay: number | undefined;
    const waitForHero = window.setInterval(() => {
      if (userInterrupted.current) { window.clearInterval(waitForHero); return; }
      const boot = document.querySelector(".boot");
      if (boot && !boot.classList.contains("done")) return;
      const heroPending = document.querySelector(".hero [data-build].build-pending");
      if (heroPending) return;
      window.clearInterval(waitForHero);
      tourDelay = window.setTimeout(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        tourFrom.current = window.scrollY; tourTo.current = max; tourStart.current = performance.now();
        tourDuration.current = Math.max(12000, max * 11);
        userInterrupted.current = false; setTourActive(true);
        const step = (now: number) => {
          if (userInterrupted.current) return;
          const raw = Math.min(1, (now - tourStart.current) / tourDuration.current);
          const progress = raw < .12 ? .06 * (raw / .12) ** 2 : raw > .88 ? .94 + .06 * (1 - ((1 - raw) / .12) ** 2) : .06 + ((raw - .12) / .76) * .88;
          window.scrollTo(0, tourFrom.current + (tourTo.current - tourFrom.current) * progress);
          if (raw >= 1) { setTourActive(false); clearTourQuery(); } else tourFrame.current = requestAnimationFrame(step);
        };
        tourFrame.current = requestAnimationFrame(step);
      }, 500);
    }, 300);
    const maxWait = window.setTimeout(() => window.clearInterval(waitForHero), 20000);
    return () => { window.clearInterval(waitForHero); window.clearTimeout(maxWait); if (tourDelay) window.clearTimeout(tourDelay); };
  }, []);

  const repeatedSkills = useMemo(() => [...skills, ...skills], []);
  const stats = [{ value: "04", label: "Projects built" }, { value: "04", label: "Programming languages" }, { value: "03", label: "Spoken languages" }];

  return <>
    <BuildAgents enabled={agentsEnabled} paused={paused} setPaused={setPaused} setEnabled={setAgents} onTour={startTour} tourActive={tourActive} />
    <main>
      <section className="hero" id="top">
        <div className="hero-word" data-build="wipe">PORTFOLIO</div>
        <div className="hero-glow" />
        <div className="portrait-stage" data-build="pop">
          <div className="portrait-orbit orbit-one" /><div className="portrait-orbit orbit-two" />
          <div className="portrait-crosshair crosshair-left" /><div className="portrait-crosshair crosshair-right" />
          <div className="portrait-scan" />
          <Image src="/headshot.png" alt="Portrait of Bhanu Prasad Junnu" width={1448} height={2048} priority className="hero-person" />
          <div className="portrait-particle particle-one" /><div className="portrait-particle particle-two" /><div className="portrait-particle particle-three" />
          <div className="portrait-caption"><span>SUBJECT / 001</span><span>BHANU PRASAD JUNNU</span></div>
        </div>
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="font-hand text-3xl text-zinc-100" data-build="type">Hello, I’m</div>
            <h1 data-build="wipe">Bhanu<br />Prasad<span className="red">.</span></h1>
            <div className="hero-role" data-build="type">Computer Science · Aspiring SDE</div>
            <p className="hero-bio" data-build="type">B.Tech Computer Science student focused on full-stack development, with a strong foundation in Java and Python.</p>
            <div data-build="pop"><a className="btn" href="#work">View work <ArrowUpRight size={14} /></a></div>
          </div>
          <div className="hero-stats">
            {stats.map((stat) => <div className="stat" data-build="pop" key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
          </div>
        </div>
        <div className="hero-bottom"><span>Based in Warangal, Telangana</span><span>Scroll to explore <ArrowDown size={12} style={{ display: "inline", verticalAlign: "middle" }} /></span></div>
      </section>

      <section className="section" id="work"><div className="site-wrap">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
          <div><div className="eyebrow mb-5" data-build="type">01 / Selected work</div><h2 className="section-title" data-build="wipe">Work that<br /><span className="red">ships.</span></h2><p className="muted max-w-md mt-6 text-sm leading-7" data-build="type">A selection of work and learning across computer science and full-stack development.</p></div>
          <div className="grid grid-cols-3 gap-5 md:gap-8" data-build="pop">{stats.map((s) => <div key={s.label}><div className="font-display text-3xl md:text-4xl">{s.value}</div><div className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider mt-2 max-w-20">{s.label}</div></div>)}</div>
        </div>
        <article className="project-card max-w-3xl" data-build="pop">
          <div className="flex justify-between items-start gap-4"><span className="eyebrow">Featured project / 01</span><span className="font-mono text-[10px] text-zinc-600">01 — 04</span></div>
          <h3 className="font-display text-3xl md:text-5xl uppercase mt-7">Real-time collaborative<br /><span className="red">code editor</span></h3>
          <p className="muted text-sm leading-7 mt-5 max-w-xl">A collaborative code editor built as part of four projects highlighted in the resume, deployed on AWS.</p>
          <ul className="mt-6 list-disc pl-5"><li>Built a real-time collaborative code editor.</li><li>One of four projects mentioned in the resume.</li><li>Deployed on Amazon Web Services (AWS).</li></ul>
          <div className="flex flex-wrap gap-2 mt-7"><span className="font-mono text-[9px] uppercase border border-zinc-700 px-3 py-2 text-zinc-300">Real-time collaboration</span><span className="font-mono text-[9px] uppercase border border-zinc-700 px-3 py-2 text-zinc-300">AWS deployment</span></div>
          <div className="flex flex-wrap gap-5 mt-8 pt-5 border-t border-zinc-800"><a className="text-xs font-mono text-zinc-300 hover:text-red-400 inline-flex items-center gap-2" href="https://github.com/bhanu/projects" target="_blank" rel="noreferrer">GitHub projects <Github size={14} /></a><a className="text-xs font-mono text-zinc-300 hover:text-red-400 inline-flex items-center gap-2" href="https://www.bhanu.com" target="_blank" rel="noreferrer">Website <ArrowUpRight size={14} /></a></div>
        </article>
        <p className="font-mono text-[10px] text-zinc-600 mt-5" data-build="type">The resume mentions four projects; only this project is individually described there.</p>
      </div></section>

      <section className="section" id="stack"><div className="site-wrap"><div className="eyebrow mb-5" data-build="type">02 / Tools of the trade</div><div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"><h2 className="section-title" data-build="wipe">My stack<span className="red">.</span></h2><p className="muted text-sm leading-7 max-w-sm" data-build="type">Technologies, tools, and core computer science concepts listed in my resume.</p></div></div>
        <div className="marquee-shell" data-build="wipe"><div className="marquee-track">{repeatedSkills.map((skill, i) => <span className="skill-chip" key={`${skill}-${i}`}>{skill}</span>)}</div></div>
        <div className="site-wrap grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">{[{ title: "Programming", items: "Java · Python · C++ · JavaScript" }, { title: "Web development", items: "React.js · Node.js · Express.js · HTML5 · CSS3" }, { title: "Databases", items: "MySQL · MongoDB · PostgreSQL" }, { title: "DevOps & cloud", items: "Git · GitHub · Docker · AWS" }, { title: "Tools", items: "VS Code · Postman · JIRA · Figma" }, { title: "Core CS", items: "Data Structures · Algorithms · OOP · DBMS · Operating Systems" }].map((group) => <div className="panel p-5" data-build="pop" key={group.title}><div className="eyebrow mb-3">{group.title}</div><p className="text-sm text-zinc-300 leading-7">{group.items}</p></div>)}</div>
      </section>

      <section className="section" id="record"><div className="site-wrap"><div className="eyebrow mb-5" data-build="type">03 / The record</div><h2 className="section-title mb-14" data-build="wipe">Learning in<br /><span className="red">progress.</span></h2>
        <div className="timeline max-w-3xl"><div className="timeline-item" data-build="pop"><div className="font-mono text-[10px] red uppercase tracking-widest">Education</div><h3 className="font-display text-3xl uppercase mt-2">B.Tech — Computer Science</h3><p className="text-sm text-zinc-300 mt-2">BITS Narsampet</p><p className="muted text-xs mt-2">Pursuing B.Tech in Computer Science and Engineering, as stated in the resume.</p></div>
          <div className="timeline-item" data-build="pop"><div className="font-mono text-[10px] red uppercase tracking-widest">Project milestone</div><h3 className="font-display text-3xl uppercase mt-2">Collaborative code editor</h3><p className="text-sm text-zinc-300 mt-2">Real-time collaboration · AWS deployment</p><p className="muted text-xs mt-2">One of four projects mentioned in the resume.</p></div>
          <div className="timeline-item" data-build="pop"><div className="font-mono text-[10px] red uppercase tracking-widest">Career direction</div><h3 className="font-display text-3xl uppercase mt-2">Software Development Engineer</h3><p className="muted text-xs mt-2">Target role stated in the resume.</p></div></div>
      </div></section>

      <section className="section" id="about"><div className="site-wrap"><div className="eyebrow mb-5" data-build="type">04 / A little about me</div><div className="grid lg:grid-cols-2 gap-14"><div><h2 className="section-title" data-build="wipe">The<br /><span className="red">focus.</span></h2><div className="mt-8 space-y-5 text-sm text-zinc-300 leading-8" data-build="type"><p>I’m Bhanu Prasad Junnu, a Computer Science student at BITS Narsampet. My foundation spans programming, full-stack web development, databases, and core computer science.</p><p>My resume highlights four projects, including a real-time collaborative code editor deployed on AWS. My stated career target is a Software Development Engineer role.</p></div></div>
          <div><div className="eyebrow mb-5" data-build="type">Technical strengths</div><div className="grid grid-cols-2 gap-2">{["Algorithms", "Full-stack development", "Programming", "Database systems", "Cloud & DevOps", "Core CS foundations"].map((s) => <div className="panel p-4 text-xs text-zinc-300" data-build="pop" key={s}>{s}</div>)}</div><div className="eyebrow mt-10 mb-5" data-build="type">Focus areas</div><div>{[{ n: "01", t: "Programming foundations" }, { n: "02", t: "Full-stack web development" }, { n: "03", t: "Core computer science" }, { n: "04", t: "Cloud deployment with AWS" }].map((p) => <div className="principle" data-build="pop" key={p.n}><span className="font-mono text-[10px] red">{p.n}</span><span className="text-sm text-zinc-200 flex-1">{p.t}</span><ArrowUpRight size={14} className="text-zinc-600" /></div>)}</div></div></div>
        <div className="mt-14 pt-7 border-t border-zinc-800 flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500" data-build="type"><span>Languages: English</span><span>Hindi</span><span>Telugu</span></div>
      </div></section>

      <section className="section" id="contact"><div className="site-wrap"><div className="eyebrow mb-5" data-build="type">05 / Get in touch</div><div className="contact-panel" data-build="pop"><div className="relative z-10 max-w-3xl"><div className="font-hand text-3xl text-zinc-200" data-build="type">Have something in mind?</div><h2 className="section-title mt-3" data-build="wipe">Let’s build<br /><span className="red">what’s next.</span></h2><p className="text-sm text-zinc-400 leading-7 max-w-lg mt-7" data-build="type">I’m targeting Software Development Engineer opportunities and continuing to build with computer science and full-stack technologies.</p><div className="flex flex-wrap gap-3 mt-9"><a className="btn" href="https://github.com/bhanu/projects" target="_blank" rel="noreferrer">Explore GitHub <Github size={14} /></a><a className="btn" href="https://www.bhanu.com" target="_blank" rel="noreferrer">Visit website <Globe size={14} /></a></div></div><div className="absolute right-8 bottom-4 font-display text-[9rem] md:text-[15rem] text-white/[.025] select-none">B.</div></div>
        <footer className="footer flex flex-col sm:flex-row justify-between gap-4"><span>© Bhanu Prasad Junnu</span><a href="#top" className="inline-flex items-center gap-2 hover:text-white">Back to top <ArrowDownRight size={12} /></a><span>Warangal, Telangana · India</span></footer>
      </div></section>
    </main>
  </>;
}
