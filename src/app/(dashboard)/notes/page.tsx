'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Music, Album } from 'lucide-react';

interface Note {
  id: string;
  albumId: string | null;
  songId: string | null;
  sectionId: string | null;
  noteType: string;
  content: string;
  audioUrl: string | null;
  linkedToTimestamp: number | null;
  createdAt: Date;
  createdByUser: { name: string; avatar: string | null } | null;
  song: { title: string } | null;
  album: { name: string } | null;
}

export default function NotesPage() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchNotes();
    }
  }, [session]);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-violet-400" />
            Notes
          </h1>
          <p className="text-zinc-400 mt-1">
            Capture ideas and feedback with timestamps
          </p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No notes yet</p>
            <p className="text-zinc-500 text-sm mb-4">
              Start capturing your creative thoughts and feedback
            </p>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </Badge>
                      <Badge variant="outline">{note.noteType}</Badge>
                      {note.linkedToTimestamp !== null && (
                        <Badge className="bg-blue-500/20 text-blue-400">
                          @ {Math.floor(note.linkedToTimestamp)}s
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      {note.album && (
                        <div className="flex items-center gap-1">
                          <Album className="h-4 w-4" />
                          <span>{note.album.name}</span>
                        </div>
                      )}
                      {note.song && (
                        <div className="flex items-center gap-1">
                          <Music className="h-4 w-4" />
                          <span>{note.song.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300">{note.content}</p>
                {note.createdByUser && (
                  <p className="text-xs text-zinc-500 mt-2">
                    By {note.createdByUser.name}
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
