-- Add tree structure fields to chat_messages table
ALTER TABLE "chat_messages" ADD COLUMN "parent_id" varchar(255);
ALTER TABLE "chat_messages" ADD COLUMN "version_group_id" varchar(255);
ALTER TABLE "chat_messages" ADD COLUMN "version_number" integer DEFAULT 1;
ALTER TABLE "chat_messages" ADD COLUMN "is_edited" boolean DEFAULT false;
ALTER TABLE "chat_messages" ADD COLUMN "is_active" boolean DEFAULT true;

-- Add foreign key constraint for parent_id
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "chat_messages"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX "idx_chat_messages_parent_id" ON "chat_messages"("parent_id");
CREATE INDEX "idx_chat_messages_version_group_id" ON "chat_messages"("version_group_id");
CREATE INDEX "idx_chat_messages_is_active" ON "chat_messages"("is_active");
CREATE INDEX "idx_chat_messages_conversation_active" ON "chat_messages"("conversation_id", "is_active");
