const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://127.0.0.1:8000');

export interface PurityGrade {
  karat: string;
  fineness: string;
  percentage: string;
  description: string;
  common_use: string;
}

export interface HallmarkingInfo {
  metal: string;
  standard_number: string;
  mandatory_marks_count: number;
  mandatory_marks_description: string[];
  huid_format: string;
  huid_verification_steps: string[];
  recognized_purity_grades: PurityGrade[];
  mandatory_status: string;
  mandatory_districts_count: number;
  exemptions: string[];
  jeweller_registration: string;
  assaying_centres_standard: string;
  consumer_remedy: string;
}

export interface ComplianceInfo {
  is_mandatory: boolean;
  status: string;
  scheme: string;
  qco_name?: string;
  ministry?: string;
  enforcement_date?: string;
  legal_basis?: string;
  penalties_applicable?: boolean;
  exemptions?: string[];
  standard_number?: string;
  product_name?: string;
}

export interface CustomsInfo {
  hsn_code: string;
  commodity_title: string;
  standard_number?: string;
  product_name: string;
  import_policy: string;
  icegate_mandatory_check: boolean;
  required_documents: string[];
  port_clearance_advisory: string;
  statutory_exemptions: string[];
}

export interface RenewalInfo {
  standard_number: string;
  product_name: string;
  scheme: string;
  initial_validity_years: number;
  renewal_duration_options: string[];
  renewal_window: string;
  statutory_form: string;
  minimum_marking_fee_inr: string;
  production_return_requirement: string;
  grace_period: string;
  late_fee_penalty: string;
  stop_marking_notice?: string;
  renewal_checklist: string[];
}

export interface TestParameter {
  parameter_name: string;
  test_method?: string;
  specification_limit: string;
  criticality?: string;
}

export interface LabFacility {
  lab_name: string;
  location: string;
  lab_type: string;
  accreditation?: string;
  contact_info?: string;
}

export interface TestingInfo {
  standard_number: string;
  product_name: string;
  sample_requirements?: string;
  estimated_turnaround?: string;
  critical_parameters: TestParameter[];
  recognized_laboratories: LabFacility[];
}

export interface RoutineTestRequirement {
  parameter_name: string;
  clause?: string;
  frequency: string;
  testing_stage: string;
  tests_required_for_volume?: number;
}

export interface BatchInfo {
  standard_number: string;
  product_name: string;
  control_unit_definition: string;
  nominal_batch_size: number;
  input_production_volume?: number;
  calculated_batches_count?: number;
  routine_tests: RoutineTestRequirement[];
  acceptance_criteria: string;
  qa_record_keeping: string[];
}

export interface IdentifiedStandard {
  standard_number: string;
  title?: string;
  pages?: number[];
  confidence: number;
  evidence_supported?: boolean;
}

export interface Citation {
  standard_number: string;
  title?: string;
  page?: number | null;
  clause?: string | null;
  source: string;
  content?: string | null;
}

export interface ActionItem {
  label: string;
  query: string;
  type?: string;
}

export interface SectionDescriptor {
  type: string;
  title: string;
}

export interface ChatResponse {
  success?: boolean;
  answer: string;
  language?: string;
  conversation_id?: string | null;
  identified_standards?: IdentifiedStandard[];
  citations?: Citation[];
  next_steps?: string[];
  compliance_info?: ComplianceInfo | null;
  testing_info?: TestingInfo | null;
  customs_info?: CustomsInfo | null;
  renewal_info?: RenewalInfo | null;
  batch_info?: BatchInfo | null;
  hallmarking_info?: HallmarkingInfo | null;
  verified?: boolean;
  grounded?: boolean;
  timings?: {
    total_ms?: number;
    [key: string]: number | undefined;
  };
  audio_base64?: string | null;
  audio_format?: string | null;
  detected_language?: string | null;
  response_mode?: string;
  product?: string | null;
  standards?: any[];
  sections?: SectionDescriptor[];
  next_question?: string | null;
  actions?: ActionItem[];
}

export interface VoiceTranscribeResponse {
  transcript: string;
  language_code: string;
  language_probability?: number;
  success: boolean;
}

/**
 * Sends a chat message to the FastAPI backend.
 */
export async function sendMessage(
  message: string,
  language: string = 'en-IN',
  enableVoice: boolean = false,
  voiceSpeaker: string = 'priya',
  conversationId: string | null = null,
  signal?: AbortSignal,
  imageData?: string | null
): Promise<ChatResponse> {
  let response: Response;

  // Set a 45-second timeout safety guard
  const internalController = new AbortController();
  const timeoutId = setTimeout(() => {
    internalController.abort(new Error('Request timed out after 45 seconds. The server took too long to respond.'));
  }, 45000);

  // Combine external cancellation signal with timeout
  const combinedSignal = signal
    ? (typeof AbortSignal.any === 'function' ? AbortSignal.any([signal, internalController.signal]) : signal)
    : internalController.signal;

  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: combinedSignal,
      body: JSON.stringify({
        message,
        language,
        conversation_id: conversationId,
        enable_voice: enableVoice,
        voice_speaker: voiceSpeaker,
        image_data: imageData || null,
      }),
    });
  } catch (err: unknown) {
    if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
      throw new Error('Query generation cancelled.');
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Network error: Could not connect to BIS Assistant backend at ${API_BASE_URL || 'http://127.0.0.1:8000'}. Please ensure the backend server is running. (${errorMsg})`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let detailMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        detailMsg = errorJson.error.message;
      } else if (errorJson?.detail) {
        detailMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Body not JSON, keep default HTTP message
    }
    throw new Error(detailMsg);
  }

  const data: ChatResponse = await response.json();
  return data;
}

/**
 * Transcribes recorded speech using Sarvam AI Saaras v3 STT.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  languageCode?: string
): Promise<VoiceTranscribeResponse> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  if (languageCode && languageCode !== 'auto') {
    formData.append('language_code', languageCode);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      body: formData,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Voice transcription failed to connect: ${errorMsg}`);
  }

  if (!response.ok) {
    let detailMsg = `Transcription Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) detailMsg = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(detailMsg);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// DIRECTORY API METHODS
// ---------------------------------------------------------------------------

export interface DirectoryStandard {
  standard_number: string;
  title: string;
  product?: string;
  category?: string;
  document_type?: string;
  version?: string;
  division?: string;
  certification_scheme?: string;
  mandatory?: boolean;
  qco_order?: string;
  source?: string;
}

export interface DirectoryStandardsResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  standards: DirectoryStandard[];
  error?: string;
}

export interface DirectoryQcoOrder {
  qco_id: string;
  qco_name: string;
  ministry: string;
  standards: string[];
  products: string[];
  scheme: string;
  is_mandatory: boolean;
  enforcement_date?: string;
  legal_basis?: string;
  exemptions?: string[];
}

export interface DirectoryQcoResponse {
  success: boolean;
  count: number;
  qco_orders: DirectoryQcoOrder[];
  error?: string;
}

export interface DirectoryLaboratory {
  lab_name: string;
  location: string;
  lab_type: string;
  accreditation: string;
  contact_info: string;
  capabilities: string[];
}

export interface DirectoryLabsResponse {
  success: boolean;
  count: number;
  laboratories: DirectoryLaboratory[];
  error?: string;
}

export interface DirectoryTestingParameter {
  parameter_name: string;
  test_method?: string;
  specification_limit: string;
  criticality?: string;
}

export interface DirectoryTestingRegime {
  standard_number: string;
  product_name: string;
  sample_requirements: string;
  turnaround_time: string;
  parameters_count: number;
  parameters: DirectoryTestingParameter[];
}

export interface DirectoryTestingResponse {
  success: boolean;
  count: number;
  regimes: DirectoryTestingRegime[];
  error?: string;
}

export async function fetchDirectoryStandards(
  query: string = '',
  division: string = '',
  mandatoryOnly: boolean = false,
  limit: number = 30,
  offset: number = 0
): Promise<DirectoryStandardsResponse> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (division && division !== 'all') params.append('division', division);
  if (mandatoryOnly) params.append('mandatory_only', 'true');
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  try {
    const res = await fetch(`${API_BASE_URL}/api/directory/standards?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch directory standards:', err);
    return { success: false, total: 0, limit, offset, standards: [], error: String(err) };
  }
}

export async function fetchDirectoryQco(
  query: string = '',
  ministry: string = ''
): Promise<DirectoryQcoResponse> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (ministry && ministry !== 'all') params.append('ministry', ministry);

  try {
    const res = await fetch(`${API_BASE_URL}/api/directory/qco?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch directory QCO:', err);
    return { success: false, count: 0, qco_orders: [], error: String(err) };
  }
}

export async function fetchDirectoryLaboratories(
  query: string = '',
  product: string = ''
): Promise<DirectoryLabsResponse> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (product) params.append('product', product);

  try {
    const res = await fetch(`${API_BASE_URL}/api/directory/laboratories?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch directory laboratories:', err);
    return { success: false, count: 0, laboratories: [], error: String(err) };
  }
}

export async function fetchDirectoryTesting(
  query: string = ''
): Promise<DirectoryTestingResponse> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);

  try {
    const res = await fetch(`${API_BASE_URL}/api/directory/testing?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch directory testing:', err);
    return { success: false, count: 0, regimes: [], error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// FACTORY AUDIT SIMULATOR API METHODS
// ---------------------------------------------------------------------------

export interface AuditItem {
  id: string;
  pillar: string;
  title: string;
  description: string;
  clause_ref: string;
  criticality: 'Critical' | 'Major' | 'Minor';
  capa_recommendation: string;
}

export interface AuditPillar {
  id: string;
  name: string;
  weight: number;
  description: string;
  score_percent?: number;
}

export interface AuditChecklistResponse {
  success: boolean;
  standard_key: string;
  standard_number: string;
  product_name: string;
  scheme: string;
  pillars: AuditPillar[];
  total_items: number;
  items: AuditItem[];
  error?: string;
}

export interface CapaItem {
  item_id: string;
  title: string;
  pillar: string;
  status: string;
  clause_ref: string;
  criticality: string;
  deficiency: string;
  recommendation: string;
  timeline_days: number;
}

export interface AuditEvaluationResponse {
  success: boolean;
  standard_number: string;
  product_name: string;
  factory_name: string;
  factory_location: string;
  overall_score: number;
  rating: string;
  rating_color: string;
  rating_description: string;
  critical_deficiencies_count: number;
  total_deficiencies_count: number;
  pillars_breakdown: AuditPillar[];
  corrective_action_plan: CapaItem[];
  error?: string;
}

export async function fetchAuditChecklist(
  standard: string = 'IS 2347'
): Promise<AuditChecklistResponse> {
  const params = new URLSearchParams({ standard });
  try {
    const res = await fetch(`${API_BASE_URL}/api/audit/checklist?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch audit checklist:', err);
    return {
      success: false,
      standard_key: 'UNIVERSAL',
      standard_number: 'Scheme I (General)',
      product_name: 'Industrial Product',
      scheme: 'Scheme I',
      pillars: [],
      total_items: 0,
      items: [],
      error: String(err),
    };
  }
}

export async function evaluateAuditResponses(payload: {
  standard: string;
  responses: Record<string, string>;
  factory_name?: string;
  factory_location?: string;
}): Promise<AuditEvaluationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/audit/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to evaluate audit:', err);
    return {
      success: false,
      standard_number: payload.standard,
      product_name: 'Product',
      factory_name: payload.factory_name || 'Plant',
      factory_location: payload.factory_location || 'India',
      overall_score: 0,
      rating: 'EVALUATION ERROR',
      rating_color: '#dc2626',
      rating_description: String(err),
      critical_deficiencies_count: 0,
      total_deficiencies_count: 0,
      pillars_breakdown: [],
      corrective_action_plan: [],
      error: String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// APPLICATION DOSSIER (MANAKONLINE FORM-V) API METHODS
// ---------------------------------------------------------------------------

export interface DossierRawMaterial {
  material_name: string;
  specification: string;
  mandatory_test: string;
  test_certificate_required: boolean;
}

export interface DossierMachinery {
  operation: string;
  machinery_name: string;
  installed_capacity: string;
  power_hp: string;
}

export interface DossierTestEquipment {
  parameter: string;
  equipment_name: string;
  range_capacity: string;
  calibration_frequency: string;
  least_count?: string;
}

export interface DossierEnclosure {
  id: string;
  code: string;
  title: string;
  description: string;
  mandatory: boolean;
  attached?: boolean;
}

export interface DossierFactoryProfile {
  applicant_name: string;
  factory_address: string;
  registered_office: string;
  gstin: string;
  msme_udyam: string;
  connected_load: string;
  authorized_signatory: string;
  contact_email: string;
  contact_phone: string;
  brand_names: string;
  varieties_covered: string;
  qc_incharge_name: string;
  qc_incharge_qualification: string;
}

export interface DossierTemplateResponse {
  success: boolean;
  form_type: string;
  regulation: string;
  standard_key: string;
  standard_number: string;
  product_name: string;
  division_council: string;
  certification_scheme: string;
  applicable_qco: string;
  technical_personnel_min_criteria: string;
  raw_materials: DossierRawMaterial[];
  mandatory_machinery: DossierMachinery[];
  inhouse_testing_equipment: DossierTestEquipment[];
  statutory_enclosures: DossierEnclosure[];
  default_factory_profile: DossierFactoryProfile;
  error?: string;
}

export interface DossierMissingItem {
  section: string;
  item: string;
  severity: string;
  remedy: string;
}

export interface DossierValidationResponse {
  success: boolean;
  dossier_reference: string;
  completeness_score: number;
  readiness_status: string;
  status_color: string;
  status_description: string;
  total_checks: number;
  passed_checks: number;
  missing_items: DossierMissingItem[];
  critical_gaps_count: number;
  verified_at: string;
  error?: string;
}

export async function fetchDossierTemplate(
  standard: string = 'IS 2347',
  formType: string = 'Form-V'
): Promise<DossierTemplateResponse> {
  try {
    const params = new URLSearchParams({
      standard,
      form_type: formType,
    });
    const res = await fetch(`${API_BASE_URL}/api/dossier/template?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch dossier template:', err);
    return {
      success: false,
      form_type: formType,
      regulation: 'Regulation 4, BIS Regulations 2018',
      standard_key: 'UNIVERSAL',
      standard_number: standard,
      product_name: 'Industrial Product',
      division_council: 'BIS Quality Council',
      certification_scheme: 'Scheme-I',
      applicable_qco: 'General',
      technical_personnel_min_criteria: 'Graduate in Engineering',
      raw_materials: [],
      mandatory_machinery: [],
      inhouse_testing_equipment: [],
      statutory_enclosures: [],
      default_factory_profile: {
        applicant_name: '',
        factory_address: '',
        registered_office: '',
        gstin: '',
        msme_udyam: '',
        connected_load: '',
        authorized_signatory: '',
        contact_email: '',
        contact_phone: '',
        brand_names: '',
        varieties_covered: '',
        qc_incharge_name: '',
        qc_incharge_qualification: '',
      },
      error: String(err),
    };
  }
}

export async function validateDossierApplication(payload: {
  standard: string;
  factory_profile: Partial<DossierFactoryProfile>;
  machinery: DossierMachinery[];
  testing_equipment: DossierTestEquipment[];
  enclosures: Record<string, boolean>;
}): Promise<DossierValidationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dossier/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to validate dossier application:', err);
    return {
      success: false,
      dossier_reference: `BIS-DOS-ERR-${Date.now()}`,
      completeness_score: 0,
      readiness_status: 'VALIDATION ERROR',
      status_color: '#dc2626',
      status_description: String(err),
      total_checks: 0,
      passed_checks: 0,
      missing_items: [],
      critical_gaps_count: 0,
      verified_at: new Date().toISOString(),
      error: String(err),
    };
  }
}

// ─── SUPABASE AUTHENTICATION API ──────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  org_name?: string;
  role?: string;
  phone?: string;
  user_metadata?: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: AuthUser;
  error?: string;
  message?: string;
  requires_verification?: boolean;
  action_link?: string;
  email_sent?: boolean;
  email?: string;
}

function extractApiError(data: any, fallback: string): string {
  if (!data) return fallback;
  if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string') {
    return data.error.message;
  }
  if (typeof data.error === 'string') return data.error;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  return fallback;
}

export async function authSignUp(payload: {
  email: string;
  password: string;
  full_name?: string;
  org_name?: string;
  role?: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: extractApiError(data, 'Registration failed'),
        requires_verification: data.requires_verification,
      };
    }
    return data;
  } catch (err: any) {
    console.error('Supabase Sign Up error:', err);
    return { success: false, error: err.message || 'Unable to connect to authentication server' };
  }
}

export async function authSignIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const isUnconfirmed = res.status === 403 || (data.detail && data.detail.toLowerCase().includes('verified'));
      return {
        success: false,
        error: extractApiError(data, 'Invalid email or password'),
        requires_verification: isUnconfirmed || data.requires_verification,
        action_link: data.action_link,
        email,
      };
    }
    return data;
  } catch (err: any) {
    console.error('Supabase Sign In error:', err);
    return { success: false, error: err.message || 'Unable to connect to authentication server' };
  }
}

export async function authInstantActivate(email: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/instant-activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: extractApiError(data, 'Activation failed') };
    }
    return data;
  } catch (err: any) {
    console.error('Instant activation error:', err);
    return { success: false, error: err.message || 'Unable to connect to authentication server' };
  }
}

export async function authResendVerification(email: string): Promise<{
  success: boolean;
  message?: string;
  action_link?: string;
  email_sent?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: extractApiError(data, 'Failed to resend verification link') };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to connect to authentication server' };
  }
}

export async function authGetCurrentUser(token: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: extractApiError(data, 'Session expired') };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Session verification failed' };
  }
}

export async function getGoogleAuthUrl(redirectTo?: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const target = redirectTo || `${window.location.origin}/?view=app`;
    const res = await fetch(`${API_BASE_URL}/api/auth/google/url?redirect_to=${encodeURIComponent(target)}`);
    const data = await res.json();
    if (!res.ok || !data.url) {
      return { success: false, error: extractApiError(data, 'Failed to get Google sign in URL') };
    }
    return data;
  } catch (err: any) {
    const supabaseUrl = 'https://zkrdxwvgyarlqggwbegr.supabase.co';
    const target = redirectTo || `${window.location.origin}/?view=app`;
    return {
      success: true,
      url: `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(target)}`,
    };
  }
}

export async function authGoogleSignIn(payload: {
  email: string;
  full_name?: string;
  role?: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: extractApiError(data, 'Google sign in failed') };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Google sign in connection error' };
  }
}

export async function authSignOut(token?: string): Promise<void> {
  try {
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (err) {
    console.debug('Sign out notice:', err);
  }
}

export interface PhoneOtpSendResponse {
  success: boolean;
  message?: string;
  phone?: string;
  formatted_phone?: string;
  otp?: string;
  expires_in?: number;
  error?: string;
}

export async function authSendPhoneOtp(phone: string): Promise<PhoneOtpSendResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/phone/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: extractApiError(data, 'Failed to send OTP') };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to connect to OTP service' };
  }
}

export async function authVerifyPhoneOtp(payload: {
  phone: string;
  otp: string;
  full_name?: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/phone/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: extractApiError(data, 'OTP verification failed') };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to verify OTP' };
  }
}

export async function authSendEmailOtp(email: string): Promise<PhoneOtpSendResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/email/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: extractApiError(data, 'Failed to send Email OTP') };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to connect to OTP service' };
  }
}

export async function authVerifyEmailOtp(payload: {
  email: string;
  otp: string;
  full_name?: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/email/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: extractApiError(data, 'Email OTP verification failed') };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to verify Email OTP' };
  }
}


