import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bill, BillItem, BillPerson, ItemAssignment } from '@/types/bill';
import { useToast } from '@/hooks/use-toast';

export function useBillStorage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBills = async () => {
    try {
      setLoading(true);
      
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (billsError) throw billsError;
      
      const fullBills: Bill[] = [];
      
      for (const bill of billsData || []) {
        const [itemsRes, peopleRes] = await Promise.all([
          supabase.from('bill_items').select('*').eq('bill_id', bill.id),
          supabase.from('bill_people').select('*').eq('bill_id', bill.id),
        ]);
        
        if (itemsRes.error) throw itemsRes.error;
        if (peopleRes.error) throw peopleRes.error;
        
        const items: BillItem[] = [];
        for (const item of itemsRes.data || []) {
          const { data: assignments, error: assignError } = await supabase
            .from('item_assignments')
            .select('*')
            .eq('bill_item_id', item.id);
          
          if (assignError) throw assignError;
          
          items.push({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            assignments: (assignments || []).map(a => ({
              personId: a.bill_person_id,
              splitPercentage: Number(a.split_percentage),
            })),
          });
        }
        
        fullBills.push({
          id: bill.id,
          merchantName: bill.merchant_name || '',
          currency: bill.currency || 'USD',
          items,
          people: (peopleRes.data || []).map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
          })),
          subtotal: bill.subtotal ? Number(bill.subtotal) : null,
          tax: bill.tax ? Number(bill.tax) : null,
          total: bill.total ? Number(bill.total) : null,
          imageUrl: bill.image_url || undefined,
          createdAt: new Date(bill.created_at),
          updatedAt: new Date(bill.updated_at),
        });
      }
      
      setBills(fullBills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bills',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBill = async (bill: Bill): Promise<string | null> => {
    try {
      // Upsert the main bill
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .upsert({
          id: bill.id === 'new' ? undefined : bill.id,
          merchant_name: bill.merchantName,
          currency: bill.currency,
          subtotal: bill.subtotal,
          tax: bill.tax,
          total: bill.total,
          image_url: bill.imageUrl,
        })
        .select()
        .single();
      
      if (billError) throw billError;
      
      const billId = billData.id;
      
      // Delete existing items, people, and assignments
      if (bill.id !== 'new') {
        await supabase.from('bill_items').delete().eq('bill_id', billId);
        await supabase.from('bill_people').delete().eq('bill_id', billId);
      }
      
      // Insert people first
      const peopleToInsert = bill.people.map(p => ({
        id: p.id.startsWith('temp-') ? undefined : p.id,
        bill_id: billId,
        name: p.name,
        color: p.color,
      }));
      
      const { data: insertedPeople, error: peopleError } = await supabase
        .from('bill_people')
        .insert(peopleToInsert)
        .select();
      
      if (peopleError) throw peopleError;
      
      // Create a mapping from old person IDs to new ones
      const personIdMap = new Map<string, string>();
      bill.people.forEach((oldPerson, index) => {
        personIdMap.set(oldPerson.id, insertedPeople![index].id);
      });
      
      // Insert items
      const itemsToInsert = bill.items.map(item => ({
        id: item.id.startsWith('temp-') ? undefined : item.id,
        bill_id: billId,
        name: item.name,
        price: item.price,
      }));
      
      const { data: insertedItems, error: itemsError } = await supabase
        .from('bill_items')
        .insert(itemsToInsert)
        .select();
      
      if (itemsError) throw itemsError;
      
      // Create a mapping from old item IDs to new ones
      const itemIdMap = new Map<string, string>();
      bill.items.forEach((oldItem, index) => {
        itemIdMap.set(oldItem.id, insertedItems![index].id);
      });
      
      // Insert assignments
      const assignmentsToInsert: { bill_item_id: string; bill_person_id: string; split_percentage: number }[] = [];
      for (const item of bill.items) {
        for (const assignment of item.assignments) {
          assignmentsToInsert.push({
            bill_item_id: itemIdMap.get(item.id)!,
            bill_person_id: personIdMap.get(assignment.personId)!,
            split_percentage: assignment.splitPercentage,
          });
        }
      }
      
      if (assignmentsToInsert.length > 0) {
        const { error: assignError } = await supabase
          .from('item_assignments')
          .insert(assignmentsToInsert);
        
        if (assignError) throw assignError;
      }
      
      toast({
        title: 'Success',
        description: 'Bill saved successfully',
      });
      
      await fetchBills();
      return billId;
    } catch (error) {
      console.error('Error saving bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to save bill',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Bill deleted successfully',
      });
      
      await fetchBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bill',
        variant: 'destructive',
      });
    }
  };

  const duplicateBill = async (billId: string) => {
    const billToDuplicate = bills.find(b => b.id === billId);
    if (!billToDuplicate) return;
    
    const duplicated: Bill = {
      ...billToDuplicate,
      id: 'new',
      merchantName: `${billToDuplicate.merchantName} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      people: billToDuplicate.people.map(p => ({
        ...p,
        id: `temp-${crypto.randomUUID()}`,
      })),
      items: billToDuplicate.items.map(item => ({
        ...item,
        id: `temp-${crypto.randomUUID()}`,
        assignments: item.assignments.map(a => ({
          ...a,
          personId: `temp-${crypto.randomUUID()}`,
        })),
      })),
    };
    
    // Fix assignment person IDs
    const personIdMap = new Map<string, string>();
    billToDuplicate.people.forEach((oldPerson, index) => {
      personIdMap.set(oldPerson.id, duplicated.people[index].id);
    });
    
    duplicated.items = duplicated.items.map((item, itemIndex) => ({
      ...item,
      assignments: billToDuplicate.items[itemIndex].assignments.map(a => ({
        personId: personIdMap.get(a.personId) || a.personId,
        splitPercentage: a.splitPercentage,
      })),
    }));
    
    await saveBill(duplicated);
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return {
    bills,
    loading,
    saveBill,
    deleteBill,
    duplicateBill,
    refreshBills: fetchBills,
  };
}
