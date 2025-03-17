import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';

interface HistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comics: any[];
  onViewComic: (comic: any) => void;
}

export function HistoryModal({ open, onOpenChange, comics, onViewComic }: HistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Comic History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full pr-4">
          <div className="space-y-4">
            {comics.map((comic) => (
              <div
                key={comic.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{comic.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comic.created_at), { addSuffix: true })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {comic.panel_count} panels 
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onViewComic(comic)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
