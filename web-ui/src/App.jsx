import { jsPDF } from "jspdf";
import { createSignal, Show, onMount, For } from 'solid-js';
import axios from 'axios';
import { supabase } from './lib/supabase';
import Login from './Login';

const BACKEND_URL = "https://sentinel-ai-v2.onrender.com";

function App() {
  const [session, setSession] = createSignal(null);
  const [authLoading, setAuthLoading] = createSignal(true);
  const [prompt, setPrompt] = createSignal('');
  const [generatedCode, setGeneratedCode] = createSignal('');
  const [auditReport, setAuditReport] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [loadingTask, setLoadingTask] = createSignal('');
  const [saveStatus, setSaveStatus] = createSignal('');
  const [historyLogs, setHistoryLogs] = createSignal([]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/history?user_id=${session()?.user?.id}`);
      if (res.data.status === 'success') {
        setHistoryLogs(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  onMount(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) fetchHistory(); // <--- Sirf tab fetch karo jab session mil jaye
    }).catch(err => {
      console.error("Auth Error:", err);
      setAuthLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchHistory(); // <--- Login/Logout par history refresh hogi
    });
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const restoreFromVault = (log) => {
    if (!log.generated_code || !log.audit_report) {
      alert("This record doesn't contain full data.");
      return;
    }
    setPrompt(log.prompt);
    setGeneratedCode(log.generated_code);
    setAuditReport(log.audit_report);
    setSaveStatus("🔄 Restored from Vault History");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    if (!prompt()) return alert("Please enter a requirement!");
    setIsLoading(true);
    setLoadingTask('ARCHITECTING INFRASTRUCTURE...');
    setSaveStatus('');
    try {
      const res = await axios.post(`${BACKEND_URL}/generate`, { prompt: prompt() });
      setGeneratedCode(res.data.generated_code);
      setAuditReport(''); 
    } catch (error) {
      alert("Backend connection error.");
    }
    setIsLoading(false);
  };

  const handleAudit = async () => {
    if (!generatedCode()) return alert("No code to audit!");
    setIsLoading(true);
    setLoadingTask('RUNNING DEEP VULNERABILITY SCAN...');
    try {
      const res = await axios.post(`${BACKEND_URL}/audit`, { prompt: generatedCode() });
      setAuditReport(res.data.audit_report);
    } catch (error) {
      alert("Error running audit.");
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!generatedCode() || !auditReport()) return alert("Generate and audit first!");
    setIsLoading(true);
    setLoadingTask('SECURING POLICY IN VAULT...');
    const scoreMatch = auditReport().match(/SCORE:\s*(\d+)/i);
    const scoreVal = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    try {
      await axios.post(`${BACKEND_URL}/api/save_log`, {
        user_id: session()?.user?.id,
        prompt: prompt(),
        security_score: scoreVal,
        generated_code: generatedCode(),
        audit_report: auditReport()
      });
      setSaveStatus("✅ Secured in Supabase Vault!");
      fetchHistory(); 
    } catch (error) {
      setSaveStatus("❌ Save error.");
    }
    setIsLoading(false);
  };

  const getScoreColor = () => {
    const match = auditReport().match(/SCORE:\s*(\d+)/i);
    if (!match) return "text-cyan-400";
    const score = parseInt(match[1], 10);
    if (score >= 8) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 5) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-500 border-rose-500/30 bg-rose-500/10";
  };

  const downloadPDFReport = (p, c, a) => {
    const doc = new jsPDF();
    const ts = new Date().toLocaleString();
    doc.setFillColor(10, 15, 28);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(0, 255, 255);
    doc.setFontSize(22);
    doc.text("SENTINEL-AI SECURITY REPORT", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Operative: ${session()?.user?.email}`, 10, 32);
    doc.text(`Timestamp: ${ts}`, 150, 32);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. INFRASTRUCTURE TARGET", 10, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(p, 180), 15, 60);
    doc.setFont("helvetica", "bold");
    doc.text("2. GENERATED CODE", 10, 90);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(c, 180), 15, 100);
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.text("3. VULNERABILITY AUDIT REPORT", 10, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(a, 180), 15, 30);
    doc.save(`Sentinel_Audit_${Date.now()}.pdf`);
  };

  return (
    <Show when={!authLoading()} fallback={<div class="min-h-screen bg-[#0a0f1c] flex items-center justify-center text-cyan-500 font-mono tracking-widest uppercase animate-pulse">Initializing Sentinel-AI Core...</div>}>
      <Show when={session()} fallback={<Login onLogin={(sess) => setSession(sess)} />}>
        <div class="min-h-screen bg-[#0a0f1c] text-slate-300 font-sans pb-12">
          
          <nav class="border-b border-cyan-900/50 bg-[#0d1527] px-6 py-4 flex items-center justify-between shadow-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-cyan-500/20 rounded flex items-center justify-center border border-cyan-500/50">
                <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <div>
                <h1 class="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent uppercase">Sentinel-AI</h1>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <button onClick={handleLogout} class="text-[10px] font-bold text-rose-400 border border-rose-900/50 bg-rose-950/30 px-3 py-1.5 rounded hover:bg-rose-900/80 transition-all uppercase tracking-widest">LOGOUT</button>
              <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded border border-emerald-800 flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM ONLINE
              </span>
            </div>
          </nav>

          <main class="p-6 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div class="xl:col-span-7 space-y-6">
              <div class="bg-[#11192b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div class="bg-[#162032] border-b border-slate-800 px-4 py-3 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-cyan-500"></span>
                  <h2 class="text-xs font-bold text-slate-300 uppercase tracking-widest">1. Infrastructure Target</h2>
                </div>
                <div class="p-5">
                  <textarea class="w-full h-28 bg-[#0a0f1c] border border-slate-700/50 rounded-lg p-4 text-cyan-100 font-mono text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" value={prompt()} onInput={(e) => setPrompt(e.target.value)} placeholder="> Define architecture requirement..." />
                  <button onClick={handleGenerate} class="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded font-bold tracking-widest uppercase transition-all shadow-lg shadow-cyan-900/20">
                    <Show when={isLoading() && loadingTask() === 'ARCHITECTING INFRASTRUCTURE...'} fallback={<>Compile Architecture</>}>Processing...</Show>
                  </button>
                </div>
              </div>

              <Show when={generatedCode()}>
                <div class="bg-[#11192b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-fade-in-up">
                  <div class="bg-[#162032] border-b border-slate-800 px-4 py-3 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h2 class="text-xs font-bold text-slate-300 uppercase tracking-widest">2. Generated Security Code</h2>
                  </div>
                  <div class="p-5">
                    <textarea class="w-full h-80 bg-[#060913] text-emerald-400 font-mono text-sm p-5 border border-slate-700/50 rounded outline-none" value={generatedCode()} onInput={(e) => setGeneratedCode(e.target.value)} />
                    <button onClick={handleAudit} class="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded font-bold tracking-widest uppercase transition-all shadow-lg shadow-amber-900/20">
                      <Show when={isLoading() && loadingTask() === 'RUNNING DEEP VULNERABILITY SCAN...'} fallback={<>Execute Deep Vulnerability Scan</>}>Scanning...</Show>
                    </button>
                  </div>
                </div>
              </Show>
            </div>

            <div class="xl:col-span-5 space-y-6">
              <Show when={auditReport()}>
                <div class="bg-[#11192b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col animate-fade-in-up">
                  <div class="bg-[#162032] border-b border-slate-800 px-4 py-3 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    <h2 class="text-xs font-bold text-slate-300 uppercase tracking-widest">3. AI Security Auditor</h2>
                  </div>
                  <div class={`p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto ${getScoreColor()}`}>
                    {auditReport()}
                  </div>
                  <div class="p-5 bg-[#0d1527] border-t border-slate-800 space-y-3">
                    <button onClick={handleSave} class="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded font-bold uppercase tracking-widest transition-all">
                      <Show when={isLoading() && loadingTask() === 'SECURING POLICY IN VAULT...'} fallback={<>Push to Supabase Vault</>}>Save to Vault</Show>
                    </button>
                    <button onClick={() => downloadPDFReport(prompt(), generatedCode(), auditReport())} class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Download PDF Report
                    </button>
                    <Show when={saveStatus()}>
                      <div class="text-[10px] text-center font-bold text-emerald-400 mt-2 uppercase tracking-tighter">{saveStatus()}</div>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>
          </main>

          <div class="max-w-7xl mx-auto px-6 mt-6">
            <div class="bg-[#11192b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <div class="bg-[#162032] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <h2 class="text-xs font-bold text-slate-300 uppercase tracking-widest">Vault History</h2>
                <button onClick={fetchHistory} class="text-[10px] text-cyan-500 font-bold uppercase hover:underline">Refresh</button>
              </div>
              <div class="divide-y divide-slate-800/50 max-h-60 overflow-y-auto">
                <For each={historyLogs()}>
                  {(log) => (
                    <div onClick={() => restoreFromVault(log)} class="p-4 hover:bg-[#162032] transition-colors flex items-center justify-between cursor-pointer group">
                      <div class="flex-1 min-w-0">
                        <p class="text-[10px] text-slate-500 font-mono mb-1">{new Date(log.created_at).toLocaleString()}</p>
                        <p class="text-sm text-slate-400 truncate group-hover:text-cyan-400 transition-colors">"{log.prompt}"</p>
                      </div>
                      <span class={`px-2 py-1 rounded text-[10px] font-bold border ${log.security_score >= 8 ? 'text-emerald-400 border-emerald-900/50' : 'text-rose-400 border-rose-900/50'}`}>SCORE: {log.security_score}/10</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>

        </div>
      </Show>
    </Show>
  );
}

export default App;
