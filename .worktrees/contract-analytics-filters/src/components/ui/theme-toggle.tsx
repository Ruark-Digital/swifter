import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, actualTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    // Apply theme with a small delay to ensure React has time to update
    setTimeout(() => {
      setTheme(newTheme);
      // Log theme change for debugging
      console.log(`Theme changed to: ${newTheme}, actual theme: ${newTheme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : newTheme}`);
      
      // Force document class update
      const root = window.document.documentElement;
      if (newTheme !== 'system') {
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
      }
    }, 0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
          aria-label={`Toggle theme (current: ${theme === 'system' ? 'system' : actualTheme})`}
        >
          {actualTheme === 'dark' ? (
            <Moon className="h-4 w-4 text-[#2A4467] dark:text-white" />
          ) : theme === 'system' ? (
            <Monitor className="h-4 w-4 text-[#2A4467] dark:text-white" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md">
        <DropdownMenuItem
          onClick={() => handleThemeChange('light')}
          className={cn(
            'cursor-pointer flex items-center rounded-md px-2 py-1.5 text-sm',
            theme === 'light' && 'bg-gray-100 dark:bg-gray-800 font-medium'
          )}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('dark')}
          className={cn(
            'cursor-pointer flex items-center rounded-md px-2 py-1.5 text-sm',
            theme === 'dark' && 'bg-gray-100 dark:bg-gray-800 font-medium'
          )}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('system')}
          className={cn(
            'cursor-pointer flex items-center rounded-md px-2 py-1.5 text-sm',
            theme === 'system' && 'bg-gray-100 dark:bg-gray-800 font-medium'
          )}
        >
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;