import {Link} from "react-router-dom";
import {useEffect, useState} from "react";

/* ==================================================================
   Forgot PIN: 3 steps (mobile -> OTP -> new PIN)
   Backend: POST /api/auth/forgot-pin/send | /verify | /reset
   Needs: React 18+, Tailwind. Fonts same as Login.jsx (Public Sans, Source Serif 4).
   ================================================================== */

const sans = {fontFamily: "'Public Sans', 'Noto Sans Devanagari', system-ui, sans-serif"};
const serif = {fontFamily: "'Source Serif 4', 'Noto Serif Devanagari', Georgia, serif"};

const RESEND_SECONDS = 30;
const STEPS = ["Mobile number", "Enter OTP", "New PIN"];

async function post(path, body) {
    const res = await fetch(`/api/auth/forgot-pin/${path}`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || "Something went wrong. Please try again.");
        err.status = res.status;
        throw err;
    }
    return data;
}

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a35c8] focus-visible:ring-offset-2 dark:focus-visible:ring-violet-300 dark:focus-visible:ring-offset-slate-900";

const inputCls =
    "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-lg tracking-wide text-slate-900 placeholder:text-base placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#4a35c8] focus:outline-none focus:ring-4 focus:ring-[#4a35c8]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-300";

const primaryBtn =
    `flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1d1459] to-[#4a35c8] px-4 py-4 text-base font-semibold text-white shadow-lg shadow-[#4a35c8]/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500 disabled:shadow-none dark:disabled:from-slate-800 dark:disabled:to-slate-800 ${focusRing}`;

const linkCls = `rounded font-semibold text-[#3b2a9c] hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline dark:text-violet-300 ${focusRing}`;

export default function ForgotPin() {
    const [step, setStep] = useState(1);
    const [mobile, setMobile] = useState("");
    const [code, setCode] = useState("");
    const [token, setToken] = useState("");
    const [pin, setPin] = useState("");
    const [pin2, setPin2] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        document.title = "Reset PIN | E-Voting System";
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
        return () => clearTimeout(id);
    }, [cooldown]);

    async function run(action) {
        setError("");
        setBusy(true);
        try {
            await action();
        } catch (e) {
            if (e.status === 429) setError("Too many attempts. Please wait a few minutes and try again.");
            else if (e instanceof TypeError) setError("Can't reach the server. Check your connection and try again.");
            else setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    const sendOtp = () => run(async () => {
        await post("send", {contactNo: mobile});
        setCode("");
        setCooldown(RESEND_SECONDS);
        setStep(2);
    });

    const verifyOtp = () => run(async () => {
        const data = await post("verify", {contactNo: mobile, code});
        setToken(data.resetToken);
        setStep(3);
    });

    const savePin = () => run(async () => {
        await post("reset", {contactNo: mobile, resetToken: token, newPin: pin});
        setToken("");
        setStep(4);
    });

    const digits = (setter, max) => (e) => setter(e.target.value.replace(/\D/g, "").slice(0, max));
    const onEnter = (action, enabled) => (e) => {
        if (e.key === "Enter" && enabled && !busy) action();
    };

    const mobileOk = /^\d{10}$/.test(mobile);
    const codeOk = /^\d{4,8}$/.test(code);
    const pinOk = /^\d{4,6}$/.test(pin);
    const match = pin === pin2;

    return (
        <div style={sans} className="flex min-h-screen flex-col bg-[#f5f4fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="flex h-1.5" aria-hidden="true">
                <div className="flex-1 bg-[#ff9933]"/>
                <div className="flex-1 bg-white dark:bg-slate-400"/>
                <div className="flex-1 bg-[#138808]"/>
            </div>

            <main className="flex flex-1 items-center justify-center px-4 py-10">
                <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(29,20,89,0.45)] dark:border-slate-800 dark:bg-slate-900 sm:p-9">

                    {step < 4 && (
                        <ol className="mb-6 flex gap-1.5" aria-label="Progress">
                            {STEPS.map((label, i) => (
                                <li key={label} className="flex-1" aria-current={step === i + 1 ? "step" : undefined}>
                                    <span className={`block h-1.5 rounded-full transition-colors duration-500 ${
                                        step > i + 1 ? "bg-[#138808]" : step === i + 1 ? "bg-[#ff9933]" : "bg-slate-200 dark:bg-slate-700"}`}/>
                                    <span className={`mt-1.5 block text-xs ${step === i + 1 ? "font-semibold text-[#1a1446] dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{label}</span>
                                </li>
                            ))}
                        </ol>
                    )}

                    {error && (
                        <div role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-3 text-sm text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <section>
                            <h1 style={serif} className="text-3xl font-semibold tracking-tight text-[#1a1446] dark:text-slate-50">Reset your PIN</h1>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Enter the mobile number you registered with. We'll text you a one-time code.
                            </p>
                            <label htmlFor="mobile" className="mb-1.5 mt-6 block text-sm font-semibold">Mobile number</label>
                            <div className="flex items-center overflow-hidden rounded-xl border-2 border-slate-200 bg-white focus-within:border-[#4a35c8] focus-within:ring-4 focus-within:ring-[#4a35c8]/15 dark:border-slate-700 dark:bg-slate-950">
                                <span className="select-none self-stretch bg-slate-100 px-4 py-3.5 text-lg font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">+91</span>
                                <input id="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" autoFocus
                                       placeholder="10-digit mobile number" value={mobile}
                                       onChange={digits(setMobile, 10)} onKeyDown={onEnter(sendOtp, mobileOk)}
                                       className="w-full bg-transparent px-4 py-3.5 text-lg tracking-wide placeholder:text-base placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none"/>
                            </div>
                            <button type="button" className={`${primaryBtn} mt-6`} disabled={busy || !mobileOk} onClick={sendOtp}>
                                {busy ? "Sending code" : "Send code"}
                            </button>
                        </section>
                    )}

                    {step === 2 && (
                        <section>
                            <h1 style={serif} className="text-3xl font-semibold tracking-tight text-[#1a1446] dark:text-slate-50">Enter the code</h1>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                If +91 {mobile} is registered, a code is on its way. It expires in 10 minutes.
                            </p>
                            <label htmlFor="otp" className="mb-1.5 mt-6 block text-sm font-semibold">One-time code</label>
                            <input id="otp" className={inputCls} inputMode="numeric" autoComplete="one-time-code" autoFocus
                                   placeholder="6-digit code" value={code}
                                   onChange={digits(setCode, 8)} onKeyDown={onEnter(verifyOtp, codeOk)}/>
                            <button type="button" className={`${primaryBtn} mt-6`} disabled={busy || !codeOk} onClick={verifyOtp}>
                                {busy ? "Checking" : "Verify code"}
                            </button>
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <button type="button" className={linkCls} onClick={() => { setError(""); setStep(1); }}>
                                    Change number
                                </button>
                                <button type="button" className={linkCls} disabled={busy || cooldown > 0} onClick={sendOtp}>
                                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                                </button>
                            </div>
                        </section>
                    )}

                    {step === 3 && (
                        <section>
                            <h1 style={serif} className="text-3xl font-semibold tracking-tight text-[#1a1446] dark:text-slate-50">Set a new PIN</h1>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Choose 4 to 6 digits. You'll use it to log in and to cast your vote.
                            </p>
                            <label htmlFor="pin" className="mb-1.5 mt-6 block text-sm font-semibold">New PIN</label>
                            <input id="pin" className={inputCls} type="password" inputMode="numeric" autoComplete="new-password" autoFocus
                                   placeholder="4 to 6 digit PIN" value={pin} onChange={digits(setPin, 6)}/>
                            <label htmlFor="pin2" className="mb-1.5 mt-4 block text-sm font-semibold">Confirm new PIN</label>
                            <input id="pin2" className={inputCls} type="password" inputMode="numeric" autoComplete="new-password"
                                   placeholder="Enter the PIN again" value={pin2} onChange={digits(setPin2, 6)}
                                   onKeyDown={onEnter(savePin, pinOk && match)} aria-invalid={pin2.length > 0 && !match}/>
                            {pin2.length > 0 && !match && (
                                <p className="mt-1.5 text-sm text-red-700 dark:text-red-300">The two PINs don't match.</p>
                            )}
                            <button type="button" className={`${primaryBtn} mt-6`} disabled={busy || !pinOk || !match} onClick={savePin}>
                                {busy ? "Saving" : "Save new PIN"}
                            </button>
                        </section>
                    )}

                    {step === 4 && (
                        <section role="status" className="text-center">
                            <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24" fill="none" aria-hidden="true">
                                <circle cx="60" cy="60" r="52" stroke="#138808" strokeWidth="5"/>
                                <path d="M38 62l15 15 30-34" stroke="#138808" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <h1 style={serif} className="mt-5 text-3xl font-semibold tracking-tight text-[#1a1446] dark:text-slate-50">PIN updated</h1>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Log in with your new PIN.</p>
                            <Link to="/login" className={`${primaryBtn} mt-6`}>Go to log in</Link>
                        </section>
                    )}

                    {step < 4 && (
                        <p className="mt-7 border-t border-slate-200 pt-5 text-center text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                            Remembered your PIN?{" "}
                            <Link to="/login" className={linkCls}>Back to log in</Link>
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}