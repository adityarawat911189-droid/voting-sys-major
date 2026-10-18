import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/* Candidate ka apna page: profile + change request + request ka status.
   Logic pehle jaisa, sirf UI naya. Design: ballot paper + "ballot pe aap aise dikhoge" preview. */

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

/* ---------- icons (no extra library) ---------- */
const Icon = ({ children, className = "h-4 w-4" }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {children}
    </svg>
);
const IconBack = (p) => (
    <Icon {...p}>
        <path d="M15 5l-7 7 7 7" />
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
const IconSend = (p) => (
    <Icon {...p}>
        <path d="M21 3L10 14" />
        <path d="M21 3l-7 18-4-7-7-4 18-7z" />
    </Icon>
);
const IconBallot = (p) => (
    <Icon {...p}>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M8 11V4l8 0v7" />
        <path d="M10 7.5l1.5 1.5L14 6" />
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

const inkBtn = `inline-flex items-center justify-center gap-2 rounded-lg bg-violet-800 px-6 py-3 font-semibold text-white shadow-[0_3px_0_0_#4c1d95] transition active:translate-y-[2px] active:shadow-[0_1px_0_0_#4c1d95] hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:bg-violet-600 dark:shadow-[0_3px_0_0_#2e1065] dark:hover:bg-violet-500 ${focusRing}`;

const paper =
    "overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-[6px_6px_0_0_rgba(15,23,42,0.9)] dark:border-slate-200 dark:bg-slate-900 dark:shadow-[6px_6px_0_0_rgba(226,232,240,0.9)]";

function Detail({ label, value }) {
    return (
        <div>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-0.5 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">{value || "-"}</dd>
        </div>
    );
}

/* Rubber-stamp: status ko tirchha stamp bana diya */
const STAMP = {
    PENDING: "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-300",
    APPROVED: "border-emerald-700 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300",
    REJECTED: "border-red-700 text-red-700 dark:border-red-400 dark:text-red-300",
};

function RequestStatus({ req }) {
    if (!req) return null;
    const s = String(req.status).toUpperCase();
    const stamp = STAMP[s] || STAMP.REJECTED;
    return (
        <section className={paper} aria-label="Last change request">
            <div className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
                <span className={`-rotate-6 rounded-md border-[3px] px-4 py-2 font-serif text-xl font-extrabold tracking-wider ${stamp}`}>{s}</span>
                <div className="min-w-0">
                    <p className="font-serif text-lg font-bold text-slate-900 dark:text-white">Last change request</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Sent on {req.requested_at}</p>
                    {s === "PENDING" && <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Waiting for the admin to review it.</p>}
                    {s !== "PENDING" && req.reviewed_at && <p className="text-sm text-slate-600 dark:text-slate-400">Reviewed on {req.reviewed_at}</p>}
                </div>
            </div>
            {s === "REJECTED" && req.rejection_reason && (
                <p className="border-t-2 border-dashed border-red-300 bg-red-50 px-5 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 sm:px-6">
                    <span className="font-semibold">Reason: </span>
                    {req.rejection_reason}
                </p>
            )}
        </section>
    );
}

export default function CandidatePage() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ party: "", manifesto: "", qualification: "", occupation: "" });

    const load = async () => {
        try {
            const d = await api("/api/voter/candidate/me");
            setData(d);
            if (d.candidate) {
                setForm({
                    party: d.party || "",
                    manifesto: d.manifesto || "",
                    qualification: d.qualification || "",
                    occupation: d.occupation || "",
                });
            }
        } catch (err) {
            if (err.status === 401) return navigate("/login");
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const change = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setSubmitting(true);
        try {
            const res = await api("/api/voter/candidate/change-request", {
                method: "POST",
                body: JSON.stringify(form),
            });
            setMessage(res.message);
            await load();
        } catch (err) {
            if (err.status === 401) return navigate("/login");
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const input = `w-full rounded-lg border-2 border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800 ${focusRing}`;
    const label = "mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200";

    return (
        <div className="min-h-screen bg-stone-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            {/* Tricolour hairline */}
            <div className="flex h-1" aria-hidden="true">
                <i className="flex-1 bg-orange-500" />
                <i className="flex-1 bg-white" />
                <i className="flex-1 bg-green-600" />
            </div>

            <header className="sticky top-0 z-20 border-b border-slate-300 bg-stone-100/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-800 text-white">
                            <IconBallot className="h-5 w-5" />
                        </span>
                        <h1 className="font-serif text-lg font-bold tracking-tight">My candidate page</h1>
                    </div>
                    <Link
                        to="/voter/dashboard"
                        className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-300 ${focusRing}`}
                    >
                        <IconBack />
                        Back to dashboard
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-3xl space-y-9 px-4 py-10 sm:px-6">
                {loading && (
                    <div className="animate-pulse rounded-xl border-2 border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-900" aria-label="Loading">
                        <div className="h-7 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="mt-6 h-16 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <div className="mt-4 h-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </div>
                )}

                {error && (
                    <div role="alert" className="flex items-start gap-2 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {data && !data.candidate && (
                    <div className="rounded-xl border-2 border-dashed border-slate-400 px-6 py-14 text-center dark:border-slate-600">
                        <p className="font-serif text-xl font-bold">You are not an approved candidate.</p>
                        <Link to="/voter/dashboard" className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-800 hover:underline dark:text-violet-300 ${focusRing}`}>
                            <IconBack />
                            Go back to dashboard
                        </Link>
                    </div>
                )}

                {data?.candidate && (
                    <>
                        {/* Profile: nomination paper */}
                        <article className={paper}>
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 p-5 dark:border-slate-200 sm:p-6">
                                <div className="min-w-0">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Candidate</p>
                                    <h2 className="font-serif text-3xl font-bold leading-tight text-slate-900 dark:text-white">{data.name}</h2>
                                </div>
                                <span className="inline-flex -rotate-3 items-center gap-1.5 rounded-md border-[3px] border-emerald-700 px-3 py-1 font-serif text-base font-extrabold tracking-wider text-emerald-700 dark:border-emerald-400 dark:text-emerald-300">
                                    <IconCheck className="h-4 w-4" />
                                    {String(data.status).toUpperCase()}
                                </span>
                            </div>

                            {/* Ballot pe aap aise dikhte ho */}
                            <div className="bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:px-6">
                                How you appear on the ballot
                            </div>
                            <div className="flex items-center gap-4 px-5 py-4 sm:gap-5 sm:px-6">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-serif text-xl font-bold text-white dark:bg-slate-100 dark:text-slate-900" aria-hidden="true">
                                    {(data.name || "?").trim().charAt(0).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-lg font-semibold">{data.name}</span>
                                    <span className="block truncate text-sm text-slate-600 dark:text-slate-400">{data.party || "Independent"}</span>
                                </span>
                                {data.symbol && (
                                    <span className="hidden shrink-0 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300 sm:block">
                                        {data.symbol}
                                    </span>
                                )}
                                <span className="h-12 w-12 shrink-0 rounded-md border-2 border-slate-900 bg-white dark:border-slate-300 dark:bg-slate-900" aria-hidden="true" />
                            </div>

                            <dl className="grid gap-5 border-t-2 border-dashed border-slate-300 px-5 py-5 dark:border-slate-700 sm:grid-cols-3 sm:px-6">
                                <Detail label="Symbol" value={data.symbol} />
                                <Detail label="Occupation" value={data.occupation} />
                                <Detail label="Qualification" value={data.qualification} />
                            </dl>

                            <div className="border-t-2 border-slate-900 px-5 py-5 dark:border-slate-200 sm:px-6">
                                <h3 className="font-serif text-xl font-bold">Manifesto</h3>
                                {data.manifesto ? (
                                    <p className="mt-3 max-w-prose whitespace-pre-line break-words border-l-4 border-violet-700 pl-4 font-serif text-[17px] leading-8 text-slate-700 dark:border-violet-400 dark:text-slate-300">
                                        {data.manifesto}
                                    </p>
                                ) : (
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No manifesto added yet.</p>
                                )}
                            </div>
                        </article>

                        <RequestStatus req={data.latestRequest} />

                        {/* Change request form */}
                        <form onSubmit={submit} className={paper}>
                            <div className="border-b-2 border-slate-900 px-5 py-4 dark:border-slate-200 sm:px-6">
                                <h2 className="font-serif text-2xl font-bold">Request a change</h2>
                                <p className="mt-1 max-w-prose text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Change only what you need. The admin will review your request. Your profile above updates only after it is approved.
                                </p>
                            </div>

                            <div className="space-y-5 p-5 sm:p-6">
                                {!data.canRequest && (
                                    <p className="flex items-start gap-2 rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                                        <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                        {data.blockReason}
                                    </p>
                                )}

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="block">
                                        <span className={label}>Party</span>
                                        <input className={input} value={form.party} onChange={change("party")} disabled={!data.canRequest} maxLength={100} />
                                    </label>
                                    <label className="block">
                                        <span className={label}>Occupation</span>
                                        <input className={input} value={form.occupation} onChange={change("occupation")} disabled={!data.canRequest} maxLength={100} />
                                    </label>
                                    <label className="block sm:col-span-2">
                                        <span className={label}>Qualification</span>
                                        <input className={input} value={form.qualification} onChange={change("qualification")} disabled={!data.canRequest} maxLength={100} />
                                    </label>
                                    <label className="block sm:col-span-2">
                                        <span className={`${label} flex items-center justify-between`}>
                                            Manifesto
                                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{form.manifesto.length} / 5000</span>
                                        </span>
                                        <textarea className={`${input} resize-y leading-relaxed`} rows={6} value={form.manifesto} onChange={change("manifesto")} disabled={!data.canRequest} maxLength={5000} />
                                    </label>
                                </div>

                                {message && (
                                    <p className="inline-flex items-start gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
                                        {message}
                                    </p>
                                )}
                            </div>

                            <div className="border-t-2 border-slate-900 bg-slate-50 p-5 dark:border-slate-200 dark:bg-slate-950/50 sm:p-6">
                                <button type="submit" disabled={!data.canRequest || submitting} className={`${inkBtn} w-full sm:w-auto`}>
                                    {submitting ? (
                                        <>
                                            <Spinner />
                                            Sending…
                                        </>
                                    ) : (
                                        <>
                                            <IconSend className="h-4 w-4" />
                                            Send request to admin
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}