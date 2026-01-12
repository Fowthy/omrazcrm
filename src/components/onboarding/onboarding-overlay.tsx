'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboardingStore, onboardingSteps } from '@/store/onboarding';
import { X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export function OnboardingOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isOnboardingActive,
    currentStepIndex,
    nextStep,
    prevStep,
    skipOnboarding,
    getCurrentStep,
  } = useOnboardingStore();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const currentStep = getCurrentStep();

  const updateTargetPosition = useCallback(() => {
    if (!currentStep) return;

    const element = document.querySelector(currentStep.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentStep]);

  // Navigate to the correct page for the current step
  useEffect(() => {
    if (!currentStep || !isOnboardingActive) return;

    if (pathname !== currentStep.page) {
      router.push(currentStep.page);
    }
  }, [currentStep, pathname, router, isOnboardingActive]);

  // Update target position when step changes or after navigation
  useEffect(() => {
    if (!isOnboardingActive || !currentStep) return;

    // Wait for page to render
    const timer = setTimeout(() => {
      updateTargetPosition();
    }, 300);

    // Update on resize
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [isOnboardingActive, currentStep, pathname, updateTargetPosition]);

  if (!isOnboardingActive || !currentStep) return null;

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%' };

    const padding = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 200;

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
      default:
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    }

    // Keep tooltip in viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    return { top: `${top}px`, left: `${left}px` };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay with hole for target */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && isVisible && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight ring around target */}
      {targetRect && isVisible && (
        <div
          className="absolute pointer-events-none border-2 border-violet-500 rounded-lg animate-pulse"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip Card */}
      <Card
        className="absolute pointer-events-auto w-[360px] bg-zinc-900 border-violet-500/50 shadow-2xl shadow-violet-500/20"
        style={tooltipPosition}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <CardTitle className="text-lg">{currentStep.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={skipOnboarding}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">{currentStep.description}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-zinc-500">
            {currentStepIndex + 1} of {onboardingSteps.length}
          </div>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={nextStep}>
              {currentStepIndex === onboardingSteps.length - 1 ? (
                'Finish'
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
