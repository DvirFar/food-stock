import { useState, useEffect } from 'react';
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
  GripVertical
} from 'lucide-react';
import { settingsService, type Category, type Location } from '@/services/settingsService';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

type EditMode = 'create' | 'edit';

const Settings = () => {
  const { categories, locations, refetch, loading } = useSettings();
  const [activeTab, setActiveTab] = useState('categories');
  
  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryEditMode, setCategoryEditMode] = useState<EditMode>('create');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', label: '', sort_order: 0 });
  
  // Location dialog state
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationEditMode, setLocationEditMode] = useState<EditMode>('create');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({ name: '', label: '', sort_order: 0 });
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'location'; id: string; name: string } | null>(null);
  
  const [saving, setSaving] = useState(false);

  // Defaults are now auto-initialized by the SettingsProvider

  // Category handlers
  const openCategoryDialog = (mode: EditMode, category?: Category) => {
    setCategoryEditMode(mode);
    if (mode === 'edit' && category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        label: category.label,
        sort_order: category.sort_order,
      });
    } else {
      setEditingCategory(null);
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
      setCategoryForm({ name: '', label: '', sort_order: maxOrder + 1 });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim() || !categoryForm.label.trim()) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    setSaving(true);
    try {
      if (categoryEditMode === 'create') {
        await settingsService.createCategory(categoryForm);
        toast.success('הקטגוריה נוספה בהצלחה');
      } else if (editingCategory) {
        await settingsService.updateCategory(editingCategory.id, categoryForm);
        toast.success('הקטגוריה עודכנה בהצלחה');
      }
      await refetch();
      setCategoryDialogOpen(false);
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('קטגוריה עם שם זה כבר קיימת');
      } else {
        toast.error('שגיאה בשמירת הקטגוריה');
      }
    } finally {
      setSaving(false);
    }
  };

  // Location handlers
  const openLocationDialog = (mode: EditMode, location?: Location) => {
    setLocationEditMode(mode);
    if (mode === 'edit' && location) {
      setEditingLocation(location);
      setLocationForm({
        name: location.name,
        label: location.label,
        sort_order: location.sort_order,
      });
    } else {
      setEditingLocation(null);
      const maxOrder = locations.reduce((max, l) => Math.max(max, l.sort_order), 0);
      setLocationForm({ name: '', label: '', sort_order: maxOrder + 1 });
    }
    setLocationDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name.trim() || !locationForm.label.trim()) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    setSaving(true);
    try {
      if (locationEditMode === 'create') {
        await settingsService.createLocation(locationForm);
        toast.success('המיקום נוסף בהצלחה');
      } else if (editingLocation) {
        await settingsService.updateLocation(editingLocation.id, locationForm);
        toast.success('המיקום עודכן בהצלחה');
      }
      await refetch();
      setLocationDialogOpen(false);
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('מיקום עם שם זה כבר קיים');
      } else {
        toast.error('שגיאה בשמירת המיקום');
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (type: 'category' | 'location', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'category') {
        await settingsService.deleteCategory(deleteTarget.id);
        toast.success('הקטגוריה נמחקה');
      } else {
        await settingsService.deleteLocation(deleteTarget.id);
        toast.success('המיקום נמחק');
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          הגדרות
        </h1>
        <p className="text-muted-foreground">
          ניהול קטגוריות ומיקומים
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            קטגוריות
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            מיקומים
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>קטגוריות מוצרים</CardTitle>
                <CardDescription>
                  הגדר קטגוריות למוצרים ומספר סידורי למיון ברשימת הקניות
                </CardDescription>
              </div>
              <Button onClick={() => openCategoryDialog('create')}>
                <Plus className="h-4 w-4 me-2" />
                הוסף קטגוריה
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{category.label}</div>
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                        סדר: {category.sort_order}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openCategoryDialog('edit', category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog('category', category.id, category.label)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                {categories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    אין קטגוריות מותאמות אישית. לחץ על "הוסף קטגוריה" כדי להתחיל.
                  </div>
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
                <CardDescription>
                  הגדר מיקומים לאחסון מוצרים
                </CardDescription>
              </div>
              <Button onClick={() => openLocationDialog('create')}>
                <Plus className="h-4 w-4 me-2" />
                הוסף מיקום
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {locations
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{location.label}</div>
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                        סדר: {location.sort_order}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openLocationDialog('edit', location)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog('location', location.id, location.label)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                {locations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    אין מיקומים מותאמים אישית. לחץ על "הוסף מיקום" כדי להתחיל.
                  </div>
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
            <DialogTitle>
              {categoryEditMode === 'create' ? 'הוסף קטגוריה' : 'ערוך קטגוריה'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-label">שם תצוגה</Label>
              <Input
                id="cat-label"
                value={categoryForm.label}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="מוצרי חלב"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">מספר סידורי (למיון)</Label>
              <Input
                id="cat-order"
                type="number"
                value={categoryForm.sort_order}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-name">מזהה (באנגלית)</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="dairy"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locationEditMode === 'create' ? 'הוסף מיקום' : 'ערוך מיקום'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="loc-label">שם תצוגה</Label>
              <Input
                id="loc-label"
                value={locationForm.label}
                onChange={(e) => setLocationForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="מקרר"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-order">מספר סידורי</Label>
              <Input
                id="loc-order"
                type="number"
                value={locationForm.sort_order}
                onChange={(e) => setLocationForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-name">מזהה (באנגלית)</Label>
              <Input
                id="loc-name"
                value={locationForm.name}
                onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="fridge"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveLocation} disabled={saving}>
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את {deleteTarget?.type === 'category' ? 'הקטגוריה' : 'המיקום'} "{deleteTarget?.name}".
              לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
