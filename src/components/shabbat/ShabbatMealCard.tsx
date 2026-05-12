import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UtensilsCrossed, Plus, Trash2, ChefHat, X, Eye, User } from 'lucide-react';
import { ShabbatPlanSection } from '@/services/shabbatPlanService';
import { Recipe, Product, RecipeIngredient } from '@/types';

interface ShabbatMealCardProps {
  title: string;
  sections: ShabbatPlanSection[];
  allRecipes: Recipe[];
  products: Product[];
  onAddSection: (name: string, sortOrder: number) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onAddRecipe: (sectionId: string, recipeId: string, sortOrder: number) => Promise<void>;
  onRemoveRecipe: (recipeEntryId: string) => Promise<void>;
  onUpdateRecipe: (recipeEntryId: string, updates: { is_done?: boolean; assigned_to?: string }) => Promise<void>;
  onPreview?: () => void;
}

export const ShabbatMealCard = ({
  title,
  sections,
  allRecipes,
  products,
  onAddSection,
  onDeleteSection,
  onAddRecipe,
  onRemoveRecipe,
  onPreview,
}: ShabbatMealCardProps) => {
  const [showAddSection, setShowAddSection] = useState(false);
  const [addingSectionName, setAddingSectionName] = useState('');
  const [addRecipeForSection, setAddRecipeForSection] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

  const handleAddSection = async () => {
    if (!addingSectionName.trim()) return;
    await onAddSection(addingSectionName.trim(), sections.length);
    setAddingSectionName('');
    setShowAddSection(false);
  };

  const handleAddRecipe = async (sectionId: string) => {
    if (!selectedRecipeId) return;
    const section = sections.find(s => s.id === sectionId);
    await onAddRecipe(sectionId, selectedRecipeId, section?.recipes.length || 0);
    setSelectedRecipeId('');
    setAddRecipeForSection(null);
  };

  const hasRecipes = sections.some(s => s.recipes.length > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <UtensilsCrossed className="h-5 w-5" />
            {title}
          </div>
          {hasRecipes && onPreview && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onPreview}>
              <Eye className="h-3.5 w-3.5 me-1" />
              תצוגה מקדימה
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sections.map(section => (
          <div key={section.id} className="border rounded-lg p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-xs">{section.name}</h4>
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
      </CardContent>
    </Card>
  );
};
