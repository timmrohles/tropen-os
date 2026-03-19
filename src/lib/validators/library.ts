import { z } from 'zod'

export const resolveWorkflowSchema = z.object({
  roleId:       z.string().uuid().optional(),
  capabilityId: z.string().uuid(),
  outcomeId:    z.string().uuid(),
  skillId:      z.string().uuid().optional(),
  projectId:    z.string().uuid().optional(),
})

export const createRoleSchema = z.object({
  name:                      z.string().min(1).max(80),
  label:                     z.string().min(1).max(120),
  icon:                      z.string().max(10).optional(),
  description:               z.string().max(500).optional(),
  scope:                     z.enum(['org','user','public']),
  system_prompt:             z.string().min(1).max(8000),
  domain_keywords:           z.array(z.string()).default([]),
  vocabulary:                z.array(z.string()).default([]),
  preferred_capability_types:z.array(z.string()).default([]),
  preferred_skill_names:     z.array(z.string()).default([]),
  preferred_outcome_types:   z.array(z.string()).default([]),
  recommended_model_class:   z.enum(['fast','deep','safe']).default('deep'),
})

export const updateRoleSchema = createRoleSchema.partial().extend({
  is_active:  z.boolean().optional(),
  is_public:  z.boolean().optional(),
  is_default: z.boolean().optional(),
})

export const adoptSchema = z.object({
  scope: z.enum(['org','user']),
  label: z.string().min(1).max(120).optional(),
})

export const adoptSkillSchema = z.object({
  scope: z.enum(['org','user']),
  title: z.string().min(1).max(120).optional(),
})

export const createSkillSchema = z.object({
  name:                       z.string().min(1).max(80),
  title:                      z.string().min(1).max(120),
  icon:                       z.string().max(10).optional(),
  description:                z.string().max(500).optional(),
  scope:                      z.enum(['org','user','public']),
  instructions:               z.string().min(1).max(8000),
  quality_criteria:           z.string().max(1000).optional(),
  output_type:                z.enum(['text','json','artifact','notification']).default('text'),
  trigger_keywords:           z.array(z.string()).default([]),
  recommended_role_name:      z.string().max(80).optional(),
  recommended_capability_type:z.string().max(80).optional(),
})

export const updateSkillSchema = createSkillSchema.partial().extend({
  is_active:  z.boolean().optional(),
  is_public:  z.boolean().optional(),
})

export const orgSettingsUpdateSchema = z.object({
  entity_type:        z.enum(['capability','role','skill']),
  entity_id:          z.string().uuid(),
  is_enabled:         z.boolean().optional(),
  is_featured:        z.boolean().optional(),
  custom_label:       z.string().max(120).optional().nullable(),
  sort_order_override:z.number().int().optional().nullable(),
})

export const userSettingsUpdateSchema = z.object({
  entity_type: z.string(),
  entity_id:   z.string().uuid(),
  is_pinned:   z.boolean().optional(),
})
