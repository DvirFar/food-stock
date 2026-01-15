import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users,
  ChefHat,
  Pencil,
  Trash2
} from 'lucide-react';
import { Recipe } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
}

export const RecipeCard = ({ recipe, onEdit, onDelete }: RecipeCardProps) => {
  const { user } = useAuth();
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const canModify = user && recipe.user_id === user.id;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight">{recipe.name}</CardTitle>
          <div className="flex items-center gap-1">
            {canModify && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(recipe)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canModify && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(recipe)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <ChefHat className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {recipe.description}
        </p>
      </CardHeader>
      <CardContent>
        {/* Time and Servings */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{totalTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* Ingredients Preview */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Ingredients:</p>
          <div className="flex flex-wrap gap-1">
            {recipe.ingredients.slice(0, 4).map((ing, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {ing.name}
              </Badge>
            ))}
            {recipe.ingredients.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.ingredients.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
