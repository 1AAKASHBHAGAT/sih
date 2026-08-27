export type UserRole = 'citizen' | 'university_admin' | 'industry' | 'government' | 'guest';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  institution?: string | null;
  company_name?: string | null;
  created_at?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  institution: string | null;
  companyName: string | null;
  loginStep1: (email: string, pass: string) => Promise<any>;
  loginStep2: (email: string, pass: string, otp: string) => Promise<any>;
  forgotPasswordRequest: (email: string) => Promise<any>;
  forgotPasswordConfirm: (email: string, otp: string, pass: string) => Promise<any>;
  resendOTP: (email: string) => Promise<any>;
  register: (data: any) => Promise<User>;
  logout: () => void;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  target_date?: string;
}

export interface Problem {
  id: string;
  ticket_code: string;
  title: string;
  description: string;
  district: string;
  location_lat?: number;
  location_lng?: number;
  domain: string;
  assigned_university?: string;
  calculated_priority: number;
  status: string;
  ai_suggested_domain?: string;
  ai_suggested_priority?: number;
  confidence_score?: number;
  created_at: string;
  needs_human_review?: boolean;
  ai_audit_trail?: Record<string, any>;
  milestones?: Milestone[];
  assigned_team?: string;
}

export interface CSRPledge {
  id: string;
  problem_id: string;
  company_name: string;
  pledge_amount: number;
  csr_focus_area?: string;
  contact_email?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  ticket_code: string;
  event_type: string;
  message: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_problems: number;
  resolved_problems: number;
  in_progress_problems: number;
  domain_breakdown: Record<string, number>;
  university_workload: Record<string, number>;
  district_breakdown: Record<string, number>;
}
