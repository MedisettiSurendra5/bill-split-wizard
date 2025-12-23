import { useState } from 'react';
import { ArrowLeft, Save, PlusCircle, Receipt, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface OpenBill {
  bill: Bill;
  view: 'upload' | 'edit';
}

function createEmptyBill(): Bill {
  return {
    id: `new-${generateId()}`,
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
  const [openBills, setOpenBills] = useState<OpenBill[]>([
    { bill: createEmptyBill(), view: 'upload' }
  ]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { bills, loading, saveBill, deleteBill, duplicateBill, refreshBills } = useBillStorage();

  const currentOpenBill = openBills[activeTabIndex];
  const currentBill = currentOpenBill?.bill;
  const currentView = currentOpenBill?.view || 'upload';

  const updateCurrentBill = (updatedBill: Bill) => {
    setOpenBills(prev => prev.map((ob, idx) => 
      idx === activeTabIndex ? { ...ob, bill: updatedBill } : ob
    ));
  };

  const setCurrentView = (view: 'upload' | 'edit') => {
    setOpenBills(prev => prev.map((ob, idx) => 
      idx === activeTabIndex ? { ...ob, view } : ob
    ));
  };

  const handleBillScanned = (data: ScannedBillData, imageUrl: string) => {
    const newBill: Bill = {
      id: `new-${generateId()}`,
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
    
    updateCurrentBill(newBill);
    setCurrentView('edit');
  };

  const handleSelectBill = (bill: Bill) => {
    // Check if bill is already open
    const existingIndex = openBills.findIndex(ob => ob.bill.id === bill.id);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
      return;
    }
    
    // Open in a new tab
    setOpenBills(prev => [...prev, { bill, view: 'edit' }]);
    setActiveTabIndex(openBills.length);
  };

  const handleSaveBill = async () => {
    if (!currentBill) return;
    
    const subtotal = currentBill.items.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal + (currentBill.tax || 0);
    
    const billToSave = {
      ...currentBill,
      subtotal,
      total,
    };
    
    const savedId = await saveBill(billToSave);
    if (savedId) {
      // Update the bill with the saved ID
      updateCurrentBill({ ...currentBill, id: savedId });
      await refreshBills();
    }
  };

  const handleNewBill = () => {
    const newBill = createEmptyBill();
    setOpenBills(prev => [...prev, { bill: newBill, view: 'upload' }]);
    setActiveTabIndex(openBills.length);
  };

  const handleCloseTab = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (openBills.length === 1) {
      // Reset to empty bill if closing the last tab
      setOpenBills([{ bill: createEmptyBill(), view: 'upload' }]);
      setActiveTabIndex(0);
      return;
    }
    
    setOpenBills(prev => prev.filter((_, idx) => idx !== index));
    
    // Adjust active tab index
    if (activeTabIndex >= index && activeTabIndex > 0) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    await deleteBill(billId);
    
    // Close any tabs with this bill
    const tabIndex = openBills.findIndex(ob => ob.bill.id === billId);
    if (tabIndex !== -1) {
      handleCloseTab(tabIndex);
    }
  };

  const getBillTabName = (ob: OpenBill) => {
    if (ob.bill.merchantName) return ob.bill.merchantName;
    if (ob.bill.id.startsWith('new')) return 'New Bill';
    return 'Untitled';
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
              <Button variant="outline" onClick={handleNewBill} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                New Bill
              </Button>
              {currentView === 'edit' && (
                <Button onClick={handleSaveBill} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Bill Tabs */}
        {openBills.length > 0 && (
          <div className="border-t border-border bg-muted/30">
            <div className="container mx-auto px-4">
              <ScrollArea className="w-full">
                <div className="flex items-center gap-1 py-2">
                  {openBills.map((ob, index) => (
                    <button
                      key={ob.bill.id}
                      onClick={() => setActiveTabIndex(index)}
                      className={cn(
                        "group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        "hover:bg-background/80",
                        index === activeTabIndex
                          ? "bg-background text-foreground shadow-sm border border-border"
                          : "text-muted-foreground"
                      )}
                    >
                      <Receipt className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{getBillTabName(ob)}</span>
                      <button
                        onClick={(e) => handleCloseTab(index, e)}
                        className={cn(
                          "p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors",
                          index === activeTabIndex ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {currentView === 'upload' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BillUploader onBillScanned={handleBillScanned} />
            </div>
            <div className="lg:col-span-1">
              <BillHistory
                bills={bills}
                loading={loading}
                onSelectBill={handleSelectBill}
                onDuplicateBill={duplicateBill}
                onDeleteBill={handleDeleteBill}
              />
            </div>
          </div>
        ) : currentBill ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Bill Details */}
            <div className="lg:col-span-4 space-y-6">
              <BillEditor bill={currentBill} onBillChange={updateCurrentBill} />
              <PeopleManager bill={currentBill} onBillChange={updateCurrentBill} />
            </div>
            
            {/* Middle Column - Item Assignment */}
            <div className="lg:col-span-5">
              <ItemAssignment bill={currentBill} onBillChange={updateCurrentBill} />
            </div>
            
            {/* Right Column - Summary */}
            <div className="lg:col-span-3 space-y-6">
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
        ) : null}
      </main>
    </div>
  );
}
