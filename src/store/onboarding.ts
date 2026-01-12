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
    description: 'This is your band management hub. Let me show you around the key features.',
    page: '/dashboard',
    position: 'bottom',
  },
  {
    id: 'sidebar',
    target: '[data-onboarding="sidebar"]',
    title: 'Navigation Sidebar',
    description: 'Access all features from here: Projects, Songs, Tasks, Setlists, Rehearsals, Finances, Gear, and more.',
    page: '/dashboard',
    position: 'right',
  },
  {
    id: 'quick-actions',
    target: '[data-onboarding="quick-actions"]',
    title: 'Quick Actions',
    description: 'Create new projects, songs, tasks, and schedule rehearsals with one click.',
    page: '/dashboard',
    position: 'bottom',
  },
  // Projects page
  {
    id: 'projects-intro',
    target: '[data-onboarding="projects-header"]',
    title: 'Projects',
    description: 'Organize your music into projects - albums, EPs, singles, or demos. Track progress from idea to release.',
    page: '/projects',
    position: 'bottom',
  },
  {
    id: 'create-project',
    target: '[data-onboarding="create-project"]',
    title: 'Create Your First Project',
    description: 'Click here to start a new project. Give it a name, choose a type, and start adding songs!',
    page: '/projects',
    position: 'left',
  },
  // Tasks page
  {
    id: 'tasks-intro',
    target: '[data-onboarding="tasks-header"]',
    title: 'Task Board',
    description: 'Manage band tasks with this Kanban board. Drag tasks between columns to update their status.',
    page: '/tasks',
    position: 'bottom',
  },
  {
    id: 'create-task',
    target: '[data-onboarding="create-task"]',
    title: 'Create Tasks',
    description: 'Add tasks for recording sessions, mixing, artwork, promotion - anything the band needs to do.',
    page: '/tasks',
    position: 'left',
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
