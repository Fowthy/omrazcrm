'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Package,
  Plus,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MerchItem {
  id: string;
  name: string;
  type: string;
  price: number;
  cost: number | null;
  sizes: string | null;
  stock: number;
  image: string | null;
  description: string | null;
  isActive: boolean;
}

interface MerchData {
  items: MerchItem[];
  summary: {
    totalItems: number;
    totalStock: number;
    totalValue: number;
  };
}

const merchTypes = [
  { value: 'tshirt', label: 'T-Shirt' },
  { value: 'hoodie', label: 'Hoodie' },
  { value: 'poster', label: 'Poster' },
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'cd', label: 'CD' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'hat', label: 'Hat' },
  { value: 'other', label: 'Other' },
];

export default function MerchPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MerchItem | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<MerchData>({
    queryKey: ['merch'],
    queryFn: async () => {
      const res = await fetch('/api/merch');
      if (!res.ok) throw new Error('Failed to fetch merch');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<MerchItem>) => {
      const res = await fetch('/api/merch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create merch item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merch'] });
      setIsAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MerchItem> }) => {
      const res = await fetch(`/api/merch/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update merch item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merch'] });
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/merch/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete merch item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merch'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      price: parseFloat(formData.get('price') as string),
      cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : null,
      sizes: formData.get('sizes') as string || null,
      stock: parseInt(formData.get('stock') as string) || 0,
      description: formData.get('description') as string || null,
      isActive: formData.get('isActive') === 'on',
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: itemData });
    } else {
      createMutation.mutate(itemData);
    }
  };

  const items = data?.items || [];
  const summary = data?.summary || { totalItems: 0, totalStock: 0, totalValue: 0 };
  const filteredItems = filterType === 'all' ? items : items.filter((i) => i.type === filterType);

  const getTypeLabel = (type: string) => {
    return merchTypes.find((t) => t.value === type)?.label || type;
  };

  const MerchForm = ({ item }: { item?: MerchItem | null }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={item?.name}
            placeholder="e.g., Band T-Shirt"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select name="type" defaultValue={item?.type || 'tshirt'}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
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
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            defaultValue={item?.price}
            placeholder="25.00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost">Cost ($)</Label>
          <Input
            id="cost"
            name="cost"
            type="number"
            step="0.01"
            defaultValue={item?.cost || ''}
            placeholder="10.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            defaultValue={item?.stock || 0}
            placeholder="100"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sizes">Sizes (comma-separated)</Label>
        <Input
          id="sizes"
          name="sizes"
          defaultValue={item?.sizes || ''}
          placeholder="S, M, L, XL, XXL"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={item?.description || ''}
          placeholder="Item description..."
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch id="isActive" name="isActive" defaultChecked={item?.isActive !== false} />
          <Label htmlFor="isActive">Active (available for sale)</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Merchandise</h1>
          <p className="text-zinc-400">Manage your band merchandise inventory</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Merch Item</DialogTitle>
            </DialogHeader>
            <MerchForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Package className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Items</p>
                <p className="text-2xl font-bold text-white">{summary.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <ShoppingBag className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Stock</p>
                <p className="text-2xl font-bold text-white">{summary.totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Inventory Value</p>
                <p className="text-2xl font-bold text-white">${summary.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label className="text-zinc-400">Filter by type:</Label>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {merchTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-400">Loading...</div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No merchandise items</h3>
            <p className="text-zinc-400 mb-4">Add your first merch item to get started</p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      {!item.isActive && (
                        <Badge variant="secondary" className="bg-zinc-700">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(item.type)}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingItem(item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={() => {
                          if (confirm('Delete this item?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Price</span>
                    <span className="font-semibold text-white">${item.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Stock</span>
                    <span className={`font-semibold ${item.stock < 10 ? 'text-yellow-400' : 'text-white'}`}>
                      {item.stock} units
                    </span>
                  </div>
                  {item.cost && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Profit/unit</span>
                      <span className="text-green-400">${(item.price - item.cost).toFixed(2)}</span>
                    </div>
                  )}
                  {item.sizes && (
                    <div className="pt-2 border-t border-zinc-800">
                      <span className="text-zinc-400">Sizes: </span>
                      <span className="text-zinc-300">{item.sizes}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Merch Item</DialogTitle>
          </DialogHeader>
          <MerchForm item={editingItem} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
