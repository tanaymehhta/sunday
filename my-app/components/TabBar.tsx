import React from "react";

interface Tab {
  id: string;
  icon: string;
  label: string;
}

interface TabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const tabs: Tab[] = [
  { id: "record", icon: "🎙️", label: "Record" },
  { id: "insights", icon: "📊", label: "Insights" },
];

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="tab-icon">{tab.icon}</div>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default TabBar;
