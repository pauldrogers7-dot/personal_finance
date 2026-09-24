import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CalculatingInputProps {
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  min?: string;
  step?: string;
  id?: string;
}

function evaluateExpression(expr: string): number | null {
  // Remove all whitespace
  const cleaned = expr.replace(/\s/g, '');
  
  // Allow only safe characters: digits, operators, decimals, parentheses
  if (!/^[\d+\-*/().]+$/.test(cleaned)) return null;
  
  try {
    // Use Function to safely evaluate the expression
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${cleaned})`)();
    if (typeof result === 'number' && isFinite(result)) {
      return Math.round(result * 100) / 100; // Round to 2 decimal places
    }
    return null;
  } catch {
    return null;
  }
}

export const CalculatingInput: React.FC<CalculatingInputProps> = ({
  value,
  onChange,
  placeholder = '0.00',
  className,
  min,
  step,
  id,
}) => {
  const [rawInput, setRawInput] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [previewValue, setPreviewValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    // Show current value as editable text
    setRawInput(value !== 0 && value !== '' ? String(value) : '');
    setPreviewValue(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setRawInput(input);

    // Check if expression contains operators (not just a plain number with - prefix)
    const hasOperator = /[\d]+[\+\-\*\/]/.test(input);
    
    if (hasOperator) {
      const result = evaluateExpression(input);
      if (result !== null) {
        setPreviewValue(`= ${result}`);
      } else {
        setPreviewValue(null);
      }
    } else {
      setPreviewValue(null);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setPreviewValue(null);

    if (rawInput === '' || rawInput === '-') {
      onChange(0);
      setRawInput('');
      return;
    }

    // Try to evaluate as expression first
    const hasOperator = /[\d]+[\+\-\*\/]/.test(rawInput);
    if (hasOperator) {
      const result = evaluateExpression(rawInput);
      if (result !== null) {
        onChange(result);
        setRawInput('');
        return;
      }
    }

    // Try plain number
    const num = parseFloat(rawInput);
    if (!isNaN(num)) {
      onChange(num);
    }
    setRawInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const displayValue = isFocused
    ? rawInput
    : (value !== 0 && value !== '' ? String(value) : '');

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onSelect={(e) => {
          // Auto-select all on focus
          if (isFocused && rawInput === '' && value !== 0) {
            (e.target as HTMLInputElement).select();
          }
        }}
        placeholder={placeholder}
        className={cn(className, previewValue ? 'border-primary ring-1 ring-primary' : '')}
        min={min}
        step={step}
      />
      {previewValue && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-primary bg-background px-1 rounded pointer-events-none">
          {previewValue}
        </div>
      )}
      {isFocused && !previewValue && rawInput === '' && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          e.g. 100-50
        </div>
      )}
    </div>
  );
};
