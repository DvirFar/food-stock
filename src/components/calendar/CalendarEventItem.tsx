import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Clock, Check, Pencil } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import type { CalendarEvent } from '@/services/monthlyCalendarService';


interface CalendarEventItemProps {
  event: CalendarEvent;
  onUpdate: (id: string, updates: { description?: string; time_display?: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const CalendarEventItem = ({ event, onUpdate, onDelete }: CalendarEventItemProps) => {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(event.description);
  const [time, setTime] = useState(event.time_display || '');
  const { requestConfirm, confirm, cancel, isOpen } = useConfirmDelete<string>(onDelete);

  const save = async () => {
    if (!desc.trim()) return;
    await onUpdate(event.id, {
      description: desc.trim(),
      time_display: time.trim() || null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 p-2 rounded-md border bg-background">
        <Input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="תיאור האירוע"
          className="h-8 text-sm"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') save(); }}
        />
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            value={time}
            onChange={e => setTime(e.target.value)}
            placeholder="09:00 או 09:00-10:30"
            className="h-7 text-xs flex-1"
            dir="ltr"
          />
        </div>
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>
            ביטול
          </Button>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={save} disabled={!desc.trim()}>
            <Check className="h-3 w-3 me-1" />
            שמור
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="group flex items-start gap-1.5 p-1.5 rounded-md hover:bg-accent/50 transition-colors">
        <div className="flex-1 min-w-0">
          {event.time_display && (
            <span className="text-[10px] font-mono text-primary/80 block leading-tight" dir="ltr">
              {event.time_display}
            </span>
          )}
          <p className="text-xs leading-tight break-words">{event.description}</p>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => setEditing(true)} className="p-0.5 rounded hover:bg-accent">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
          <button onClick={() => requestConfirm(event.id)} className="p-0.5 rounded hover:bg-destructive/20">
            <X className="h-3 w-3 text-destructive" />
          </button>
        </div>
      </div>
      <ConfirmDeleteDialog
        open={isOpen}
        onOpenChange={cancel}
        onConfirm={confirm}
        title="מחיקת אירוע"
        description="האם למחוק את האירוע?"
      />
    </>
  );
};

