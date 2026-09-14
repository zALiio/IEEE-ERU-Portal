// Single source of truth for roles and what each role may do.
//
// Guard rails must ALSO be enforced by Supabase Row Level Security — these
// helpers only control what the UI shows. See the RLS checklist in the repo
// notes before launch.
export const ROLES = ['member', 'leader', 'excom', 'admin']

// Founder/executive roles that don't belong to an operational team.
export const FOUNDER_ROLES = ['excom', 'admin']

export const hasRole = (profile, ...roles) => roles.includes(profile?.role)

// Anyone who can create/manage operational content (events, announcements).
export const isManager = (profile) => hasRole(profile, 'excom', 'admin')

// A leader manages their team; excom/admin manage everything.
export const canLead = (profile) => hasRole(profile, 'leader', 'excom', 'admin')

// Only admins can hand out the admin role.
export const canGrantAdmin = (profile) => profile?.role === 'admin'

// Roles an approver is allowed to grant to a new member.
export const grantableRoles = (profile) =>
  canGrantAdmin(profile) ? ROLES : ROLES.filter((r) => r !== 'admin')