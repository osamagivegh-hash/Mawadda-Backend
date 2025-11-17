/**
 * Migration Script: Fix User Roles and Status
 * 
 * This script fixes:
 * 1. Users with role="male" or role="female" → set to role="user"
 * 2. All users with status != "active" → set to status="active"
 * 
 * Run this directly in MongoDB shell or via a migration runner:
 * 
 * db.users.updateMany(
 *   { role: { $in: ["male", "female"] } },
 *   { $set: { role: "user" } }
 * );
 * 
 * db.users.updateMany(
 *   { status: { $ne: "active" } },
 *   { $set: { status: "active" } }
 * );
 */

export const fixUserRolesAndStatus = `
// Fix incorrect role values (male/female → user)
db.users.updateMany(
  { role: { $in: ["male", "female"] } },
  { $set: { role: "user" } }
);

// Set all users to ACTIVE status
db.users.updateMany(
  { status: { $ne: "active" } },
  { $set: { status: "active" } }
);
`;

