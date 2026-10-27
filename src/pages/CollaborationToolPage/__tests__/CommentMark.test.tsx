import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentMark } from '../collab/CommentMark';
import '@testing-library/jest-dom/vitest';

describe('CommentMark', () => {
  it('creates a mark with type "comment"', () => {
    expect(CommentMark.type).toBe('comment');
  });

  it('renders a mark element with the correct commentId and background color', () => {
    const props = {
      children: 'Annotated Text',
      attributes: { 'data-slate-leaf': true } as any,
      leaf: {
        commentId: '12345',
        comment: true,
      } as any,
    };

    render(CommentMark.render(props));
    
    const markElement = screen.getByText('Annotated Text');
    expect(markElement.tagName.toLowerCase()).toBe('mark');
    expect(markElement).toHaveAttribute('data-comment-id', '12345');
    expect(markElement).toHaveClass('bg-yellow-200');
  });
});
