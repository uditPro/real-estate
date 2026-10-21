import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Menu,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import PropertyCollection from "./components/PropertyCollection";
import { heroSlides, properties, type Category, type Property } from "./data/properties";

const VillaExperience = lazy(() => import("./components/VillaExperience"));

type InquiryStatus = "idle" | "error" | "ready";

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.1, rootMargin: "0px 0px -8%" });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <a className={`brand${inverse ? " brand--inverse" : ""}`} href="#top" aria-label="AUREL home">
      <span className="brand__mark" aria-hidden="true">A</span>
      <span className="brand__word">AUREL</span>
      <span className="brand__descriptor">ESTATES</span>
    </a>
  );
}

function Header({ savedCount, onSavedClick }: { savedCount: number; onSavedClick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <header className={`site-header${menuOpen ? " site-header--menu-open" : ""}`}>
      <div className="site-header__inner">
        <Brand />
        <nav className="site-header__nav" aria-label="Primary navigation">
          <button type="button" onClick={() => navigate("collection")}>The collection</button>
          <button type="button" onClick={() => navigate("approach")}>Our approach</button>
          <button type="button" onClick={() => navigate("studio")}>The studio</button>
        </nav>
        <div className="site-header__actions">
          <button className="saved-link" type="button" onClick={onSavedClick} aria-label={`View ${savedCount} saved homes`}>
            <Bookmark size={15} strokeWidth={1.6} fill={savedCount > 0 ? "currentColor" : "none"} />
            <span>Saved</span>
            {savedCount > 0 ? <b>{String(savedCount).padStart(2, "0")}</b> : null}
          </button>
          <button className="header-inquire" type="button" onClick={() => scrollToSection("contact")}>
            Begin a conversation <ArrowUpRight size={15} strokeWidth={1.5} />
          </button>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((current) => !current)}>
            {menuOpen ? <X size={19} strokeWidth={1.5} /> : <Menu size={19} strokeWidth={1.5} />}
          </button>
        </div>
      </div>
      <div className="site-header__mobile-menu" aria-hidden={!menuOpen}>
        <button type="button" onClick={() => navigate("collection")}>The collection <ArrowUpRight size={17} /></button>
        <button type="button" onClick={() => navigate("approach")}>Our approach <ArrowUpRight size={17} /></button>
        <button type="button" onClick={() => navigate("studio")}>The studio <ArrowUpRight size={17} /></button>
        <button type="button" onClick={() => { setMenuOpen(false); onSavedClick(); }}>Saved homes <ArrowUpRight size={17} /></button>
      </div>
    </header>
  );
}

function Hero({ onExplore }: { onExplore: () => void }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const active = heroSlides[activeSlide];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), 5600);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <section className="hero" id="top" aria-label="AUREL introduction">
      <div className="hero__backdrop" aria-hidden="true">
        {heroSlides.map((slide, index) => (
          <div
            className={`hero__backdrop-image${index === activeSlide ? " is-active" : ""}`}
            key={slide.propertyId}
            style={{ backgroundImage: `url(${slide.image.src})` }}
          />
        ))}
        <div className="hero__backdrop-tint" />
      </div>
      <div className="hero__grid page-shell">
        <div className="hero__copy">
          <p className="eyebrow eyebrow--light"><span className="eyebrow__line" /> Independent real-estate portfolio / 2026</p>
          <h1>A place for<br /><em>the extraordinary.</em></h1>
          <p className="hero__intro">A considered collection of homes with a point of view. Architecture, landscape, and the feeling of a life well lived.</p>
          <div className="hero__actions">
            <button className="button button--light" type="button" onClick={onExplore}>Explore the collection <ArrowDown size={16} strokeWidth={1.5} /></button>
            <button className="hero__text-link" type="button" onClick={() => scrollToSection("approach")}>Why AUREL <ArrowRight size={16} strokeWidth={1.5} /></button>
          </div>
          <div className="hero__proof"><span><Check size={14} /> Curated, never crowded</span><span><Check size={14} /> Designed to be remembered</span></div>
        </div>
        <div className="hero__feature">
          <div className="hero__feature-top"><span>Featured residence</span><span>0{activeSlide + 1} / 0{heroSlides.length}</span></div>
          <div className="hero__feature-copy">
            <p>{active.location}</p>
            <h2>{active.title}</h2>
            <button type="button" onClick={() => scrollToSection("collection")}>View the collection <ArrowUpRight size={16} strokeWidth={1.5} /></button>
          </div>
          <div className="hero__slide-controls" role="tablist" aria-label="Featured residences">
            {heroSlides.map((slide, index) => (
              <button
                className={index === activeSlide ? "is-active" : ""}
                key={slide.propertyId}
                type="button"
                role="tab"
                aria-selected={index === activeSlide}
                aria-label={`Show ${slide.title}`}
                onClick={() => setActiveSlide(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="hero__bottom page-shell">
        <span>SCROLL TO DISCOVER</span>
        <span className="hero__bottom-line" />
        <span>Pacific / Desert / City</span>
      </div>
    </section>
  );
}

function InquiryDialog({ property, onClose }: { property: Property | undefined; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<InquiryStatus>("idle");
  const [statusText, setStatusText] = useState("");
  const contactEmail = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim();

  useEffect(() => {
    if (!property) return undefined;
    setMessage(`I would love to learn more about ${property.title}.`);
    setStatus("idle");
    setStatusText("");
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    try {
      if (!dialog.open) dialog.showModal();
    } catch {
      // The form remains visible in browsers without dialog support.
    }
    return undefined;
  }, [property]);

  useEffect(() => {
    if (!property) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [property]);

  if (!property) return null;

  const inquiryText = `AUREL inquiry\n\nName: ${name.trim()}\nEmail: ${email.trim()}\nHome: ${property.title}\nLocation: ${property.location}\n\n${message.trim()}`;

  const close = () => {
    if (dialogRef.current?.open) dialogRef.current.close();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !message.trim()) {
      setStatus("error");
      setStatusText("Add your name, a valid email, and a short note to continue.");
      return;
    }

    if (contactEmail) {
      const subject = encodeURIComponent(`AUREL inquiry — ${property.title}`);
      const body = encodeURIComponent(inquiryText);
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
      setStatus("ready");
      setStatusText("Your email app is opening with the inquiry prepared.");
      return;
    }

    try {
      await navigator.clipboard?.writeText(inquiryText);
    } catch {
      // Clipboard permissions are optional; the file download below is the fallback.
    }
    const blob = new Blob([inquiryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aurel-inquiry-${property.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("ready");
    setStatusText("Your inquiry was prepared as a text file. Add VITE_CONTACT_EMAIL before deployment to enable direct email.");
  };

  return (
    <dialog className="inquiry-dialog" ref={dialogRef} aria-labelledby="inquiry-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="inquiry-dialog__inner">
        <div className="inquiry-dialog__topline"><span className="eyebrow">AUREL / PRIVATE INQUIRY</span><button type="button" onClick={close} aria-label="Close inquiry"><X size={19} strokeWidth={1.5} /></button></div>
        <div className="inquiry-dialog__heading"><p>{property.location}</p><h2 id="inquiry-title">Start with a<br /><em>feeling.</em></h2><span className="inquiry-dialog__property">{property.title}</span></div>
        <form className="inquiry-form" onSubmit={handleSubmit}>
          <div className="inquiry-form__row"><label>Name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" /></label><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" type="email" placeholder="you@example.com" /></label></div>
          <label>Tell us a little more<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="What would you like to know?" /></label>
          {statusText ? <p className={`inquiry-form__status inquiry-form__status--${status}`} role={status === "error" ? "alert" : "status"}>{status === "ready" ? <Check size={15} /> : null}{statusText}</p> : null}
          <div className="inquiry-form__actions"><button className="button button--dark" type="submit">{contactEmail ? "Prepare email" : "Prepare inquiry"} <ArrowUpRight size={16} strokeWidth={1.5} /></button><span>We reply thoughtfully, never automatically.</span></div>
        </form>
      </div>
    </dialog>
  );
}

function App() {
  const [category, setCategory] = useState<Category | "All">("All");
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [inquiryProperty, setInquiryProperty] = useState<Property>();

  const savedLabel = useMemo(() => savedCount === 1 ? "1 saved home" : `${savedCount} saved homes`, [savedCount]);

  const openInquiry = (property?: Property) => {
    setInquiryProperty(property ?? properties[0]);
  };

  const showSavedHomes = () => {
    setSavedOnly(true);
    scrollToSection("collection");
  };

  return (
    <div className="aurel-app">
      <Header savedCount={savedCount} onSavedClick={showSavedHomes} />
      <main>
        <Hero onExplore={() => scrollToSection("collection")} />

        <section className="statement section-light" id="approach">
          <div className="page-shell statement__grid">
            <Reveal className="statement__eyebrow"><p className="eyebrow"><span className="eyebrow__line" /> The AUREL point of view</p></Reveal>
            <Reveal className="statement__copy" delay={100}><h2>We believe a home is felt <em>before</em> it is found.</h2><p>There is a certain quality to the right place. A pause at the threshold. The way the light falls across a room. A view that makes the day feel slightly more open. We look for that feeling—and give it room to speak.</p><button className="text-link text-link--dark" type="button" onClick={() => scrollToSection("studio")}>Our way of seeing <ArrowRight size={16} strokeWidth={1.5} /></button></Reveal>
            <Reveal className="statement__aside" delay={190}><span className="statement__number">01</span><p>For people who care about the way their life feels, not only the way it looks.</p></Reveal>
          </div>
        </section>

        <section className="principles section-light" id="studio">
          <div className="page-shell">
            <Reveal className="section-heading section-heading--split"><div><p className="eyebrow"><span className="eyebrow__line" /> Our approach</p><h2>Less noise.<br /><em>More meaning.</em></h2></div><p>Real estate is full of more. More listings, more alerts, more reasons to keep searching. AUREL is an edit: a small, thoughtful collection of homes chosen for their character.</p></Reveal>
            <div className="principles__grid">
              {[{ number: "01", title: "The edit", copy: "We choose fewer homes, and spend more time with each one. Every residence in the collection has a point of view." }, { number: "02", title: "The feeling", copy: "We pay attention to the details that do not show up in a specification sheet: light, proportion, texture, quiet." }, { number: "03", title: "The relationship", copy: "A considered move deserves a considered conversation. No pressure, no performance—just a thoughtful beginning." }].map((principle, index) => <Reveal className="principle" delay={index * 100} key={principle.number}><span className="principle__number">{principle.number}</span><span className="principle__plus"><Plus size={17} strokeWidth={1.4} /></span><h3>{principle.title}</h3><p>{principle.copy}</p></Reveal>)}
            </div>
          </div>
        </section>

        <section className="villa-section section-dark">
          <div className="page-shell">
            <Reveal className="section-heading section-heading--dark section-heading--split"><div><p className="eyebrow eyebrow--light"><span className="eyebrow__line" /> The architectural study</p><h2>Some homes are<br /><em>drawn in light.</em></h2></div><p>Move through a quiet villa study. Drag the model. Change the hour. Notice how a place can hold a different mood without changing its shape.</p></Reveal>
            <Reveal className="villa-frame" delay={120}><Suspense fallback={<div className="villa-loading"><span /><p>Preparing the architectural study</p></div>}><VillaExperience /></Suspense></Reveal>
          </div>
        </section>

        <section className="collection-section section-light" id="collection">
          <div className="page-shell">
            <Reveal className="section-heading section-heading--split"><div><p className="eyebrow"><span className="eyebrow__line" /> The collection</p><h2>A home is a<br /><em>feeling.</em></h2></div><p>Four residences. Four different ways of living. Take your time with the edit, save what stays with you, and begin the conversation when it feels right.</p></Reveal>
            <Reveal className="collection-meta" delay={100}><span>{savedOnly ? savedLabel : "A considered collection of four homes"}</span><button className={`collection-meta__saved${savedOnly ? " is-active" : ""}`} type="button" onClick={() => setSavedOnly((current) => !current)}><Bookmark size={14} strokeWidth={1.6} fill={savedOnly ? "currentColor" : "none"} /> {savedOnly ? "Viewing saved homes" : "View saved homes"}{savedCount > 0 ? <b>{savedCount}</b> : null}</button></Reveal>
            <Reveal delay={160}><PropertyCollection category={category} onCategoryChange={(next) => { setCategory(next); setSavedOnly(false); }} savedOnly={savedOnly} onShowAll={() => setSavedOnly(false)} onInquire={openInquiry} onSavedChange={setSavedCount} /></Reveal>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-section__grain" aria-hidden="true" />
          <div className="page-shell contact-section__inner">
            <Reveal><p className="eyebrow eyebrow--light"><span className="eyebrow__line" /> A considered beginning</p><h2>Let’s find the<br /><em>right place.</em></h2><p className="contact-section__copy">Tell us what you are looking for, what you are moving toward, or simply what caught your eye. We will take it from there.</p><button className="button button--light" type="button" onClick={() => openInquiry()}>Begin a private conversation <ArrowUpRight size={16} strokeWidth={1.5} /></button></Reveal>
            <Reveal className="contact-section__mark" delay={160}><Sparkles size={24} strokeWidth={1.1} /><span>AUREL / 2026</span></Reveal>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="page-shell site-footer__top"><Brand inverse /><p>A considered collection of extraordinary homes.</p><div className="site-footer__links"><button type="button" onClick={() => scrollToSection("collection")}>The collection</button><button type="button" onClick={() => scrollToSection("approach")}>Our approach</button><button type="button" onClick={() => scrollToSection("contact")}>Contact</button></div></div>
        <div className="page-shell site-footer__bottom"><span>Independent real-estate portfolio concept.</span><span>© {new Date().getFullYear()} AUREL ESTATES</span><span>Made with intention.</span></div>
      </footer>
      <InquiryDialog property={inquiryProperty} onClose={() => setInquiryProperty(undefined)} />
    </div>
  );
}

export default App;
