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
  MapPin,
  DollarSign,
  Guitar,
  Hash,
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

export default function GearDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const gearId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
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

  const { data: gear, isLoading } = useQuery<GearItem>({
    queryKey: ['gear-item', gearId],
    queryFn: async () => {
      const res = await fetch(`/api/gear/${gearId}`);
      if (!res.ok) throw new Error('Failed to fetch gear');
      return res.json();
    },
  });

  if (gear && !editForm.name && gear.name !== editForm.name) {
    setEditForm({
      name: gear.name,
      category: gear.category,
      brand: gear.brand || '',
      model: gear.model || '',
      serialNumber: gear.serialNumber || '',
      purchasePrice: gear.purchasePrice?.toString() || '',
      condition: gear.condition || 'good',
      location: gear.location || '',
      notes: gear.notes || '',
    });
  }

  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/gear/${gearId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          purchasePrice: editForm.purchasePrice ? parseFloat(editForm.purchasePrice) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update gear');

      await queryClient.invalidateQueries({ queryKey: ['gear-item', gearId] });
      await queryClient.invalidateQueries({ queryKey: ['gear'] });
      toast.success('Gear updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update gear');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gear/${gearId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete gear');

      await queryClient.invalidateQueries({ queryKey: ['gear'] });
      toast.success('Gear deleted!');
      router.push('/gear');
    } catch (error) {
      toast.error('Failed to delete gear');
    } finally {
      setIsDeleting(false);
    }
  };

  const getConditionColor = (condition: string | null) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-500/20 text-green-400',
      good: 'bg-blue-500/20 text-blue-400',
      fair: 'bg-yellow-500/20 text-yellow-400',
      poor: 'bg-red-500/20 text-red-400',
    };
    return colors[condition || 'good'] || 'bg-zinc-500/20 text-zinc-400';
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!gear) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/gear')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Gear
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Guitar className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Gear not found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/gear')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{gear.name}</h1>
            <Badge variant="secondary">
              {gearCategories.find(c => c.value === gear.category)?.label || gear.category}
            </Badge>
            {gear.condition && (
              <Badge variant="outline" className={getConditionColor(gear.condition)}>
                {gear.condition}
              </Badge>
            )}
          </div>
          {(gear.brand || gear.model) && (
            <p className="mt-1 text-zinc-400">
              {gear.brand} {gear.model && `- ${gear.model}`}
            </p>
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
              Edit Gear
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
        {gear.purchasePrice && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Purchase Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-white">{formatCurrency(gear.purchasePrice)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {gear.location && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-violet-500" />
                <span className="text-white">{gear.location}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {gear.serialNumber && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Serial Number</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-violet-500" />
                <span className="text-white font-mono">{gear.serialNumber}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {gear.isWishlist && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400">
                Wishlist
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {gear.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Guitar className="h-5 w-5" />
              Notes & Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{gear.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Gear</DialogTitle>
            <DialogDescription>Update gear information</DialogDescription>
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
                <Label>Brand</Label>
                <Input
                  value={editForm.brand}
                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
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
                  value={editForm.condition}
                  onValueChange={(value) => setEditForm({ ...editForm, condition: value })}
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
                  value={editForm.serialNumber}
                  onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Purchase Price ($)</Label>
                <Input
                  type="number"
                  value={editForm.purchasePrice}
                  onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes & Ideas</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={4}
                placeholder="Usage notes, modification ideas, tone settings..."
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
            <DialogTitle>Delete Gear</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{gear.name}&quot;? This action cannot be undone.
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
                'Delete Gear'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
