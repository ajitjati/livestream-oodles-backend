/*
 * @author Abhimanyu
 * Requirement - include all the global variables and module required by the application
 */
global.express = require('express');
global.errorHandler = require('errorhandler')
global.bodyParser = require('body-parser')
global.Promise = require('node-promise').Promise
//global.cors = require('cors')
global.async = require('async')
//global.crypto = require('crypto')
global.objection = require('objection');
global.uuid = require('node-uuid');
global.winston = require('winston');
global.ifAsync = require('if-async')
global.Promise = require('node-promise').Promise
global.parser = require('xml2json');
global.validater = require('express-validation')
global.emailTemplates = require('email-templates');
//global.validationFile = require('../application-utilities/Validater')
 global.Model = objection.Model;
global.fs = require('fs');
global.gm = require('gm');

//var multipart = require('connect-multiparty');

//global.multipartMiddleware = multipart();
// global.mongooseSchema = mongoose.Schema;
// mongoose.Promise = require('bluebird');

// Database dependencies and Connection setting
global.mysql = require('mysql');
global.mysqlSchema = mysql.Schema;
// global.dbConnection = require('./Datasource.js').getDbConnection()

var dbObj = require('./Datasource.js').getDbConnection();

var knexReq = require('knex');
// Initialize knex connection.
global.knex = knexReq({
    client: 'mysql',
    useNullAsDefault: true,
    connection: dbObj,
    pool: {
        min: 0,
        max: 7
    }
});
 //global.knex = Promise.promisifyAll(global.knex);

// Give the connection to objection.
 Model.knex(knex);


//bcrypt hash
//global.bcrypt = require('bcrypt');

//Validator
//global.validator = require('validator');

//Scheduler
global.schedule = require('node-schedule');

//Phone validation
// Require `PhoneNumberFormat`.
// global.PNF = require('google-libphonenumber').PhoneNumberFormat;

// Get an instance of `PhoneNumberUtil`.
//global.phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

//global variable to hold all the environment specific configuration
global.configurationHolder = {}

// Application specific configuration details
configurationHolder.config = require('./Conf.js').configVariables();
configurationHolder.ResponseUtil = require('../application-utilities/ResponseHandler.js');
configurationHolder.EmailUtil = require('../application-utilities/EmailUtility');

console.log('configurationHolder.config ' + configurationHolder.config)
    //Application specific intial program to execute when server starts
configurationHolder.Bootstrap = require('./Bootstrap.js')

// Application specific security authorization middleware
configurationHolder.security = require('../application-middlewares/AuthorizationMiddleware').AuthorizationMiddleware

//UTILITY CLASSES
configurationHolder.EmailUtil = require('../application-utilities/EmailUtility')
configurationHolder.appMessages = require('./ApplicationMessages_en').appMessages
//global.Random = require('../application-utilities/RandomValues');
global.Logger = require('../application-utilities/LoggerUtility').logger
configurationHolder.Role = require('./Role.js').Role;

//Request module
//global.request = require('request');

//global.crypto = require('crypto');




module.exports = configurationHolder
