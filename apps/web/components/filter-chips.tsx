"use client";

import { useState } from "react";

export interface FilterChip {
  id: string;
  label: string;
  icon?: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selected: string[];
  onSelect: (chipId: string, multiSelect?: boolean) => void;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
}

/**
 * Filter Chips Component
 * Compact button bar for filtering
 */
export function FilterChips({
  chips,
  selected,
  onSelect,
  showFilterButton = true,
  onFilterClick
}: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-white/5">
      {chips.map((chip) => {
        const isSelected = selected.includes(chip.id);
        return (
          <button
            key={chip.id}
            onClick={() => onSelect(chip.id, true)}
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] rounded-[4px] border transition-all ${
              isSelected
                ? "border-accent-red bg-accent-red/20 text-accent-red shadow-glow-red"
                : "border-white/20 bg-riot-darker/50 text-text-secondary hover:border-accent-red/50 hover:bg-riot-darker/80"
            }`}
          >
            {chip.icon && <span className="text-sm">{chip.icon}</span>}
            {chip.label}
          </button>
        );
      })}

      {/* Filter Button */}
      {showFilterButton && (
        <button
          onClick={onFilterClick}
          className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] rounded-[4px] border border-white/20 bg-riot-darker/50 text-text-secondary hover:border-accent-cyan/50 hover:text-accent-cyan transition-all ml-auto"
        >
          <span>🔍</span>
          Filtros
        </button>
      )}
    </div>
  );
}
