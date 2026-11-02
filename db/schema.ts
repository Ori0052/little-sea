import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const presence = sqliteTable('presence', { id: text('id').primaryKey(), seen: integer('seen').notNull(), state:text('state'),visitor:text('visitor_id') }, t=>[index('presence_seen_idx').on(t.seen)]);

export const beachSeats=sqliteTable('beach_seats',{seat:integer('seat').primaryKey(),visitor:text('visitor').notNull().unique(),session:text('session').notNull(),seen:integer('seen').notNull()},t=>[index('beach_seats_seen_idx').on(t.seen)]);

export const islandCampfire=sqliteTable('island_campfire',{id:integer('id').primaryKey(),lit:integer('lit').notNull().default(0),updated:integer('updated').notNull().default(0),woodUntil:integer('wood_until').notNull().default(0),auroraUntil:integer('aurora_until').notNull().default(0)});

export const islandFireSeats=sqliteTable('island_fire_seats',{seat:integer('seat').primaryKey(),visitor:text('visitor').notNull().unique(),session:text('session').notNull(),seen:integer('seen').notNull()},t=>[index('island_fire_seats_seen_idx').on(t.seen)]);

export const islandPotatoes=sqliteTable('island_potatoes',{visitor:text('visitor').primaryKey(),readyAt:integer('ready_at').notNull()});
