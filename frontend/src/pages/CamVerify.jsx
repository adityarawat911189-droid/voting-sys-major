import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/*
  Step 2 of voter registration: Aadhaar upload + live selfie.
  Fonts: load 'Source Serif 4' and 'Public Sans' once in index.html (same as Register.jsx).
*/

const VERIFY_ENDPOINT = "/api/register/verify";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

const heading = "font-['Source_Serif_4',serif]";
const body = "font-['Public_Sans',sans-serif]";
const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 dark:ring-offset-slate-950";
const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600 ${focusRing}`;
const btnSecondary = `inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 ${focusRing}`;

/* ---------- API ---------- */

// Isolated so the endpoint or payload is easy to change.
// Returns { status, message }. Network failures throw a TypeError (handled by the caller).
async function submitVerification({ idImage, selfie }) {
    const formData = new FormData();
    formData.append("idImage", idImage);
    formData.append("selfie", selfie, "selfie.jpg");

    const res = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        body: formData, // no manual Content-Type: the browser sets the multipart boundary
        credentials: "include", // sends the HttpOnly reg_token cookie from Step 1
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        /* response had no JSON body */
    }
    return { status: res.status, message: data?.message };
}

/* ---------- helpers ---------- */

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateIdFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return "This file type is not supported. Upload a JPG or PNG image of your Aadhaar card.";
    }
    if (file.size > MAX_BYTES) {
        return `This file is ${formatBytes(file.size)}. The maximum size is 5 MB. Choose a smaller image.`;
    }
    return null;
}

const CAMERA_MESSAGES = {
    denied:
        "Camera access is blocked. Select the camera or lock icon in your browser's address bar, set Camera to Allow, then choose Start camera again.",
    none: "No camera was found on this device. Connect a camera or open this page on a device that has one.",
    busy: "Your camera is being used by another app or browser tab. Close it, then try again.",
    insecure:
        "The camera works only on secure pages. Open this site with https (or on localhost).",
    other: "The camera could not be started. Please try again.",
};

function classifyCameraError(err) {
    switch (err?.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
        case "SecurityError":
            return "denied";
        case "NotFoundError":
        case "DevicesNotFoundError":
        case "OverconstrainedError":
            return "none";
        case "NotReadableError":
        case "TrackStartError":
        case "AbortError":
            return "busy";
        default:
            return "other";
    }
}

/* ---------- icons ---------- */

const Svg = ({ children, className = "h-5 w-5" }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
    >
        {children}
    </svg>
);
const CheckIcon = (p) => (
    <Svg {...p}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
);
const UploadIcon = (p) => (
    <Svg {...p}>
        <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
    </Svg>
);
const CameraIcon = (p) => (
    <Svg {...p}>
        <path d="M4 8a2 2 0 012-2h1.5l1.2-1.6A1 1 0 019.5 4h5a1 1 0 01.8.4L16.5 6H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
        <circle cx="12" cy="12.5" r="3.5" />
    </Svg>
);
const AlertIcon = (p) => (
    <Svg {...p}>
        <path d="M12 8v5m0 3.5h.01M10.3 4.2L2.8 17.5A2 2 0 004.5 20.5h15a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z" />
    </Svg>
);
const ShieldIcon = (p) => (
    <Svg {...p}>
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
    </Svg>
);
const Spinner = ({ className = "h-4 w-4" }) => (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

/* ---------- small components ---------- */

function Brand({ light = false }) {
    return (
        <div className="flex items-center gap-2.5">
      <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              light ? "bg-white/10 text-white" : "bg-indigo-900 text-white dark:bg-indigo-700"
          }`}
      >
        <ShieldIcon />
      </span>
            <span
                className={`${heading} text-lg font-semibold ${
                    light ? "text-white" : "text-indigo-950 dark:text-white"
                }`}
            >
        National e-Voting
      </span>
        </div>
    );
}

function Stepper() {
    return (
        <nav aria-label="Registration progress">
            <ol className="flex items-center gap-3">
                <li className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-900 text-white dark:bg-indigo-700">
            <CheckIcon className="h-4 w-4" />
          </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
            <span className="sr-only">Step 1 complete: </span>Your details
          </span>
                </li>
                <li aria-hidden="true" className="h-px w-8 bg-slate-300 dark:bg-slate-700" />
                <li className="flex items-center gap-2" aria-current="step">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
            2
          </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
            <span className="sr-only">Step 2, current: </span>Aadhaar and photo
          </span>
                </li>
            </ol>
        </nav>
    );
}

const BANNER_TONES = {
    error:
        "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",
    warn: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
    info: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200",
};

function Banner({ tone = "error", children }) {
    return (
        <div
            role={tone === "error" ? "alert" : "status"}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${BANNER_TONES[tone]}`}
        >
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>{children}</div>
        </div>
    );
}

function SectionTitle({ id, title, hint }) {
    return (
        <div className="mb-3">
            <h2 id={id} className={`${heading} text-xl font-semibold text-slate-900 dark:text-white`}>
                {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{hint}</p>
        </div>
    );
}

/* ---------- Feature 1: ID upload ---------- */

function IdUpload({ file, onChange }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState("");
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const accept = useCallback(
        (picked) => {
            if (!picked) return;
            const problem = validateIdFile(picked);
            if (problem) {
                setError(problem);
                return;
            }
            setError("");
            onChange(picked);
        },
        [onChange]
    );

    const openPicker = () => inputRef.current?.click();

    const remove = () => {
        setError("");
        onChange(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const onInputChange = (e) => {
        accept(e.target.files?.[0]);
        e.target.value = ""; // lets the same file be chosen again
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
    };

    return (
        <section aria-labelledby="id-title">
            <SectionTitle
                id="id-title"
                title="Aadhaar card"
                hint="Upload a clear photo of the front of your card. JPG or PNG, up to 5 MB."
            />

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={onInputChange}
            />

            {file && previewUrl ? (
                <div className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center">
                    <img
                        src={previewUrl}
                        alt="Preview of your uploaded Aadhaar card"
                        className="h-36 w-full rounded-lg border border-slate-200 object-contain dark:border-slate-700 dark:bg-slate-900 sm:w-56"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckIcon className="h-4 w-4" /> ID image ready
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-900 dark:text-slate-100">{file.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{formatBytes(file.size)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={openPicker} className={btnSecondary}>
                                Replace
                            </button>
                            <button type="button" onClick={remove} className={btnSecondary}>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={`flex flex-col items-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                        dragging
                            ? "border-violet-600 bg-violet-50 dark:bg-violet-950/30"
                            : "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/50"
                    }`}
                >
                    <UploadIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        Drag and drop your Aadhaar image here, or
                    </p>
                    <button type="button" onClick={openPicker} className={`${btnSecondary} mt-3`}>
                        Choose file
                    </button>
                </div>
            )}

            <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-red-700 dark:text-red-400">
                {error}
            </p>
        </section>
    );
}

/* ---------- Feature 2: live camera capture ---------- */

function CameraCapture({ onChange }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const mountedRef = useRef(true);
    const [status, setStatus] = useState("idle"); // idle | loading | live | captured | error
    const [errorKind, setErrorKind] = useState(null);
    const [notice, setNotice] = useState("");
    const [shot, setShot] = useState(null); // { blob, url }
    const [confirmed, setConfirmed] = useState(false);

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    // Stop the camera on unmount and revoke any preview URL.
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            stopStream();
        };
    }, [stopStream]);

    useEffect(() => {
        if (!shot) return undefined;
        return () => URL.revokeObjectURL(shot.url);
    }, [shot]);

    // Stop the camera when the tab is hidden or the page is left.
    useEffect(() => {
        const halt = () => {
            if (!streamRef.current) return;
            stopStream();
            setStatus("idle");
            setNotice("The camera was turned off because you left this tab. Choose Start camera to continue.");
        };
        const onVisibility = () => document.hidden && halt();
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("pagehide", halt);
        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("pagehide", halt);
        };
    }, [stopStream]);

    // Attach the stream once the <video> is on screen.
    useEffect(() => {
        if (status === "live" && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => {});
        }
    }, [status]);

    const start = async () => {
        setNotice("");
        setErrorKind(null);

        if (!window.isSecureContext) {
            setErrorKind("insecure");
            setStatus("error");
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setErrorKind("none");
            setStatus("error");
            return;
        }

        setStatus("loading");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
            if (!mountedRef.current) {
                stream.getTracks().forEach((t) => t.stop());
                return;
            }
            streamRef.current = stream;
            setStatus("live");
        } catch (err) {
            if (!mountedRef.current) return;
            setErrorKind(classifyCameraError(err));
            setStatus("error");
        }
    };

    const capture = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Drawn as-is: the saved image is NOT mirrored (only the preview is).
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        stopStream();
        canvas.toBlob(
            (blob) => {
                if (!mountedRef.current) return;
                if (!blob) {
                    setErrorKind("other");
                    setStatus("error");
                    return;
                }
                setShot({ blob, url: URL.createObjectURL(blob) });
                setConfirmed(false);
                setStatus("captured");
            },
            "image/jpeg",
            0.9
        );
    };

    const retake = () => {
        setShot(null);
        setConfirmed(false);
        onChange(null);
        start();
    };

    const confirm = () => {
        setConfirmed(true);
        onChange(shot.blob);
    };

    return (
        <section aria-labelledby="selfie-title">
            <SectionTitle
                id="selfie-title"
                title="Live photo"
                hint="Take a photo with your camera. It will be compared with the photo on your ID. Photos from your gallery are not accepted."
            />

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900">
                {status === "live" && (
                    <>
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            autoPlay
                            aria-label="Live camera preview"
                            className="h-full w-full -scale-x-100 object-cover"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-dashed border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"
                        />
                        <p className="absolute inset-x-0 bottom-0 bg-slate-950/60 px-3 py-2 text-center text-xs text-white sm:text-sm">
                            Face the camera in good light. Remove cap and glasses.
                        </p>
                    </>
                )}

                {status === "captured" && shot && (
                    <img src={shot.url} alt="Your captured photo" className="h-full w-full object-cover" />
                )}

                {status === "loading" && (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-200">
                        <Spinner className="h-7 w-7" />
                        <p className="text-sm">Starting camera. Allow access if your browser asks.</p>
                    </div>
                )}

                {(status === "idle" || status === "error") && (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-slate-300">
                        <CameraIcon className="h-9 w-9" />
                        <p className="text-sm">
                            {status === "error" ? "Camera unavailable" : "Your camera is off"}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {(status === "idle" || status === "error") && (
                    <button type="button" onClick={start} className={btnSecondary}>
                        <CameraIcon className="h-4 w-4" />
                        {status === "error" ? "Try again" : "Start camera"}
                    </button>
                )}
                {status === "live" && (
                    <button type="button" onClick={capture} className={btnPrimary}>
                        <CameraIcon className="h-4 w-4" />
                        Capture photo
                    </button>
                )}
                {status === "captured" && (
                    <>
                        <button type="button" onClick={retake} className={btnSecondary}>
                            Retake
                        </button>
                        {!confirmed && (
                            <button type="button" onClick={confirm} className={btnPrimary}>
                                Use this photo
                            </button>
                        )}
                    </>
                )}
            </div>

            <div aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm">
                {status === "error" && errorKind && (
                    <p className="text-red-700 dark:text-red-400">{CAMERA_MESSAGES[errorKind]}</p>
                )}
                {notice && status !== "error" && (
                    <p className="text-slate-600 dark:text-slate-400">{notice}</p>
                )}
                {status === "captured" && confirmed && (
                    <p className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckIcon className="h-4 w-4" /> Photo ready
                    </p>
                )}
            </div>
        </section>
    );
}

/* ---------- page ---------- */

export default function CamVerify() {
    const navigate = useNavigate();
    const [idImage, setIdImage] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState(null); // { tone, text, showLogin? }

    const canSubmit = Boolean(idImage && selfie) && !submitting;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setBanner(null);
        setSubmitting(true);

        try {
            const { status, message } = await submitVerification({ idImage, selfie });

            if (status >= 200 && status < 300) {
                navigate("/register/set-pin");
                return;
            }
            if (status === 400 || status === 422) {
                setBanner({
                    tone: "error",
                    text: message || "We could not verify your photos. Please check them and try again.",
                });
            } else if (status === 401) {
                navigate("/register", {
                    state: { message: "Your session has expired. Please start your registration again." },
                });
                return;
            } else if (status === 409) {
                setBanner({
                    tone: "warn",
                    text: message || "You are already registered.",
                });
            } else {
                setBanner({
                    tone: "error",
                    text: message || "Something went wrong on our side. Please try again.",
                });
            }
        } catch (err) {
            setBanner({
                tone: "error",
                text:
                    err instanceof TypeError
                        ? "Can't reach the server. Check your connection and try again."
                        : "Something went wrong. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const points = [
        "Your photos are used only to verify your identity.",
        "Everything is sent over a secure connection.",
        "You can retake or replace either photo before you submit.",
    ];

    return (
        <div className={`${body} flex min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100`}>
            {/* Trust panel (desktop) */}
            <aside className="hidden w-[40%] max-w-xl flex-col justify-between bg-indigo-950 p-12 text-white lg:flex">
                <Brand light />
                <div>
                    <h1 className={`${heading} text-4xl font-semibold leading-tight`}>
                        One last check to confirm it is really you.
                    </h1>
                    <ul className="mt-8 space-y-4">
                        {points.map((p) => (
                            <li key={p} className="flex items-start gap-3 text-indigo-100">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <CheckIcon className="h-4 w-4" />
                </span>
                                <span>{p}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="text-sm text-indigo-300">Secure voter registration</p>
            </aside>

            {/* Form side */}
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-12 lg:py-12">
                <div className="mx-auto w-full max-w-xl">
                    <div className="mb-8 lg:hidden">
                        <Brand />
                    </div>

                    <Stepper />

                    <h1 className={`${heading} mt-8 text-3xl font-semibold text-slate-900 dark:text-white lg:hidden`}>
                        Aadhaar and photo
                    </h1>
                    <h2 className={`${heading} mt-8 hidden text-3xl font-semibold text-slate-900 dark:text-white lg:block`}>
                        Aadhaar and photo
                    </h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Upload your Aadhaar card and take a live photo of your face.
                    </p>

                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-10">
                        <IdUpload file={idImage} onChange={setIdImage} />
                        <CameraCapture onChange={setSelfie} />

                        <div>
                            <div aria-live="polite" className="mb-4">
                                {banner && (
                                    <Banner tone={banner.tone}>
                                        <p>{banner.text}</p>
                                    </Banner>
                                )}
                            </div>

                            <button type="submit" disabled={!canSubmit} className={`${btnPrimary} w-full`}>
                                {submitting ? (
                                    <>
                                        <Spinner />
                                        <span>Verifying…</span>
                                    </>
                                ) : (
                                    "Verify and continue"
                                )}
                            </button>

                            <p className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                Your photos are used only to verify your identity.
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}