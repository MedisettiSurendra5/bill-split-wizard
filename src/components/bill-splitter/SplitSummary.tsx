import { Calculator, Receipt, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Bill, PersonSummary } from '@/types/bill';
import { calculatePersonSummaries, calculateUnassignedAmount, formatCurrency } from '@/lib/billCalculations';
import { cn } from '@/lib/utils';

interface SplitSummaryProps {
  bill: Bill;
}

export function SplitSummary({ bill }: SplitSummaryProps) {
  const summaries = calculatePersonSummaries(bill);
  const unassignedAmount = calculateUnassignedAmount(bill);
  const hasUnassigned = unassignedAmount > 0;

  if (bill.people.length === 0 || bill.items.length === 0) {
    return (
      <Card className="p-6 shadow-card">
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Calculator className="w-8 h-8 mb-2" />
          <p className="text-center">Add items and people to see the split summary.</p>
        </div>
      </Card>
    );
  }

  const totalCalculated = summaries.reduce((sum, s) => sum + s.finalAmount, 0);

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold">Split Summary</h3>
        </div>

        {hasUnassigned && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Unassigned Amount</p>
              <p>{formatCurrency(unassignedAmount, bill.currency)} worth of items haven't been assigned to anyone.</p>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {summaries.map((summary) => (
            <div
              key={summary.person.id}
              className="p-4 rounded-xl border border-border bg-card hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: summary.person.color }}
                >
                  {summary.person.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{summary.person.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {summary.items.length} item{summary.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(summary.finalAmount, bill.currency)}
                  </p>
                </div>
              </div>

              {summary.items.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-border">
                  {summary.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name}
                        {item.splitPercentage < 100 && (
                          <span className="ml-1 text-xs opacity-70">
                            ({Math.round(item.splitPercentage)}%)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.amount, bill.currency)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(summary.itemsTotal, bill.currency)}</span>
                  </div>
                  
                  {summary.taxShare > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tax share</span>
                      <span className="font-medium">{formatCurrency(summary.taxShare, bill.currency)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total assigned</span>
            <span className="font-semibold">{formatCurrency(totalCalculated, bill.currency)}</span>
          </div>
          {bill.total && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground">Bill total</span>
              <span className="font-semibold">{formatCurrency(bill.total, bill.currency)}</span>
            </div>
          )}
          {bill.total && Math.abs(totalCalculated - bill.total) > 0.01 && (
            <div className={cn(
              "flex items-center justify-between mt-1 text-sm",
              totalCalculated < bill.total ? "text-warning" : "text-destructive"
            )}>
              <span>Difference</span>
              <span className="font-medium">
                {formatCurrency(Math.abs(totalCalculated - bill.total), bill.currency)}
                {totalCalculated < bill.total ? ' remaining' : ' over'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
