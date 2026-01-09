'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Search,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  Loader2,
} from 'lucide-react';
import { contactTypes } from '@/lib/utils';
import toast from 'react-hot-toast';

// Mock data
const contacts = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@redroom.studio',
    phone: '+1 555-0123',
    type: 'studio',
    company: 'Red Room Studios',
    website: 'https://redroom.studio',
    address: '123 Music Lane, LA',
    notes: 'Great rates for album projects',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@thevenuelive.com',
    phone: '+1 555-0456',
    type: 'venue',
    company: 'The Venue',
    website: 'https://thevenuelive.com',
    address: '456 Concert St, NYC',
    notes: 'Contact 2 weeks before show',
  },
  {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike@soundeng.pro',
    phone: '+1 555-0789',
    type: 'engineer',
    company: 'Freelance',
    website: null,
    address: null,
    notes: 'Excellent mixing engineer',
  },
  {
    id: '4',
    name: 'Lisa Chen',
    email: 'lisa@photos.com',
    phone: '+1 555-0321',
    type: 'photographer',
    company: 'Lisa Chen Photography',
    website: 'https://lisachen.photo',
    address: null,
    notes: 'Available for live show photography',
  },
];

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreateContact = async () => {
    if (!newContact.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
    setIsCreating(false);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      venue: 'bg-purple-500/20 text-purple-400',
      studio: 'bg-blue-500/20 text-blue-400',
      engineer: 'bg-green-500/20 text-green-400',
      photographer: 'bg-pink-500/20 text-pink-400',
      videographer: 'bg-orange-500/20 text-orange-400',
      manager: 'bg-cyan-500/20 text-cyan-400',
      label: 'bg-red-500/20 text-red-400',
      promoter: 'bg-yellow-500/20 text-yellow-400',
      press: 'bg-indigo-500/20 text-indigo-400',
    };
    return colors[type] || 'bg-zinc-500/20 text-zinc-400';
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || contact.type === typeFilter;
    return matchesSearch && matchesType;
  });

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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {contactTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">No contacts found</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first contact'}
            </p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="transition-colors hover:border-zinc-700">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-violet-600/20 text-violet-400">
                      {contact.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{contact.name}</CardTitle>
                    {contact.company && (
                      <CardDescription className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {contact.company}
                      </CardDescription>
                    )}
                    <Badge variant="outline" className={`mt-1 ${getTypeColor(contact.type)}`}>
                      {contactTypes.find((t) => t.value === contact.type)?.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
                  >
                    <Mail className="h-4 w-4" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
                  >
                    <Phone className="h-4 w-4" />
                    {contact.phone}
                  </a>
                )}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {contact.address && (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <MapPin className="h-4 w-4" />
                    {contact.address}
                  </div>
                )}
                {contact.notes && (
                  <p className="text-sm text-zinc-500 pt-2 border-t border-zinc-800">
                    {contact.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
