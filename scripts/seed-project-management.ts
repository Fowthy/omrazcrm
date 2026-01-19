import { db, labels, boardConfigs } from '../src/lib/db';
import { nanoid } from 'nanoid';

async function seedProjectManagement() {
  console.log('Seeding project management data...');

  try {
    // Create default labels for music projects
    const defaultLabels = [
      { name: 'Urgent', color: '#EF4444', description: 'Needs immediate attention' },
      { name: 'Bug', color: '#DC2626', description: 'Something is broken' },
      { name: 'Recording', color: '#8B5CF6', description: 'Studio recording work' },
      { name: 'Mixing', color: '#06B6D4', description: 'Mixing tasks' },
      { name: 'Mastering', color: '#14B8A6', description: 'Mastering tasks' },
      { name: 'Marketing', color: '#F59E0B', description: 'Promotional activities' },
      { name: 'Video', color: '#EC4899', description: 'Music video related' },
      { name: 'Live Show', color: '#10B981', description: 'Performance related' },
      { name: 'Rehearsal', color: '#6366F1', description: 'Band practice' },
      { name: 'Writing', color: '#A855F7', description: 'Songwriting' },
      { name: 'Blocked', color: '#EF4444', description: 'Cannot proceed' },
      { name: 'Feedback', color: '#F97316', description: 'Needs review' },
      { name: 'High Priority', color: '#DC2626', description: 'Important task' },
      { name: 'Low Priority', color: '#64748B', description: 'Can wait' },
    ];

    console.log('Creating default labels...');
    for (const label of defaultLabels) {
      await db.insert(labels).values({
        id: nanoid(),
        name: label.name,
        color: label.color,
        description: label.description,
        projectId: null, // Global labels
      }).onConflictDoNothing();
    }

    // Create default board configurations
    const defaultBoardConfig = {
      id: nanoid(),
      name: 'Default Kanban Board',
      description: 'Standard kanban board for music projects',
      type: 'kanban' as const,
      columns: JSON.stringify([
        { id: 'backlog', name: 'Backlog', status: 'backlog', color: '#64748B', limit: null },
        { id: 'todo', name: 'To Do', status: 'todo', color: '#3B82F6', limit: 10 },
        { id: 'in_progress', name: 'In Progress', status: 'in_progress', color: '#8B5CF6', limit: 5 },
        { id: 'review', name: 'Review', status: 'review', color: '#F59E0B', limit: 3 },
        { id: 'done', name: 'Done', status: 'done', color: '#10B981', limit: null },
      ]),
      swimlanes: JSON.stringify({ groupBy: 'priority' }),
      projectId: null,
      isDefault: true,
      createdById: 'system',
    };

    console.log('Creating default board configuration...');
    await db.insert(boardConfigs).values(defaultBoardConfig).onConflictDoNothing();

    // Create music-specific board configuration
    const musicBoardConfig = {
      id: nanoid(),
      name: 'Music Production Board',
      description: 'Board optimized for music production workflow',
      type: 'kanban' as const,
      columns: JSON.stringify([
        { id: 'idea', name: 'Ideas', status: 'backlog', color: '#A855F7', limit: null },
        { id: 'writing', name: 'Writing', status: 'todo', color: '#8B5CF6', limit: 8 },
        { id: 'pre_production', name: 'Pre-Production', status: 'in_progress', color: '#06B6D4', limit: 5 },
        { id: 'recording', name: 'Recording', status: 'in_progress', color: '#3B82F6', limit: 3 },
        { id: 'mixing', name: 'Mixing', status: 'review', color: '#14B8A6', limit: 3 },
        { id: 'mastering', name: 'Mastering', status: 'review', color: '#10B981', limit: 2 },
        { id: 'released', name: 'Released', status: 'done', color: '#22C55E', limit: null },
      ]),
      swimlanes: JSON.stringify({ groupBy: 'assignee' }),
      projectId: null,
      isDefault: false,
      createdById: 'system',
    };

    console.log('Creating music production board configuration...');
    await db.insert(boardConfigs).values(musicBoardConfig).onConflictDoNothing();

    console.log('✅ Project management data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding project management data:', error);
    throw error;
  }
}

// Run the seed function
seedProjectManagement()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
