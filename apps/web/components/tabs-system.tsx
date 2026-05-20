"use client";

import { useState, ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  icon?: string;
}

interface TabsSystemProps {
  tabs: TabItem[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  sticky?: boolean;
}

/**
 * Tabs System Component with animated underline indicator
 */
export function TabsSystem({
  tabs,
  defaultTab,
  onTabChange,
  sticky = true
}: TabsSystemProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const tabWidth = 100 / tabs.length;

  return (
    <div className={sticky ? "sticky top-16 z-40 bg-riot-darkest/95 backdrop-blur-sm" : ""}>
      {/* Tab Headers */}
      <div className="relative border-b border-white/5">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 px-4 py-4 text-xs font-heading uppercase font-semibold tracking-[0.06em] transition-colors relative ${
                activeTab === tab.id ? "text-accent-red" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.icon && <span className="text-base">{tab.icon}</span>}
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Animated Underline Indicator */}
        <div
          className="absolute bottom-0 h-1 bg-gradient-to-r from-accent-red to-accent-red/50 transition-all duration-300 ease-out"
          style={{
            left: `${activeTabIndex * tabWidth}%`,
            width: `${tabWidth}%`
          }}
        />
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}
