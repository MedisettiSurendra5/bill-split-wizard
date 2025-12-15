import { useState } from 'react';
import { Plus, Trash2, Receipt, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bill, BillItem } from '@/types/bill';
import { formatCurrency } from '@/lib/billCalculations';
import { generateId } from '@/lib/utils';

interface BillEditorProps {
  bill: Bill;
  onBillChange: (bill: Bill) => void;
}

export function BillEditor({ bill, onBillChange }: BillEditorProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const updateBill = (updates: Partial<Bill>) => {
    onBillChange({ ...bill, ...updates });
  };

  const addItem = () => {
    const newItem: BillItem = {
      id: `temp-${generateId()}`,
      name: 'New Item',
      price: 0,
      assignments: [],
    };
    updateBill({ items: [...bill.items, newItem] });
    setEditingItemId(newItem.id);
  };

  const updateItem = (itemId: string, updates: Partial<BillItem>) => {
    updateBill({
      items: bill.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const removeItem = (itemId: string) => {
    updateBill({
      items: bill.items.filter(item => item.id !== itemId),
    });
  };

  const calculatedSubtotal = bill.items.reduce((sum, item) => sum + item.price, 0);
  const calculatedTotal = calculatedSubtotal + (bill.tax || 0);

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold">Bill Details</h3>
        </div>

        {/* Merchant & Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input
              id="merchant"
              value={bill.merchantName}
              onChange={(e) => updateBill({ merchantName: e.target.value })}
              placeholder="Store/Restaurant name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={bill.currency}
              onChange={(e) => updateBill({ currency: e.target.value.toUpperCase() })}
              placeholder="USD"
              maxLength={3}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Items</Label>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {bill.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items yet. Add items manually or scan a bill.</p>
              </div>
            ) : (
              bill.items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {index + 1}
                  </span>
                  
                  {editingItemId === item.id ? (
                    <>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        className="flex-1"
                        autoFocus
                        onBlur={() => setEditingItemId(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingItemId(null)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        className="w-28"
                        onBlur={() => setEditingItemId(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingItemId(null)}
                      />
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium">{item.name}</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(item.price, bill.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditingItemId(item.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(calculatedSubtotal, bill.currency)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="tax" className="text-muted-foreground">Tax</Label>
            <Input
              id="tax"
              type="number"
              step="0.01"
              value={bill.tax ?? ''}
              onChange={(e) => updateBill({ tax: parseFloat(e.target.value) || 0 })}
              className="w-32 text-right"
              placeholder="0.00"
            />
          </div>
          
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(calculatedTotal, bill.currency)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
