// @ts-nocheck
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { FilterIcon, XIcon, ArrowUpDownIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  [key: string]: any;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: { value: string; label: string }[];
}

export interface SortField {
  key: string;
  label: string;
}

interface FilterSortBarProps {
  filters: FilterConfig;
  onFiltersChange: (filters: FilterConfig) => void;
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  filterFields: FilterField[];
  sortFields: SortField[];
  resultCount: number;
  totalCount: number;
}

export const FilterSortBar = ({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  filterFields,
  sortFields,
  resultCount,
  totalCount,
}: FilterSortBarProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilterCount = [
    filters.search,
    filters.dateFrom,
    filters.dateTo,
    ...filterFields.map(f => filters[f.key]),
  ].filter(v => v && v !== 'all').length;

  const clearAllFilters = () => {
    const reset: FilterConfig = { search: '', dateFrom: null, dateTo: null };
    filterFields.forEach(f => { reset[f.key] = 'all'; });
    onFiltersChange(reset);
  };

  const handleSortField = (field: string) => {
    if (sort.field === field) {
      onSortChange({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ field, direction: 'desc' });
    }
  };

  return (
    <div className="space-y-3">
      {/* Search + Filter + Sort row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="h-9"
          />
        </div>

        {/* Sort selector */}
        <Select
          value={sort.field}
          onValueChange={(field) => handleSortField(field)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <ArrowUpDownIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortFields.map(f => (
              <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort direction */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2"
          onClick={() => onSortChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
          title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sort.direction === 'asc'
            ? <ChevronUpIcon className="h-4 w-4" />
            : <ChevronDownIcon className="h-4 w-4" />
          }
        </Button>

        {/* Filter popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <FilterIcon className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-0.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAllFilters}>
                    <XIcon className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">From</Label>
                    <DatePicker
                      date={filters.dateFrom}
                      onDateChange={(date) => onFiltersChange({ ...filters, dateFrom: date || null })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <DatePicker
                      date={filters.dateTo}
                      onDateChange={(date) => onFiltersChange({ ...filters, dateTo: date || null })}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic filter fields */}
              {filterFields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">{field.label}</Label>
                  {field.type === 'select' && (
                    <Select
                      value={filters[field.key] || 'all'}
                      onValueChange={(value) => onFiltersChange({ ...filters, [field.key]: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="all">All {field.label}s</SelectItem>
                        {field.options?.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {field.type === 'text' && (
                    <Input
                      className="h-8 text-sm"
                      value={filters[field.key] || ''}
                      onChange={(e) => onFiltersChange({ ...filters, [field.key]: e.target.value })}
                      placeholder={`Filter by ${field.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear all button (visible when filters active) */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9" onClick={clearAllFilters}>
            <XIcon className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active filter badges + result count */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Showing {resultCount} of {totalCount}
        </span>
        {filters.search && (
          <Badge variant="secondary" className="gap-1 text-xs">
            Search: "{filters.search}"
            <XIcon className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, search: '' })} />
          </Badge>
        )}
        {filters.dateFrom && (
          <Badge variant="secondary" className="gap-1 text-xs">
            From: {new Date(filters.dateFrom).toLocaleDateString('en-GB')}
            <XIcon className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, dateFrom: null })} />
          </Badge>
        )}
        {filters.dateTo && (
          <Badge variant="secondary" className="gap-1 text-xs">
            To: {new Date(filters.dateTo).toLocaleDateString('en-GB')}
            <XIcon className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, dateTo: null })} />
          </Badge>
        )}
        {filterFields.map(field => {
          const val = filters[field.key];
          if (!val || val === 'all') return null;
          const label = field.options?.find(o => o.value === val)?.label || val;
          return (
            <Badge key={field.key} variant="secondary" className="gap-1 text-xs">
              {field.label}: {label}
              <XIcon className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, [field.key]: 'all' })} />
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
