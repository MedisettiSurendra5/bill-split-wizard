import { useState } from 'react';
import { Check, Split, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Bill, BillItem, ItemAssignment as IItemAssignment } from '@/types/bill';
import { formatCurrency, getItemAssignmentStatus } from '@/lib/billCalculations';
import { cn } from '@/lib/utils';

interface ItemAssignmentProps {
  bill: Bill;
  onBillChange: (bill: Bill) => void;
}

export function ItemAssignment({ bill, onBillChange }: ItemAssignmentProps) {
  const [splitMode, setSplitMode] = useState<string | null>(null);

  const toggleAssignment = (itemId: string, personId: string) => {
    const item = bill.items.find(i => i.id === itemId);
    if (!item) return;

    const existingAssignment = item.assignments.find(a => a.personId === personId);
    let newAssignments: IItemAssignment[];

    if (existingAssignment) {
      // Remove assignment
      newAssignments = item.assignments.filter(a => a.personId !== personId);
    } else {
      // Add assignment with default percentage
      const assignedCount = item.assignments.length + 1;
      const splitPercentage = 100 / assignedCount;
      
      // Redistribute percentages
      newAssignments = [
        ...item.assignments.map(a => ({ ...a, splitPercentage })),
        { personId, splitPercentage },
      ];
    }

    updateItemAssignments(itemId, newAssignments);
  };

  const updateSplitPercentage = (itemId: string, personId: string, percentage: number) => {
    const item = bill.items.find(i => i.id === itemId);
    if (!item) return;

    const newAssignments = item.assignments.map(a =>
      a.personId === personId ? { ...a, splitPercentage: Math.min(100, Math.max(0, percentage)) } : a
    );

    updateItemAssignments(itemId, newAssignments);
  };

  const updateItemAssignments = (itemId: string, assignments: IItemAssignment[]) => {
    onBillChange({
      ...bill,
      items: bill.items.map(item =>
        item.id === itemId ? { ...item, assignments } : item
      ),
    });
  };

  const splitEvenly = (itemId: string) => {
    const item = bill.items.find(i => i.id === itemId);
    if (!item || item.assignments.length === 0) return;

    const evenPercentage = 100 / item.assignments.length;
    const newAssignments = item.assignments.map(a => ({
      ...a,
      splitPercentage: Math.round(evenPercentage * 100) / 100,
    }));

    updateItemAssignments(itemId, newAssignments);
    setSplitMode(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full': return 'text-primary bg-primary/10 border-primary/30';
      case 'partial': return 'text-warning bg-warning/10 border-warning/30';
      case 'over': return 'text-destructive bg-destructive/10 border-destructive/30';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  if (bill.people.length === 0) {
    return (
      <Card className="p-6 shadow-card">
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="text-center">Add people first to assign items.</p>
        </div>
      </Card>
    );
  }

  if (bill.items.length === 0) {
    return (
      <Card className="p-6 shadow-card">
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="text-center">Add items first to start assigning.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Split className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold">Assign Items</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Click on a person to assign them to an item. Click the split icon to adjust percentages.
        </p>

        <div className="space-y-3">
          {bill.items.map((item, index) => {
            const status = getItemAssignmentStatus(item);
            const totalPercentage = item.assignments.reduce((sum, a) => sum + a.splitPercentage, 0);
            
            return (
              <div
                key={item.id}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  getStatusColor(status)
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-background text-foreground text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm font-semibold">{formatCurrency(item.price, bill.currency)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {status === 'full' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Check className="w-3 h-3" /> Assigned
                      </span>
                    )}
                    {item.assignments.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSplitMode(splitMode === item.id ? null : item.id)}
                        className="gap-1"
                      >
                        <Split className="w-3 h-3" />
                        {splitMode === item.id ? 'Done' : 'Split'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {bill.people.map((person) => {
                    const assignment = item.assignments.find(a => a.personId === person.id);
                    const isAssigned = !!assignment;

                    return (
                      <div key={person.id} className="flex items-center gap-1">
                        <button
                          onClick={() => toggleAssignment(item.id, person.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2",
                            isAssigned
                              ? "ring-2 ring-offset-1"
                              : "opacity-50 hover:opacity-100"
                          )}
                          style={{
                            backgroundColor: isAssigned ? person.color : 'transparent',
                            color: isAssigned ? 'white' : person.color,
                            borderColor: person.color,
                            // @ts-ignore - CSS custom property for ring color
                            '--tw-ring-color': person.color,
                          } as React.CSSProperties}
                        >
                          {isAssigned && <Check className="w-3 h-3" />}
                          {person.name}
                          {isAssigned && assignment && (
                            <span className="text-xs opacity-80">
                              {Math.round(assignment.splitPercentage)}%
                            </span>
                          )}
                        </button>

                        {splitMode === item.id && isAssigned && (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={assignment?.splitPercentage || 0}
                            onChange={(e) => updateSplitPercentage(item.id, person.id, parseFloat(e.target.value) || 0)}
                            className="w-16 h-7 text-xs text-center"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {splitMode === item.id && item.assignments.length > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className={cn(
                      "text-xs",
                      totalPercentage === 100 ? "text-primary" : "text-warning"
                    )}>
                      Total: {Math.round(totalPercentage)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => splitEvenly(item.id)}
                      className="text-xs h-7"
                    >
                      Split Evenly
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
