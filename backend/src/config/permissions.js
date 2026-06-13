// permissions.js — single source of truth for roles and permissions

export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  SUSPEND_USERS: 'suspend_users',
  CHANGE_USER_ROLES: 'change_user_roles',

  // Event management
  VIEW_ALL_EVENTS: 'view_all_events',
  EDIT_ANY_EVENT: 'edit_any_event',
  DELETE_ANY_EVENT: 'delete_any_event',
  CHANGE_EVENT_STATUS: 'change_event_status',
  APPROVE_ORGANIZERS: 'approve_organizers',

  // Category management
  MANAGE_CATEGORIES: 'manage_categories',

  // Blog management
  CREATE_BLOG_POST: 'create_blog_post',
  EDIT_ANY_BLOG_POST: 'edit_any_blog_post',
  DELETE_ANY_BLOG_POST: 'delete_any_blog_post',
  PUBLISH_BLOG_POST: 'publish_blog_post',

  // Support / tickets
  VIEW_ALL_SUPPORT_TICKETS: 'view_all_support_tickets',
  REPLY_SUPPORT_TICKET: 'reply_support_ticket',
  CLOSE_SUPPORT_TICKET: 'close_support_ticket',
  VIEW_ALL_ORDERS: 'view_all_orders',
  REFUND_ORDERS: 'refund_orders',

  // Analytics
  VIEW_ANALYTICS: 'view_analytics',

  // Role / employee management
  MANAGE_ROLES: 'manage_roles',
  MANAGE_EMPLOYEES: 'manage_employees',
};

// Ordered from least → most privileged
export const ROLES = {
  attendee: 'attendee',
  organizer: 'organizer',
  support_agent: 'support_agent',
  admin: 'admin',
  superadmin: 'superadmin',
};

export const ROLE_PERMISSIONS = {
  attendee: [],

  organizer: [],

  support_agent: [
    PERMISSIONS.VIEW_ALL_SUPPORT_TICKETS,
    PERMISSIONS.REPLY_SUPPORT_TICKET,
    PERMISSIONS.CLOSE_SUPPORT_TICKET,
    PERMISSIONS.VIEW_ALL_ORDERS,
  ],

  admin: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.SUSPEND_USERS,
    PERMISSIONS.CHANGE_USER_ROLES,
    PERMISSIONS.VIEW_ALL_EVENTS,
    PERMISSIONS.EDIT_ANY_EVENT,
    PERMISSIONS.DELETE_ANY_EVENT,
    PERMISSIONS.CHANGE_EVENT_STATUS,
    PERMISSIONS.APPROVE_ORGANIZERS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.CREATE_BLOG_POST,
    PERMISSIONS.EDIT_ANY_BLOG_POST,
    PERMISSIONS.DELETE_ANY_BLOG_POST,
    PERMISSIONS.PUBLISH_BLOG_POST,
    PERMISSIONS.VIEW_ALL_SUPPORT_TICKETS,
    PERMISSIONS.REPLY_SUPPORT_TICKET,
    PERMISSIONS.CLOSE_SUPPORT_TICKET,
    PERMISSIONS.VIEW_ALL_ORDERS,
    PERMISSIONS.REFUND_ORDERS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_EMPLOYEES,
  ],

  superadmin: Object.values(PERMISSIONS),
};

export function hasPermission(user, permission) {
  if (!user) return false;
  const role = user.role;

  // Superadmin has everything
  if (role === ROLES.superadmin) return true;

  // If the user has a custom role assigned, use that role's permission set
  // (customRole is populated by the authenticate middleware)
  if (user.customRole && user.customRole.permissions) {
    if (user.customRole.permissions.includes(permission)) return true;
  } else {
    // Fall back to system role permissions
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    if (rolePerms.includes(permission)) return true;
  }

  // customPermissions always overlay on top of either source
  const custom = user.customPermissions || [];
  return custom.includes(permission);
}
