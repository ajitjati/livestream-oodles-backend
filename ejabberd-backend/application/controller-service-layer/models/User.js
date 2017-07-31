// knex.schema.hasTable('User').then(function(exists) {
//     if (!exists) {
//         var schemaPromise = knex.schema.createTableIfNotExists('User', function(table) {
//             table.increments('userId').primary();
//             table.string('email').unique();
//             table.string('firstName');
//             table.string('lastName');
//             table.string('userName').unique();
//             table.enu('role', ["ROLE_ADMIN", "ROLE_USER", "ROLE_SUPERADMIN"]);
//             table.string('password');
//             table.boolean('isDelete').defaultTo(false);
//             table.boolean('isEnable').defaultTo(false);
//             table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
//         }).then(function(data) {
//             console.log("User Table added:::creating admin now::");
//             var password = "admin@12345";
//             bcrypt.hash(password, 5, function(err, encryptPsw) {
//                 knex('User').insert({
//                     email:"admin@daxxcoin.com",
//                     userName: "daxx@admin",
//                     firstName: "admin",
//                     lastName: "admin",
//                     isEnable: true,
//                     password: encryptPsw,
//                     role: configurationHolder.Role.ROLE_ADMIN
//                 }).returning('id').on('query-error', function(error, obj) {
//                     console.log("admin insert err");
//                 }).then(function(result) {
//                    if(result){
//                      console.log("admin created successfully::");
//                    }
//                    else{
//                      console.log("error in creating admin");
//                    }
//                 });
//             });
//         });
//     } else {
//         // knex.schema.hasColumn('User', 'packageId').then((isColumn) => {
//         //     if (isColumn != true) {
//         //         knex.schema.table('User', function(table) {
//         //             table.integer('packageId').unsigned();
//         //             table.foreign('packageId').references('Package.packageId').onDelete('CASCADE');
//         //         }).then(function(data) {
//         //             console.log("PackageId refereces added in user table");
//         //         });
//         //     }
//         // });
//     }
// })
//
// // User model.
// function User() {
//     // Model.apply(this, arguments);
// }
//
// User.tableName = 'User';
// Model.extend(User);
// module.exports = User;
