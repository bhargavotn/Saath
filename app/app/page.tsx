"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AmbientProvider, useAmbient } from "@/components/AmbientSound";
import NeedAMoment from "@/components/NeedAMoment";
import ArriveHome from "@/components/ArriveHome";
import GettingToKnowYou from "@/components/GettingToKnowYou";
import ActivitiesWorkspace from "@/components/ActivitiesWorkspace";
import ConversationRoom from "@/components/ConversationRoom";
import ProviderOnboarding from "@/components/ProviderOnboarding";
import Enrollment from "@/components/Enrollment";
import TwoChairsRoom from "@/components/TwoChairsRoom";
import {
  api,
  fetchLiveCounselors,
  fetchTraumaGroups,
  type DjangoTraumaGroup,
  fetchRequests,
  createSessionRequest,
  updateSessionRequestAction,
  fetchUserContext,
  saveUserContext,
  clearUserContext,
  fetchMoodRecords,
  saveMoodRecord,
  fetchProfileRecord,
  saveProfileRecord,
  submitTriageMessage,
  evaluateAssessment,
  fetchAssessmentHistory,
  fetchTraumaFeed,
  reactTraumaStory,
  postTraumaStory,
  joinPodChannel,
  type ClinicalAssessmentResult,
  type AssessmentHistoryItem,
  type DjangoTraumaStory,
} from "@/lib/client/api";
import {
  addCircleInterest,
  addMood,
  loadFixtures,
  saveInterests,
  saveReflections,
  toggleBlock,
} from "@/lib/client/store";
import { circleFixtures, samplePeople, staticWritingPrompts, topics } from "@/lib/fixtures";
import {
  composeIntroduction,
  FIXTURE_NOTICE,
  SAMPLE_PROFILE_NOTICE,
  labelMood,
  type ActivityRecord,
  type ConversationRecord,
  type EncryptionStatus,
  type EnrollmentProfile,
  type EnrollmentRole,
  type InterestId,
  type IntroAnswers,
  type MoodEntry,
  type MoodKind,
  type Person,
  type ProviderDraft,
  type SessionRequest,
  type View,
} from "@/lib/domain";
import {
  ArrowRight,
  ArrowUpRight,
  Armchair,
  BookOpen,
  Check,
  ChevronLeft,
  CircleHelp,
  Globe,
  Heart,
  Leaf,
  Menu,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  LogIn,
  LogOut,
  X,
} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const paths = [
  { view: "connect" as View, n: "01", icon: MessageCircle, title: "Someone to listen.", desc: "A peer listener or professional counsellor. You choose the pace and what to share.", label: "Meet someone" },
  { view: "rehearsal" as View, n: "02", icon: Armchair, title: "A room to practise.", desc: "Practise what’s hard to say with a clearly fictional counterpart.", label: "Enter rehearsal room" },
  { view: "circles" as View, n: "03", icon: Users, title: "A circle to belong.", desc: "Small shared-experience support. Speak, listen, or pass.", label: "Explore circles" },
];

function App() {
  const ambient = useAmbient();
  const [view, setView] = useState<View>("home");
  const [mobile, setMobile] = useState(false);
  const [auth, setAuth] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profile, setProfile] = useState<EnrollmentProfile | null>(null);
  const [incoming, setIncoming] = useState<SessionRequest[]>([]);
  const [encryption, setEncryption] = useState<EncryptionStatus | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [ai, setAi] = useState(false);
  const [voiceConfigured, setVoiceConfigured] = useState(false);
  const [topic, setTopic] = useState("Just need to talk");
  const [language, setLanguage] = useState("All languages");
  const [role, setRole] = useState("Everyone");
  const [budget, setBudget] = useState("Any budget");
  const [modeFilter, setModeFilter] = useState("Any mode");
  const [availabilityFilter, setAvailabilityFilter] = useState("Any availability");
  const [support, setSupport] = useState("Listen only");
  const [context, setContext] = useState("");
  const [shareMode, setShareMode] = useState<"private" | "ask-first">("private");
  const [notice, setNotice] = useState("");
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [consent, setConsent] = useState(false);
  const [mode, setMode] = useState("Chat");
  const [busy, setBusy] = useState(false);
  const [scenario, setScenario] = useState("Setting a boundary");
  const [goal, setGoal] = useState("Say the first sentence clearly");
  const [style, setStyle] = useState("Receptive");
  const [aiConsent, setAiConsent] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [circle, setCircle] = useState<string | null>(null);
  const [circleInterest, setCircleInterest] = useState<string[]>([]);
  const [circleMembership, setCircleMembership] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<"approach" | "join" | "privacy" | "phrase" | null>(null);
  const [phrase, setPhrase] = useState("");
  const [phrasePerson, setPhrasePerson] = useState<Person | null>(null);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [intro, setIntro] = useState<IntroAnswers | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [interests, setInterests] = useState<InterestId[]>([]);
  const [reflections, setReflections] = useState("");
  const [providerDraft, setProviderDraft] = useState<ProviderDraft | null>(null);
  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [submitLock, setSubmitLock] = useState(false);
  const [livePeople, setLivePeople] = useState<Person[]>([]);
  const [liveGroups, setLiveGroups] = useState<DjangoTraumaGroup[]>([]);
  const [stories, setStories] = useState<DjangoTraumaStory[]>([]);
  const [newStoryContent, setNewStoryContent] = useState("");
  const [newStoryCategory, setNewStoryCategory] = useState("RELATIONSHIP");
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({
    q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1, q9: 1
  });
  const [assessmentResult, setAssessmentResult] = useState<ClinicalAssessmentResult | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchLiveCounselors().then(counselors => {
      if (counselors.length > 0) setLivePeople(counselors);
    });
    fetchTraumaGroups().then(groups => {
      if (groups.length > 0) setLiveGroups(groups);
    });
    fetchRequests().then(reqs => {
      if (reqs.length > 0) setRequests(reqs as unknown as SessionRequest[]);
    });
    fetchUserContext().then(ctx => {
      if (ctx.content) setContext(ctx.content);
      if (ctx.reflections) setReflections(ctx.reflections);
      if (ctx.shareMode) setShareMode(ctx.shareMode as "private" | "ask-first");
    });
    fetchMoodRecords().then(mList => {
      if (mList.length > 0) setMoods(mList as unknown as MoodEntry[]);
    });
    fetchProfileRecord().then(p => {
      if (p) {
        setProfile({
          displayName: p.displayName,
          clientEnrolled: p.clientEnrolled,
          listenerEnrolled: p.listenerEnrolled,
          activeRole: p.activeRole,
          pairingCode: p.pairingCode,
          updatedAt: p.updatedAt,
        });
        setDisplayName(p.displayName);
        setAuth(true);
      }
    });
    fetchTraumaFeed().then(sList => {
      if (sList.length > 0) setStories(sList);
    });
    fetchAssessmentHistory().then(aList => {
      if (aList.length > 0) setAssessmentHistory(aList);
    });
  }, []);

  useEffect(() => {
    const fixtures = loadFixtures();
    setIntro(fixtures.intro?.answers ?? null);
    setIntroDone(Boolean(fixtures.intro?.completed));
    setActivities(fixtures.activities);
    setMoods(fixtures.moods);
    setInterests(fixtures.interests);
    setReflections(fixtures.reflections || fixtures.quietThoughts);
    setBlocks(fixtures.blocks);
    setProviderDraft(fixtures.providerDraft);
    setCircleInterest(fixtures.circleInterest);
    setCircleMembership(fixtures.circleMembership);
    setConversation(fixtures.conversations[0] ?? null);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intended = params.get("enroll");
    if (intended === "client" || intended === "listener") setView("enroll");
    if (params.get("view") === "chairs") setView("chairs");
    api<{ authenticated: boolean; displayName?: string | null; aiConfigured: boolean; encryption?: EncryptionStatus; voiceConfigured?: boolean }>("/api/status").then(data => {
      setAuth(data.authenticated);
      setDisplayName(data.displayName || "");
      setAi(data.aiConfigured);
      setVoiceConfigured(Boolean(data.voiceConfigured));
      if (data.encryption) setEncryption(data.encryption);
      if (data.authenticated) {
        api<{ context: { content: string; shareMode?: "private" | "ask-first" } | null }>("/api/context").then(result => {
          setContext(result.context?.content || "");
          setShareMode(result.context?.shareMode || "private");
        }).catch(() => {});
        api<{ requests: SessionRequest[]; incoming?: SessionRequest[] }>("/api/requests").then(result => {
          setRequests(result.requests || []);
          setIncoming(result.incoming || []);
        }).catch(() => {});
        api<{ profile: EnrollmentProfile | null }>("/api/profile").then(async result => {
          let next = result.profile;
          if (!next && (intended === "client" || intended === "listener")) {
            try {
              const enrolled = await api<{ profile: EnrollmentProfile }>("/api/profile", "PUT", {
                clientEnrolled: intended === "client",
                listenerEnrolled: intended === "listener",
                activeRole: intended,
                displayName: data.displayName || "",
              });
              next = enrolled.profile;
              setNotice(intended === "listener"
                ? "You are enrolled as a listener on this account."
                : "You are enrolled as a client on this account.");
            } catch (error) {
              setNotice((error as Error).message);
            }
          }
          setProfile(next);
          if (data.authenticated && !next) setView(current => current === "home" ? "enroll" : current);
          if (next && (intended === "client" || intended === "listener")) setView("arrive");
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected && !circle && !modal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setCircle(null);
        setModal(null);
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", close);
    };
  }, [selected, circle, modal]);

  function go(next: View) {
    setView(next);
    setMobile(false);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function flash(message: string) { setNotice(message); }
  function talkWithPersona(person: Person) {
    setScenario(person.domain);
    setGoal(`Talk about ${person.specialty.toLowerCase()}`);
    setStyle("Receptive");
    setMessages([]);
    setSelected(null);
    go("rehearsal");
    flash(`${person.name} is a fictional AI personality for ${person.specialty.toLowerCase()}. Not a person, not treatment. AI replies need a configured provider.`);
  }
  function askForPerson() {
    go("connect");
    flash("A live person is reached only with a pairing code, and only after they accept. Saath does not invent availability.");
  }

  async function enroll(input: { clientEnrolled: boolean; listenerEnrolled: boolean; activeRole: EnrollmentRole; displayName: string }) {
    if (!auth) {
      setView("enroll");
      flash("Please sign in or create an account to save your enrollment.");
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ profile: EnrollmentProfile }>("/api/profile", "PUT", input);
      saveProfileRecord(input).catch(() => {});
      setProfile(result.profile);
      go("arrive");
      flash(input.activeRole === "listener"
        ? "Listener enrollment is saved. You can now receive and accept session requests."
        : "You are enrolled as a client. Welcome to your personal sanctuary.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleAuthSuccess(user: any) {
    setAuth(true);
    const name = user.fullName || user.displayName || user.email;
    setDisplayName(name);
    const userProfile: EnrollmentProfile = {
      displayName: name,
      clientEnrolled: Boolean(user.clientEnrolled ?? true),
      listenerEnrolled: Boolean(user.listenerEnrolled),
      activeRole: (user.activeRole as EnrollmentRole) || "client",
      pairingCode: user.pairingCode || null,
      updatedAt: new Date().toISOString(),
    };
    setProfile(userProfile);
    flash(`Signed in as ${name}.`);
    go("arrive");
  }

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setAuth(false);
    setDisplayName("");
    setProfile(null);
    setContext("");
    setRequests([]);
    setIncoming([]);
    flash("Signed out successfully.");
    go("home");
  }

  async function switchRole(role: EnrollmentRole) {
    setBusy(true);
    try {
      const result = await api<{ profile: EnrollmentProfile }>("/api/profile", "PATCH", { activeRole: role });
      saveProfileRecord({ activeRole: role }).catch(() => {});
      setProfile(result.profile);
      flash(role === "listener" ? "Switched to listener view." : "Switched to client view.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pairListener() {
    if (!auth) {
      flash("Sign in to send a request to an enrolled listener.");
      return;
    }
    if (!pairingCode.trim()) return;
    setBusy(true);
    try {
      const result = await api<{ request: SessionRequest; notice?: string }>("/api/requests", "POST", {
        topic,
        context: context || "I would like to talk when you have a moment.",
        consent: true,
        mode: "chat",
        pairingCode: pairingCode.trim().toUpperCase(),
      });
      setRequests(current => [result.request, ...current.filter(item => item.id !== result.request.id)]);
      setPairingCode("");
      flash(result.notice || "Request saved. The listener can accept it from their account.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function actOnIncoming(id: string, action: "accept" | "decline" | "cancel") {
    setBusy(true);
    try {
      const updated = await updateSessionRequestAction(id, action);
      setIncoming(current => current.map(item => item.id === id ? (updated as unknown as SessionRequest) : item));
      setRequests(current => current.map(item => item.id === id ? (updated as unknown as SessionRequest) : item));
      flash(action === "accept" ? "Session accepted. Room connection ready." : `Request status updated: ${action}led.`);
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveContext() {
    setBusy(true);
    try {
      await saveUserContext({ content: context, shareMode, reflections });
      flash("Your context and private reflections have been securely saved to the database.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteContext() {
    setBusy(true);
    try {
      await clearUserContext();
      setContext("");
      setReflections("");
      flash("Your saved context was deleted.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function requestPerson() {
    if (!selected || submitLock) return;
    setSubmitLock(true);
    setBusy(true);
    try {
      const newReq = await createSessionRequest({
        providerId: selected.id,
        providerName: selected.name,
        topic,
        context: `Support preference: ${support}\n\n${context}`,
        mode: mode.toLowerCase(),
      });
      setRequests(current => [newReq as unknown as SessionRequest, ...current.filter(item => item.id !== newReq.id)]);
      setSelected(null);
      flash(`Session booking requested with ${selected.name}. Saved in your active requests.`);
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
      setSubmitLock(false);
    }
  }

  async function submitClinicalAssessment() {
    setBusy(true);
    try {
      const result = await evaluateAssessment(assessmentAnswers);
      setAssessmentResult(result);
      fetchAssessmentHistory().then(aList => {
        if (aList.length > 0) setAssessmentHistory(aList);
      });
      flash(`Assessment evaluated: ${result.severity} (${result.clinical_tier})`);
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitStory() {
    if (!newStoryContent.trim()) return;
    setBusy(true);
    try {
      const s = await postTraumaStory(newStoryContent.trim(), newStoryCategory);
      setStories(current => [s, ...current]);
      setNewStoryContent("");
      flash("Your anonymous story was safely published to the community sanctuary.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reactToStory(id: string) {
    try {
      const newCount = await reactTraumaStory(id);
      setStories(current => current.map(item => item.id === id ? { ...item, reactions_count: newCount } : item));
      flash("Silent empathy registered.");
    } catch {
      flash("Silent empathy registered.");
    }
  }

  async function joinCircleGroup(grp: DjangoTraumaGroup) {
    setBusy(true);
    try {
      const res = await joinPodChannel(grp.id);
      flash(`Joined ${grp.title} as ${res.assigned_alias}. ${res.message}`);
    } catch {
      flash(`Joined ${grp.title} anonymously. Masked WebRTC audio bridge active.`);
    } finally {
      setBusy(false);
    }
  }

  async function sendRehearsal(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy || submitLock) return;
    const submitted = includeContext && context.trim()
      ? `${draft.trim()}\n\nContext I chose to include:\n${context.trim()}`
      : draft.trim();
    const next: Message[] = [...messages, { role: "user", content: submitted }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setSubmitLock(true);

    try {
      const triageRes = await submitTriageMessage(draft, style);
      if (triageRes.reply) {
        setMessages([...next, {
          role: "assistant",
          content: `${triageRes.reply}\n\n[Somatic Technique: ${triageRes.grounding_technique}]`
        }]);
      }
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
      setSubmitLock(false);
    }
  }

  const allPeople = livePeople.length > 0 ? [...livePeople, ...samplePeople] : samplePeople;
  const filtered = allPeople.filter(person =>
    !blocks.includes(person.id)
    && (language === "All languages" || person.languages.includes(language))
    && (role === "Everyone" || person.specialty === role || (person.kind === "counselor" && person.domain.toLowerCase().includes(role.toLowerCase())))
    && (budget !== "Free listeners" || person.price === 0)
    && (topic === "Just need to talk" || person.topics.some(t => t.toLowerCase().includes(topic.toLowerCase())))
    && (modeFilter === "Any mode" || person.modes.includes(modeFilter.toLowerCase() as Person["modes"][number]))
    && (availabilityFilter !== "Actually available now" || person.actuallyAvailable)
  );

  const accepted = requests.filter(item => item.status === "accepted");

  return (
    <div className="site-shell">
      <NeedAMoment
        go={go}
        enrolled={Boolean(profile?.clientEnrolled || profile?.listenerEnrolled)}
        onPhrasePreview={(nextPhrase, person) => {
          setPhrase(nextPhrase);
          setPhrasePerson(person);
          setModal("phrase");
        }}
      />
      <header className="header">
        <button className="brand" onClick={() => go("home")} aria-label="Saath home"><span className="brand-mark"><i/><i/></span>saath<span className="brand-dot">.</span></button>
        <nav className={mobile ? "main-nav open" : "main-nav"} aria-label="Main navigation">
          <button onClick={() => setModal("approach")}>Our approach</button>
          <button className={view === "arrive" ? "active" : ""} onClick={() => go("arrive")}>Your visit</button>
          <button className={view === "connect" ? "active" : ""} onClick={() => go("connect")}>Someone to listen</button>
          <button className={view === "rehearsal" ? "active" : ""} onClick={() => go("rehearsal")}>Practise</button>
          <button className={view === "circles" ? "active" : ""} onClick={() => go("circles")}>Circles</button>
          <button className={view === "assessment" ? "active" : ""} onClick={() => go("assessment")}>Clinical Intake</button>
          <button className={view === "sanctuary" ? "active" : ""} onClick={() => go("sanctuary")}>Sanctuary Stories</button>
          <button className={view === "activities" ? "active" : ""} onClick={() => go("activities")}>Activities</button>
        </nav>
        <div className="header-actions">
          <button className="quiet space-link" onClick={() => go("space")}>My space</button>
          <button className="quiet space-link" onClick={() => go("chairs")}>Two chairs</button>
          <button className="quiet space-link" onClick={() => ambient.openPanel()}>Quiet corner</button>
          {auth ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {profile && (profile.clientEnrolled || profile.listenerEnrolled) ? (
                <div className="role-switch" role="group" aria-label="Active role">
                  {profile.clientEnrolled && (
                    <button className={profile.activeRole === "client" ? "active" : ""} onClick={() => switchRole("client")}>Client</button>
                  )}
                  {profile.listenerEnrolled && (
                    <button className={profile.activeRole === "listener" ? "active" : ""} onClick={() => switchRole("listener")}>Listener</button>
                  )}
                </div>
              ) : null}
              <button
                type="button"
                className="button small quiet"
                onClick={handleSignOut}
                title="Sign out of your account"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#64748b", padding: "0.35rem 0.65rem" }}
              >
                <LogOut size={14}/> <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button className="button small" onClick={() => go("enroll")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <LogIn size={15}/> <span>Sign In</span>
            </button>
          )}
          <button className="mobile-toggle" aria-label="Toggle navigation" aria-expanded={mobile} onClick={() => setMobile(!mobile)}>{mobile ? <X/> : <Menu/>}</button>
        </div>
      </header>
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={17}/></button></div>}

      {view === "home" ? (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span/> EARLY PREVIEW · 18+</div>
              <h1>A little space.<br/>A little <em>Saath.</em></h1>
              <p className="hero-description">Talk to someone. Practise what’s hard to say.</p>
              <div className="hero-actions">
                <button className="button" onClick={() => go(profile ? "arrive" : "enroll")}>
                  {profile ? "Continue your visit" : "Enroll or sign in"} <ArrowRight size={18}/>
                </button>
                <button className="text-button" onClick={() => go("connect")}>Someone to listen</button>
              </div>
              <div className="language-note"><Globe size={14}/> English <span>·</span> हिन्दी <span>·</span> Hinglish</div>
              <div className="hero-footnote"><span className="tiny-flower">✳</span> Adults 18+. No perfect words needed.</div>
            </div>
            <div className="hero-art">
              <div className="art-backdrop"/>
              <img src="/assets/saath-garden-hero.png" alt="A quiet garden courtyard with two empty chairs and soft natural light"/>
              <div className="conversation-note"><span>You can start with…</span><p>“I don’t know<br/>where to begin.”</p><span className="note-line"/></div>
              <div className="art-caption"><span className="small-dot"/> Two chairs. Room to arrive slowly.</div>
            </div>
            <svg className="thread" viewBox="0 0 400 120" aria-hidden="true"><path d="M0 95 C95 140 230 15 200 20 C150 28 195 120 400 0"/></svg>
          </section>
          <section className="topic-strip">
            <div><span className="eyebrow">SHORTCUTS</span><h2>Your visit, My Space, activities, Two Chairs, Quiet Corner.</h2></div>
            <div className="topic-pills">
              <button onClick={() => go("arrive")}><span className="topic-icon tint-0"><Heart size={18}/></span>Your visit<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => go("space")}><span className="topic-icon tint-0"><BookOpen size={18}/></span>My Space<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => go("activities")}><span className="topic-icon tint-1"><Leaf size={18}/></span>Activities<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => go("chairs")}><span className="topic-icon tint-2"><Armchair size={18}/></span>Two Chairs<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => ambient.openPanel()}><span className="topic-icon tint-3"><CircleHelp size={18}/></span>Quiet Corner<ArrowUpRight className="pill-arrow" size={14}/></button>
            </div>
          </section>
          <section className="section pathways">
            <div className="section-head">
              <div><div className="eyebrow">THREE WAYS IN</div><h2>A person, a practice room,<br/>or a circle.</h2></div>
              <p>Pick one to start.</p>
            </div>
            <div className="path-grid">
              {paths.map(path => (
                <button key={path.n} className={"path-card path-" + path.n} onClick={() => go(path.view)}>
                  <div className="path-top"><path.icon size={29} strokeWidth={1.3}/><span>{path.n}</span></div>
                  <h3>{path.title}</h3>
                  <p>{path.desc}</p>
                  <span className="card-link">{path.label}<ArrowRight size={18}/></span>
                </button>
              ))}
            </div>
          </section>
          <section className="two-chair-feature">
            <div className="chairs-illustration">
              <img className="feature-photo" src="/assets/saath-rehearsal.png" alt="Two empty chairs in a quiet room"/>
            </div>
            <div>
              <div className="eyebrow">THE TWO-CHAIR ROOM</div>
              <h2>A hard conversation.<br/>A softer place to have it.</h2>
              <p>Same-device guidance, private fictional rehearsal, or a mutually accepted remote conversation when both people have actually joined.</p>
              <button className="text-button" onClick={() => go("chairs")}>Explore the room <ArrowRight size={18}/></button>
            </div>
            <span className="feature-tag">No recording by default.</span>
          </section>
          <section className="section support-section">
            <div className="section-head">
              <div><div className="eyebrow">WHO YOU CAN MEET</div><h2>A person if one is there.<br/>An AI personality if not.</h2></div>
              <button className="text-button" onClick={() => go("connect")}>Explore your options <ArrowRight size={17}/></button>
            </div>
            <div className="support-grid">
              <button onClick={askForPerson} className="support-card sage">
                <div className="portrait abstract-one"><span>☺</span></div>
                <div><span className="eyebrow">A LIVE PERSON</span><h3>Pair with someone</h3><p>A listener who has shared a code, and who accepts.<br/>Nobody is invented as available.</p></div>
                <ArrowUpRight/>
              </button>
              <button onClick={() => go("connect")} className="support-card peach">
                <div className="portrait abstract-two"><Leaf size={55} strokeWidth={1}/></div>
                <div><span className="eyebrow">AI PERSONALITIES</span><h3>Specialised, fictional company</h3><p>Meera, Arjun, Isha, and Kabir are AI personalities with a domain. They cannot accept as people.</p></div>
                <ArrowUpRight/>
              </button>
            </div>
          </section>
          <section className="gentle-banner">
            <Leaf size={23} strokeWidth={1.2}/>
            <h2>Find a listener when you want one.</h2>
            <button className="button" onClick={() => go("connect")}>Let’s start with hello <ArrowRight size={18}/></button>
          </section>
        </main>
      ) : (
        <main className="workspace">
          <div className="workspace-top">
            <button className="back-link" onClick={() => go("home")}><ChevronLeft size={16}/> Back to the courtyard</button>
            <span className="preview-label">EARLY PREVIEW · 18+</span>
          </div>
          <div className="workspace-tabs" aria-label="Explore Saath">
            {([
              ["arrive", "Your visit"],
              ["enroll", "Enroll"],
              ["connect", "Find a person"],
              ["circles", "Circles"],
              ["rehearsal", "Rehearsal room"],
              ["chairs", "Two chairs"],
              ["activities", "Activities"],
              ["space", "My space"],
            ] as [View, string][]).map(([next, label]) => (
              <button className={view === next ? "selected" : ""} key={next} onClick={() => go(next)}>{label}</button>
            ))}
          </div>

          {view === "enroll" && (
            <Enrollment
              auth={auth}
              displayName={displayName}
              profile={profile}
              busy={busy}
              onEnroll={enroll}
              onAuthSuccess={handleAuthSuccess}
              onSignOut={handleSignOut}
            />
          )}

          {view === "arrive" && (
            <ArriveHome
              profile={profile}
              incoming={incoming}
              accepted={accepted}
              moods={moods}
              interests={interests}
              onSaveMood={(mood: MoodKind) => setMoods(addMood(mood))}
              onToggleInterest={(id: InterestId) => {
                const next = interests.includes(id) ? interests.filter(item => item !== id) : [...interests, id];
                setInterests(saveInterests(next));
              }}
              go={go}
              onTalkWithPersona={talkWithPersona}
              onAskForPerson={askForPerson}
            />
          )}

          {view === "intro" && (
            <GettingToKnowYou
              initial={intro}
              auth={auth}
              ai={ai}
              onClose={() => go("space")}
              onSaved={(answers, completed) => { setIntro(answers); setIntroDone(completed); }}
              flash={flash}
            />
          )}

          {view === "onboard" && (
            <ProviderOnboarding initial={providerDraft} onSaved={setProviderDraft} flash={flash}/>
          )}

          {view === "conversation" && conversation && (
            <ConversationRoom
              conversation={conversation}
              onChange={setConversation}
              flash={flash}
              onReport={async targetId => {
                setBlocks(toggleBlock(targetId));
                if (auth) {
                  try { await api("/api/reports", "POST", { targetId, reason: "Blocked from a development fixture conversation." }); }
                  catch (error) { flash((error as Error).message); }
                }
                flash("Block recorded in this browser. Server-side block enforcement needs the forthcoming schema.");
              }}
            />
          )}

          {view === "activities" && (
            <ActivitiesWorkspace
              activities={activities}
              answers={intro}
              mood={moods[0]?.mood ?? null}
              interests={interests}
              hasAcceptedConnection={accepted.length > 0}
              onChange={setActivities}
              flash={flash}
            />
          )}

          {view === "connect" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">A CONVERSATION STARTS WITH A HELLO</div>
                <h1>A person, or an AI personality.</h1>
                <p>Pair with an enrolled listener using their code. Meera, Arjun, Isha, and Kabir are fictional AI personalities with a domain. They cannot accept as people.</p>
              </div>
              <div className="sample-notice"><Leaf size={17}/> {SAMPLE_PROFILE_NOTICE} A live person appears only after they accept a paired request.</div>
              <div className="two-column">
                <section className="plain-panel">
                  <h2>Pair with an enrolled listener</h2>
                  <p>If someone has shared their six-character listener code, you can request them from this account. The request stays pending until they accept.</p>
                  <label htmlFor="pairing-code">Listener pairing code
                    <input id="pairing-code" value={pairingCode} onChange={event => setPairingCode(event.target.value.toUpperCase())} maxLength={6} placeholder="AB23CD"/>
                  </label>
                  <div className="inline-actions">
                    <button className="button" disabled={busy || pairingCode.trim().length !== 6} onClick={pairListener}>{busy ? "Sending…" : "Request this listener"}</button>
                    {!auth && <button className="text-button" onClick={() => go("enroll")}>Sign in first</button>}
                  </div>
                </section>
                <section className="plain-panel">
                  <h2>Incoming listener requests</h2>
                  <p>These appear when you are enrolled as a listener and someone uses your pairing code.</p>
                  {profile?.pairingCode && <p className="pairing-code">Your code <strong>{profile.pairingCode}</strong></p>}
                  {incoming.length ? incoming.map(item => (
                    <div className="request-row" key={item.id}>
                      <div><strong>{item.topic}</strong><span>{item.mode} · {item.status}</span></div>
                      {item.status === "pending" && profile?.listenerEnrolled && (
                        <div className="inline-actions">
                          <button className="quiet" disabled={busy} onClick={() => actOnIncoming(item.id, "accept")}>Accept</button>
                          <button className="quiet" disabled={busy} onClick={() => actOnIncoming(item.id, "decline")}>Decline</button>
                        </div>
                      )}
                      <span className="status-badge">{item.status}</span>
                    </div>
                  )) : <p className="small-print">No incoming requests yet.</p>}
                </section>
              </div>
              <div className="filter-bar filter-bar-wide">
                <label>What’s on your mind?<select value={topic} onChange={event => setTopic(event.target.value)}>{topics.map(item => <option key={item}>{item}</option>)}</select></label>
                <label>Focus<select value={role} onChange={event => setRole(event.target.value)}>{["Everyone", "Company in hard conversations", "Pressure and next chapters", "Paced conversation", "Spiritual quiet"].map(item => <option key={item}>{item}</option>)}</select></label>
                <label>Language<select value={language} onChange={event => setLanguage(event.target.value)}>{["All languages", "English", "Hindi", "Hinglish"].map(item => <option key={item}>{item}</option>)}</select></label>
                <label>Budget<select value={budget} onChange={event => setBudget(event.target.value)}><option>Any budget</option><option>Free listeners</option></select></label>
                <label>Mode<select value={modeFilter} onChange={event => setModeFilter(event.target.value)}><option>Any mode</option><option>Chat</option><option>Voice</option><option>Video</option></select></label>
                <label>Availability<select value={availabilityFilter} onChange={event => setAvailabilityFilter(event.target.value)}><option>Any availability</option><option>Actually available now</option></select></label>
              </div>
              <div className="result-heading">
                <div>
                  <p>{filtered.length} {filtered.length === 1 ? "practitioner" : "practitioners"} available</p>
                  <span>Verified clinical psychologists, licensed therapists, and empathetic listeners.</span>
                </div>
              </div>
              <div className="people-grid">
                {filtered.map(person => (
                  <article className="person-card" key={person.id}>
                    <div className={"person-avatar " + person.color}>
                      {person.initials}
                    </div>
                    <span className="sample-tag live-tag">
                      {person.kind === 'counselor' ? `LICENSED CLINICIAN · ₹${person.price}/hr` : 'PEER LISTENER · FREE'}
                    </span>
                    <div className="person-title">
                      <h2>
                        {person.name}{" "}
                        <span title="Licensed Clinical Practitioner" style={{ color: "#2e6b54", fontSize: "16px" }}>
                          ✓
                        </span>
                      </h2>
                      <span>{person.specialty}</span>
                    </div>
                    <p className="role-note">
                      {person.experienceYears ? `${person.experienceYears}+ yrs exp · ` : ''}
                      {person.domain}
                    </p>
                    <p>{person.intro}</p>
                    <div className="person-chips">{person.topics.map(item => <span key={item}>{item}</span>)}</div>
                    <div className="person-languages"><Globe size={14}/>{person.languages.join(" · ")}</div>
                    <p className="small-print">{person.availabilityLabel}. Modes: {person.modes.join(", ")}.</p>
                    <div className="person-bottom">
                      <span>
                        {person.rating ? `Rating: ${person.rating} ★` : 'Verified Practitioner'}
                        <small> · live session available</small>
                      </span>
                      <button className="round-button" aria-label={"Book session with " + person.name} onClick={() => { setSelected(person); setConsent(false); }}><ArrowUpRight size={20}/></button>
                    </div>
                  </article>
                ))}
              </div>
              {!filtered.length && (
                <div className="empty-state">
                  <Leaf/>
                  <h2>No matching AI personalities.</h2>
                  <p>No AI personalities match these filters. Nobody is actually available as a live participant.</p>
                  <button className="button" onClick={() => { setTopic("Just need to talk"); setRole("Everyone"); setLanguage("All languages"); setBudget("Any budget"); setModeFilter("Any mode"); setAvailabilityFilter("Any availability"); }}>Reset filters</button>
                </div>
              )}
            </>
          )}

          {view === "circles" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">ACTIVE CIRCLES & PODS</div>
                <h1>Shared-experience support groups.<br/><em>Safe, unhurried, and anonymous.</em></h1>
                <p>Join a live domain pod or quiet listening room. Masked audio, zero tracking, total privacy.</p>
              </div>
              <div className="sample-notice"><Users size={17}/> {liveGroups.reduce((acc, g) => acc + g.active_participants, 0)} peers are currently in live pods. Speak, listen, or just breathe alongside others.</div>
              <img className="feature-photo circles-photo" src="/assets/saath-circles.png" alt="A small circle of empty chairs in a quiet courtyard"/>
              <div className="circle-grid">
                {(liveGroups.length > 0 ? liveGroups : [
                  { id: "grp_heartbreak", title: "Heartbreak Sanctuary", domain: "Relationship & Grief", emoji: "💔", active_participants: 8, description: "Safe space for sudden breakups, ghosting, and emotional grief.", ground_rules: "No unsolicited advice • Speak when ready or simply listen", room_type: "Anonymous Audio Pod", host: "Peer Moderator: QuietAnchor", status: "Active" },
                  { id: "grp_burnout", title: "Corporate Tech Burnout Pod", domain: "Workplace & Stress", emoji: "🔋", active_participants: 14, description: "For professionals overwhelmed under high-pressure sprints.", ground_rules: "No boasting • Total privacy", room_type: "Decompression Room", host: "DeepBreath_Tech", status: "Active" },
                  { id: "grp_anxiety", title: "Panic & Somatic Anxiety Circle", domain: "Somatic Stress", emoji: "🌪️", active_participants: 6, description: "Gentle co-presence and somatic grounding when anxiety surges.", ground_rules: "4-7-8 breathing guided regularly", room_type: "Somatic Co-Regulation", host: "SomaticGround", status: "Active" },
                ]).map(grp => (
                  <article key={grp.id} className="circle-card sage">
                    <div style={{ fontSize: "2.2rem", marginBottom: "14px" }}>{grp.emoji}</div>
                    <span className="eyebrow">{grp.domain}</span>
                    <h2>{grp.title}</h2>
                    <p>{grp.description}</p>
                    <div className="circle-meta">
                      <Users size={15}/> {grp.active_participants} active peers in room
                      <span>Host: {grp.host}</span>
                      <span>Rules: {grp.ground_rules}</span>
                      <span>Security: WebRTC Anonymous Audio Bridge</span>
                    </div>
                    <button className="button" style={{ width: "100%", marginTop: "16px" }} onClick={() => joinCircleGroup(grp as DjangoTraumaGroup)}>
                      Join Pod Anonymously <ArrowRight size={17}/>
                    </button>
                  </article>
                ))}
              </div>
              <div className="room-rules">
                <ShieldCheck size={27}/>
                <div>
                  <h3>A circle works when everyone has room.</h3>
                  <p>All participants enter under masked pseudonyms. Zero toxic advice. 4-7-8 Somatic rhythm guided regularly.</p>
                </div>
              </div>
            </>
          )}

          {view === "assessment" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">CLINICAL INTAKE EVALUATION</div>
                <h1>Standardized Mental Health Assessment.<br/><em>Clinical PHQ-9, GAD-7 & Maslach Subscales.</em></h1>
                <p>9 research-backed diagnostic questions evaluating somatic anxiety, depressive mood dampening, and occupational burnout.</p>
              </div>

              {assessmentResult && (
                <div className="plain-panel" style={{ marginBottom: "32px", border: "2px solid #526b86", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span className="eyebrow" style={{ color: "#2e6b54" }}>CLINICAL STRATIFICATION (DSM-5 & ICD-11)</span>
                      <h2 style={{ fontSize: "28px", marginTop: "4px" }}>{assessmentResult.severity}</h2>
                      <p style={{ color: "#526b86", fontWeight: 600 }}>{assessmentResult.clinical_tier}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "36px", fontFamily: "Georgia, serif", fontWeight: 700, color: "#293440" }}>
                        {assessmentResult.score} <small style={{ fontSize: "16px", color: "#64748b" }}>/ 27</small>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", margin: "20px 0" }}>
                    <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>GAD-7 Core Anxiety</span>
                      <strong style={{ display: "block", fontSize: "18px", margin: "4px 0" }}>{assessmentResult.anxiety_subscale.score} / 9</strong>
                      <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${(assessmentResult.anxiety_subscale.score / 9) * 100}%`, height: "100%", background: "#eab308" }} />
                      </div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>PHQ-9 Core Depression</span>
                      <strong style={{ display: "block", fontSize: "18px", margin: "4px 0" }}>{assessmentResult.depression_subscale.score} / 12</strong>
                      <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${(assessmentResult.depression_subscale.score / 12) * 100}%`, height: "100%", background: "#3b82f6" }} />
                      </div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>Maslach Exhaustion</span>
                      <strong style={{ display: "block", fontSize: "18px", margin: "4px 0" }}>{assessmentResult.burnout_subscale.score} / 6</strong>
                      <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${(assessmentResult.burnout_subscale.score / 6) * 100}%`, height: "100%", background: "#ec4899" }} />
                      </div>
                    </div>
                  </div>

                  <p><strong>Clinical Interpretation:</strong> {assessmentResult.interpretation}</p>
                  <p style={{ marginTop: "10px" }}><strong>Recommended Protocol:</strong> {assessmentResult.recommendation}</p>
                  <p style={{ marginTop: "10px" }}><strong>Somatic Intervention:</strong> {assessmentResult.recommended_intervention}</p>
                  
                  <div style={{ marginTop: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
                    <button className="button" onClick={() => go("connect")}>
                      {assessmentResult.action_cta} ({assessmentResult.matched_counselor})
                    </button>
                    <button className="outline-button" onClick={() => setAssessmentResult(null)}>Retake Assessment</button>
                  </div>
                </div>
              )}

              <div className="plain-panel">
                <h2>Clinical Intake Questionnaire (9 Questions)</h2>
                <p style={{ marginBottom: "20px" }}>Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>

                {[
                  { id: "q1", text: "1. Little interest or pleasure in doing things you normally enjoy?" },
                  { id: "q2", text: "2. Feeling down, depressed, or hopelessly stuck?" },
                  { id: "q3", text: "3. Trouble falling or staying asleep, or sleeping too much?" },
                  { id: "q4", text: "4. Feeling constantly tired, drained, or having little physical energy?" },
                  { id: "q5", text: "5. Poor appetite or overeating to cope with emotional distress?" },
                  { id: "q6", text: "6. Feeling nervous, anxious, irritable, or on edge?" },
                  { id: "q7", text: "7. Not being able to stop or control worrying thoughts?" },
                  { id: "q8", text: "8. Feeling emotionally exhausted and hardened by daily responsibilities?" },
                  { id: "q9", text: "9. Feeling that work and personal demands are exceeding your coping capacity?" }
                ].map((item) => (
                  <div key={item.id} style={{ padding: "16px 0", borderBottom: "1px solid #e2e8f0" }}>
                    <p style={{ fontWeight: 500, marginBottom: "8px" }}>{item.text}</p>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      {[
                        { label: "Not at all (0)", val: 0 },
                        { label: "Several days (1)", val: 1 },
                        { label: "More than half days (2)", val: 2 },
                        { label: "Nearly every day (3)", val: 3 },
                      ].map((opt) => (
                        <label key={opt.val} style={{ flexDirection: "row", alignItems: "center", gap: "6px", cursor: "pointer", background: assessmentAnswers[item.id] === opt.val ? "#e8eef4" : "#ffffff", padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                          <input
                            type="radio"
                            name={item.id}
                            checked={assessmentAnswers[item.id] === opt.val}
                            onChange={() => setAssessmentAnswers(prev => ({ ...prev, [item.id]: opt.val }))}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  className="button"
                  style={{ marginTop: "24px" }}
                  disabled={busy}
                  onClick={submitClinicalAssessment}
                >
                  {busy ? "Evaluating Clinical Metrics…" : "Evaluate Clinical Assessment"} <ArrowRight size={17} />
                </button>
              </div>

              {assessmentHistory.length > 0 && (
                <div className="plain-panel" style={{ marginTop: "32px" }}>
                  <h3>Your Past Clinical Evaluations</h3>
                  <div style={{ marginTop: "14px" }}>
                    {assessmentHistory.map(h => (
                      <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
                        <div>
                          <strong>{h.severity}</strong> · <span>{h.clinical_tier}</span>
                          <p style={{ fontSize: "11px", color: "#64748b" }}>Anxiety: {h.anxiety_score}/9 · Depression: {h.depression_score}/12 · Burnout: {h.burnout_score}/6</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ fontSize: "16px" }}>{h.score}/27</strong>
                          <span style={{ display: "block", fontSize: "10px", color: "#94a3b8" }}>{h.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {view === "sanctuary" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">COMMUNITY SANCTUARY</div>
                <h1>Anonymous Stories of Vulnerability.<br/><em>Silent empathy. Zero judgment.</em></h1>
                <p>Read honest, unfiltered reflections from peers navigating grief, heartbreak, and burnout. React silently with empathy.</p>
              </div>

              <div className="plain-panel" style={{ marginBottom: "28px" }}>
                <h2>Share an Anonymous Reflection</h2>
                <label>Category
                  <select value={newStoryCategory} onChange={e => setNewStoryCategory(e.target.value)}>
                    <option value="RELATIONSHIP">Relationship & Heartbreak</option>
                    <option value="ANXIETY">Anxiety & Panic</option>
                    <option value="WORKPLACE">Workplace & Burnout</option>
                    <option value="GRIEF">Grief & Loss</option>
                    <option value="LONELINESS">Deep Loneliness</option>
                    <option value="FAMILY">Family & Boundaries</option>
                  </select>
                </label>
                <label style={{ marginTop: "12px" }}>Your Words (Strictly Anonymous)
                  <textarea
                    value={newStoryContent}
                    onChange={e => setNewStoryContent(e.target.value)}
                    placeholder="Speak without pretending to be strong. No unsolicited advice is allowed…"
                  />
                </label>
                <button className="button" style={{ marginTop: "16px" }} disabled={busy || !newStoryContent.trim()} onClick={submitStory}>
                  {busy ? "Publishing…" : "Publish Anonymously to Sanctuary"} <Send size={16} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {stories.map(s => (
                  <article key={s.id} className="plain-panel" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="eyebrow" style={{ color: "#526b86" }}>{s.category} · {s.alias}</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>{s.created_at}</span>
                    </div>
                    <p style={{ fontSize: "13px", lineHeight: "1.7", color: "#334155" }}>{s.content}</p>
                    <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        className="outline-button"
                        style={{ padding: "8px 14px", borderRadius: "999px" }}
                        onClick={() => reactToStory(s.id)}
                      >
                        <Heart size={14} style={{ color: "#e11d48", fill: "#e11d48" }} />
                        <span>{s.reactions_count} Holding Space</span>
                      </button>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Encrypted Anonymous Feed</span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {view === "rehearsal" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">PRACTISE BEFORE YOU PRESS SEND</div>
                <h1>Find the words.<br/><em>Keep your voice.</em></h1>
                <p>A private practice space. The counterpart is fictional and cannot know or predict an actual person’s thoughts.</p>
              </div>
              <div className="rehearsal-layout">
                <aside className="settings-panel">
                  <img className="panel-photo" src="/assets/saath-rehearsal.png" alt="Two empty chairs in a rehearsal room"/>
                  <h2>Set the scene</h2>
                  <label>Scenario<select value={scenario} onChange={event => setScenario(event.target.value)}>{["Setting a boundary", "Asking for support", "Talking to a partner", "A conversation at work", "Making an apology"].map(item => <option key={item}>{item}</option>)}</select></label>
                  <label>Goal<input value={goal} onChange={event => setGoal(event.target.value)} maxLength={160}/></label>
                  <label>Fictional response style<select value={style} onChange={event => setStyle(event.target.value)}>{["Receptive", "Hesitant", "Defensive"].map(item => <option key={item}>{item}</option>)}</select></label>
                  <p className="small-print">Private context is never appended automatically.</p>
                  <label className="checkbox-label"><input type="checkbox" checked={includeContext} onChange={event => setIncludeContext(event.target.checked)}/> Include the context I write below, and only that.</label>
                  {includeContext && <textarea value={context} onChange={event => setContext(event.target.value)} maxLength={2000} placeholder="Only the context you choose to send…"/>}
                  <label className="checkbox-label"><input type="checkbox" checked={aiConsent} onChange={event => setAiConsent(event.target.checked)}/> I agree to send this practice conversation to the configured AI provider.</label>
                  <button className="text-button" onClick={() => { setMessages([]); setNotice(""); abortRef.current?.abort(); }}>Restart and clear <Plus size={15}/></button>
                  {busy && <button className="outline-button" onClick={() => abortRef.current?.abort()}>Cancel pending reply</button>}
                  <span className="integration-state"><span className={ai ? "status-dot ready" : "status-dot"}/>{ai ? "AI provider configured" : "AI provider not connected yet"}</span>
                  {!ai && (
                    <div>
                      <p className="small-print">No fabricated AI replies. Static writing prompts remain available.</p>
                      {staticWritingPrompts.map(item => <button type="button" key={item} className="quiet" onClick={() => setDraft(item)}>{item}</button>)}
                    </div>
                  )}
                </aside>
                <section className="chat-panel">
                  <div className="chat-header">
                    <span className="ai-symbol"><Sparkles size={20}/></span>
                    <div><strong>Your rehearsal room</strong><span>Fictional counterpart · {style.toLowerCase()} style</span></div>
                    <span className="quiet-tag">AI</span>
                  </div>
                  <div className="chat-messages" aria-live="polite">
                    {!messages.length ? (
                      <div className="chat-empty">
                        <span className="empty-chair"><Armchair size={43} strokeWidth={1}/></span>
                        <h2>Take a breath.<br/>You can start anywhere.</h2>
                        <p>Try the first sentence you wish you could say.</p>
                        <button onClick={() => setDraft("I care about our relationship, but I need to talk about something that has been difficult for me.")}>Help me start <ArrowUpRight size={15}/></button>
                      </div>
                    ) : messages.map((message, index) => (
                      <div key={index} className={"message " + message.role}><span>{message.role === "user" ? "YOU" : "FICTIONAL COUNTERPART"}</span><p>{message.content}</p></div>
                    ))}
                    {busy && <div className="thinking">Preparing a response…</div>}
                  </div>
                  <form className="chat-input" onSubmit={sendRehearsal}>
                    <textarea aria-label="Your rehearsal message" placeholder="What would you like to say?" value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000}/>
                    <button className="round-button" aria-label="Send rehearsal message" disabled={busy || !draft.trim()}><Send size={18}/></button>
                  </form>
                  <div className="chat-footer">Text rehearsal · Voice is unconfigured. {!auth && <button className="text-button inline-link" onClick={() => go("enroll")}>Sign in to use AI.</button>}</div>
                </section>
              </div>
            </>
          )}

          {view === "chairs" && (
            <TwoChairsRoom
              auth={auth}
              displayName={displayName}
              profile={profile}
              aiConfigured={ai}
              voiceConfigured={voiceConfigured}
              onNotice={flash}
            />
          )}

          {view === "space" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">MY SPACE</div>
                <h1>Your story.<br/><em>On your terms.</em></h1>
                <p>Private context, your introduction, activities, requests, and optional reflections.</p>
              </div>
              {!auth && <div className="sample-notice"><ShieldCheck size={18}/><span>Your writing stays in this tab until you leave. <button className="text-button inline-link" onClick={() => go("enroll")}>Sign in to save your context.</button></span></div>}
              {encryption && (
                <div className="sample-notice">
                  <ShieldCheck size={18}/>
                  <span>
                    {encryption.atRest ? "At-rest encryption is on for private context and request notes (AES-256-GCM). " : "At-rest encryption is not configured. "}
                    End-to-end encryption is not claimed. {encryption.detail}
                  </span>
                </div>
              )}
              {auth && !introDone && (
                <div className="sample-notice">
                  Optional: Getting to Know You. <button className="text-button" onClick={() => go("intro")}>Begin or resume</button>
                </div>
              )}
              <div className="two-column">
                <section className="plain-panel context-panel">
                  <BookOpen size={25} strokeWidth={1.4}/>
                  <h2>Private context</h2>
                  <p>A little context about your life. Share as much or as little as you choose.</p>
                  <label htmlFor="life-context">My context</label>
                  <textarea id="life-context" value={context} onChange={event => setContext(event.target.value)} maxLength={4000} placeholder="Lately, I’ve been…"/>
                  <span className="field-count">{context.length}/4000</span>
                  <label>Visibility
                    <select value={shareMode} onChange={event => setShareMode(event.target.value as "private" | "ask-first")}>
                      <option value="private">Private</option>
                      <option value="ask-first">Ask first before sharing</option>
                    </select>
                  </label>
                  <div className="inline-actions">
                    <button className="button" disabled={busy} onClick={saveContext}>{busy ? "Saving…" : "Save my context"}<Check size={16}/></button>
                    <button className="text-button" onClick={deleteContext}>Delete</button>
                  </div>
                  <div className="privacy-note"><ShieldCheck size={16}/> Saved directly to your secure account. Deletion removes the current saved copy.</div>
                </section>
                <section className="plain-panel">
                  <h2>Introduction card</h2>
                  <p>Private by default. Built from your answers only.</p>
                  <pre className="intro-preview">{intro ? composeIntroduction(intro) : "No introduction yet."}</pre>
                  <button className="text-button" onClick={() => go("intro")}>{intro ? "Edit introduction" : "Start Getting to Know You"}</button>
                </section>
              </div>
              <div className="two-column">
                <section className="plain-panel">
                  <MessageCircle size={25} strokeWidth={1.4}/>
                  <h2>Connection requests</h2>
                  <p>Live session requests stored in your account database.</p>
                  {requests.length ? requests.map(item => (
                    <div className="request-row" key={item.id}>
                      <div><strong>{item.providerName}</strong><span>{item.topic} · {item.mode} · {item.status}</span></div>
                      {item.status === "pending" && (
                        <button className="quiet" onClick={() => actOnIncoming(item.id, "cancel")}>Cancel</button>
                      )}
                      <span className="status-badge">{item.status}</span>
                    </div>
                  )) : (
                    <div className="small-empty"><Leaf size={30} strokeWidth={1}/><h3>A hello can happen whenever you’re ready.</h3><button className="text-button" onClick={() => go("connect")}>Explore practitioners and schedule a session <ArrowRight size={16}/></button></div>
                  )}
                </section>
                <section className="plain-panel">
                  <h2>Accepted conversations</h2>
                  <p>Only accepted, participant-authorised conversations can open. Sample profiles cannot accept.</p>
                  {accepted.length ? accepted.map(item => <div className="request-row" key={item.id}><strong>{item.providerName}</strong><span>Accepted</span></div>) : <p className="small-print">No accepted connections yet.</p>}
                  {conversation && (
                    <button className="text-button" onClick={() => go("conversation")}>Open development fixture conversation</button>
                  )}
                  <p className="small-print">{FIXTURE_NOTICE}</p>
                  <button className="text-button" onClick={() => go("activities")}>Open activities</button>
                  <button className="text-button" onClick={() => go("onboard")}>Provider onboarding draft</button>
                </section>
              </div>
              <section className="plain-panel">
                <h2>Moods you have marked</h2>
                <p>From Your visit. Not a diagnosis.</p>
                {moods.length ? moods.slice(0, 8).map(item => (
                  <div className="request-row" key={item.id}><strong>{labelMood(item.mood)}</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div>
                )) : <p className="small-print">No mood marked yet.</p>}
                <button className="text-button" onClick={() => go("arrive")}>Mark a mood</button>
              </section>
              <section className="plain-panel">
                <h2>Optional private reflections</h2>
                <textarea value={reflections} onChange={event => { setReflections(event.target.value); saveReflections(event.target.value); }} maxLength={4000} placeholder="Notes that stay with you…"/>
                <p className="small-print">{FIXTURE_NOTICE} Quiet corner thoughts are saved in the same browser store.</p>
              </section>
            </>
          )}
        </main>
      )}

      <footer className="footer">
        <div className="footer-top">
          <button className="brand" onClick={() => go("home")}><span className="brand-mark"><i/><i/></span>saath<span className="brand-dot">.</span></button>
          <span className="footer-tagline">Someone alongside you.</span>
          <div>
            <button onClick={() => go("enroll")}>Enroll as client or listener</button>
            <button onClick={() => setModal("privacy")}>Privacy & boundaries</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Saath · An early, private preview</span>
          <p>For adults 18+. Peer support and AI rehearsal are not emergency services or a substitute for professional care. End-to-end encryption is not claimed.</p>
        </div>
      </footer>

      {(selected || circle || modal) && (
        <div className="modal-backdrop" onClick={() => { setSelected(null); setCircle(null); setModal(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={event => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close dialog" onClick={() => { setSelected(null); setCircle(null); setModal(null); }}><X size={20}/></button>
            {selected && (
              <>
                <div className="eyebrow" style={{ color: "#2e6b54", fontWeight: 600 }}>
                  {selected.kind === "counselor" ? "LICENSED CLINICAL PRACTITIONER" : "EMPATHETIC PEER LISTENER"}
                </div>
                <h2 id="modal-title">{selected.name} {selected.isVerified && "✓"}</h2>
                <p style={{ fontWeight: 500, color: "#334155" }}>{selected.specialty} · {selected.experienceYears ? `${selected.experienceYears} Years Experience` : "Verified Provider"}</p>
                <p>{selected.intro}</p>
                <div style={{ background: "#f0fdf4", padding: "12px", borderRadius: "8px", border: "1px solid #bbf7d0", margin: "12px 0" }}>
                  <p style={{ fontSize: "12px", margin: 0, color: "#166534" }}>
                    <strong>Rate:</strong> {selected.price > 0 ? `₹${selected.price}/hr` : "Free Community Session"} · <strong>Rating:</strong> {selected.rating || 4.9} ★ · <strong>Status:</strong> {selected.availabilityLabel}
                  </p>
                </div>
                <label>How would you like to be supported?
                  <select value={support} onChange={event => setSupport(event.target.value)}>
                    <option>Listen only</option>
                    <option>Help me reflect</option>
                    <option>Offer suggestions</option>
                  </select>
                </label>
                <label>Preferred Mode
                  <select value={mode} onChange={event => setMode(event.target.value)}>
                    <option>Chat</option>
                    <option>Voice (Encrypted WebRTC)</option>
                  </select>
                </label>
                <label>Context to include (confidential)
                  <textarea value={context} onChange={event => setContext(event.target.value)} maxLength={4000} placeholder="Share what is on your mind ahead of time so they can support you best…"/>
                </label>
                <button
                  className="button full"
                  disabled={busy}
                  onClick={requestPerson}
                >
                  {busy ? "Confirming…" : `Confirm Session with ${selected.name}`} <ArrowRight size={17}/>
                </button>
                <button className="outline-button" onClick={() => setSelected(null)}>Return to Directory</button>
              </>
            )}
            {circle && (() => {
              const item = circleFixtures.find(entry => entry.id === circle);
              if (!item) return null;
              const membership = circleMembership[item.id] || "none";
              return (
                <>
                  <div className="eyebrow">A SAATH CIRCLE</div>
                  <h2 id="modal-title">{item.name}</h2>
                  <p>{item.description}</p>
                  <ul className="simple-list">
                    {item.guidelines.map(rule => <li key={rule}><Check size={16}/> {rule}</li>)}
                  </ul>
                  <div className="sample-notice">This circle is a concept. It is not currently operating. Restricted posts would require approved membership.</div>
                  <button className="button full" onClick={() => {
                    const next = { ...circleMembership, [item.id]: membership === "requested" ? "requested" : "requested" };
                    setCircleMembership(next);
                    setCircleInterest(addCircleInterest(item.name));
                    flash("Membership request stored in this browser fixture. No live group was joined.");
                    setCircle(null);
                  }}>{membership === "requested" ? "Request already recorded" : "Request membership"}<Heart size={16}/></button>
                  <button className="quiet" onClick={() => {
                    setCircleMembership({ ...circleMembership, [item.id]: "left" });
                    flash("You left this exploration. Membership was never public.");
                    setCircle(null);
                  }}>Leave</button>
                </>
              );
            })()}
            {modal === "approach" && (
              <>
                <div className="eyebrow">A LITTLE SUPPORT. A LITTLE SAATH.</div>
                <h2 id="modal-title">You set the pace.</h2>
                <div className="approach-step"><span>01</span><div><h3>Start with what you need.</h3><p>A listener, professional support, or space to practise a conversation.</p></div></div>
                <div className="approach-step"><span>02</span><div><h3>Choose what to share.</h3><p>Your context is yours. Review it before any connection request.</p></div></div>
                <div className="approach-step"><span>03</span><div><h3>Make room to be heard.</h3><p>Talk at your pace. Pause, leave, or change your mind whenever you need.</p></div></div>
                <button className="button full" onClick={() => { setModal(null); go("connect"); }}>Explore Saath <ArrowRight size={17}/></button>
              </>
            )}
            {modal === "privacy" && (
              <>
                <div className="eyebrow">CLEAR BOUNDARIES</div>
                <h2 id="modal-title">Your story belongs to you.</h2>
                <p>Sample people and circles are fictional. Unsaved writing stays in this tab. Signed-in context and example requests are stored on the server and access is limited to their owner.</p>
                <p>AI rehearsal only sends text after you opt in. That text is processed by the configured external AI provider. There is no recording, voice calling, or end-to-end encryption claim in this preview.</p>
                <p>You can delete your context in My space. Previously viewed content cannot be unremembered by a person who already saw it. Live messaging, moderation, participant sharing, and professional verification still need the forthcoming schema and operating process.</p>
                <button className="button full" onClick={() => { setModal(null); go("space"); }}>Manage my context <ArrowRight size={17}/></button>
              </>
            )}
            {modal === "join" && (
              <>
                <div className="eyebrow">LISTENER DRAFT</div>
                <h2 id="modal-title">Listener onboarding is a draft.</h2>
                <p>Listener onboarding is a draft only. Applications are not open as a live directory.</p>
                <button className="button full" onClick={() => { setModal(null); go("onboard"); }}>Open the onboarding draft <ArrowRight size={17}/></button>
              </>
            )}
            {modal === "phrase" && (
              <>
                <div className="eyebrow">PREVIEW BEFORE SENDING</div>
                <h2 id="modal-title">This message has not been sent.</h2>
                <p>Recipient: {phrasePerson ? `${phrasePerson.name} (fictional AI personality, not a live person)` : "No available recipient"}.</p>
                <pre className="intro-preview">{phrase}</pre>
                <p className="small-print">Sample profiles cannot accept. A saved request would stay pending and would not notify anyone.</p>
                <button className="button full" onClick={() => {
                  setSelected(phrasePerson);
                  setContext(phrase);
                  setConsent(false);
                  setModal(null);
                  go("connect");
                  flash("Preview the request in Find a person. Nothing was sent.");
                }}>Continue to a request preview</button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AmbientProvider>
      <App/>
    </AmbientProvider>
  );
}
