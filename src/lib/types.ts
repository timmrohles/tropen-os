// Tropen OS v2 – TypeScript Types (Task Routing Architecture)

export type Plan = 'free' | 'pro' | 'enterprise'
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'
export type WorkspaceRole = 'admin' | 'member' | 'viewer'
export type MessageRole = 'user' | 'assistant'
export type Provider = 'openai' | 'anthropic' | 'mistral' | 'google'
export type ModelClass = 'fast' | 'deep' | 'safe'
export type TaskType = 'chat' | 'summarize' | 'extract' | 'research' | 'create'
export type Agent = 'general' | 'knowledge' | 'content' | 'business'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: Plan
  budget_limit: number | null
  created_at: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  full_name: string | null
  role: OrgRole
  is_active: boolean
  created_at: string
}

export interface Workspace {
  id: string
  organization_id: string
  name: string
  description: string | null
  allowed_model_classes: ModelClass[]
  budget_limit: number | null
  created_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
}

export interface Conversation {
  id: string
  workspace_id: string
  user_id: string
  title: string | null
  dify_conversation_id: string | null
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  model_used: string | null
  task_type: TaskType | null
  agent: Agent | null
  model_class: ModelClass | null
  tokens_input: number | null
  tokens_output: number | null
  cost_eur: number | null
  created_at: string
}

export interface ModelCatalog {
  id: string
  name: string
  provider: Provider
  model_class: ModelClass
  cost_per_1k_input: number
  cost_per_1k_output: number
  is_active: boolean
  description: string | null
  created_at: string
}

export interface UsageLog {
  id: string
  organization_id: string
  workspace_id: string
  user_id: string
  model_id: string
  task_type: TaskType | null
  agent: Agent | null
  model_class: ModelClass | null
  tokens_input: number | null
  tokens_output: number | null
  cost_eur: number | null
  created_at: string
}

// Routing info returned by Edge Function
export interface RoutingInfo {
  task_type: TaskType
  agent: Agent
  model_class: ModelClass
  model: string
}

// Supabase Database type (für createClient<Database>)
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at'>
        Update: Partial<Omit<Organization, 'id'>>
      }
      users: { Row: User; Insert: Omit<User, 'created_at'>; Update: Partial<Omit<User, 'id'>> }
      workspaces: {
        Row: Workspace
        Insert: Omit<Workspace, 'id' | 'created_at'>
        Update: Partial<Omit<Workspace, 'id'>>
      }
      workspace_members: {
        Row: WorkspaceMember
        Insert: WorkspaceMember
        Update: Partial<WorkspaceMember>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at'>
        Update: Partial<Omit<Conversation, 'id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id'>>
      }
      model_catalog: {
        Row: ModelCatalog
        Insert: Omit<ModelCatalog, 'id' | 'created_at'>
        Update: Partial<Omit<ModelCatalog, 'id'>>
      }
      usage_logs: {
        Row: UsageLog
        Insert: Omit<UsageLog, 'id' | 'created_at'>
        Update: Partial<Omit<UsageLog, 'id'>>
      }
    }
  }
}
