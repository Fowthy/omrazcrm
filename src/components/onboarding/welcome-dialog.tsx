'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOnboardingStore } from '@/store/onboarding';
import { Sparkles, Rocket, SkipForward } from 'lucide-react';

export function WelcomeDialog() {
  const { isOnboardingComplete, isOnboardingActive, startOnboarding, skipOnboarding } = useOnboardingStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show welcome dialog if onboarding hasn't been completed and isn't active
    if (!isOnboardingComplete && !isOnboardingActive) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingComplete, isOnboardingActive]);

  const handleStartTour = () => {
    setIsOpen(false);
    startOnboarding();
  };

  const handleSkip = () => {
    setIsOpen(false);
    skipOnboarding();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl">Welcome to Omraz Studio!</DialogTitle>
          <DialogDescription className="text-base">
            Band management and music production hub. Create, collaborate, and perform.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs">
                1
              </div>
              <div className="text-sm">
                <span className="font-medium text-white">Projects & Songs</span>
                <span className="text-zinc-400"> - Organize your music</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs">
                2
              </div>
              <div className="text-sm">
                <span className="font-medium text-white">MIDI Builder</span>
                <span className="text-zinc-400"> - Create compositions</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs">
                3
              </div>
              <div className="text-sm">
                <span className="font-medium text-white">Tools & Samples</span>
                <span className="text-zinc-400"> - Tuner, metronome, library</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs">
                4
              </div>
              <div className="text-sm">
                <span className="font-medium text-white">Band Management</span>
                <span className="text-zinc-400"> - Tasks, shows, rehearsals</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleStartTour} className="w-full" size="lg">
            <Rocket className="mr-2 h-4 w-4" />
            Take a Quick Tour
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="w-full">
            <SkipForward className="mr-2 h-4 w-4" />
            Skip, I&apos;ll explore on my own
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
