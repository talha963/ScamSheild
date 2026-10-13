// Core domain types for ScamShield Live

export type RiskTier = 0 | 1 | 2 | 3; // 0=Safe (Green), 1=Caution (Amber), 2=Warning (Orange), 3=Block (Red)

export type ScamPlaybook =
  | 'fake_bank_officer'
  | 'wallet_reversal'
  | 'prize_offer'
  | 'relative_in_trouble'
  | 'courier_customs_police'
  | 'sim_block'
  | 'investment'
  | 'none'
  | 'uncertain';

export type RequestedAction =
  | 'share_otp'
  | 'share_pin'
  | 'send_money'
  | 'install_app'
  | 'click_link'
  | 'none'
  | 'uncertain';

export interface TacticSignal {
  score: number; // 0.0 to 1.0
  evidence: string;
}

export interface TacticScores {
  authority_impersonation?: TacticSignal;
  urgency_pressure?: TacticSignal;
  secrecy_isolation?: TacticSignal;
  credential_request?: TacticSignal;
  remote_access_request?: TacticSignal;
  payment_redirection?: TacticSignal;
  emotional_manipulation?: TacticSignal;
  too_good_offer?: TacticSignal;
}

export interface CallContext {
  unknown_caller: boolean;
  banking_app_open: boolean;
  new_payee: boolean;
  amount_vs_history: number; // multiplier e.g. 6.2x average
  device_or_sim_changed?: boolean;
}

export interface AcousticSignals {
  synthetic_voice: number; // 0.0 to 1.0 (Voice-Clone likelihood)
  call_center_noise: number; // 0.0 to 1.0
  pressure_tempo: number; // speech speed / interruption index
}

export interface RiskEvent {
  call_id: string;
  t_offset_s: number;
  tactics: TacticScores;
  scam_type: ScamPlaybook;
  caller_claims_org: string | null;
  requested_action: RequestedAction;
  next_likely_ask: string;
  confidence: number;
  user_warning: string;
  user_warning_ur: string; // Urdu script warning
  context: CallContext;
  acoustic: AcousticSignals;
  fused_score: number; // 0 - 100
  tier: RiskTier;
  reasons: string[];
  actions: string[];
  safe_word_challenge?: {
    required: boolean;
    suggested_prompt: string;
    family_safe_word?: string;
  };
}

export interface TranscriptSnippet {
  speaker: 'caller' | 'user';
  text: string;
  timestamp_s: number;
  language: 'Urdu' | 'Roman Urdu' | 'Punjabi' | 'English' | 'Code-Switch';
  is_flagged?: boolean;
}

export interface BankAccount {
  account_id: string;
  account_number: string;
  holder_name: string;
  balance: number;
  currency: string;
}

export interface BankPayee {
  payee_id: string;
  name: string;
  account_number: string;
  bank_name: string;
  is_new: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'mule_suspect';
}

export interface BankTransaction {
  id: string;
  amount: number;
  payee_name: string;
  payee_account: string;
  timestamp: string;
  status: 'completed' | 'cool_off' | 'held' | 'blocked' | 'step_up_pending';
  circuit_breaker_tier: RiskTier;
  hold_reason?: string;
}

export interface GuardianContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  whatsapp_enabled: boolean;
  is_primary: boolean;
  avatar_color: string;
}

export interface ScamLensResult {
  id: string;
  image_url: string;
  type: 'sms' | 'receipt' | 'qr_code' | 'bank_screen';
  verdict: 'safe' | 'suspicious' | 'scam';
  confidence: number;
  detected_text: string;
  extracted_links: string[];
  reasons: string[];
  tampering_detected: boolean;
  qr_destination?: string;
  spoofed_brand?: string;
}

export interface CampaignCluster {
  campaign_id: string;
  name: string;
  scam_type: ScamPlaybook;
  call_count_7d: number;
  region: string;
  risk_score: number;
  active_mules_detected: number;
  common_phrases: string[];
  trend: 'rising' | 'stable' | 'contained';
}

export interface GymScenario {
  id: string;
  title: string;
  difficulty: 'Novice' | 'Cunning' | 'Aggressive';
  scenario_description: string;
  caller_role: string;
  target_ask: string;
  opening_message: string;
}
