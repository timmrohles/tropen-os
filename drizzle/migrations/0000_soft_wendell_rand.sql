CREATE TYPE "public"."card_status" AS ENUM('waiting', 'active', 'review', 'done', 'archived');--> statement-breakpoint
CREATE TYPE "public"."card_type" AS ENUM('input', 'process', 'output');--> statement-breakpoint
CREATE TYPE "public"."connection_strength" AS ENUM('required', 'optional');--> statement-breakpoint
CREATE TYPE "public"."connection_type" AS ENUM('data', 'logic', 'temporal', 'thematic');--> statement-breakpoint
CREATE TYPE "public"."knowledge_entry_type" AS ENUM('document', 'url', 'note', 'generated', 'data');--> statement-breakpoint
CREATE TYPE "public"."ws_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."ws_message_scope" AS ENUM('workspace', 'card');--> statement-breakpoint
CREATE TYPE "public"."operator_status" AS ENUM('queued', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."operator_type" AS ENUM('coherence', 'plausibility', 'temporal', 'forecast', 'generate');--> statement-breakpoint
CREATE TYPE "public"."outcome_type" AS ENUM('scorm', 'pdf', 'dashboard', 'slide_deck', 'brief', 'api_feed', 'custom');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('owner', 'editor', 'reviewer', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."workspace_domain" AS ENUM('marketing', 'research', 'learning', 'legal', 'product', 'custom');--> statement-breakpoint
CREATE TABLE "card_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_reason" text,
	"triggered_by" uuid,
	"triggered_by_operator" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "card_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "card_status" DEFAULT 'waiting' NOT NULL,
	"model" varchar(64) DEFAULT 'claude',
	"position_x" integer DEFAULT 0 NOT NULL,
	"position_y" integer DEFAULT 0 NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"from_card_id" uuid NOT NULL,
	"to_card_id" uuid NOT NULL,
	"type" "connection_type" NOT NULL,
	"strength" "connection_strength" DEFAULT 'required' NOT NULL,
	"label" varchar(255),
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"card_id" uuid,
	"type" "knowledge_entry_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"source_url" text,
	"file_path" text,
	"structured_data" jsonb,
	"search_vector" "tsvector",
	"added_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "operator_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"result" jsonb NOT NULL,
	"summary" text,
	"severity" varchar(32) DEFAULT 'info' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "operator_type" NOT NULL,
	"status" "operator_status" DEFAULT 'queued' NOT NULL,
	"scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"triggered_by" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "outcome_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"source_card_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"file_path" text,
	"external_url" text,
	"payload" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"auto_regenerate" boolean DEFAULT false NOT NULL,
	"source_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_by" uuid,
	"generated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspace_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"card_id" uuid,
	"scope" "ws_message_scope" NOT NULL,
	"role" "ws_message_role" NOT NULL,
	"content" text NOT NULL,
	"context_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model" varchar(64),
	"tokens_input" integer,
	"tokens_output" integer,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "participant_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" "workspace_domain" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"definition" jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"domain" "workspace_domain" DEFAULT 'custom' NOT NULL,
	"goal" text,
	"template_id" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "card_history" ADD CONSTRAINT "card_history_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_history" ADD CONSTRAINT "card_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_from_card_id_cards_id_fk" FOREIGN KEY ("from_card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_to_card_id_cards_id_fk" FOREIGN KEY ("to_card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_results" ADD CONSTRAINT "operator_results_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_results" ADD CONSTRAINT "operator_results_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operators" ADD CONSTRAINT "operators_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_messages" ADD CONSTRAINT "workspace_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_messages" ADD CONSTRAINT "workspace_messages_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_participants" ADD CONSTRAINT "workspace_participants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_template_id_workspace_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workspace_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_history_card_id_idx" ON "card_history" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "card_history_workspace_id_idx" ON "card_history" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "card_history_created_at_idx" ON "card_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cards_workspace_id_idx" ON "cards" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "cards_type_idx" ON "cards" USING btree ("type");--> statement-breakpoint
CREATE INDEX "cards_status_idx" ON "cards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cards_sort_order_idx" ON "cards" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "cards_created_at_idx" ON "cards" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cards_deleted_at_idx" ON "cards" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "connections_from_to_type_idx" ON "connections" USING btree ("from_card_id","to_card_id","type");--> statement-breakpoint
CREATE INDEX "connections_workspace_id_idx" ON "connections" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "connections_from_card_id_idx" ON "connections" USING btree ("from_card_id");--> statement-breakpoint
CREATE INDEX "connections_to_card_id_idx" ON "connections" USING btree ("to_card_id");--> statement-breakpoint
CREATE INDEX "connections_type_idx" ON "connections" USING btree ("type");--> statement-breakpoint
CREATE INDEX "knowledge_entries_workspace_id_idx" ON "knowledge_entries" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_entries_card_id_idx" ON "knowledge_entries" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "knowledge_entries_type_idx" ON "knowledge_entries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "knowledge_entries_created_at_idx" ON "knowledge_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "knowledge_entries_deleted_at_idx" ON "knowledge_entries" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "operator_results_operator_id_idx" ON "operator_results" USING btree ("operator_id");--> statement-breakpoint
CREATE INDEX "operator_results_workspace_id_idx" ON "operator_results" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "operators_workspace_id_idx" ON "operators" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "operators_type_idx" ON "operators" USING btree ("type");--> statement-breakpoint
CREATE INDEX "operators_status_idx" ON "operators" USING btree ("status");--> statement-breakpoint
CREATE INDEX "operators_created_at_idx" ON "operators" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "outcomes_workspace_id_idx" ON "outcomes" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "outcomes_type_idx" ON "outcomes" USING btree ("type");--> statement-breakpoint
CREATE INDEX "outcomes_deleted_at_idx" ON "outcomes" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "workspace_messages_workspace_id_idx" ON "workspace_messages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_messages_card_id_idx" ON "workspace_messages" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "workspace_messages_scope_idx" ON "workspace_messages" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "workspace_messages_created_at_idx" ON "workspace_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_participants_workspace_user_idx" ON "workspace_participants" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_participants_workspace_id_idx" ON "workspace_participants" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_participants_user_id_idx" ON "workspace_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_templates_domain_idx" ON "workspace_templates" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "workspace_templates_is_public_idx" ON "workspace_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "workspaces_department_id_idx" ON "workspaces" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "workspaces_domain_idx" ON "workspaces" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "workspaces_created_by_idx" ON "workspaces" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "workspaces_created_at_idx" ON "workspaces" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "workspaces_deleted_at_idx" ON "workspaces" USING btree ("deleted_at");