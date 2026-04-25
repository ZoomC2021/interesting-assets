'use client';

import React from 'react';
import { SectionHeader } from '../SectionHeader';
import { RiskChip } from '../RiskChip';
import { CitationChip } from '../CitationChip';
import { Sparkline } from '../Sparkline';
import { Callout } from '../Callout';
import { Figure } from '../Figure';

const sampleDpuHistory = [7.2, 7.5, 8.0, 8.2, 8.5];

const swatchClasses: Record<string, string> = {
  canvas: 'bg-canvas',
  surface: 'bg-surface',
  'surface-alt': 'bg-surface-alt',
  stroke: 'bg-stroke',
  'stroke-strong': 'bg-stroke-strong',
  ink: 'bg-ink',
  'ink-muted': 'bg-ink-muted',
  'ink-faint': 'bg-ink-faint',
  accent: 'bg-accent',
  'accent-hover': 'bg-accent-hover',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  highlight: 'bg-highlight',
};

function ColorSwatch({ name }: { name: keyof typeof swatchClasses }) {
  return (
    <div>
      <div className={`mb-2 h-16 w-16 rounded border border-stroke ${swatchClasses[name]}`} />
      <div className="text-2xs font-medium text-ink-muted">{name}</div>
      <div className="font-data text-2xs text-ink-faint">{`var(--${name})`}</div>
    </div>
  );
}

function TypeSample({ size, label }: { size: string; label: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <div className="w-24 text-data-sm text-ink-muted">{label}</div>
      <div className={`${size} text-ink`}>The quick brown fox</div>
    </div>
  );
}

export function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">
        <div className="mb-12">
          <h1 className="mb-2 text-3xl font-bold text-ink">Design System</h1>
          <p className="text-ink-muted">Visual language and component library for the REIT Research Platform</p>
        </div>

        <section className="mb-16">
          <SectionHeader label="Foundation" title="Color Tokens" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {Object.keys(swatchClasses).map((name) => (
              <ColorSwatch key={name} name={name as keyof typeof swatchClasses} />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <SectionHeader label="Foundation" title="Typography Scale" />
          <div className="space-y-3 rounded border border-stroke bg-surface p-6">
            <TypeSample size="text-xs" label="xs" />
            <TypeSample size="text-sm" label="sm" />
            <TypeSample size="text-base" label="base" />
            <TypeSample size="text-lg" label="lg" />
            <TypeSample size="text-xl" label="xl" />
            <TypeSample size="text-2xl" label="2xl" />
            <div>
              <div className="mb-1 text-label">Data style</div>
              <p className="text-data">1,234.56 8.50 95.1% 4.2x</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <SectionHeader label="Components" title="Core Components" />
          <div className="space-y-8">
            <div className="rounded border border-stroke bg-surface p-6">
              <div className="mb-3 text-label">Risk chips</div>
              <div className="flex flex-wrap items-center gap-3">
                <RiskChip level="low" />
                <RiskChip level="moderate" />
                <RiskChip level="moderate-high" />
                <RiskChip level="high" />
              </div>
            </div>

            <div className="rounded border border-stroke bg-surface p-6">
              <div className="mb-3 text-label">Citation chips</div>
              <div className="flex items-center gap-3">
                <CitationChip id="T:127" />
                <CitationChip id="A:88" />
                <CitationChip id="S:42" />
              </div>
            </div>

            <div className="rounded border border-stroke bg-surface p-6">
              <div className="mb-3 text-label">Sparkline</div>
              <Sparkline data={sampleDpuHistory} width={400} height={80} className="w-full" />
            </div>
          </div>
        </section>

        <section className="mb-16">
          <SectionHeader label="Components" title="Editorial Blocks" />
          <Callout type="fact">
            Fixed-rate debt coverage and documentation density can sit inside lightweight callout treatments without
            pulling the reader away from the memo.
          </Callout>
          <Callout type="risk">
            A restrained system still needs clear warning states for leverage, rollover, or tenant concentration.
          </Callout>
          <Callout type="thesis">
            The overall tone is meant to feel like institutional research rather than a generic SaaS dashboard.
          </Callout>
          <Figure caption="Example figure block" source="Sample memo source [T:127]">
            <div className="flex h-40 items-end gap-3">
              <div className="h-[55%] w-12 bg-accent" />
              <div className="h-[70%] w-12 bg-accent/80" />
              <div className="h-[82%] w-12 bg-accent/60" />
              <div className="h-[64%] w-12 bg-accent/40" />
            </div>
          </Figure>
        </section>
      </div>
    </div>
  );
}
