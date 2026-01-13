import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:./dev.db',
});

async function migrate() {
  try {
    // Drop and recreate the share_links table
    await client.execute('PRAGMA foreign_keys=OFF');
    await client.execute('DROP TABLE IF EXISTS share_links');
    await client.execute(`
      CREATE TABLE share_links (
        id text PRIMARY KEY NOT NULL,
        token text NOT NULL,
        name text,
        share_type text NOT NULL,
        password text,
        expires_at integer,
        allow_download integer DEFAULT 0,
        view_count integer DEFAULT 0,
        max_views integer,
        is_active integer DEFAULT 1,
        include_config text,
        created_at integer NOT NULL,
        created_by_id text NOT NULL,
        project_id text,
        song_id text,
        file_id text,
        setlist_id text,
        rehearsal_id text,
        show_id text,
        media_id text,
        tempo_map_id text,
        FOREIGN KEY (created_by_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY (file_id) REFERENCES files(id) ON UPDATE no action ON DELETE cascade
      )
    `);
    await client.execute('CREATE UNIQUE INDEX share_links_token_unique ON share_links (token)');
    await client.execute('PRAGMA foreign_keys=ON');
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
