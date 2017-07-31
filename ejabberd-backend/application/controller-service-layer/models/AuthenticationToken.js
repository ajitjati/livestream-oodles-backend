// knex.schema.hasTable('AuthenticationToken').then(function(exists) {
//     if (!exists) {
//         var schemaPromise = knex.schema.createTableIfNotExists('AuthenticationToken', function(table) {
//             table.increments('id').primary();
//             table.string('userName');
//             table.string('authToken');
//             table.enu('role', ["ROLE_ADMIN", "ROLE_USER", "ROLE_SUPERADMIN"]);
//         }).then(function(data) {
//             console.log("authToken Table added ");
//         });
//     } else {
//         knex.schema.hasColumn('AuthenticationToken', 'userId').then((isColumn) => {
//             if (isColumn != true) {
//                 knex.schema.table('AuthenticationToken', function(table) {
//                     table.integer('userId').unsigned();
//                     table.foreign('userId').references('1483_ft_individual.id').onDelete('CASCADE');
//                 }).then(function(data) {
//                     console.log("userId refereces added in AuthenticationToken table");
//                 });
//             }
//         });
//     }
// });
//
// function AuthenticationToken() {
//     // Model.apply(this, arguments);
// }
//
// AuthenticationToken.tableName = 'AuthenticationToken';
// // AuthenticationToken.jsonSchema = {
// //     type: 'object',
// //     //required: ['email','password','ethPassword','ethAddress','name'],
// //     properties: {
// //         id: {
// //             type: 'integer'
// //         },
// //         email: {
// //             type: 'string',
// //             minLength: 1,
// //             maxLength: 255
// //         },
// //         authToken: {
// //             type: 'string'
// //         },
// //         role: {
// //             type: 'string'
// //         }
// //     }
// // };
// // Basic ES6 compatible prototypal inheritance.
// Model.extend(AuthenticationToken);
// module.exports = AuthenticationToken;
