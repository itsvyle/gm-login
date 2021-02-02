var express = require("express");
const app = express();
const port = 3000;
var bodyParser = require('body-parser');
var Login = require("./login");

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb",extended: true}));


const loginRoute = "/accounts";
const login = new Login({
    useReplDatabases: true,
    accounts_admin: true,
    onReady: function () {
        app.listen(3000,function () {
            console.log("App listening at port: " + String(port)); 
        });
    },
    flags: {
        
    }
});

//Before here put everything that does not need a login
app.use(loginRoute,login.router);


//If you want to do a page in which you may use the user, uncomment the following line:
//app.use(login.getUser);
//Here, you can the put anything in which you use the user without specialy being logged in


app.use(login.express(loginRoute));
//After here put everything that needs a login

//By using the 'login.expressAuths', it checks that the user has the provided flags to access the page
app.get("/video",[login.expressAuths(['see_video']),function (req,res) {
    res.send("VIDEO");
}]);


app.get("/",function (req,res) {
    res.send("You are logged in as " + req.user.username + "!");
});
