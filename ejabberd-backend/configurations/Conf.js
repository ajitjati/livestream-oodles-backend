//add Roles in the system
var roles = ['ROLE_USER', 'ROLE_ADMIN','ROLE_SUPERADMIN','ROLE_DELEGATEADMIN']

// Add different accessLevels
var accessLevels = {
    'anonymous': ['ROLE_USER','ROLE_ADMIN','ROLE_SUPERADMIN','ROLE_DELEGATEADMIN'],
    'user': ['ROLE_USER','ROLE_ADMIN','ROLE_SUPERADMIN'],
    'admin': ['ROLE_ADMIN','ROLE_SUPERADMIN'],
    'superadmin':['ROLE_SUPERADMIN'],
    'delegate':['ROLE_SUPERADMIN','ROLE_DELEGATEADMIN','ROLE_ADMIN']

}

var configVariables = function () {
    switch (process.env.NODE_ENV) {
    case 'development':
        var config = {
            port:3000,
            host: 'http://localhost:3000/',
            verificationUrl:'http://localhost:3000/verify/',
            //sesSmtpPort:465,
            awsAccessKeyId:'',
            awsSecretAccessKey:'',
            bucketname:'',
            emailFrom:'abhimanyu.singh@oodlestechnologies.com',
            emailPassword:'!abhimanyu@oodles',
            verificationEmailSubject:'Welcome To OodlesStudio !'


            //serverUrl : "http://localhost:3000",


            // gethAddress : "http://35.154.153.206:8001",
            // nginxImageUrl: "http://192.168.4.219/image/",
            // imageFolderPath: "/opt/daxxcoin/images/",
            // nginxUserImageUrl: "http://192.168.4.219/userImage/",
            // userImageFolderPath: "/opt/daxxcoin/userData/",
            // adminEmail : "admin@daxxcoin.com",
            // adminPassword : "admin@12345",
            // adminUserName : "daxx@admin",
            // supportMail:"abhishek.saini@oodlestechnologies.com",
            // founderMail:"abhishek.saini@oodlestechnologies.com",
          //  txnFeeAccount : "0x557fd02c66bd1c1854d912f170a6b99d9bc622f8",

        }
        config.roles = roles
        config.accessLevels = accessLevels
        return config;


    case 'staging':
        var config = {
            port:3000,
            host: 'http://localhost:3000/',
            verificationUrl:'http://localhost:3000/verify/',
            // emailHost:'smtp.gmail.com',
            awsAccessKeyId:'',
            awsSecretAccessKey:'',
            bucketname:'',
            emailFrom:'abhimanyu.singh@oodlestechnologies.com',
            emailPassword:'!abhimanyu@oodles',
            verificationEmailSubject:'Welcome To OodlesStudio !'
        }
        config.roles = roles
        config.accessLevels = accessLevels
        return config;

    case 'production':

        var config = {
            port:5280,
           host: 'http://180.151.230.12:5280/',
           verificationUrl:'http://180.151.230.12:5280/verify/',

            awsAccessKeyId:'',
            awsSecretAccessKey:'',
            bucketname:'',
            emailFrom:'abhimanyu.singh@oodlestechnologies.com',
            emailPassword:'!abhimanyu@oodles',
            verificationEmailSubject:'Welcome To OodlesStudio !'
        }
        config.roles = roles
        config.accessLevels = accessLevels
        return config;
    case 'test':
        var config = {
            port:3000,
            host: 'http://localhost:3000/',
            verificationUrl:'http://localhost:3000/verify/',
            awsAccessKeyId:'',
            awsSecretAccessKey:'',
            bucketname:'',
            emailFrom:'abhimanyu.singh@oodlestechnologies.com',
            emailPassword:'!abhimanyu@oodles',
            verificationEmailSubject:'Welcome To OodlesStudio !'
        }
        config.roles = roles
        config.accessLevels = accessLevels
        return config;
    }
}


module.exports.configVariables = configVariables;
