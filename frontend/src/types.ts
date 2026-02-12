export interface FeedbackResponse {
  summary: string;
  empathic_feedback: string;
  tags: string[];
  risk_score: number;
  next_actions: string[];
  safety_note: string | null;
}

export interface JournalEntry {
  timestamp: string;
  journal_text: string;
  feedback: FeedbackResponse;
}
