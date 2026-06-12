import React from 'react';
import { Shield, Terminal, Settings, Play, Award, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { Difficulty } from '../types';

interface HomeProps {
  difficulty: Difficulty;
  setDifficulty: (level: Difficulty) => void;
  onGenerateIncident: () => void;
  isGenerating: boolean;
  error: string | null;
}

export default function Home({
  difficulty,
  setDifficulty,
  onGenerateIncident,
  isGenerating,
  error,
}: HomeProps) {
  // Load stats from localStorage if they exist
  const getCareerStats = () => {
    try {
      const stats = localStorage.getItem('cyber_escape_career');
      if (stats) {
        return JSON.parse(stats);
      }
    } catch (e) {
      // safe fallback
    }
    return { gamesPlayed: 0, highLogsScore: 0, eliteHunterCount: 0 };
  };

  const stats = getCareerStats();

  return (
    <div id="home_view" className="flex flex-col items-center justify-center min-h-[90vh] text-emerald-400 font-mono p-4">
      <div className="w-full max-w-4xl bg-slate-950 border border-emerald-500/30 rounded-lg p-6 shadow-2xl shadow-emerald-950/20 relative overflow-hidden backdrop-blur-md">
        
        {/* Futuristic Grid Detail */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Top Header Row / Terminal Style */}
        <div className="flex justify-between items-center border-b border-emerald-900/40 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-emerald-600/80 uppercase tracking-widest pl-2">System // CYBER_ESCAPE_SOC v2.5</span>
          </div>
          <div className="text-right text-xs text-emerald-600/80">
            SEC_LEVEL: ANALYST_GUEST
          </div>
        </div>

        {/* Game Title with Cyberpunk Flare */}
        <div className="text-center my-8 relative">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500 bg-clip-text text-transparent animate-pulse filter drop-shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            CYBER ESCAPE ROOM AI
          </h1>
          <p className="text-xs md:text-sm text-emerald-500/80 mt-3 max-w-xl mx-auto">
            Become a Lead SecOps Analyst. Use advanced log analysis, suspicious email inspection, and AI consultation to decode and mitigate persistent server breaches.
          </p>
        </div>

        {/* Grid Container for Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6">
          
          {/* Rules / Tutorial */}
          <div className="md:col-span-7 bg-slate-900/60 border border-emerald-900/30 rounded p-5 relative">
            <h2 className="text-sm font-bold uppercase text-emerald-100 flex items-center gap-2 mb-3 border-b border-emerald-900/40 pb-2">
              <Terminal size={16} /> MISSION_PARAMETERS.txt
            </h2>
            <ul className="text-xs space-y-2 text-emerald-300/90 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">▶</span>
                <span>Each investigation triggers a dynamically simulated incident. The true attack vectors are completely hidden.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">▶</span>
                <span>Inspect your <strong className="text-emerald-400">Evidence Vault</strong> containing system logs, alerts, emails, and staff interviews.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">▶</span>
                <span>Ask the <strong className="text-emerald-400">CSOC AI Lead</strong> questions about raw timestamps, employee activity, or weird port transactions.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">▶</span>
                <span>Submit your findings by specifying details: <strong className="text-amber-400">Attack Type</strong>, <strong className="text-amber-400">Entry Point</strong>, <strong className="text-amber-400">Vulnerability</strong>, and <strong className="text-emerald-400">Mitigation</strong>.</span>
              </li>
            </ul>

            <div className="mt-4 p-2 bg-emerald-950/20 border border-emerald-800/30 rounded text-[11px] text-emerald-500/90">
              ⚡ <strong>Rules:</strong> Max 3 hints. Hints carry a scoring penalty. The timer counts towards your Speed Index rating.
            </div>
          </div>

          {/* Configuration & Stats */}
          <div className="md:col-span-5 flex flex-col gap-4">
            
            {/* Career Record Badge */}
            <div className="bg-slate-900/60 border border-emerald-900/30 rounded p-4 flex flex-col justify-between">
              <h2 className="text-sm font-bold uppercase text-emerald-100 flex items-center gap-2 mb-2">
                <Award size={16} className="text-amber-500" /> REPUTATION_RECORD.dat
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center mt-2">
                <div className="bg-slate-950 p-2 border border-emerald-900/30 rounded">
                  <div className="text-lg font-bold text-white">{stats.gamesPlayed}</div>
                  <div className="text-[9px] text-emerald-600 uppercase">SOLVED</div>
                </div>
                <div className="bg-slate-950 p-2 border border-emerald-900/30 rounded">
                  <div className="text-lg font-bold text-white">{stats.highLogsScore}</div>
                  <div className="text-[9px] text-emerald-600 uppercase">HIGH_SCORE</div>
                </div>
                <div className="bg-slate-950 p-2 border border-emerald-900/30 rounded">
                  <div className="text-lg font-bold text-amber-400">{stats.eliteHunterCount}</div>
                  <div className="text-[9px] text-emerald-600 uppercase">ELITE_RATING</div>
                </div>
              </div>
            </div>

            {/* Difficulty choosing panel */}
            <div className="bg-slate-900/60 border border-emerald-900/30 rounded p-4">
              <h2 className="text-sm font-bold uppercase text-emerald-100 flex items-center gap-2 mb-3">
                <Settings size={16} /> CALIBRATE_DIFFICULTY
              </h2>
              <div className="flex flex-col gap-2">
                {(['Beginner', 'Intermediate', 'Expert'] as Difficulty[]).map((level) => {
                  const isSelected = difficulty === level;
                  let colorClass = "";
                  if (level === "Beginner") colorClass = isSelected ? "bg-green-500/20 border-green-500 text-green-400" : "hover:border-green-500/40 text-green-600 border-emerald-900/20";
                  if (level === "Intermediate") colorClass = isSelected ? "bg-amber-500/20 border-amber-500 text-amber-400" : "hover:border-amber-500/40 text-amber-600 border-emerald-900/20";
                  if (level === "Expert") colorClass = isSelected ? "bg-red-500/20 border-red-500 text-red-500" : "hover:border-red-500/40 text-red-700 border-emerald-900/20";

                  return (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`w-full py-2 px-3 border text-left text-xs font-bold rounded duration-200 flex items-center justify-between ${colorClass}`}
                    >
                      <span>{level.toUpperCase()} LEVEL</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Errors view */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/50 rounded text-xs text-red-400 mb-6 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <strong>ERROR INITIALIZING CORE_SIMULATOR:</strong> {error}
            </div>
          </div>
        )}

        {/* Generate Trigger Action */}
        <div className="text-center pt-4 border-t border-emerald-900/30">
          <button
            id="start_investigation_btn"
            disabled={isGenerating}
            onClick={onGenerateIncident}
            className={`cursor-pointer px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 disabled:text-emerald-800 disabled:border-emerald-900/40 border border-emerald-400 hover:border-emerald-300 text-slate-950 font-bold tracking-widest text-sm rounded shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-3 mx-auto uppercase ${isGenerating ? 'animate-pulse' : ''}`}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                SIMULATING ARCHITECTURE...
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                INITIATE SIMULATION
              </>
            )}
          </button>
          
          <div className="text-[10px] text-emerald-600/70 mt-3 font-bold uppercase">
            WARNING: SYSTEM COMPILATION IN PROGRESS // KEEP PORT 3000 ARTIFACTS CLEAR
          </div>
        </div>

      </div>
    </div>
  );
}
