import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
export const presence = sqliteTable('presence', { id: text('id').primaryKey(), seen: integer('seen').notNull(), state:text('state'),visitor:text('visitor_id') }, t=>[index('presence_seen_idx').on(t.seen)]);

export const beachSeats=sqliteTable('beach_seats',{seat:integer('seat').primaryKey(),visitor:text('visitor').notNull().unique(),session:text('session').notNull(),seen:integer('seen').notNull()},t=>[index('beach_seats_seen_idx').on(t.seen)]);

export const islandCampfire=sqliteTable('island_campfire',{id:integer('id').primaryKey(),lit:integer('lit').notNull().default(0),updated:integer('updated').notNull().default(0),woodUntil:integer('wood_until').notNull().default(0),auroraUntil:integer('aurora_until').notNull().default(0)});

export const islandFireSeats=sqliteTable('island_fire_seats',{seat:integer('seat').primaryKey(),visitor:text('visitor').notNull().unique(),session:text('session').notNull(),seen:integer('seen').notNull()},t=>[index('island_fire_seats_seen_idx').on(t.seen)]);

export const islandPotatoes=sqliteTable('island_potatoes',{visitor:text('visitor').primaryKey(),readyAt:integer('ready_at').notNull()});

export const islandAnglers=sqliteTable('island_anglers',{visitor:text('visitor').primaryKey(),fishCount:integer('fish_count').notNull().default(0),castReadyAt:integer('cast_ready_at'),castX:real('cast_x'),castZ:real('cast_z'),fishReadyAt:integer('fish_ready_at')});

export const seaBoat=sqliteTable('sea_boat',{id:integer('id').primaryKey(),x:real('x').notNull().default(0),z:real('z').notNull().default(8.5),heading:real('heading').notNull().default(0),targetX:real('target_x'),targetZ:real('target_z'),departed:integer('departed').notNull().default(0),captain:text('captain')});
export const boatPassengers=sqliteTable('boat_passengers',{seat:integer('seat').primaryKey(),visitor:text('visitor').notNull().unique(),session:text('session').notNull(),seen:integer('seen').notNull()},t=>[index('boat_passengers_seen_idx').on(t.seen)]);

export const seaVisitors=sqliteTable('sea_visitors',{visitor:text('visitor').primaryKey(),proofHash:text('proof_hash').notNull(),createdAt:integer('created_at').notNull()});
export const seaSessions=sqliteTable('sea_sessions',{id:text('id').primaryKey(),visitor:text('visitor').notNull(),tokenHash:text('token_hash').notNull(),network:text('network').notNull(),createdAt:integer('created_at').notNull(),expiresAt:integer('expires_at').notNull()},t=>[index('sea_sessions_visitor_idx').on(t.visitor),index('sea_sessions_expiry_idx').on(t.expiresAt)]);
export const seaRateLimits=sqliteTable('sea_rate_limits',{key:text('key').primaryKey(),windowStart:integer('window_start').notNull(),count:integer('count').notNull()});
