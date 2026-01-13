'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PEOPLE = ['Ivan', 'Alex', 'Deya'];

export function EasterEgg() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentDisplay, setCurrentDisplay] = useState(PEOPLE[0]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Mobile: track secret tap sequence (tap logo 5 times quickly)
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for the key combination: Shift + I + A + D
  const checkCombination = useCallback((keys: Set<string>) => {
    const hasShift = keys.has('Shift');
    const hasI = keys.has('i') || keys.has('I');
    const hasA = keys.has('a') || keys.has('A');
    const hasD = keys.has('d') || keys.has('D');
    return hasShift && hasI && hasA && hasD;
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      setPressedKeys((prev) => {
        const newKeys = new Set(prev);
        newKeys.add(e.key);

        if (checkCombination(newKeys) && !isOpen) {
          triggerEasterEgg();
        }

        return newKeys;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [checkCombination, isOpen]);

  // Mobile: Listen for taps on the logo area (sidebar logo)
  useEffect(() => {
    const handleLogoTap = () => {
      // Clear previous timeout
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      setTapCount((prev) => {
        const newCount = prev + 1;

        // If 7 taps reached, trigger easter egg
        if (newCount >= 7) {
          triggerEasterEgg();
          return 0;
        }

        return newCount;
      });

      // Reset tap count after 2 seconds of no taps
      tapTimeoutRef.current = setTimeout(() => {
        setTapCount(0);
      }, 2000);
    };

    // Find logo elements and attach listener
    const logoElements = document.querySelectorAll('[data-logo-easter-egg]');
    logoElements.forEach((el) => {
      el.addEventListener('click', handleLogoTap);
    });

    return () => {
      logoElements.forEach((el) => {
        el.removeEventListener('click', handleLogoTap);
      });
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  const triggerEasterEgg = () => {
    if (isOpen) return;
    setIsOpen(true);
    setIsRolling(true);
    setResult(null);
  };

  // Rolling animation
  useEffect(() => {
    if (!isRolling) return;

    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    // Rapidly cycle through names
    interval = setInterval(() => {
      setCurrentDisplay(PEOPLE[Math.floor(Math.random() * PEOPLE.length)]);
    }, 100);

    // After 4-5 seconds, stop and pick a result
    timeout = setTimeout(() => {
      clearInterval(interval);
      const finalResult = PEOPLE[Math.floor(Math.random() * PEOPLE.length)];
      setCurrentDisplay(finalResult);
      setResult(finalResult);
      setIsRolling(false);
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isRolling]);

  const handleClose = () => {
    setIsOpen(false);
    setIsRolling(false);
    setResult(null);
    setPressedKeys(new Set());
  };

  // Re-roll function
  const handleReroll = () => {
    setIsRolling(true);
    setResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md">
        {/* Close button - always visible */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/10 z-10"
          onClick={handleClose}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Dice container */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Title */}
          <h2 className="text-center text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center justify-center gap-2">
            <Dices className={cn("h-6 w-6 sm:h-8 sm:w-8", isRolling && "animate-spin")} />
            {isRolling ? 'Rolling...' : 'The Dice Has Spoken!'}
            <Dices className={cn("h-6 w-6 sm:h-8 sm:w-8", isRolling && "animate-spin")} />
          </h2>

          {/* Dice display */}
          <div
            className={cn(
              'bg-white rounded-xl p-6 sm:p-8 shadow-inner transition-all duration-100',
              isRolling && 'animate-pulse'
            )}
          >
            <div
              className={cn(
                'text-center text-3xl sm:text-4xl font-black transition-all',
                isRolling
                  ? 'text-gray-600 animate-bounce'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 scale-110'
              )}
            >
              {currentDisplay}
            </div>
          </div>

          {/* Result message */}
          {result && (
            <div className="mt-4 sm:mt-6 text-center animate-in fade-in zoom-in duration-300">
              <p className="text-lg sm:text-xl text-white font-semibold">
                🌈 {result} is gay! 🌈
              </p>
              <p className="text-white/60 text-xs sm:text-sm mt-2">
                The dice never lies...
              </p>
            </div>
          )}

          {/* Rolling indicator */}
          {isRolling && (
            <div className="mt-4 sm:mt-6 flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}

          {/* Action buttons */}
          {result && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <Button
                onClick={handleReroll}
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30 border-0"
              >
                <Dices className="mr-2 h-4 w-4" />
                Roll Again
              </Button>
              <Button
                onClick={handleClose}
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                Close
              </Button>
            </div>
          )}
        </div>

        {/* Secret hint for mobile */}
        <p className="text-center text-white/30 text-xs mt-4 sm:hidden">
          Tip: Tap the logo 7 times to roll again anytime
        </p>
      </div>
    </div>
  );
}

// Export a hook for triggering the easter egg programmatically
export function useEasterEgg() {
  const trigger = () => {
    const event = new CustomEvent('trigger-easter-egg');
    window.dispatchEvent(event);
  };

  return { trigger };
}
