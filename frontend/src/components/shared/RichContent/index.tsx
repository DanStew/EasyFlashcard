import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import type { RichContentProps } from './types';
import {
  detectContentDensity,
  getRichContentClassNames,
  hasCodeBlock,
  hasDisplayMath,
} from './utils';
import './style.scss';

/**
 * RichContent component renders Markdown, KaTeX mathematical equations,
 * and syntax-highlighted code snippets with responsive density scaling.
 */
export function RichContent({
  content,
  size = 'md',
  face = 'front',
  align = 'auto',
  className,
}: RichContentProps) {
  const density = detectContentDensity(content);
  const isDisplayMath = hasDisplayMath(content);
  const isCode = hasCodeBlock(content);

  const rootClassName = getRichContentClassNames({
    size,
    face,
    density,
    align,
    hasDisplayMath: isDisplayMath,
    hasCodeBlock: isCode,
    className,
  });

  return (
    <div className={rootClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            />
          ),
          pre: ({ ...props }) => (
            <pre {...props} onClick={(e) => e.stopPropagation()} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export type {
  RichContentAlign,
  RichContentDensity,
  RichContentFace,
  RichContentProps,
  RichContentSize,
} from './types';
