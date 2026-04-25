'use client';

/**
 * RiskBadge - Professional risk indicator with dot+label pills and citation support
 */

import React, { useState } from 'react';
import type { RiskSeverity } from '@/types/frontend';
import { getRiskSeverityLabel } from '@/lib/comparison-model';

interface RiskBadgeProps {
  severity: RiskSeverity;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  citationCount?: number;
  onCitationClick?: () => void;
}

// Custom label mapping for professional terminology
const severityLabels: Record<RiskSeverity, string> = {
  low: 'Low',
  medium: 'Moderate',
  high: 'Elevated',
  critical: 'High',
};

// Color schemes for dot+label pill style
const severityColors: Record<RiskSeverity, { 
  bg: string; 
  text: string; 
  border: string;
  dot: string;
}> = {
  low: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
  medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  critical: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
  },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-label',
  md: 'px-2.5 py-1 text-data',
  lg: 'px-3 py-1.5 text-body',
};

// Static bar colors for Tailwind JIT - must be literal strings
const severityBarColors: Record<RiskSeverity, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-rose-500',
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
  const label = severityLabels[severity];
  const hasCitations = citationCount > 0;
  
  const badgeContent = (
    <>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {showLabel && <span>{label}</span>}
    </>
  );
  
  if (hasCitations && onCitationClick) {
    return (
      <button
        onClick={onCitationClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          inline-flex items-center gap-1.5 rounded-md border font-medium transition-all
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
        <span className={`inline-flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full text-2xs bg-white/70 ${isHovered ? 'bg-white' : ''}`}>
          {citationCount}
        </span>
      </button>
    );
  }
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-md border font-medium
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

// Mini version - just colored dot with subtle styling and citation badge
interface RiskDotProps {
  severity: RiskSeverity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  citationCount?: number;
  onCitationClick?: () => void;
}

const dotSizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function RiskDot({ severity, size = 'sm', className = '', citationCount = 0, onCitationClick }: RiskDotProps) {
  const colors = severityColors[severity];
  const hasCitations = citationCount > 0 && onCitationClick;
  
  if (hasCitations) {
    return (
      <button
        onClick={onCitationClick}
        className={`inline-flex items-center justify-center ${className} hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 rounded`}
        aria-label={`Risk: ${severityLabels[severity]}. ${citationCount} source${citationCount !== 1 ? 's' : ''} available. Click to view.`}
        title={`Risk: ${severityLabels[severity]} (${citationCount} sources)`}
      >
        <span className="relative inline-flex items-center justify-center">
          <span className={`rounded-full ${dotSizeClasses[size]} ${colors.dot}`} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 text-white text-2xs rounded-full flex items-center justify-center">
            {citationCount}
          </span>
        </span>
      </button>
    );
  }
  
  return (
    <span 
      className={`inline-flex items-center justify-center ${className}`}
      title={`Risk: ${severityLabels[severity]}`}
    >
      <span className={`rounded-full ${dotSizeClasses[size]} ${colors.dot}`} />
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
        <span className="text-body-sm px-2 py-1 bg-gray-100 text-gray-500 rounded">N/A</span>
        <span className="text-body-sm text-gray-500">No risk factors assessed</span>
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
        <span className="text-body-sm text-gray-500">
          {risks.length} factors
        </span>
      </div>
    );
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <RiskBadge severity={overall} size="sm" showLabel />
        <span className="text-body-sm text-gray-500">
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
          <span className="text-body-sm text-gray-400">+{risks.length - 4}</span>
        )}
      </div>
    </div>
  );
}

export default RiskBadge;
