import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProfileCard from "./ProfileCard";

/* Voter dashboard: ek button -> ongoing elections -> vote (PIN ke saath).
   Backend calls / logic bilkul pehle jaise hain, sirf UI naya hai.
   Design idea: asli ballot paper jaisa look + indelible ink (violet) ka vote mark. */

async function api(path, options = {}) {
    const res = await fetch(path, {
        credentials: "include", // session cookie bhejne ke liye
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

function placeLabel(e) {
    if (e.type === "COUNTRY") return "Country";
    if (e.type === "STATE") return `State: ${e.state}`;
    if (e.type === "CITY") return `City: ${e.city}`;
    return `Ward ${e.wardNo}, ${e.city}`;
}

/* ---------- icons (no extra library) ---------- */
const Icon = ({ children, className = "h-4 w-4", sw = 1.8 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {children}
    </svg>
);
const IconBallot = (p) => (
    <Icon {...p}>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M8 11V4l8 0v7" />
        <path d="M10 7.5l1.5 1.5L14 6" />
    </Icon>
);
const IconLock = (p) => (
    <Icon {...p}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
    </Icon>
);
const IconPin = (p) => (
    <Icon {...p}>
        <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
    </Icon>
);
const IconClock = (p) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </Icon>
);
const IconCheck = (p) => (
    <Icon {...p}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
);
const IconLogout = (p) => (
    <Icon {...p}>
        <path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4" />
        <path d="M16 8l4 4-4 4M20 12H9" />
    </Icon>
);
const IconUser = (p) => (
    <Icon {...p}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </Icon>
);
const IconAlert = (p) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16h.01" />
    </Icon>
);
const IconCopy = (p) => (
    <Icon {...p}>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15V6a2 2 0 012-2h9" />
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

/* Solid "ink" button: ek hi style poore page mein */
const inkBtn = `inline-flex items-center justify-center gap-2 rounded-lg bg-violet-800 px-6 py-3 font-semibold text-white shadow-[0_3px_0_0_#4c1d95] transition active:translate-y-[2px] active:shadow-[0_1px_0_0_#4c1d95] hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:bg-violet-600 dark:shadow-[0_3px_0_0_#2e1065] dark:hover:bg-violet-500 ${focusRing}`;

/* Ballot ka vote mark: bold ink cross jo box ke andar "stamp" hota hai */
const InkMark = () => (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-violet-700 dark:text-violet-400" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true">
        <path d="M5 5l14 14M19 5L5 19" />
    </svg>
);

function ElectionCard({ election, onVoted, onUnauthorized }) {
    const [candidateId, setCandidateId] = useState(null);
    const [pin, setPin] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const submit = async () => {
        setError("");
        if (!candidateId) return setError("Please select a candidate.");
        if (!/^\d{4,6}$/.test(pin)) return setError("Enter your 4 to 6 digit PIN.");
        if (!window.confirm("Your vote is final and cannot be changed. Continue?")) return;

        setSubmitting(true);
        try {
            const data = await api(`/api/voter/elections/${election.id}/vote`, {
                method: "POST",
                body: JSON.stringify({ candidateId, pin }),
            });
            onVoted(data);
        } catch (err) {
            if (err.status === 401) return onUnauthorized();
            setError(err.message);
        } finally {
            setSubmitting(false);
            setPin("");
        }
    };

    return (
        <article className="overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-[6px_6px_0_0_rgba(15,23,42,0.9)] dark:border-slate-200 dark:bg-slate-900 dark:shadow-[6px_6px_0_0_rgba(226,232,240,0.9)]">
            {/* Ballot heading */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-slate-900 p-5 dark:border-slate-200 sm:p-6">
                <div className="min-w-0">
                    <h3 className="font-serif text-2xl font-bold leading-tight text-slate-900 dark:text-white">{election.title}</h3>
                    <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                            <IconPin className="h-4 w-4" />
                            {placeLabel(election)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <IconClock className="h-4 w-4" />
                            Voting ends {election.endsAt}
                        </span>
                    </p>
                </div>

                {election.voted ? (
                    <span className="inline-flex -rotate-3 items-center gap-1.5 rounded-md border-2 border-emerald-700 px-3 py-1 text-sm font-bold text-emerald-700 dark:border-emerald-400 dark:text-emerald-400">
                        <IconCheck className="h-4 w-4" />
                        VOTED
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-2 rounded-md bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-900 dark:bg-violet-950 dark:text-violet-200">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75 motion-reduce:animate-none" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-700" />
                        </span>
                        Open
                    </span>
                )}
            </div>

            {election.description && (
                <p className="max-w-prose border-b border-dashed border-slate-300 px-5 py-4 text-[15px] leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:px-6">
                    {election.description}
                </p>
            )}

            {!election.voted && (
                <div>
                    <fieldset>
                        <legend className="w-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:px-6">
                            Mark one candidate
                        </legend>

                        {election.candidates.length === 0 && (
                            <p className="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">No candidates in this election.</p>
                        )}

                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {election.candidates.map((c, i) => {
                                const selected = candidateId === c.id;
                                return (
                                    <label
                                        key={c.id}
                                        className={`flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors focus-within:bg-violet-50 sm:gap-5 sm:px-6 dark:focus-within:bg-violet-950/40 ${
                                            selected ? "bg-violet-50 dark:bg-violet-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        }`}
                                    >
                                        <input type="radio" name={`election-${election.id}`} checked={selected} onChange={() => setCandidateId(c.id)} className="sr-only" />
                                        <span className="w-6 shrink-0 text-center font-serif text-lg font-bold text-slate-400 dark:text-slate-500">{i + 1}</span>
                                        <span
                                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-serif text-xl font-bold text-white dark:bg-slate-100 dark:text-slate-900"
                                            aria-hidden="true"
                                        >
                                            {(c.name || "?").trim().charAt(0).toUpperCase()}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-lg font-semibold text-slate-900 dark:text-white">{c.name}</span>
                                            {c.party && <span className="block truncate text-sm text-slate-600 dark:text-slate-400">{c.party}</span>}
                                        </span>
                                        {c.symbol && (
                                            <span className="hidden shrink-0 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300 sm:block">
                                                {c.symbol}
                                            </span>
                                        )}
                                        {/* Ballot box jahan mark lagta hai */}
                                        <span
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                                                selected
                                                    ? "border-violet-700 bg-white dark:border-violet-400 dark:bg-slate-900"
                                                    : "border-slate-900 bg-white dark:border-slate-300 dark:bg-slate-900"
                                            }`}
                                            aria-hidden="true"
                                        >
                                            {selected && (
                                                <span className="rotate-6 scale-100 transition-transform">
                                                    <InkMark />
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* Cast vote bar */}
                    <div className="border-t-2 border-slate-900 bg-slate-50 p-5 dark:border-slate-200 dark:bg-slate-950/50 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative sm:w-72">
                                <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="Enter PIN to vote"
                                    aria-label="Voting PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className={`w-full rounded-lg border-2 border-slate-300 bg-white py-3 pl-10 pr-3 font-semibold tracking-[0.3em] text-slate-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white ${focusRing}`}
                                />
                            </div>
                            <button type="button" onClick={submit} disabled={submitting} className={inkBtn}>
                                {submitting ? (
                                    <>
                                        <Spinner />
                                        Submitting…
                                    </>
                                ) : (
                                    <>
                                        <IconBallot className="h-5 w-5" />
                                        Cast my vote
                                    </>
                                )}
                            </button>
                        </div>

                        {error && (
                            <p role="alert" className="mt-4 inline-flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                {error}
                            </p>
                        )}

                        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Your vote is final and cannot be changed after submission.</p>
                    </div>
                </div>
            )}
        </article>
    );
}

function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-xl border-2 border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="h-6 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-4 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="mt-6 space-y-3">
                <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
        </div>
    );
}

export default function VoterDashboard() {
    const navigate = useNavigate();
    const [elections, setElections] = useState(null); // null = button abhi dabaya nahi
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [receipt, setReceipt] = useState(null);
    const [isCandidate, setIsCandidate] = useState(false);
    const [copied, setCopied] = useState(false);

    const toLogin = () => navigate("/login");

    // Approved candidate ho tabhi "My candidate page" button dikhega
    useEffect(() => {
        api("/api/voter/candidate/me")
            .then((d) => setIsCandidate(Boolean(d.candidate)))
            .catch((err) => {
                if (err.status === 401) navigate("/login");
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const load = async () => {
        setError("");
        setLoading(true);
        try {
            setElections(await api("/api/voter/elections"));
        } catch (err) {
            if (err.status === 401) return toLogin();
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const onVoted = (data) => {
        setReceipt(data);
        setCopied(false);
        load(); // list refresh: us election ke aage "Voted" aa jayega
    };

    const copyReceipt = async () => {
        try {
            await navigator.clipboard.writeText(receipt.receipt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    const logout = async () => {
        try {
            await api("/api/auth/logout", { method: "POST" });
        } catch {
            /* ignore */
        }
        toLogin();
    };

    return (
        <div className="min-h-screen bg-stone-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            {/* Tricolour hairline */}
            <div className="flex h-1" aria-hidden="true">
                <i className="flex-1 bg-orange-500" />
                <i className="flex-1 bg-white" />
                <i className="flex-1 bg-green-600" />
            </div>

            <header className="sticky top-0 z-20 border-b border-slate-300 bg-stone-100/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-800 text-white">
                            <IconBallot className="h-5 w-5" />
                        </span>
                        <span className="font-serif text-lg font-bold tracking-tight">Voter Dashboard</span>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className={`inline-flex items-center gap-2 rounded-lg border-2 border-slate-300 px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-300 ${focusRing}`}
                    >
                        <IconLogout />
                        Logout
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
                {/* Intro */}
                <section>
                    <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">Cast your vote.</h1>
                    <p className="mt-3 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                        Open the elections you can vote in, mark one candidate, and confirm with your PIN.
                    </p>
                </section>

                <ProfileCard />

                {isCandidate && (
                    <Link
                        to="/voter/candidate"
                        className={`group flex items-center justify-between gap-4 rounded-xl border-2 border-violet-800 bg-violet-50 px-5 py-4 transition hover:bg-violet-100 dark:border-violet-500 dark:bg-violet-950/40 dark:hover:bg-violet-950/70 ${focusRing}`}
                    >
                        <span className="flex items-center gap-4">
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-800 text-white">
                                <IconUser className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block font-serif text-lg font-bold text-violet-950 dark:text-violet-100">View my candidate page</span>
                                <span className="block text-sm text-violet-900/80 dark:text-violet-300/80">See how voters see your profile.</span>
                            </span>
                        </span>
                        <span className="text-2xl text-violet-800 transition-transform group-hover:translate-x-1 dark:text-violet-300" aria-hidden="true">
                            ›
                        </span>
                    </Link>
                )}

                {/* Elections */}
                <section aria-labelledby="elections-heading">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 id="elections-heading" className="font-serif text-3xl font-bold tracking-tight">
                                Ongoing elections
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Elections open to you right now. Each vote needs your PIN.</p>
                        </div>
                        <button type="button" onClick={load} disabled={loading} className={inkBtn}>
                            {loading ? (
                                <>
                                    <Spinner />
                                    Loading…
                                </>
                            ) : (
                                "View ongoing elections"
                            )}
                        </button>
                    </div>

                    {error && (
                        <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Receipt: tear-off stub jaisa */}
                    {receipt && (
                        <div className="mt-6 overflow-hidden rounded-xl border-2 border-emerald-700 bg-white dark:border-emerald-500 dark:bg-slate-900">
                            <div className="flex items-start gap-4 p-5 sm:p-6">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                                    <IconCheck className="h-6 w-6" />
                                </span>
                                <div className="min-w-0">
                                    <p className="font-serif text-xl font-bold text-emerald-900 dark:text-emerald-200">{receipt.message}</p>
                                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Election: {receipt.election}</p>
                                </div>
                            </div>
                            <div className="border-t-2 border-dashed border-emerald-700/60 bg-emerald-50 p-5 dark:border-emerald-500/60 dark:bg-emerald-950/30 sm:p-6">
                                <p className="text-sm text-emerald-900 dark:text-emerald-300">Your receipt code. Save it, it is shown only once.</p>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                                    <p className="min-w-0 flex-1 break-all rounded-lg border-2 border-emerald-700 bg-white px-4 py-3 font-mono text-base font-bold tracking-wide text-emerald-900 dark:border-emerald-500 dark:bg-slate-900 dark:text-emerald-200">
                                        {receipt.receipt}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={copyReceipt}
                                        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 ${focusRing}`}
                                    >
                                        {copied ? <IconCheck /> : <IconCopy />}
                                        {copied ? "Copied" : "Copy code"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not loaded yet */}
                    {elections === null && !loading && !error && (
                        <div className="mt-6 rounded-xl border-2 border-dashed border-slate-400 px-6 py-14 text-center dark:border-slate-600">
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border-2 border-slate-900 dark:border-slate-300">
                                <IconBallot className="h-7 w-7" />
                            </span>
                            <p className="mt-4 font-serif text-xl font-bold">No elections loaded yet</p>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">Select “View ongoing elections” to see where you can vote.</p>
                        </div>
                    )}

                    {loading && elections === null && (
                        <div className="mt-6">
                            <SkeletonCard />
                        </div>
                    )}

                    {elections && elections.length === 0 && (
                        <div className="mt-6 rounded-xl border-2 border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                            <p className="font-serif text-xl font-bold">No ongoing elections for you right now.</p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Check back later, new elections will show up here.</p>
                        </div>
                    )}

                    <div className="mt-8 space-y-10">
                        {elections?.map((e) => (
                            <ElectionCard key={e.id} election={e} onVoted={onVoted} onUnauthorized={toLogin} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}