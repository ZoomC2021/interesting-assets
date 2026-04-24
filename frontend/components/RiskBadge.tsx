'use client';

/**
 * RiskBadge - Compact risk indicator with emoji colors and citation support
 */

import React, { useState } from 'react';
import type { RiskSeverity } from '@/types/frontend';
import { getRiskSeverityEmoji, getRiskSeverityLabel } from '@/lib/comparison-model';

interface RiskBadgeProps {
  severity: RiskSeverity;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  citationCount?: number;
  onCitationClick?: () => void;
}

const severityColors: Record<RiskSeverity, { bg: string; text: string; border: string }> = {
  low: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

// Static bar colors for Tailwind JIT - must be literal strings
const severityBarColors: Record<RiskSeverity, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export function RiskBadge({
  severity,
  size = 'sm',
  showLabel = false,
  className = '',
  citationCount = 0,
  onCitationClick,
}: RiskBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = severityColors[severity];
  const emoji = getRiskSeverityEmoji(severity);
  const label = getRiskSeverityLabel(severity);
  const hasCitations = citationCount > 0;
  
  const badgeContent = (
    <>
      <span className="leading-none">{emoji}</span>
      {showLabel && <span className="leading-none">{label}</span>}
    </>
  );
  
  if (hasCitations && onCitationClick) {
    return (
      <button
        onClick={onCitationClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          inline-flex items-center gap-1 rounded-full border font-medium transition-all
          ${colors.bg} ${colors.text} ${colors.border}
          ${sizeClasses[size]}
          ${className}
          hover:ring-2 hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-offset-1
          ${isHovered ? 'ring-2 ring-offset-1' : ''}
        `}
        aria-label={`Risk: ${label}. ${citationCount} source${citationCount !== 1 ? 's' : ''} available. Click to view.`}
        title={`Risk: ${label} (${citationCount} sources)`}
      >
        {badgeContent}
        <span className={`inline-flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full text-[10px] bg-white/50 ${isHovered ? 'bg-white' : ''}`}>
          {citationCount}
        </span>
      </button>
    );
  }
  
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
        ${className}
      `}
      title={`Risk: ${label}`}
    >
      {badgeContent}
    </span>
  );
}

// Mini version - just emoji with subtle styling
interface RiskDotProps {
  severity: RiskSeverity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  citationCount?: number;
  onCitationClick?: () => void;
}

export function RiskDot({ severity, size = 'sm', className = '', citationCount = 0, onCitationClick }: RiskDotProps) {
  const emoji = getRiskSeverityEmoji(severity);
  const hasCitations = citationCount > 0 && onCitationClick;
  
  if (hasCitations) {
    return (
      <button
        onClick={onCitationClick}
        className={`inline-flex items-center justify-center ${className} hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 rounded`}
        aria-label={`Risk: ${getRiskSeverityLabel(severity)}. ${citationCount} source${citationCount !== 1 ? 's' : ''} available. Click to view.`}
        title={`Risk: ${getRiskSeverityLabel(severity)} (${citationCount} sources)`}
      >
        <span className="relative">
          {emoji}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 text-white text-[8px] rounded-full flex items-center justify-center">
            {citationCount}
          </span>
        </span>
      </button>
    );
  }
  
  return (
    <span 
      className={`inline-flex items-center justify-center ${className}`}
      title={`Risk: ${getRiskSeverityLabel(severity)}`}
    >
      {emoji}
    </span>
  );
}

// Risk bar for showing relative risk levels
interface RiskBarProps {
  value: number; // 0-100
  severity: RiskSeverity;
  className?: string;
  citationCount?: number;
  onCitationClick?: () => void;
}

export function RiskBar({ value, severity, className = '', citationCount = 0, onCitationClick }: RiskBarProps) {
  const hasCitations = citationCount > 0 && onCitationClick;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${severityBarColors[severity]}`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      <RiskBadge 
        severity={severity} 
        size="sm" 
        citationCount={citationCount}
        onCitationClick={onCitationClick}
      />
    </div>
  );
}

// Overall risk rating with multiple factors
interface RiskSummaryProps {
  risks: Array<{
    category: string;
    severity: RiskSeverity;
    citationCount?: number;
  }>;
  showDetails?: boolean;
  className?: string;
  onCitationClick?: (category: string) => void;
}

export function RiskSummary({ risks, showDetails = false, className = '', onCitationClick }: RiskSummaryProps) {
  // Handle empty risks array - render neutral state
  if (risks.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">N/A</span>
        <span className="text-xs text-gray-500">No risk factors assessed</span>
      </div>
    );
  }

  // Count by severity
  const counts = risks.reduce((acc, r) => {
    acc[r.severity] = (acc[r.severity] || 0) + 1;
    return acc;
  }, {} as Record<RiskSeverity, number>);
  
  // Determine overall
  const overall = counts.critical > 0 
    ? 'critical'
    : counts.high > 0 
      ? 'high'
      : counts.medium > 0 
        ? 'medium'
        : 'low';
  
  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <RiskBadge severity={overall} size="sm" showLabel />
        <span className="text-xs text-gray-500">
          {risks.length} factors
        </span>
      </div>
    );
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <RiskBadge severity={overall} size="sm" showLabel />
        <span className="text-xs text-gray-500">
          {risks.length} risk factors assessed
        </span>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {risks.slice(0, 4).map((risk, idx) => (
          <RiskBadge 
            key={idx} 
            severity={risk.severity} 
            size="sm"
            citationCount={risk.citationCount}
            onCitationClick={onCitationClick ? () => onCitationClick(risk.category) : undefined}
          />
        ))}
        {risks.length > 4 && (
          <span className="text-xs text-gray-400">+{risks.length - 4}</span>
        )}
      </div>
    </div>
  );
}

export default RiskBadge;
