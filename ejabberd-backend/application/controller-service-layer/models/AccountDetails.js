// knex.schema.hasTable('AccountDetails').then(function(exists) {
//     if (!exists) {
//         var schemaPromise = knex.schema.createTableIfNotExists('AccountDetails', function(table) {
//             table.increments('accountId').primary();
//             // table.bigInteger('freeTokenCount').defaultTo(0);
//             // table.bigInteger('purchasedTokenCount').defaultTo(0);
//             table.integer('tokenCount').defaultTo(0);
//             table.integer('tokensInConversion').defaultTo(0);
//             table.integer('convertedTokenCount').defaultTo(0);
//             table.integer('coinCount').defaultTo(0);
//             // table.string('ethereumAddress');
//             // table.bigInteger('ethereumBalance');
//             // table.integer('memberId');
//             table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
//             table.boolean('isDeleted').defaultTo(false);
//         }).then(function(data) {
//             console.log("Account Details Table added ");
//         });
//     } else {
//         knex.schema.hasColumn('AccountDetails', 'userId').then((isColumn) => {
//             if (isColumn != true) {
//                 knex.schema.table('AccountDetails', function(table) {
//                     table.integer('userId').unsigned();
//                     table.foreign('userId').references('1483_ft_individual.id').onDelete('CASCADE');
//                 }).then(function(data) {
//                     console.log("userId refereces added in AccountDetails table");
//                 });
//             }
//         });
//     }
// })
//
// // User model.
// function AccountDetails() {
//     // Model.apply(this, arguments);
// }
//
// // Basic ES6 compatible prototypal inheritance.
// Model.extend(AccountDetails);
// module.exports = AccountDetails;
