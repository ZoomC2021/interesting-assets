'use client';

/**
 * RiskMatrix - Risk assessment matrix with citation links
 */

import { useState } from 'react';
import clsx from 'clsx';
import type { NormalizedReitData, RiskCategory, RiskSeverity } from '@/types/frontend';
import { getRiskSeverityColor, getRiskSeverityEmoji, getRiskSeverityLabel } from '@/lib/comparison-model';

interface RiskMatrixProps {
  entities: NormalizedReitData[];
  onCitationClick?: (citationIds: string[]) => void;
  /**
   * When true, no outer card frame (parent already provides border/padding).
   * When false, renders the bordered panel (e.g. standalone on Compare).
   */
  embedInPanel?: boolean;
}

const RISK_CATEGORIES: { key: RiskCategory; label: string; description: string }[] = [
  { key: 'concentration', label: 'Concentration', description: 'Tenant/property concentration risk' },
  { key: 'gearing', label: 'Gearing', description: 'Debt leverage level' },
  { key: 'interest_rate', label: 'Interest Rate', description: 'Sensitivity to rate changes' },
  { key: 'tenant_rollover', label: 'Tenant Rollover', description: 'Lease expiry/WALE risk' },
  { key: 'liquidity', label: 'Liquidity', description: 'Trading liquidity' },
  { key: 'governance', label: 'Governance', description: 'Management structure' },
];

export function RiskMatrix({ entities, onCitationClick, embedInPanel = false }: RiskMatrixProps) {
  const severityOrder: RiskSeverity[] = ['low', 'medium', 'high', 'critical'];
  const [hoveredCell, setHoveredCell] = useState<{entityId: string; category: RiskCategory} | null>(null);
  
  return (
    <div
      className={clsx(
        'w-full overflow-hidden',
        embedInPanel ? 'rounded-md' : 'rounded-xl border border-stroke bg-surface',
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-data leading-4 text-ink" role="grid" aria-label="Risk assessment matrix">
          <thead>
            <tr className="bg-surfaceAlt border-b border-stroke">
              <th
                scope="col"
                className="text-left py-2 px-3 font-semibold text-muted"
              >
                <span className="text-label">Risk Category</span>
              </th>
              {entities.map(entity => (
                <th
                  key={entity.entity.id}
                  scope="col"
                  className="text-center py-2 px-3 font-semibold text-muted"
                >
                  <span className="text-label">{entity.entity.code}</span>
                </th>
              ))}
              <th
                scope="col"
                className="text-left py-2 px-3 font-semibold text-muted"
              >
                <span className="text-label">Description</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {RISK_CATEGORIES.map((category, idx) => (
              <tr 
                key={category.key}
                className={idx > 0 ? 'border-t border-stroke' : ''}
              >
                <td className="py-2 px-3" role="rowheader">
                  <p className="font-medium text-ink">{category.label}</p>
                </td>
                
                {entities.map(entity => {
                  const riskFactor = entity.riskAssessment.riskFactors.find(
                    rf => rf.category === category.key
                  );
                  const severity = riskFactor?.severity || 'low';
                  const citationCount = riskFactor?.sourceDisplayIds?.length || 0;
                  const hasCitations = citationCount > 0;
                  const isHovered = hoveredCell?.entityId === entity.entity.id && hoveredCell?.category === category.key;
                  
                  return (
                    <td 
                      key={entity.entity.id} 
                      className="py-2 px-3 text-center" 
                      role="gridcell"
                    >
                      <button
                        onClick={() => {
                          if (hasCitations && riskFactor && onCitationClick) {
                            onCitationClick(riskFactor.sourceDisplayIds);
                          }
                        }}
                        onMouseEnter={() => setHoveredCell({ entityId: entity.entity.id, category: category.key })}
                        onMouseLeave={() => setHoveredCell(null)}
                        disabled={!hasCitations}
                        className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-data font-medium leading-tight transition-all ${
                          hasCitations
                            ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-offset-1'
                            : 'cursor-default'
                        } ${isHovered && hasCitations ? 'ring-2 ring-offset-1' : ''}`}
                        style={{
                          backgroundColor: `${getRiskSeverityColor(severity)}20`,
                          color: getRiskSeverityColor(severity),
                        }}
                        aria-label={hasCitations 
                          ? `${category.label} risk for ${entity.entity.code}: ${getRiskSeverityLabel(severity)}. ${citationCount} source${citationCount !== 1 ? 's' : ''} available.`
                          : `${category.label} risk for ${entity.entity.code}: ${getRiskSeverityLabel(severity)}`
                        }
                        title={hasCitations ? `${riskFactor?.description || ''} (${citationCount} sources)` : riskFactor?.description}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{getRiskSeverityEmoji(severity)}</span>
                          <span>{getRiskSeverityLabel(severity)}</span>
                        </span>
                        {hasCitations && (
                          <span className="text-body-sm opacity-70 flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {citationCount}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
                
                <td className="py-2 px-3">
                  <p className="text-muted leading-snug">{category.description}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="bg-surfaceAlt px-3 py-2 border-t border-stroke">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label leading-4">
          <span className="font-medium uppercase tracking-wide text-muted">Risk level</span>
          {severityOrder.map(severity => (
            <div key={severity} className="flex items-center gap-1 text-ink">
              <span>{getRiskSeverityEmoji(severity)}</span>
              <span className="capitalize">{severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RiskMatrix;
