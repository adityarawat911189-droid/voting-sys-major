import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/* ---------- Icons ---------- */

function ShieldIcon({ className = "h-6 w-6" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.4-7.5 9.5-4.4-1.1-7.5-4.9-7.5-9.5V6L12 3z" />
            <path d="M8.75 12.25l2.25 2.25 4.25-4.5" />
        </svg>
    );
}

function CheckIcon({ className = "h-4 w-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
    );
}

function EyeIcon({ className = "h-5 w-5" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon({ className = "h-5 w-5" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A10.4 10.4 0 0112 5c6.4 0 10 7 10 7a17.7 17.7 0 01-3.2 4.1" />
            <path d="M6.6 6.6A17.4 17.4 0 002 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1" />
            <path d="M9.9 9.9a3 3 0 004.2 4.2" />
        </svg>
    );
}

function AlertIcon({ className = "h-5 w-5" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5" />
            <path d="M12 16.25h.01" />
        </svg>
    );
}

function SpinnerIcon({ className = "h-5 w-5" }) {
    return (
        <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

/* ---------- Banner ---------- */

const TONES = {
    error: {
        box: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",
        icon: "text-red-600 dark:text-red-400",
    },
    warn: {
        box: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
        icon: "text-amber-600 dark:text-amber-400",
    },
    info: {
        box: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200",
        icon: "text-indigo-600 dark:text-indigo-400",
    },
};

function Banner({ tone = "info", children }) {
    const t = TONES[tone] || TONES.info;
    return (
        <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-lg border p-4 text-sm leading-relaxed ${t.box}`}>
            <AlertIcon className={`mt-0.5 h-5 w-5 shrink-0 ${t.icon}`} />
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

/* ---------- Stepper ---------- */

function Stepper({ finished }) {
    const steps = [
        { label: "Your details", state: "done" },
        { label: "Aadhaar and photo", state: "done" },
        { label: "Set PIN", state: finished ? "done" : "current" },
    ];

    return (
        <nav aria-label="Registration progress">
            <ol className="flex items-center gap-2 sm:gap-3">
                {steps.map((step, i) => (
                    <li key={step.label} className="contents">
                        <div className="flex items-center gap-2" {...(step.state === "current" ? { "aria-current": "step" } : {})}>
              <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      step.state === "current"
                          ? "bg-violet-600 text-white"
                          : "bg-indigo-900 text-white dark:bg-indigo-500"
                  }`}
              >
                {step.state === "done" ? <CheckIcon /> : i + 1}
                  {step.state === "done" && <span className="sr-only"> completed</span>}
              </span>
                            <span
                                className={`text-xs sm:text-sm ${
                                    step.state === "current"
                                        ? "font-semibold text-slate-900 dark:text-slate-100"
                                        : "hidden font-medium text-slate-600 sm:inline dark:text-slate-400"
                                }`}
                            >
                {step.label}
              </span>
                        </div>
                        {i < steps.length - 1 && (
                            <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-slate-300 dark:bg-slate-700" />
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

/* ---------- PIN field ---------- */

function PinField({
                      id,
                      label,
                      value,
                      onChange,
                      onBlur,
                      onKeyDown,
                      show,
                      onToggle,
                      toggleName,
                      error,
                      hint,
                      inputRef,
                  }) {
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">
                {label}
            </label>
            <div className="relative">
                <input
                    ref={inputRef}
                    id={id}
                    name={id}
                    type={show ? "text" : "password"}
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={6}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={describedBy}
                    className={`block w-full rounded-lg border bg-white py-3 pl-4 pr-12 text-base tracking-[0.3em] text-slate-900 placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-4 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                        error
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:focus:ring-red-500/30"
                            : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20 dark:border-slate-700 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/30"
                    }`}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    aria-pressed={show}
                    aria-label={show ? `Hide ${toggleName}` : `Show ${toggleName}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:text-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/30 dark:text-slate-400 dark:hover:text-slate-100 dark:focus-visible:ring-indigo-400/40"
                >
                    {show ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
            <div aria-live="polite" className="mt-1.5 min-h-5 text-sm">
                {error && (
                    <p id={errorId} className="text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}
                {!error && hint && (
                    <p id={hintId} className="text-amber-700 dark:text-amber-400">
                        {hint}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ---------- Helpers ---------- */

const PIN_PATTERN = /^\d{4,6}$/;

function isWeakPin(pin) {
    if (!PIN_PATTERN.test(pin)) return false;
    const d = pin.split("").map(Number);
    const allSame = d.every((n) => n === d[0]);
    const ascending = d.every((n, i) => i === 0 || n === d[i - 1] + 1);
    const descending = d.every((n, i) => i === 0 || n === d[i - 1] - 1);
    return allSame || ascending || descending;
}

async function submitPin({ pin, confirmPin }) {
    const response = await fetch("/api/register/set-pin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, confirmPin }),
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    return { status: response.status, message: data?.message };
}

/* ---------- Page ---------- */

export default function SetPin() {
    const navigate = useNavigate();

    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [touched, setTouched] = useState({ pin: false, confirm: false });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState(null);
    const [done, setDone] = useState(false);

    const pinRef = useRef(null);
    const successRef = useRef(null);

    const pinValid = PIN_PATTERN.test(pin);
    const confirmValid = confirmPin === pin && confirmPin.length > 0;
    const formValid = pinValid && confirmValid;

    const pinError = (touched.pin || submitted) && !pinValid ? "PIN must be 4 to 6 digits." : "";
    const confirmError = (touched.confirm || submitted) && !confirmValid ? "PINs do not match." : "";
    const weakHint = isWeakPin(pin) ? "This PIN is easy to guess. Consider a different one." : "";

    useEffect(() => {
        pinRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!done) return undefined;
        successRef.current?.focus();
        const timer = setTimeout(() => navigate("/"), 3000);
        return () => clearTimeout(timer);
    }, [done, navigate]);

    const handlePinChange = (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
    const handleConfirmChange = (e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitted(true);
        if (!formValid) return;

        setBanner(null);
        setSubmitting(true);
        let leaving = false;

        try {
            const { status, message } = await submitPin({ pin, confirmPin });
            const serverMessage = typeof message === "string" && message.trim() ? message : "";

            if (status >= 200 && status < 300) {
                setPin("");
                setConfirmPin("");
                setShowPin(false);
                setShowConfirm(false);
                setDone(true);
            } else if (status === 400 || status === 422) {
                setBanner({ tone: "error", message: serverMessage || "Please check your PIN and try again." });
            } else if (status === 401) {
                leaving = true;
                navigate("/register", {
                    state: { message: "Your session has expired. Please start your registration again." },
                });
            } else if (status === 409) {
                setBanner({
                    tone: "warn",
                    message: serverMessage || "This account is already registered.",
                    showLogin: true,
                });
            } else if (status === 429) {
                setBanner({
                    tone: "error",
                    message: serverMessage || "Too many attempts. Please try again in a few minutes.",
                });
            } else {
                setBanner({ tone: "error", message: "Something went wrong on our side. Please try again." });
            }
        } catch (err) {
            if (err instanceof TypeError) {
                setBanner({ tone: "error", message: "Can't reach the server. Check your connection and try again." });
            } else {
                setBanner({ tone: "error", message: "Something went wrong on our side. Please try again." });
            }
        } finally {
            if (!leaving) setSubmitting(false);
        }
    };

    const handleEnter = (e) => {
        if (e.key === "Enter") handleSubmit(e);
    };

    return (
        <div className="flex min-h-screen font-['Public_Sans',sans-serif] text-slate-900 dark:text-slate-100">
            {/* Trust panel (desktop) */}
            <aside className="hidden w-[42%] max-w-xl flex-col justify-between bg-indigo-950 p-12 text-white lg:flex">
                <div className="flex items-center gap-3">
                    <ShieldIcon className="h-8 w-8 text-violet-300" />
                    <span className="font-['Source_Serif_4',serif] text-xl font-semibold">National e-Voting</span>
                </div>

                <div>
                    <h2 className="font-['Source_Serif_4',serif] text-4xl font-semibold leading-tight">
                        Last step. Secure your account with a PIN.
                    </h2>
                    <ul className="mt-8 space-y-4">
                        {[
                            "Your PIN protects your voting account.",
                            "Never share your PIN with anyone, including election officials.",
                            "You can also add fingerprint login later.",
                        ].map((text) => (
                            <li key={text} className="flex items-start gap-3 text-indigo-100">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                                <span className="leading-relaxed">{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-sm text-indigo-300">Secure voter registration</p>
            </aside>

            {/* Form side */}
            <main className="flex-1 bg-white px-4 py-6 sm:px-8 sm:py-10 dark:bg-slate-950">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-8 flex items-center gap-2 lg:hidden">
                        <ShieldIcon className="h-6 w-6 text-indigo-900 dark:text-indigo-300" />
                        <span className="font-['Source_Serif_4',serif] text-lg font-semibold text-indigo-900 dark:text-indigo-200">
              National e-Voting
            </span>
                    </div>

                    <Stepper finished={done} />

                    {done ? (
                        <div role="status" className="mt-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                                <CheckIcon className="h-8 w-8" />
                            </div>
                            <h1
                                ref={successRef}
                                tabIndex={-1}
                                className="mt-6 font-['Source_Serif_4',serif] text-3xl font-semibold focus:outline-none"
                            >
                                Registration complete
                            </h1>
                            <p className="mt-3 text-slate-600 dark:text-slate-400">
                                You can now log in with your mobile number and PIN.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="mt-8 w-full rounded-lg bg-indigo-900 px-5 py-3 font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/40 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                            >
                                Go to login
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 className="mt-10 font-['Source_Serif_4',serif] text-3xl font-semibold">Set your PIN</h1>
                            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-400">
                                Choose a 4 to 6 digit PIN. You will use it with your mobile number to log in.
                            </p>

                            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-2" aria-busy={submitting}>
                                {banner && (
                                    <div className="mb-4">
                                        <Banner tone={banner.tone}>
                                            <p>{banner.message}</p>
                                            {banner.showLogin && (
                                                <Link
                                                    to="/"
                                                    className="mt-2 inline-block font-semibold underline underline-offset-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/40"
                                                >
                                                    Go to login
                                                </Link>
                                            )}
                                        </Banner>
                                    </div>
                                )}

                                <PinField
                                    id="pin"
                                    label="PIN"
                                    inputRef={pinRef}
                                    value={pin}
                                    onChange={handlePinChange}
                                    onBlur={() => setTouched((t) => ({ ...t, pin: true }))}
                                    onKeyDown={handleEnter}
                                    show={showPin}
                                    onToggle={() => setShowPin((v) => !v)}
                                    toggleName="PIN"
                                    error={pinError}
                                    hint={weakHint}
                                />

                                <PinField
                                    id="confirm-pin"
                                    label="Confirm PIN"
                                    value={confirmPin}
                                    onChange={handleConfirmChange}
                                    onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                                    onKeyDown={handleEnter}
                                    show={showConfirm}
                                    onToggle={() => setShowConfirm((v) => !v)}
                                    toggleName="confirm PIN"
                                    error={confirmError}
                                />

                                <button
                                    type="submit"
                                    disabled={!formValid || submitting}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-900 px-5 py-3 font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-900 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:disabled:hover:bg-indigo-600"
                                >
                                    {submitting ? (
                                        <>
                                            <SpinnerIcon />
                                            <span>Saving your PIN</span>
                                        </>
                                    ) : (
                                        "Set PIN and finish"
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}