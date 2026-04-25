import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisMarkdownProps {
  markdown: string;
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, '').trim();
}

export function AnalysisMarkdown({ markdown }: AnalysisMarkdownProps) {
  const content = normalizeMarkdown(markdown);

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
        p: ({ children }) => (
          <p className="mb-4 text-[15px] leading-7 text-neutral-700">{children}</p>
        ),
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        em: ({ children }) => <em className="italic text-neutral-700">{children}</em>,
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
        li: ({ children }) => <li className="pl-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-4 border-primary-300 bg-primary-50/60 px-4 py-3 text-[15px] italic leading-7 text-neutral-700">
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
        th: ({ children }) => (
          <th className="border-b border-stroke px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-stroke/70 px-4 py-3 align-top text-[14px] leading-6 text-neutral-700">
            {children}
          </td>
        ),
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
