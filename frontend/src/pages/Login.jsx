import {Link} from "react-router-dom";
import {createElement, useEffect, useRef, useState} from "react";

/* ==================================================================
   E-Voting System: Login page (v6, "Indelible Ink" redesign)
   Needs: React 18+, Tailwind CSS (dark mode follows OS setting).

   FONTS: ye 2 lines apne index.html ke <head> mein daalo (JSX ke andar nahi):
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@600;700&display=swap" rel="stylesheet">

   AUTH: token HttpOnly cookie mein; response body mein sirf { role }.
   BACKEND / API logic: bilkul same hai, kuch nahi badla. Sirf UI badli hai.
   Extras (v6): shuffled on-screen PIN keypad, tricolor progress bar, error shake.
   Extras (v5): English / हिन्दी toggle (choice yaad rehti hai), Hindi fonts upar wali link mein.
   Extras (v4): hero fingerprint form ke saath "jaagta" hai, cursor parallax, PIN dots,
   aur login success par "Verified" ink-stamp screen (navigate ~1.3s baad hota hai).
   ================================================================== */

const API_BASE = "";
const ROLE_ROUTES = {VOTER: "/voter/dashboard", ADMIN: "/admin/dashboard"};
const HELPLINE = "1800-123-4567";
const SUPPORT_EMAIL = "support@evoting.gov.in";
const MOBILE_RE = /^\d{10}$/;
const PIN_RE = /^\d{4,6}$/;
const TEXT_SIZE_KEY = "textSize";
const LANG_KEY = "lang";
const TEXT_SIZE_MIN = 90;
const TEXT_SIZE_MAX = 120;

const FOOTER_LINKS = [
    {key: "help", href: "/help"},
    {key: "privacy", href: "/privacy"},
    {key: "terms", href: "/terms"},
    {key: "accessibility", href: "/accessibility"},
    {key: "contact", href: "/contact"},
];

const sans = {fontFamily: "'Public Sans', 'Noto Sans Devanagari', system-ui, -apple-system, 'Segoe UI', sans-serif"};
const serif = {fontFamily: "'Source Serif 4', 'Noto Serif Devanagari', Georgia, 'Times New Roman', serif"};

/* ---------- Text size helpers ---------- */
function readStoredTextSize() {
    try {
        const n = Number(localStorage.getItem(TEXT_SIZE_KEY));
        return n >= TEXT_SIZE_MIN && n <= TEXT_SIZE_MAX ? n : 100;
    } catch {
        return 100;
    }
}

function readStoredLang() {
    try {
        const v = localStorage.getItem(LANG_KEY);
        if (v === "en" || v === "hi") return v;
    } catch { /* ignore */ }
    return typeof navigator !== "undefined" && /^hi/i.test(navigator.language || "") ? "hi" : "en";
}

/** App root (main.jsx / App.jsx) mein ek baar call karo. */
export function applyStoredTextSize() {
    if (typeof document === "undefined") return;
    document.documentElement.style.fontSize = `${readStoredTextSize()}%`;
}

/* ---------- API: PIN login (POST /api/auth/login -> { role }) ---------- */
async function loginWithPin({contactNo, pin}) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({contactNo, pin}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || "Login failed");
        err.status = res.status;
        throw err;
    }
    return data;
}

/* ---------- API: Fingerprint (WebAuthn) login ---------- */
function b64uToBuf(s) {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
}

function bufToB64u(buf) {
    let s = "";
    new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function loginWithFingerprint({contactNo}) {
    const optRes = await fetch(`${API_BASE}/api/auth/webauthn/options`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({contactNo}),
    });
    const optJson = await optRes.json().catch(() => ({}));
    if (!optRes.ok) {
        const err = new Error(optJson.message || "Fingerprint login failed");
        err.status = optRes.status;
        throw err;
    }
    const options = optJson.publicKey ?? optJson;
    options.challenge = b64uToBuf(options.challenge);
    (options.allowCredentials || []).forEach((c) => (c.id = b64uToBuf(c.id)));

    const cred = await navigator.credentials.get({publicKey: options});

    const res = await fetch(
        `${API_BASE}/api/auth/webauthn/login?contactNo=${encodeURIComponent(contactNo)}`,
        {
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                id: cred.id,
                rawId: bufToB64u(cred.rawId),
                type: cred.type,
                response: {
                    authenticatorData: bufToB64u(cred.response.authenticatorData),
                    clientDataJSON: bufToB64u(cred.response.clientDataJSON),
                    signature: bufToB64u(cred.response.signature),
                    userHandle: cred.response.userHandle ? bufToB64u(cred.response.userHandle) : null,
                },
                clientExtensionResults: cred.getClientExtensionResults(),
            }),
        }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || "Fingerprint login failed");
        err.status = res.status;
        throw err;
    }
    return data;
}

function toBanner(err, t) {
    if (err.status === 400 && err.message) return {type: "error", text: err.message};
    if (err.status === 401 || err.status === 404) return {type: "error", text: t.eInvalid};
    if (err.status === 423)
        return {
            type: "locked",
            text: err.message && err.message !== "Login failed" ? err.message : t.eLocked,
        };
    if (err.status === 429) return {type: "error", text: t.eTooMany};
    if (err.name === "NotAllowedError") return {type: "error", text: t.eFp};
    if (err.code === "NOT_CONNECTED") return {type: "error", text: err.message};
    if (err instanceof TypeError) return {type: "error", text: t.eNetwork};
    return {type: "error", text: t.eGeneric};
}

/* ==================================================================
   UI ONLY (neeche sab kuch design hai, logic upar wala hi hai)
   ================================================================== */

/* ---------- Text (English / हिन्दी) ---------- */
const T = {
    en: {
        otherLang: "hi", tagLang: "hi", docTitle: "Log in | E-Voting System",
        skip: "Skip to main content", langLabel: "Language", textSize: "Text size",
        smaller: "Decrease text size", normal: "Default text size", larger: "Increase text size",
        brandName: "E-Voting System", brandPre: "ई-मतदान प्रणाली", brandSub: "National Digital Voting Portal",
        headline: "Vote securely from anywhere in the country.",
        tagline: "आपका वोट, आपकी स्याही। पूरी तरह गोपनीय।",
        heroText: "Log in to see the elections open to you and cast your vote. Your choice stays secret.",
        trust: [
            ["Only verified voters", "Your identity is checked once, at registration. Nobody else can log in as you."],
            ["A vote that can't be traced", "Your ballot uses an anonymous token, never linked to your name or mobile number."],
            ["Skip the PIN", "On supported devices, log in with your fingerprint instead."],
        ],
        safeTitle: "Keep your vote safe",
        safe: [
            "Never share your PIN or OTP. Election officials will never ask for it.",
            "Log out after voting, especially on a shared or public device.",
            "Use only the official portal address shown in your browser.",
        ],
        helpline: "Toll-free helpline",
        loginTitle: "Log in to vote",
        loginSub: "Use your registered mobile number. Fields marked * are required.",
        mobile: "Mobile number", mobilePh: "10-digit mobile number",
        pin: "PIN", pinPh: "4 to 6 digit PIN", forgot: "Forgot PIN?", show: "Show PIN", hide: "Hide PIN",
        login: "Log in", loggingIn: "Logging in", or: "or",
        keypad: "Use on-screen keypad", keypadHide: "Hide keypad", clear: "Clear", del: "Delete last digit",
        keypadNote: "Digits change places each time you open the keypad.",
        fp: "Log in with fingerprint", fpWait: "Touch the sensor",
        fpUnsupported: "Fingerprint login isn't supported on this browser or device.",
        fpNeedMobile: "Enter your mobile number to use fingerprint login.",
        mobileEmpty: "Enter your 10-digit mobile number.", mobileShort: "Mobile number must be 10 digits.",
        pinEmpty: "Enter your PIN.", pinBad: "PIN must be 4 to 6 digits.",
        newVoter: "New voter?", register: "Register here",
        needHelp: "Need help? Call", hours: "Mon to Sat, 9 AM to 6 PM", orWrite: "or write to",
        eInvalid: "Invalid mobile number or PIN.",
        eLocked: "Account locked after too many wrong attempts. Try again later or reset your PIN.",
        eTooMany: "Too many attempts. Please wait a few minutes and try again.",
        eFp: "Fingerprint check was cancelled or failed. Try again or use your PIN.",
        eNetwork: "Can't reach the server. Check your connection and try again.",
        eGeneric: "Something went wrong. Please try again.",
        doneTitle: "You're verified", doneText: "Taking you to your dashboard.",
        footer: {help: "Help", privacy: "Privacy policy", terms: "Terms of use", accessibility: "Accessibility statement", contact: "Contact us"},
        footerNote: "Content owned and maintained by the E-Voting System project team. Best viewed on the latest version of Chrome, Edge, Firefox or Safari.",
    },
    hi: {
        otherLang: "en", tagLang: "en", docTitle: "लॉग इन | ई-मतदान प्रणाली",
        skip: "मुख्य सामग्री पर जाएँ", langLabel: "भाषा", textSize: "अक्षर का आकार",
        smaller: "अक्षर छोटे करें", normal: "सामान्य अक्षर आकार", larger: "अक्षर बड़े करें",
        brandName: "ई-मतदान प्रणाली", brandPre: "E-Voting System", brandSub: "राष्ट्रीय डिजिटल मतदान पोर्टल",
        headline: "देश में कहीं से भी सुरक्षित मतदान करें।",
        tagline: "Your vote, your ink. Completely secret.",
        heroText: "लॉग इन करके देखें कि आपके लिए कौन से चुनाव खुले हैं और अपना वोट डालें। आपकी पसंद गोपनीय रहती है।",
        trust: [
            ["केवल सत्यापित मतदाता", "आपकी पहचान की जाँच पंजीकरण के समय एक बार होती है। आपकी जगह कोई और लॉग इन नहीं कर सकता।"],
            ["ऐसा वोट जिसका पता नहीं चलता", "आपका मतपत्र एक गुमनाम टोकन का उपयोग करता है, जो आपके नाम या मोबाइल नंबर से कभी नहीं जुड़ता।"],
            ["PIN की जगह फ़िंगरप्रिंट", "समर्थित उपकरणों पर PIN के बजाय अपनी फ़िंगरप्रिंट से लॉग इन करें।"],
        ],
        safeTitle: "अपना वोट सुरक्षित रखें",
        safe: [
            "अपना PIN या OTP कभी साझा न करें। चुनाव अधिकारी इसे कभी नहीं माँगेंगे।",
            "मतदान के बाद लॉग आउट करें, खासकर साझा या सार्वजनिक उपकरण पर।",
            "ब्राउज़र में दिखने वाले आधिकारिक पोर्टल पते का ही उपयोग करें।",
        ],
        helpline: "टोल-फ़्री हेल्पलाइन",
        loginTitle: "वोट देने के लिए लॉग इन करें",
        loginSub: "अपना पंजीकृत मोबाइल नंबर उपयोग करें। * वाले फ़ील्ड ज़रूरी हैं।",
        mobile: "मोबाइल नंबर", mobilePh: "10 अंकों का मोबाइल नंबर",
        pin: "PIN", pinPh: "4 से 6 अंकों का PIN", forgot: "PIN भूल गए?", show: "PIN दिखाएँ", hide: "PIN छिपाएँ",
        login: "लॉग इन", loggingIn: "लॉग इन हो रहा है", or: "या",
        keypad: "ऑन-स्क्रीन कीपैड उपयोग करें", keypadHide: "कीपैड छिपाएँ", clear: "मिटाएँ", del: "आखिरी अंक हटाएँ",
        keypadNote: "कीपैड खोलने पर हर बार अंकों की जगह बदल जाती है।",
        fp: "फ़िंगरप्रिंट से लॉग इन करें", fpWait: "सेंसर को छुएँ",
        fpUnsupported: "इस ब्राउज़र या उपकरण पर फ़िंगरप्रिंट लॉग इन उपलब्ध नहीं है।",
        fpNeedMobile: "फ़िंगरप्रिंट लॉग इन के लिए अपना मोबाइल नंबर दर्ज करें।",
        mobileEmpty: "अपना 10 अंकों का मोबाइल नंबर दर्ज करें।", mobileShort: "मोबाइल नंबर 10 अंकों का होना चाहिए।",
        pinEmpty: "अपना PIN दर्ज करें।", pinBad: "PIN 4 से 6 अंकों का होना चाहिए।",
        newVoter: "नए मतदाता?", register: "यहाँ पंजीकरण करें",
        needHelp: "मदद चाहिए? कॉल करें", hours: "सोम से शनि, सुबह 9 से शाम 6 बजे", orWrite: "या लिखें",
        eInvalid: "मोबाइल नंबर या PIN गलत है।",
        eLocked: "बहुत अधिक गलत प्रयासों के बाद खाता लॉक हो गया है। बाद में कोशिश करें या अपना PIN रीसेट करें।",
        eTooMany: "बहुत अधिक प्रयास हुए। कृपया कुछ मिनट रुककर फिर कोशिश करें।",
        eFp: "फ़िंगरप्रिंट जाँच रद्द हुई या विफल रही। फिर कोशिश करें या अपना PIN उपयोग करें।",
        eNetwork: "सर्वर तक नहीं पहुँच पा रहे। अपना कनेक्शन जाँचें और फिर कोशिश करें।",
        eGeneric: "कुछ गलत हो गया। कृपया फिर कोशिश करें।",
        doneTitle: "आप सत्यापित हैं", doneText: "आपको आपके डैशबोर्ड पर ले जा रहे हैं।",
        footer: {help: "सहायता", privacy: "गोपनीयता नीति", terms: "उपयोग की शर्तें", accessibility: "सुगम्यता वक्तव्य", contact: "संपर्क करें"},
        footerNote: "सामग्री का स्वामित्व और रखरखाव ई-वोटिंग सिस्टम परियोजना टीम के पास है। Chrome, Edge, Firefox या Safari के नवीनतम संस्करण पर सबसे अच्छा दिखता है।",
    },
};

/* ---------- Icons ---------- */
const Ico = ({d, size = 20, children, ...p}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
        {d ? <path d={d}/> : children}
    </svg>
);
const ShieldCheck = (p) => <Ico {...p}><path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.3 7.5 10 4.4-1.7 7.5-5.4 7.5-10v-6L12 2.5Z"/><path
    d="m9 12 2.2 2.2L15.5 10"/></Ico>;
const Fingerprint = (p) => <Ico {...p}><path d="M12 11v3.5c0 2-.5 3.8-1.5 5.5"/><path
    d="M8.5 15c0 1.5-.3 3-.9 4.3"/><path d="M15.5 11.5V14c0 1.8-.3 3.5-.9 5"/><path d="M5.5 11a6.5 6.5 0 0 1 13 0"/><path
    d="M3.5 9a9 9 0 0 1 17 0"/><path d="M12 11a1.5 1.5 0 0 1 1.5 1.5c0 2.2-.3 4.2-1 6"/></Ico>;
const Eye = (p) => <Ico {...p}><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12"
                                                                                                              cy="12"
                                                                                                              r="2.8"/></Ico>;
const EyeOff = (p) => <Ico {...p}><path d="M3 3l18 18"/><path
    d="M10.6 6a9.9 9.9 0 0 1 1.4-.1c6.4 0 10 6.1 10 6.1a17 17 0 0 1-3.2 3.9"/><path
    d="M6.5 7.5A17 17 0 0 0 2 12s3.6 6.5 10 6.5c1.5 0 2.9-.3 4.1-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></Ico>;
const AlertIcon = (p) => <Ico {...p}><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5M12 16.2h.01"/></Ico>;
const LockIcon = (p) => <Ico {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path
    d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></Ico>;
const PhoneIcon = (p) => <Ico {...p} d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>;
const IdIcon = (p) => <Ico {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path
    d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M15 10h3M15 13h3"/></Ico>;
const TokenIcon = (p) => <Ico {...p}><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7Z"/><path d="M10 9.5v5"
                                                                                                      strokeDasharray="1.5 2"/></Ico>;
const KeypadIcon = (p) => <Ico {...p}>{[5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor"/>))}</Ico>;
const BackspaceIcon = (p) => <Ico {...p}><path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7 6-7Z"/><path d="m12.5 10 4 4m0-4-4 4"/></Ico>;
const Spinner = () => (
    <svg className="h-5 w-5 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none"
         aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
);

/* ---------- Hero art: election-ink fingertip, ridges draw themselves once ---------- */
const RIDGES = Array.from({length: 15}, (_, i) => {
    const r = 10 + i * 10;
    return {
        d: `M ${150 - r} 292 V 150 A ${r} ${r * 1.12} 0 0 1 ${150 + r} 150 V 292`,
        w: i % 3 === 0 ? 2.6 : 1.7,
        o: 0.35 + ((i * 7) % 5) * 0.1,
        delay: (i * 0.09).toFixed(2),
    };
});

const FingerArt = ({className = "", progress = 0}) => (
    <svg viewBox="0 0 300 300" fill="none" aria-hidden="true"
         className={`${className} transition-colors duration-700 ${progress === 2 ? "text-[#ffc47a]" : progress === 1 ? "text-[#e4deff]" : "text-[#b9adff]"}`}>
        <defs>
            <linearGradient id="ev-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff"/>
                <stop offset="0.6" stopColor="#fff"/>
                <stop offset="1" stopColor="#000"/>
            </linearGradient>
            <mask id="ev-mask"><rect width="300" height="300" fill="url(#ev-fade)"/></mask>
            <linearGradient id="ev-scan-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ff9933" stopOpacity="0"/>
                <stop offset="0.5" stopColor="#ffb866" stopOpacity="1"/>
                <stop offset="1" stopColor="#ff9933" stopOpacity="0"/>
            </linearGradient>
        </defs>
        <g mask="url(#ev-mask)">
            <g transform="rotate(-7 150 160)">
                <ellipse cx="150" cy="150" rx="5" ry="6" fill="currentColor" opacity="0.9"/>
                {RIDGES.map((r, i) => (
                    <path key={i} d={r.d} pathLength="1" stroke="currentColor" strokeWidth={r.w} strokeLinecap="round"
                          opacity={r.o} className="ev-ridge" style={{animationDelay: `${r.delay}s`}}/>
                ))}
            </g>
            <g className="ev-scan">
                <rect x="0" y="0" width="300" height="3" fill="url(#ev-scan-grad)"/>
            </g>
        </g>
    </svg>
);

/* Page-load sequence + scan line (reduced motion = static) */
const CSS = `
@keyframes ev-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ev-scan { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { transform: translateY(300px); opacity: 0; } }
@keyframes ev-glow { 0%,100% { opacity: .55; } 50% { opacity: .85; } }
@keyframes ev-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ev-fadein { from { opacity: 0; } to { opacity: 1; } }
@keyframes ev-pop { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
@keyframes ev-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
.ev-shake { animation: ev-shake .45s ease-in-out; }
.ev-rise { animation: ev-rise .9s cubic-bezier(.2,.7,.2,1) .45s backwards; }
.ev-fadein { animation: ev-fadein .35s ease-out; }
.ev-pop { animation: ev-pop .6s cubic-bezier(.2,.8,.3,1) .1s backwards; }
.ev-ring { stroke-dasharray: 1; animation: ev-draw .8s ease-out .15s backwards; }
.ev-tick { stroke-dasharray: 1; animation: ev-draw .45s ease-out .7s backwards; }
.ev-ridge { stroke-dasharray: 1; stroke-dashoffset: 0; animation: ev-draw 1.4s cubic-bezier(.4,0,.2,1) backwards; }
.ev-scan { animation: ev-scan 4.5s ease-in-out 2.2s infinite; opacity: 0; }
.ev-glow { animation: ev-glow 6s ease-in-out infinite; }
.ev-dots { background-image: radial-gradient(rgba(42,27,122,.10) 1px, transparent 1px); background-size: 22px 22px; }
@media (prefers-color-scheme: dark) { .ev-dots { background-image: radial-gradient(rgba(180,170,255,.07) 1px, transparent 1px); } }
@media (prefers-reduced-motion: reduce) { .ev-ridge, .ev-scan, .ev-glow, .ev-rise, .ev-fadein, .ev-pop, .ev-ring, .ev-tick, .ev-shake { animation: none !important; } .ev-scan { display: none; } }
`;

/* ---------- Class strings ---------- */
const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a35c8] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-violet-300 dark:focus-visible:ring-offset-slate-900";

const field = (invalid) =>
    `flex items-center overflow-hidden rounded-xl border-2 bg-white transition dark:bg-slate-950 focus-within:ring-4 ${
        invalid
            ? "border-red-600 focus-within:ring-red-600/20 dark:border-red-400"
            : "border-slate-200 hover:border-slate-300 focus-within:border-[#4a35c8] focus-within:ring-[#4a35c8]/15 dark:border-slate-700 dark:focus-within:border-violet-300 dark:focus-within:ring-violet-300/20"
    }`;

const inputBase =
    "w-full bg-transparent px-4 py-3.5 text-lg tracking-wide text-slate-900 placeholder:text-base placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500";

const utilBtn =
    "rounded px-2 py-0.5 text-sm font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

const linkCls = "font-semibold text-[#3b2a9c] hover:underline dark:text-violet-300";

const TRUST_ICONS = [IdIcon, TokenIcon, Fingerprint];

const Brand = ({light, t}) => (
    <div className="flex items-center gap-3.5">
        <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff9933] to-[#e8741a] text-[#1a1446] shadow-lg shadow-orange-500/20">
            <ShieldCheck size={26}/>
        </span>
        <div>
            <p style={serif}
               className={`text-xl font-bold leading-tight tracking-tight sm:text-2xl ${light ? "text-white" : "text-[#1a1446] dark:text-white"}`}>
                {t.brandName}
            </p>
            <p className={`text-sm ${light ? "text-violet-200" : "text-slate-600 dark:text-slate-400"}`}>
                <span lang={t.otherLang}>{t.brandPre}</span>
                <span className="mx-1.5" aria-hidden="true">|</span>{t.brandSub}
            </p>
        </div>
    </div>
);

/* ================================================================== */
const keyCls =
    "flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-semibold text-[#1a1446] transition hover:border-[#4a35c8] hover:bg-[#f5f3ff] active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 " + focusRing;

function shuffleDigits() {
    const a = "0123456789".split("");
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function Login({navigate = (path) => window.location.assign(path)}) {
    const [mobile, setMobile] = useState("");
    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [touched, setTouched] = useState({mobile: false, pin: false});
    const [loading, setLoading] = useState(null);
    const [banner, setBanner] = useState(null);
    const [webauthnSupported, setWebauthnSupported] = useState(false);
    const [textSize, setTextSize] = useState(readStoredTextSize);
    const [done, setDone] = useState(false);
    const [lang, setLang] = useState(readStoredLang);
    const t = T[lang];
    const artRef = useRef(null);
    const timerRef = useRef(null);
    const [keypadOpen, setKeypadOpen] = useState(false);
    const [keypadOrder, setKeypadOrder] = useState(() => "0123456789".split(""));

    function toggleKeypad() {
        if (!keypadOpen) setKeypadOrder(shuffleDigits());
        setKeypadOpen((o) => !o);
    }

    function pressDigit(d) {
        if (loading !== null) return;
        setPin((p) => (p + d).slice(0, 6));
    }

    useEffect(() => () => clearTimeout(timerRef.current), []);

    useEffect(() => {
        document.documentElement.lang = lang;
        document.title = T[lang].docTitle;
        try {
            localStorage.setItem(LANG_KEY, lang);
        } catch { /* ignore */ }
    }, [lang]);

    const reducedMotion = () =>
        typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    function onHeroMove(e) {
        if (!artRef.current || reducedMotion()) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        artRef.current.style.transform = `translate3d(${(-x * 28).toFixed(1)}px, ${(-y * 22).toFixed(1)}px, 0) rotate(${(x * 3).toFixed(2)}deg)`;
    }

    function onHeroLeave() {
        if (artRef.current) artRef.current.style.transform = "";
    }

    useEffect(() => {
        setWebauthnSupported(typeof window !== "undefined" && !!window.PublicKeyCredential);
    }, []);

    useEffect(() => {
        document.documentElement.style.fontSize = `${textSize}%`;
        try {
            localStorage.setItem(TEXT_SIZE_KEY, String(textSize));
        } catch { /* ignore */ }
    }, [textSize]);

    const mobileValid = MOBILE_RE.test(mobile);
    const pinValid = PIN_RE.test(pin);
    const busy = loading !== null;
    const progress = mobileValid && pinValid ? 2 : mobileValid ? 1 : 0;

    const mobileError = !touched.mobile || mobileValid ? ""
        : mobile.length === 0 ? t.mobileEmpty : t.mobileShort;
    const pinError = !touched.pin || pinValid ? ""
        : pin.length === 0 ? t.pinEmpty : t.pinBad;

    function finishLogin({role}) {
        setDone(true);
        timerRef.current = setTimeout(() => navigate(ROLE_ROUTES[role] ?? "/"), reducedMotion() ? 300 : 1300);
    }

    async function handlePinLogin() {
        if (!mobileValid || !pinValid || busy) return;
        setBanner(null);
        setLoading("pin");
        try {
            finishLogin(await loginWithPin({contactNo: mobile, pin}));
        } catch (err) {
            setBanner({...toBanner(err, t), id: Date.now()});
            setLoading(null);
        }
    }

    async function handleFingerprintLogin() {
        if (!mobileValid || busy) return;
        setBanner(null);
        setLoading("fingerprint");
        try {
            finishLogin(await loginWithFingerprint({contactNo: mobile}));
        } catch (err) {
            setBanner({...toBanner(err, t), id: Date.now()});
            setLoading(null);
        }
    }

    const onEnter = (e) => {
        if (e.key === "Enter") handlePinLogin();
    };

    const fingerprintDisabled = busy || !mobileValid || !webauthnSupported;
    const fingerprintHint = !webauthnSupported
        ? t.fpUnsupported
        : !mobileValid ? t.fpNeedMobile : "";
    const tel = `tel:${HELPLINE.replace(/-/g, "")}`;

    return (
        <div style={sans}
             className="flex min-h-screen flex-col bg-[#f5f4fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <style>{CSS}</style>
            <a href="#main"
               className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-blue-900">
                {t.skip}
            </a>

            {/* Success: ink-stamp, then navigate */}
            {done && (
                <div role="status" aria-live="polite"
                     className="ev-fadein fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#120c35]/95 px-6 text-center text-white backdrop-blur-md">
                    <svg viewBox="0 0 120 120" className="ev-pop h-32 w-32" fill="none" aria-hidden="true">
                        <circle cx="60" cy="60" r="52" pathLength="1" stroke="#ffb866" strokeWidth="5"
                                strokeLinecap="round" className="ev-ring" transform="rotate(-90 60 60)"/>
                        <path d="M38 62l15 15 30-34" pathLength="1" stroke="#fff" strokeWidth="7"
                              strokeLinecap="round" strokeLinejoin="round" className="ev-tick"/>
                    </svg>
                    <p style={serif} className="mt-6 text-3xl font-semibold">{t.doneTitle}</p>
                    <p className="mt-2 text-base text-violet-200">{t.doneText}</p>
                </div>
            )}

            {/* Utility bar */}
            <div className="bg-[#0e0a2b] dark:bg-black">
                <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-4 py-1.5 sm:px-8">
                    <p className="mr-auto text-sm text-slate-200">
                        <span lang="hi">भारत सरकार</span>
                        <span className="mx-2 text-slate-500" aria-hidden="true">|</span>Government of India
                    </p>
                    <div className="flex items-center rounded-md bg-white/10 p-0.5" role="group" aria-label={t.langLabel}>
                        {[["en", "English"], ["hi", "हिन्दी"]].map(([code, label]) => (
                            <button key={code} type="button" lang={code} onClick={() => setLang(code)}
                                    aria-pressed={lang === code}
                                    className={`rounded px-2.5 py-0.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                                        lang === code ? "bg-white text-[#1a1446]" : "text-slate-200 hover:bg-white/10"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1" role="group" aria-label={t.textSize}>
                        <button type="button" onClick={() => setTextSize((s) => Math.max(TEXT_SIZE_MIN, s - 10))}
                                aria-label={t.smaller} className={utilBtn}>A-
                        </button>
                        <button type="button" onClick={() => setTextSize(100)} aria-label={t.normal}
                                className={utilBtn}>A
                        </button>
                        <button type="button" onClick={() => setTextSize((s) => Math.min(TEXT_SIZE_MAX, s + 10))}
                                aria-label={t.larger} className={utilBtn}>A+
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex h-1" aria-hidden="true">
                <div className="flex-1 bg-[#ff9933]"/>
                <div className="flex-1 bg-white dark:bg-slate-400"/>
                <div className="flex-1 bg-[#138808]"/>
            </div>

            {/* Content */}
            <main id="main" className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">

                {/* Left: ink hero */}
                <section aria-labelledby="about-heading" onMouseMove={onHeroMove} onMouseLeave={onHeroLeave}
                         className="relative order-2 overflow-hidden bg-gradient-to-br from-[#120c35] via-[#1d1459] to-[#0f1b4d] px-6 py-12 text-white sm:px-12 lg:order-1 lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-14">
                    <div
                        className={`ev-glow pointer-events-none absolute -right-24 top-1/3 h-[32rem] w-[32rem] rounded-full blur-3xl transition-colors duration-1000 ${progress === 2 ? "bg-[#ff9933]/25" : "bg-[#6d4aff]/30"}`}
                        aria-hidden="true"/>
                    <div ref={artRef}
                         className="pointer-events-none absolute -bottom-10 -right-16 h-[30rem] w-[30rem] transition-transform duration-500 ease-out sm:h-[36rem] sm:w-[36rem] lg:-right-10 lg:h-[40rem] lg:w-[40rem]"
                         aria-hidden="true">
                        <FingerArt className="h-full w-full" progress={progress}/>
                    </div>

                    <div className="relative hidden lg:block"><Brand light t={t}/></div>

                    <div className="relative lg:my-12">
                        <h2 id="about-heading" style={serif}
                            className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                            {t.headline}
                        </h2>
                        <p lang={t.tagLang} className="mt-4 text-lg font-medium text-[#ffb866] sm:text-xl">
                            {t.tagline}
                        </p>
                        <p className="mt-4 max-w-md text-base leading-relaxed text-violet-100/90 sm:text-lg">
                            {t.heroText}
                        </p>

                        <ul className="mt-10 max-w-md space-y-3">
                            {t.trust.map(([title, text], i) => (
                                <li key={title}
                                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                                    <span
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff9933]/15 text-[#ffb866]">
                                        {createElement(TRUST_ICONS[i], {size: 22})}
                                    </span>
                                    <div>
                                        <h3 className="text-base font-semibold">{title}</h3>
                                        <p className="mt-0.5 text-sm leading-relaxed text-violet-100/80">{text}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative max-w-md rounded-2xl border-l-4 border-[#ff9933] bg-black/25 p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#ffb866]">
                            <AlertIcon size={18} className="shrink-0"/> {t.safeTitle}
                        </h3>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-violet-100/90">
                            <li>{t.safe[0]}</li>
                            <li>{t.safe[1]}</li>
                            <li>{t.safe[2]}</li>
                        </ul>
                    </div>
                </section>

                {/* Right: login */}
                <section aria-labelledby="login-heading"
                         className="ev-dots relative order-1 flex flex-col px-4 py-8 sm:px-10 lg:order-2 lg:py-10">
                    <div className="mb-8 flex items-center justify-between gap-4">
                        <div className="lg:hidden"><Brand t={t}/></div>
                        <a href={tel}
                           className={`ml-auto hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 sm:flex ${focusRing}`}>
                            <PhoneIcon className="text-[#3b2a9c] dark:text-violet-300" size={22}/>
                            <span className="leading-tight">
                                <span className="block text-xs text-slate-600 dark:text-slate-400">{t.helpline}</span>
                                <span className="block text-base font-bold text-[#1a1446] dark:text-violet-100">{HELPLINE}</span>
                            </span>
                        </a>
                    </div>

                    <div className="flex flex-1 items-center justify-center">
                        <div
                            className="ev-rise w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(29,20,89,0.45)] dark:border-slate-800 dark:bg-slate-900 sm:p-9">
                            <div className="mb-6 flex gap-1.5" aria-hidden="true">
                                <span className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${mobileValid ? "bg-[#ff9933]" : "bg-slate-200 dark:bg-slate-700"}`}/>
                                <span className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${pin.length > 0 ? "bg-[#3b4cca]" : "bg-slate-200 dark:bg-slate-700"}`}/>
                                <span className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${pinValid ? "bg-[#138808]" : "bg-slate-200 dark:bg-slate-700"}`}/>
                            </div>
                            <span
                                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ece9ff] text-[#3b2a9c] dark:bg-violet-500/15 dark:text-violet-200">
                                <Fingerprint size={30}/>
                            </span>
                            <h1 id="login-heading" style={serif}
                                className="mt-5 text-3xl font-semibold tracking-tight text-[#1a1446] dark:text-slate-50 sm:text-[2rem]">
                                {t.loginTitle}
                            </h1>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                {t.loginSub}
                            </p>

                            {banner && (
                                <div role="alert" key={banner.id}
                                     className={`ev-shake mt-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
                                         banner.type === "locked"
                                             ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200"
                                             : "border-red-300 bg-red-50 text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200"
                                     }`}>
                                    {banner.type === "locked" ? <LockIcon className="mt-0.5 shrink-0"/> :
                                        <AlertIcon className="mt-0.5 shrink-0"/>}
                                    <span>{banner.text}</span>
                                </div>
                            )}

                            <div className="mt-6 space-y-5">
                                <div>
                                    <label htmlFor="mobile" className="mb-1.5 block text-sm font-semibold">
                                        {t.mobile} <span className="text-red-700 dark:text-red-300"
                                                         aria-hidden="true">*</span>
                                    </label>
                                    <div className={field(!!mobileError)}>
                                        <span
                                            className="select-none self-stretch bg-slate-100 px-4 py-3.5 text-lg font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">+91</span>
                                        <input id="mobile" type="tel" autoFocus inputMode="numeric" autoComplete="tel-national"
                                               maxLength={10} placeholder={t.mobilePh} value={mobile}
                                               onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                               onBlur={() => setTouched((t) => ({...t, mobile: true}))}
                                               onKeyDown={onEnter} aria-required="true" aria-invalid={!!mobileError}
                                               aria-describedby={mobileError ? "mobile-error" : undefined}
                                               className={inputBase}/>
                                    </div>
                                    {mobileError && <p id="mobile-error"
                                                       className="mt-1.5 text-sm text-red-700 dark:text-red-300">{mobileError}</p>}
                                </div>

                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label htmlFor="pin" className="text-sm font-semibold">
                                            {t.pin} <span className="text-red-700 dark:text-red-300"
                                                          aria-hidden="true">*</span>
                                        </label>
                                        <a href="/forgot-pin"
                                           className={`rounded text-sm font-medium text-[#3b2a9c] hover:underline dark:text-violet-300 ${focusRing}`}>{t.forgot}</a>
                                    </div>
                                    <div className={field(!!pinError)}>
                                        <input id="pin" type={showPin ? "text" : "password"} inputMode={keypadOpen ? "none" : "numeric"}
                                               autoComplete="current-password" maxLength={6}
                                               placeholder={t.pinPh} value={pin}
                                               onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                               onBlur={() => { if (!keypadOpen) setTouched((s) => ({...s, pin: true})); }}
                                               onKeyDown={onEnter} aria-required="true" aria-invalid={!!pinError}
                                               aria-describedby={pinError ? "pin-error" : undefined}
                                               className={inputBase}/>
                                        <button type="button" onClick={() => setShowPin((s) => !s)}
                                                aria-label={showPin ? t.hide : t.show} aria-pressed={showPin}
                                                className={`mr-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${focusRing}`}>
                                            {showPin ? <EyeOff/> : <Eye/>}
                                        </button>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
                                        {Array.from({length: 6}, (_, i) => (
                                            <span key={i}
                                                  className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                                                      i < pin.length
                                                          ? (pinValid ? "bg-[#138808]" : "bg-[#4a35c8] dark:bg-violet-300")
                                                          : "bg-slate-200 dark:bg-slate-700"
                                                  }`}/>
                                        ))}
                                    </div>
                                    {pinError && <p id="pin-error"
                                                    className="mt-1.5 text-sm text-red-700 dark:text-red-300">{pinError}</p>}
                                    <div className="mt-2">
                                        <button type="button" onClick={toggleKeypad} aria-expanded={keypadOpen}
                                                aria-controls="keypad"
                                                className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-[#3b2a9c] hover:bg-[#f1eeff] dark:text-violet-300 dark:hover:bg-slate-800 ${focusRing}`}>
                                            <KeypadIcon size={18}/> {keypadOpen ? t.keypadHide : t.keypad}
                                        </button>
                                        {keypadOpen && (
                                            <div id="keypad"
                                                 className="ev-fadein mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                                                <div className="grid grid-cols-3 gap-2">
                                                    {keypadOrder.slice(0, 9).map((d) => (
                                                        <button key={d} type="button" onClick={() => pressDigit(d)}
                                                                disabled={busy} className={keyCls}>{d}</button>
                                                    ))}
                                                    <button type="button" onClick={() => setPin("")} disabled={busy}
                                                            className={`${keyCls} !text-sm`}>{t.clear}</button>
                                                    <button type="button" onClick={() => pressDigit(keypadOrder[9])}
                                                            disabled={busy} className={keyCls}>{keypadOrder[9]}</button>
                                                    <button type="button" onClick={() => setPin((p) => p.slice(0, -1))}
                                                            disabled={busy} aria-label={t.del}
                                                            className={keyCls}><BackspaceIcon/></button>
                                                </div>
                                                <p className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400">{t.keypadNote}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button type="button" onClick={handlePinLogin}
                                        disabled={!mobileValid || !pinValid || busy}
                                        className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1d1459] to-[#4a35c8] px-4 py-4 text-base font-semibold text-white shadow-lg shadow-[#4a35c8]/30 transition hover:brightness-110 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500 disabled:shadow-none dark:disabled:from-slate-800 dark:disabled:to-slate-800 dark:disabled:text-slate-500 ${focusRing}`}>
                                    {loading === "pin" && <Spinner/>}
                                    {loading === "pin" ? t.loggingIn : t.login}
                                </button>

                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400"
                                     aria-hidden="true">
                                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>{t.or}<span
                                    className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>
                                </div>

                                <div>
                                    <button type="button" onClick={handleFingerprintLogin}
                                            disabled={fingerprintDisabled}
                                            aria-describedby={fingerprintHint ? "fp-hint" : undefined}
                                            className={`flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-[#1d1459]/15 bg-white px-4 py-3.5 text-base font-semibold text-[#1a1446] transition hover:border-[#4a35c8] hover:bg-[#f5f3ff] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white dark:border-slate-600 dark:bg-transparent dark:text-slate-100 dark:hover:bg-slate-800 dark:disabled:border-slate-800 dark:disabled:text-slate-600 ${focusRing}`}>
                                        {loading === "fingerprint" ? (
                                            <span className="relative flex h-5 w-5 items-center justify-center">
                                                <span
                                                    className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-[#4a35c8]/30 motion-reduce:animate-none"/>
                                                <Fingerprint className="relative text-[#4a35c8] dark:text-violet-300"/>
                                            </span>
                                        ) : <Fingerprint/>}
                                        {loading === "fingerprint" ? t.fpWait : t.fp}
                                    </button>
                                    {fingerprintHint && <p id="fp-hint"
                                                           className="mt-1.5 text-center text-sm text-slate-600 dark:text-slate-400">{fingerprintHint}</p>}
                                </div>
                            </div>

                            <p className="mt-7 border-t border-slate-200 pt-5 text-center text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                                {t.newVoter}{" "}
                                <Link to="/register" className={`rounded ${linkCls} ${focusRing}`}>{t.register}</Link>
                            </p>
                            <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">
                                {t.needHelp}{" "}
                                <a href={tel} className={linkCls}>{HELPLINE}</a>{" "}
                                ({t.hours}) {t.orWrite}{" "}
                                <a href={`mailto:${SUPPORT_EMAIL}`} className={linkCls}>{SUPPORT_EMAIL}</a>
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#0e0a2b] text-slate-200 dark:bg-black">
                <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-8">
                    <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        {FOOTER_LINKS.map(({key, href}) => (
                            <a key={key} href={href}
                               className="rounded underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{t.footer[key]}</a>
                        ))}
                    </nav>
                    <p className="mt-3 text-sm text-slate-400">{t.footerNote}</p>
                </div>
            </footer>
        </div>
    );
}