'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Lightbulb,
  Plus,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InspirationPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newInspiration, setNewInspiration] = useState({
    title: '',
    type: 'idea',
    content: '',
    url: '',
    tags: '',
  });

  const handleCreateInspiration = async () => {
    if (!newInspiration.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsCreating(true);
    // TODO: Implement API call when inspiration API is ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Inspiration saved!');
    setIsCreateDialogOpen(false);
    setNewInspiration({
      title: '',
      type: 'idea',
      content: '',
      url: '',
      tags: '',
    });
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inspiration Board</h1>
          <p className="mt-1 text-zinc-400">
            Save references, ideas, and creative inspiration
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Inspiration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inspiration</DialogTitle>
              <DialogDescription>
                Save a reference, idea, or creative inspiration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Give it a name"
                  value={newInspiration.title}
                  onChange={(e) =>
                    setNewInspiration({ ...newInspiration, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newInspiration.type}
                  onValueChange={(value) =>
                    setNewInspiration({ ...newInspiration, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="reference_track">Reference Track</SelectItem>
                    <SelectItem value="mood_board">Mood Board</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>URL (optional)</Label>
                <Input
                  placeholder="https://"
                  value={newInspiration.url}
                  onChange={(e) =>
                    setNewInspiration({ ...newInspiration, url: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="What makes this inspiring?"
                  value={newInspiration.content}
                  onChange={(e) =>
                    setNewInspiration({ ...newInspiration, content: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  placeholder="guitar, tone, production"
                  value={newInspiration.tags}
                  onChange={(e) =>
                    setNewInspiration({ ...newInspiration, tags: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInspiration} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Lightbulb className="h-12 w-12 text-zinc-500" />
          <h3 className="mt-4 text-lg font-medium text-white">No inspiration saved</h3>
          <p className="mt-2 text-sm text-zinc-400 text-center max-w-md">
            Collect ideas, reference tracks, mood boards, articles, and videos
            that inspire your music and creative direction.
          </p>
          <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Save Your First Inspiration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
