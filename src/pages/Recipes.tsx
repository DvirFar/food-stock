import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  ChefHat,
  Plus,
  ChevronDown,
  FileSpreadsheet,
  LayoutGrid,
  List
} from 'lucide-react';
import { recipeService } from '@/services/recipeService';
import { Recipe } from '@/types';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeListView } from '@/components/RecipeListView';
import { RecipeEditorDialog } from '@/components/RecipeEditorDialog';
import { RecipeViewDialog } from '@/components/RecipeViewDialog';
import { BatchAddRecipesDialog } from '@/components/BatchAddRecipesDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery, selectedTags]);

  const loadRecipes = async () => {
    try {
      const data = await recipeService.getAll();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = [...recipes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        (r.description?.toLowerCase().includes(query)) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(query))
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(r =>
        selectedTags.every(tag => r.tags.includes(tag))
      );
    }

    setFilteredRecipes(filtered);
  };

  const allTags = [...new Set(recipes.flatMap(r => r.tags))];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleView = (recipe: Recipe) => {
    setViewingRecipe(recipe);
    setViewDialogOpen(true);
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setEditorOpen(true);
  };

  const handleDelete = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!recipeToDelete) return;
    
    try {
      await recipeService.delete(recipeToDelete.id);
      toast.success('המתכון נמחק');
      loadRecipes();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      toast.error('שגיאה במחיקת מתכון');
    } finally {
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
    }
  };

  const handleNewRecipe = () => {
    setEditingRecipe(null);
    setEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">מתכונים</h1>
          <p className="text-muted-foreground">
            גלה מתכונים שתוכל להכין עם המרכיבים שלך
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              מתכון חדש
              <ChevronDown className="h-4 w-4 ms-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleNewRecipe}>
              <Plus className="h-4 w-4 me-2" />
              מתכון בודד
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBatchDialogOpen(true)}>
              <FileSpreadsheet className="h-4 w-4 me-2" />
              הוספה בכמות
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש מתכונים או מרכיבים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">לא נמצאו מתכונים</h3>
            <p className="text-muted-foreground text-center">
              {recipes.length === 0
                ? "אין עדיין מתכונים במערכת"
                : "נסה לשנות את החיפוש או הסינון"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredRecipes.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          מציג {filteredRecipes.length} מתוך {recipes.length} מתכונים
        </p>
      )}

      {/* Recipe View Dialog */}
      <RecipeViewDialog
        recipe={viewingRecipe}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      {/* Recipe Editor Dialog */}
      <RecipeEditorDialog
        recipe={editingRecipe}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={loadRecipes}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מתכון</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את "{recipeToDelete?.name}"? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Add Recipes Dialog */}
      <BatchAddRecipesDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        onRecipesAdded={loadRecipes}
      />
    </div>
  );
};

export default Recipes;
