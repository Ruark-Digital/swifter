import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VersionHistoryModal from '../components/VersionHistoryModal';
import '@testing-library/jest-dom/vitest';

describe('VersionHistoryModal', () => {
  it('renders a list of versions', () => {
    const versions = [
      { id: '1', timestamp: '2024-04-14T10:00:00Z', author: 'User A' },
      { id: '2', timestamp: '2024-04-14T11:00:00Z', author: 'User B' }
    ];
    
    render(
      <VersionHistoryModal 
        isOpen={true} 
        onClose={vi.fn()} 
        versions={versions} 
        onRestore={vi.fn()} 
      />
    );
    
    expect(screen.getByText('Version History')).toBeInTheDocument();
    expect(screen.getByText(/User A/i)).toBeInTheDocument();
    expect(screen.getByText(/User B/i)).toBeInTheDocument();
  });

  it('calls onRestore when restore button is clicked', () => {
    const versions = [
      { id: '1', timestamp: '2024-04-14T10:00:00Z', author: 'User A' }
    ];
    const mockRestore = vi.fn();
    
    render(
      <VersionHistoryModal 
        isOpen={true} 
        onClose={vi.fn()} 
        versions={versions} 
        onRestore={mockRestore} 
      />
    );
    
    const restoreBtn = screen.getByText('Restore');
    fireEvent.click(restoreBtn);
    
    expect(mockRestore).toHaveBeenCalledWith('1');
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <VersionHistoryModal 
        isOpen={false} 
        onClose={vi.fn()} 
        versions={[]} 
        onRestore={vi.fn()} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
});
