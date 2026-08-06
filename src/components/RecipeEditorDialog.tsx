import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';
import { Recipe, RecipeIngredient, Product } from '@/types';
import { recipeService } from '@/services/recipeService';
import { toast } from 'sonner';
import { ProductIngredientPicker } from '@/components/ProductIngredientPicker';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';


interface RecipeEditorDialogProps {
  recipe?: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export const RecipeEditorDialog = ({
  recipe,
  open,
  onOpenChange,
  onSave,
}: RecipeEditorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState<number>(0);
  const [cookTime, setCookTime] = useState<number>(0);
  const [servings, setServings] = useState<number>(4);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const isEditing = !!recipe;

  // Normalize ingredients so quantity is always populated (fallback from amount)
  const normalizeIngredients = (ings: RecipeIngredient[]): RecipeIngredient[] =>
    ings.map(ing => ({
      ...ing,
      quantity: ing.quantity != null && ing.quantity !== '' 
        ? Number(ing.quantity) 
        : ing.amount != null && ing.amount !== '' 
          ? Number(ing.amount) || 0 
          : 0,
    }));

  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setDescription(recipe.description || '');
      setPrepTime(recipe.prep_time || 0);
      setCookTime(recipe.cook_time || 0);
      setServings(recipe.servings || 4);
      setIngredients(normalizeIngredients(recipe.ingredients));
      setInstructions(recipe.instructions);
      setTags(recipe.tags);
      setIsPublic(recipe.is_public);
    } else {
      resetForm();
    }
  }, [recipe, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrepTime(0);
    setCookTime(0);
    setServings(4);
    setIngredients([{ name: '', quantity: 1, unit: 'יחידות' }]);
    setInstructions(['']);
    setTags([]);
    setNewTag('');
    setIsPublic(false);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 1, unit: 'יחידות' }]);
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleProductSelect = (index: number, product: Product) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      name: product.name,
      unit: product.unit,
      productId: product.id,
    };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const {
    requestConfirm: requestRemoveIngredient,
    confirm: confirmRemoveIngredient,
    cancel: cancelRemoveIngredient,
    isOpen: isOpenRemoveIngredient,
  } = useConfirmDelete<number>(removeIngredient);

  const {
    requestConfirm: requestRemoveInstruction,
    confirm: confirmRemoveInstruction,
    cancel: cancelRemoveInstruction,
    isOpen: isOpenRemoveInstruction,
  } = useConfirmDelete<number>(removeInstruction);

  const {
    requestConfirm: requestRemoveTag,
    confirm: confirmRemoveTag,
    cancel: cancelRemoveTag,
    isOpen: isOpenRemoveTag,
  } = useConfirmDelete<string>(removeTag);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('נא להזין שם מתכון');
      return;
    }

    const validIngredients = ingredients.filter(i => i.name.trim());
    const validInstructions = instructions.filter(i => i.trim());

    if (validIngredients.length === 0) {
      toast.error('נא להוסיף לפחות מרכיב אחד');
      return;
    }

    if (validInstructions.length === 0) {
      toast.error('נא להוסיף לפחות הוראת הכנה אחת');
      return;
    }

    setLoading(true);

    try {
      const recipeData = {
        name: name.trim(),
        description: description.trim() || null,
        prep_time: prepTime || null,
        cook_time: cookTime || null,
        servings,
        ingredients: validIngredients,
        instructions: validInstructions,
        tags,
        is_public: isPublic,
      };

      if (isEditing && recipe) {
        await recipeService.update(recipe.id, recipeData);
        toast.success('המתכון עודכן בהצלחה');
      } else {
        await recipeService.create(recipeData);
        toast.success('המתכון נוצר בהצלחה');
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      toast.error('שגיאה בשמירת מתכון');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'עריכת מתכון' : 'מתכון חדש'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">שם המתכון *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: ספגטי קרבונרה"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">תיאור</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="תיאור קצר של המנה..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prepTime">זמן הכנה (דק׳)</Label>
              <Input
                id="prepTime"
                type="number"
                min={0}
                value={prepTime}
                onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookTime">זמן בישול (דק׳)</Label>
              <Input
                id="cookTime"
                type="number"
                min={0}
                value={cookTime}
                onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">מנות</Label>
              <Input
                id="servings"
                type="number"
                min={1}
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                dir="rtl"
              />
            </div>

            <div className="flex items-center gap-2 self-end pb-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublic" className="cursor-pointer">הפוך לציבורי</Label>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <Label>מרכיבים *</Label>
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <ProductIngredientPicker
                  value={ing.name}
                  onSelect={(product) => handleProductSelect(idx, product)}
                  onChange={(name) => updateIngredient(idx, 'name', name)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={ing.quantity ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    updateIngredient(idx, 'quantity', raw === '' ? '' : raw);
                  }}
                  onBlur={(e) => {
                    const parsed = parseFloat(e.target.value);
                    updateIngredient(idx, 'quantity', isNaN(parsed) ? '' : parsed);
                  }}
                  className="w-20"
                  dir="rtl"
                />
                <Input
                  placeholder="יחידה"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                  className="w-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => requestRemoveIngredient(idx)}
                  disabled={ingredients.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
              <Plus className="h-4 w-4 me-1" /> הוסף מרכיב
            </Button>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <Label>הוראות הכנה *</Label>
            {instructions.map((inst, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-sm font-medium text-muted-foreground mt-2 w-6">
                  {idx + 1}.
                </span>
                <Textarea
                  value={inst}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                  placeholder={`שלב ${idx + 1}...`}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => requestRemoveInstruction(idx)}
                  disabled={instructions.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
              <Plus className="h-4 w-4 me-1" /> הוסף שלב
            </Button>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>תגיות</Label>
            <div className="flex gap-2">
              <Input
                placeholder="הוסף תגית..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                הוסף
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'שומר...' : isEditing ? 'עדכן מתכון' : 'צור מתכון'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
