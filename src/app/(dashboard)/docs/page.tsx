'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Book,
  FolderKanban,
  Music,
  ListMusic,
  Calendar,
  Users,
  DollarSign,
  Guitar,
  Lightbulb,
  Share2,
  CheckSquare,
  Settings,
  Search,
  Mic,
  Package,
  MapPin,
  HelpCircle,
  Wrench,
  Piano,
  AudioLines,
  Timer,
  Ear,
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Documentation</h1>
        <p className="mt-1 text-zinc-400">
          Learn how to use Omraz Studio to manage your band
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="projects">Projects & Songs</TabsTrigger>
          <TabsTrigger value="production">Production Tools</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-violet-400" />
                What is Omraz Studio?
              </CardTitle>
              <CardDescription>
                Your band&apos;s digital headquarters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <p className="text-zinc-300 text-lg">
                  Omraz Studio is a comprehensive band management platform that brings together everything
                  your band needs to organize creative work, plan events, and run the business side of music
                  - all in one place.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-white mb-4">Why Use Omraz Studio?</h3>
                <p className="text-zinc-400 mb-4">
                  Running a band means juggling a lot: writing songs, booking shows, managing gear, tracking expenses,
                  and keeping everyone on the same page. Omraz Studio eliminates the chaos of scattered spreadsheets,
                  group chats, and forgotten notes by centralizing everything your band does.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderKanban className="h-5 w-5 text-violet-400" />
                    <h4 className="font-semibold text-white">Organize Your Music</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Track projects (albums, EPs, singles) from initial idea through release.
                    Manage songs with BPM, key, lyrics, and audio files. Upload and version
                    control all your recordings, stems, and artwork.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-5 w-5 text-green-400" />
                    <h4 className="font-semibold text-white">Stay on Track</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Use the Kanban task board to manage everything that needs to get done.
                    Assign tasks to band members, set priorities and deadlines, and link
                    tasks directly to songs or projects.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">Plan Everything</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Schedule rehearsals with goals and attendance tracking. Book shows with
                    all the details (venue, times, payment). Build setlists for performances.
                    See it all on one unified calendar.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-yellow-400" />
                    <h4 className="font-semibold text-white">Handle Business</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Track band expenses with receipts and categories. Manage your gear
                    inventory with maintenance logs. Keep industry contacts organized.
                    Track merch inventory and sales.
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-white mb-4">Core Workflow</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-violet-500/20 text-violet-400 mt-0.5">1</Badge>
                    <div>
                      <p className="text-white font-medium">Create a Project</p>
                      <p className="text-sm text-zinc-400">Start with your album, EP, or single. This is the container for all related songs, files, and tasks.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-violet-500/20 text-violet-400 mt-0.5">2</Badge>
                    <div>
                      <p className="text-white font-medium">Add Songs</p>
                      <p className="text-sm text-zinc-400">Create songs within the project. Add metadata (BPM, key, lyrics) and upload audio files as you record.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-violet-500/20 text-violet-400 mt-0.5">3</Badge>
                    <div>
                      <p className="text-white font-medium">Track Progress</p>
                      <p className="text-sm text-zinc-400">Update project and song statuses as you move through writing, recording, mixing, and mastering.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-violet-500/20 text-violet-400 mt-0.5">4</Badge>
                    <div>
                      <p className="text-white font-medium">Manage Tasks</p>
                      <p className="text-sm text-zinc-400">Break down the work into tasks. Assign to band members, set due dates, and track completion on the Kanban board.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-violet-500/20 text-violet-400 mt-0.5">5</Badge>
                    <div>
                      <p className="text-white font-medium">Plan & Perform</p>
                      <p className="text-sm text-zinc-400">Schedule rehearsals, book shows, create setlists, and keep your calendar up to date.</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-white mb-4">Platform Features at a Glance</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <FolderKanban className="h-4 w-4 text-violet-400" />
                    <span>Projects & Albums</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Music className="h-4 w-4 text-cyan-400" />
                    <span>Songs & Audio Player</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Piano className="h-4 w-4 text-emerald-400" />
                    <span>MIDI Builder</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <AudioLines className="h-4 w-4 text-pink-400" />
                    <span>Sample Library</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Wrench className="h-4 w-4 text-orange-400" />
                    <span>Music Tools</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckSquare className="h-4 w-4 text-green-400" />
                    <span>Kanban Task Board</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span>Unified Calendar</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <ListMusic className="h-4 w-4 text-orange-400" />
                    <span>Setlist Builder</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Mic className="h-4 w-4 text-pink-400" />
                    <span>Rehearsal Scheduling</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span>Show Management</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <DollarSign className="h-4 w-4 text-yellow-400" />
                    <span>Expense Tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Guitar className="h-4 w-4 text-amber-400" />
                    <span>Gear Inventory</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Package className="h-4 w-4 text-purple-400" />
                    <span>Merch Management</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Users className="h-4 w-4 text-teal-400" />
                    <span>Contact Database</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    <span>Inspiration Board</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Share2 className="h-4 w-4 text-indigo-400" />
                    <span>Secure Sharing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Search className="h-4 w-4 text-zinc-400" />
                    <span>Global Search (⌘K)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Getting Started */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-violet-400" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                Get up and running in 5 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <p className="text-zinc-300">
                  Follow these steps to set up your workspace and start managing your band&apos;s work effectively.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-800 p-4">
                  <h3 className="font-semibold text-white mb-2">Step 1: Create Your First Project</h3>
                  <p className="text-sm text-zinc-400 mb-3">
                    A project represents your album, EP, single, or demo. It&apos;s the main container for organizing your music.
                  </p>
                  <ol className="text-sm text-zinc-400 list-decimal list-inside space-y-1">
                    <li>Go to <strong>Projects</strong> in the sidebar</li>
                    <li>Click <strong>New Project</strong></li>
                    <li>Enter the name, type (Album/EP/Single/Demo), and description</li>
                    <li>Set the status to match your current stage</li>
                  </ol>
                </div>

                <div className="rounded-lg border border-zinc-800 p-4">
                  <h3 className="font-semibold text-white mb-2">Step 2: Add Songs to Your Project</h3>
                  <p className="text-sm text-zinc-400 mb-3">
                    Songs live inside projects. Add all the tracks you&apos;re working on.
                  </p>
                  <ol className="text-sm text-zinc-400 list-decimal list-inside space-y-1">
                    <li>Open your project and go to the <strong>Songs</strong> tab</li>
                    <li>Click <strong>Add Song</strong></li>
                    <li>Enter song details: title, BPM, key, time signature</li>
                    <li>Upload an audio file if you have a demo or recording</li>
                  </ol>
                </div>

                <div className="rounded-lg border border-zinc-800 p-4">
                  <h3 className="font-semibold text-white mb-2">Step 3: Set Up Your Task Board</h3>
                  <p className="text-sm text-zinc-400 mb-3">
                    Break down your work into trackable tasks that can be assigned and completed.
                  </p>
                  <ol className="text-sm text-zinc-400 list-decimal list-inside space-y-1">
                    <li>Go to <strong>Tasks</strong> in the sidebar</li>
                    <li>Click <strong>Add Task</strong></li>
                    <li>Enter the task title, assign it, set priority and due date</li>
                    <li>Link the task to a project or specific song</li>
                    <li>Drag tasks between columns as work progresses</li>
                  </ol>
                </div>

                <div className="rounded-lg border border-zinc-800 p-4">
                  <h3 className="font-semibold text-white mb-2">Step 4: Schedule Your Events</h3>
                  <p className="text-sm text-zinc-400 mb-3">
                    Add rehearsals and shows to keep your band&apos;s schedule organized.
                  </p>
                  <ol className="text-sm text-zinc-400 list-decimal list-inside space-y-1">
                    <li>Go to <strong>Rehearsals</strong> or <strong>Shows</strong> in the sidebar</li>
                    <li>Add new events with date, time, and location</li>
                    <li>View everything on the <strong>Calendar</strong> page</li>
                    <li>Create <strong>Setlists</strong> for your performances</li>
                  </ol>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-white mb-4">Keyboard Shortcuts</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded bg-zinc-800/50 px-3 py-2">
                    <span className="text-zinc-300">Search Everything</span>
                    <kbd className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300">⌘K</kbd>
                  </div>
                  <div className="flex items-center justify-between rounded bg-zinc-800/50 px-3 py-2">
                    <span className="text-zinc-300">Toggle Sidebar</span>
                    <kbd className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300">⌘B</kbd>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-white mb-4">Pro Tips</h3>
                <ul className="text-sm text-zinc-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400">•</span>
                    Use the <strong>project selector</strong> in the header to filter content to your current project
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400">•</span>
                    Press <kbd className="rounded bg-zinc-700 px-1.5 py-0.5 text-xs">⌘K</kbd> to quickly search and navigate anywhere
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400">•</span>
                    Link tasks to specific songs to track what needs to be done for each track
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400">•</span>
                    Use the <strong>Inspiration Board</strong> to save references before you forget them
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400">•</span>
                    Log expenses as they happen - it&apos;s much easier than doing it all at tax time
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects & Songs */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-violet-400" />
                Projects
              </CardTitle>
              <CardDescription>
                Organize your music into albums, EPs, and singles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="create-project">
                  <AccordionTrigger>How to create a project</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Navigate to the <strong>Projects</strong> page from the sidebar</li>
                      <li>Click the <strong>&quot;New Project&quot;</strong> button</li>
                      <li>Enter a name and description for your project</li>
                      <li>Select the project type (Album, EP, Single, Demo)</li>
                      <li>Set the initial status and click <strong>&quot;Create&quot;</strong></li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="project-statuses">
                  <AccordionTrigger>Project status workflow</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-500/20 text-gray-400">Idea</Badge>
                        <span>→ Initial concept stage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-400">Writing</Badge>
                        <span>→ Songwriting and composition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400">Recording</Badge>
                        <span>→ In the studio recording</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-500/20 text-orange-400">Mixing</Badge>
                        <span>→ Mixing the tracks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500/20 text-purple-400">Mastering</Badge>
                        <span>→ Final mastering stage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400">Released</Badge>
                        <span>→ Published and available</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="upload-files">
                  <AccordionTrigger>Uploading files to projects</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Open a project and go to the <strong>Files</strong> tab</li>
                      <li>Click <strong>&quot;Upload Files&quot;</strong> button</li>
                      <li>Select one or multiple files (audio, images, documents)</li>
                      <li>Files are automatically categorized by type</li>
                      <li>Download files using the download icon</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-cyan-400" />
                Songs
              </CardTitle>
              <CardDescription>
                Track individual songs with metadata and audio files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="create-song">
                  <AccordionTrigger>Creating and managing songs</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Songs can be created from a project or the Songs page</li>
                      <li>Add metadata: BPM, key, time signature, duration</li>
                      <li>Upload audio files for playback in the app</li>
                      <li>Track song status through the production workflow</li>
                      <li>Add lyrics and notes in the song detail page</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="audio-player">
                  <AccordionTrigger>Using the audio player</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    <ul className="list-disc list-inside space-y-2">
                      <li>Click on a song with an audio file to play it</li>
                      <li>Use the waveform to scrub through the track</li>
                      <li>Adjust playback speed for practice</li>
                      <li>Loop sections for rehearsal</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tools */}
        <TabsContent value="production" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Piano className="h-5 w-5 text-emerald-400" />
                MIDI Builder
              </CardTitle>
              <CardDescription>
                Create and edit MIDI compositions
              </CardDescription>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">A full-featured piano roll editor for creating MIDI music:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Multi-track editing</strong> - Create multiple instrument tracks</li>
                <li><strong>Click and drag</strong> - Draw notes by clicking and dragging</li>
                <li><strong>Piano keyboard</strong> - Click keys to preview notes</li>
                <li><strong>Save/Load projects</strong> - Save your work and load it later</li>
                <li><strong>Export to MIDI</strong> - Download as standard MIDI files</li>
                <li><strong>Adjustable BPM and bars</strong> - Configure tempo and length</li>
                <li><strong>Track controls</strong> - Mute, solo, volume per track</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AudioLines className="h-5 w-5 text-pink-400" />
                Sample Library
              </CardTitle>
              <CardDescription>
                Upload and organize audio samples
              </CardDescription>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Manage your collection of audio samples:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Upload samples</strong> - Kick, snare, hi-hat, synths, loops, and more</li>
                <li><strong>Categorize</strong> - Organize by type (drums, bass, fx, vocals, etc.)</li>
                <li><strong>Tag and search</strong> - Add tags and find samples quickly</li>
                <li><strong>Preview</strong> - Click to play samples before using them</li>
                <li><strong>Metadata</strong> - Track BPM and musical key for loops</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-400" />
                Music Tools
              </CardTitle>
              <CardDescription>
                Practice and production utilities
              </CardDescription>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Essential tools for musicians:</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Timer className="h-4 w-4" /> Metronome
                  </h4>
                  <p className="text-sm">Adjustable BPM with time signature support and accent patterns.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Mic className="h-4 w-4" /> Tuner
                  </h4>
                  <p className="text-sm">Chromatic tuner with microphone input. Presets for guitar, bass, ukulele.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Ear className="h-4 w-4" /> Ear Training
                  </h4>
                  <p className="text-sm">Practice intervals, chords, and note recognition with scoring.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Piano className="h-4 w-4" /> Piano Keyboard
                  </h4>
                  <p className="text-sm">Interactive keyboard with sustain mode and octave selection.</p>
                </div>
              </div>
              <p className="mt-4 text-sm">Also includes: Drum Pads, Polyrhythm Trainer, BPM Calculator, Delay Time Calculator, and more.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planning */}
        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListMusic className="h-5 w-5 text-violet-400" />
                Setlists
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Create setlists for your live performances:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Add songs from your library to a setlist</li>
                <li>Drag and drop to reorder songs</li>
                <li>See total duration automatically calculated</li>
                <li>Add transition notes between songs</li>
                <li>Associate setlists with specific shows</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-cyan-400" />
                Rehearsals
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Schedule and track band rehearsals:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Set date, time, and location</li>
                <li>Define practice goals for each session</li>
                <li>Track attendance of band members</li>
                <li>Add notes and recordings from the session</li>
                <li>View in the calendar for easy scheduling</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-400" />
                Shows
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Manage your live performances:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Add venue details and location</li>
                <li>Set load-in, soundcheck, doors, and set times</li>
                <li>Track ticket prices and promoter info</li>
                <li>Link to a setlist for the show</li>
                <li>Manage show status (inquiry, confirmed, cancelled)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-400" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">View all your events in one place:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Shows, rehearsals, and task deadlines</li>
                <li>Switch between month, week, and day views</li>
                <li>Click on events to view details</li>
                <li>Color-coded by event type</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management */}
        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-violet-400" />
                Tasks (Kanban Board)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Manage your band&apos;s to-do list:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>To Do</strong> → Tasks that need to be started</li>
                <li><strong>In Progress</strong> → Currently being worked on</li>
                <li><strong>Review</strong> → Needs feedback or approval</li>
                <li><strong>Done</strong> → Completed tasks</li>
                <li>Drag tasks between columns to update status</li>
                <li>Assign tasks to specific band members</li>
                <li>Link tasks to projects or songs</li>
                <li>Set priorities and due dates</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                Finances
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Track band expenses and income:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Log expenses with categories (gear, studio, travel, etc.)</li>
                <li>Upload receipts for record keeping</li>
                <li>Track who paid for what</li>
                <li>View expense summaries and totals</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Guitar className="h-5 w-5 text-orange-400" />
                Gear Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Keep track of your equipment:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Add instruments, amps, pedals, and accessories</li>
                <li>Track brand, model, and serial numbers</li>
                <li>Log purchase price and current value</li>
                <li>Record maintenance history (string changes, repairs)</li>
                <li>Create a wishlist for future purchases</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-400" />
                Merch
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Manage your merchandise:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Add products (t-shirts, vinyl, posters, etc.)</li>
                <li>Track pricing and inventory levels</li>
                <li>Log sales by channel (shows, online)</li>
                <li>View sales reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Manage your music industry contacts:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Add venues, studios, engineers, photographers</li>
                <li>Store contact details and notes</li>
                <li>Track interaction history</li>
                <li>Quick access when booking shows</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                Inspiration Board
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Collect creative inspiration:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Save reference tracks and links</li>
                <li>Add mood boards and images</li>
                <li>Jot down ideas and concepts</li>
                <li>Tag items for easy filtering</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-violet-400" />
                Shares
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p className="mb-4">Share your work with others:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Create shareable links for songs or projects</li>
                <li>Set password protection</li>
                <li>Configure expiration dates</li>
                <li>Track view counts</li>
                <li>Control download permissions</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-violet-400" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger>How do I change my password?</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    Go to <strong>Settings → Profile</strong> and scroll down to the Password section.
                    Enter your current password and your new password twice to confirm.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2">
                  <AccordionTrigger>How do I invite band members?</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    Band members can register their own accounts. Currently, all registered users
                    have access to the same workspace. Admin roles can be assigned in Settings.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3">
                  <AccordionTrigger>What file types are supported?</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    <ul className="list-disc list-inside">
                      <li><strong>Audio:</strong> MP3, WAV, FLAC, AAC, OGG</li>
                      <li><strong>Images:</strong> JPG, PNG, GIF, WebP</li>
                      <li><strong>Documents:</strong> PDF, DOC, TXT</li>
                      <li><strong>Project files:</strong> REAPER (.rpp), MIDI</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-4">
                  <AccordionTrigger>How do I use the global project selector?</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    Click on the project dropdown in the header to select your active project.
                    This selection persists across pages and helps you stay focused on one project at a time.
                    Click the project badge to quickly navigate to the project details.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-5">
                  <AccordionTrigger>Can I export my data?</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    You can download individual files from projects and songs.
                    Full data export features are planned for future updates.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-6">
                  <AccordionTrigger>How do I report a bug or request a feature?</AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    Please contact your administrator or submit feedback through the designated channels.
                    We&apos;re always looking to improve the platform based on your needs.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
