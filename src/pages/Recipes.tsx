import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ChefHat,
  Plus
} from 'lucide-react';
import { recipeService } from '@/services/recipeService';
import { Recipe } from '@/types';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeEditorDialog } from '@/components/RecipeEditorDialog';
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
      toast.success('Recipe deleted');
      loadRecipes();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      toast.error('Failed to delete recipe');
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
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            Discover recipes you can make with your ingredients
          </p>
        </div>
        <Button onClick={handleNewRecipe}>
          <Plus className="h-4 w-4 mr-2" />
          New Recipe
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes or ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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
            <h3 className="text-lg font-medium mb-2">No recipes found</h3>
            <p className="text-muted-foreground text-center">
              {recipes.length === 0
                ? "No recipes in the database yet"
                : "Try adjusting your search or filters"
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
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredRecipes.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredRecipes.length} of {recipes.length} recipes
        </p>
      )}

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
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipeToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recipes;
