// knex.schema.hasTable('Role').then(function(exists) {
//     if (!exists) {
//         var schemaPromise = knex.schema.createTableIfNotExists('Role', function(table) {
//             table.increments('roleId').primary();
//             table.enu('role', ["ROLE_ADMIN", "ROLE_USER", "ROLE_SUPERADMIN"]);
//             table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
//         }).then(function(data) {
//             console.log("Role Table added ");
//             knex('Role').insert(
//                 [{
//                     role: 'ROLE_ADMIN'
//                 }, {
//                     role: 'ROLE_USER'
//                 }, {
//                     role: 'ROLE_SUPERADMIN'
//                 }]
//             ).then(function(insertedRecord) {
//                 if (insertedRecord) {
//                     console.log("default roles inserted");
//                 } else {
//                     console.log("error in inserting roles");
//                 }
//             })
//         });
//     } else {}
// });
//
// function Role() {
//     // Model.apply(this, arguments);
// }
//
// Role.tableName = 'Role';
//
// // Basic ES6 compatible prototypal inheritance.
// Model.extend(Role);
// module.exports = Role;
