'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  Wallet,
  Plus,
  Loader2,
  DollarSign,
  Calendar,
  Trash2,
  Edit,
  TrendingDown,
} from 'lucide-react';
import { expenseCategories, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  description: string | null;
  paidByName: string | null;
  createdAt: string;
}

interface ExpenseSummary {
  total: number;
  byCategory: Record<string, number>;
  count: number;
}

interface ExpenseData {
  expenses: Expense[];
  summary: ExpenseSummary;
}

export default function FinancesPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'gear',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const { data, isLoading } = useQuery<ExpenseData>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await fetch('/api/expenses');
      if (!res.ok) throw new Error('Failed to fetch expenses');
      return res.json();
    },
  });

  const expenses = data?.expenses || [];
  const summary = data?.summary;

  const handleCreateExpense = async () => {
    if (!newExpense.title.trim() || !newExpense.amount) {
      toast.error('Title and amount are required');
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });

      if (!res.ok) throw new Error('Failed to create expense');

      toast.success('Expense logged!');
      setIsCreateDialogOpen(false);
      setNewExpense({
        title: '',
        amount: '',
        category: 'gear',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (error) {
      toast.error('Failed to log expense');
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense || !editingExpense.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingExpense),
      });

      if (!res.ok) throw new Error('Failed to update expense');

      toast.success('Expense updated!');
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete expense');

      toast.success('Expense deleted!');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryInfo = (category: string) => {
    return expenseCategories.find((c) => c.value === category) || { label: category, value: category };
  };

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
                <Label>Title *</Label>
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
                  <Label>Amount ($) *</Label>
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
              <Button onClick={handleCreateExpense}>
                Save Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && summary.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Expenses</CardDescription>
              <CardTitle className="text-2xl text-red-400">
                {formatCurrency(summary.total)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-zinc-500">
                <TrendingDown className="mr-1 h-3 w-3" />
                {summary.count} transactions
              </div>
            </CardContent>
          </Card>

          {Object.entries(summary.byCategory).slice(0, 3).map(([category, amount]) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardDescription>{getCategoryInfo(category).label}</CardDescription>
                <CardTitle className="text-xl">
                  {formatCurrency(amount)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-zinc-500">
                  {((amount / summary.total) * 100).toFixed(1)}% of total
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Expenses List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : expenses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">No expenses recorded</h3>
            <p className="mt-2 text-sm text-zinc-400 text-center max-w-md">
              Start tracking your band&apos;s expenses. Log gear purchases, studio time,
              travel costs, and more to keep your finances organized.
            </p>
            <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Log Your First Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>
              All your band expenses in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20">
                      <DollarSign className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{expense.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(expense.date)}
                        <Badge variant="secondary" className="ml-1">
                          {getCategoryInfo(expense.category).label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-red-400">
                      -{formatCurrency(expense.amount)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingExpense(expense);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update expense details
            </DialogDescription>
          </DialogHeader>

          {editingExpense && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={editingExpense.title}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingExpense.amount}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editingExpense.category}
                    onValueChange={(value) =>
                      setEditingExpense({ ...editingExpense, category: value })
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
                <Label>Description</Label>
                <Textarea
                  value={editingExpense.description || ''}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, description: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditExpense}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
