// knex.schema.hasTable('VerificationToken').then(function(exists) {
//     if (!exists) {
//         var schemaPromise = knex.schema.createTableIfNotExists('VerificationToken', function(table) {
//             table.string('email');
//             table.string('userName');
//             table.boolean('isDelete').defaultTo(false);
//             table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
//             table.boolean('isVerify').defaultTo(false);
//             table.string('token');
//             }).then(function(data) {
//             console.log("VerificationToken Table added");
//         });
//     } else {
//         knex.schema.hasColumn('VerificationToken', 'userId').then((isColumn) => {
//             if (isColumn != true) {
//                 knex.schema.table('VerificationToken', function(table) {
//                     table.integer('userId').unsigned();
//                     table.foreign('userId').references('ExchangeUser.userId').onDelete('CASCADE');
//                 }).then(function(data) {
//                     console.log("userId of VerificationToken table  references added to ExchangeUser table");
//                 });
//             }
//         });
//     }
// })
//
// // VerificationToken model.
// function VerificationToken() {
//     // Model.apply(this, arguments);
// }
//
// VerificationToken.tableName = 'VerificationToken';
// Model.extend(VerificationToken);
// module.exports = VerificationToken;
