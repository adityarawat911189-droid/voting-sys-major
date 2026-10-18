import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* Voter ki profile + fingerprint register/replace. Logic pehle jaisa, sirf UI naya.
   Design idea: platinum credit card jaisa Voter ID. Fingerprint = card ki chip. */

async function api(path, options = {}) {
    const res = await fetch(path, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || "Something went wrong. Please try again.");
        err.status = res.status;
        throw err;
    }
    return data;
}

/* ---- WebAuthn helpers: base64url <-> ArrayBuffer ---- */
function b64uToBuf(s) {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
}

function bufToB64u(buf) {
    const bytes = new Uint8Array(buf);
    let s = "";
    bytes.forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function registerFingerprint(pin) {
    // 1) PIN bhejo, server se options lo
    const json = await api("/api/voter/fingerprint/options", {
        method: "POST",
        body: JSON.stringify({ pin }),
    });
    const options = json.publicKey ?? json;
    options.challenge = b64uToBuf(options.challenge);
    options.user.id = b64uToBuf(options.user.id);
    (options.excludeCredentials || []).forEach((c) => (c.id = b64uToBuf(c.id)));

    // 2) Browser ka fingerprint prompt
    const cred = await navigator.credentials.create({ publicKey: options });

    // 3) Result server ko bhejo, wo verify karke DB mein save karega
    return api("/api/voter/fingerprint/register", {
        method: "POST",
        body: JSON.stringify({
            id: cred.id,
            rawId: bufToB64u(cred.rawId),
            type: cred.type,
            response: {
                attestationObject: bufToB64u(cred.response.attestationObject),
                clientDataJSON: bufToB64u(cred.response.clientDataJSON),
            },
            clientExtensionResults: cred.getClientExtensionResults(),
        }),
    });
}

/* ---------- icons (no extra library) ---------- */
const Icon = ({ children, className = "h-4 w-4", sw = 1.8 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {children}
    </svg>
);
const IconFinger = (p) => (
    <Icon {...p}>
        <path d="M6 10a6 6 0 0112 0v2" />
        <path d="M9 21c-1-2-1.5-4-1.5-6.5a4.5 4.5 0 019 0c0 2 .3 3.5 1 5" />
        <path d="M12 12.5c0 3 .5 5.5 2 8" />
        <path d="M3.5 12.5V10a8.5 8.5 0 0117 0v1" />
    </Icon>
);
const IconCheck = (p) => (
    <Icon {...p}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
);
const IconAlert = (p) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16h.01" />
    </Icon>
);
const IconLock = (p) => (
    <Icon {...p}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
    </Icon>
);
const IconBallot = (p) => (
    <Icon {...p}>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M8 11V4l8 0v7" />
        <path d="M10 7.5l1.5 1.5L14 6" />
    </Icon>
);
const IconWave = (p) => (
    <Icon {...p}>
        <path d="M8 8a6 6 0 010 8M12 5a10 10 0 010 14M16 2.5a14 14 0 010 19" />
    </Icon>
);
const Spinner = () => (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
        <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

const inkBtn = `inline-flex items-center justify-center gap-2 rounded-lg bg-violet-800 px-5 py-2.5 font-semibold text-white shadow-[0_3px_0_0_#4c1d95] transition active:translate-y-[2px] active:shadow-[0_1px_0_0_#4c1d95] hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:bg-violet-600 dark:shadow-[0_3px_0_0_#2e1065] dark:hover:bg-violet-500 ${focusRing}`;

/* Platinum metal ka look: silver gradient + brushed lines + embossed text */
const PLATINUM = "linear-gradient(120deg,#cbd5e1 0%,#f8fafc 24%,#d5dde8 48%,#f1f5f9 70%,#9aa7b8 100%)";
const BRUSHED = "repeating-linear-gradient(90deg,rgba(255,255,255,.55) 0,rgba(255,255,255,.55) 1px,transparent 1px,transparent 3px)";
const emboss = { textShadow: "0 1px 0 rgba(255,255,255,.95), 0 -1px 0 rgba(15,23,42,.28)" };

function Detail({ label, value, wide }) {
    return (
        <div className={wide ? "sm:col-span-2" : ""}>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-0.5 break-words font-medium text-slate-900 dark:text-slate-100">{value || "-"}</dd>
        </div>
    );
}

function CardStat({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
            <p className="truncate text-sm font-bold text-slate-800 sm:text-base" style={emboss}>
                {value || "-"}
            </p>
        </div>
    );
}

export default function ProfileCard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [pin, setPin] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [fpError, setFpError] = useState("");

    const load = async () => {
        try {
            setProfile(await api("/api/voter/profile"));
        } catch (err) {
            if (err.status === 401) return navigate("/login");
            setError(err.message);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startRegister = async () => {
        setFpError("");
        setMessage("");
        if (!window.PublicKeyCredential) {
            return setFpError("This browser or device does not support fingerprint registration.");
        }
        if (!/^\d{4,6}$/.test(pin)) return setFpError("Enter your 4 to 6 digit PIN.");

        setBusy(true);
        try {
            const res = await registerFingerprint(pin);
            setMessage(res.message);
            setShowPin(false);
            await load();
        } catch (err) {
            if (err.status === 401) return navigate("/login");
            if (err.name === "NotAllowedError") {
                setFpError("Fingerprint check was cancelled or timed out. Please try again.");
            } else if (err.name === "InvalidStateError") {
                setFpError("This fingerprint is already registered on this device.");
            } else {
                setFpError(err.message);
            }
        } finally {
            setBusy(false);
            setPin("");
        }
    };

    if (error)
        return (
            <div role="alert" className="flex items-start gap-2 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
            </div>
        );

    if (!profile)
        return (
            <div className="mx-auto max-w-xl animate-pulse rounded-[1.25rem] bg-slate-300 p-7 dark:bg-slate-700 sm:aspect-[1.586/1]" aria-label="Loading profile">
                <div className="h-4 w-32 rounded bg-slate-200/80 dark:bg-slate-500" />
                <div className="mt-8 h-10 w-14 rounded-lg bg-slate-200/80 dark:bg-slate-500" />
                <div className="mt-8 h-6 w-3/4 rounded bg-slate-200/80 dark:bg-slate-500" />
            </div>
        );

    const registered = profile.fingerprintRegistered;

    return (
        <div className="space-y-6">
            {/* ===== Platinum voter card ===== */}
            <div
                className="group relative mx-auto max-w-xl overflow-hidden rounded-[1.25rem] p-5 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.55)] ring-1 ring-white/70 sm:aspect-[1.586/1] sm:p-7"
                style={{ background: PLATINUM }}
            >
                {/* brushed-metal lines */}
                <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: BRUSHED }} />
                {/* watermark */}
                <IconBallot className="pointer-events-none absolute -right-6 top-1/2 h-64 w-64 -translate-y-1/2 text-slate-900/[0.06]" sw={1} />
                {/* hover sheen */}
                <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[320%] motion-reduce:transition-none" />

                <div className="relative flex h-full flex-col justify-between gap-6">
                    {/* top row */}
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-serif text-lg font-bold leading-none text-slate-800 sm:text-xl" style={emboss}>
                                Voter ID
                            </p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Platinum</p>
                        </div>
                        <div className="flex h-7 w-9 flex-col overflow-hidden rounded-sm shadow ring-1 ring-slate-400/60" aria-hidden="true">
                            <i className="flex-1 bg-orange-500" />
                            <i className="flex-1 bg-white" />
                            <i className="flex-1 bg-green-600" />
                        </div>
                    </div>

                    {/* chip + status */}
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 text-amber-900/80 shadow-inner ring-1 ring-amber-700/40">
                            <IconFinger className="h-7 w-7" />
                        </span>
                        <IconWave className="h-6 w-6 text-slate-500" />
                        <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-400/40">
                            <span className={`h-2 w-2 rounded-full ${registered ? "bg-emerald-500" : "animate-pulse bg-amber-500 motion-reduce:animate-none"}`} />
                            {registered ? "Fingerprint active" : "Fingerprint pending"}
                        </span>
                    </div>

                    {/* number */}
                    <div>
                        <p className="break-all font-mono text-xl font-bold tracking-[0.18em] text-slate-700 sm:text-2xl" style={emboss}>
                            {profile.aadhaarMasked || "•••• •••• ••••"}
                        </p>
                    </div>

                    {/* bottom row */}
                    <div className="flex items-end justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-serif text-xl font-bold uppercase tracking-wider text-slate-800 sm:text-2xl" style={emboss}>
                                {profile.name}
                            </p>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                                <CardStat label="Born" value={profile.dob} />
                                <CardStat label="Ward" value={profile.wardNo} />
                                <CardStat label="City" value={profile.city} />
                            </div>
                        </div>
                        {profile.photo ? (
                            <img src={profile.photo} alt="Your photo" className="h-20 w-16 shrink-0 rounded-md border-2 border-white object-cover shadow-md ring-1 ring-slate-400/50 sm:h-24 sm:w-20" />
                        ) : (
                            <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-md border-2 border-white bg-slate-700 font-serif text-3xl font-bold text-white shadow-md ring-1 ring-slate-400/50 sm:h-24 sm:w-20">
                                {profile.name?.[0]}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== Details + fingerprint ===== */}
            <div className="mx-auto max-w-xl overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-[6px_6px_0_0_rgba(15,23,42,0.9)] dark:border-slate-200 dark:bg-slate-900 dark:shadow-[6px_6px_0_0_rgba(226,232,240,0.9)] sm:max-w-none">
                <div className="border-b-2 border-slate-900 px-5 py-3 dark:border-slate-200 sm:px-6">
                    <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">My profile</h2>
                </div>

                <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                    <Detail label="Gender" value={profile.gender} />
                    <Detail label="Mobile" value={profile.contactNo} />
                    <Detail label="State" value={profile.state} />
                    <Detail label="PAN" value={profile.panMasked} />
                    <Detail label="Address" value={profile.address} wide />
                </dl>

                {/* Fingerprint */}
                <div className="border-t-2 border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/50 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span
                                className={`flex h-11 w-11 items-center justify-center rounded-lg text-white ${registered ? "bg-emerald-700" : "bg-amber-500"}`}
                            >
                                <IconFinger className="h-6 w-6" />
                            </span>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Fingerprint</p>
                                <p className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                                    {registered ? (
                                        <>
                                            <IconCheck className="h-4 w-4 text-emerald-600" />
                                            Registered
                                        </>
                                    ) : (
                                        "Not registered"
                                    )}
                                </p>
                            </div>
                        </div>

                        {!showPin && (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPin(true);
                                    setFpError("");
                                    setMessage("");
                                }}
                                className={`rounded-lg border-2 border-slate-900 bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white dark:border-slate-300 dark:bg-transparent dark:text-slate-100 dark:hover:bg-slate-100 dark:hover:text-slate-900 ${focusRing}`}
                            >
                                {registered ? "Replace fingerprint" : "Register fingerprint"}
                            </button>
                        )}
                    </div>

                    {showPin && (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="Enter PIN to continue"
                                    aria-label="PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className={`w-full rounded-lg border-2 border-slate-300 bg-white py-2.5 pl-10 pr-3 font-semibold tracking-[0.3em] text-slate-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white ${focusRing}`}
                                />
                            </div>
                            <button type="button" onClick={startRegister} disabled={busy} className={inkBtn}>
                                {busy ? (
                                    <>
                                        <Spinner />
                                        Waiting for fingerprint…
                                    </>
                                ) : (
                                    "Continue"
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPin(false);
                                    setPin("");
                                    setFpError("");
                                }}
                                disabled={busy}
                                className={`rounded-lg border-2 border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-300 ${focusRing}`}
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {message && (
                        <p className="mt-3 inline-flex items-start gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
                            {message}
                        </p>
                    )}
                    {fpError && (
                        <p role="alert" className="mt-3 inline-flex items-start gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
                            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            {fpError}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}