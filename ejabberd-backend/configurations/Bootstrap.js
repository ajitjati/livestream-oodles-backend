/*
 *
 * This program includes all the function which are required to  initialize before the application start
 */



//call all the function which are required to perform the require initialization before server will start
var initApp = function() {
    Logger.info("config" + configurationHolder.config.accessLevels["anonymous"]);
    bootApplication();
    // addRoleColumnWithAdmin();
    // addFounderParticipation();
    // startScheduler();
    // createGenesis();
    // checkBalances();
}


//this function is used to add role column in existiimg ost_user table if not
// function addRoleColumnWithAdmin() {
//     knex.schema.hasColumn('1483_ft_individual', 'role').then((isColumn) => {
//         if (isColumn != true) {
//             var addColumnQuery = "ALTER TABLE 1483_ft_individual ADD role int UNSIGNED,ADD password varchar(255),ADD isAccountDisabled boolean NOT NULL default false,ADD isBussinessUser boolean NOT NULL default false";
//             var query = "ALTER TABLE 1483_ft_individual ADD FOREIGN KEY (`role`) REFERENCES Role(`roleId`)";
//             knex.raw(addColumnQuery).then(function(resp) {
//                 Logger.info(":::::::::::: column added");
//                 if (resp) {
//                     knex.raw(query).then(function(obj) {
//                         if (obj) {
//                             Logger.info("foreign key constraint added");
//                             createSuperAdmin();
//                         } else {
//                             Logger.error("unable to add foreign key");
//                         }
//                     });
//                 } else {
//                     Logger.error("error in adding column:::");
//                 }
//             });
//         } else {
//             Logger.info("Role column with admin details alreday added");
//         }
//     });
// }
//

// code to start the server
function bootApplication() {
    app.listen(configurationHolder.config.port, function() {
        console.log("Express server listening on port %d in %s mode", configurationHolder.config.port, app.settings.env);
    });
}


module.exports.initApp = initApp
