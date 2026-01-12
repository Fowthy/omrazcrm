'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Guitar,
  Plus,
  Loader2,
  Wrench,
  Star,
  Search,
  MapPin,
  DollarSign,
  Trash2,
  Edit,
} from 'lucide-react';
import { gearCategories } from '@/lib/utils';
import toast from 'react-hot-toast';

interface GearItem {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchasePrice: number | null;
  currentValue: number | null;
  condition: string | null;
  location: string | null;
  notes: string | null;
  isWishlist: boolean;
  createdAt: string;
}

export default function GearPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingGear, setEditingGear] = useState<GearItem | null>(null);
  const [newGear, setNewGear] = useState({
    name: '',
    category: 'guitar',
    brand: '',
    model: '',
    serialNumber: '',
    purchasePrice: '',
    condition: 'good',
    location: '',
    notes: '',
    isWishlist: false,
  });

  const { data: gearItems, isLoading } = useQuery<GearItem[]>({
    queryKey: ['gear'],
    queryFn: async () => {
      const res = await fetch('/api/gear');
      if (!res.ok) throw new Error('Failed to fetch gear');
      return res.json();
    },
  });

  const inventoryItems = gearItems?.filter((item) => !item.isWishlist &&
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.model?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const wishlistItems = gearItems?.filter((item) => item.isWishlist &&
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.model?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateGear = async () => {
    if (!newGear.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newGear,
          isWishlist: activeTab === 'wishlist',
        }),
      });

      if (!res.ok) throw new Error('Failed to add gear');

      toast.success('Gear added!');
      setIsCreateDialogOpen(false);
      setNewGear({
        name: '',
        category: 'guitar',
        brand: '',
        model: '',
        serialNumber: '',
        purchasePrice: '',
        condition: 'good',
        location: '',
        notes: '',
        isWishlist: false,
      });
      queryClient.invalidateQueries({ queryKey: ['gear'] });
    } catch (error) {
      toast.error('Failed to add gear');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditGear = async () => {
    if (!editingGear || !editingGear.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`/api/gear/${editingGear.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGear),
      });

      if (!res.ok) throw new Error('Failed to update gear');

      toast.success('Gear updated!');
      setIsEditDialogOpen(false);
      setEditingGear(null);
      queryClient.invalidateQueries({ queryKey: ['gear'] });
    } catch (error) {
      toast.error('Failed to update gear');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGear = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/gear/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete gear');

      toast.success('Gear deleted!');
      queryClient.invalidateQueries({ queryKey: ['gear'] });
    } catch (error) {
      toast.error('Failed to delete gear');
    }
  };

  const getCategoryInfo = (category: string) => {
    return gearCategories.find((c) => c.value === category) || { label: category, value: category };
  };

  const getConditionColor = (condition: string | null) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-500',
      good: 'bg-blue-500',
      fair: 'bg-yellow-500',
      poor: 'bg-red-500',
    };
    return colors[condition || 'good'] || 'bg-zinc-500';
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalValue = inventoryItems?.reduce((sum, item) => sum + (item.purchasePrice || 0), 0) || 0;

  const GearCard = ({ item }: { item: GearItem }) => (
    <Card className="transition-all hover:border-zinc-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{item.name}</CardTitle>
            <CardDescription>
              {item.brand} {item.model && `- ${item.model}`}
            </CardDescription>
          </div>
          <Badge variant="secondary">{getCategoryInfo(item.category).label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.condition && (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${getConditionColor(item.condition)}`} />
            <span className="text-sm text-zinc-400 capitalize">{item.condition}</span>
          </div>
        )}
        {item.location && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MapPin className="h-4 w-4" />
            {item.location}
          </div>
        )}
        {item.purchasePrice && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <DollarSign className="h-4 w-4" />
            {formatCurrency(item.purchasePrice)}
          </div>
        )}
        {item.serialNumber && (
          <div className="text-xs text-zinc-500">
            S/N: {item.serialNumber}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              setEditingGear(item);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={() => handleDeleteGear(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gear Inventory</h1>
          <p className="mt-1 text-zinc-400">
            Catalog and track all band equipment
            {totalValue > 0 && (
              <span className="ml-2 text-violet-400">
                Total value: {formatCurrency(totalValue)}
              </span>
            )}
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Gear
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Gear</DialogTitle>
              <DialogDescription>
                Add a new item to your {activeTab === 'wishlist' ? 'wishlist' : 'inventory'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="e.g., Fender Stratocaster"
                  value={newGear.name}
                  onChange={(e) => setNewGear({ ...newGear, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    placeholder="Fender"
                    value={newGear.brand}
                    onChange={(e) => setNewGear({ ...newGear, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    placeholder="American Pro II"
                    value={newGear.model}
                    onChange={(e) => setNewGear({ ...newGear, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newGear.category}
                    onValueChange={(value) => setNewGear({ ...newGear, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gearCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={newGear.condition}
                    onValueChange={(value) => setNewGear({ ...newGear, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    placeholder="Optional"
                    value={newGear.serialNumber}
                    onChange={(e) => setNewGear({ ...newGear, serialNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newGear.purchasePrice}
                    onChange={(e) => setNewGear({ ...newGear, purchasePrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Where is it stored?"
                  value={newGear.location}
                  onChange={(e) => setNewGear({ ...newGear, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes & Ideas</Label>
                <Textarea
                  placeholder="Usage notes, modification ideas, tone settings..."
                  value={newGear.notes}
                  onChange={(e) => setNewGear({ ...newGear, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGear} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Gear'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search gear..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="inventory" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">
            Inventory {inventoryItems?.length ? `(${inventoryItems.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="wishlist">
            Wishlist {wishlistItems?.length ? `(${wishlistItems.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : inventoryItems?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Guitar className="h-12 w-12 text-zinc-500" />
                <h3 className="mt-4 text-lg font-medium text-white">No gear in inventory</h3>
                <p className="mt-2 text-sm text-zinc-400 text-center max-w-md">
                  Catalog your band&apos;s equipment. Track guitars, amps, pedals,
                  drums, and all your gear with serial numbers and values.
                </p>
                <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Gear
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inventoryItems?.map((item) => (
                <GearCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : wishlistItems?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="h-12 w-12 text-zinc-500" />
                <h3 className="mt-4 text-lg font-medium text-white">Wishlist is empty</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Save gear you want to buy in the future
                </p>
                <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Wishlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlistItems?.map((item) => (
                <GearCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-12 w-12 text-zinc-500" />
              <h3 className="mt-4 text-lg font-medium text-white">No maintenance logs</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Track repairs, setups, and maintenance for your gear
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Gear</DialogTitle>
            <DialogDescription>
              Update gear information
            </DialogDescription>
          </DialogHeader>

          {editingGear && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={editingGear.name}
                  onChange={(e) => setEditingGear({ ...editingGear, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    value={editingGear.brand || ''}
                    onChange={(e) => setEditingGear({ ...editingGear, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={editingGear.model || ''}
                    onChange={(e) => setEditingGear({ ...editingGear, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editingGear.category}
                    onValueChange={(value) => setEditingGear({ ...editingGear, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gearCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={editingGear.condition || 'good'}
                    onValueChange={(value) => setEditingGear({ ...editingGear, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    value={editingGear.serialNumber || ''}
                    onChange={(e) => setEditingGear({ ...editingGear, serialNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={editingGear.purchasePrice || ''}
                    onChange={(e) => setEditingGear({ ...editingGear, purchasePrice: parseFloat(e.target.value) || null })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={editingGear.location || ''}
                  onChange={(e) => setEditingGear({ ...editingGear, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes & Ideas</Label>
                <Textarea
                  placeholder="Usage notes, modification ideas, tone settings..."
                  value={editingGear.notes || ''}
                  onChange={(e) => setEditingGear({ ...editingGear, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGear} disabled={isCreating}>
              {isCreating ? (
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
    </div>
  );
}
