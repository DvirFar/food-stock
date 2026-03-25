import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useSettings } from '@/hooks/useSettings';

interface ProductTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
}

export const ProductTagInput = ({ tags, onChange, label = 'תגיות' }: ProductTagInputProps) => {
  const [newTag, setNewTag] = useState('');
  const [open, setOpen] = useState(false);
  const { productTags } = useSettings();

  const availableTags = productTags
    .map(t => t.name)
    .filter(name => !tags.includes(name) && name !== 'low-stock');

  const addTag = (tag?: string) => {
    const value = (tag || newTag).trim().toLowerCase();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
      setNewTag('');
      setOpen(false);
    }
  };

  const removeTag = (tag: string) => {
    if (tag === 'low-stock') return; // system-managed tag
    onChange(tags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Input
              value={newTag}
              onChange={(e) => {
                setNewTag(e.target.value);
                if (e.target.value) setOpen(true);
              }}
              onFocus={() => { if (availableTags.length > 0) setOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="הוסף תגית..."
            />
          </PopoverTrigger>
          {availableTags.length > 0 && (
            <PopoverContent className="p-0 w-[200px]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
              <Command>
                <CommandList>
                  <CommandEmpty>אין תגיות מתאימות</CommandEmpty>
                  <CommandGroup>
                    {availableTags
                      .filter(t => !newTag || t.includes(newTag.toLowerCase()))
                      .map(tagName => (
                        <CommandItem
                          key={tagName}
                          value={tagName}
                          onSelect={() => addTag(tagName)}
                        >
                          {tagName}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
        <Button type="button" variant="outline" size="icon" onClick={() => addTag()} disabled={!newTag.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tags.filter(t => t !== 'low-stock').length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.filter(t => t !== 'low-stock').map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
