export type Difficulty = 'Beginner' | 'Intermediate' | 'Expert';

export type IncidentCategory = 
  | 'Phishing' 
  | 'Ransomware' 
  | 'Insider Threat' 
  | 'Data Breach' 
  | 'Social Engineering' 
  | 'Malware Infection';

export interface EmployeeProfile {
  name: string;
  role: string;
  department: string;
  accessLevel: string;
  statement: string; // The interview statement or profile context
}

export interface SecurityLog {
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  protocol?: string;
  action: string;
  status: string;
  details: string;
}

export interface EmailEvidence {
  id: string;
  sender: string;
  recipient: string;
  date: string;
  subject: string;
  body: string;
}

export interface NetworkConnection {
  time: string;
  source: string;
  destination: string;
  bytesTransferred: number;
  alertFlag: boolean;
}

export interface Incident {
  id: string;
  companyName: string;
  category: IncidentCategory;
  difficulty: Difficulty;
  scenarioDescription: string;
  timeline: { time: string; event: string }[];
  employees: EmployeeProfile[];
  logs: SecurityLog[];
  emails: EmailEvidence[];
  networkActivity: NetworkConnection[];
  alerts: { id: string; timestamp: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; message: string; system: string }[];
  hintsProgressive: string[]; // 3 levels of hints matching the case
  solution: {
    attackType: string;
    entryPoint: string;
    vulnerability: string;
    mitigation: string;
    attackPathExplanation: string;
  };
}

// Sent to client - excludes solution
export interface PublicIncident {
  id: string;
  companyName: string;
  category: IncidentCategory;
  difficulty: Difficulty;
  scenarioDescription: string;
  timeline: { time: string; event: string }[];
  employees: EmployeeProfile[];
  logs: SecurityLog[];
  emails: EmailEvidence[];
  networkActivity: NetworkConnection[];
  alerts: { id: string; timestamp: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; message: string; system: string }[];
  hintsLeftCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AccusationSubmission {
  attackType: string;
  entryPoint: string;
  vulnerability: string;
  mitigation: string;
}

export interface EvaluationResult {
  accuracyScore: number; // 0 - 100
  timeBonus: number;
  hintPenalty: number;
  totalScore: number;
  rating: string; // e.g. "Elite Threat Hunter", "Senior Responder", "Junior Analyst"
  feedback: {
    attackType: { score: number; status: 'CORRECT' | 'PARTIAL' | 'INCORRECT'; explanation: string };
    entryPoint: { score: number; status: 'CORRECT' | 'PARTIAL' | 'INCORRECT'; explanation: string };
    vulnerability: { score: number; status: 'CORRECT' | 'PARTIAL' | 'INCORRECT'; explanation: string };
    mitigation: { score: number; status: 'CORRECT' | 'PARTIAL' | 'INCORRECT'; explanation: string };
  };
  correctSolution: {
    attackType: string;
    entryPoint: string;
    vulnerability: string;
    mitigation: string;
    attackPathExplanation: string;
  };
}
