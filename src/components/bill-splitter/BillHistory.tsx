import { format } from 'date-fns';
import { Receipt, Copy, Trash2, ChevronRight, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bill } from '@/types/bill';
import { formatCurrency } from '@/lib/billCalculations';
import { cn } from '@/lib/utils';

interface BillHistoryProps {
  bills: Bill[];
  loading: boolean;
  onSelectBill: (bill: Bill) => void;
  onDuplicateBill: (billId: string) => void;
  onDeleteBill: (billId: string) => void;
}

export function BillHistory({
  bills,
  loading,
  onSelectBill,
  onDuplicateBill,
  onDeleteBill,
}: BillHistoryProps) {
  if (loading) {
    return (
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold">Past Bills</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-display text-lg font-semibold">Past Bills</h3>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No saved bills yet.</p>
          <p className="text-sm">Your saved bills will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="group p-4 rounded-xl border border-border bg-card hover:shadow-card hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => onSelectBill(bill)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">
                    {bill.merchantName || 'Unnamed Bill'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {format(bill.createdAt, 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {bill.items.length} items
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {bill.people.length} people
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-primary">
                    {bill.total ? formatCurrency(bill.total, bill.currency) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateBill(bill.id);
                  }}
                  className="gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBill(bill.id);
                  }}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
