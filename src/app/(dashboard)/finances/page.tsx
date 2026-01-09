'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Download,
  Filter,
  Loader2,
  Guitar,
  Mic,
  Package,
  Car,
  Megaphone,
} from 'lucide-react';
import { expenseCategories, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

// Mock data
const expenses = [
  {
    id: '1',
    title: 'New Guitar Strings',
    amount: 45.99,
    currency: 'USD',
    category: 'gear',
    date: new Date().toISOString(),
    paidBy: { name: 'Alex' },
  },
  {
    id: '2',
    title: 'Studio Session - Red Room',
    amount: 500.00,
    currency: 'USD',
    category: 'studio',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    paidBy: { name: 'Sam' },
  },
  {
    id: '3',
    title: 'Band T-Shirts (50 pcs)',
    amount: 350.00,
    currency: 'USD',
    category: 'merch',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    paidBy: { name: 'Jordan' },
  },
  {
    id: '4',
    title: 'Gas for Tour Van',
    amount: 120.50,
    currency: 'USD',
    category: 'travel',
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
    paidBy: { name: 'Alex' },
  },
];

const stats = {
  totalExpenses: 1016.49,
  thisMonth: 545.99,
  lastMonth: 820.00,
  byCategory: [
    { category: 'gear', total: 245.99 },
    { category: 'studio', total: 500.00 },
    { category: 'merch', total: 350.00 },
    { category: 'travel', total: 120.50 },
  ],
};

export default function FinancesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'gear',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      gear: <Guitar className="h-4 w-4" />,
      studio: <Mic className="h-4 w-4" />,
      merch: <Package className="h-4 w-4" />,
      travel: <Car className="h-4 w-4" />,
      marketing: <Megaphone className="h-4 w-4" />,
    };
    return icons[category] || <Receipt className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      gear: 'bg-blue-500/20 text-blue-400',
      studio: 'bg-purple-500/20 text-purple-400',
      merch: 'bg-green-500/20 text-green-400',
      travel: 'bg-orange-500/20 text-orange-400',
      marketing: 'bg-pink-500/20 text-pink-400',
    };
    return colors[category] || 'bg-zinc-500/20 text-zinc-400';
  };

  const handleCreateExpense = async () => {
    if (!newExpense.title.trim() || !newExpense.amount) {
      toast.error('Title and amount are required');
      return;
    }

    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Expense logged!');
    setIsCreateDialogOpen(false);
    setNewExpense({
      title: '',
      amount: '',
      category: 'gear',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setIsCreating(false);
  };

  const filteredExpenses = categoryFilter === 'all'
    ? expenses
    : expenses.filter((e) => e.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Finances</h1>
          <p className="mt-1 text-zinc-400">
            Track band expenses and manage budget
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Expense</DialogTitle>
                <DialogDescription>
                  Record a new band expense
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="What was the expense for?"
                    value={newExpense.title}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(value) =>
                        setNewExpense({ ...newExpense, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Any additional notes..."
                    value={newExpense.description}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateExpense} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Expense'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${stats.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-zinc-500">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                ${stats.thisMonth.toFixed(2)}
              </span>
              <Badge variant="secondary" className="text-green-400">
                <TrendingDown className="mr-1 h-3 w-3" />
                -33%
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">vs last month</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.byCategory.map((cat) => (
                <div
                  key={cat.category}
                  className={`flex items-center gap-2 rounded-full px-3 py-1 ${getCategoryColor(cat.category)}`}
                >
                  {getCategoryIcon(cat.category)}
                  <span className="text-sm font-medium">
                    ${cat.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 p-4"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getCategoryColor(expense.category)}`}>
                  {getCategoryIcon(expense.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{expense.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span>{formatDate(expense.date)}</span>
                    <span>•</span>
                    <span>{expense.paidBy.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">
                    ${expense.amount.toFixed(2)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {expenseCategories.find((c) => c.value === expense.category)?.label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
