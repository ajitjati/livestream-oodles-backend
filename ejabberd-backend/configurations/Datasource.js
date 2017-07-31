/**
 @author: kapil
 configuration is define to make connection with the database for the different environment.
*/

// var mysql  = require('mysql');
var getDbConnection = function() {
    switch (process.env.NODE_ENV) {
        case 'development':
            // var db = process.env.DATABASE_URL || 'jdbc:mysql://localhost/daxxcoin?useUnicode=true&characterEncoding=UTF-8';
            // return checkMysqlConnection('localhost');
            // var db = mongoose.connect('mongodb://admin:oodles@localhost:27017/daxxcoin');
            // checkMongooseConnection(db);
console.log("in datasource");
            var databaseConfig = {
                host: 'localhost',
                user: 'ejabberd',
                password: 'ejabberd@123',
                database: 'ejabberd',
                acquireConnectionTimeout: 10000
            }
            console.log("database connected");
            return databaseConfig;
        case 'staging':
        console.log("in staging datasource");
            // var db = mongoose.connect('mongodb://daxxcoin:daxxcoin@172.31.6.36:27017/daxxcoin');
            // checkMongooseConnection(db);
            var databaseConfig = {
              host: '127.0.0.1',
              user: 'ejabberd',
              password: 'ejabberd@123',
              database: 'ejabberd',
              acquireConnectionTimeout: 10000
            }
            return databaseConfig;
        case 'production':
            // var db = mongoose.connect('mongodb://daxxcoin:daxxcoin@172.31.6.36:27017/daxxcoin');
            // checkMongooseConnection(db);
            var databaseConfig = {
                // host: 'daxxcoin.cisucovphltl.eu-central-1.rds.amazonaws.com', //private ip of db
                host: '127.0.0.1',
                user: 'ejabberd',
                password: 'ejabberd@123',
                database: 'ejabberd',
                acquireConnectionTimeout: 10000
            }
            return databaseConfig

        case 'test':
        var databaseConfig = {
            // host: 'daxxcoin.cisucovphltl.eu-central-1.rds.amazonaws.com', //private ip of db
            host: '127.0.0.1',
            user: 'ejabberd',
            password: 'ejabberd@123',
            database: 'ejabberd',
            acquireConnectionTimeout: 10000
        }
        return databaseConfig
    }
}


//function to check connection to database server
// function checkMongooseConnection(db){
//        mongoose.connection.on('open', function (ref) {
//             Logger.info('Connected to mongo server.');
//             return db
//        });
//        mongoose.connection.on('error', function (err) {
//           Logger.error('Could not connect to mongo server!');
//             Logger.error('.....Executing.....');
//           Logger.error(err);
//       });
//  }
function checkMysqlConnection(server) {
    // var connection = mysql.createConnection({
    //     host  : 'localhost',
    //     user: 'ejabberd',
    //     password: 'ejabberd@123',
    //     database: 'ejabberd'
    // });
    //
    // connection.connect();

    // connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields){
    //     if (!err)
    //         console.log('The solution is: ', rows);
    //     else
    //         console.log('Error while performing Query.');
    // });

    // connection.end();

    var knexReq = require('knex');
    // Initialize knex connection.
    global.knex = knexReq({
        client: 'mysql',
        useNullAsDefault: true,
        connection: {
            host: server,
                 user: 'ejabberd',
                password: 'ejabberd@123',
                database: 'ejabberd',
                acquireConnectionTimeout: 10000

        },
        pool: {
            min: 0,
            max: 7
        }

    });
    global.knex = Promise.promisifyAll(global.knex);

    // Give the connection to objection.
 Model.knex(knex);

}



module.exports.getDbConnection = getDbConnection;
