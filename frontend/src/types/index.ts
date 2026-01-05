// User types
export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Document types
export type DocumentCategory =
  | "resume"
  | "portfolio"
  | "cover_letter"
  | "weekly_report"
  | "proposal"
  | "misc";

export interface Document {
  id: string;
  user_id: string;
  category: DocumentCategory;
  title: string;
  original_file_name: string;
  original_file_type: string;
  original_file_url: string;
  markdown_content: string | null;
  markdown_file_url: string | null;
  keywords: string[];
  summary: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
  page: number;
  size: number;
}

// AI Session types
export interface AISession {
  id: string;
  user_id: string;
  ai_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// Cover Letter types
export interface CoverLetterRequest {
  company_name: string;
  job_posting: string;
  document_ids: string[];
  additional_instructions?: string;
}

export interface CoverLetterResult {
  id: string;
  session_id: string;
  company_name: string;
  job_posting: string;
  content: Record<string, string>;
  final_score: number | null;
  iteration_count: number;
  revision_history: unknown[];
  created_at: string;
}

// Weekly Report types
export interface WeeklyReportRequest {
  tasks_completed: string;
  next_week_plan?: string;
  boss_preferences?: string;
  reference_document_ids: string[];
}

export interface WeeklyReportResult {
  id: string;
  session_id: string;
  week_start: string;
  week_end: string;
  content: string;
  created_at: string;
}

// Proposal types
export interface ProposalRequest {
  idea: string;
  target_market?: string;
  budget_range?: string;
  special_requirements?: string;
}

export interface ProposalResult {
  id: string;
  session_id: string;
  title: string;
  content: string;
  research_data: Record<string, string>;
  created_at: string;
}

// Translation types
export interface TranslationRequest {
  translation_type: "srt" | "text" | "email";
  source_language: string;
  target_language: string;
  content: string;
  context?: string;
}

export interface TranslationResult {
  id: string;
  session_id: string;
  source_language: string;
  target_language: string;
  translation_type: string;
  original_content: string;
  translated_content: string;
  created_at: string;
}

// Economy types
export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string | null;
  category: string | null;
  summary: string | null;
  sentiment: "positive" | "negative" | "neutral" | null;
  published_at: string | null;
  created_at: string;
}

export interface UserStock {
  id: string;
  user_id: string;
  symbol: string;
  name: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string | null;
  description: string | null;
  expense_date: string;
  created_at: string;
}

export interface EconomySettings {
  email_enabled: boolean;
  email_time: string;
  news_categories: string[];
  watchlist_stocks: string[];
  google_sheet_url?: string;
}

// Travel types
export interface TravelPlanRequest {
  travel_type: "travel" | "date";
  start_date: string;
  end_date: string;
  departure: string;
  destination: string;
  interests: string[];
  budget_range?: string;
  companions?: string;
  special_requests?: string;
}

export interface TravelPlanResult {
  id: string;
  session_id: string;
  title: string;
  start_date: string;
  end_date: string;
  content: {
    places: Record<string, unknown[]>;
    timeline: unknown[];
    budget: Record<string, unknown>;
    checklist: string[];
  };
  created_at: string;
}
