export interface Patient {
  initials: string;
  name: string;
  demographics: string;
  id: string;
  pid?: string;
  branch: string;
  contact: string;
  lastVisit: string;
  status: 'ACTIVE' | 'CRITICAL' | 'PENDING' | 'DISCHARGED';
  statusColor: string;
  consultedBy: string;
  diseases: string[];
  conditions: string[];
  assignments: string[];
  assignedDoctor: string;
  initialsBg: string;
  notes?: string;
  assessment?: string;
  address?: string;
  source?: string;
  occupation?: string;
  assessmentData?: any;
  assessmentType?: 'GENERAL' | 'PELVIC_FLOOR';
  whatsappConsent?: boolean;
  campaignSentOn?: string;
  createdAt?: string;
}
