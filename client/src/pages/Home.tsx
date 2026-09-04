/* Civic Signal reminder: keep this flow legible, calm, and interruptible. Surface amount, recipient, risk, spoken confirmation, and safe exits before any irreversible-looking action. */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  ContactRound,
  CreditCard,
  Download,
  Fingerprint,
  Hand,
  HeartHandshake,
  History,
  Home as HomeIcon,
  Languages,
  LifeBuoy,
  LockKeyhole,
  Menu,
  Mic,
  MoreHorizontal,
  PauseCircle,
  PhoneCall,
  Play,
  QrCode,
  ReceiptText,
  ScanLine,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TimerReset,
  Type,
  UserRoundCheck,
  Volume2,
  Vibrate,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Flow = "idle" | "recipient" | "review" | "confirm" | "success";
type Section = "home" | "history" | "safety" | "settings";

const downloadUrl = "/manus-storage/SafePay-Getting-Started_b1c23af2.html";

const transactions = [
  { name: "Meera Pharmacy", meta: "Today · 09:42 AM", amount: "₹680", status: "Protected", tone: "green" },
  { name: "Arjun Stores", meta: "Yesterday · 06:18 PM", amount: "₹2,400", status: "Reviewed", tone: "orange" },
  { name: "Electricity Board", meta: "12 Aug · 11:06 AM", amount: "₹1,250", status: "Verified", tone: "green" },
];

const copy = {
  English: {
    hello: "Good morning, Meena",
    dashboard: "Your payments, made safer.",
    send: "Send money",
    recent: "Recent payments",
    review: "Review payment",
    recipient: "Recipient",
  },
  Tamil: {
    hello: "காலை வணக்கம், மீனா",
    dashboard: "உங்கள் பணம், இன்னும் பாதுகாப்பாக.",
    send: "பணம் அனுப்பு",
    recent: "சமீபத்திய பணப்பரிமாற்றங்கள்",
    review: "பணப்பரிமாற்றத்தை சரிபார்",
    recipient: "பெறுநர்",
  },
};

function speak(text: string, language: "English" | "Tamil") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "Tamil" ? "ta-IN" : "en-IN";
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
  return true;
}

function vibrate(pattern: number | number[] = 80) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  const { user, isAuthenticated } = useAuth();

  const [section, setSection] = useState<Section>("home");
  const [flow, setFlow] = useState<Flow>("idle");
  const [language, setLanguage] = useState<"English" | "Tamil">("English");
  const [largeText, setLargeText] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [amount, setAmount] = useState("2400");
  const [recipient, setRecipient] = useState("Arjun Stores");
  const [upi, setUpi] = useState("arjun.stores@axis");
  const [pin, setPin] = useState("");
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [listening, setListening] = useState(false);
  const [paymentFrozen, setPaymentFrozen] = useState(false);
  const [transactionId, setTransactionId] = useState("DEMO-240818-0942");
  const [downloadPromptOpen, setDownloadPromptOpen] = useState(false);

  const strings = copy[language];
  const formattedAmount = useMemo(() => `₹${Number(amount || 0).toLocaleString("en-IN")}`, [amount]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const profileQuery = trpc.safepay.profile.useQuery(undefined, { enabled: isAuthenticated });
  const transactionsQuery = trpc.safepay.transactions.useQuery(undefined, { enabled: isAuthenticated });
  const contactsQuery = trpc.safepay.trustedContacts.useQuery(undefined, { enabled: isAuthenticated });
  const preferencesQuery = trpc.safepay.preferences.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const createTransactionMutation = trpc.safepay.createTransaction.useMutation({
    onSuccess: (saved) => { setTransactionId(saved?.id ? `SP-${saved.id}` : "DEMO-240818-0942"); void utils.safepay.transactions.invalidate(); notify("Payment saved to your history"); },
    onError: () => notify("Payment completed in demo mode, but could not be saved"),
  });
  const updatePreferencesMutation = trpc.safepay.updatePreferences.useMutation({
    onError: () => { notify("Preference could not be saved"); },
  });
  const addTrustedContactMutation = trpc.safepay.addTrustedContact.useMutation({
    onSuccess: () => { void utils.safepay.trustedContacts.invalidate(); notify("Trusted contact saved"); },
    onError: () => notify("Trusted contact could not be saved"),
  });
  const updateTrustedContactMutation = trpc.safepay.updateTrustedContact.useMutation({
    onSuccess: () => { void utils.safepay.trustedContacts.invalidate(); notify("Trusted contact updated"); },
    onError: () => notify("Trusted contact could not be updated"),
  });

  useEffect(() => {
    const promptKey = "safepay-download-prompt-seen";
    if (typeof window === "undefined" || window.sessionStorage.getItem(promptKey)) return;
    const timer = window.setTimeout(() => setDownloadPromptOpen(true), 850);
    window.sessionStorage.setItem(promptKey, "1");
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const preferences = preferencesQuery.data;
    if (!preferences) return;
    setLanguage(preferences.language);
    setLargeText(preferences.largeText);
    setSoundOn(preferences.voiceEnabled);
    setHapticsOn(preferences.hapticsEnabled);
  }, [preferencesQuery.data]);

  const savePreferences = (patch: { language?: "English" | "Tamil"; largeText?: boolean; voiceEnabled?: boolean; hapticsEnabled?: boolean }) => {
    if (isAuthenticated) updatePreferencesMutation.mutate(patch);
  };

  const displayTransactions = useMemo(() => {
    if (!isAuthenticated) return transactions;
    if (!transactionsQuery.data) return [];
    return transactionsQuery.data.map((item) => ({
      name: item.recipientName,
      meta: `${new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
      amount: `₹${item.amountInr.toLocaleString("en-IN")}`,
      status: item.status === "frozen" ? "Frozen" : item.status === "cancelled" ? "Cancelled" : item.riskLevel === "high" ? "Reviewed" : "Protected",
      tone: item.riskLevel === "high" ? "orange" : "green",
    }));
  }, [transactionsQuery.data, isAuthenticated]);

  const historyStats = useMemo(() => {
    if (!isAuthenticated) return { total: 18420, count: 12, pauses: 3 };
    const saved = transactionsQuery.data ?? [];
    return { total: saved.reduce((sum, item) => sum + item.amountInr, 0), count: saved.filter((item) => item.status === "completed").length, pauses: saved.filter((item) => item.riskLevel === "high").length };
  }, [transactionsQuery.data, isAuthenticated]);

  const displayContacts = useMemo(() => {
    if (isAuthenticated) return contactsQuery.data ?? [];
    return [{ name: "Ravi Krishnan", phone: "+91 98•• ••3210", relationship: "Son", isActive: true }];
  }, [contactsQuery.data, isAuthenticated]);

  const displayName = profileQuery.data?.name ?? user?.name ?? "Meena Krishnan";
  const profileMeta = profileQuery.data ? `Signed in account · ${profileQuery.data.email ?? "email not provided"}` : "Demo account · sign in to persist";
  const accountLabel = profileQuery.data?.accountLabel ?? "Demo account";
  const maskedAccount = profileQuery.data?.maskedAccount ?? "demo";

  const tactile = (pattern?: number | number[]) => {
    if (hapticsOn) vibrate(pattern);
  };

  const resetFlow = () => {
    setFlow("idle");
    setPin("");
    setPaymentFrozen(false);
  };

  const startListening = (text: string) => {
    setListening(true);
    const supported = soundOn && speak(text, language);
    tactile([35, 35, 65]);
    window.setTimeout(() => setListening(false), supported ? 4200 : 1000);
    if (!supported) notify("Audio preview is ready on supported devices");
  };

  const startPayment = () => {
    tactile([40, 30, 40]);
    setFlow("recipient");
  };

  const showHistory = () => {
    resetFlow();
    setSection("history");
  };

  return (
    <div className={largeText ? "app-shell text-large" : "app-shell"}>
      <header className="topbar">
        <div className="brand-lockup" aria-label="SafePay home">
          <div className="brand-mark"><img src="/manus-storage/safepay-mark_f9ebc968.png" alt="SafePay symbol" /></div>
          <span className="brand-safe">Safe</span><span className="brand-pay">Pay</span>
          <span className="demo-tag">{isAuthenticated ? "LIVE DATA" : "DEMO"}</span>
        </div>
        <div className="topbar-actions">
          {!isAuthenticated && <button className="login-button" onClick={() => startLogin()}>Sign in to save</button>}
          <a className="download-button" href={downloadUrl} download="SafePay-Getting-Started.html" onClick={() => setDownloadPromptOpen(false)}><Download size={16} /><span>Download</span><span lang="ta">பதிவிறக்கம்</span></a>
          <button className="language-pill" onClick={() => { setLanguage(language === "English" ? "Tamil" : "English"); notify(language === "English" ? "Tamil voice prompts selected" : "English voice prompts selected"); }} aria-label="Change language">
            <Languages size={17} /> {language === "English" ? "EN" : "தமிழ்"} <ChevronRight size={14} />
          </button>
          <button className="icon-button" onClick={() => notify("Notifications are clear")} aria-label="Notifications"><Bell size={19} /></button>
          <button className="avatar-button" onClick={() => setSection("settings")} aria-label="Open profile settings">M</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Main navigation">
          <div className="side-profile">
            <div className="profile-avatar">M</div>
            <div><p className="profile-name">{displayName}</p><p className="profile-meta">{profileMeta}</p></div>
            <button className="more-button" aria-label="More profile options" onClick={() => notify("Your profile is protected")}><MoreHorizontal size={18} /></button>
          </div>
          <div className="trust-chip"><span className="trust-dot" /> <span>Protection is on</span><ShieldCheck size={15} /></div>
          <nav className="nav-list">
            <button className={section === "home" ? "nav-item active" : "nav-item"} onClick={() => { resetFlow(); setSection("home"); }}><HomeIcon size={19} /><span>Overview</span></button>
            <button className={section === "history" ? "nav-item active" : "nav-item"} onClick={() => setSection("history")}><History size={19} /><span>Payment history</span><span className="nav-count">3</span></button>
            <button className={section === "safety" ? "nav-item active" : "nav-item"} onClick={() => setSection("safety")}><HeartHandshake size={19} /><span>Trusted people</span></button>
            <button className={section === "settings" ? "nav-item active" : "nav-item"} onClick={() => setSection("settings")}><Settings2 size={19} /><span>Accessibility</span></button>
          </nav>
          <div className="sidebar-bottom">
            <div className="help-card"><div className="help-icon"><LifeBuoy size={18} /></div><div><strong>Need help?</strong><span>Talk to SafePay support</span></div><ChevronRight size={16} /></div>
            <button className="kill-switch-link" onClick={() => setEmergencyOpen(true)}><ShieldAlert size={17} /> Emergency protection</button>
            <p className="sidebar-footnote">SafePay demo · No real money moves</p>
          </div>
        </aside>

        <main className="main-canvas">
          {section === "home" && <>
            <div className="main-heading">
              <div><p className="eyebrow">{flow === "idle" ? "Tuesday, 18 August 2026" : "SafePay / Payment review"}</p><h1>{flow === "idle" ? strings.dashboard : flow === "recipient" ? "Who are you paying?" : flow === "review" ? "Pause before you pay." : flow === "confirm" ? "One last check." : "Payment complete."}</h1><p className="heading-sub">{flow === "idle" ? `${strings.hello}. We’ll help you check every important detail.` : flow === "recipient" ? "Start with a person or a UPI ID. We will verify the details before you send." : flow === "review" ? "A careful second look can keep your money where it belongs." : flow === "confirm" ? "Your PIN stays private. SafePay never stores it." : "Your payment was recorded in this demo."}</p></div>
              {flow !== "idle" && <button className="back-link" onClick={resetFlow}><ArrowLeft size={16} /> Back to overview</button>}
            </div>

            {flow === "idle" && <Overview amount={formattedAmount} transactions={displayTransactions} isAuthenticated={isAuthenticated} accountLabel={accountLabel} maskedAccount={maskedAccount} transactionsLoading={isAuthenticated && transactionsQuery.isLoading} transactionsError={isAuthenticated && transactionsQuery.isError} onStart={startPayment} onHistory={showHistory} onListen={() => startListening("You have no new payment alerts. Your protection is on.")} listening={listening} language={language} />}
            {flow === "recipient" && <RecipientStep recipient={recipient} setRecipient={setRecipient} upi={upi} setUpi={setUpi} amount={amount} setAmount={setAmount} onContinue={() => { tactile(); setFlow("review"); }} onListen={() => startListening(`You are preparing a payment of ${formattedAmount} to ${recipient}.`)} listening={listening} />}
            {flow === "review" && <ReviewStep recipient={recipient} upi={upi} amount={formattedAmount} onListen={() => startListening(`You are sending ${formattedAmount} to ${recipient}, verified UPI ID ${upi}. The risk score is 78 out of 100. A similar payment was made three minutes ago. Is this correct?`)} listening={listening} onCancel={() => { tactile(40); resetFlow(); notify("Payment cancelled safely"); }} onContinue={() => { tactile([45, 30, 45]); setFlow("confirm"); }} />}
            {flow === "confirm" && <ConfirmStep recipient={recipient} amount={formattedAmount} pin={pin} setPin={setPin} onListen={() => startListening(`Final check. Send ${formattedAmount} to ${recipient}.`)} listening={listening} onConfirm={() => { tactile([40, 40, 90]); if (isAuthenticated) createTransactionMutation.mutate({ recipientName: recipient, upiId: upi, amountInr: Number(amount), riskScore: 78, riskLevel: "high", status: "completed", paymentMode: "pin", isDuplicate: true }); setFlow("success"); }} onFingerprint={() => { tactile([40, 40, 90]); if (isAuthenticated) createTransactionMutation.mutate({ recipientName: recipient, upiId: upi, amountInr: Number(amount), riskScore: 78, riskLevel: "high", status: "completed", paymentMode: "fingerprint", isDuplicate: true }); setFlow("success"); }} />}
            {flow === "success" && <SuccessStep recipient={recipient} amount={formattedAmount} transactionId={transactionId} onHistory={showHistory} onAgain={() => { resetFlow(); setFlow("recipient"); }} />}
          </>}

          {section === "history" && <HistoryView transactions={displayTransactions} totalSent={historyStats.total} protectedCount={historyStats.count} safetyPauses={historyStats.pauses} transactionsLoading={isAuthenticated && transactionsQuery.isLoading} transactionsError={isAuthenticated && transactionsQuery.isError} onBack={() => setSection("home")} onListen={(t) => startListening(t)} listening={listening} onEmergency={() => setEmergencyOpen(true)} />}
          {section === "safety" && <SafetyView contacts={displayContacts} contactsLoading={isAuthenticated && contactsQuery.isLoading} contactsError={isAuthenticated && contactsQuery.isError} onAdd={(input) => { if (isAuthenticated) addTrustedContactMutation.mutate(input); else notify("Sign in to save a trusted person"); }} onEdit={(contact) => { if (isAuthenticated && contact.id) updateTrustedContactMutation.mutate({ id: contact.id, name: contact.name, phone: contact.phone, relationship: contact.relationship, isActive: contact.isActive }); else notify("Sign in to edit trusted people"); }} onToggle={(contact) => { if (isAuthenticated && contact.id) updateTrustedContactMutation.mutate({ id: contact.id, name: contact.name, phone: contact.phone, relationship: contact.relationship, isActive: !contact.isActive }); else notify("Sign in to manage trusted people"); }} onBack={() => setSection("home")} onNotify={notify} />}
          {section === "settings" && <SettingsView largeText={largeText} setLargeText={(value) => { setLargeText(value); savePreferences({ largeText: value }); }} soundOn={soundOn} setSoundOn={(value) => { setSoundOn(value); savePreferences({ voiceEnabled: value }); }} hapticsOn={hapticsOn} setHapticsOn={(value) => { setHapticsOn(value); savePreferences({ hapticsEnabled: value }); }} language={language} setLanguage={(value) => { setLanguage(value); savePreferences({ language: value }); }} preferencesLoading={isAuthenticated && preferencesQuery.isLoading} preferencesError={isAuthenticated && preferencesQuery.isError} onBack={() => setSection("home")} onNotify={notify} />}
        </main>

        <aside className="safety-rail">
          <div className="rail-topline"><span className="rail-kicker"><span className="live-dot" /> LIVE PROTECTION</span><button className="rail-menu" aria-label="More safety options" onClick={() => notify("Protection settings are ready")}><MoreHorizontal size={19} /></button></div>
          <div className="rail-illustration"><img src="/manus-storage/safepay-safety-rail_e4839e92.png" alt="A paper lantern and phone inside an open shield" /></div>
          <h2>Safety is a conversation.</h2>
          <p className="rail-copy">SafePay explains the moment before money moves, in words you can see, hear, and feel.</p>
          <div className="rail-note"><div className="rail-note-icon"><AudioLines size={17} /></div><div><strong>Speak every payment</strong><span>Audio confirmation is always one tap away.</span></div></div>
          <div className="rail-note"><div className="rail-note-icon green"><UserRoundCheck size={17} /></div><div><strong>Someone has your back</strong><span>Ravi is your trusted contact for large payments.</span></div></div>
          <div className="rail-footer"><span><ShieldCheck size={15} /> Device protected</span><span>Last checked 2m ago</span></div>
        </aside>
      </div>

      <div className="mobile-nav"><button className={section === "home" ? "mobile-nav-item active" : "mobile-nav-item"} onClick={() => { resetFlow(); setSection("home"); }}><HomeIcon size={18} /><span>Home</span></button><button className={section === "history" ? "mobile-nav-item active" : "mobile-nav-item"} onClick={() => setSection("history")}><History size={18} /><span>History</span></button><button className="mobile-send" onClick={startPayment}><Send size={20} /><span>Pay</span></button><button className={section === "safety" ? "mobile-nav-item active" : "mobile-nav-item"} onClick={() => setSection("safety")}><HeartHandshake size={18} /><span>Trusted</span></button><button className={section === "settings" ? "mobile-nav-item active" : "mobile-nav-item"} onClick={() => setSection("settings")}><Settings2 size={18} /><span>More</span></button></div>

      {toast && <div className="toast" role="status"><Check size={17} /> {toast}</div>}
      {downloadPromptOpen && <div className="download-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadPromptOpen(false); }}><section className="download-modal" role="dialog" aria-modal="true" aria-labelledby="download-title"><button className="download-close" onClick={() => setDownloadPromptOpen(false)} aria-label="Close download prompt"><X size={18} /></button><div className="download-icon"><Download size={22} /></div><p className="eyebrow vermilion">SAFEPAY GUIDE</p><h2 id="download-title">Take SafePay with you.</h2><p>Download the bilingual getting-started guide for safer, more understandable payments.</p><p className="tamil-copy" lang="ta">பாதுகாப்பான பணப்பரிமாற்றங்களுக்கான வழிகாட்டியைப் பதிவிறக்கவும்.</p><div className="download-modal-actions"><a className="primary-button" href={downloadUrl} download="SafePay-Getting-Started.html" onClick={() => setDownloadPromptOpen(false)}><Download size={17} /> Download guide <span lang="ta">பதிவிறக்கம்</span></a><button className="secondary-button" onClick={() => setDownloadPromptOpen(false)}>Maybe later</button></div></section></div>}
      {emergencyOpen && <EmergencyModal onClose={() => setEmergencyOpen(false)} frozen={paymentFrozen} onFreeze={() => { tactile([100, 40, 100]); setPaymentFrozen(true); setEmergencyOpen(false); notify("Payment frozen. Your trusted contact was alerted."); }} />}
    </div>
  );
}

function Overview({ amount, transactions: visibleTransactions, isAuthenticated, accountLabel, maskedAccount, transactionsLoading, transactionsError, onStart, onHistory, onListen, listening, language }: { amount: string; transactions: Array<{ name: string; meta: string; amount: string; status: string; tone: string }>; isAuthenticated: boolean; accountLabel: string; maskedAccount: string; transactionsLoading: boolean; transactionsError: boolean; onStart: () => void; onHistory: () => void; onListen: () => void; listening: boolean; language: "English" | "Tamil" }) {
  return <div className="overview-stack">
    <section className="hero-grid">
      <div className="balance-card">
        <div className="balance-top"><span className="section-label">{isAuthenticated ? "SAFE PAY LEDGER" : "DEMO BALANCE"}</span><button className="eye-button" aria-label="Balance is visible"><LockKeyhole size={15} /> Protected</button></div>
        <p className="balance-amount">₹24,680<span>.00</span></p>
        <div className="balance-footer"><span><CreditCard size={15} /> {accountLabel} · {maskedAccount}</span><span className="balance-change">+ ₹3,240 this month</span></div>
        <div className="balance-rule" />
        <div className="balance-caption"><span>Ready when you are.</span><button onClick={onListen} className={listening ? "read-button listening" : "read-button"}><Volume2 size={16} /> {listening ? "Speaking…" : language === "Tamil" ? "படிக்கவும்" : "Read aloud"}</button></div>
      </div>
      <div className="send-card">
        <div className="send-card-head"><div className="send-icon"><Send size={19} /></div><span className="section-label">QUICK ACTION</span></div>
        <h2>Send money<br /><em>with confidence.</em></h2>
        <p>We’ll say the recipient’s name out loud before you confirm.</p>
        <button className="primary-button" onClick={onStart}>{language === "Tamil" ? "பணம் அனுப்பு" : "Send money"}<ArrowRight size={17} /></button>
        <button className="secondary-link" onClick={() => window.alert("QR scanning is represented in this demo. Choose Send money to try the safety flow.")}><QrCode size={16} /> Scan a QR code</button>
      </div>
    </section>

    <section className="signal-banner"><div className="signal-icon"><ShieldCheck size={20} /></div><div><strong>Your protection is working</strong><span>Every new recipient is checked before a payment can leave your account.</span></div><span className="signal-status">ON</span></section>

    <section className="accessibility-tray" aria-label="SafePay accessibility promises"><div className="accessibility-tray-label"><Accessibility size={17} /><span>BUILT FOR<br /><b>REAL LIFE</b></span></div><div className="accessibility-feature"><AudioLines size={17} /><span><b>Voice-first</b><small>Hear every important detail</small></span></div><div className="accessibility-feature"><Vibrate size={17} /><span><b>Feel the moment</b><small>Haptics on critical actions</small></span></div><div className="accessibility-feature"><Languages size={17} /><span><b>English · தமிழ்</b><small>Use the language you trust</small></span></div><div className="accessibility-feature"><Type size={17} /><span><b>Large text</b><small>Easy to read, never rushed</small></span></div></section>

    <section className="lower-grid">
      <div className="ledger-card">
        <div className="card-heading"><div><p className="eyebrow">THE LAST 7 DAYS</p><h2>{language === "Tamil" ? "சமீபத்திய பணப்பரிமாற்றங்கள்" : "Recent payments"}</h2></div><button className="text-button" onClick={onHistory}>See all <ArrowRight size={15} /></button></div>
        <div className="transaction-list">{transactionsLoading ? <div className="data-state"><Clock3 size={16} /> Loading saved payments…</div> : transactionsError ? <div className="data-state error"><AlertTriangle size={16} /> We could not load your saved payments.</div> : visibleTransactions.length === 0 ? <div className="data-state"><ReceiptText size={16} /> No saved payments yet. Your next protected payment will appear here.</div> : visibleTransactions.map((item) => <div className="transaction-row" key={item.name}><div className={item.tone === "orange" ? "transaction-avatar orange" : "transaction-avatar"}>{item.name.charAt(0)}</div><div className="transaction-name"><strong>{item.name}</strong><span>{item.meta}</span></div><div className="transaction-amount"><strong>{item.amount}</strong><span className={item.tone === "orange" ? "status orange-text" : "status"}><span className="status-dot" /> {item.status}</span></div><ChevronRight className="row-chevron" size={17} /></div>)}</div>
      </div>
      <div className="confidence-card"><div className="confidence-mark"><Sparkles size={17} /></div><p className="eyebrow">SAFE PAY SCORE</p><div className="score-row"><strong>92</strong><span>/100</span><div className="score-ring"><span /></div></div><p>You’re using SafePay the right way: checking, listening, and taking your time.</p><div className="confidence-progress"><span /></div><span className="confidence-foot">3 safety checks this week</span></div>
    </section>
    <div className="demo-disclaimer"><CircleHelp size={15} /><span>{isAuthenticated ? "SafePay is persisting your payment records and preferences. Bank balance and payment settlement remain illustrative in this prototype." : "This is a clickable product demo. Sign in to persist payment records, trusted contacts, and preferences."}</span></div>
  </div>;
}

function RecipientStep({ recipient, setRecipient, upi, setUpi, amount, setAmount, onContinue, onListen, listening }: { recipient: string; setRecipient: (s: string) => void; upi: string; setUpi: (s: string) => void; amount: string; setAmount: (s: string) => void; onContinue: () => void; onListen: () => void; listening: boolean }) {
  return <div className="flow-wrap"><div className="step-indicator"><span className="step active">1</span><span className="step-line active" /><span className="step">2</span><span className="step-line" /><span className="step">3</span><span className="step-caption">Recipient → Review → Confirm</span></div><div className="flow-card recipient-card"><div className="flow-card-header"><div><p className="eyebrow">STEP 1 OF 3</p><h2>Tell us who to pay.</h2></div><div className="flow-icon"><ContactRound size={22} /></div></div><label className="field-label" htmlFor="recipient">Person or business name</label><div className="input-wrap"><ContactRound size={18} /><input id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} aria-label="Recipient name" /></div><label className="field-label" htmlFor="upi">UPI ID <span>optional</span></label><div className="input-wrap"><AtSymbol /><input id="upi" value={upi} onChange={(e) => setUpi(e.target.value)} aria-label="UPI ID" /></div><label className="field-label" htmlFor="amount">Amount</label><div className="amount-input-wrap"><span>₹</span><input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} aria-label="Amount" /><span className="amount-suffix">INR</span></div><div className="form-hint"><ShieldCheck size={15} /> The recipient name is checked against their bank account.</div><div className="flow-actions"><button className="secondary-button" onClick={onListen}><Volume2 size={17} /> {listening ? "Speaking…" : "Read my details"}</button><button className="primary-button" onClick={onContinue}>Review payment <ArrowRight size={17} /></button></div></div><div className="side-tip"><div className="tip-icon"><Hand size={18} /></div><div><strong>Take your time.</strong><span>There is no rush to send money. SafePay will wait for you.</span></div></div></div>;
}

function ReviewStep({ recipient, upi, amount, onListen, listening, onCancel, onContinue }: { recipient: string; upi: string; amount: string; onListen: () => void; listening: boolean; onCancel: () => void; onContinue: () => void }) {
  return <div className="flow-wrap"><div className="step-indicator"><span className="step done"><Check size={14} /></span><span className="step-line active" /><span className="step active">2</span><span className="step-line" /><span className="step">3</span><span className="step-caption">Recipient → Review → Confirm</span></div><div className="review-layout"><div className="flow-card review-main"><div className="review-heading"><div><p className="eyebrow">STEP 2 OF 3 · BANK VERIFIED</p><h2>Check every detail.</h2></div><button className={listening ? "read-button listening large" : "read-button large"} onClick={onListen}><Volume2 size={17} /> {listening ? "Speaking…" : "Read aloud"}</button></div><div className="payment-summary"><div className="verified-line"><div className="verified-avatar">A</div><div><span className="summary-label">You are paying</span><strong>{recipient}</strong><span className="verified-name"><ShieldCheck size={14} /> Name verified by bank</span></div><UserRoundCheck className="verified-check" size={22} /></div><div className="summary-divider" /><div className="summary-amount"><span>Amount</span><strong>{amount}</strong></div><div className="summary-meta"><span>UPI ID</span><strong>{upi}</strong></div></div><div className="duplicate-alert"><div className="duplicate-icon"><TimerReset size={19} /></div><div><strong>Similar payment found</strong><p>You sent <b>₹2,400</b> to this recipient 3 minutes ago. Check that you are not paying twice.</p></div></div><div className="review-actions"><button className="cancel-button" onClick={onCancel}><X size={17} /> Cancel payment</button><button className="primary-button" onClick={onContinue}>Continue safely <ArrowRight size={17} /></button></div></div><div className="risk-panel"><div className="risk-top"><div><p className="eyebrow vermilion">SAFETY CHECK</p><h3>Pause here.</h3></div><span className="risk-score">78<span>/100</span></span></div><p className="risk-lead">We found something worth checking before you continue.</p><div className="risk-meter"><span /></div><span className="risk-label"><AlertTriangle size={14} /> Needs your attention</span><ul className="risk-reasons"><li><span className="reason-icon orange"><Clock3 size={15} /></span><span><b>New recipient</b><small>First payment to this UPI ID</small></span></li><li><span className="reason-icon orange"><TimerReset size={15} /></span><span><b>Duplicate pattern</b><small>Same amount sent 3 minutes ago</small></span></li><li><span className="reason-icon green"><ShieldCheck size={15} /></span><span><b>Bank name matches</b><small>Recipient identity is verified</small></span></li></ul><div className="risk-foot"><ShieldAlert size={15} /> No payment has been made yet.</div></div></div><div className="voice-strip"><div className="voice-strip-icon"><AudioLines size={18} /></div><span><strong>SafePay will say:</strong> “You are sending {amount} to {recipient}. Is this correct?”</span><button onClick={onListen} aria-label="Play payment confirmation"><Play size={15} fill="currentColor" /></button></div></div>;
}

function ConfirmStep({ recipient, amount, pin, setPin, onListen, listening, onConfirm, onFingerprint }: { recipient: string; amount: string; pin: string; setPin: (s: string) => void; onListen: () => void; listening: boolean; onConfirm: () => void; onFingerprint: () => void }) {
  return <div className="flow-wrap"><div className="step-indicator"><span className="step done"><Check size={14} /></span><span className="step-line active" /><span className="step done"><Check size={14} /></span><span className="step-line active" /><span className="step active">3</span><span className="step-caption">Recipient → Review → Confirm</span></div><div className="confirm-layout"><div className="flow-card confirm-card"><div className="confirm-lock"><LockKeyhole size={24} /></div><p className="eyebrow">STEP 3 OF 3 · PRIVATE</p><h2>Confirm with your PIN.</h2><p className="confirm-copy">You are sending <strong>{amount}</strong> to <strong>{recipient}</strong>.</p><button className={listening ? "read-button listening large centered" : "read-button large centered"} onClick={onListen}><Volume2 size={17} /> {listening ? "Speaking…" : "Hear this again"}</button><label className="field-label pin-label" htmlFor="pin">Enter demo PIN</label><input className="pin-input" id="pin" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))} placeholder="••••" aria-label="Demo PIN" /><button className="primary-button confirm-button" onClick={onConfirm}><LockKeyhole size={17} /> Confirm demo payment</button><button className="biometric-button" onClick={onFingerprint}><Fingerprint size={18} /> Use fingerprint instead</button><p className="private-note"><LockKeyhole size={13} /> This prototype never sends or stores a real PIN.</p></div><div className="confirm-side"><div className="side-tip"><div className="tip-icon green"><ShieldCheck size={18} /></div><div><strong>Your bank details stay private.</strong><span>This screen is the last step. Nothing happens until you choose confirm.</span></div></div><div className="quiet-card"><AudioLines size={18} /><span>Voice, large text, and haptic cues are on for this review.</span></div></div></div></div>;
}

function SuccessStep({ recipient, amount, transactionId, onHistory, onAgain }: { recipient: string; amount: string; transactionId: string; onHistory: () => void; onAgain: () => void }) {
  return <div className="flow-wrap success-wrap"><div className="success-card"><div className="success-burst"><Check size={34} strokeWidth={2.5} /></div><p className="eyebrow green-text">PAYMENT PROTECTED</p><h2>Payment sent safely.</h2><p className="success-copy">Your demo payment of <strong>{amount}</strong> to <strong>{recipient}</strong> was completed after the safety check.</p><div className="success-receipt"><div><span>Transaction ID</span><strong>{transactionId}</strong></div><div><span>Protection used</span><strong><ShieldCheck size={15} /> Voice · Haptic · Risk check</strong></div></div><div className="success-actions"><button className="primary-button" onClick={onHistory}>View payment history <ArrowRight size={17} /></button><button className="secondary-button" onClick={onAgain}>Send another payment</button></div><div className="demo-disclaimer"><CircleHelp size={15} /><span>Demo only · No real money moved</span></div></div><div className="success-bottom"><div><ShieldCheck size={18} /><span><strong>Good call checking first.</strong> That is how safer payments become a habit.</span></div><button className="text-button">Download receipt <ReceiptText size={15} /></button></div></div>;
}

function HistoryView({ transactions: visibleTransactions, totalSent, protectedCount, safetyPauses, transactionsLoading, transactionsError, onBack, onListen, listening, onEmergency }: { transactions: Array<{ name: string; meta: string; amount: string; status: string; tone: string }>; totalSent: number; protectedCount: number; safetyPauses: number; transactionsLoading: boolean; transactionsError: boolean; onBack: () => void; onListen: (t: string) => void; listening: boolean; onEmergency: () => void }) {
  return <div className="subpage"><div className="subpage-head"><div><p className="eyebrow">YOUR MONEY TRAIL</p><h1>Payment history</h1><p className="heading-sub">Each entry includes the safety checks that protected it.</p></div><button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Back to overview</button></div><div className="history-summary"><div><span>Total sent this month</span><strong>₹{totalSent.toLocaleString("en-IN")}</strong></div><div><span>Payments protected</span><strong>{protectedCount} <small>/ {protectedCount}</small></strong></div><div><span>Safety pauses</span><strong className="orange-text">{safetyPauses}</strong></div></div><div className="history-list">{transactionsLoading && <div className="data-state"><Clock3 size={16} /> Loading saved payments…</div>}{transactionsError && <div className="data-state error"><AlertTriangle size={16} /> We could not load your saved payments.</div>}{!transactionsLoading && !transactionsError && visibleTransactions.length === 0 && <div className="data-state"><ReceiptText size={16} /> No saved payments yet. Protected transactions will appear here.</div>}{!transactionsLoading && !transactionsError && visibleTransactions.map((item, index) => <div className="history-row" key={item.name}><div className="transaction-avatar">{item.name.charAt(0)}</div><div className="transaction-name"><strong>{item.name}</strong><span>{item.meta} · UPI</span></div><div className="history-protection"><ShieldCheck size={15} /><span>{index === 1 ? "Risk reviewed" : "Bank verified"}</span></div><div className="transaction-amount"><strong>{item.amount}</strong><span className="status"><span className="status-dot" /> {item.status}</span></div><button className={listening ? "icon-button selected" : "icon-button"} onClick={() => onListen(`${item.name}. ${item.amount}. ${item.status}. ${item.meta}.`)} aria-label={`Read ${item.name} payment aloud`}>{listening ? <AudioLines size={17} /> : <Volume2 size={17} />}</button><ChevronRight className="row-chevron" size={17} /></div>)}</div><div className="history-help"><div className="help-icon"><ShieldAlert size={18} /></div><div><strong>Something looks wrong?</strong><span>Use Emergency protection within 60 seconds to freeze a payment and alert Ravi.</span></div><button className="secondary-button" onClick={onEmergency}>Open protection</button></div></div>;
}

function SafetyView({ contacts, contactsLoading, contactsError, onAdd, onEdit, onToggle, onBack, onNotify }: { contacts: Array<{ id?: number; name: string; phone: string; relationship: string; isActive: boolean }>; contactsLoading: boolean; contactsError: boolean; onAdd: (input: { name: string; phone: string; relationship: string }) => void; onEdit: (contact: { id?: number; name: string; phone: string; relationship: string; isActive: boolean }) => void; onToggle: (contact: { id?: number; name: string; phone: string; relationship: string; isActive: boolean }) => void; onBack: () => void; onNotify: (s: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [editingContact, setEditingContact] = useState<{ id: number; name: string; phone: string; relationship: string; isActive: boolean } | null>(null);
  const resetContactForm = () => { setAdding(false); setEditingContact(null); setName(""); setPhone(""); setRelationship(""); };
  const beginEdit = (contact: { id?: number; name: string; phone: string; relationship: string; isActive: boolean }) => {
    if (!contact.id) { onNotify("Sign in to edit trusted people"); return; }
    setEditingContact({ ...contact, id: contact.id }); setName(contact.name); setPhone(contact.phone); setRelationship(contact.relationship); setAdding(true);
  };
  const submitContact = () => {
    if (!name.trim() || !phone.trim() || !relationship.trim()) { onNotify("Add a name, phone number, and relationship"); return; }
    const payload = { name: name.trim(), phone: phone.trim(), relationship: relationship.trim() };
    if (editingContact) onEdit({ ...editingContact, ...payload }); else onAdd(payload);
    resetContactForm();
  };
  return <div className="subpage"><div className="subpage-head"><div><p className="eyebrow">YOUR SAFETY NET</p><h1>Trusted people</h1><p className="heading-sub">The people you choose can be alerted when a payment needs a second pair of eyes.</p></div><button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Back to overview</button></div><div className="trusted-hero"><div><div className="trusted-icon"><HeartHandshake size={22} /></div><p className="eyebrow">TRUSTED CONTACTS</p><h2>Your safety net,<br /><em>on your terms.</em></h2><p>Only high-value or high-risk payment alerts are shared. You are always in control.</p></div><img src="/manus-storage/safepay-onboarding_90252242.png" alt="An older woman and her daughter looking at a phone together" /></div><div className="trusted-grid">{contactsLoading ? <div className="data-state compact"><Clock3 size={16} /> Loading trusted people…</div> : contactsError ? <div className="data-state compact error"><AlertTriangle size={16} /> We could not load trusted people.</div> : contacts.length ? contacts.map((contact) => <div className="trusted-person" key={`${contact.name}-${contact.phone}`}><div className="trusted-person-avatar">{contact.name.charAt(0)}</div><div><strong>{contact.name}</strong><span>{contact.relationship} · {contact.phone}</span></div><button className="contact-status-button" onClick={() => onToggle(contact)}>{contact.isActive ? "Active" : "Paused"}</button><button className="more-button" onClick={() => beginEdit(contact)} aria-label={`Edit ${contact.name}`}><MoreHorizontal size={18} /></button></div>) : <div className="data-state compact"><HeartHandshake size={16} /> No trusted contacts saved yet.</div>}{!adding ? <button className="add-contact" onClick={() => setAdding(true)}><div className="add-icon">+</div><div><strong>{contacts.length ? "Add another trusted person" : "Add a trusted person"}</strong><span>{contacts.length ? "Save a second pair of eyes" : "Save your first trusted contact"}</span></div><ChevronRight size={17} /></button> : <div className="contact-form"><p className="eyebrow">{editingContact ? "EDIT TRUSTED PERSON" : "NEW TRUSTED PERSON"}</p><label className="field-label" htmlFor="trusted-name">Name</label><input id="trusted-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ravi Krishnan" /><label className="field-label" htmlFor="trusted-phone">Phone</label><input id="trusted-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98•• ••3210" /><label className="field-label" htmlFor="trusted-relationship">Relationship</label><input id="trusted-relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Son" /><div className="contact-form-actions"><button className="secondary-button" onClick={resetContactForm}>Cancel</button><button className="primary-button" onClick={submitContact}>{editingContact ? "Update contact" : "Save contact"} <Check size={16} /></button></div></div>}</div><div className="settings-panel"><div><strong>Alert threshold</strong><span>Notify trusted people when a payment is over</span></div><strong className="threshold">₹10,000 <ChevronRight size={16} /></strong></div></div>;
}

function SettingsView({ largeText, setLargeText, soundOn, setSoundOn, hapticsOn, setHapticsOn, language, setLanguage, preferencesLoading, preferencesError, onBack, onNotify }: { largeText: boolean; setLargeText: (v: boolean) => void; soundOn: boolean; setSoundOn: (v: boolean) => void; hapticsOn: boolean; setHapticsOn: (v: boolean) => void; language: "English" | "Tamil"; setLanguage: (v: "English" | "Tamil") => void; preferencesLoading: boolean; preferencesError: boolean; onBack: () => void; onNotify: (s: string) => void }) {
  return <div className="subpage"><div className="subpage-head"><div><p className="eyebrow">MAKE IT YOURS</p><h1>Accessibility</h1><p className="heading-sub">SafePay is designed to be seen, heard, and felt.</p></div><button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Back to overview</button></div><div className="accessibility-grid"><div className="accessibility-preview"><div className="preview-top"><span className="preview-dot" /><span>PREVIEW</span><Accessibility size={18} /></div><div className="preview-payment"><span>Sending to</span><strong>Arjun Stores</strong><b>₹2,400</b><button className="read-button" onClick={() => onNotify("Preview audio is ready") }><Volume2 size={16} /> Read aloud</button></div></div><div className="preferences-card"><div className="card-heading"><div><p className="eyebrow">YOUR PREFERENCES</p><h2>How SafePay speaks to you</h2></div></div>{preferencesLoading && <div className="data-state compact"><Clock3 size={15} /> Loading saved preferences…</div>}{preferencesError && <div className="data-state compact error"><AlertTriangle size={15} /> Preferences could not be loaded.</div>}<SettingRow icon={<Accessibility size={18} />} title="Large text mode" description="Keep important details easy to read" enabled={largeText} onToggle={() => setLargeText(!largeText)} /><SettingRow icon={<Volume2 size={18} />} title="Voice confirmations" description="Hear payment details before sending" enabled={soundOn} onToggle={() => setSoundOn(!soundOn)} /><SettingRow icon={<Vibrate size={18} />} title="Haptic feedback" description="Feel a small cue on critical actions" enabled={hapticsOn} onToggle={() => setHapticsOn(!hapticsOn)} /><div className="setting-language"><div className="setting-icon"><Languages size={18} /></div><div><strong>Voice language</strong><span>Choose the language you understand best</span></div><select value={language} onChange={(e) => { setLanguage(e.target.value as "English" | "Tamil"); onNotify(`${e.target.value} voice prompts selected`); }} aria-label="Voice language"><option>English</option><option>Tamil</option></select></div></div></div><div className="accessibility-note"><Mic size={18} /><div><strong>Try saying: “Read my last payment.”</strong><span>Voice navigation is coming next. For now, every important payment detail has a Read aloud button.</span></div></div></div>;
}

function SettingRow({ icon, title, description, enabled, onToggle }: { icon: React.ReactNode; title: string; description: string; enabled: boolean; onToggle: () => void }) {
  return <div className="setting-row"><div className="setting-icon">{icon}</div><div><strong>{title}</strong><span>{description}</span></div><button className={enabled ? "toggle on" : "toggle"} onClick={onToggle} aria-pressed={enabled} aria-label={`Toggle ${title}`}><span /></button></div>;
}

function EmergencyModal({ onClose, onFreeze, frozen }: { onClose: () => void; onFreeze: () => void; frozen: boolean }) {
  return <div className="modal-backdrop" role="presentation"><div className="emergency-modal" role="dialog" aria-modal="true" aria-labelledby="emergency-title"><button className="modal-close" onClick={onClose} aria-label="Close emergency protection"><X size={19} /></button><div className="emergency-icon"><ShieldAlert size={26} /></div><p className="eyebrow vermilion">EMERGENCY PROTECTION</p><h2 id="emergency-title">Pause the payment now?</h2><p className="modal-copy">If you think a payment was fraudulent, SafePay can freeze it and alert Ravi immediately. You have 60 seconds to act.</p><div className="emergency-payment"><div className="transaction-avatar orange">A</div><div><strong>Arjun Stores</strong><span>₹2,400 · Just now</span></div><AlertTriangle size={18} /></div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Keep payment</button><button className="danger-button" onClick={onFreeze}><ShieldAlert size={17} /> Freeze & alert Ravi</button></div><div className="modal-foot"><PhoneCall size={14} /> For a real incident, contact your bank and local cybercrime helpline.</div></div></div>;
}

function AtSymbol() { return <span className="at-symbol">@</span>; }
