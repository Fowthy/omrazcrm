'use client';

import { useState } from 'react';
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
  Search,
  Wrench,
  DollarSign,
  MapPin,
  Calendar,
  Loader2,
  Star,
  Package,
} from 'lucide-react';
import { gearCategories, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

// Mock data
const gearItems = [
  {
    id: '1',
    name: 'Fender Stratocaster',
    category: 'guitar',
    brand: 'Fender',
    model: 'American Professional II',
    serialNumber: 'US21045789',
    purchasePrice: 1699.00,
    currentValue: 1500.00,
    condition: 'excellent',
    location: 'Studio A',
    owner: { name: 'Alex' },
    isWishlist: false,
    image: null,
  },
  {
    id: '2',
    name: 'Marshall JCM800',
    category: 'amps',
    brand: 'Marshall',
    model: 'JCM800 2203',
    serialNumber: 'M2019-5678',
    purchasePrice: 2200.00,
    currentValue: 2500.00,
    condition: 'good',
    location: 'Rehearsal Space',
    owner: { name: 'Sam' },
    isWishlist: false,
    image: null,
  },
  {
    id: '3',
    name: 'SM57 Microphone',
    category: 'microphones',
    brand: 'Shure',
    model: 'SM57',
    serialNumber: null,
    purchasePrice: 99.00,
    currentValue: 80.00,
    condition: 'good',
    location: 'Studio A',
    owner: { name: 'Band' },
    isWishlist: false,
    image: null,
  },
  {
    id: '4',
    name: 'Tube Screamer',
    category: 'pedals',
    brand: 'Ibanez',
    model: 'TS9',
    serialNumber: null,
    purchasePrice: 99.00,
    currentValue: 90.00,
    condition: 'excellent',
    location: 'Pedalboard',
    owner: { name: 'Alex' },
    isWishlist: false,
    image: null,
  },
];

const wishlistItems = [
  {
    id: 'w1',
    name: 'Mesa Boogie Dual Rectifier',
    category: 'amps',
    brand: 'Mesa Boogie',
    price: 2499.00,
    notes: 'For heavier tones',
    priority: 'high',
  },
  {
    id: 'w2',
    name: 'Strymon Timeline',
    category: 'pedals',
    brand: 'Strymon',
    price: 449.00,
    notes: 'Delay pedal upgrade',
    priority: 'medium',
  },
];

export default function GearPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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
  });

  const handleCreateGear = async () => {
    if (!newGear.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
    });
    setIsCreating(false);
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-500/20 text-green-400',
      good: 'bg-blue-500/20 text-blue-400',
      fair: 'bg-yellow-500/20 text-yellow-400',
      poor: 'bg-red-500/20 text-red-400',
    };
    return colors[condition] || 'bg-zinc-500/20 text-zinc-400';
  };

  const filteredGear = gearItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalValue = gearItems.reduce((acc, item) => acc + (item.currentValue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gear Inventory</h1>
          <p className="mt-1 text-zinc-400">
            Catalog and track all band equipment
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
                Add a new item to your inventory
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Name</Label>
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
                  <Label>Purchase Price ($)</Label>
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
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={newGear.notes}
                  onChange={(e) => setNewGear({ ...newGear, notes: e.target.value })}
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{gearItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Wishlist Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{wishlistItems.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search gear..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {gearCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gear List */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGear.map((item) => (
              <Card key={item.id} className="transition-colors hover:border-zinc-700">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>
                        {item.brand} {item.model}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getConditionColor(item.condition)}>
                      {item.condition}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Category</span>
                    <Badge variant="secondary">
                      {gearCategories.find((c) => c.value === item.category)?.label}
                    </Badge>
                  </div>

                  {item.currentValue && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Value</span>
                      <span className="font-medium text-white">
                        ${item.currentValue.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {item.location && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <MapPin className="h-4 w-4" />
                      {item.location}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Owner</span>
                    <span className="text-zinc-300">{item.owner.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="border-dashed transition-colors hover:border-zinc-700">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>{item.brand}</CardDescription>
                    </div>
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Estimated Price</span>
                    <span className="font-medium text-white">${item.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Priority</span>
                    <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                      {item.priority}
                    </Badge>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-zinc-400">{item.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-12 w-12 text-zinc-500" />
              <h3 className="mt-4 text-lg font-medium text-white">No maintenance logs</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Track repairs, setups, and maintenance for your gear
              </p>
              <Button className="mt-4" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Log Maintenance
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
