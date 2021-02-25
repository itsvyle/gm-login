var express = require("express");
const app = express();
const port = 3000;
var bodyParser = require('body-parser');

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb",extended: true}));


var GMLogin = require("./gm-login");
const loginRoute = "/accounts";
const login = new GMLogin({
    useReplDatabases: true,
    accounts_admin: true,
    onReady: function () {
        console.log("[login] Loaded data");
        SimpleDB.startMultiple(true,db,dbDistribution).then(() => {
            console.log("[db] Got all the local db data");
            client.start(); 
        });
    },
    options: {
        website_name: "Google",
        website_icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Repl.it_logo.svg/480px-Repl.it_logo.svg.png",
        dark: false
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
