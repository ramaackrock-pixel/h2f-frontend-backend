export type InvoiceStatus = 'PAID' | 'OVERDUE' | 'PENDING' | 'PARTIALLY PAID';

export interface PaymentBreakdown {
  mode: string;
  amount: number;
  date?: string;
}

export interface Invoice {
  id: string;
  patientName: string;
  pid?: string;
  patientId?: string;
  initials: string;
  initialsBg: string; // Tailwind class, e.g., 'bg-teal-100 text-teal-700'
  date: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  discount?: number;
  status: InvoiceStatus;
  branch?: string;
  paymentMode?: string;
  paymentBreakdown?: PaymentBreakdown[];
  brace?: string;
  braceAmount?: number;
  nutraceutical?: string;
  nutraceuticalAmount?: number;
  lab?: string;
  labAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  billingType?: string;
  service?: string | string[];
  subService?: string | string[];
  packageCategory?: string | string[];
  sessions?: string | string[];
}

export interface BillingStat {
  title: string;
  value: string;
  trend?: string;
  subtext?: string;
  iconName: 'Banknote' | 'ClipboardCheck' | 'AlertCircle';
  variant: 'primary' | 'secondary' | 'accent' | 'destructive';
}
