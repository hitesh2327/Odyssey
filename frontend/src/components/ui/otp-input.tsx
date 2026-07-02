'use client';

import React, { useRef, useState, useEffect } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled = false }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Synchronize state when value prop changes from outside
  useEffect(() => {
    const valDigits = value.split('').slice(0, length);
    const newDigits = [...valDigits, ...Array(length - valDigits.length).fill('')];
    setDigits(newDigits);
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return; // Allow numbers only

    const newDigits = [...digits];
    // Take last character if length > 1 (e.g. typing over existing)
    newDigits[index] = val.slice(-1);
    setDigits(newDigits);

    const newValue = newDigits.join('');
    onChange(newValue);

    // Auto-focus next input if user typed a digit
    if (newDigits[index] !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        // If current box is empty, delete previous digit and focus it
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        // Delete current digit
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pasteData)) return; // Allow numbers only

    const pasteDigits = pasteData.slice(0, length).split('');
    const newDigits = [...pasteDigits, ...Array(length - pasteDigits.length).fill('')];
    setDigits(newDigits);
    onChange(newDigits.join(''));

    // Focus last active input box
    const focusIndex = Math.min(pasteDigits.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2.5">
      {Array(length)
        .fill(0)
        .map((_, i) => (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[i]}
            disabled={disabled}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            ref={(el) => {
              if (el) inputRefs.current[i] = el;
            }}
            className="w-12 h-14 text-center font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 transition-all shadow-sm"
          />
        ))}
    </div>
  );
}
