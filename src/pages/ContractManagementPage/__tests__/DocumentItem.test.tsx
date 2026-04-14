import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentItem, DocType } from '../components/DocumentItem';
import React from 'react';
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

  it('renders the edit button when canEdit is true and calls navigate with correct URL', () => {
    const mockNavigate = vi.fn();
    
    render(<DocumentItem d={mockDoc} canEdit={true} navigate={mockNavigate} />);
    
    const editBtn = screen.getByLabelText('Edit in Collaboration Tool');
    expect(editBtn).toBeInTheDocument();
    
    fireEvent.click(editBtn);
    
    // Check if navigate was called with correct encoded URL parameters
    const expectedUrl = `/collaboration-tool?sourceUrl=${encodeURIComponent(mockDoc.url!)}&fileName=${encodeURIComponent(mockDoc.name)}&fileType=${encodeURIComponent(mockDoc.type)}`;
    expect(mockNavigate).toHaveBeenCalledWith(expectedUrl);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
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
