import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DocumentViewer from '../components/DocumentViewer';
import '@testing-library/jest-dom/vitest';

vi.mock('react-pdf', () => ({
  Document: ({ children }: any) => <div data-testid="mock-document">{children}</div>,
  Page: () => <div data-testid="mock-page" />,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } }
}));

describe('DocumentViewer', () => {
  it('renders a PDF document viewer when fileType is application/pdf', () => {
    render(<DocumentViewer fileType="application/pdf" sourceUrl="test.pdf" fileName="test.pdf" />);
    
    const viewerContainer = screen.getByTestId('document-viewer-container');
    expect(viewerContainer).toBeInTheDocument();
    expect(viewerContainer).toHaveClass('pdf-viewer');
    expect(screen.getByTestId('mock-document')).toBeInTheDocument();
  });

  it('renders an Excel viewer when fileType is spreadsheet', () => {
    render(<DocumentViewer fileType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" sourceUrl="test.xlsx" fileName="test.xlsx" />);
    
    const viewerContainer = screen.getByTestId('document-viewer-container');
    expect(viewerContainer).toBeInTheDocument();
    expect(viewerContainer).toHaveClass('excel-viewer');
  });

  it('renders nothing or a fallback when no sourceUrl is provided', () => {
    const { container } = render(<DocumentViewer fileType="application/pdf" sourceUrl="" fileName="test.pdf" />);
    expect(container.firstChild).toBeNull();
  });
});
