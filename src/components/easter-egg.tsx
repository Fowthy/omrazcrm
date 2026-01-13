'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PEOPLE = ['Ivan', 'Alex', 'Deya'];

export function EasterEgg() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentDisplay, setCurrentDisplay] = useState(PEOPLE[0]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Check for the key combination: Shift + I + A + D
  const checkCombination = useCallback((keys: Set<string>) => {
    const hasShift = keys.has('Shift');
    const hasI = keys.has('i') || keys.has('I');
    const hasA = keys.has('a') || keys.has('A');
    const hasD = keys.has('d') || keys.has('D');
    return hasShift && hasI && hasA && hasD;
  }, []);

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
          setIsOpen(true);
          setIsRolling(true);
          setResult(null);
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

  // Rolling animation
  useEffect(() => {
    if (!isRolling) return;

    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    let rollCount = 0;

    // Rapidly cycle through names
    interval = setInterval(() => {
      rollCount++;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        {/* Close button */}
        {result && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-12 right-0 text-white hover:bg-white/10"
            onClick={handleClose}
          >
            <X className="h-6 w-6" />
          </Button>
        )}

        {/* Dice container */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl">
          {/* Title */}
          <h2 className="text-center text-2xl font-bold text-white mb-6">
            {isRolling ? '🎲 Rolling the dice... 🎲' : '🎲 The Dice Has Spoken! 🎲'}
          </h2>

          {/* Dice display */}
          <div
            className={cn(
              'bg-white rounded-xl p-8 shadow-inner transition-all duration-100',
              isRolling && 'animate-pulse'
            )}
          >
            <div
              className={cn(
                'text-center text-4xl font-black transition-all',
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
            <div className="mt-6 text-center">
              <p className="text-xl text-white font-semibold animate-pulse">
                🌈 {result} is gay! 🌈
              </p>
              <p className="text-white/60 text-sm mt-2">
                The dice never lies...
              </p>
            </div>
          )}

          {/* Rolling indicator */}
          {isRolling && (
            <div className="mt-6 flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}

          {/* Close instruction */}
          {result && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleClose}
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
