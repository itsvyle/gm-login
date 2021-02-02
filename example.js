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
app.use(login.express(loginRoute));
//After here put everything that needs a login

app.get("/",function (req,res) {
    res.send("You are logged in as " + req.user.username + "!");
});
