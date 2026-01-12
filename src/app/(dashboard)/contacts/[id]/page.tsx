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
  Mail,
  Phone,
  Building,
  User,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  type: string;
  website: string | null;
  notes: string | null;
  createdAt: string;
}

const contactTypes = [
  { value: 'venue', label: 'Venue' },
  { value: 'promoter', label: 'Promoter' },
  { value: 'booking_agent', label: 'Booking Agent' },
  { value: 'press', label: 'Press/Media' },
  { value: 'label', label: 'Label' },
  { value: 'producer', label: 'Producer' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'musician', label: 'Musician' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'other', label: 'Other' },
];

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contactId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    type: 'other',
    website: '',
    notes: '',
  });

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) throw new Error('Failed to fetch contact');
      return res.json();
    },
  });

  if (contact && !editForm.name && contact.name !== editForm.name) {
    setEditForm({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      role: contact.role || '',
      type: contact.type,
      website: contact.website || '',
      notes: contact.notes || '',
    });
  }

  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update contact');

      await queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update contact');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete contact');

      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted!');
      router.push('/contacts');
    } catch (error) {
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/contacts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Contact not found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/contacts')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{contact.name}</h1>
            <Badge variant="secondary">
              {contactTypes.find(t => t.value === contact.type)?.label || contact.type}
            </Badge>
          </div>
          {contact.company && (
            <p className="mt-1 text-zinc-400 flex items-center gap-1">
              <Building className="h-4 w-4" /> {contact.company}
              {contact.role && ` • ${contact.role}`}
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
              Edit Contact
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contact.email && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-violet-400 hover:underline">
                <Mail className="h-4 w-4" />
                {contact.email}
              </a>
            </CardContent>
          </Card>
        )}

        {contact.phone && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-violet-400 hover:underline">
                <Phone className="h-4 w-4" />
                {contact.phone}
              </a>
            </CardContent>
          </Card>
        )}

        {contact.website && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Website</CardTitle>
            </CardHeader>
            <CardContent>
              <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-violet-400 hover:underline">
                <Globe className="h-4 w-4" />
                {contact.website.replace(/^https?:\/\//, '')}
              </a>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {contact.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Notes & Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{contact.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update contact information</DialogDescription>
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
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                />
              </div>
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
                    {contactTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes & Ideas</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={4}
                placeholder="How you met, collaboration ideas, etc..."
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
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{contact.name}&quot;? This action cannot be undone.
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
                'Delete Contact'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
