'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MerchItem {
  id: string;
  name: string;
  type: string;
  sku: string | null;
  price: number | null;
  cost: number | null;
  quantity: number;
  lowStockThreshold: number | null;
  description: string | null;
  notes: string | null;
  createdAt: string;
}

const merchTypes = [
  { value: 'tshirt', label: 'T-Shirt' },
  { value: 'hoodie', label: 'Hoodie' },
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'cd', label: 'CD' },
  { value: 'cassette', label: 'Cassette' },
  { value: 'poster', label: 'Poster' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'hat', label: 'Hat' },
  { value: 'other', label: 'Other' },
];

export default function MerchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const merchId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    type: 'tshirt',
    sku: '',
    price: '',
    cost: '',
    quantity: '',
    lowStockThreshold: '',
    description: '',
    notes: '',
  });

  const { data: merch, isLoading } = useQuery<MerchItem>({
    queryKey: ['merch-item', merchId],
    queryFn: async () => {
      const res = await fetch(`/api/merch/${merchId}`);
      if (!res.ok) throw new Error('Failed to fetch merch');
      return res.json();
    },
  });

  if (merch && !editForm.name && merch.name !== editForm.name) {
    setEditForm({
      name: merch.name,
      type: merch.type,
      sku: merch.sku || '',
      price: merch.price?.toString() || '',
      cost: merch.cost?.toString() || '',
      quantity: merch.quantity?.toString() || '0',
      lowStockThreshold: merch.lowStockThreshold?.toString() || '',
      description: merch.description || '',
      notes: merch.notes || '',
    });
  }

  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/merch/${merchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          price: editForm.price ? parseFloat(editForm.price) : null,
          cost: editForm.cost ? parseFloat(editForm.cost) : null,
          quantity: parseInt(editForm.quantity) || 0,
          lowStockThreshold: editForm.lowStockThreshold ? parseInt(editForm.lowStockThreshold) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update merch');

      await queryClient.invalidateQueries({ queryKey: ['merch-item', merchId] });
      await queryClient.invalidateQueries({ queryKey: ['merch'] });
      toast.success('Merch updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update merch');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/merch/${merchId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete merch');

      await queryClient.invalidateQueries({ queryKey: ['merch'] });
      toast.success('Merch deleted!');
      router.push('/merch');
    } catch (error) {
      toast.error('Failed to delete merch');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const profit = merch?.price && merch?.cost ? merch.price - merch.cost : null;
  const isLowStock = merch?.lowStockThreshold && merch.quantity <= merch.lowStockThreshold;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!merch) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/merch')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Merch
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Merch not found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/merch')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{merch.name}</h1>
            <Badge variant="secondary">
              {merchTypes.find(t => t.value === merch.type)?.label || merch.type}
            </Badge>
            {isLowStock && (
              <Badge variant="outline" className="bg-red-500/20 text-red-400">
                Low Stock
              </Badge>
            )}
          </div>
          {merch.sku && (
            <p className="mt-1 text-zinc-400">SKU: {merch.sku}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Merch
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-white text-xl font-bold">
                {formatCurrency(merch.price) || 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-red-500" />
              <span className="text-white">
                {formatCurrency(merch.cost) || 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Profit/Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <span className={profit && profit > 0 ? 'text-green-400' : 'text-white'}>
                {profit ? formatCurrency(profit) : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-violet-500" />
              <span className={`text-xl font-bold ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                {merch.quantity}
              </span>
              {merch.lowStockThreshold && (
                <span className="text-sm text-zinc-500">
                  (min: {merch.lowStockThreshold})
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {merch.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300">{merch.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {merch.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Notes & Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{merch.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Merch</DialogTitle>
            <DialogDescription>Update merchandise information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {merchTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.cost}
                  onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Low Stock Alert Threshold</Label>
              <Input
                type="number"
                value={editForm.lowStockThreshold}
                onChange={(e) => setEditForm({ ...editForm, lowStockThreshold: e.target.value })}
                placeholder="Alert when stock falls below..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes & Ideas</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                placeholder="Design ideas, supplier info, etc..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Merch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{merch.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Merch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
