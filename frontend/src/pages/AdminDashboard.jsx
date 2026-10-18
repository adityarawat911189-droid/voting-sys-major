import { useState, useEffect } from "react";

/* ───────── Styling ─────────
   Saari nayi styling is file ke andar STYLES me hai (ap- classes), isliye
   Tailwind rebuild / restart pe depend nahi karti. Logic kisi feature me change nahi hai. */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@700;900&display=swap');
.ap-root{min-height:100vh;display:flex;flex-direction:column;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0f172a}
.ap-root button,.ap-root input,.ap-root select,.ap-root textarea{font-family:inherit}
.ap-serif{font-family:Merriweather,Georgia,"Times New Roman",serif}
.ap-tri{display:flex;height:4px}.ap-tri i{flex:1}.ap-tri i:nth-child(1){background:#ff9933}.ap-tri i:nth-child(2){background:#fff}.ap-tri i:nth-child(3){background:#138808}
.ap-header{position:sticky;top:0;z-index:20;box-shadow:0 6px 18px rgba(7,20,43,.35)}
.ap-hbar{position:relative;overflow:hidden;background:linear-gradient(90deg,#07142b,#0f2a5c 50%,#07142b);color:#fff;padding:12px 24px}
.ap-hbar .ap-wm{position:absolute;right:-30px;top:-50px;color:#ff9933;opacity:.18;pointer-events:none}
.ap-hin{position:relative;max-width:1408px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px}
.ap-brand{display:flex;align-items:center;gap:12px}
.ap-emblem{width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.1);box-shadow:0 0 0 2px #ff9933;display:flex;align-items:center;justify-content:center;color:#ff9933;flex-shrink:0}
.ap-title{margin:0;font-size:18px;font-weight:900;line-height:1.25}
.ap-sub{margin:2px 0 0;font-size:12px;color:#cbd5e1}
.ap-right{display:flex;align-items:center;gap:16px}
.ap-clock{display:none;text-align:right}.ap-clock b{display:block;font-size:14px;font-variant-numeric:tabular-nums}.ap-clock span{font-size:12px;color:#cbd5e1}
.ap-user{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);border-radius:99px;padding:4px 12px 4px 4px;font-size:12px;font-weight:600}
.ap-user i{width:28px;height:28px;border-radius:50%;background:#ff9933;color:#0b1d3a;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:700}
.ap-body{display:flex;flex-direction:column;flex:1;width:100%;max-width:1408px;margin:0 auto}
.ap-nav{background:linear-gradient(180deg,#0b1d3a,#12307a);padding:12px}
.ap-navlist{display:flex;gap:4px;overflow-x:auto}
.ap-grp{display:flex;gap:4px}
.ap-grp-t{display:none;margin:0;padding:0 12px 4px;color:#ff9933;font-size:12px;font-weight:700}
.ap-item{display:flex;align-items:center;gap:12px;width:100%;white-space:nowrap;background:transparent;border:0;border-left:4px solid transparent;border-radius:8px;padding:10px 12px;color:#cbd5e1;font-size:14px;text-align:left;cursor:pointer}
.ap-item svg{flex-shrink:0}
.ap-item:hover{background:rgba(255,255,255,.08);color:#fff}
.ap-item.on{border-left-color:#ff9933;background:rgba(255,255,255,.14);color:#fff;font-weight:600}
.ap-item:focus-visible{outline:2px solid rgba(255,255,255,.7)}
.ap-main{flex:1;min-width:0;padding:16px;background-color:#edf0f7;background-image:radial-gradient(#cfd6e6 1px,transparent 1px);background-size:22px 22px}
.ap-hero{position:relative;overflow:hidden;border-radius:16px;padding:28px 24px 34px;color:#fff;background:radial-gradient(circle at 88% 15%,rgba(255,153,51,.40),transparent 45%),linear-gradient(120deg,#07142b 0%,#143272 50%,#2a5cc4 100%);box-shadow:0 22px 40px -14px rgba(11,29,58,.55)}
.ap-hero .ap-wm{position:absolute;right:-70px;top:-70px;color:#ff9933;opacity:.30;pointer-events:none}
.ap-hero .ap-wm2{position:absolute;left:-60px;bottom:-90px;color:#fff;opacity:.07;pointer-events:none}
.ap-hero-in{position:relative;max-width:640px}
.ap-hero h2{margin:0;font-size:28px;font-weight:900;line-height:1.25}
.ap-hero p{margin:12px 0 0;color:#e2e8f0;font-size:15px;line-height:1.6}
.ap-hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
.ap-qbtn{border:1px solid rgba(255,255,255,.5);background:transparent;color:#fff;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer}
.ap-qbtn:hover{background:rgba(255,255,255,.14)}
.ap-qbtn.pri{background:#ff9933;border-color:#ff9933;color:#0b1d3a}.ap-qbtn.pri:hover{background:#ffab57}
.ap-hero .ap-tri{position:absolute;left:0;right:0;bottom:0;height:6px}
.ap-sec{margin-top:40px}
.ap-sec-t{display:flex;align-items:center;gap:12px;margin:0 0 16px;font-size:16px;font-weight:700;color:#0b1d3a}
.ap-sec-t i{width:6px;height:20px;border-radius:99px;background:var(--bar)}
.ap-grid{display:grid;gap:16px;grid-template-columns:1fr}
.ap-card{position:relative;overflow:hidden;text-align:left;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px 20px 18px;box-shadow:0 1px 2px rgba(15,23,42,.06);cursor:pointer;transition:transform .15s,box-shadow .15s}
.ap-card:hover{transform:translateY(-3px);box-shadow:0 16px 30px -10px rgba(11,29,58,.3)}
.ap-card:focus-visible{outline:3px solid rgba(27,63,139,.4)}
.ap-card::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:var(--bar)}
.ap-tile{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--tint);color:var(--fg);flex-shrink:0}
.ap-card b{display:block;margin-top:16px;font-size:15px;color:#0b1d3a}
.ap-card .d{display:block;margin-top:4px;font-size:14px;color:#475569}
.ap-open{display:flex;align-items:center;gap:4px;margin-top:16px;font-size:14px;font-weight:600;color:var(--fg)}
.ap-g-elections{--bar:#ff9933;--tint:#fff1e0;--fg:#b45f06}
.ap-g-candidates{--bar:#1b3f8b;--tint:#e6edfb;--fg:#1b3f8b}
.ap-g-voters{--bar:#138808;--tint:#e3f4e1;--fg:#0d6a05}
.ap-g-oversight{--bar:#8a1c2b;--tint:#fbe9ec;--fg:#8a1c2b}
.ap-crumb{display:flex;align-items:center;gap:6px;margin:0 0 12px;font-size:12px;font-weight:500;color:#475569}
.ap-crumb button{background:none;border:0;padding:0;color:inherit;cursor:pointer}.ap-crumb button:hover{color:#1b3f8b;text-decoration:underline}
.ap-crumb em{font-style:normal;color:#0f172a}
.ap-panel{overflow:hidden;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 20px 40px -18px rgba(11,29,58,.35)}
.ap-panel-bar{height:6px;background:var(--bar)}
.ap-panel-h{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid #e2e8f0;background:linear-gradient(90deg,#f3f6fc,#fff)}
.ap-panel-h>div{display:flex;align-items:center;gap:16px}
.ap-panel-h h2{margin:0;font-size:20px;font-weight:900;color:#0b1d3a}
.ap-panel-h p{margin:2px 0 0;font-size:14px;color:#475569}
.ap-panel-b{padding:24px}
.ap-w-n{max-width:672px}.ap-w-w{max-width:1024px}
.ap-foot{background:#07142b;color:#cbd5e1}.ap-foot p{margin:0;padding:16px 24px;text-align:center;font-size:12px}
/* forms & shared bits */
.ap-input{display:block;width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:10px 14px;font-size:14px;color:#0f172a;box-shadow:0 1px 2px rgba(15,23,42,.05)}
.ap-input::placeholder{color:#94a3b8}
.ap-input:focus{outline:none;border-color:#1b3f8b;box-shadow:0 0 0 4px rgba(27,63,139,.15)}
.ap-input:disabled{background:#f1f5f9;color:#94a3b8}
.ap-label{display:block;margin-bottom:6px;font-size:14px;font-weight:600;color:#334155}
.ap-hint{margin:6px 0 0;font-size:12px;color:#64748b}
.ap-btn{display:block;width:100%;border:0;border-radius:8px;padding:12px 16px;font-size:14px;font-weight:600;color:#fff;cursor:pointer;box-shadow:0 6px 14px -4px rgba(20,50,114,.5)}
.ap-btn:disabled{opacity:.5;cursor:not-allowed}
.ap-btn-primary{background:linear-gradient(180deg,#2150ad,#143272)}.ap-btn-primary:hover:not(:disabled){background:linear-gradient(180deg,#2a5cc4,#1a3d8a)}
.ap-btn-danger{background:linear-gradient(180deg,#b91c1c,#7f1313);box-shadow:0 6px 14px -4px rgba(127,19,19,.5)}.ap-btn-danger:hover:not(:disabled){background:linear-gradient(180deg,#c92a2a,#901818)}
.ap-btn-royal{flex-shrink:0;border:0;border-radius:8px;background:#1b3f8b;color:#fff;padding:8px 20px;font-size:14px;font-weight:600;cursor:pointer}
.ap-btn-royal:hover:not(:disabled){background:#143272}.ap-btn-royal:disabled{opacity:.6}
.ap-mla{margin-left:auto}
.ap-ghost{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:6px 14px;font-size:14px;font-weight:600;color:#334155;cursor:pointer;box-shadow:0 1px 2px rgba(15,23,42,.05)}
.ap-ghost:hover:not(:disabled){background:#f8fafc}.ap-ghost:disabled{opacity:.5;cursor:not-allowed}
.ap-sbtn{border:0;border-radius:8px;padding:6px 16px;font-size:14px;font-weight:600;color:#fff;cursor:pointer}
.ap-sbtn:disabled{opacity:.6;cursor:not-allowed}
.ap-sbtn.green{background:#166534}.ap-sbtn.green:hover:not(:disabled){background:#15803d}
.ap-sbtn.red{background:#991b1b}.ap-sbtn.red:hover:not(:disabled){background:#b91c1c}
.ap-sbtn.redline{background:#fff;border:1px solid #fca5a5;color:#991b1b}.ap-sbtn.redline:hover:not(:disabled){background:#fef2f2}
.ap-alert{border:1px solid;border-left-width:4px;border-radius:8px;padding:10px 16px;font-size:14px;font-weight:500}
.ap-alert-ok{background:#f0fdf4;border-color:#bbf7d0;border-left-color:#15803d;color:#14532d}
.ap-alert-err{background:#fef2f2;border-color:#fecaca;border-left-color:#b91c1c;color:#7f1d1d}
.ap-alert-warn{background:#fffbeb;border-color:#fde68a;border-left-color:#d97706;color:#78350f}
.ap-info{margin-top:8px;border-radius:8px;background:#f1f5f9;padding:8px 12px;font-size:12px;color:#475569}
.ap-h3{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:14px;font-weight:700;color:#0b1d3a}
.ap-h3 i{width:4px;height:16px;border-radius:99px;background:#ff9933}
.ap-pager{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:16px;font-size:14px;color:#475569}
.ap-tablewrap{overflow-x:auto;border:1px solid #e2e8f0;border-radius:8px}
.ap-table{width:100%;border-collapse:collapse}
.ap-table tbody tr:hover{background:#f8fafc}
.ap-th{padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#334155;background:#e8edf5;border-bottom:1px solid #cbd5e1;white-space:nowrap}
.ap-td{padding:10px 12px;font-size:14px;color:#334155;border-bottom:1px solid #f1f5f9}
.ap-badge{display:inline-block;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:700}
.ap-badge-admin{margin-left:8px;background:#e6edfb;color:#1b3f8b}
.ap-badge-on{background:#dcfce7;color:#166534}.ap-badge-off{background:#f1f5f9;color:#64748b}
.ap-rows{overflow:hidden;border:1px solid #e2e8f0;border-radius:8px}
.ap-row{display:grid;grid-template-columns:1fr 2fr;gap:16px;padding:9px 16px;font-size:14px}
.ap-row:nth-child(odd){background:#f8fafc}
.ap-row span:first-child{color:#64748b}.ap-row span:last-child{font-weight:500;color:#0f172a}
.ap-filter{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:12px}
.ap-audit{border:1px solid #e2e8f0;border-left:4px solid #1b3f8b;border-radius:8px;background:#fff;padding:12px 16px}
.ap-tabs{display:flex;gap:4px;border-bottom:1px solid #e2e8f0}
.ap-tab{margin-bottom:-1px;border:0;border-bottom:3px solid transparent;background:none;padding:8px 18px;font-size:14px;font-weight:600;color:#64748b;cursor:pointer}
.ap-tab:hover{color:#0f172a}.ap-tab.on{border-bottom-color:#ff9933;color:#0b1d3a}
@media(min-width:640px){
  .ap-main{padding:32px}.ap-hero{padding:44px 44px 50px}.ap-hero h2{font-size:38px}
  .ap-clock{display:block}.ap-title{font-size:21px}.ap-grid{grid-template-columns:repeat(2,1fr)}.ap-panel-b{padding:32px}.ap-panel-h{padding:22px 32px}
}
@media(min-width:1024px){
  .ap-body{flex-direction:row}
  .ap-nav{width:288px;flex-shrink:0;padding:16px}
  .ap-navlist{flex-direction:column;overflow:visible}
  .ap-grp{flex-direction:column;margin-top:22px}.ap-grp-t{display:block}
}
@media(min-width:1280px){.ap-grid{grid-template-columns:repeat(3,1fr)}}
`;

const inputClass = "ap-input";
const labelClass = "ap-label";
const btnPrimary = "ap-btn ap-btn-primary";
const btnDanger = "ap-btn ap-btn-danger";
const btnGhost = "ap-ghost";
const hint = "ap-hint";

const ICONS = {
    home: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    "create-election": "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM12 13v6M9 16h6",
    "add-candidate-to-election": "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6",
    "cancel-election": "M12 22a10 10 0 100-20 10 10 0 000 20zM15 9l-6 6M9 9l6 6",
    "create-candidate": "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
    "change-requests": "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M9 14l2 2 4-4",
    "remove-candidate": "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 11h-6",
    "voter-list": "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    "search-voter": "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
    "audit-log": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
    "view-results": "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3",
    chevron: "M9 6l6 6-6 6",
};

function Icon({ name, size = 20 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONS[name]} />
        </svg>
    );
}

/* 24-spoke wheel, sirf decoration */
function Chakra({ size = 40, className = "" }) {
    const spokes = Array.from({ length: 24 }, (_, i) => {
        const a = (i * 15 * Math.PI) / 180;
        return [50 + 11 * Math.cos(a), 50 + 11 * Math.sin(a), 50 + 41 * Math.cos(a), 50 + 41 * Math.sin(a)];
    });
    const dots = Array.from({ length: 24 }, (_, i) => {
        const a = ((i * 15 + 7.5) * Math.PI) / 180;
        return [50 + 44 * Math.cos(a), 50 + 44 * Math.sin(a)];
    });
    return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="50" cy="50" r="47" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="9" strokeWidth="2.5" />
            {spokes.map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.4" />
            ))}
            {dots.map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="1.3" fill="currentColor" stroke="none" />
            ))}
        </svg>
    );
}

function Alert({ type, children }) {
    const ok = type === "ok";
    return (
        <div role={ok ? "status" : "alert"} className={"ap-alert " + (ok ? "ap-alert-ok" : "ap-alert-err")}>
            {children}
        </div>
    );
}

function Pager({ page, pages, loading, onPrev, onNext }) {
    return (
        <div className="ap-pager">
            <button type="button" disabled={page <= 1 || loading} onClick={onPrev} className={btnGhost}>
                Previous
            </button>
            <span>
                Page <b>{page}</b> of {pages}
            </span>
            <button type="button" disabled={page >= pages || loading} onClick={onNext} className={btnGhost}>
                Next
            </button>
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <h3 className="ap-h3">
            <i />
            {children}
        </h3>
    );
}

/* ───────── Feature pages ─────────
   Har button ka apna component. Naya feature = naya component + FEATURES me ek line. */

function CreateCandidate() {
    const [form, setForm] = useState({
        name: "",
        partyName: "",
        manifesto: "",
        qualification: "",
        occupation: "",
        phone: "",
    });
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/admin/candidates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || err.error || `Error ${res.status}`);
            }
            setMsg({ type: "ok", text: "Candidate created successfully" });
            setForm({ ...form, name: "", partyName: "", manifesto: "", qualification: "", occupation: "", phone: "" });
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Party Name</label>
                    <input name="partyName" value={form.partyName} onChange={handleChange} required className={inputClass} />
                </div>
            </div>

            <div>
                <label className={labelClass}>Manifesto</label>
                <textarea name="manifesto" rows={4} value={form.manifesto} onChange={handleChange} required className={inputClass} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Qualification</label>
                    <input name="qualification" value={form.qualification} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Occupation</label>
                    <input name="occupation" value={form.occupation} onChange={handleChange} required className={inputClass} />
                </div>
            </div>

            <div>
                <label className={labelClass}>Phone No.</label>
                <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    title="Please enter a valid 10-digit mobile number"
                    className={inputClass}
                />
                <p className={hint}>10-digit mobile number</p>
            </div>

            {msg && <Alert type={msg.type}>{msg.text}</Alert>}

            <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? "Creating..." : "Create Candidate"}
            </button>
        </form>
    );
}

function CreateElection() {
    const empty = {
        title: "", description: "", electionType: "STATE",
        state: "", city: "", wardNo: "",
        nominationStart: "", nominationEnd: "", startTime: "", endTime: "",
    };
    const [form, setForm] = useState(empty);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const t = form.electionType;
    const needState = t !== "COUNTRY";
    const needCity = t === "CITY" || t === "WARD";
    const needWard = t === "WARD";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);
        try {
            const body = {
                title: form.title,
                description: form.description,
                electionType: t,
                state: needState ? form.state : null,
                city: needCity ? form.city : null,
                wardNo: needWard ? Number(form.wardNo) : null,
                nominationStart: form.nominationStart,
                nominationEnd: form.nominationEnd,
                startTime: form.startTime,
                endTime: form.endTime,
            };
            const res = await fetch("http://localhost:8080/api/admin/elections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || err.error || `Error ${res.status}`);
            }
            setMsg({ type: "ok", text: "Election created successfully (DRAFT)" });
            setForm(empty);
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelClass}>Title</label>
                <input name="title" value={form.title} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
                <label className={labelClass}>Description</label>
                <textarea name="description" rows={3} value={form.description} onChange={handleChange} className={inputClass} />
            </div>

            <div>
                <label className={labelClass}>Election Type</label>
                <select name="electionType" value={form.electionType} onChange={handleChange} className={inputClass}>
                    <option value="COUNTRY">Country</option>
                    <option value="STATE">State</option>
                    <option value="CITY">City</option>
                    <option value="WARD">Ward</option>
                </select>
            </div>

            {(needState || needCity || needWard) && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {needState && (
                        <div>
                            <label className={labelClass}>State</label>
                            <input name="state" value={form.state} onChange={handleChange} required className={inputClass} />
                        </div>
                    )}
                    {needCity && (
                        <div>
                            <label className={labelClass}>City</label>
                            <input name="city" value={form.city} onChange={handleChange} required className={inputClass} />
                        </div>
                    )}
                    {needWard && (
                        <div>
                            <label className={labelClass}>Ward No.</label>
                            <input type="number" min="1" name="wardNo" value={form.wardNo} onChange={handleChange} required className={inputClass} />
                        </div>
                    )}
                </div>
            )}

            <div>
                <SectionTitle>Schedule</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Nomination Start</label>
                        <input type="datetime-local" name="nominationStart" value={form.nominationStart} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Nomination End</label>
                        <input type="datetime-local" name="nominationEnd" value={form.nominationEnd} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Voting Start</label>
                        <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Voting End</label>
                        <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required className={inputClass} />
                    </div>
                </div>
            </div>

            {msg && <Alert type={msg.type}>{msg.text}</Alert>}

            <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? "Creating..." : "Create Election"}
            </button>
        </form>
    );
}

function AddCandidateToElection() {
    const API = "http://localhost:8080/api/admin/election-candidates";
    const [elections, setElections] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [electionId, setElectionId] = useState("");
    const [candidateId, setCandidateId] = useState("");
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const readError = async (res) => {
        const err = await res.json().catch(() => ({}));
        return err.message || err.error || `Error ${res.status}`;
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/elections`);
                if (!res.ok) throw new Error(await readError(res));
                setElections(await res.json());
            } catch (e) {
                setMsg({ type: "err", text: e.message });
            }
        })();
    }, []);

    const loadCandidates = async (id) => {
        setCandidates([]);
        setCandidateId("");
        if (!id) return;
        try {
            const res = await fetch(`${API}/candidates?electionId=${id}`);
            if (!res.ok) throw new Error(await readError(res));
            setCandidates(await res.json());
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        }
    };

    const handleElection = (e) => {
        setElectionId(e.target.value);
        setMsg(null);
        loadCandidates(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ electionId: Number(electionId), candidateId: Number(candidateId) }),
            });
            if (!res.ok) throw new Error(await readError(res));
            setMsg({ type: "ok", text: "Candidate added to the election successfully" });
            await loadCandidates(electionId);
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        } finally {
            setLoading(false);
        }
    };

    const selected = elections.find((x) => String(x.id) === electionId);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelClass}>Election</label>
                <select value={electionId} onChange={handleElection} required className={inputClass}>
                    <option value="">Select an election</option>
                    {elections.map((x) => (
                        <option key={x.id} value={x.id}>
                            {x.title} ({x.election_type})
                        </option>
                    ))}
                </select>
                {elections.length === 0 && !msg && (
                    <p className={hint}>There are no upcoming elections at the moment.</p>
                )}
                {selected && (
                    <p className="ap-info">
                        Type: {selected.election_type}
                        {selected.state ? `, ${selected.state}` : ""}
                        {selected.city ? `, ${selected.city}` : ""}
                        {selected.ward_no ? `, Ward ${selected.ward_no}` : ""}
                        {" | "}Nomination closes: {selected.nomination_end}
                    </p>
                )}
            </div>

            <div>
                <label className={labelClass}>Candidate</label>
                <select
                    value={candidateId}
                    onChange={(e) => setCandidateId(e.target.value)}
                    required
                    disabled={!electionId}
                    className={inputClass}
                >
                    <option value="">{electionId ? "Select a candidate" : "Select an election first"}</option>
                    {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name} ({c.party || "Independent"}) - {c.city}
                        </option>
                    ))}
                </select>
                {electionId && candidates.length === 0 && (
                    <p className={hint}>No candidates found for this election.</p>
                )}
            </div>

            {msg && <Alert type={msg.type}>{msg.text}</Alert>}

            <button type="submit" disabled={loading || !electionId || !candidateId} className={btnPrimary}>
                {loading ? "Adding..." : "Add Candidate to Election"}
            </button>
        </form>
    );
}

function CancelElection() {
    const API = "http://localhost:8080/api/admin/election-cancel";
    const [elections, setElections] = useState([]);
    const [electionId, setElectionId] = useState("");
    const [reason, setReason] = useState("");
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const readError = async (res) => {
        const err = await res.json().catch(() => ({}));
        return err.message || err.error || `Error ${res.status}`;
    };

    const load = async () => {
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error(await readError(res));
            setElections(await res.json());
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        }
    };

    useEffect(() => {
        load();
    }, []);

    const selected = elections.find((x) => String(x.id) === electionId);
    const reasonOk = reason.trim().length >= 10;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        const extra = selected.status === "ONGOING" ? "\n\nThis election is currently ongoing." : "";
        if (!window.confirm(`Are you sure you want to cancel "${selected.title}"? This action cannot be undone.${extra}`)) return;
        setLoading(true);
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ electionId: Number(electionId), reason: reason.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
            setMsg({ type: "ok", text: data.message });
            setElectionId("");
            setReason("");
            await load();
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="ap-alert ap-alert-warn">
                Cancelling an election is permanent and is recorded in the audit log.
            </div>

            <div>
                <label className={labelClass}>Election</label>
                <select value={electionId} onChange={(e) => { setElectionId(e.target.value); setMsg(null); }} required className={inputClass}>
                    <option value="">Select an election</option>
                    {elections.map((x) => (
                        <option key={x.id} value={x.id}>
                            {x.title} ({x.election_type}) - {x.status}
                        </option>
                    ))}
                </select>
                {elections.length === 0 && !msg && (
                    <p className={hint}>There are no elections available to cancel.</p>
                )}
                {selected && (
                    <p className="ap-info">
                        Status: {selected.status} | Voting start: {selected.start_time} | Candidates: {selected.candidate_count}
                    </p>
                )}
            </div>

            <div>
                <div className="flex items-baseline justify-between">
                    <label className={labelClass}>Reason for cancellation</label>
                    <span className="text-xs text-slate-500">{reason.length}/500</span>
                </div>
                <textarea
                    rows={4}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className={inputClass}
                />
                {reason.length > 0 && !reasonOk && (
                    <p className="mt-1 text-xs text-red-600">{10 - reason.trim().length} more characters required.</p>
                )}
            </div>

            {msg && <Alert type={msg.type}>{msg.text}</Alert>}

            <button type="submit" disabled={loading || !electionId || !reasonOk} className={btnDanger}>
                {loading ? "Cancelling..." : "Cancel Election"}
            </button>
        </form>
    );
}

function RemoveCandidate() {
    const API = "http://localhost:8080/api/admin/candidate-removal/demote";
    const [form, setForm] = useState({ name: "", phone: "", reason: "" });
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const reasonOk = form.reason.trim().length >= 10;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        if (!window.confirm(`Are you sure you want to convert ${form.name.trim()} (${form.phone}) from a candidate back to a regular voter?`)) return;
        setLoading(true);
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    reason: form.reason.trim(),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
            setMsg({ type: "ok", text: data.message });
            setForm({ name: "", phone: "", reason: "" });
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Candidate Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Phone No.</label>
                    <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        pattern="[6-9][0-9]{9}"
                        maxLength={10}
                        title="Please enter a valid 10-digit mobile number"
                        className={inputClass}
                    />
                </div>
            </div>

            <div>
                <div className="flex items-baseline justify-between">
                    <label className={labelClass}>Reason for removal</label>
                    <span className="text-xs text-slate-500">{form.reason.length}/500</span>
                </div>
                <textarea
                    name="reason"
                    rows={3}
                    maxLength={500}
                    value={form.reason}
                    onChange={handleChange}
                    required
                    className={inputClass}
                />
                {form.reason.length > 0 && !reasonOk && (
                    <p className="mt-1 text-xs text-red-600">{10 - form.reason.trim().length} more characters required.</p>
                )}
            </div>

            {msg && <Alert type={msg.type}>{msg.text}</Alert>}

            <button type="submit" disabled={loading || !reasonOk} className={btnDanger}>
                {loading ? "Processing..." : "Convert Candidate to Voter"}
            </button>
        </form>
    );
}

function VoterList() {
    const API = "http://localhost:8080/api/admin/voters";
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setMsg(null);
            try {
                const res = await fetch(`${API}?page=${page}&size=15`);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || err.error || `Error ${res.status}`);
                }
                const json = await res.json();
                if (alive) setData(json);
            } catch (e) {
                if (alive) setMsg(e.message);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [page]);

    const th = "ap-th";
    const td = "ap-td";

    return (
        <div className="space-y-4">
            {msg && <Alert type="err">{msg}</Alert>}
            {loading && !data && <p className="text-sm text-slate-500">Loading...</p>}

            {data && (
                <>
                    <p className="text-sm text-slate-600">
                        Total voters: <span className="font-semibold text-slate-900">{data.total}</span>
                    </p>
                    <div className={"ap-tablewrap " + (loading ? "opacity-60" : "")}>
                        <table className="ap-table">
                            <thead>
                            <tr>
                                <th className={th}>ID</th>
                                <th className={th}>Name</th>
                                <th className={th}>Gender</th>
                                <th className={th}>Location</th>
                                <th className={th}>Contact</th>
                                <th className={th}>Registered</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.items.map((v) => (
                                <tr key={v.id}>
                                    <td className={td + " tabular-nums text-slate-500"}>{v.id}</td>
                                    <td className={td + " font-medium text-slate-900"}>
                                        {v.name}
                                        {v.role === "ADMIN" && (
                                            <span className="ap-badge ap-badge-admin">Admin</span>
                                        )}
                                    </td>
                                    <td className={td}>{v.gender || "-"}</td>
                                    <td className={td}>
                                        {v.city}, {v.state}
                                        {v.ward_no ? ` | Ward ${v.ward_no}` : ""}
                                    </td>
                                    <td className={td + " tabular-nums"}>{v.contact_no}</td>
                                    <td className={td}>
                                            <span className={"ap-badge " + (v.registered ? "ap-badge-on" : "ap-badge-off")}>
                                                {v.registered ? "Yes" : "No"}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <Pager
                        page={data.page}
                        pages={data.pages}
                        loading={loading}
                        onPrev={() => setPage(page - 1)}
                        onNext={() => setPage(page + 1)}
                    />
                </>
            )}
        </div>
    );
}

function SearchVoter() {
    const API = "http://localhost:8080/api/admin/voters";
    const [q, setQ] = useState("");
    const [results, setResults] = useState(null);
    const [voter, setVoter] = useState(null);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const readError = async (res) => {
        const err = await res.json().catch(() => ({}));
        return err.message || err.error || `Error ${res.status}`;
    };

    const openVoter = async (id) => {
        setMsg(null);
        setLoading(true);
        try {
            const res = await fetch(`${API}/${id}`);
            if (!res.ok) throw new Error(await readError(res));
            setVoter(await res.json());
        } catch (e) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setMsg(null);
        setVoter(null);
        setResults(null);
        setLoading(true);
        try {
            const res = await fetch(`${API}/search?q=${encodeURIComponent(q.trim())}`);
            if (!res.ok) throw new Error(await readError(res));
            const list = await res.json();
            if (list.length === 1) {
                await openVoter(list[0].id);
            } else {
                setResults(list);
            }
        } catch (e) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    const Row = ({ label, value }) => (
        <div className="ap-row">
            <span>{label}</span>
            <span>{value || value === 0 ? value : "-"}</span>
        </div>
    );

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    required
                    minLength={2}
                    placeholder="Name, phone, Aadhaar or voter ID"
                    className={inputClass}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="ap-btn-royal"
                >
                    {loading ? "..." : "Search"}
                </button>
            </form>

            {msg && <Alert type="err">{msg}</Alert>}

            {results && results.length === 0 && <p className="text-sm text-slate-500">No voters found.</p>}

            {results && results.length > 1 && (
                <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                    {results.map((r) => (
                        <li key={r.id}>
                            <button
                                type="button"
                                onClick={() => openVoter(r.id)}
                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50"
                            >
                                <span className="block text-sm font-medium text-slate-900">
                                    {r.name} <span className="font-normal text-slate-500">(ID {r.id})</span>
                                </span>
                                <span className="block text-xs text-slate-500">
                                    Father: {r.father_name || "-"} | {r.city}, {r.state} | {r.contact_no}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {voter && (
                <div className="space-y-4">
                    <div>
                        <SectionTitle>Voter details</SectionTitle>
                        <div className="ap-rows">
                            <Row label="Voter ID" value={voter.id} />
                            <Row label="Name" value={voter.name} />
                            <Row label="Gender" value={voter.gender} />
                            <Row label="Date of Birth" value={voter.dob} />
                            <Row label="Father's Name" value={voter.father_name} />
                            <Row label="Mother's Name" value={voter.mother_name} />
                            <Row label="Spouse's Name" value={voter.spouse_name} />
                            <Row label="Nationality" value={voter.nationality} />
                            <Row label="State" value={voter.state} />
                            <Row label="City" value={voter.city} />
                            <Row label="Ward" value={voter.ward_no} />
                            <Row label="Address" value={voter.address} />
                            <Row label="Phone" value={voter.contact_no} />
                            <Row label="Aadhaar" value={voter.aadhaar_no} />
                            <Row label="PAN" value={voter.pan_no} />
                            <Row label="Registered" value={voter.registered ? "Yes" : "No"} />
                            <Row label="Role" value={voter.role} />
                        </div>
                    </div>

                    <div>
                        <SectionTitle>Is this voter a candidate?</SectionTitle>
                        {voter.candidacy.length === 0 ? (
                            <p className="text-sm text-slate-500">No, this is a regular voter.</p>
                        ) : (
                            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-800">
                                <p>
                                    Party: {voter.candidacy[0].party || "Independent"} | Status: {voter.candidacy[0].status}
                                </p>
                                {voter.candidate_elections.length === 0 ? (
                                    <p className="mt-1 text-slate-500">Not part of any election at the moment.</p>
                                ) : (
                                    <ul className="mt-1 list-disc pl-5 text-slate-600">
                                        {voter.candidate_elections.map((e, i) => (
                                            <li key={i}>
                                                {e.title} ({e.status})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <SectionTitle>Elections voted in</SectionTitle>
                        {voter.voted_in.length === 0 ? (
                            <p className="text-sm text-slate-500">Has not voted in any election yet.</p>
                        ) : (
                            <ul className="list-disc pl-5 text-sm text-slate-600">
                                {voter.voted_in.map((e, i) => (
                                    <li key={i}>
                                        {e.title} - {e.voted_at}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function AuditLog() {
    const API = "http://localhost:8080/api/admin/audit";
    const LABELS = {
        ELECTION_NOMINATION_OPENED: "Nomination opened (auto)",
        ELECTION_STARTED: "Voting started (auto)",
        ELECTION_FAILED: "Election failed (auto)",
        ELECTION_COMPLETED: "Election completed, result generated (auto)",
        ELECTION_CREATED: "Election created",
        ELECTION_CANCELLED: "Election cancelled",
        CANDIDATE_CREATED: "Candidate created",
        CANDIDATE_ADDED_TO_ELECTION: "Candidate added to election",
        CANDIDATE_REMOVED: "Candidate converted to voter",
        CHANGE_REQUEST_APPROVED: "Change request approved",
        CHANGE_REQUEST_REJECTED: "Change request rejected",
    };
    const [action, setAction] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chain, setChain] = useState(null);

    const readError = async (res) => {
        const err = await res.json().catch(() => ({}));
        return err.message || err.error || `Error ${res.status}`;
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setMsg(null);
            try {
                const p = new URLSearchParams({ page, size: 10 });
                if (action) p.set("action", action);
                if (from) p.set("from", from);
                if (to) p.set("to", to);
                const res = await fetch(`${API}?${p}`);
                if (!res.ok) throw new Error(await readError(res));
                const json = await res.json();
                if (alive) setData(json);
            } catch (e) {
                if (alive) setMsg(e.message);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [page, action, from, to]);

    const verify = async () => {
        setChain(null);
        try {
            const res = await fetch(`${API}/verify`);
            if (!res.ok) throw new Error(await readError(res));
            setChain(await res.json());
        } catch (e) {
            setMsg(e.message);
        }
    };

    const parse = (t) => {
        try {
            return t ? JSON.parse(t) : null;
        } catch {
            return null;
        }
    };
    const fmt = (o) => (o ? Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(", ") : null);

    return (
        <div className="space-y-4">
            <div className="ap-filter">
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Action</label>
                    <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={inputClass}>
                        <option value="">All</option>
                        {Object.entries(LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
                    <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={inputClass} />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
                    <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={inputClass} />
                </div>
                <button
                    type="button"
                    onClick={() => { setAction(""); setFrom(""); setTo(""); setPage(1); }}
                    className={btnGhost}
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={verify}
                    className="ap-btn-royal ap-mla"
                >
                    Verify Chain
                </button>
            </div>

            {chain && (
                <Alert type={chain.valid ? "ok" : "err"}>
                    {chain.valid
                        ? `Log is valid: ${chain.checked} entries verified, no tampering detected.`
                        : `Log integrity issue: the chain is broken at entry id ${chain.brokenAtId}.`}
                </Alert>
            )}

            {msg && <Alert type="err">{msg}</Alert>}
            {loading && !data && <p className="text-sm text-slate-500">Loading...</p>}

            {data && data.total === 0 && <p className="text-sm text-slate-500">No entries found.</p>}

            {data && data.total > 0 && (
                <>
                    <p className="text-sm text-slate-600">
                        Total entries: <span className="font-semibold text-slate-900">{data.total}</span> (newest first)
                    </p>
                    <ul className={"space-y-2 " + (loading ? "opacity-60" : "")}>
                        {data.items.map((a) => {
                            const before = fmt(parse(a.old_value));
                            const after = fmt(parse(a.new_value));
                            return (
                                <li key={a.id} className="ap-audit space-y-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-slate-900">
                                            {LABELS[a.action] || a.action}
                                        </span>
                                        <time className="text-xs tabular-nums text-slate-500">{a.time}</time>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Admin: {a.admin} | {a.target_type} {a.target_id != null ? `#${a.target_id}` : ""}
                                    </p>
                                    {a.reason && (
                                        <p className="rounded bg-amber-50 px-2 py-1 text-sm text-amber-900">
                                            Reason: {a.reason}
                                        </p>
                                    )}
                                    {before && <p className="text-xs text-slate-600">Before: {before}</p>}
                                    {after && <p className="text-xs text-slate-600">After: {after}</p>}
                                    <p className="font-mono text-[11px] text-slate-400">
                                        {a.ref_no} | hash {a.hash_short}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>

                    <Pager
                        page={data.page}
                        pages={data.pages}
                        loading={loading}
                        onPrev={() => setPage(page - 1)}
                        onNext={() => setPage(page + 1)}
                    />
                </>
            )}
        </div>
    );
}

function ChangeRequests() {
    const API = "http://localhost:8080/api/admin/change-requests";
    const FIELDS = [
        ["party", "Party"],
        ["manifesto", "Manifesto"],
        ["qualification", "Qualification"],
        ["occupation", "Occupation"],
    ];
    const [status, setStatus] = useState("PENDING");
    const [list, setList] = useState(null);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [rejectId, setRejectId] = useState(null);
    const [reason, setReason] = useState("");
    const [tick, setTick] = useState(0);

    const readError = async (res) => {
        const err = await res.json().catch(() => ({}));
        return err.message || err.error || `Error ${res.status}`;
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}?status=${status}`);
                if (!res.ok) throw new Error(await readError(res));
                const json = await res.json();
                if (alive) setList(json);
            } catch (e) {
                if (alive) setMsg({ type: "err", text: e.message });
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [status, tick]);

    const changeStatus = (s) => {
        setStatus(s);
        setMsg(null);
        setRejectId(null);
        setReason("");
    };

    const approve = async (r) => {
        if (!window.confirm(`Approve the request for ${r.name}? The details will be updated immediately.`)) return;
        setMsg(null);
        setBusyId(r.id);
        try {
            const res = await fetch(`${API}/${r.id}/approve`, { method: "POST" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
            setMsg({ type: "ok", text: data.message });
            setTick((t) => t + 1);
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        } finally {
            setBusyId(null);
        }
    };

    const reject = async (r) => {
        setMsg(null);
        setBusyId(r.id);
        try {
            const res = await fetch(`${API}/${r.id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: reason.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
            setMsg({ type: "ok", text: data.message });
            setRejectId(null);
            setReason("");
            setTick((t) => t + 1);
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        } finally {
            setBusyId(null);
        }
    };

    const changedFields = (r) =>
        FIELDS.filter(([k]) => {
            const n = (r["new_" + k] || "").trim();
            return n && (r.status !== "PENDING" || n !== (r["cur_" + k] || "").trim());
        });

    const tabs = [
        ["PENDING", "Pending"],
        ["APPROVED", "Approved"],
        ["REJECTED", "Rejected"],
    ];

    return (
        <div className="space-y-4">
            <div className="ap-tabs">
                {tabs.map(([k, label]) => (
                    <button
                        key={k}
                        type="button"
                        onClick={() => changeStatus(k)}
                        className={"ap-tab " + (status === k ? "on" : "")}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {msg && <Alert type={msg.type}>{msg.text}</Alert>}

            {loading && !list && <p className="text-sm text-slate-500">Loading...</p>}
            {list && list.length === 0 && <p className="text-sm text-slate-500">No requests found.</p>}

            {list && list.length > 0 && (
                <ul className={"space-y-3 " + (loading ? "opacity-60" : "")}>
                    {list.map((r) => (
                        <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                    {r.name} <span className="font-normal text-slate-500">(Candidate #{r.candidate_id})</span>
                                </p>
                                <span className="text-xs text-slate-500">Submitted: {r.requested_at}</span>
                            </div>

                            <div className="mt-3 space-y-2">
                                {changedFields(r).map(([k, label]) => (
                                    <div key={k} className="rounded bg-slate-50 p-2 text-sm">
                                        <p className="text-xs font-semibold text-slate-600">{label}</p>
                                        {r.status === "PENDING" && (
                                            <p className="text-slate-500">Current: {r["cur_" + k] || "-"}</p>
                                        )}
                                        <p className="text-slate-900">
                                            {r.status === "PENDING" ? "New: " : ""}
                                            {r["new_" + k]}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {r.status !== "PENDING" && (
                                <p className="mt-3 text-xs text-slate-500">
                                    {r.status === "APPROVED" ? "Approved on" : "Rejected on"}: {r.reviewed_at}
                                </p>
                            )}
                            {r.status === "REJECTED" && r.rejection_reason && (
                                <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-sm text-amber-900">
                                    Reason: {r.rejection_reason}
                                </p>
                            )}

                            {r.status === "PENDING" && rejectId !== r.id && (
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        disabled={busyId === r.id}
                                        onClick={() => approve(r)}
                                        className="ap-sbtn green"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busyId === r.id}
                                        onClick={() => { setRejectId(r.id); setReason(""); setMsg(null); }}
                                        className="ap-sbtn redline"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}

                            {r.status === "PENDING" && rejectId === r.id && (
                                <div className="mt-3 space-y-2">
                                    <textarea
                                        rows={3}
                                        maxLength={500}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Enter the reason for rejection (at least 10 characters)"
                                        className={inputClass}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={busyId === r.id || reason.trim().length < 10}
                                            onClick={() => reject(r)}
                                            className="ap-sbtn red"
                                        >
                                            {busyId === r.id ? "Processing..." : "Reject"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setRejectId(null); setReason(""); }}
                                            className={btnGhost}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
function ViewResults() {
    const API = "http://localhost:8080/api/admin/results";
    const [elections, setElections] = useState([]);
    const [electionId, setElectionId] = useState("");
    const [data, setData] = useState(null);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const readError = async (res) => {
        const err = await res.json().catch(() => ({}));
        return err.message || err.error || `Error ${res.status}`;
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(API);
                if (!res.ok) throw new Error(await readError(res));
                setElections(await res.json());
            } catch (e) {
                setMsg(e.message);
            }
        })();
    }, []);

    const handleElection = async (e) => {
        const id = e.target.value;
        setElectionId(id);
        setData(null);
        setMsg(null);
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/${id}`);
            if (!res.ok) throw new Error(await readError(res));
            setData(await res.json());
        } catch (err) {
            setMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const Row = ({ label, value }) => (
        <div className="ap-row">
            <span>{label}</span>
            <span>{value || value === 0 ? value : "-"}</span>
        </div>
    );

    const el = data ? data.election : null;
    const top = data ? data.candidates.filter((c) => c.rank === 1) : [];
    const area = el
        ? [el.election_type, el.state, el.city, el.ward_no ? `Ward ${el.ward_no}` : null].filter(Boolean).join(", ")
        : "";

    return (
        <div className="space-y-4">
            <div>
                <label className={labelClass}>Election</label>
                <select value={electionId} onChange={handleElection} className={inputClass}>
                    <option value="">Select an election</option>
                    {elections.map((x) => (
                        <option key={x.id} value={x.id}>
                            {x.title} ({x.status})
                        </option>
                    ))}
                </select>
                {elections.length === 0 && !msg && <p className={hint}>No finished elections yet.</p>}
            </div>

            {msg && <Alert type="err">{msg}</Alert>}
            {loading && <p className="text-sm text-slate-500">Loading...</p>}

            {el && (
                <div className="space-y-4">
                    <div className="ap-rows">
                        <Row label="Election" value={el.title} />
                        <Row label="Area" value={area} />
                        <Row label="Voting window" value={`${el.start_time} to ${el.end_time}`} />
                        <Row label="Status" value={el.status} />
                        {el.status === "COMPLETED" && (
                            <Row label="Published to voters" value={el.result_published ? "Yes" : "No"} />
                        )}
                    </div>

                    {el.status === "CANCELLED" && (
                        <div className="ap-alert ap-alert-err">
                            This election was cancelled. Reason: {el.stop_reason || "Not recorded"}
                        </div>
                    )}

                    {el.status === "FAILED" && (
                        <div className="ap-alert ap-alert-warn">
                            This election failed. Reason: {el.fail_reason || "Not recorded"}
                        </div>
                    )}

                    {el.status === "COMPLETED" && (
                        <>
                            <div className="ap-alert ap-alert-ok">
                                {el.result_status === "WINNER_DECLARED" && top[0] && (
                                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                                        Winner: {top[0].candidate_name} ({top[0].party || "Independent"})
                                    </p>
                                )}
                                {el.result_status === "TIE" && (
                                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                                        Tie between: {top.map((c) => c.candidate_name).join(", ")}
                                    </p>
                                )}
                                {el.result_status === "NO_VOTES" && (
                                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>No votes were cast.</p>
                                )}
                                <p style={{ margin: "4px 0 0" }}>
                                    Total votes: {el.total_votes} | Eligible voters: {data.eligible_voters} | Turnout:{" "}
                                    {Number(data.turnout_percent).toFixed(2)}%
                                </p>
                            </div>

                            <div>
                                <SectionTitle>Votes by candidate</SectionTitle>
                                <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="space-y-4">
                                    {data.candidates.map((c) => (
                                        <li key={c.candidate_id}>
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <p className="text-sm font-medium text-slate-900">
                                                    #{c.rank} {c.candidate_name}{" "}
                                                    <span className="font-normal text-slate-500">
                                                        ({c.party || "Independent"})
                                                    </span>
                                                </p>
                                                <p className="text-sm tabular-nums text-slate-700">
                                                    {c.votes} votes, {Number(c.vote_percent).toFixed(2)}%
                                                </p>
                                            </div>
                                            <div style={{ marginTop: 6, height: 12, overflow: "hidden", borderRadius: 99, background: "#e2e8f0" }}>
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        borderRadius: 99,
                                                        width: `${Number(c.vote_percent)}%`,
                                                        background: c.rank === 1 ? "#1b3f8b" : "#93a9d6",
                                                    }}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/* group / desc sirf UI ke liye hain — id, label, page wahi hain jo pehle the */
const FEATURES = [
    { id: "view-results", label: "View Results", page: ViewResults, wide: true, group: "Elections", desc: "See the results of completed elections." },
    { id: "change-requests", label: "Candidate Change Requests", page: ChangeRequests, wide: true, group: "Candidates", desc: "Review and approve or reject profile changes." },
    { id: "audit-log", label: "Audit Log", page: AuditLog, wide: true, group: "Oversight", desc: "Tamper-evident record of every admin action." },
    { id: "voter-list", label: "List of Voters", page: VoterList, wide: true, group: "Voters", desc: "Browse all registered voters." },
    { id: "search-voter", label: "Search Voter", page: SearchVoter, group: "Voters", desc: "Find a voter by name, phone, Aadhaar or ID." },
    { id: "cancel-election", label: "Cancel Election", page: CancelElection, group: "Elections", desc: "Cancel an upcoming or ongoing election." },
    { id: "create-candidate", label: "Create Candidate", page: CreateCandidate, group: "Candidates", desc: "Register a new candidate profile." },
    { id: "create-election", label: "Create Election", page: CreateElection, group: "Elections", desc: "Set up a new election with its schedule." },
    { id: "add-candidate-to-election", label: "Add Candidate to Election", page: AddCandidateToElection, group: "Elections", desc: "Assign candidates to an election." },
    { id: "remove-candidate", label: "Remove Candidate", page: RemoveCandidate, group: "Candidates", desc: "Convert a candidate back to a regular voter." },
];
const GROUPS = ["Elections", "Candidates", "Voters", "Oversight"];
const gcls = (g) => "ap-g-" + g.toLowerCase();

/* ───────── Layout ───────── */

function Tricolour() {
    return (
        <div className="ap-tri" aria-hidden="true">
            <i />
            <i />
            <i />
        </div>
    );
}

export default function AdminPanel() {
    const [active, setActive] = useState(null);
    const [now, setNow] = useState(new Date());
    const feature = FEATURES.find((f) => f.id === active);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    const dateText = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const timeText = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const quick = [
        ["create-election", "Create Election", "pri"],
        ["create-candidate", "Create Candidate", ""],
        ["audit-log", "View Audit Log", ""],
    ];

    return (
        <div className="ap-root">
            <style>{STYLES}</style>

            <header className="ap-header">
                <Tricolour />
                <div className="ap-hbar">
                    <span className="ap-wm"><Chakra size={190} /></span>
                    <div className="ap-hin">
                        <div className="ap-brand">
                            <span className="ap-emblem"><Chakra size={36} /></span>
                            <div>
                                <h1 className="ap-title ap-serif">Election Administration Portal</h1>
                                <p className="ap-sub">Secure admin console</p>
                            </div>
                        </div>
                        <div className="ap-right">
                            <div className="ap-clock">
                                <b>{timeText}</b>
                                <span>{dateText}</span>
                            </div>
                            <div className="ap-user">
                                <i>A</i>
                                Administrator
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="ap-body">
                <nav className="ap-nav" aria-label="Admin sections">
                    <div className="ap-navlist">
                        <button type="button" onClick={() => setActive(null)} className={"ap-item" + (!feature ? " on" : "")}>
                            <Icon name="home" size={16} />
                            Dashboard
                        </button>
                        {GROUPS.map((g) => (
                            <div key={g} className="ap-grp">
                                <p className="ap-grp-t">{g}</p>
                                {FEATURES.filter((f) => f.group === g).map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setActive(f.id)}
                                        className={"ap-item" + (active === f.id ? " on" : "")}
                                        aria-current={active === f.id ? "page" : undefined}
                                    >
                                        <Icon name={f.id} size={16} />
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </nav>

                <main className="ap-main">
                    {!feature ? (
                        <div>
                            <section className="ap-hero">
                                <span className="ap-wm"><Chakra size={340} /></span>
                                <span className="ap-wm2"><Chakra size={220} /></span>
                                <div className="ap-hero-in">
                                    <h2 className="ap-serif">Welcome back, Administrator</h2>
                                    <p>
                                        Run elections, manage candidates and keep the voter roll accurate, from one secure console. Every action you take is recorded in the audit log.
                                    </p>
                                    <div className="ap-hero-actions">
                                        {quick.map(([id, label, c]) => (
                                            <button key={id} type="button" onClick={() => setActive(id)} className={"ap-qbtn " + c}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Tricolour />
                            </section>

                            {GROUPS.map((g) => (
                                <section key={g} className={"ap-sec " + gcls(g)}>
                                    <h3 className="ap-sec-t">
                                        <i />
                                        {g}
                                    </h3>
                                    <div className="ap-grid">
                                        {FEATURES.filter((f) => f.group === g).map((f) => (
                                            <button key={f.id} type="button" onClick={() => setActive(f.id)} className="ap-card">
                                                <span className="ap-tile">
                                                    <Icon name={f.id} size={22} />
                                                </span>
                                                <b>{f.label}</b>
                                                <span className="d">{f.desc}</span>
                                                <span className="ap-open">
                                                    Open
                                                    <Icon name="chevron" size={16} />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className={(feature.wide ? "ap-w-w " : "ap-w-n ") + gcls(feature.group)}>
                            <p className="ap-crumb">
                                <button type="button" onClick={() => setActive(null)}>Dashboard</button>
                                <Icon name="chevron" size={12} />
                                <span>{feature.group}</span>
                                <Icon name="chevron" size={12} />
                                <em>{feature.label}</em>
                            </p>
                            <div className="ap-panel">
                                <div className="ap-panel-bar" />
                                <div className="ap-panel-h">
                                    <div>
                                        <span className="ap-tile"><Icon name={feature.id} size={24} /></span>
                                        <div style={{ display: "block" }}>
                                            <h2 className="ap-serif">{feature.label}</h2>
                                            <p>{feature.desc}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setActive(null)} className={btnGhost}>
                                        Back
                                    </button>
                                </div>
                                <div className="ap-panel-b">
                                    <feature.page />
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <footer className="ap-foot">
                <Tricolour />
                <p>Authorised personnel only. All actions on this portal are recorded in the audit log.</p>
            </footer>
        </div>
    );
}