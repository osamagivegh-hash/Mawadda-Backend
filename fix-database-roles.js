/**
 * MongoDB Script to Fix User Roles and Status
 * 
 * Run this script in MongoDB shell:
 * mongo <your-database-name> fix-database-roles.js
 * 
 * Or via mongosh:
 * mongosh <connection-string> --file fix-database-roles.js
 */

// Fix incorrect role values (male/female → user)
const roleFixResult = db.users.updateMany(
  { role: { $in: ["male", "female"] } },
  { $set: { role: "user" } }
);

print(`✅ Fixed ${roleFixResult.modifiedCount} users with incorrect role values (male/female → user)`);

// Set all users to ACTIVE status
const statusFixResult = db.users.updateMany(
  { status: { $ne: "active" } },
  { $set: { status: "active" } }
);

print(`✅ Updated ${statusFixResult.modifiedCount} users to ACTIVE status`);

// Show summary
const totalUsers = db.users.countDocuments();
const activeUsers = db.users.countDocuments({ status: "active" });
const userRoleUsers = db.users.countDocuments({ role: "user" });

print(`\n📊 Summary:`);
print(`   Total users: ${totalUsers}`);
print(`   Active users: ${activeUsers}`);
print(`   Users with role="user": ${userRoleUsers}`);

print(`\n✅ Database fix completed!`);







