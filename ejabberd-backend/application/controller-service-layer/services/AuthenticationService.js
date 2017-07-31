// var BaseService = require('./BaseService');
//
// AuthenticationService = function(app) {
//     this.app = app;
// };
//
//
// AuthenticationService.prototype.authenticate = function(userName, res) {
//     knex.select('em.user_detail_email as email', 'u.id', 'u.user_name', 'u.isAccountDisabled')
//         .from('1483_ft_individual as u').innerJoin('1483_user_details as em', 'em.user_detail_refid', 'u.id')
//         .where('u.user_name', userName).andWhere('role', 2).first() // <-- only if param exists
//         .then(function(user) {
//             if (user) {
//                 if (user.isAccountDisabled) {
//                     configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.userMessages.notActivate, true, 401);
//                 } else {
//                     AuthenticationService.prototype.sendVerificationCode(user, res);
//                 }
//             } else {
//                 configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.invalidMemberIdPassword, true, 401);
//             }
//         });
// }
//
// function generateSudoNumber() {
//     var chars = "0123456789";
//     var string_length = 6;
//     var randomstring = '';
//     for (var i = 0; i < string_length; i++) {
//         var rnum = Math.floor(Math.random() * chars.length);
//         randomstring += chars.substring(rnum, rnum + 1);
//     }
//     return randomstring;
// }
//
// AuthenticationService.prototype.sendVerificationCode = function(user, res) {
//     knex('DaxxWallet')
//         .where('userId', user.id)
//         .first()
//         .then(function(isWallet) {
//             if (isWallet) {
//                 Logger.info("wallet generated already userId: ", user.id);
//                 configurationHolder.ResponseUtil.responseHandler(res, user.user_name, configurationHolder.appMessages.success, false, 200);
//             } else {
//                 knex('VerifyUser').where('userId', user.id).del().then(function(result) {
//                     Logger.info("VerifyUser security code deleted :::::::");
//                     generateCodeandSendMail(user, res);
//                 });
//             }
//         })
// }
//
// function generateCodeandSendMail(user, res) {
//     var sCharCode = generateSudoNumber();
//     Logger.info("security code : " + sCharCode + " for userId: " + user.id);
//     bcrypt.hash(sCharCode, 5, function(err, password) {
//         knex('VerifyUser').insert({
//             password: password,
//             userId: user.id
//         }).returning('id').on('query-error', function(error, obj) {
//             Logger.info("VerifyUser password insert err");
//             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.serverError, true, 500);
//         }).then(function(result) {
//             if (result > 0) {
//                 var callback = function(succesful) {
//                     if (succesful) {
//                         configurationHolder.ResponseUtil.responseHandler(res, user.user_name, configurationHolder.appMessages.success, false, 200);
//                     } else {
//                         configurationHolder.ResponseUtil.responseHandler(res, user.user_name, configurationHolder.appMessages.appErrorMessages.emailFailed, true, 400);
//                     }
//                 }
//                 var templatesDir = path.resolve(__dirname, "../../../", 'templates');
//                 emailTemplates(templatesDir, function(err, template) {
//                     console.log("error : ", err);
//                     var locals = {
//                         name: user.user_name,
//                         message: configurationHolder.appMessages.verifyUserTemplateMesg.verifyUsername, //txnGenerated
//                         verificationCode: sCharCode, //txnChange
//                         logoURL: configurationHolder.config.logoURL,
//                         verifyMsg: configurationHolder.appMessages.verifyUserTemplateMesg.verifyMsg, //yourTxnPsw
//                         emplateTxnFooter: configurationHolder.appMessages.txnEmailTemplateMesg.emplateTxnFooter,
//                         emailTxnTitle: configurationHolder.appMessages.verifyUserTemplateMesg.verifyUsername, // this is not used
//                         dear: configurationHolder.appMessages.txnEmailTemplateMesg.dear,
//                         toEmail: configurationHolder.config.emailFrom
//                     };
//                     template('verifyUser', locals, function(err, html) {
//                         if (!err) {
//                             console.log("error : ", err);
//                             configurationHolder.EmailUtil.email(configurationHolder.config.emailFrom, user.email, configurationHolder.appMessages.verifyUserTemplateMesg.verifyUsername, " ", html, [], callback);
//                         } else {
//                             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.emailFailed, true, 500);
//                         }
//                     });
//                 });
//             } else {
//                 console.log("error in generating transaction password:::");
//                 configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.serverError, true, 500);
//             }
//         });
//     });
// }
//
// function encrypt(text, from, to, password) {
//     var cipher = crypto.createCipher('aes-256-cbc', password);
//     var crypted = cipher.update(text, from, to);
//     crypted += cipher.final(to);
//     return crypted;
// }
//
// function checkPassword(user, password) {
//     var encryptPassword = encrypt(password, 'uft8', 'hex', user.salt);
//     // console.log("encrypt pass is", encryptPassword);
//     encryptPassword = "" + encryptPassword;
//     if (encryptPassword == user.walletPassword) {
//         return true;
//     } else {
//         return false;
//     }
// }
// AuthenticationService.prototype.loginWallet = function(req, res) {
//     var userData = req.body;
//     var file = req.files;
//     console.log("file: ", file);
//     if (file && Object.keys(file).length) {
//         console.log("with file: ");
//         checkUsernameWithFile(file, userData, res);
//         // WalletService.prototype.authenticateWithKeyFile(file, res);
//     } else {
//         console.log("with username and password: ");
//         authenticateManully(userData, res);
//     }
// }
//
// function checkUsernameWithFile(file, userData, res) {
//     knex.select('u.id', 'u.user_name', 'u.isAccountDisabled')
//         .from('1483_ft_individual as u')
//         .where('u.user_name', userData.userName).first() // <-- only if param exists
//         .then(function(user) {
//             if (user) {
//                 if (user.isAccountDisabled) {
//                     configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.userMessages.notActivate, true, 401);
//                 } else {
//                     WalletService.prototype.authenticateWithKeyFile(file, user.user_name, res);
//                 }
//             } else {
//                 configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.invalidMemberIdPassword, true, 401);
//             }
//         });
// }
//
// function authenticateManully(userData, res) {
//     knex('1483_ft_individual').where({
//         user_name: userData.userName
//     }).first().then(function(user) {
//         if (user) {
//             if (user.isAccountDisabled) {
//                 configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.userMessages.notActivate, true, 401);
//             } else {
//                 knex('DaxxWallet').select().where({
//                     userId: user.id
//                 }).then(function(wallets) {
//                     if (wallets.length > 0) {
//                         // console.log("wallet",wallets[0]);
//                         if (checkPassword(wallets[0], userData.password)) {
//                             AuthenticationService.prototype.generateAuthenticationToken(user.user_name, user.id, configurationHolder.Role.ROLE_USER, res);
//                         } else {
//                             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.invalidPassword, true, 400);
//                         }
//                     } else {
//                         configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.walletnotexist, true, 400);
//                     }
//                 })
//             }
//         } else {
//             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.userNotFound, true, 400);
//         }
//     })
// }
//
//
// /*
//  *this method will logout the user by removing the authToken from database
//  *@payload authToken
//  */
// AuthenticationService.prototype.logoutService = function(authToken, res) {
//
//     knex('AuthenticationToken').where('authToken', authToken).del().then(function(result) {
//         console.log("Logout result:::::::::::", result);
//         if (result) {
//             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.success, false, 200);
//         } else {
//             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.badRequest, true, 400);
//         }
//     });
// }
//
// AuthenticationService.prototype.generateAuthenticationToken = function(userName, userId, role, res) {
//     knex.select('usr.id', 'role.role').from('1483_ft_individual as usr').innerJoin('Role as role', 'usr.role', 'role.roleId').where('usr.id', userId).first(). // <-- only if param exists
//     then(function(userObj) {
//         if (userObj && userObj.role != null && userObj.role == role) {
//             var obj = {
//                 userName: userName,
//                 authToken: uuid.v1(),
//                 role: role,
//                 userId: userId
//             }
//             knex('AuthenticationToken').insert(obj).returning("authToken").on('query-error', function(error, obj) {
//                 console.log("error in creation of Token", error.errno);
//                 configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.authTokenError, true, 500);
//             }).then(function(result) {
//                 console.log("::::::::::::::", "added auth token");
//                 configurationHolder.ResponseUtil.responseHandler(res, obj.authToken, configurationHolder.appMessages.success, false, 200);
//             });
//         } else {
//             Logger.error("user role not matched");
//             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.invalidUserNamePassword, true, 400);
//         }
//     });
// }
//
// AuthenticationService.prototype.fetchWalletInfo = function(userName, res) {
//
//     knex('1483_ft_individual').select('id').where('user_name', userName).then(function(result) {
//         if (result.length > 0) {
//             knex('DaxxWallet').select().where('userId', result[0].id).then(function(wallets) {
//                 if (wallets.length > 0) {
//                     configurationHolder.ResponseUtil.responseHandler(res, true, configurationHolder.appMessages.success, false, 200);
//                 } else {
//                     configurationHolder.ResponseUtil.responseHandler(res, false, configurationHolder.appMessages.success, false, 200);
//                 }
//             })
//         } else {
//             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.userNotFound, true, 400);
//         }
//     });
// }
//
//
//
//
// //This function is used to login admin
//
// AuthenticationService.prototype.authenticateAdmin = function(userName, password, res) {
//     knex('1483_ft_individual').where({
//             'user_name': userName,
//             'isAccountDisabled':false
//         }).first() // <-- only if param exists
//         .then(function(user) {
//             if (user && user.password) {
//                 bcrypt.compare(password, user.password, function(err, result) {
//                     if (!err) {
//                         if (result == true) {
//                             generateAuthenticationTokenAdmin(user.user_name, user.id, res);
//                         } else {
//                             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.invalidUserNamePassword, true, 401);
//                         }
//                     } else {
//                         configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.serverError, true, 500);
//                     }
//                 });
//             } else {
//                 configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.invalidUserNamePassword, true, 401);
//             }
//         });
// }
//
//
//
// function generateAuthenticationTokenAdmin(userName, userId, res) {
//     knex.select('usr.id', 'role.role').from('1483_ft_individual as usr').innerJoin('Role as role', 'usr.role', 'role.roleId').where('usr.id', userId).first(). // <-- only if param exists
//     then(function(userObj) {
//         console.log(":::::::;;Login with Role::: ", userObj.role);
//         if (userObj && userObj.role != null && (userObj.role == configurationHolder.Role.ROLE_ADMIN || userObj.role == configurationHolder.Role.ROLE_SUPERADMIN)) {
//             var obj = {
//                 userName: userName,
//                 authToken: uuid.v1(),
//                 role: userObj.role,
//                 userId: userId
//             }
//             knex('AuthenticationToken').insert(obj).returning("authToken").on('query-error', function(error, obj) {
//                 console.log("error in creation of Token", error.errno);
//                 configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.authTokenError, true, 500);
//             }).then(function(result) {
//                 console.log("::::::::::::::", "added auth token");
//                 var data = {}
//                 data.role = userObj.role;
//                 data.authToken = obj.authToken;
//                 configurationHolder.ResponseUtil.responseHandler(res, data, configurationHolder.appMessages.success, false, 200);
//             });
//         } else {
//             Logger.error("user role not matched");
//             configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.invalidUserNamePassword, true, 400);
//         }
//     });
// }
//
//
//
//
//
//
//
//
//
// AuthenticationService.prototype.isMenuAccessable = function(req, res) {
//     var userId = req.loggedInUser.id;
//     var arr = {
//         isAccessable: false
//     };
//     knex('1483_user_details').where('user_detail_refid', userId).first() // <-- only if param exists
//         .then(function(user) {
//             if (user) {
//                 if (user.passport_approve_status == 'yes' && user.utili_approve_status == 'yes') {
//                     arr.isAccessable = true;
//                     configurationHolder.ResponseUtil.responseHandler(res, arr, configurationHolder.appMessages.success, false, 200);
//                 } else {
//                     arr.isAccessable = false;
//                     configurationHolder.ResponseUtil.responseHandler(res, arr, configurationHolder.appMessages.appErrorMessages.notPermit, false, 200);
//                 }
//
//             } else {
//                 arr.isAccessable = false;
//                 configurationHolder.ResponseUtil.responseHandler(res, arr, configurationHolder.appMessages.appErrorMessages.notPermit, false, 200);
//             }
//         });
// }
//
//
//
//
//
// module.exports = function(app) {
//     return new AuthenticationService(app);
// };
