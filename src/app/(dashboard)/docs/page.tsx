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

      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="projects">Projects & Songs</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Getting Started */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-violet-400" />
                Welcome to Omraz Studio
              </CardTitle>
              <CardDescription>
                Your all-in-one band management platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <p className="text-zinc-300">
                  Omraz Studio is designed to help bands and music creators organize their creative work,
                  manage projects, track tasks, and collaborate effectively. Here&apos;s how to get started:
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 p-4">
                  <h3 className="font-semibold text-white mb-2">1. Select a Project</h3>
                  <p className="text-sm text-zinc-400">
                    Use the project selector in the header to choose your active project.
                    This helps filter content across the app to your current work.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 p-4">
                  <h3 className="font-semibold text-white mb-2">2. Create Songs</h3>
                  <p className="text-sm text-zinc-400">
                    Add songs to your project with BPM, key, and status tracking.
                    Upload audio files and manage different versions.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 p-4">
                  <h3 className="font-semibold text-white mb-2">3. Manage Tasks</h3>
                  <p className="text-sm text-zinc-400">
                    Use the Kanban board to track tasks. Assign to band members,
                    set priorities, and link tasks to specific songs.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 p-4">
                  <h3 className="font-semibold text-white mb-2">4. Plan Events</h3>
                  <p className="text-sm text-zinc-400">
                    Schedule rehearsals, shows, and deadlines using the calendar.
                    Create setlists for your performances.
                  </p>
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
