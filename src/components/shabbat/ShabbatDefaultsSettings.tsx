import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, X, ChevronDown } from 'lucide-react';
import { shabbatPlanService, type ShabbatDefaultSection } from '@/services/shabbatPlanService';
import { recipeService } from '@/services/recipeService';
import { Recipe } from '@/types';
import { cn } from '@/lib/utils';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { toast } from 'sonner';


const SLOTS: { key: 'friday' | 'saturday' | 'seudah_shlishit'; label: string }[] = [
  { key: 'friday', label: 'ערב שבת' },
  { key: 'saturday', label: 'שבת בוקר' },
  { key: 'seudah_shlishit', label: 'סעודה שלישית' },
];

const RecipePicker = ({ recipes, onSelect }: { recipes: Recipe[]; onSelect: (r: Recipe) => void }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(r =>
      r.name.toLowerCase().includes(q) || (r.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }, [recipes, search]);

  return (
    <div className="relative" ref={ref}>
      <Input
        autoFocus
        placeholder="חפש מתכון לפי שם או תגית..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="h-8 text-xs pe-8"
      />
      <ChevronDown
        className="absolute end-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
        onClick={() => setOpen(o => !o)}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ScrollArea className="max-h-48">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground text-center">לא נמצאו מתכונים</div>
            ) : (
              <div className="py-1">
                {filtered.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className={cn('flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors')}
                    onClick={() => onSelect(r)}
                  >
                    <span>{r.name}</span>
                    {(r.tags?.length || 0) > 0 && (
                      <span className="text-xs text-muted-foreground truncate max-w-[50%]">{r.tags.join(', ')}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export const ShabbatDefaultsSettings = () => {
  const [sections, setSections] = useState<ShabbatDefaultSection[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSectionSlot, setAddingSectionSlot] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [addRecipeFor, setAddRecipeFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [secs, recs] = await Promise.all([
        shabbatPlanService.getDefaultSections(),
        recipeService.getAll(),
      ]);
      setSections(secs);
      setRecipes(recs);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בטעינת ברירות המחדל');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateBuiltIn = async () => {
    try {
      await shabbatPlanService.createDefaultSectionsFromBuiltIn();
      await load();
    } catch { toast.error('שגיאה ביצירת חלקים'); }
  };

  const handleAddSection = async (slot: string) => {
    if (!newSectionName.trim()) return;
    const order = sections.filter(s => s.slot === slot).length;
    try {
      await shabbatPlanService.addDefaultSection(slot, newSectionName.trim(), order);
      setNewSectionName('');
      setAddingSectionSlot(null);
      await load();
    } catch { toast.error('שגיאה בהוספת חלק'); }
  };

  const handleDeleteSection = async (id: string) => {
    try {
      await shabbatPlanService.deleteDefaultSection(id);
      await load();
    } catch { toast.error('שגיאה במחיקת חלק'); }
  };

  const handleAddRecipe = async (section: ShabbatDefaultSection, recipe: Recipe) => {
    try {
      await shabbatPlanService.addDefaultRecipe(section.id, recipe.id, section.recipes.length);
      setAddRecipeFor(null);
      await load();
    } catch (e: any) {
      toast.error(e?.code === '23505' ? 'המתכון כבר קיים בחלק זה' : 'שגיאה בהוספת מתכון');
    }
  };

  const handleRemoveRecipe = async (id: string) => {
    try {
      await shabbatPlanService.removeDefaultRecipe(id);
      await load();
    } catch { toast.error('שגיאה בהסרת מתכון'); }
  };

  const {
    requestConfirm: requestDeleteSection,
    confirm: confirmDeleteSection,
    cancel: cancelDeleteSection,
    isOpen: isOpenDeleteSection,
  } = useConfirmDelete<string>(handleDeleteSection);

  const {
    requestConfirm: requestRemoveRecipe,
    confirm: confirmRemoveRecipe,
    cancel: cancelRemoveRecipe,
    isOpen: isOpenRemoveRecipe,
  } = useConfirmDelete<string>(handleRemoveRecipe);


  if (loading) {
    return <div className="animate-pulse text-muted-foreground py-8 text-center">טוען...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ברירות מחדל לתכנון שבת</CardTitle>
          <CardDescription>
            המתכונים שתגדירו כאן יתווספו אוטומטית לכל שבת חדשה. תמיד ניתן להוסיף, להחליף או להסיר מתכונים בתכנון עצמו.
          </CardDescription>
        </CardHeader>
        {sections.length === 0 && (
          <CardContent>
            <Button size="sm" onClick={handleCreateBuiltIn}>
              <Plus className="h-4 w-4 ms-1" />
              צור חלקים ברירת מחדל
            </Button>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SLOTS.map(slot => {
          const slotSections = sections.filter(s => s.slot === slot.key);
          return (
            <Card key={slot.key}>
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{slot.label}</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => { setAddingSectionSlot(slot.key); setNewSectionName(''); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {addingSectionSlot === slot.key && (
                  <div className="flex gap-1.5">
                    <Input
                      autoFocus
                      className="h-8 text-xs"
                      placeholder="שם החלק"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddSection(slot.key); }}
                    />
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleAddSection(slot.key)}>הוסף</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setAddingSectionSlot(null)}>ביטול</Button>
                  </div>
                )}

                {slotSections.length === 0 && addingSectionSlot !== slot.key && (
                  <p className="text-xs text-muted-foreground">לא הוגדרו חלקים</p>
                )}

                {slotSections.map(section => (
                  <div key={section.id} className="rounded-md border p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{section.name}</span>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAddRecipeFor(section.id)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => requestDeleteSection(section.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {section.recipes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">אין מתכונים קבועים</p>
                    ) : (
                      <ul className="space-y-1">
                        {section.recipes.map(r => (
                          <li key={r.id} className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1">
                            <span>{r.recipe?.name || 'מתכון'}</span>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => requestRemoveRecipe(r.id)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}


                    {addRecipeFor === section.id && (
                      <RecipePicker recipes={recipes} onSelect={(r) => handleAddRecipe(section, r)} />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConfirmDeleteDialog
        open={isOpenDeleteSection}
        onOpenChange={cancelDeleteSection}
        onConfirm={confirmDeleteSection}
        title="מחיקת חלק ברירת מחדל"
        description="האם למחוק את החלק ואת כל המתכונים בו?"
      />

      <ConfirmDeleteDialog
        open={isOpenRemoveRecipe}
        onOpenChange={cancelRemoveRecipe}
        onConfirm={confirmRemoveRecipe}
        title="הסרת מתכון ברירת מחדל"
        description="האם להסיר את המתכון מרשימת ברירת המחדל? המתכון עצמו לא יימחק."
      />
    </div>
  );
};

