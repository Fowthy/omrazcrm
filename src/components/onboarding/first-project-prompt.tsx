'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOnboardingStore } from '@/store/onboarding';
import { projectStatuses, projectTypes } from '@/lib/utils';
import { Loader2, Rocket, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function FirstProjectPrompt() {
  const router = useRouter();
  const { showFirstProjectPrompt, dismissFirstProjectPrompt, hasSeenFirstProjectPrompt } = useOnboardingStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    type: 'album',
    status: 'idea',
  });

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (!res.ok) throw new Error('Failed to create project');

      const project = await res.json();
      toast.success('Project created! Let\'s start making music!');
      dismissFirstProjectPrompt();
      router.push(`/projects`);
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkip = () => {
    dismissFirstProjectPrompt();
  };

  // Don't show if already dismissed or never set to show
  if (!showFirstProjectPrompt || hasSeenFirstProjectPrompt) return null;

  return (
    <Dialog open={showFirstProjectPrompt} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Ready to Create?</DialogTitle>
              <DialogDescription>
                Let&apos;s set up your first project to get started!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g., New Album 2024, Summer Single..."
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea
              id="project-description"
              placeholder="What's this project about?"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newProject.type}
                onValueChange={(value) => setNewProject({ ...newProject, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={newProject.status}
                onValueChange={(value) => setNewProject({ ...newProject, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleSkip} className="sm:mr-auto">
            Skip for now
          </Button>
          <Button onClick={handleCreateProject} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
