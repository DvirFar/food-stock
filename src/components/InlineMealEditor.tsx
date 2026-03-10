import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, ChefHat, X, Eye } from 'lucide-react';
import { Meal } from '@/services/mealService';
import { Recipe } from '@/types';

interface InlineMealEditorProps {
  meal: Meal;
  allRecipes: Recipe[];
  onAddSection: (mealId: string, name: string, sortOrder: number) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onAddRecipe: (sectionId: string, recipeId: string, sortOrder: number) => Promise<void>;
  onRemoveRecipe: (recipeEntryId: string) => Promise<void>;
  onPreview?: (meal: Meal) => void;
  compact?: boolean;
}

export const InlineMealEditor = ({
  meal,
  allRecipes,
  onAddSection,
  onDeleteSection,
  onAddRecipe,
  onRemoveRecipe,
  onPreview,
  compact = false,
}: InlineMealEditorProps) => {
  const [addingSectionName, setAddingSectionName] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [addRecipeForSection, setAddRecipeForSection] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

  const handleAddSection = async () => {
    if (!addingSectionName.trim()) return;
    await onAddSection(meal.id, addingSectionName.trim(), meal.sections.length);
    setAddingSectionName('');
    setShowAddSection(false);
  };

  const handleAddRecipe = async (sectionId: string) => {
    if (!selectedRecipeId) return;
    const section = meal.sections.find(s => s.id === sectionId);
    await onAddRecipe(sectionId, selectedRecipeId, section?.recipes.length || 0);
    setSelectedRecipeId('');
    setAddRecipeForSection(null);
  };

  return (
    <div className="space-y-2">
      {meal.sections.map(section => (
        <div key={section.id} className={`border rounded-lg ${compact ? 'p-2' : 'p-3'} space-y-1.5`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{section.name}</h4>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setAddRecipeForSection(section.id);
                  setSelectedRecipeId('');
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>מחיקת חלק</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם למחוק את "{section.name}" וכל המתכונים בו?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteSection(section.id)}>מחק</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {section.recipes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">אין מתכונים</p>
          ) : (
            <div className="space-y-1">
              {section.recipes.map(sr => (
                <div
                  key={sr.id}
                  className="flex items-center justify-between bg-muted/50 rounded-md px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <ChefHat className="h-3 w-3 text-muted-foreground" />
                    <span>{sr.recipe?.name || 'מתכון לא נמצא'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => onRemoveRecipe(sr.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Inline recipe add */}
          {addRecipeForSection === section.id && (
            <div className="flex gap-1.5 mt-1">
              <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue placeholder="בחר מתכון..." />
                </SelectTrigger>
                <SelectContent>
                  {allRecipes.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 text-xs" onClick={() => handleAddRecipe(section.id)} disabled={!selectedRecipeId}>
                הוסף
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setAddRecipeForSection(null)}>
                ביטול
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Add section */}
      {showAddSection ? (
        <div className="flex gap-1.5">
          <Input
            placeholder="שם החלק (למשל: סלטים)"
            value={addingSectionName}
            onChange={e => setAddingSectionName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddSection();
              if (e.key === 'Escape') { setShowAddSection(false); setAddingSectionName(''); }
            }}
            autoFocus
            className="h-8 text-xs"
          />
          <Button size="sm" className="h-8 text-xs" onClick={handleAddSection} disabled={!addingSectionName.trim()}>
            הוסף
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowAddSection(false); setAddingSectionName(''); }}>
            ביטול
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={() => setShowAddSection(true)}
        >
          <Plus className="h-3 w-3 me-1" />
          הוסף חלק
        </Button>
      )}

      {/* Preview button */}
      {onPreview && meal.sections.some(s => s.recipes.length > 0) && (
        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => onPreview(meal)}>
          <Eye className="h-3 w-3 me-1" />
          תצוגה מקדימה
        </Button>
      )}
    </div>
  );
};
