'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  page: string; // Route path
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const onboardingSteps: OnboardingStep[] = [
  // Dashboard intro
  {
    id: 'welcome',
    target: '[data-onboarding="welcome"]',
    title: 'Welcome to Omraz Studio!',
    description: 'Your all-in-one band management and music production hub. Let\'s explore the key features.',
    page: '/dashboard',
    position: 'bottom',
  },
  {
    id: 'sidebar',
    target: '[data-onboarding="sidebar"]',
    title: 'Navigation',
    description: 'Access everything: Projects, Songs, Tasks, Rehearsals, MIDI Builder, Tools, Sample Library, and more.',
    page: '/dashboard',
    position: 'right',
  },
  // Projects page
  {
    id: 'projects-intro',
    target: '[data-onboarding="projects-header"]',
    title: 'Projects',
    description: 'Organize albums, EPs, and singles. Track progress from idea to release.',
    page: '/projects',
    position: 'bottom',
  },
  // Tools page
  {
    id: 'tools-intro',
    target: '[data-onboarding="tools-header"]',
    title: 'Music Tools',
    description: 'Practice tools: Metronome, Tuner, Ear Training, Piano, Drum Pads, and calculators for BPM, delay times, and more.',
    page: '/tools',
    position: 'bottom',
  },
  // MIDI Builder
  {
    id: 'midi-builder',
    target: '[data-onboarding="midi-header"]',
    title: 'MIDI Builder',
    description: 'Create and edit MIDI compositions with the piano roll editor. Add tracks, draw notes, and export to MIDI files.',
    page: '/midi-builder',
    position: 'bottom',
  },
  // Sample Library
  {
    id: 'samples',
    target: '[data-onboarding="samples-header"]',
    title: 'Sample Library',
    description: 'Upload and organize your audio samples - drums, synths, loops, and more. Preview and use them in your projects.',
    page: '/samples',
    position: 'bottom',
  },
];

interface OnboardingState {
  isOnboardingComplete: boolean;
  isOnboardingActive: boolean;
  currentStepIndex: number;
  showFirstProjectPrompt: boolean;
  hasSeenFirstProjectPrompt: boolean;

  // Actions
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  getCurrentStep: () => OnboardingStep | null;
  dismissFirstProjectPrompt: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isOnboardingComplete: false,
      isOnboardingActive: false,
      currentStepIndex: 0,
      showFirstProjectPrompt: false,
      hasSeenFirstProjectPrompt: false,

      startOnboarding: () => {
        set({ isOnboardingActive: true, currentStepIndex: 0 });
      },

      nextStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex < onboardingSteps.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
        } else {
          get().completeOnboarding();
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },

      skipOnboarding: () => {
        set({
          isOnboardingActive: false,
          isOnboardingComplete: true,
          showFirstProjectPrompt: true,
        });
      },

      completeOnboarding: () => {
        set({
          isOnboardingActive: false,
          isOnboardingComplete: true,
          showFirstProjectPrompt: true,
        });
      },

      getCurrentStep: () => {
        const { currentStepIndex, isOnboardingActive } = get();
        if (!isOnboardingActive) return null;
        return onboardingSteps[currentStepIndex] || null;
      },

      dismissFirstProjectPrompt: () => {
        set({ showFirstProjectPrompt: false, hasSeenFirstProjectPrompt: true });
      },

      resetOnboarding: () => {
        set({
          isOnboardingComplete: false,
          isOnboardingActive: false,
          currentStepIndex: 0,
          showFirstProjectPrompt: false,
          hasSeenFirstProjectPrompt: false,
        });
      },
    }),
    {
      name: 'omraz-onboarding',
    }
  )
);
