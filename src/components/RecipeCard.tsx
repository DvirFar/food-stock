import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users,
  ChefHat
} from 'lucide-react';
import { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <Card className="transition-shadow hover:shadow-md cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight">{recipe.name}</CardTitle>
          <ChefHat className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
