import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { 
  Settings as SettingsIcon, 
  Plus, 
  Pencil, 
  Trash2, 
  Tag,
  MapPin,
  GripVertical,
  Tags
} from 'lucide-react';
import { settingsService, type Category, type Location, type ProductTag } from '@/services/settingsService';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

type EditMode = 'create' | 'edit';

const Settings = () => {
  const { categories, locations, productTags, refetch, loading } = useSettings();
  const [activeTab, setActiveTab] = useState('categories');
  
  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryEditMode, setCategoryEditMode] = useState<EditMode>('create');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', sort_order: 0 });
  
  // Location dialog state
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationEditMode, setLocationEditMode] = useState<EditMode>('create');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({ name: '', sort_order: 0 });

  // Product tag dialog state
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditMode, setTagEditMode] = useState<EditMode>('create');
  const [editingTag, setEditingTag] = useState<ProductTag | null>(null);
  const [tagForm, setTagForm] = useState({ name: '', sort_order: 0 });
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'location' | 'tag'; id: string; name: string } | null>(null);
  
  const [saving, setSaving] = useState(false);

  // Category handlers
  const openCategoryDialog = (mode: EditMode, category?: Category) => {
    setCategoryEditMode(mode);
    if (mode === 'edit' && category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, sort_order: category.sort_order });
    } else {
      setEditingCategory(null);
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
      setCategoryForm({ name: '', sort_order: maxOrder + 1 });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('יש למלא את שם הקטגוריה');
      return;
    }
    setSaving(true);
    try {
      if (categoryEditMode === 'create') {
        await settingsService.createCategory(categoryForm);
        toast.success('הקטגוריה נוספה בהצלחה');
      } else if (editingCategory) {
        // If name changed, update products too
        if (editingCategory.name !== categoryForm.name.trim()) {
          await updateProductsCategory(editingCategory.name, categoryForm.name.trim());
        }
        await settingsService.updateCategory(editingCategory.id, categoryForm);
        toast.success('הקטגוריה עודכנה בהצלחה');
      }
      await refetch();
      setCategoryDialogOpen(false);
    } catch (error: any) {
      toast.error(error.code === '23505' ? 'קטגוריה עם שם זה כבר קיימת' : 'שגיאה בשמירת הקטגוריה');
    } finally {
      setSaving(false);
    }
  };

  // Location handlers
  const openLocationDialog = (mode: EditMode, location?: Location) => {
    setLocationEditMode(mode);
    if (mode === 'edit' && location) {
      setEditingLocation(location);
      setLocationForm({ name: location.name, sort_order: location.sort_order });
    } else {
      setEditingLocation(null);
      const maxOrder = locations.reduce((max, l) => Math.max(max, l.sort_order), 0);
      setLocationForm({ name: '', sort_order: maxOrder + 1 });
    }
    setLocationDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name.trim()) {
      toast.error('יש למלא את שם המיקום');
      return;
    }
    setSaving(true);
    try {
      if (locationEditMode === 'create') {
        await settingsService.createLocation(locationForm);
        toast.success('המיקום נוסף בהצלחה');
      } else if (editingLocation) {
        if (editingLocation.name !== locationForm.name.trim()) {
          await updateProductsLocation(editingLocation.name, locationForm.name.trim());
        }
        await settingsService.updateLocation(editingLocation.id, locationForm);
        toast.success('המיקום עודכן בהצלחה');
      }
      await refetch();
      setLocationDialogOpen(false);
    } catch (error: any) {
      toast.error(error.code === '23505' ? 'מיקום עם שם זה כבר קיים' : 'שגיאה בשמירת המיקום');
    } finally {
      setSaving(false);
    }
  };

  // Helper: update products when category/location name changes
  const updateProductsCategory = async (oldName: string, newName: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.from('products').update({ category: newName } as any).eq('category', oldName);
    await supabase.from('shopping_list_items').update({ category: newName } as any).eq('category', oldName);
  };

  const updateProductsLocation = async (oldName: string, newName: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.from('products').update({ location: newName } as any).eq('location', oldName);
  };

  // Product tag handlers
  const openTagDialog = (mode: EditMode, tag?: ProductTag) => {
    setTagEditMode(mode);
    if (mode === 'edit' && tag) {
      setEditingTag(tag);
      setTagForm({ name: tag.name, sort_order: tag.sort_order });
    } else {
      setEditingTag(null);
      const maxOrder = productTags.reduce((max, t) => Math.max(max, t.sort_order), 0);
      setTagForm({ name: '', sort_order: maxOrder + 1 });
    }
    setTagDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (!tagForm.name.trim()) {
      toast.error('יש למלא את שם התגית');
      return;
    }
    setSaving(true);
    try {
      if (tagEditMode === 'create') {
        await settingsService.createProductTag(tagForm);
        toast.success('התגית נוספה בהצלחה');
      } else if (editingTag) {
        await settingsService.updateProductTag(editingTag.id, tagForm);
        toast.success('התגית עודכנה בהצלחה');
      }
      await refetch();
      setTagDialogOpen(false);
    } catch (error: any) {
      toast.error(error.code === '23505' ? 'תגית עם שם זה כבר קיימת' : 'שגיאה בשמירת התגית');
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (type: 'category' | 'location' | 'tag', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'category') {
        await settingsService.deleteCategory(deleteTarget.id);
        toast.success('הקטגוריה נמחקה');
      } else if (deleteTarget.type === 'location') {
        await settingsService.deleteLocation(deleteTarget.id);
        toast.success('המיקום נמחק');
      } else {
        await settingsService.deleteProductTag(deleteTarget.id);
        toast.success('התגית נמחקה');
      }
      await refetch();
    } catch (error) {
      toast.error('שגיאה במחיקה');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          הגדרות
        </h1>
        <p className="text-muted-foreground">ניהול קטגוריות, מיקומים, תגיות וברירות מחדל לשבת</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            קטגוריות
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            מיקומים
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            תגיות מוצרים
          </TabsTrigger>
          <TabsTrigger value="shabbat" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            ברירות מחדל לשבת
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shabbat" className="space-y-4">
          <ShabbatDefaultsSettings />
        </TabsContent>


        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>קטגוריות מוצרים</CardTitle>
                <CardDescription>הגדר קטגוריות למוצרים ומספר סידורי למיון ברשימת הקניות</CardDescription>
              </div>
              <Button onClick={() => openCategoryDialog('create')}>
                <Plus className="h-4 w-4 me-2" />
                הוסף קטגוריה
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.sort((a, b) => a.sort_order - b.sort_order).map((category) => (
                  <div key={category.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">סדר: {category.sort_order}</div>
                    <Button variant="ghost" size="icon" onClick={() => openCategoryDialog('edit', category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog('category', category.id, category.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">אין קטגוריות מותאמות אישית. לחץ על "הוסף קטגוריה" כדי להתחיל.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>מיקומי אחסון</CardTitle>
                <CardDescription>הגדר מיקומים לאחסון מוצרים</CardDescription>
              </div>
              <Button onClick={() => openLocationDialog('create')}>
                <Plus className="h-4 w-4 me-2" />
                הוסף מיקום
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {locations.sort((a, b) => a.sort_order - b.sort_order).map((location) => (
                  <div key={location.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{location.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">סדר: {location.sort_order}</div>
                    <Button variant="ghost" size="icon" onClick={() => openLocationDialog('edit', location)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog('location', location.id, location.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {locations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">אין מיקומים מותאמים אישית. לחץ על "הוסף מיקום" כדי להתחיל.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>תגיות מוצרים</CardTitle>
                <CardDescription>הגדר תגיות לסיווג מוצרים לרשימות (למשל: רגיל, חופשה, שבת)</CardDescription>
              </div>
              <Button onClick={() => openTagDialog('create')}>
                <Plus className="h-4 w-4 me-2" />
                הוסף תגית
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {productTags.sort((a, b) => a.sort_order - b.sort_order).map((tag) => (
                  <div key={tag.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{tag.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">סדר: {tag.sort_order}</div>
                    <Button variant="ghost" size="icon" onClick={() => openTagDialog('edit', tag)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog('tag', tag.id, tag.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {productTags.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">אין תגיות. לחץ על "הוסף תגית" כדי להתחיל.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{categoryEditMode === 'create' ? 'הוסף קטגוריה' : 'ערוך קטגוריה'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">שם</Label>
              <Input id="cat-name" value={categoryForm.name} onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} placeholder="מוצרי חלב" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">מספר סידורי (למיון)</Label>
              <Input id="cat-order" type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))} dir="rtl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSaveCategory} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locationEditMode === 'create' ? 'הוסף מיקום' : 'ערוך מיקום'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="loc-name">שם</Label>
              <Input id="loc-name" value={locationForm.name} onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))} placeholder="מקרר" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-order">מספר סידורי</Label>
              <Input id="loc-order" type="number" value={locationForm.sort_order} onChange={(e) => setLocationForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))} dir="rtl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSaveLocation} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tagEditMode === 'create' ? 'הוסף תגית' : 'ערוך תגית'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">שם התגית</Label>
              <Input id="tag-name" value={tagForm.name} onChange={(e) => setTagForm(prev => ({ ...prev, name: e.target.value }))} placeholder="רגיל" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-order">מספר סידורי</Label>
              <Input id="tag-order" type="number" value={tagForm.sort_order} onChange={(e) => setTagForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))} dir="rtl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSaveTag} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק?</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את "{deleteTarget?.name}"? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
