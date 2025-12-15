import { useState, useEffect } from 'react';
import { ArrowLeft, Save, PlusCircle, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillUploader } from '@/components/bill-splitter/BillUploader';
import { BillEditor } from '@/components/bill-splitter/BillEditor';
import { PeopleManager } from '@/components/bill-splitter/PeopleManager';
import { ItemAssignment } from '@/components/bill-splitter/ItemAssignment';
import { SplitSummary } from '@/components/bill-splitter/SplitSummary';
import { BillHistory } from '@/components/bill-splitter/BillHistory';
import { useBillStorage } from '@/hooks/useBillStorage';
import { Bill, ScannedBillData, PERSON_COLORS } from '@/types/bill';
import { Link } from 'react-router-dom';
import { generateId } from '@/lib/utils';

function createEmptyBill(): Bill {
  return {
    id: 'new',
    merchantName: '',
    currency: 'USD',
    items: [],
    people: [],
    subtotal: null,
    tax: null,
    total: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default function BillSplitter() {
  const [currentBill, setCurrentBill] = useState<Bill>(createEmptyBill());
  const [view, setView] = useState<'upload' | 'edit'>('upload');
  const { bills, loading, saveBill, deleteBill, duplicateBill, refreshBills } = useBillStorage();

  const handleBillScanned = (data: ScannedBillData, imageUrl: string) => {
    const newBill: Bill = {
      id: 'new',
      merchantName: data.merchant_name || '',
      currency: data.currency || 'USD',
      items: (data.items || []).map((item, index) => ({
        id: `temp-${index}-${generateId()}`,
        name: item.name,
        price: item.price,
        assignments: [],
      })),
      people: [],
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCurrentBill(newBill);
    setView('edit');
  };

  const handleSelectBill = (bill: Bill) => {
    setCurrentBill(bill);
    setView('edit');
  };

  const handleSaveBill = async () => {
    const subtotal = currentBill.items.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal + (currentBill.tax || 0);
    
    const billToSave = {
      ...currentBill,
      subtotal,
      total,
    };
    
    const savedId = await saveBill(billToSave);
    if (savedId) {
      await refreshBills();
    }
  };

  const handleNewBill = () => {
    setCurrentBill(createEmptyBill());
    setView('upload');
  };

  const handleDeleteBill = async (billId: string) => {
    await deleteBill(billId);
    if (currentBill.id === billId) {
      setCurrentBill(createEmptyBill());
      setView('upload');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg gradient-primary">
                  <Receipt className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground">Bill Splitter</h1>
                  <p className="text-sm text-muted-foreground">Scan & split bills with friends</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {view === 'edit' && (
                <>
                  <Button variant="outline" onClick={handleNewBill} className="gap-2">
                    <PlusCircle className="w-4 h-4" />
                    New Bill
                  </Button>
                  <Button onClick={handleSaveBill} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {view === 'upload' ? (
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="space-y-6 animate-slide-up">
              <BillUploader onBillScanned={handleBillScanned} />
              
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Or start from scratch</p>
                <Button
                  variant="outline"
                  onClick={() => setView('edit')}
                  className="gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Manual Bill
                </Button>
              </div>
            </div>
            
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <BillHistory
                bills={bills}
                loading={loading}
                onSelectBill={handleSelectBill}
                onDuplicateBill={duplicateBill}
                onDeleteBill={handleDeleteBill}
              />
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Left Column - Bill Details */}
            <div className="space-y-6 animate-slide-up">
              <BillEditor bill={currentBill} onBillChange={setCurrentBill} />
              <PeopleManager bill={currentBill} onBillChange={setCurrentBill} />
            </div>

            {/* Middle Column - Assignments */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <ItemAssignment bill={currentBill} onBillChange={setCurrentBill} />
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <SplitSummary bill={currentBill} />
              
              <BillHistory
                bills={bills}
                loading={loading}
                onSelectBill={handleSelectBill}
                onDuplicateBill={duplicateBill}
                onDeleteBill={handleDeleteBill}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
