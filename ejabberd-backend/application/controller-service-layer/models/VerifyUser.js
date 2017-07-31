// knex.schema.hasTable('VerifyUser').then(function(exists) {
//     if (!exists) {
//         var schemaPromise = knex.schema.createTableIfNotExists('VerifyUser', function(table) {
//             table.increments('id').primary();
//             table.string('password');// verification code for username by their registered mail id code to generate wallet
//             table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
//         }).then(function(data) {
//             console.log("VerifyUser Table added ");
//         });
//     } else {
//         knex.schema.hasColumn('VerifyUser', 'userId').then((isColumn) => {
//             if (isColumn != true) {
//                 knex.schema.table('VerifyUser', function(table) {
//                     table.integer('userId').unsigned();
//                     table.foreign('userId').references('1483_ft_individual.id').onDelete('CASCADE');
//                 }).then(function(data) {
//                     console.log("userId column of VerifyUser table refereces to id column of 1483_ft_individual");
//                 });
//             }
//         });
//     }
// });
//
// function VerifyUser() {
//     // Model.apply(this, arguments);
// }
//
// VerifyUser.tableName = 'VerifyUser';
// // Basic ES6 compatible prototypal inheritance.
// Model.extend(VerifyUser);
// module.exports = VerifyUser;
