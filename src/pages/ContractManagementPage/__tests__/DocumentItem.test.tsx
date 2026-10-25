import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocumentItem, DocType } from '../components/DocumentItem';
import '@testing-library/jest-dom/vitest';

// Role hook (also calls useQuery internally) — mocked so it never needs a
// provider and so the analyze action's role gate is deterministic.
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isManager: true, isCompanyAdmin: false }),
}));

vi.mock('@/hooks/useToaster', () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const postRequest = vi.fn().mockResolvedValue({ data: { message: 'ok' } });
vi.mock('@/lib/axiosInstance', () => ({
  postRequest: (...args: unknown[]) => postRequest(...args),
}));

// Stateful mock of the Radix dropdown so the (uncontrolled) kebab menu opens
// on trigger click. Mirrors the approach in contracts-table-actions.test.tsx.
vi.mock('@/components/ui/dropdown-menu', async () => {
  const React = await import('react');
  const Ctx = React.createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);
  return {
    DropdownMenu: ({ children }: React.PropsWithChildren) => {
      const [open, setOpen] = React.useState(false);
      return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
    },
    DropdownMenuTrigger: ({ children }: { asChild?: boolean; children: React.ReactElement<{ onClick?: () => void }> }) => {
      const ctx = React.useContext(Ctx)!;
      return React.cloneElement(children, { onClick: () => ctx.setOpen(!ctx.open) });
    },
    DropdownMenuContent: ({ children }: React.PropsWithChildren) => {
      const ctx = React.useContext(Ctx)!;
      return ctx.open ? <div role="menu">{children}</div> : null;
    },
    DropdownMenuItem: ({ children, onSelect, disabled, ...props }: React.PropsWithChildren<{ onSelect?: (e: { preventDefault: () => void }) => void; disabled?: boolean }>) => (
      <button type="button" role="menuitem" disabled={disabled} onClick={() => onSelect?.({ preventDefault: () => {} })} {...props}>
        {children}
      </button>
    ),
  };
});

const renderWithClient = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

describe('DocumentItem', () => {
  const mockDoc: DocType = {
    id: 'doc-1',
    name: 'Test Document.pdf',
    type: 'application/pdf',
    size: '1.2 MB',
    url: 'https://example.com/test.pdf',
    icon: <div data-testid="mock-icon" />,
  };

  const openMenu = () => fireEvent.click(screen.getByTestId('document-actions-dropdown'));

  it('renders document information correctly', () => {
    render(<DocumentItem d={mockDoc} />);

    expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    expect(screen.getByText('application/pdf • 1.2 MB')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('does not render the edit item when canEdit is false or undefined', () => {
    render(<DocumentItem d={mockDoc} />);
    openMenu();

    expect(screen.queryByText('Edit in Collaboration Tool')).not.toBeInTheDocument();
  });

  it('renders the edit item (docx + canEdit) and navigates to the SuperDoc editor', () => {
    const mockNavigate = vi.fn();
    // The edit item only renders for .docx files; use a docx variant.
    const docxDoc: DocType = { ...mockDoc, name: 'Test Document.docx', type: 'docx' };

    render(<DocumentItem d={docxDoc} canEdit={true} navigate={mockNavigate} />);
    openMenu();

    const editItem = screen.getByText('Edit in Collaboration Tool');
    expect(editItem).toBeInTheDocument();

    fireEvent.click(editItem);

    const expectedPrefix = `/collaboration-tool?sourceUrl=${encodeURIComponent(docxDoc.url!)}&fileName=${encodeURIComponent(docxDoc.name)}&fileType=${encodeURIComponent(docxDoc.type)}`;
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const navUrl = mockNavigate.mock.calls[0][0] as string;
    expect(navUrl.startsWith(expectedPrefix)).toBe(true);
    // SuperDoc is now the default editor for the edit-in-collaboration-tool link.
    expect(navUrl).toContain('&editor=superdoc');
  });

  it('calls handlePreview when the preview item is clicked', () => {
    const mockPreview = vi.fn();

    render(<DocumentItem d={mockDoc} handlePreview={mockPreview} />);
    openMenu();

    fireEvent.click(screen.getByText('Preview'));

    expect(mockPreview).toHaveBeenCalledWith(mockDoc);
    expect(mockPreview).toHaveBeenCalledTimes(1);
  });

  it('calls handleDownload when the download item is clicked', () => {
    const mockDownload = vi.fn();

    render(<DocumentItem d={mockDoc} handleDownload={mockDownload} />);
    openMenu();

    fireEvent.click(screen.getByText('Download'));

    expect(mockDownload).toHaveBeenCalledWith(mockDoc);
    expect(mockDownload).toHaveBeenCalledTimes(1);
  });

  it('does not show the analyze item when onAnalyzed is not provided', () => {
    render(<DocumentItem d={mockDoc} />);
    openMenu();

    expect(screen.queryByText('Analyze in Clause Library')).not.toBeInTheDocument();
  });

  it('analyzes the file (prefers _id) and calls onAnalyzed on success', async () => {
    postRequest.mockClear();
    const onAnalyzed = vi.fn();
    const doc: DocType = { ...mockDoc, fileId: '665f1a2b3c4d5e6f78901234' };

    renderWithClient(
      <DocumentItem d={doc} contractId="contract-1" onAnalyzed={onAnalyzed} />,
    );
    openMenu();

    fireEvent.click(screen.getByText('Analyze in Clause Library'));

    await waitFor(() => expect(postRequest).toHaveBeenCalledTimes(1));
    const callArg = postRequest.mock.calls[0][0] as { url: string };
    expect(callArg.url).toContain('/contract/manager/contracts/contract-1/clauses/file/');
    expect(callArg.url).toContain('665f1a2b3c4d5e6f78901234');
    await waitFor(() => expect(onAnalyzed).toHaveBeenCalledTimes(1));
  });
});
