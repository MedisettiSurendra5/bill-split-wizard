import { Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bill, BillPerson, PERSON_COLORS } from '@/types/bill';
import { generateId } from '@/lib/utils';

interface PeopleManagerProps {
  bill: Bill;
  onBillChange: (bill: Bill) => void;
}

export function PeopleManager({ bill, onBillChange }: PeopleManagerProps) {
  const addPerson = () => {
    if (bill.people.length >= 5) return;
    
    const usedColors = bill.people.map(p => p.color);
    const availableColor = PERSON_COLORS.find(c => !usedColors.includes(c)) || PERSON_COLORS[0];
    
    const newPerson: BillPerson = {
      id: `temp-${generateId()}`,
      name: `Person ${bill.people.length + 1}`,
      color: availableColor,
    };
    
    onBillChange({
      ...bill,
      people: [...bill.people, newPerson],
    });
  };

  const updatePerson = (personId: string, updates: Partial<BillPerson>) => {
    onBillChange({
      ...bill,
      people: bill.people.map(person =>
        person.id === personId ? { ...person, ...updates } : person
      ),
    });
  };

  const removePerson = (personId: string) => {
    // Also remove assignments for this person
    const updatedItems = bill.items.map(item => ({
      ...item,
      assignments: item.assignments.filter(a => a.personId !== personId),
    }));
    
    onBillChange({
      ...bill,
      people: bill.people.filter(p => p.id !== personId),
      items: updatedItems,
    });
  };

  const changeColor = (personId: string) => {
    const person = bill.people.find(p => p.id === personId);
    if (!person) return;
    
    const currentIndex = PERSON_COLORS.indexOf(person.color);
    const nextIndex = (currentIndex + 1) % PERSON_COLORS.length;
    updatePerson(personId, { color: PERSON_COLORS[nextIndex] });
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold">People</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addPerson}
            disabled={bill.people.length >= 5}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Add up to 5 people to split the bill with.
        </p>

        <div className="space-y-2">
          {bill.people.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>Add people to start splitting the bill.</p>
            </div>
          ) : (
            bill.people.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 group"
              >
                <button
                  onClick={() => changeColor(person.id)}
                  className="w-8 h-8 rounded-full flex-shrink-0 transition-transform hover:scale-110"
                  style={{ backgroundColor: person.color }}
                  title="Click to change color"
                />
                
                <Input
                  value={person.name}
                  onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-medium"
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => removePerson(person.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {bill.people.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Click the colored circle to change a person's color tag.
          </p>
        )}
      </div>
    </Card>
  );
}
