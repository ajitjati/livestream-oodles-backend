/**
 * Module dependencies.
 */

global.configurationHolder = require('./configurations/DependencyInclude.js')

global.app = module.exports = express();
//
app.use(bodyParser.raw({
        type: 'application/vnd.api+json'
    }))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
    // error handler
app.use(function(err, req, res, next) {
    // specific for validation errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.log('Bad json');
        configurationHolder.ResponseUtil.responseHandler(res, null, "Wrong body of json", false, 403);
    }
    // console.log("res ",next,err,req,res);
    // if (err instanceof validater.ValidationError){
    // 		res.status(err.status).json(err);
    // 		configurationHolder.ResponseUtil.responseHandler(res,null,"Validation" , true, 401);
    // }

    // other type of errors, it *might* also be a Runtime Error
    // example handling
    // if (process.env.NODE_ENV !== 'production') {
    //   return res.status(500).send(err.stack);
    // } else {
    //   return res.status(500);
    // }
});
app.use(errorHandler());
//app.use(cors());

global.router = express.Router();
global.publicdir = __dirname;
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));


// app.use(express.static('public/'));
//global.route = require('./configurations/routes');
global.domain = require('./configurations/DomainInclude.js');
var exec = require("child_process").exec;

// app.use(function (req, res, next) {
//
//     res.header("Access-Control-Allow-Credentials", "false");
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//
//     res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers", "Authorization", "Activity-Name", "Auth-Token");
//     next();
// });

// var phpPath = 'C:/Users/rohit.oodles/Documents/dexxcoin/public/daxx/index.php';
// var phpPath = 'C:/Users/rohit.oodles/Documents/dexxcoin/public/daxx/index.php';
// app.get('/', function(req, res){exec("C:/wamp64/bin/php/php5.6.25/php.exe "+phpPath, function (error, stdout, stderr) {console.log("error",stderr);res.send(stdout);});});
Layers = require('./application-utilities/layers').Express;
var wiring = require('./configurations/UrlMapping');
new Layers(app, router, __dirname + '/application/controller-service-layer', wiring);

//app.use('/',router)

configurationHolder.Bootstrap.initApp()
