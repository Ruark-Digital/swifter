import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder: string
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="relative">
      <Search
        className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B6B6B]"
        strokeWidth={1.67}
      />
      <Input
        data-testid="search-input"
        placeholder={`Search ${placeholder}`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-12 pr-4 py-3 w-[300px] h-12 border border-[#E5E7EB] rounded-lg text-sm text-[#6B6B6B] focus:border-[#2A4467] focus:ring-[#2A4467]"
        style={{ fontFamily: "PushPenny" }}
      />
    </div>
  );
};