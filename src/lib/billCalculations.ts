import { Bill, BillItem, PersonSummary } from '@/types/bill';

export function calculatePersonSummaries(bill: Bill): PersonSummary[] {
  const summaries: PersonSummary[] = [];
  
  // Calculate totals for each person
  for (const person of bill.people) {
    let itemsTotal = 0;
    const items: PersonSummary['items'] = [];
    
    for (const item of bill.items) {
      const assignment = item.assignments.find(a => a.personId === person.id);
      if (assignment) {
        const amount = (item.price * assignment.splitPercentage) / 100;
        itemsTotal += amount;
        items.push({
          name: item.name,
          amount: roundToTwo(amount),
          splitPercentage: assignment.splitPercentage,
        });
      }
    }
    
    // Calculate tax share proportionally
    const totalAssignedAmount = calculateTotalAssigned(bill);
    const taxShare = totalAssignedAmount > 0 && bill.tax
      ? (itemsTotal / totalAssignedAmount) * bill.tax
      : 0;
    
    const finalAmount = itemsTotal + taxShare;
    
    summaries.push({
      person,
      itemsTotal: roundToTwo(itemsTotal),
      taxShare: roundToTwo(taxShare),
      finalAmount: roundToTwo(finalAmount),
      items,
    });
  }
  
  return summaries;
}

export function calculateTotalAssigned(bill: Bill): number {
  return bill.items.reduce((total, item) => {
    const assignedPercentage = item.assignments.reduce((sum, a) => sum + a.splitPercentage, 0);
    return total + (item.price * assignedPercentage) / 100;
  }, 0);
}

export function calculateUnassignedAmount(bill: Bill): number {
  return bill.items.reduce((total, item) => {
    const assignedPercentage = item.assignments.reduce((sum, a) => sum + a.splitPercentage, 0);
    const unassignedPercentage = Math.max(0, 100 - assignedPercentage);
    return total + (item.price * unassignedPercentage) / 100;
  }, 0);
}

export function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function getItemAssignmentStatus(item: BillItem): 'unassigned' | 'partial' | 'full' | 'over' {
  const totalPercentage = item.assignments.reduce((sum, a) => sum + a.splitPercentage, 0);
  if (totalPercentage === 0) return 'unassigned';
  if (totalPercentage < 100) return 'partial';
  if (totalPercentage === 100) return 'full';
  return 'over';
}
