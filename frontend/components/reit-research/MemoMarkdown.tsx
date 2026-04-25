'use client';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { slugifyHeading } from '@/lib/memo-outline';

interface MemoMarkdownProps {
  markdown: string;
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

/**
 * Strip the top-level H1 (memo title is already shown in the sticky sub-header)
 * and trim leading whitespace so the first rendered element is the summary.
 */
function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, '').trim();
}

export function MemoMarkdown({ markdown }: MemoMarkdownProps) {
  const content = normalizeMarkdown(markdown);

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
        p: ({ children }) => (
          <p className="mb-4 font-serif text-[15px] leading-[1.65] text-ink">{children}</p>
        ),
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
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
        li: ({ children }) => <li className="pl-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-2 border-accent pl-4 font-serif text-[15px] italic leading-[1.65] text-ink-muted">
            {children}
          </blockquote>
        ),
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
        th: ({ children }) => (
          <th className="border-b border-stroke px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-stroke/70 px-4 py-2 align-top font-data text-[13px] leading-6 text-ink">
            {children}
          </td>
        ),
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
