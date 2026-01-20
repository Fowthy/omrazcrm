'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Music,
  FolderKanban,
  GitBranch,
  CalendarDays,
  MessageSquare,
  Filter,
  X,
  Loader2,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface SearchResult {
  id: string;
  type: 'album' | 'song' | 'decision' | 'session' | 'note';
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  url: string;
  createdAt: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

const typeIcons = {
  album: FolderKanban,
  song: Music,
  decision: GitBranch,
  session: CalendarDays,
  note: MessageSquare,
};

const typeColors = {
  album: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  song: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  decision: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  session: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  note: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const statusColors: Record<string, string> = {
  // Album/Project statuses
  idea: 'bg-gray-500/20 text-gray-400',
  writing: 'bg-blue-500/20 text-blue-400',
  recording: 'bg-yellow-500/20 text-yellow-400',
  mixing: 'bg-orange-500/20 text-orange-400',
  mastering: 'bg-purple-500/20 text-purple-400',
  released: 'bg-green-500/20 text-green-400',
  // Song phases
  concepting: 'bg-gray-500/20 text-gray-400',
  demo: 'bg-blue-500/20 text-blue-400',
  tracking: 'bg-yellow-500/20 text-yellow-400',
  archived: 'bg-zinc-500/20 text-zinc-400',
  // Decision statuses
  proposed: 'bg-blue-500/20 text-blue-400',
  testing: 'bg-amber-500/20 text-amber-400',
  locked: 'bg-green-500/20 text-green-400',
  reopened: 'bg-red-500/20 text-red-400',
  // Session/Note statuses
  active: 'bg-green-500/20 text-green-400',
  completed: 'bg-gray-500/20 text-gray-400',
};

const RESULT_TYPES = [
  { value: 'all', label: 'All Results' },
  { value: 'album', label: 'Albums' },
  { value: 'song', label: 'Songs' },
  { value: 'decision', label: 'Decisions' },
  { value: 'session', label: 'Sessions' },
  { value: 'note', label: 'Notes' },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState(initialType);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Update URL when search parameters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (selectedType !== 'all') params.set('type', selectedType);

    const queryString = params.toString();
    router.replace(`/search${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [debouncedQuery, selectedType, router]);

  // Search API
  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ['search', debouncedQuery, selectedType],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { results: [], total: 0, query: '' };
      }
      const typeParam = selectedType !== 'all' ? `&type=${selectedType}` : '';
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=50${typeParam}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Group results by type
  const groupedResults = useMemo(() => {
    if (!data?.results) return {};
    return data.results.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
  }, [data]);

  // Count results by type
  const resultCounts = useMemo(() => {
    const counts: Record<string, number> = { all: data?.results?.length || 0 };
    if (data?.results) {
      data.results.forEach((r) => {
        counts[r.type] = (counts[r.type] || 0) + 1;
      });
    }
    return counts;
  }, [data]);

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedType('all');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Search</h1>
        <p className="text-zinc-400 mt-1">
          Find albums, songs, decisions, sessions, and notes across your workspace
        </p>
      </div>

      {/* Search Input */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <Input
                type="text"
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800/50 border-zinc-700 h-12 text-lg"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48 bg-zinc-800/50 border-zinc-700 h-12">
                <Filter className="h-4 w-4 mr-2 text-zinc-500" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {RESULT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                    {resultCounts[type.value] !== undefined && debouncedQuery.length >= 2 && (
                      <span className="ml-2 text-zinc-500">({resultCounts[type.value]})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick filter tabs */}
          {debouncedQuery.length >= 2 && data?.results && data.results.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {RESULT_TYPES.map((type) => {
                const count = resultCounts[type.value] || 0;
                if (type.value !== 'all' && count === 0) return null;
                return (
                  <Button
                    key={type.value}
                    variant={selectedType === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type.value)}
                    className={selectedType === type.value ? 'bg-violet-600' : 'border-zinc-700'}
                  >
                    {type.label}
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && debouncedQuery.length >= 2 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <span className="ml-3 text-zinc-400">Searching...</span>
        </div>
      )}

      {error && (
        <Card className="bg-red-900/20 border-red-800">
          <CardContent className="p-4">
            <p className="text-red-400">Failed to search. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && debouncedQuery.length < 2 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Start searching</h3>
            <p className="text-zinc-400">
              Enter at least 2 characters to search across all your content
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && debouncedQuery.length >= 2 && data?.results?.length === 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
            <p className="text-zinc-400">
              No matches for "{debouncedQuery}". Try a different search term.
            </p>
            {selectedType !== 'all' && (
              <Button
                variant="outline"
                className="mt-4 border-zinc-700"
                onClick={() => setSelectedType('all')}
              >
                Search all types
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && data?.results && data.results.length > 0 && (
        <div className="space-y-6">
          {/* Results summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              Found {data.total} result{data.total !== 1 ? 's' : ''} for "{data.query}"
            </p>
            {(searchQuery || selectedType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="text-zinc-400"
              >
                Clear filters
                <X className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Results list */}
          {selectedType === 'all' ? (
            // Show grouped results
            Object.entries(groupedResults).map(([type, results]) => (
              <Card key={type} className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {(() => {
                      const Icon = typeIcons[type as keyof typeof typeIcons];
                      return Icon && <Icon className="h-5 w-5" />;
                    })()}
                    {type.charAt(0).toUpperCase() + type.slice(1)}s
                    <Badge variant="secondary" className="ml-2">
                      {results.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-zinc-800">
                    {results.slice(0, 5).map((result) => (
                      <SearchResultItem key={`${result.type}-${result.id}`} result={result} formatDate={formatDate} />
                    ))}
                  </div>
                  {results.length > 5 && (
                    <Button
                      variant="ghost"
                      className="w-full mt-4 text-zinc-400"
                      onClick={() => setSelectedType(type)}
                    >
                      View all {results.length} {type}s
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            // Show flat list for filtered type
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-6">
                <div className="divide-y divide-zinc-800">
                  {data.results.map((result) => (
                    <SearchResultItem key={`${result.type}-${result.id}`} result={result} formatDate={formatDate} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResultItem({
  result,
  formatDate,
}: {
  result: SearchResult;
  formatDate: (date: string) => string;
}) {
  const Icon = typeIcons[result.type];
  const typeColor = typeColors[result.type];
  const statusColor = statusColors[result.status || ''] || 'bg-zinc-500/20 text-zinc-400';

  return (
    <Link
      href={result.url}
      className="flex items-start gap-4 py-4 hover:bg-zinc-800/50 -mx-4 px-4 transition-colors"
    >
      <div className={`p-2 rounded-lg border ${typeColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-white truncate">{result.title}</h3>
            {result.subtitle && (
              <p className="text-sm text-zinc-400 mt-0.5">{result.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {result.status && (
              <Badge variant="secondary" className={statusColor}>
                {result.status}
              </Badge>
            )}
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(result.createdAt)}
            </span>
          </div>
        </div>
        {result.description && (
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{result.description}</p>
        )}
      </div>
      <ArrowRight className="h-5 w-5 text-zinc-600 shrink-0 self-center" />
    </Link>
  );
}
