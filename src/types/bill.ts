export interface BillItem {
  id: string;
  name: string;
  price: number;
  assignments: ItemAssignment[];
}

export interface ItemAssignment {
  personId: string;
  splitPercentage: number;
}

export interface BillPerson {
  id: string;
  name: string;
  color: string;
}

export interface Bill {
  id: string;
  merchantName: string;
  currency: string;
  items: BillItem[];
  people: BillPerson[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonSummary {
  person: BillPerson;
  itemsTotal: number;
  taxShare: number;
  finalAmount: number;
  items: {
    name: string;
    amount: number;
    splitPercentage: number;
  }[];
}

export interface ScannedBillData {
  merchant_name: string;
  currency: string;
  items: {
    name: string;
    price: number;
  }[];
  subtotal: number | null;
  tax: number | null;
  total: number;
}

export const PERSON_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
];
