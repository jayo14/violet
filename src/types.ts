export interface Education {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Experience {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string; // or "Present"
  description: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
  education: Education[];
  skills: string[];
  experience: Experience[];
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  deadline?: string;
  requirements: string[];
  descriptionText?: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface OpportunityAnalysis {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export enum EmailType {
  OFFER = "OFFER",
  INTERVIEW = "INTERVIEW",
  REJECTION = "REJECTION",
  FOLLOW_UP = "FOLLOW_UP",
  OPPORTUNITY = "OPPORTUNITY"
}

export interface EmailIntel {
  id: string;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
  category: EmailType;
  processed: boolean;
  suggestedAction?: string;
}

export enum ApplicationStatus {
  SAVED = "SAVED",
  READY = "READY",
  APPLIED = "APPLIED",
  INTERVIEW = "INTERVIEW",
  REJECTED = "REJECTED",
  OFFER = "OFFER",
  ACCEPTED = "ACCEPTED"
}

export interface InterviewPrep {
  id: string;
  opportunityId: string;
  company: string;
  role: string;
  research: {
    products: string[];
    mission: string;
    competitors: string[];
  };
  technicalQuestions: {
    question: string;
    answerSuggestion: string;
  }[];
  hrQuestions: {
    question: string;
    answerSuggestion: string;
  }[];
}

export interface IdentityMemory {
  skills: string[];
  education: string[];
  projects: string[];
}

export interface PreferenceMemory {
  preferredRoles: string[];
  preferredLocations: string[];
  remotePreference: boolean;
}

export interface CareerMemoryHistory {
  applications: string[];
  interviews: string[];
  offers: string[];
}

export interface LearningMemory {
  observations: string[];
  recommendations: string[];
}

export interface CareerMemory {
  identity: IdentityMemory;
  preference: PreferenceMemory;
  history: CareerMemoryHistory;
  learning: LearningMemory;
}

export interface Achievement {
  id: string;
  title: string;
  source: "github" | "portfolio" | "resume" | "application-history" | "detected";
  description: string;
  detectedAt: string;
  isAppliedToResume: boolean;
}

export interface ApprovalRequest {
  id: string;
  type: "resume-variant" | "cover-letter" | "cover-email" | "add-achievement";
  title: string;
  description: string;
  payload: any; // specific changes / text generated
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
