import { createSignal, Show, onMount, For } from 'solid-js';
import axios from 'axios';

// YAHAN APNA RENDER URL EK VARIABLE MEIN DAAL DIYA HAI
const BACKEND_URL = "https://sentinel-ai-mrgp.onrender.com";

function App() {
  const [prompt, setPrompt] = createSignal('');
  const [generatedCode, setGeneratedCode] = createSignal('');
  const [auditReport, setAuditReport] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [loadingTask, setLoadingTask] = createSignal('');
  const [saveStatus, setSaveStatus] = createSignal('');
  const [historyLogs, setHistoryLogs] = createSignal([]);

  const fetchHistory = async () => {
    try {
      // ✅ LINK UPDATED 1
      const res = await axios.get(`${BACKEND_URL}/api/history`);
      if (res.data.status === 'success') {
        setHistoryLogs(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  onMount(() => {
    fetchHistory();
  });

  const restoreFromVault = (log) => {
    if (!log.generated_code || !log.audit_report) {
      alert("This is an old log record that doesn't contain the full code and report. Please generate and save a new policy to test this feature!");
      return;
    }
    setPrompt(log.prompt);
    setGeneratedCode(log.generated_code);
    setAuditReport(log.audit_report);
    setSaveStatus("🔄 Successfully Restored from Vault History");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    if (!prompt()) return alert("Please enter a requirement!");
    setIsLoading(true);
    setLoadingTask('ARCHITECTING INFRASTRUCTURE...');
    setSaveStatus('');
    try {
      // ✅ LINK UPDATED 2
      const res = await axios.post(`${BACKEND_URL}/generate`, { prompt: prompt() });
      setGeneratedCode(res.data.generated_code);
      setAuditReport(''); 
    } catch (error) {
      alert("Error generating code. Check backend connection.");
    }
    setIsLoading(false);
  };

  const handleAudit = async () => {
    if (!generatedCode()) return alert("No code to audit!");
    setIsLoading(true);
    setLoadingTask('RUNNING DEEP VULNERABILITY SCAN...');
    try {
      // ✅ LINK UPDATED 3
      const res = await axios.post(`${BACKEND_URL}/audit`, { prompt: generatedCode() });
      setAuditReport(res.data.audit_report);
    } catch (error) {
      alert("Error running audit.");
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!generatedCode() || !auditReport()) return alert("Please generate and audit first!");
    setIsLoading(true);
    setLoadingTask('SECURING POLICY IN VAULT...');
    
    const scoreMatch = auditReport().match(/SCORE:\s*(\d+)/i);
    const scoreVal = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

    try {
      // ✅ LINK UPDATED 4
      await axios.post(`${BACKEND_URL}/api/save_log`, {
        prompt: prompt(),
        security_score: scoreVal,
        generated_code: generatedCode(),
        audit_report: auditReport()
      });
      setSaveStatus("✅ Policy Successfully Secured in Supabase Vault!");
      fetchHistory(); // Refresh table immediately
    } catch (error) {
      setSaveStatus("❌ Error saving to vault.");
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

  return (
    <div class="min-h-screen bg-[#0a0f1c] text-slate-300 font-sans selection:bg-cyan-900 selection:text-white pb-12">
      
      <nav class="border-b border-cyan-900/50 bg-[#0d1527] px-6 py-4 flex items-center justify-between shadow-lg shadow-cyan-900/20">
        <div class="flex items-center gap-3">
          <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          <div>
            <h1 class="text-2xl font-black tracking-widest bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent uppercase">
              Sentinel-AI
            </h1>
            <p class="text-[10px] tracking-widest text-cyan-600 font-mono uppercase mt-0.5">Autonomous Cloud Architect & Auditor</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
            <span class="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-800">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              SYSTEM ONLINE
            </span>
        </div>
      </nav>

      <main class="p-6 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 mt-4">
        
        {/* Left Column */}
        <div class="xl:col-span-7 space-y-6">
          <div class="bg-[#11192b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative group hover:border-cyan-900/50 transition-colors duration-500">
            <div class="bg-[#162032] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <h2 class="text-xs font-bold text-slate-300 tracking-wider uppercase">1. Define Infrastructure Target</h2>
              </div>
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div class="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div class="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
            </div>
            <div class="p-5">
              <textarea 
                class="w-full h-28 bg-[#0a0f1c] border border-slate-700/50 rounded-lg p-4 text-cyan-100 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600 resize-none"
                placeholder="> Initialize secure AWS S3 bucket architecture allowing only encrypted traffic..."
                value={prompt()}
                onInput={(e) => setPrompt(e.target.value)}
              />
              <button 
                onClick={handleGenerate} disabled={isLoading()}
                class="mt-4 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-lg font-bold tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
              >
                <Show when={isLoading() && loadingTask() === 'ARCHITECTING INFRASTRUCTURE...'} fallback={
                  <><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg> Compile Architecture</>
                }>
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...
                </Show>
              </button>
            </div>
          </div>

          <Show when={generatedCode()}>
            <div class="bg-[#11192b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-fade-in-up">
              <div class="bg-[#162032] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                  <h2 class="text-xs font-bold text-slate-300 tracking-wider uppercase">2. Generated Security Code</h2>
                </div>
                <span class="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">READY FOR AUDIT</span>
              </div>
              <div class="p-5">
                <textarea 
                  class="w-full h-80 bg-[#060913] text-emerald-400 font-mono text-sm p-5 border border-slate-700/50 rounded-lg focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
                  value={generatedCode()}
                  onInput={(e) => setGeneratedCode(e.target.value)}
                  spellcheck="false"
                />
                <button 
                  onClick={handleAudit} disabled={isLoading()}
                  class="mt-4 w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-3 rounded-lg font-bold tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20"
                >
                  <Show when={isLoading() && loadingTask() === 'RUNNING DEEP VULNERABILITY SCAN...'} fallback={
                    <><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Execute Deep Vulnerability Scan</>
                  }>
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Scanning for OWASP Threats...
                  </Show>
                </button>
              </div>
            </div>
          </Show>
        </div>

        {/* Right Column */}
        <div class="xl:col-span-5 space-y-6">
          <Show when={auditReport()}>
            <div class="bg-[#11192b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-full flex flex-col animate-fade-in-up">
              
              <div class="bg-[#162032] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  <h2 class="text-xs font-bold text-slate-300 tracking-wider uppercase">3. AI Security Auditor Report</h2>
                </div>
              </div>

              <div class={`flex-grow bg-[#060913] p-5 border-b border-slate-800 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap ${getScoreColor()} border-x-4 border-t-0 border-b-0`}>
                <div class="text-xs text-slate-500 mb-4 border-b border-slate-800/50 pb-2">
                  {`> INIT VULN_SCAN_V1.4`}
                  <br/>
                  {`> TARGET: GENERATED_INFRASTRUCTURE`}
                  <br/>
                  {`> STATUS: SCAN COMPLETE`}
                </div>
                {auditReport()}
              </div>
              
              <div class="p-5 bg-[#11192b]">
                <button 
                  onClick={handleSave} disabled={isLoading()}
                  class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-500 text-white py-4 rounded-lg font-bold tracking-widest uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  <Show when={isLoading() && loadingTask() === 'SECURING POLICY IN VAULT...'} fallback={
                    <><svg class="w-5 h-5 text-cyan-500 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg> Push to Supabase Vault</>
                  }>
                    <svg class="animate-spin h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Securing Data...
                  </Show>
                </button>

                <Show when={saveStatus()}>
                  <div class={`mt-4 text-center font-bold text-sm p-3 rounded-lg border flex items-center justify-center gap-2 animate-pulse ${saveStatus().includes('✅') || saveStatus().includes('🔄') ? 'text-emerald-400 border-emerald-800 bg-emerald-900/20' : 'text-rose-400 border-rose-800 bg-rose-900/20'}`}>
                    {saveStatus()}
                  </div>
                </Show>
              </div>

            </div>
          </Show>
        </div>
      </main>

      {/* AUDIT HISTORY SECTION */}
      <div class="max-w-7xl mx-auto px-6 mt-8">
        <div class="bg-[#11192b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div class="bg-[#162032] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h2 class="text-xs font-bold text-slate-300 tracking-wider uppercase">Vault Audit Logs (History)</h2>
            </div>
            <button onClick={fetchHistory} class="text-xs font-mono text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              REFRESH
            </button>
          </div>
          
          <div class="divide-y divide-slate-800/50">
            <Show when={historyLogs().length > 0} fallback={<div class="p-8 text-center text-slate-500 font-mono text-sm">No records found in Supabase Vault. Generate and save a policy to see it here!</div>}>
              <For each={historyLogs()}>
                {(log) => (
                  // NEW: Added onClick and cursor-pointer to the row
                  <div 
                    onClick={() => restoreFromVault(log)}
                    class="p-4 hover:bg-[#162032] transition-colors flex items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-mono text-slate-500 mb-1 flex items-center gap-2">
                        {new Date(log.created_at).toLocaleString()}
                        <span class="opacity-0 group-hover:opacity-100 text-cyan-500 transition-opacity">
                          [Click to Restore Details]
                        </span>
                      </p>
                      <p class="text-sm text-slate-300 truncate font-mono group-hover:text-cyan-100 transition-colors">
                        "{log.prompt}"
                      </p>
                    </div>
                    <div class="flex-shrink-0">
                      <span class={`px-3 py-1 rounded border text-xs font-mono font-bold ${
                        log.security_score >= 8 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                        log.security_score >= 5 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                        'text-rose-500 border-rose-500/30 bg-rose-500/10'
                      }`}>
                        SCORE: {log.security_score}/10
                      </span>
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
