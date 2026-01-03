import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`categories\` ADD \`description\` text;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`featured_asset_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`categories_featured_asset_idx\` ON \`categories\` (\`featured_asset_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`parent_id\` integer,
  	\`generate_slug\` integer DEFAULT true,
  	\`slug\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_categories\`("id", "title", "parent_id", "generate_slug", "slug", "updated_at", "created_at") SELECT "id", "title", "parent_id", "generate_slug", "slug", "updated_at", "created_at" FROM \`categories\`;`)
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories\` RENAME TO \`categories\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`categories_parent_idx\` ON \`categories\` (\`parent_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_slug_idx\` ON \`categories\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
}
