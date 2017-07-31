/*
 * @author Abhimanyu
 * This module is for the authorization process . Called as middleware function to decide whether user have enough authority to access the
 *
 */
var async = require('async')

module.exports.AuthorizationMiddleware = (function() {

    /*
     *  Verify user is authorized to access the functionality or not
     */
    // var verifyIsRoleInAccessLevel = function(next, results, res, req, accessLevel) {
    var verifyIsRoleInAccessLevel = function(results, next, res, req, accessLevel) {

            var roleInAccessLevel = configurationHolder.config.accessLevels[accessLevel]
            var authorized = false
            knex.select('userName').from('users')
            on('query-error', function() {
                configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.queryError, true, 500);
            }).then(function(userObj) {
                if (userObj && roleInAccessLevel.indexOf(userObj.role) > -1) {
                    authorized = true
                    req.loggedInUser = userObj
                    next(results, authorized)
                } else {
                    configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.failedAuthorization, true, 401);
                }
            });
        }
        /*
         * find User and its role using authenticationToken.
         */
    // var findRoleByAuthToken = function(next, results, req, res, authToken) {
    //     console.log("auth token", authToken);
    //     knex('AuthenticationToken')
    //         .where('authToken', authToken).first() // <-- only if param exists
    //         .then(function(authObj) {
    //             if (authObj) {
    //                 next(null, authObj)
    //             } else {
    //                 configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.failedAuthorization, true, 401)
    //             }
    //         });
    // }

    /*
     *  call as middleware to decide the accessiblity of the function for the loggedIn user
     *  find user by AuthenticationToken
     *  Decide based on the role of user and accesslevel whether user is authorized or not
     */
    var authority = function(accessLevel) {
        return function(req, res, next) {
            var authToken = req.get("Authorization")
            if (authToken == null && accessLevel == "anonymous") {
                Logger.info("executed in accesslevel ")
                req.loggedInUser = null
                next()
            } else {
                async.auto({
                    authorizationTokenObject: function(next, results) {
                        return findRoleByAuthToken(next, results, req, res, authToken)
                    },
                    isRoleInAccessLevel: ['authorizationTokenObject', function(next, results) {
                        verifyIsRoleInAccessLevel(next, results, res, req, accessLevel)
                    }]
                }, function(err, results) {
                    if (results.isRoleInAccessLevel == true) {
                        next()
                    } else {
                        configurationHolder.ResponseUtil.responseHandler(res, null, configurationHolder.appMessages.appErrorMessages.failedAuthorization, true, 401)
                    }
                })
            }
        }
    }




    //public methods are  return
    return {
        authority: authority

    };
})();
