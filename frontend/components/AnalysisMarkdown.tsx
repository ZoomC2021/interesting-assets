import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Reference } from '@/types/frontend';

interface AnalysisMarkdownProps {
  markdown: string;
  references?: Reference[];
  onCitationClick?: (id: string) => void;
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/^#\s.+\n+/, '').trim();
}

// Citation reference pattern: [T:127], [U:36], [A:001], etc.
const CITATION_PATTERN = /\[([A-Z]:\d{1,3})\]/g;

/**
 * Parse text for citation references and render as clickable chips.
 * Returns an array of React nodes (text and citation chips).
 */
function parseCitationReferences(
  text: string,
  referenceMap: Map<string, Reference>,
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

    // Check if citation exists in the reference map
    const reference = referenceMap.get(citationId);
    if (reference && onCitationClick) {
      // Render as clickable button/chip
      result.push(
        <button
          key={`${citationId}-${matchIndex}`}
          type="button"
          onClick={() => onCitationClick(reference.id)}
          className="align-super font-mono text-[10px] text-primary-600 transition-colors hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          title={`View source ${citationId}`}
          aria-label={`View source ${citationId}`}
        >
          [{citationId}]
        </button>,
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
  referenceMap: Map<string, Reference>,
  onCitationClick?: (id: string) => void,
): ReactNode {
  // Handle string nodes (text content)
  if (typeof node === 'string') {
    const parsed = parseCitationReferences(node, referenceMap, onCitationClick);
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
      <span key={index}>{processNodeForCitations(child, referenceMap, onCitationClick)}</span>
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
          children: processNodeForCitations(element.props.children, referenceMap, onCitationClick),
        },
      };
    }
  }

  // Return unchanged (null, boolean, etc.)
  return node;
}

export function AnalysisMarkdown({ markdown, references = [], onCitationClick }: AnalysisMarkdownProps) {
  const content = normalizeMarkdown(markdown);

  // Build reference lookup map for O(1) access (keyed by displayId like "T:001")
  const referenceMap = useMemo(() => {
    const map = new Map<string, Reference>();
    references.forEach((reference) => {
      map.set(reference.displayId, reference);
    });
    return map;
  }, [references]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-ink">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-4 mt-10 text-2xl font-semibold tracking-tight text-ink first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 mt-8 text-xl font-semibold tracking-tight text-ink">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mb-2 mt-6 text-lg font-semibold text-ink">{children}</h4>
        ),
        p: ({ children }) => {
          const processedChildren = processNodeForCitations(children, referenceMap, onCitationClick);
          return <p className="mb-4 text-[15px] leading-7 text-neutral-700">{processedChildren}</p>;
        },
        strong: ({ children }) => {
          const processedChildren = processNodeForCitations(children, referenceMap, onCitationClick);
          return <strong className="font-semibold text-ink">{processedChildren}</strong>;
        },
        em: ({ children }) => {
          const processedChildren = processNodeForCitations(children, referenceMap, onCitationClick);
          return <em className="italic text-neutral-700">{processedChildren}</em>;
        },
        ul: ({ children }) => (
          <ul className="mb-5 ml-5 list-disc space-y-2 text-[15px] leading-7 text-neutral-700">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-5 ml-5 list-decimal space-y-2 text-[15px] leading-7 text-neutral-700">
            {children}
          </ol>
        ),
        li: ({ children }) => {
          const processedChildren = processNodeForCitations(children, referenceMap, onCitationClick);
          return <li className="pl-1">{processedChildren}</li>;
        },
        blockquote: ({ children }) => {
          const processedChildren = processNodeForCitations(children, referenceMap, onCitationClick);
          return (
            <blockquote className="my-6 border-l-4 border-primary-300 bg-primary-50/60 px-4 py-3 text-[15px] italic leading-7 text-neutral-700">
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
              className="font-medium text-primary-700 underline decoration-primary-300 underline-offset-4 hover:text-primary-800"
            >
              {children}
            </a>
          );
        },
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto rounded-3xl border border-stroke">
            <table className="min-w-full border-collapse bg-surface text-left text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-surfaceAlt/80 text-ink">{children}</thead>,
        th: ({ children }) => {
          const processedChildren = processNodeForCitations(children, referenceMap, onCitationClick);
          return (
            <th className="border-b border-stroke px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              {processedChildren}
            </th>
          );
        },
        td: ({ children }) => {
          const processedChildren = processNodeForCitations(children, referenceMap, onCitationClick);
          return (
            <td className="border-b border-stroke/70 px-4 py-3 align-top text-[14px] leading-6 text-neutral-700">
              {processedChildren}
            </td>
          );
        },
        code: ({ children, className, inline, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) =>
          inline ? (
            <code
              className="rounded bg-surfaceAlt px-1.5 py-0.5 font-mono text-[0.85em] text-primary-800"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code
              className={[
                'block overflow-x-auto rounded-2xl bg-neutral-950 px-4 py-3 font-mono text-sm leading-6 text-neutral-50',
                className,
              ]
                .filter(Boolean)
                .join(' ')}
              {...props}
            >
              {children}
            </code>
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
