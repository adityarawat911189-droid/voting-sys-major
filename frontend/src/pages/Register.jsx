import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const MOBILE_RE = /^\d{10}$/;

async function checkEligibility({ name, contactNo, dob }) {
    const res = await fetch("/api/register/check", {
        method: "POST",
        credentials: "include", // reg_token cookie save hone ke liye
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contactNo, dob }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || "Something went wrong. Please try again.");
        err.status = res.status;
        throw err;
    }
    return data;
}

function ageFrom(dob) {
    const d = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
}

const display = "font-['Source_Serif_4',Georgia,serif]";

const inputBase =
    "w-full rounded-lg border bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
const inputOk =
    "border-slate-300 focus:border-indigo-700 focus:ring-indigo-700/15 dark:border-slate-700 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20";
const inputBad =
    "border-red-500 focus:border-red-600 focus:ring-red-500/15 dark:border-red-400";

function Field({ id, label, error, hint, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                {label}
            </label>
            {children}
            {error ? (
                <p id={`${id}-msg`} className="mt-1.5 text-sm text-red-700 dark:text-red-300">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-msg`} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

function Stepper() {
    return (
        <ol className="flex items-center gap-3 text-sm" aria-label="Registration progress">
            <li className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200" aria-current="step">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-900 text-xs text-white dark:bg-indigo-400 dark:text-indigo-950">
                    1
                </span>
                Your details
            </li>
            <span aria-hidden="true" className="h-px w-8 bg-slate-300 dark:bg-slate-700" />
            <li className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-xs dark:border-slate-700">
                    2
                </span>
                Aadhaar and photo
            </li>
        </ol>
    );
}

const points = [
    ["Matched to official records", "We check your name, mobile and date of birth against the electoral roll."],
    ["Verified in the next step", "Aadhaar and a live photo confirm it is really you."],
    ["Your vote stays anonymous", "Registration and voting are kept separate by design."],
];

export default function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [dob, setDob] = useState("");
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [banner, setBanner] = useState(null);

    const today = new Date().toISOString().split("T")[0];
    const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));

    const errors = {
        name: name.trim().length < 2 ? "Enter your full name." : "",
        mobile: !MOBILE_RE.test(mobile) ? "Enter a 10-digit mobile number." : "",
        dob: dob === "" ? "Select your date of birth." : ageFrom(dob) < 18 ? "You must be 18 or older to register." : "",
    };
    const valid = !errors.name && !errors.mobile && !errors.dob;
    const show = (k) => (touched[k] ? errors[k] : "");

    async function handleSubmit(e) {
        e.preventDefault();
        setTouched({ name: true, mobile: true, dob: true });
        if (!valid || loading) return;
        setBanner(null);
        setLoading(true);
        try {
            await checkEligibility({ name, contactNo: mobile, dob });
            navigate("/CamVerify"); // Stage 2 (Aadhaar + live photo)
        } catch (err) {
            if (err.status === 409) setBanner({ type: "info", text: err.message });
            else if (err instanceof TypeError)
                setBanner({ type: "error", text: "Can't reach the server. Check your connection and try again." });
            else setBanner({ type: "error", text: err.message });
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-['Public_Sans',system-ui,sans-serif] dark:bg-slate-950 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* Left: trust panel */}
            <aside className="relative hidden overflow-hidden bg-indigo-950 px-14 py-14 text-indigo-50 lg:flex lg:flex-col lg:justify-between">
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 14h16v6H4z" />
                            <path d="M8 14V9l4-5 4 5v5" />
                            <path d="M12 9v2" />
                        </svg>
                    </span>
                    <span className="text-base font-semibold tracking-wide">National e-Voting</span>
                </div>

                <div className="max-w-md">
                    <div className="mb-6 flex items-end gap-4">
                        {/* the one memorable element: the voter's ink mark */}
                        <span aria-hidden="true" className="h-24 w-3.5 rounded-full bg-gradient-to-b from-violet-300 to-violet-600" />
                        <h2 className={`${display} text-4xl font-semibold leading-tight`}>
                            Register once. Vote from anywhere.
                        </h2>
                    </div>
                    <p className="text-indigo-200">
                        Two short steps to confirm you are an eligible voter. It takes about three minutes.
                    </p>

                    <ul className="mt-10 space-y-6">
                        {points.map(([t, d]) => (
                            <li key={t} className="flex gap-4">
                                <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 flex-none text-violet-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                                </svg>
                                <div>
                                    <p className="font-semibold">{t}</p>
                                    <p className="text-sm text-indigo-200">{d}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-sm text-indigo-300">Need help? Contact your local election helpdesk.</p>
            </aside>

            {/* Right: form */}
            <main className="flex items-center justify-center px-5 py-10 sm:px-8">
                <div className="w-full max-w-md">
                    {/* compact brand for mobile */}
                    <div className="mb-8 flex items-center gap-2 text-indigo-950 dark:text-indigo-100 lg:hidden">
                        <span className="h-6 w-1.5 rounded-full bg-violet-600" aria-hidden="true" />
                        <span className="font-semibold">National e-Voting</span>
                    </div>

                    <Stepper />

                    <h1 className={`${display} mt-8 text-3xl font-semibold text-slate-900 dark:text-white`}>
                        Verify your details
                    </h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Enter them exactly as they appear in your records.
                    </p>

                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
                        {banner && (
                            <div
                                role="alert"
                                className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${
                                    banner.type === "info"
                                        ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200"
                                        : "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200"
                                }`}
                            >
                                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 8v5M12 16.5v.01" />
                                </svg>
                                <p>
                                    {banner.text}
                                    {banner.type === "info" && (
                                        <>
                                            {" "}
                                            <Link to="/" className="font-semibold underline underline-offset-2">
                                                Go to login
                                            </Link>
                                        </>
                                    )}
                                </p>
                            </div>
                        )}

                        <Field id="name" label="Full name" error={show("name")}>
                            <input
                                id="name" type="text" autoComplete="name" value={name}
                                onChange={(e) => setName(e.target.value)} onBlur={() => touch("name")}
                                placeholder="Name as per records"
                                aria-invalid={!!show("name")} aria-describedby="name-msg"
                                className={`${inputBase} ${show("name") ? inputBad : inputOk}`}
                            />
                        </Field>

                        <Field id="mobile" label="Mobile number" error={show("mobile")} hint="We send no OTP at this step.">
                            <div className="flex">
                                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-3.5 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    +91
                                </span>
                                <input
                                    id="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    onBlur={() => touch("mobile")}
                                    placeholder="10-digit number"
                                    aria-invalid={!!show("mobile")} aria-describedby="mobile-msg"
                                    className={`${inputBase} rounded-l-none tabular-nums tracking-wide ${show("mobile") ? inputBad : inputOk}`}
                                />
                            </div>
                        </Field>

                        <Field id="dob" label="Date of birth" error={show("dob")}>
                            <input
                                id="dob" type="date" max={today} value={dob}
                                onChange={(e) => setDob(e.target.value)} onBlur={() => touch("dob")}
                                aria-invalid={!!show("dob")} aria-describedby="dob-msg"
                                className={`${inputBase} ${show("dob") ? inputBad : inputOk}`}
                            />
                        </Field>

                        <button
                            type="submit" disabled={loading}
                            className={`flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-900 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-700/30 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 ${
                                !valid && !loading ? "opacity-70" : ""
                            }`}
                        >
                            {loading && (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            )}
                            {loading ? "Checking your details" : "Continue to verification"}
                        </button>

                        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                            Already registered?{" "}
                            <Link to="/" className="font-semibold text-indigo-800 underline underline-offset-2 dark:text-indigo-300">
                                Log in
                            </Link>
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
}