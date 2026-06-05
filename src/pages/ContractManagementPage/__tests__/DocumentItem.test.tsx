import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentItem, DocType } from '../components/DocumentItem';
import '@testing-library/jest-dom/vitest';

describe('DocumentItem', () => {
  const mockDoc: DocType = {
    id: 'doc-1',
    name: 'Test Document.pdf',
    type: 'application/pdf',
    size: '1.2 MB',
    url: 'https://example.com/test.pdf',
    icon: <div data-testid="mock-icon" />
  };

  it('renders document information correctly', () => {
    render(<DocumentItem d={mockDoc} />);
    
    expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    expect(screen.getByText('application/pdf • 1.2 MB')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('does not render the edit button when canEdit is false or undefined', () => {
    render(<DocumentItem d={mockDoc} />);
    
    expect(screen.queryByLabelText('Edit in Collaboration Tool')).not.toBeInTheDocument();
  });

  it('renders the edit button (docx + canEdit) and navigates to the SuperDoc editor', () => {
    const mockNavigate = vi.fn();
    // The edit button only renders for .docx files; use a docx variant.
    const docxDoc: DocType = { ...mockDoc, name: 'Test Document.docx', type: 'docx' };

    render(<DocumentItem d={docxDoc} canEdit={true} navigate={mockNavigate} />);

    const editBtn = screen.getByLabelText('Edit in Collaboration Tool');
    expect(editBtn).toBeInTheDocument();

    fireEvent.click(editBtn);

    // Check if navigate was called with correct encoded URL parameters
    const expectedPrefix = `/collaboration-tool?sourceUrl=${encodeURIComponent(docxDoc.url!)}&fileName=${encodeURIComponent(docxDoc.name)}&fileType=${encodeURIComponent(docxDoc.type)}`;
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const navUrl = mockNavigate.mock.calls[0][0] as string;
    expect(navUrl.startsWith(expectedPrefix)).toBe(true);
    // SuperDoc is now the default editor for the edit-in-collaboration-tool link.
    expect(navUrl).toContain("&editor=superdoc");
  });

  it('calls handlePreview when preview button is clicked', () => {
    const mockPreview = vi.fn();
    
    render(<DocumentItem d={mockDoc} handlePreview={mockPreview} />);
    
    const previewBtn = screen.getByLabelText('Preview');
    fireEvent.click(previewBtn);
    
    expect(mockPreview).toHaveBeenCalledWith(mockDoc);
    expect(mockPreview).toHaveBeenCalledTimes(1);
  });

  it('calls handleDownload when download button is clicked', () => {
    const mockDownload = vi.fn();
    
    render(<DocumentItem d={mockDoc} handleDownload={mockDownload} />);
    
    const downloadBtn = screen.getByLabelText('Download');
    fireEvent.click(downloadBtn);
    
    expect(mockDownload).toHaveBeenCalledWith(mockDoc);
    expect(mockDownload).toHaveBeenCalledTimes(1);
  });
});
