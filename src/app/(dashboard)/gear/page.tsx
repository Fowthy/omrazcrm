'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';
import { gearCategories } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function GearPage() {
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
    // TODO: Implement API call when gear API is ready
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

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-zinc-500" />
              <h3 className="mt-4 text-lg font-medium text-white">Wishlist is empty</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Save gear you want to buy in the future
              </p>
            </CardContent>
          </Card>
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
    </div>
  );
}
