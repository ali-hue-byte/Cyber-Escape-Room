import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Terminal, 
  Settings, 
  Play, 
  Award, 
  Zap, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  HelpCircle, 
  Send, 
  Clock, 
  Lock, 
  Unlock, 
  X, 
  ChevronRight, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Mail, 
  Server, 
  Activity, 
  ShieldAlert,
  Info 
} from 'lucide-react';
import { 
  Difficulty, 
  IncidentCategory, 
  EmployeeProfile, 
  SecurityLog, 
  EmailEvidence, 
  NetworkConnection, 
  PublicIncident, 
  ChatMessage, 
  AccusationSubmission, 
  EvaluationResult 
} from './types';

export default function App() {
  // Screen views: 'HOME' | 'LOADING' | 'INVESTIGATION' | 'RESULT'
  const [screen, setScreen] = useState<'HOME' | 'LOADING' | 'INVESTIGATION' | 'RESULT'>('HOME');
  
  // Game states
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incident, setIncident] = useState<PublicIncident | null>(null);
  
  // Timers
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Chat console states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Hint decryptor states
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const [isRequestingHint, setIsRequestingHint] = useState(false);

  // Evidence panel states
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'ALL' | 'EMAILS' | 'LOGS' | 'NETWORK' | 'ALERTS' | 'EMPLOYEES'>('ALL');
  const [selectedEvidenceItem, setSelectedEvidenceItem] = useState<{
    type: 'email' | 'log' | 'network' | 'alert' | 'employee';
    title: string;
    content: any;
  } | null>(null);

  // Accusation submissions
  const [submission, setSubmission] = useState<AccusationSubmission>({
    attackType: '',
    entryPoint: '',
    vulnerability: '',
    mitigation: ''
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Career score states stored in client local storage
  const [careerStats, setCareerStats] = useState({
    gamesPlayed: 0,
    highLogsScore: 0,
    eliteHunterCount: 0
  });

  // Load career stats on bootup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cyber_escape_career_v2');
      if (saved) {
        setCareerStats(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not retrieve career profile history:", e);
    }
  }, []);

  // Update elapsed seconds while in active investigation
  useEffect(() => {
    if (screen === 'INVESTIGATION' && startTime !== null) {
      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(seconds);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, startTime]);

  // Scroll cyber assistant chat container to the bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Format timer state into readable minutes:seconds format
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Core Service: Generate New Cyber Incident Simulation Case
  const handleInitiateSimulation = async () => {
    setIsGenerating(true);
    setScreen('LOADING');
    setError(null);
    setIncident(null);
    setChatMessages([]);
    setUnlockedHints([]);
    setHintsUsed(0);
    setElapsedTime(0);
    setEvaluation(null);
    setSubmission({
      attackType: '',
      entryPoint: '',
      vulnerability: '',
      mitigation: ''
    });

    try {
      const response = await fetch('/api/incident/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server anomaly occurred during scenario creation.');
      }

      const data = await response.json();
      
      if (!data.caseData) {
        throw new Error('Case structure returned from server is invalid or incomplete.');
      }

      const generatedCase: PublicIncident = data.caseData;
      setIncident(generatedCase);
      
      // Auto register first message from Lead Investigator
      setChatMessages([
        {
          id: 'msg_0',
          role: 'assistant',
          content: `Junior Analyst, an alert triggered at ${generatedCase.companyName}. We are dealing with a critical security event categorized under "[${generatedCase.category}]". I have consolidated the telemetry, system alerts, employee access cards, and emails inside your Secure Evidence Vault. Study the indicators, correlate the IP mappings, and consult with me. Good hunting.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
      
      setStartTime(Date.now());
      setScreen('INVESTIGATION');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'General failure connecting to LLM service.');
      setScreen('HOME');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Chat with the CSOC Assistant
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatSending || !incident) return;

    const userMsgText = chatInput.trim();
    setChatInput('');
    setIsChatSending(true);

    const userMessageId = `msg_user_${Date.now()}`;
    const userMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const intermediateMessages: ChatMessage[] = [
      ...chatMessages,
      {
        id: userMessageId,
        role: 'user',
        content: userMsgText,
        timestamp: userMessageTime
      }
    ];

    setChatMessages(intermediateMessages);

    try {
      const chatHistoryForBackend = intermediateMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/incident/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incident.id,
          message: userMsgText,
          chatHistory: chatHistoryForBackend
        })
      });

      if (!res.ok) {
        throw new Error('Error retrieving lead operator assessment.');
      }

      const responseData = await res.json();
      
      setChatMessages([
        ...intermediateMessages,
        {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: responseData.response || 'System lost satellite feedback. Please probe again analyst.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
    } catch (e: any) {
      setChatMessages([
        ...intermediateMessages,
        {
          id: `msg_ai_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ CONNECTIVITY_INTERRUPTED: Failed to obtain direct tactical analysis feedback from CSOC. Warning message: ${e.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  // 3. Decrypt progressive hints
  const handleRequestHint = async () => {
    if (!incident || hintsUsed >= 3 || isRequestingHint) return;

    setIsRequestingHint(true);
    const nextHintLevel = hintsUsed + 1;

    try {
      const res = await fetch('/api/incident/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incident.id,
          hintLevel: nextHintLevel
        })
      });

      if (!res.ok) throw new Error('Decryption failure.');

      const data = await res.json();
      const newHint = data.hint || "Proceed with caution analyst. Filter login logs first.";

      setUnlockedHints([...unlockedHints, newHint]);
      setHintsUsed(nextHintLevel);

      // Also append helpful automated instruction block in the main chat logs
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg_hint_auto_${Date.now()}`,
          role: 'assistant',
          content: `💡 SYSTEM_HINT LEVEL_0${nextHintLevel} UNLOCKED: "${newHint}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);

    } catch (e: any) {
      alert("Fail to decrypt system hints. Check firewall node connectivity.");
    } finally {
      setIsRequestingHint(false);
    }
  };

  // 4. Submit Accusation Report and evaluate via AI Evaluator
  const handleSubmitAccusationReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || isSubmittingReport) return;

    if (!submission.attackType.trim() || !submission.entryPoint.trim() || !submission.vulnerability.trim() || !submission.mitigation.trim()) {
      alert("All fields in the Accusation Intelligence Form are mandatory for evaluation compliance.");
      return;
    }

    setIsSubmittingReport(true);

    try {
      const res = await fetch('/api/incident/accuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incident.id,
          submission,
          timeSpentSeconds: elapsedTime,
          hintsUsed
        })
      });

      if (!res.ok) {
        throw new Error('AI Evaluator rejected the submission payload.');
      }

      const resData = await res.json();
      
      if (!resData.evaluation) {
        throw new Error('Invalid reporting validation structure received.');
      }

      const evalResult: EvaluationResult = resData.evaluation;
      setEvaluation(evalResult);

      // Save statistics securely in local memory
      try {
        const updatePlayed = careerStats.gamesPlayed + 1;
        const highestScore = Math.max(careerStats.highLogsScore, evalResult.totalScore);
        const eliteCount = careerStats.eliteHunterCount + (evalResult.rating.includes('Elite') ? 1 : 0);
        
        const nextStats = {
          gamesPlayed: updatePlayed,
          highLogsScore: highestScore,
          eliteHunterCount: eliteCount
        };

        setCareerStats(nextStats);
        localStorage.setItem('cyber_escape_career_v2', JSON.stringify(nextStats));
      } catch (err) {
        console.warn("Storage syncing failure:", err);
      }

      setScreen('RESULT');
    } catch (e: any) {
      alert("Report Submission Failed: " + e.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // 5. Restart Environment back to Home Dashboard safely
  const handleForceQuitReset = () => {
    if (confirm("Reset current active simulation matrix? All active case data will be lost.")) {
      setScreen('HOME');
      setIncident(null);
      setChatMessages([]);
      setUnlockedHints([]);
      setHintsUsed(0);
      setElapsedTime(0);
      setEvaluation(null);
      setError(null);
    }
  };

  // Formats specific evidence items logically inside the diagnostic slideout
  const renderDetailContent = () => {
    if (!selectedEvidenceItem) return null;
    const { type, content, title } = selectedEvidenceItem;

    if (type === 'email') {
      const email = content as EmailEvidence;
      return (
        <div className="space-y-4">
          <div className="bg-[#020617] border border-[#064e3b]/50 p-4 rounded text-xs space-y-2 font-mono">
            <div><span className="text-emerald-500 font-bold block">[SMTP_MAIL_ROUTER_HEADER]</span></div>
            <div><span className="text-emerald-600">X-Originating-IP:</span> 198.51.100.{Math.floor(Math.random() * 254) + 1}</div>
            <div><span className="text-emerald-600">MIME-Version:</span> 1.0 (TLS_AES_256_GCM)</div>
            <div><span className="text-emerald-600">DKIM-Signature:</span> v=1; a=rsa-sha256; s=selector90; d={email.sender.split('@')[1]}</div>
          </div>
          <div className="border border-[#064e3b]/30 bg-[#0a101e] p-6 rounded space-y-4">
            <div className="grid grid-cols-6 gap-2 border-b border-[#064e3b]/20 pb-3 text-xs">
              <span className="col-span-1 text-emerald-600 font-semibold uppercase">From:</span>
              <span className="col-span-5 text-white font-mono">{email.sender}</span>
              <span className="col-span-1 text-emerald-600 font-semibold uppercase">To:</span>
              <span className="col-span-5 text-white font-mono">{email.recipient}</span>
              <span className="col-span-1 text-emerald-600 font-semibold uppercase">Date:</span>
              <span className="col-span-3 text-[#10b981]">{email.date}</span>
              <span className="col-span-1 text-emerald-600 font-semibold uppercase">ID:</span>
              <span className="col-span-1 text-gray-400 font-mono text-right">{email.id}</span>
            </div>
            <div>
              <span className="text-xs text-emerald-600 uppercase font-semibold block mb-1">Subject:</span>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">{email.subject}</h4>
            </div>
            <div className="border-t border-[#064e3b]/20 pt-4">
              <span className="text-xs text-emerald-600 uppercase font-semibold block mb-2">Message Payload:</span>
              <div className="text-xs bg-[#020617] p-4 border border-[#064e3b]/30 rounded text-emerald-100 whitespace-pre-wrap leading-relaxed">
                {email.body}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'log') {
      const log = content as SecurityLog;
      return (
        <div className="space-y-4">
          <div className="border border-[#064e3b]/40 bg-[#0a101e] p-6 rounded space-y-4 text-xs font-mono">
            <div className="flex justify-between items-center border-b border-[#064e3b]/20 pb-3">
              <span className="px-2 py-0.5 bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 font-bold rounded">SECURITY_LOG_ENTRY</span>
              <span className="text-gray-400 text-[10px]">{log.timestamp}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-[#020617] p-4 border border-[#064e3b]/20 rounded">
              <div>
                <span className="text-[10px] text-emerald-600 block uppercase">Source IP</span>
                <span className="text-white font-bold">{log.sourceIp}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 block uppercase">Destination Vector</span>
                <span className="text-white font-bold">{log.destinationIp}</span>
              </div>
              {log.protocol && (
                <div className="col-span-2">
                  <span className="text-[10px] text-emerald-600 block uppercase">Protocol Stream</span>
                  <span className="text-blue-400 font-bold uppercase">{log.protocol}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-emerald-600 block uppercase">Discovered Action</span>
                <span className="text-white uppercase font-semibold tracking-wide bg-emerald-950/40 px-2 py-1 inline-block rounded border border-emerald-900/40">{log.action}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 block uppercase">Handshake Status</span>
                <span className={log.status.toUpperCase().includes('FAIL') || log.status.toUpperCase().includes('DENY') || log.status.toUpperCase().includes('BLOCK') ? 'text-red-400 font-bold uppercase' : 'text-emerald-400 font-bold uppercase'}>{log.status}</span>
              </div>
              <div className="border-t border-[#064e3b]/20 pt-3">
                <span className="text-[10px] text-emerald-600 block uppercase mb-1">Raw Dump Details</span>
                <pre className="p-3 bg-[#020617] border border-[#064e3b]/20 rounded text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed text-[11px] overflow-x-auto">
                  {log.details}
                </pre>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'network') {
      const net = content as NetworkConnection;
      return (
        <div className="space-y-4">
          <div className="border border-[#064e3b]/40 bg-[#0a101e] p-6 rounded space-y-4 text-xs font-mono">
            <h4 className="text-sm font-bold text-white border-b border-[#064e3b]/20 pb-3 uppercase tracking-tight flex items-center gap-2">
              <Activity size={16} /> NETWORK_FLOW_DIAGNOSTICS
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-[#020617] p-3 rounded border border-[#064e3b]/20">
                <div>
                  <span className="text-[10px] text-emerald-600 block uppercase">Flow Timestamp</span>
                  <span className="text-white">{net.time}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 block uppercase">Threat Byte Count</span>
                  <span className="text-amber-500 font-mono font-bold">{(net.bytesTransferred / 1024).toFixed(2)} KB</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-600 block uppercase">Routing Stream (Source &gt; Dest)</span>
                <div className="bg-[#020617] p-3 border border-[#064e3b]/30 rounded">
                  <div className="text-white text-[11px]"><strong className="text-emerald-400 font-normal">[SRC]</strong> {net.source}</div>
                  <div className="text-white text-[11px] mt-1"><strong className="text-red-400 font-normal">[DST]</strong> {net.destination}</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-emerald-600 block uppercase">Intrusion Alert Status</span>
                <span className={`px-2 py-1 inline-block rounded text-[10px] font-bold mt-1 uppercase border ${net.alertFlag ? 'bg-red-950/40 border-red-500 text-red-400' : 'bg-emerald-950/40 border-emerald-500 text-emerald-400'}`}>
                  {net.alertFlag ? '⚠️ MALICIOUS_STAMP_TRIGGERED' : '✓ SECURE_CHANNEL_PASS'}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'alert') {
      const alertItem = content;
      return (
        <div className="space-y-4">
          <div className="border border-[#064e3b]/40 bg-[#0a101e] p-6 rounded space-y-4 text-xs font-mono">
            <div className="flex justify-between items-center border-b border-[#064e3b]/20 pb-3">
              <span className={`px-2 py-0.5 text-[10px] font-bold border rounded uppercase ${
                alertItem.severity === 'CRITICAL' || alertItem.severity === 'HIGH' 
                  ? 'bg-red-950/40 border-red-500 text-red-400' 
                  : 'bg-amber-950/40 border-amber-500 text-amber-500'
              }`}>
                {alertItem.severity} RISK ALERT
              </span>
              <span className="text-gray-400 font-mono">{alertItem.timestamp}</span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-emerald-600 block uppercase">ID Indicator</span>
                <span className="text-white font-mono text-[11px]">{alertItem.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 block uppercase">Triggering Sub-System node</span>
                <span className="text-white font-mono text-[11px]">{alertItem.system}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 block uppercase mb-1">SecOps System Message</span>
                <div className="bg-[#020617] p-4 border border-red-900/30 rounded text-red-200 text-xs font-mono flex gap-2">
                  <ShieldAlert size={16} className="shrink-0 text-red-500" />
                  <span>{alertItem.message}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'employee') {
      const emp = content as EmployeeProfile;
      return (
        <div className="space-y-4">
          <div className="border border-[#064e3b]/40 bg-[#0a101e] p-6 rounded space-y-4 text-xs font-mono">
            <div className="flex items-center gap-3 border-b border-[#064e3b]/20 pb-4">
              <div className="w-10 h-10 bg-emerald-950/60 border-2 border-emerald-500/50 rounded-full flex items-center justify-center text-emerald-300 font-bold">
                {emp.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">{emp.name}</h4>
                <p className="text-[10px] text-emerald-600 uppercase">{emp.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-[#020617] p-3 rounded border border-[#064e3b]/20 text-[11px]">
              <div>
                <span className="text-[9px] text-[#10b981]/60 block uppercase">Department</span>
                <span className="text-white font-semibold">{emp.department}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#10b981]/60 block uppercase">Access Matrix Clearance</span>
                <span className="text-amber-500 font-bold uppercase">{emp.accessLevel}</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-emerald-600 block uppercase font-bold">INTERVIEW_STATEMENT_LOG.txt</span>
              <div className="bg-[#020617] p-4 border border-[#064e3b]/30 rounded text-emerald-100 italic leading-relaxed text-[11px]">
                "{emp.statement}"
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Filter evidence based on the active sidebar filter tab
  const getFilteredEvidenceList = () => {
    if (!incident) return [];

    let list: {
      id: string;
      title: string;
      type: 'email' | 'log' | 'network' | 'alert' | 'employee';
      preview: string;
      raw: any;
    }[] = [];

    // Map emails
    incident.emails.forEach(e => {
      list.push({
        id: e.id,
        title: e.subject,
        type: 'email',
        preview: `Sender: ${e.sender} | Recipient: ${e.recipient}`,
        raw: e
      });
    });

    // Map logs
    incident.logs.forEach((log, index) => {
      list.push({
        id: `LOG_${index + 1}`,
        title: `${log.action} [${log.status}]`,
        type: 'log',
        preview: `Timestamp: ${log.timestamp} | Src IP: ${log.sourceIp}`,
        raw: log
      });
    });

    // Map networks
    incident.networkActivity.forEach((net, index) => {
      list.push({
        id: `NET_${index + 1}`,
        title: `${net.source} -> ${net.destination}`,
        type: 'network',
        preview: `Bytes: ${(net.bytesTransferred / 1024).toFixed(1)} KB | Alert: ${net.alertFlag}`,
        raw: net
      });
    });

    // Map alerts
    incident.alerts.forEach((alert) => {
      list.push({
        id: alert.id,
        title: `ALERT: ${alert.message}`,
        type: 'alert',
        preview: `System: ${alert.system} | Severity: ${alert.severity}`,
        raw: alert
      });
    });

    // Map employee interviews
    incident.employees.forEach((emp, index) => {
      list.push({
        id: `EMP_${index + 1}`,
        title: `${emp.name} [${emp.role}]`,
        type: 'employee',
        preview: `CI_CLEARANCE: ${emp.accessLevel} | Dept: ${emp.department}`,
        raw: emp
      });
    });

    if (activeEvidenceTab === 'ALL') return list;
    if (activeEvidenceTab === 'EMAILS') return list.filter(item => item.type === 'email');
    if (activeEvidenceTab === 'LOGS') return list.filter(item => item.type === 'log');
    if (activeEvidenceTab === 'NETWORK') return list.filter(item => item.type === 'network');
    if (activeEvidenceTab === 'ALERTS') return list.filter(item => item.type === 'alert');
    if (activeEvidenceTab === 'EMPLOYEES') return list.filter(item => item.type === 'employee');

    return list;
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-[#10b981] font-mono select-none overflow-hidden" style={{ backgroundColor: '#020617' }}>
      
      {/* 1. Universal Top Status HUD Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0a101e] border-b border-[#064e3b]/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="p-2 border-2 border-[#10b981] rounded-md bg-[#020617]/80">
            <Shield className="w-5 h-5 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tighter uppercase text-white">CYBER_ESCAPE_ROOM_AI</h1>
            <div className="flex gap-2 text-[10px] opacity-70">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                SOC_SYSTEM_ONLINE
              </span>
              <span>|</span>
              <span>VER_2.4.0_STABLE</span>
            </div>
          </div>
        </div>

        {screen === 'INVESTIGATION' && incident && (
          <div className="hidden md:flex gap-6 text-xs uppercase items-center">
            <div className="flex flex-col items-end border-r border-[#064e3b]/30 pr-4">
              <span className="opacity-50 text-[9px] text-gray-400">ACTIVE_CASE</span>
              <span className="text-white font-bold">{incident.id}</span>
            </div>
            <div className="flex flex-col items-end border-r border-[#064e3b]/30 pr-4">
              <span className="opacity-50 text-[9px] text-gray-400">ELAPSED_SESSION</span>
              <span className="text-amber-500 font-bold">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex flex-col items-end border-[#064e3b]/30 pr-4">
              <span className="opacity-50 text-[9px] text-gray-400">THREAT_DIFFICULTY</span>
              <span className={`font-bold ${
                difficulty === 'Beginner' ? 'text-green-400' :
                difficulty === 'Intermediate' ? 'text-amber-400' : 'text-red-500'
              }`}>{difficulty.toUpperCase()}</span>
            </div>
            <button 
              onClick={handleForceQuitReset}
              className="px-4 py-2 bg-red-950/20 border border-red-500/50 hover:bg-red-500 hover:text-black transition-colors font-bold text-xs rounded cursor-pointer"
            >
              RESET_MATRIX
            </button>
          </div>
        )}

        {screen === 'HOME' && (
          <div className="text-right text-xs uppercase">
            <span className="text-gray-400">ANALYST_REPUTATION: </span>
            <span className="text-amber-400 font-bold">
              {careerStats.highLogsScore >= 90 ? 'ELITE_THREAT_HUNTER' : 
               careerStats.highLogsScore >= 70 ? 'INVESTIGATION_DIRECTOR' : 'JUNIOR_SEC_ANALYST'}
            </span>
          </div>
        )}
      </header>

      {/* 2. Primary Screens Routing Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* VIEW A: HOME / LANDING SCREEN */}
        {screen === 'HOME' && (
          <div className="flex-1 overflow-y-auto">
            <div id="home_view" className="flex flex-col items-center justify-center min-h-[90%] text-[#10b981] font-mono p-6">
              <div className="w-full max-w-4xl bg-[#0a101e]/80 border border-[#064e3b]/50 rounded-lg p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
                
                {/* Visual Accent Lines */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                {/* Cyberpunk Headers */}
                <div className="flex justify-between items-center border-b border-[#064e3b]/30 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-emerald-500/80 uppercase tracking-widest pl-2">TACTICAL_PORTAL // INITIALIZE_COMMENCE</span>
                  </div>
                  <div className="text-right text-[10px] text-[#10b981]/50 uppercase">
                    SYS_LOCALE: {new Date().toLocaleTimeString()}
                  </div>
                </div>

                {/* Primary Game Title */}
                <div className="text-center my-6 md:my-10 relative">
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
                    CYBER ESCAPE ROOM <span className="text-[#10b981] shadow-glow">AI</span>
                  </h1>
                  <p className="text-xs md:text-sm text-emerald-300/70 max-w-xl mx-auto leading-relaxed">
                    A deep cybersecurity investigation simulation. Act as a primary forensic expert analyzing complex data servers, compromised emails, and network logs dynamically simulated by live AI.
                  </p>
                </div>

                {/* Dashboard Stats & Parameters Division */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 md:my-8">
                  
                  {/* Grid Block Left: Parameter Log files briefing */}
                  <div className="md:col-span-7 bg-[#020617] border border-[#064e3b]/30 rounded-md p-5 relative flex flex-col justify-between">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-3 border-b border-[#064e3b]/20 pb-2">
                        <Terminal size={14} className="text-[#10b981]" /> PROTOCOL_REQUISITES.txt
                      </h2>
                      <ul className="text-xs space-y-3 text-emerald-100/80 leading-relaxed">
                        <li className="flex gap-2">
                          <ChevronRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span><strong>Live Generation:</strong> The AI manufactures a fresh unique breach path on bootup. Attack parameters are hidden.</span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span><strong>Evidence Gathering:</strong> Sort files in your vault. Study mail relays, firewall status registers, and employee logs.</span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span><strong>Interactive Chat:</strong> Question the system assistant. It provides progressive clues but never reveals solutions outright.</span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span><strong>Final Reporting:</strong> Submit an Accusation detailing vector, initial trace, and remediation to obtain qualification scoring.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded text-[10px] text-emerald-300">
                      ⚡ <strong>Scoring Protocol:</strong> Higher accuracy guarantees promotion. Hint utilization triggers direct points deductions.
                    </div>
                  </div>

                  {/* Grid Block Right: Controls and Achievements */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    
                    {/* Career performance badge */}
                    <div className="bg-[#020617] border border-[#064e3b]/30 rounded-md p-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-3">
                        <Award size={14} className="text-amber-500" /> CAREER_CREDENTIALS.dat
                      </h2>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-[#0a101e] p-2 border border-[#064e3b]/30 rounded">
                          <div className="text-sm font-bold text-white">{careerStats.gamesPlayed}</div>
                          <div className="text-[8px] text-gray-400 uppercase">RESOLVED</div>
                        </div>
                        <div className="bg-[#0a101e] p-2 border border-[#064e3b]/30 rounded">
                          <div className="text-sm font-bold text-white">{careerStats.highLogsScore}</div>
                          <div className="text-[8px] text-gray-400 uppercase">HIGH_SCORE</div>
                        </div>
                        <div className="bg-[#0a101e] p-2 border border-[#064e3b]/30 rounded">
                          <div className="text-sm font-bold text-white text-amber-400">{careerStats.eliteHunterCount}</div>
                          <div className="text-[8px] text-gray-400 uppercase">ELITE_LEVELS</div>
                        </div>
                      </div>
                    </div>

                    {/* Threat Calibrations Difficulty Settings */}
                    <div className="bg-[#020617] border border-[#064e3b]/30 rounded-md p-4 flex-1 flex flex-col justify-center">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-3">
                        <Settings size={14} className="text-[#10b981]" /> TACTICAL_CLEARANCE
                      </h2>
                      <div className="flex flex-col gap-2">
                        {(['Beginner', 'Intermediate', 'Expert'] as Difficulty[]).map((level) => {
                          const isSelected = difficulty === level;
                          let btnStyle = "";
                          if (level === "Beginner") {
                            btnStyle = isSelected 
                              ? "bg-green-950/40 border-green-500 text-green-400" 
                              : "border-[#064e3b]/30 hover:border-green-500/50 text-emerald-300 bg-[#0a101e]";
                          } else if (level === "Intermediate") {
                            btnStyle = isSelected 
                              ? "bg-amber-950/40 border-amber-500 text-amber-400" 
                              : "border-[#064e3b]/30 hover:border-amber-500/50 text-emerald-300 bg-[#0a101e]";
                          } else if (level === "Expert") {
                            btnStyle = isSelected 
                              ? "bg-red-950/40 border-red-500 text-red-400" 
                              : "border-[#064e3b]/30 hover:border-red-500/50 text-emerald-300 bg-[#0a101e]";
                          }

                          return (
                            <button
                              key={level}
                              onClick={() => setDifficulty(level)}
                              className={`w-full py-2 px-3 border text-left text-xs font-bold rounded flex items-center justify-between transition-all duration-150 cursor-pointer ${btnStyle}`}
                            >
                              <span>{level.toUpperCase()} ANALYST</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping"></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Error log reports */}
                {error && (
                  <div className="p-4 bg-red-950/30 border border-red-900/50 rounded text-xs text-red-400 mb-6 flex gap-3">
                    <AlertTriangle size={16} className="shrink-0 text-red-500" />
                    <div>
                      <strong className="block uppercase text-white mb-0.5">BOOT_EXCLUSION_REPORT:</strong>
                      {error}
                    </div>
                  </div>
                )}

                {/* Final Launch Button Matrix */}
                <div className="text-center pt-6 border-t border-[#064e3b]/30">
                  <button
                    id="start_investigation_btn"
                    disabled={isGenerating}
                    onClick={handleInitiateSimulation}
                    className="cursor-pointer w-full md:w-auto px-10 py-4 bg-[#10b981] hover:bg-emerald-400 hover:text-black hover:font-bold transition-all disabled:bg-slate-900 disabled:text-emerald-900 disabled:border-[#064e3b] text-black font-extrabold tracking-widest text-xs rounded border border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 mx-auto uppercase"
                  >
                    <Play size={14} fill="currentColor" />
                    GENERATE NEW INCIDENT
                  </button>

                  <div className="text-[9px] text-[#10b981]/50 mt-3 font-semibold uppercase">
                    SYSTEM COMPILING UNDER PORT 3000 CONTEXT // DYNAMIC ENCRYPTED LOGGING MODE
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* VIEW B: HIGH-TECH AI SIMULATION LOADING SCREEN */}
        {screen === 'LOADING' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#020617] text-[#10b981] p-6 relative">
            <div className="absolute inset-0 bg-[#020617] text-[#10b981] opacity-5 font-mono text-[9px] select-none pointer-events-none p-4 overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="whitespace-nowrap">
                  {`03:44:${i} ISO_${100 + i} LOG_STAMP_TRX_922718_90% | CONNECT_VECTOR_PROX_801 | THREAT_ENCRYPTION_STREAM_BLOCK`}
                </div>
              ))}
            </div>

            <div className="w-full max-w-lg bg-[#0a101e] border border-[#064e3b]/60 rounded p-6 text-center space-y-6 relative shadow-lg">
              <div className="flex justify-center">
                <div className="relative">
                  <RefreshCw size={44} className="animate-spin text-[#10b981]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase text-white tracking-widest">PROVISIONING CYBER SECURE INVESTIGATION MATRIX</h3>
                <p className="text-xs text-emerald-500/80 mt-1 uppercase font-mono">Difficulty: {difficulty} | Allocating sandbox containers</p>
              </div>

              {/* Fake progress bar tracker logs */}
              <div className="text-left bg-[#020617] border border-[#064e3b]/30 p-4 rounded text-[10px] space-y-1.5 font-mono h-40 overflow-y-auto">
                <div className="text-[#10b981] flex gap-2">
                  <span className="text-white font-bold">[1]</span>
                  <span>Contacting model endpoints... OK</span>
                </div>
                <div className="text-[#10b981] flex gap-2">
                  <span className="text-white font-bold">[2]</span>
                  <span>Drafting secure timeline coordinates... OK</span>
                </div>
                <div className="text-amber-400 flex gap-2 animate-pulse">
                  <span className="text-white font-bold">[3]</span>
                  <span>Generating security threat logs to match attack...</span>
                </div>
                <div className="text-[#10b981]/50 flex gap-2">
                  <span>[4] Intercepting staff email records... Pending</span>
                </div>
                <div className="text-[#10b981]/50 flex gap-2">
                  <span>[5] Seeding final mitigation parameters... Pending</span>
                </div>
              </div>

              <div className="border-t border-[#064e3b]/30 pt-4">
                <span className="text-[9px] text-[#10b981]/50 uppercase tracking-widest block">INITIAL CONSOLE PARAMETERS SET</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW C: ACTIVE INVESTIGATION CONTROLS & SIDEBARS */}
        {screen === 'INVESTIGATION' && incident && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* COLUMN 1: EVIDENCE VAULT VIEWPORT */}
            <aside className="w-72 md:w-80 border-r border-[#064e3b]/30 bg-[#020617] flex flex-col shrink-0">
              
              {/* Evidence header */}
              <div className="p-4 border-b border-[#064e3b]/30 bg-[#0a101e]/50 shrink-0">
                <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                  <Search size={14} className="text-[#10b981]" /> EVIDENCE_VAULT
                </h2>
                <div className="text-[10px] text-gray-400 mt-1 uppercase">
                  Telemetry logs matching case
                </div>
              </div>

              {/* Tab Filters */}
              <div className="px-2 py-3 border-b border-[#064e3b]/20 bg-[#020617] flex flex-wrap gap-1 shrink-0">
                {(['ALL', 'EMAILS', 'LOGS', 'NETWORK', 'ALERTS', 'EMPLOYEES'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveEvidenceTab(tab)}
                    className={`text-[9px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                      activeEvidenceTab === tab 
                        ? 'bg-[#10b981] text-black border-[#10b981]' 
                        : 'border-[#064e3b]/40 text-[#10b981] hover:bg-emerald-950/30'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Dynamic Evidence list layout */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#020617]">
                {getFilteredEvidenceList().length === 0 ? (
                  <div className="text-center text-xs opacity-50 py-8 font-mono border border-dashed border-[#064e3b]/20 rounded">
                    NO_EVIDENCE_FOR_TAB
                  </div>
                ) : (
                  getFilteredEvidenceList().map((item) => {
                    // Decide color badges based on category
                    let tagColor = "bg-[#0a101e] border-gray-600 text-gray-300";
                    if (item.type === 'email') tagColor = "bg-blue-950/40 border-blue-900 text-blue-400";
                    if (item.type === 'log') tagColor = "bg-amber-950/40 border-amber-900 text-amber-400";
                    if (item.type === 'network') tagColor = "bg-purple-950/40 border-purple-900 text-purple-400";
                    if (item.type === 'alert') tagColor = "bg-red-950/40 border-red-900 text-red-400";
                    if (item.type === 'employee') tagColor = "bg-emerald-950/40 border-emerald-900 text-emerald-400";

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedEvidenceItem({
                          type: item.type,
                          title: item.title,
                          content: item.raw
                        })}
                        className="p-3 bg-emerald-950/5 border border-emerald-500/10 rounded cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-colors group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-center text-[9px] mb-1.5">
                          <span className={`px-1.5 py-0.5 border rounded uppercase ${tagColor}`}>
                            {item.type}
                          </span>
                          <span className="text-gray-400 font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                            {item.id}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-tight truncate group-hover:text-amber-300">
                          {item.title}
                        </h3>
                        <p className="text-[10px] mt-1 text-[#10b981]/70 line-clamp-2 leading-normal">
                          {item.preview}
                        </p>
                        
                        {/* Hidden diagnostics scanning decoration */}
                        <div className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <Eye size={12} className="text-[#10b981]" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mini Brief Case Information */}
              <div className="p-3 bg-[#0a101e] border-t border-[#064e3b]/30 text-[10px] space-y-1.5 shrink-0">
                <div className="flex justify-between">
                  <span className="text-[#10b981]/50 uppercase">TARGET_CORP:</span>
                  <span className="text-white font-bold">{incident.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#10b981]/50 uppercase">PLAYTIME_LAP:</span>
                  <span className="text-amber-500 font-bold">{formatTime(elapsedTime)}</span>
                </div>
              </div>

            </aside>

            {/* COLUMN 2: CENTER PIECE CHAT AND DIAGNOSTICS VIEW */}
            <section className="flex-1 flex flex-col bg-[#050b16] relative overflow-hidden border-r border-[#064e3b]/30">
              
              {/* Radial gradient glow overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(2,6,23,0.3) 100%)' }}></div>

              {/* Selected scenario briefing header */}
              <div className="p-4 md:p-5 border-b border-[#064e3b]/30 bg-[#0a101e]/80 backdrop-blur-sm z-10 shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">
                    <ShieldAlert size={14} className="text-red-500" /> SIMULATED_ATTACK_PLAYBOOK
                  </h2>
                  <span className="px-2 py-0.5 bg-red-950/50 border border-red-500/50 text-red-500 text-[9px] font-bold uppercase rounded">
                    LIVE_BREACH_ALERT
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-100/90 font-mono">
                  {incident.scenarioDescription}
                </p>
                
                {/* Timeline dropdown display */}
                <div className="mt-3 text-[10px] border-t border-[#064e3b]/20 pt-2 flex items-center gap-2 overflow-x-auto">
                  <span className="text-gray-400 uppercase font-semibold text-[9px]">INITIAL_TIMELINE:</span>
                  {incident.timeline.map((item, idx) => (
                    <div key={idx} className="bg-[#020617] border border-[#064e3b]/40 px-2 py-0.5 text-white whitespace-nowrap rounded font-mono">
                      <strong className="text-[#10b981]">{item.time}</strong>: {item.event}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Stream Viewport */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 bg-[#020617]/40">
                
                {chatMessages.map((m) => {
                  const isUser = m.role === 'user';
                  const isSystemHint = m.content.includes("SYSTEM_HINT");
                  
                  return (
                    <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg border p-4.5 font-mono text-xs ${
                        isUser 
                          ? 'bg-emerald-900/20 border-emerald-500/40 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.05)] rounded-tr-none' 
                          : isSystemHint
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 rounded-tl-none shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                            : 'bg-[#0f172a] border-[#1e293b] text-white rounded-tl-none'
                      }`}>
                        
                        <div className="flex justify-between items-center text-[9px] mb-1.5 opacity-60">
                          <span className={`font-bold ${isUser ? 'text-emerald-400' : isSystemHint ? 'text-amber-400' : 'text-gray-300'}`}>
                            {isUser ? '[USER_ANALYST]' : isSystemHint ? '[SEC_CRYPTO_NODE]' : '[CSOC_LEAD_OPERATOR]'}
                          </span>
                          <span>{m.timestamp}</span>
                        </div>

                        <div className="whitespace-pre-wrap leading-relaxed">
                          {m.content}
                        </div>

                      </div>
                    </div>
                  );
                })}

                {/* Loading typing blips */}
                {isChatSending && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-[#0f172a] border border-[#1e293b] p-3 rounded-lg rounded-tl-none text-xs text-gray-400 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                        <span className="text-[10px] uppercase font-mono tracking-widest pl-1">AI Analyst processing network dumps...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef}></div>
              </div>

              {/* Active chat input */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-[#064e3b]/30 bg-[#020617] shrink-0 z-10 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatSending}
                  className="flex-1 bg-[#0a101e] border border-[#064e3b]/50 rounded px-4 py-3 text-xs text-emerald-400 focus:outline-none focus:border-emerald-400 placeholder:opacity-35 font-mono"
                  placeholder="QUERY_LEAD_OPERATOR_CORRELATE_IP_OR_LOGS (e.g., 'Compare suspect login with HR mail date')..."
                />
                <button
                  type="submit"
                  disabled={isChatSending || !chatInput.trim()}
                  className="px-4.5 bg-[#10b981] hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-[#10b981] text-black font-extrabold rounded flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </form>

            </section>

            {/* COLUMN 3: RIGHT PANEL ACCUSATION & HINTS DECRYPTOR */}
            <aside className="w-80 border-l border-[#064e3b]/30 bg-[#0a101e] flex flex-col shrink-0 overflow-y-auto">
              
              {/* ACCUSATION REPORT FORM CONTAINER */}
              <div className="p-5 border-b border-[#064e3b]/30 bg-[#0a101e]/40">
                <h3 className="text-xs font-extrabold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={14} className="text-red-500" /> ACCUSATION_REPORT_FORM
                </h3>
                
                <form onSubmit={handleSubmitAccusationReport} className="space-y-4">
                  
                  {/* Field 1: Attack classification */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-gray-400 flex justify-between">
                      <span>1. ATTACK_VICTOR_CLASSIFY</span>
                      <span className="text-[#10b981] font-normal lowercase">[e.g. Spear Phishing]</span>
                    </label>
                    <input 
                      type="text" 
                      value={submission.attackType}
                      onChange={(e) => setSubmission({...submission, attackType: e.target.value})}
                      placeholder="Identified Attack Type Category..."
                      className="bg-[#020617] border border-[#064e3b] text-xs p-2.5 rounded text-white focus:outline-none focus:border-emerald-400 placeholder:opacity-20 font-mono"
                      required
                    />
                  </div>

                  {/* Field 2: Compromised Entry Point */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-gray-400 flex justify-between">
                      <span>2. PRIMARY_ENTRY_TRACE</span>
                      <span className="text-[#10b981] font-normal lowercase">[e.g. Invoice Attachment]</span>
                    </label>
                    <input 
                      type="text" 
                      value={submission.entryPoint}
                      onChange={(e) => setSubmission({...submission, entryPoint: e.target.value})}
                      placeholder="First entry point system vector..."
                      className="bg-[#020617] border border-[#064e3b] text-xs p-2.5 rounded text-white focus:outline-none focus:border-emerald-400 placeholder:opacity-20 font-mono"
                      required
                    />
                  </div>

                  {/* Field 3: Exploited Vulnerability */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-gray-400 flex justify-between">
                      <span>3. EXPLOITED_VULNERABILITY</span>
                      <span className="text-[#10b981] font-normal lowercase">[e.g. Unpatched SMTP servers]</span>
                    </label>
                    <input 
                      type="text" 
                      value={submission.vulnerability}
                      onChange={(e) => setSubmission({...submission, vulnerability: e.target.value})}
                      placeholder="Weakness exploited by threat agent..."
                      className="bg-[#020617] border border-[#064e3b] text-xs p-2.5 rounded text-white focus:outline-none focus:border-emerald-400 placeholder:opacity-20 font-mono"
                      required
                    />
                  </div>

                  {/* Field 4: Recommended Playbook Mitigation */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-gray-400 flex justify-between">
                      <span>4. PLAYBOOK_MITIGATION</span>
                      <span className="text-[#10b981] font-normal lowercase">[e.g. Implement MFA controls]</span>
                    </label>
                    <textarea 
                      value={submission.mitigation}
                      onChange={(e) => setSubmission({...submission, mitigation: e.target.value})}
                      placeholder="Immediate remediation protocol to mitigate security threat..."
                      className="bg-[#020617] border border-[#064e3b] text-xs p-2.5 rounded text-white focus:outline-none focus:border-emerald-400 placeholder:opacity-20 font-mono h-16 resize-none"
                      required
                    />
                  </div>

                  {/* SUBMISSIVE TRIGGER */}
                  <button 
                    type="submit"
                    disabled={isSubmittingReport}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 transition-colors text-white text-[11px] font-extrabold uppercase rounded shadow-[0_0_15px_rgba(220,38,38,0.3)] tracking-wider mt-2 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingReport ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        AUDITING REPORT RATINGS...
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={14} />
                        SUBMIT_FINDINGS_FOR_EVALUATION
                      </>
                    )}
                  </button>

                </form>
              </div>

              {/* PROGRESSIVE DECRYPT HINT SYSTEM */}
              <div className="flex-1 p-5 flex flex-col justify-between gap-6">
                
                {/* HINT MODULE BLOCK */}
                <div className="p-4 border border-amber-500/30 bg-amber-500/5 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Lock size={12} /> CRYPTO_HINT_DECRYPTOR
                    </h4>
                    <span className="text-[9px] text-[#10b981] bg-[#020617] px-1 py-0.5 border border-[#064e3b] font-bold">
                      {3 - hintsUsed} LEFT
                    </span>
                  </div>

                  {/* Interactive level indicator */}
                  <div className="flex gap-1.5 mb-3">
                    <div className={`flex-1 h-1 rounded-sm ${hintsUsed >= 1 ? 'bg-amber-500' : 'bg-gray-800'}`}></div>
                    <div className={`flex-1 h-1 rounded-sm ${hintsUsed >= 2 ? 'bg-amber-500' : 'bg-gray-800'}`}></div>
                    <div className={`flex-1 h-1 rounded-sm ${hintsUsed >= 3 ? 'bg-amber-500' : 'bg-gray-800'}`}></div>
                  </div>

                  {/* Render unlocked hints list for live scrolling review */}
                  {unlockedHints.length > 0 && (
                    <div className="mb-3 space-y-2 max-h-24 overflow-y-auto border-b border-amber-500/20 pb-2">
                      {unlockedHints.map((hnt, index) => (
                        <div key={index} className="text-[10px] italic text-amber-200/90 leading-relaxed font-mono">
                          <strong className="text-amber-500 not-italic">HINT_0{index+1}:</strong> "{hnt}"
                        </div>
                      ))}
                    </div>
                  )}

                  {hintsUsed < 3 ? (
                    <button 
                      onClick={handleRequestHint}
                      disabled={isRequestingHint}
                      className="text-[10px] underline underline-offset-2 text-amber-400 hover:text-amber-300 transition-colors uppercase cursor-pointer flex items-center gap-1"
                    >
                      {isRequestingHint ? (
                        <>
                          <RefreshCw size={11} className="animate-spin" />
                          CORRELATING DECRYPTER...
                        </>
                      ) : (
                        `decrypt_level_0${hintsUsed + 1}_clue`
                      )}
                    </button>
                  ) : (
                    <p className="text-[9px] text-gray-500 uppercase font-bold italic">
                      MAXIMUM_HINTS_LIMIT_EXCEEDED
                    </p>
                  )}
                </div>

                {/* REALTIME SYSTEM STATS */}
                <div className="flex flex-col gap-2 border-t border-[#064e3b]/20 pt-4 bg-[#0a101e]/40 p-3 rounded">
                  <div className="flex justify-between text-[10px]">
                    <span className="opacity-50 text-gray-400">SESSION_DIFFICULTY:</span>
                    <span className="text-white font-bold">{difficulty.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="opacity-50 text-gray-400">UNRESOLVED_HINTS_PENALTY:</span>
                    <span className="text-[#10b981] font-bold">-{hintsUsed * 10} POINTS</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="opacity-50 text-gray-400">TIME_SPEED_INDEX:</span>
                    <span className="text-amber-500 font-mono font-bold animate-pulse">{formatTime(elapsedTime)}</span>
                  </div>
                </div>

              </div>
              
            </aside>

          </div>
        )}

        {/* VIEW D: FINAL DETAILED AUDITING COMPLIANCE SCORING PANEL */}
        {screen === 'RESULT' && evaluation && incident && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
              
              {/* Performance Summary Banner */}
              <div className="bg-[#0a101e] border-2 border-[#064e3b] rounded-lg p-6 md:p-8 shadow-2xl relative overflow-hidden text-center">
                
                {/* Big Badge Indicator */}
                <div className="inline-block p-4 bg-emerald-950/20 border-2 border-[#10b981] rounded-full mb-4">
                  <Shield className="w-12 h-12 text-[#10b981]" />
                </div>

                <span className="block text-[10px] text-emerald-500 uppercase uppercase-widest tracking-widest font-mono">
                  FINAL_INCIDENT_REPORT_AUDIT_COMPLETED
                </span>
                
                <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-1 border-b border-[#064e3b]/30 pb-4 mb-4">
                  {evaluation.rating.toUpperCase()}
                </h1>

                {/* SCORE BREAKDOWN METRICS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto my-6 text-center font-mono">
                  
                  <div className="bg-[#020617] border border-[#064e3b]/50 p-4 rounded-md">
                    <span className="text-[9px] text-gray-400 block uppercase">ACCURACY_INDEX</span>
                    <span className="text-2xl font-bold text-white">{evaluation.accuracyScore}%</span>
                  </div>

                  <div className="bg-[#020617] border border-[#064e3b]/50 p-4 rounded-md">
                    <span className="text-[9px] text-gray-400 block uppercase">TIME_SPEED_INDEX</span>
                    <span className="text-2xl font-bold text-[#10b981]">{formatTime(elapsedTime)}</span>
                  </div>

                  <div className="bg-[#020617] border border-[#064e3b]/50 p-4 rounded-md">
                    <span className="text-[9px] text-gray-400 block uppercase">HINT_PENALTY</span>
                    <span className="text-2xl font-bold text-red-400">-{evaluation.hintPenalty}</span>
                  </div>

                  <div className="bg-[#020617] border border-[#064e3b]/50 p-4 rounded-md">
                    <span className="text-[9px] text-gray-400 block uppercase">TOTAL_SCORE</span>
                    <span className="text-2xl font-bold text-amber-400">{evaluation.totalScore}</span>
                  </div>

                </div>

                <p className="text-xs text-gray-300 max-w-xl mx-auto leading-relaxed">
                  Your forensic assessment has been successfully scored and recorded inside the corporate network registries. Consult the diagnostic brief below to discover the hidden path exploited.
                </p>

              </div>

              {/* DEDUCTIVE COMPARATIVE FEEDBACK REVIEW */}
              <div className="bg-[#0a101e] border border-[#064e3b]/50 p-6 rounded-lg space-y-6">
                
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 mb-2 border-b border-[#064e3b]/20 pb-2">
                    <Info size={14} className="text-[#10b981]" /> CASE_DIAGNOSTICS_COMPLIANCE_BREAKDOWN
                  </h3>
                  <p className="text-xs text-[#10b981]/80 leading-relaxed font-mono">
                    Below is your specific audit report compliance grading measured on how accurately you identified the threat anomalies vs the absolute truth variables.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Field 1: Attack classification details */}
                  <div className="bg-[#020617] border border-[#064e3b]/30 p-4 rounded space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#10b981] font-bold uppercase">1. ATTACK TYPE COMPLIANCE</span>
                      <span className={`px-2 py-0.5 border rounded font-mono text-[9px] font-bold ${
                        evaluation.feedback.attackType.status === 'CORRECT' ? 'bg-green-950/40 border-green-500 text-green-400' :
                        evaluation.feedback.attackType.status === 'PARTIAL' ? 'bg-amber-950/40 border-amber-500 text-amber-400' :
                        'bg-red-950/40 border-red-500 text-red-500'
                      }`}>
                        {evaluation.feedback.attackType.status} (+{evaluation.feedback.attackType.score})
                      </span>
                    </div>
                    <div className="text-xs text-white"><strong className="text-gray-400">REPORTED:</strong> "{submission.attackType}"</div>
                    <div className="text-xs text-[#10b981]"><strong className="text-gray-400">GROUND TRUTH:</strong> "{evaluation.correctSolution.attackType}"</div>
                    <p className="text-[10px] text-gray-400 leading-normal italic font-mono pt-1">
                      {evaluation.feedback.attackType.explanation}
                    </p>
                  </div>

                  {/* Field 2: Entry point diagnostics */}
                  <div className="bg-[#020617] border border-[#064e3b]/30 p-4 rounded space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#10b981] font-bold uppercase">2. PATTERN ENTRY VECTOR</span>
                      <span className={`px-2 py-0.5 border rounded font-mono text-[9px] font-bold ${
                        evaluation.feedback.entryPoint.status === 'CORRECT' ? 'bg-green-950/40 border-green-500 text-green-400' :
                        evaluation.feedback.entryPoint.status === 'PARTIAL' ? 'bg-amber-950/40 border-amber-500 text-amber-400' :
                        'bg-red-950/40 border-red-500 text-red-500'
                      }`}>
                        {evaluation.feedback.entryPoint.status} (+{evaluation.feedback.entryPoint.score})
                      </span>
                    </div>
                    <div className="text-xs text-white"><strong className="text-gray-400">REPORTED:</strong> "{submission.entryPoint}"</div>
                    <div className="text-xs text-[#10b981]"><strong className="text-gray-400">GROUND TRUTH:</strong> "{evaluation.correctSolution.entryPoint}"</div>
                    <p className="text-[10px] text-gray-400 leading-normal italic font-mono pt-1">
                      {evaluation.feedback.entryPoint.explanation}
                    </p>
                  </div>

                  {/* Field 3: Vulnerability exploit */}
                  <div className="bg-[#020617] border border-[#064e3b]/30 p-4 rounded space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#10b981] font-bold uppercase">3. EXPLOIT VULNERABILITY COMPLIANCE</span>
                      <span className={`px-2 py-0.5 border rounded font-mono text-[9px] font-bold ${
                        evaluation.feedback.vulnerability.status === 'CORRECT' ? 'bg-green-950/40 border-green-500 text-green-400' :
                        evaluation.feedback.vulnerability.status === 'PARTIAL' ? 'bg-amber-950/40 border-amber-500 text-amber-400' :
                        'bg-red-950/40 border-red-500 text-red-500'
                      }`}>
                        {evaluation.feedback.vulnerability.status} (+{evaluation.feedback.vulnerability.score})
                      </span>
                    </div>
                    <div className="text-xs text-white"><strong className="text-gray-400">REPORTED:</strong> "{submission.vulnerability}"</div>
                    <div className="text-xs text-[#10b981]"><strong className="text-gray-400">GROUND TRUTH:</strong> "{evaluation.correctSolution.vulnerability}"</div>
                    <p className="text-[10px] text-gray-400 leading-normal italic font-mono pt-1">
                      {evaluation.feedback.vulnerability.explanation}
                    </p>
                  </div>

                  {/* Field 4: Recommended remediation */}
                  <div className="bg-[#020617] border border-[#064e3b]/30 p-4 rounded space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#10b981] font-bold uppercase">4. MITIGATION STRATEGY COMPLIANCE</span>
                      <span className={`px-2 py-0.5 border rounded font-mono text-[9px] font-bold ${
                        evaluation.feedback.mitigation.status === 'CORRECT' ? 'bg-green-950/40 border-green-500 text-green-400' :
                        evaluation.feedback.mitigation.status === 'PARTIAL' ? 'bg-amber-950/40 border-amber-500 text-amber-400' :
                        'bg-red-950/40 border-red-500 text-red-500'
                      }`}>
                        {evaluation.feedback.mitigation.status} (+{evaluation.feedback.mitigation.score})
                      </span>
                    </div>
                    <div className="text-xs text-white"><strong className="text-gray-400">REPORTED:</strong> "{submission.mitigation}"</div>
                    <div className="text-xs text-[#10b981]"><strong className="text-gray-400">GROUND TRUTH:</strong> "{evaluation.correctSolution.mitigation}"</div>
                    <p className="text-[10px] text-gray-400 leading-normal italic font-mono pt-1">
                      {evaluation.feedback.mitigation.explanation}
                    </p>
                  </div>

                </div>

                {/* EXPLICIT ATTACK PATH LOGS ANALYSIS BRIEFING */}
                <div className="bg-[#020617] p-5 border border-[#064e3b]/60 rounded space-y-2.5 font-mono">
                  <h4 className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-1.5 border-b border-[#064e3b]/30 pb-2">
                     <AlertCircle size={13} className="text-amber-500 animate-pulse" /> COMPREHENSIVE_ROOT_CAUSE_ANALYSIS_STAMP
                  </h4>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    {evaluation.correctSolution.attackPathExplanation}
                  </p>
                </div>

                {/* Actions bottom row */}
                <div className="border-t border-[#064e3b]/30 pt-6 flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => setScreen('HOME')}
                    className="px-6 py-3 border border-[#064e3b] text-white hover:bg-emerald-900/20 text-xs font-bold uppercase rounded cursor-pointer transition-colors"
                  >
                    RETURN_TO_COMMUNITY_HUB
                  </button>
                  <button
                    onClick={handleInitiateSimulation}
                    className="px-6 py-3 bg-[#10b981] text-black hover:bg-emerald-400 cursor-pointer font-extrabold text-xs uppercase rounded hover:shadow-lg transition-all"
                  >
                    INITIATE_NEW_CASE_MATRIX
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* 3. COHESIVE POPUP SLIDEOUT DIAGNOSTICS VAULT MODAL OVERLAY */}
      {selectedEvidenceItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          
          <div className="w-full max-w-2xl bg-[#0a101e] border-2 border-[#10b981] shadow-2xl rounded-lg p-5 flex flex-col max-h-[85vh] relative text-[#10b981]">
            
            {/* Top exit header */}
            <header className="flex justify-between items-center border-b border-[#064e3b]/50 pb-4 mb-4 shrink-0 font-mono">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping"></span>
                <span className="text-gray-400 uppercase font-bold">SEC_DECRYPT:</span>
                <span className="text-white font-bold uppercase underline decoration-[#10b981] select-all cursor-text">{selectedEvidenceItem.title}</span>
              </div>
              <button 
                onClick={() => setSelectedEvidenceItem(null)}
                className="p-1.5 rounded-full hover:bg-emerald-950 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </header>

            {/* Simulated diagnostic content scrollbody */}
            <div className="flex-1 overflow-y-auto pr-1">
              {renderDetailContent()}
            </div>

            {/* Bottom matrix diagnostic verification stamp */}
            <footer className="border-t border-[#064e3b]/30 pt-4 mt-4 text-[9px] text-[#10b981]/60 flex justify-between uppercase font-mono shrink-0">
              <span>STATUS: DIAGNOSTICS_COMPUTE_STREAK_AUTHENTIC_OK</span>
              <span>VERIFICATION_STAMP_ID: {Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
            </footer>

          </div>

        </div>
      )}

    </div>
  );
}
