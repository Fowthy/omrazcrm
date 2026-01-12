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
  Users,
  Plus,
  Loader2,
  Search,
  Phone,
  Mail,
  Building,
  Globe,
  Trash2,
  Edit,
} from 'lucide-react';
import { contactTypes } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  company: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'venue',
    company: '',
    website: '',
    address: '',
    notes: '',
  });

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
  });

  const filteredContacts = contacts?.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateContact = async () => {
    if (!newContact.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });

      if (!res.ok) throw new Error('Failed to create contact');

      toast.success('Contact added!');
      setIsCreateDialogOpen(false);
      setNewContact({
        name: '',
        email: '',
        phone: '',
        type: 'venue',
        company: '',
        website: '',
        address: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error) {
      toast.error('Failed to add contact');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditContact = async () => {
    if (!editingContact || !editingContact.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContact),
      });

      if (!res.ok) throw new Error('Failed to update contact');

      toast.success('Contact updated!');
      setIsEditDialogOpen(false);
      setEditingContact(null);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error) {
      toast.error('Failed to update contact');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete contact');

      toast.success('Contact deleted!');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const getTypeInfo = (type: string) => {
    return contactTypes.find((t) => t.value === type) || { label: type, value: type };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contacts</h1>
          <p className="mt-1 text-zinc-400">
            Manage industry contacts and relationships
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
              <DialogDescription>
                Add a new industry contact
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+1 555-0123"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newContact.type}
                    onValueChange={(value) => setNewContact({ ...newContact, type: value })}
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
                  <Label>Company</Label>
                  <Input
                    placeholder="Company name"
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  placeholder="https://"
                  value={newContact.website}
                  onChange={(e) => setNewContact({ ...newContact, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Address"
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateContact} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Contact'
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
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : filteredContacts?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">No contacts yet</h3>
            <p className="mt-2 text-sm text-zinc-400 text-center max-w-md">
              Keep track of your industry connections. Add venues, studios,
              engineers, photographers, and other important contacts.
            </p>
            <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContacts?.map((contact) => (
            <Card key={contact.id} className="transition-all hover:border-zinc-700">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{contact.name}</CardTitle>
                    <CardDescription>
                      {contact.company || getTypeInfo(contact.type).label}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{getTypeInfo(contact.type).label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${contact.phone}`} className="hover:text-white transition-colors">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Building className="h-4 w-4" />
                    {contact.company}
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Globe className="h-4 w-4" />
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors truncate">
                      {contact.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingContact(contact);
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
                    onClick={() => handleDeleteContact(contact.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information
            </DialogDescription>
          </DialogHeader>

          {editingContact && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="Contact name"
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={editingContact.email || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+1 555-0123"
                    value={editingContact.phone || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editingContact.type}
                    onValueChange={(value) => setEditingContact({ ...editingContact, type: value })}
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
                  <Label>Company</Label>
                  <Input
                    placeholder="Company name"
                    value={editingContact.company || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  placeholder="https://"
                  value={editingContact.website || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Address"
                  value={editingContact.address || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={editingContact.notes || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditContact} disabled={isCreating}>
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
