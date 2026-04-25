'use client';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { slugifyHeading } from '@/lib/memo-outline';
import type { ResearchCitation } from '@/data/reits';
import { CitationChip } from './CitationChip';

interface MemoMarkdownProps {
  markdown: string;
  citations?: ResearchCitation[];
  onCitationClick?: (id: string) => void;
}

function headingText(children: ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  if (typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(headingText).join('');
  }
  if (children && typeof children === 'object') {
    const maybeElement = children as unknown as { props?: { children?: ReactNode } };
    if (maybeElement.props && 'children' in maybeElement.props) {
      return headingText(maybeElement.props.children);
    }
  }
  return '';
}

// Citation reference pattern: [T:127], [U:36], [A:001], etc.
const CITATION_PATTERN = /\[([A-Z]:\d{1,3})\]/g;

/**
 * Parse text for citation references and render as clickable chips.
 * Returns an array of React nodes (text and citation chips).
 */
function parseCitationReferences(
  text: string,
  citationMap: Map<string, ResearchCitation>,
  onCitationClick?: (id: string) => void,
): ReactNode[] {
  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  CITATION_PATTERN.lastIndex = 0;

  while ((match = CITATION_PATTERN.exec(text)) !== null) {
    const [fullMatch, citationId] = match;
    const matchIndex = match.index;

    // Add text before the citation
    if (matchIndex > lastIndex) {
      result.push(text.slice(lastIndex, matchIndex));
    }

    // Check if citation exists in the citation map
    const citation = citationMap.get(citationId);
    if (citation && onCitationClick) {
      // Render as clickable chip
      result.push(
        <CitationChip
          key={`${citationId}-${matchIndex}`}
          id={citationId}
          onClick={() => onCitationClick(citation.id)}
        />,
      );
    } else {
      // Unknown citation - render as plain text
      result.push(fullMatch);
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  // If no citations found, return original text as single element
  if (result.length === 0) {
    return [text];
  }

  return result;
}

/**
 * Recursively process React nodes to transform text nodes containing citation references.
 */
function processNodeForCitations(
  node: ReactNode,
  citationMap: Map<string, ResearchCitation>,
  onCitationClick?: (id: string) => void,
): ReactNode {
  // Handle string nodes (text content)
  if (typeof node === 'string') {
    const parsed = parseCitationReferences(node, citationMap, onCitationClick);
    if (parsed.length === 1 && typeof parsed[0] === 'string' && parsed[0] === node) {
      return node; // No citations found, return original
    }
    return <>{parsed}</>;
  }

  // Handle number nodes
  if (typeof node === 'number') {
    return node;
  }

  // Handle arrays (fragments with multiple children)
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <span key={index}>{processNodeForCitations(child, citationMap, onCitationClick)}</span>
    ));
  }

  // Handle React elements - recurse into their children
  if (node && typeof node === 'object' && 'props' in node) {
    const element = node as { props: { children?: ReactNode } & Record<string, unknown> };
    if (element.props.children) {
      return {
        ...node,
        props: {
          ...element.props,
          children: processNodeForCitations(element.props.children, citationMap, onCitationClick),
        },
      };
    }
  }

  // Return unchanged (null, boolean, etc.)
  return node;
}

/**
 * Strip the top-level H1 (memo title is already shown in the sticky sub-header)
 * and trim leading whitespace so the first rendered element is the summary.
 */
function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, '').trim();
}

export function MemoMarkdown({ markdown, citations = [], onCitationClick }: MemoMarkdownProps) {
  const content = normalizeMarkdown(markdown);

  // Build citation lookup map for O(1) access
  const citationMap = useMemo(() => {
    const map = new Map<string, ResearchCitation>();
    citations.forEach((citation) => {
      map.set(citation.id, citation);
    });
    return map;
  }, [citations]);

  // Text renderer that parses citation references
  const renderTextWithCitations = (text: string): ReactNode[] => {
    return parseCitationReferences(text, citationMap, onCitationClick);
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => {
          const id = slugifyHeading(headingText(children));
          return (
            <h1 id={id} className="mb-6 scroll-mt-28 font-serif text-2xl font-bold text-ink">
              {children}
            </h1>
          );
        },
        h2: ({ children }) => {
          const id = slugifyHeading(headingText(children));
          return (
            <h2
              id={id}
              className="mb-4 mt-12 scroll-mt-28 border-t border-stroke pt-8 font-serif text-xl font-semibold text-ink first:mt-0 first:border-t-0 first:pt-0"
            >
              {children}
            </h2>
          );
        },
        h3: ({ children }) => {
          const id = slugifyHeading(headingText(children));
          return (
            <h3 id={id} className="mb-3 mt-8 scroll-mt-28 font-serif text-lg font-semibold text-ink">
              {children}
            </h3>
          );
        },
        h4: ({ children }) => (
          <h4 className="mb-2 mt-6 font-serif text-base font-semibold text-ink">{children}</h4>
        ),
        p: ({ children }) => {
          // Process children to handle citation references in text nodes
          const processedChildren = processNodeForCitations(children, citationMap, onCitationClick);
          return (
            <p className="mb-4 font-serif text-[15px] leading-[1.65] text-ink">{processedChildren}</p>
          );
        },
        strong: ({ children }) => {
          const processedChildren = processNodeForCitations(children, citationMap, onCitationClick);
          return <strong className="font-semibold text-ink">{processedChildren}</strong>;
        },
        em: ({ children }) => {
          const processedChildren = processNodeForCitations(children, citationMap, onCitationClick);
          return <em className="italic">{processedChildren}</em>;
        },
        ul: ({ children }) => (
          <ul className="mb-5 ml-5 list-disc space-y-2 font-serif text-[15px] leading-[1.65] text-ink">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-5 ml-5 list-decimal space-y-2 font-serif text-[15px] leading-[1.65] text-ink">
            {children}
          </ol>
        ),
        li: ({ children }) => {
          const processedChildren = processNodeForCitations(children, citationMap, onCitationClick);
          return <li className="pl-1">{processedChildren}</li>;
        },
        blockquote: ({ children }) => {
          const processedChildren = processNodeForCitations(children, citationMap, onCitationClick);
          return (
            <blockquote className="my-6 border-l-2 border-accent pl-4 font-serif text-[15px] italic leading-[1.65] text-ink-muted">
              {processedChildren}
            </blockquote>
          );
        },
        hr: () => <hr className="my-8 border-stroke" />,
        a: ({ children, href }) => {
          const isExternal = href?.startsWith('http');
          return (
            <a
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noreferrer' : undefined}
              className="font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-accent-hover"
            >
              {children}
            </a>
          );
        },
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto rounded-sm border border-stroke">
            <table className="min-w-full border-collapse bg-surface text-left text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-surface-alt text-ink">{children}</thead>,
        th: ({ children }) => {
          const processedChildren = processNodeForCitations(children, citationMap, onCitationClick);
          return (
            <th className="border-b border-stroke px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink">
              {processedChildren}
            </th>
          );
        },
        td: ({ children }) => {
          const processedChildren = processNodeForCitations(children, citationMap, onCitationClick);
          return (
            <td className="border-b border-stroke/70 px-4 py-2 align-top font-data text-[13px] leading-6 text-ink">
              {processedChildren}
            </td>
          );
        },
        code: ({ children, className, ...props }: ComponentPropsWithoutRef<'code'>) => {
          // In react-markdown v9+, inline prop is removed.
          // Detect inline code: no className means inline (fenced blocks have language-* class)
          const isInline = !className;
          return isInline ? (
            <code className="rounded-sm bg-surface-alt px-1.5 py-0.5 font-data text-[0.85em] text-ink" {...props}>
              {children}
            </code>
          ) : (
            <code
              className={[
                'block overflow-x-auto rounded-sm bg-surface-alt px-4 py-3 font-data text-sm leading-6 text-ink',
                className,
              ]
                .filter(Boolean)
                .join(' ')}
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
