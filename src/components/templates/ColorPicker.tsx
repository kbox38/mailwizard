/**
 * ============================================================================
 * Color Picker Component
 * ============================================================================
 *
 * Purpose: Color selection component for email template customization
 *
 * Features:
 * - Interactive color picker using react-colorful
 * - Preset color palette with brand colors
 * - Hex input for manual color entry
 * - Recent colors history
 * - Popover interface
 *
 * Props:
 * - color: Current color value (hex)
 * - onChange: Callback when color changes
 * - label: Label text for the picker
 *
 * Design System Compliance:
 * - Uses brand colors (gold, purple)
 * - Follows design system spacing and borders
 *
 * ============================================================================
 */

import { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

// Preset colors (brand colors + common email colors)
const PRESET_COLORS = [
  '#f3ba42', // Gold (brand)
  '#57377d', // Purple (brand)
  '#000000', // Black
  '#FFFFFF', // White
  '#F3F4F6', // Gray 100
  '#6B7280', // Gray 500
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(color);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load recent colors from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentColors');
    if (saved) {
      try {
        setRecentColors(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent colors');
      }
    }
  }, []);

  // Update hex input when color prop changes
  useEffect(() => {
    setHexInput(color);
  }, [color]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Handles color change from picker
   */
  function handleColorChange(newColor: string) {
    onChange(newColor);
    setHexInput(newColor);
    addToRecentColors(newColor);
  }

  /**
   * Handles manual hex input
   */
  function handleHexInputChange(value: string) {
    setHexInput(value);

    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
      addToRecentColors(value);
    }
  }

  /**
   * Adds color to recent colors history
   */
  function addToRecentColors(newColor: string) {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== newColor.toLowerCase());
      const updated = [newColor, ...filtered].slice(0, 10);
      localStorage.setItem('recentColors', JSON.stringify(updated));
      return updated;
    });
  }

  /**
   * Validates and formats hex color
   */
  function formatHexColor(value: string): string {
    // Remove any non-hex characters
    let hex = value.replace(/[^0-9A-F]/gi, '');

    // Ensure it starts with #
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }

    // Limit to 7 characters (#RRGGBB)
    return hex.slice(0, 7).toUpperCase();
  }

  return (
    <div className="relative">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Color Preview Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2 border-2 border-black rounded-full hover:shadow-sm transition-all bg-white"
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-black flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 text-left">
          <span className="text-sm font-medium text-gray-900">{color}</span>
        </div>
        <Palette className="w-5 h-5 text-gray-500" />
      </button>

      {/* Color Picker Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-50 mt-2 p-4 bg-white rounded-lg shadow-xl border-2 border-black"
          style={{ minWidth: '280px' }}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Color Picker */}
          <div className="mb-4">
            <HexColorPicker color={color} onChange={handleColorChange} />
          </div>

          {/* Hex Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hex Color
            </label>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInputChange(formatHexColor(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
              placeholder="#000000"
              maxLength={7}
            />
          </div>

          {/* Preset Colors */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Preset Colors
            </label>
            <div className="grid grid-cols-7 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => handleColorChange(presetColor)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color.toLowerCase() === presetColor.toLowerCase()
                      ? 'border-gold scale-110'
                      : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Recent Colors
              </label>
              <div className="flex flex-wrap gap-2">
                {recentColors.map((recentColor, index) => (
                  <button
                    key={`${recentColor}-${index}`}
                    type="button"
                    onClick={() => handleColorChange(recentColor)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color.toLowerCase() === recentColor.toLowerCase()
                        ? 'border-gold scale-110'
                        : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                    }`}
                    style={{ backgroundColor: recentColor }}
                    title={recentColor}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
