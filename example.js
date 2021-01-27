const express = require("express");
var {Util} = require("./gm-login/utilities");
const app = Util.express({
    post: true
});

var Login = require("./gm-login");

const login = new Login({
    useReplDatabases: true,
    accounts_admin: true,
    onReady: function () {
        //login.login("admin","pwd",true).then(console.log).catch(console.error);
        //console.log(login.check("bfTYuTdlABaBdqxyzgaYTwfQqT6GbdFlzSMZ2Tob"));
        app.connect(true);
    }
});

app.use("/l",login.router(express.Router()));

app.use("*",function (req,res,next) {
    req.user = login.checkReq(req);
    if (!req.user) {
        res.redirect("/l/login.html");
    } else {
        next();
    }
});

app.use("*",function (req,res) {
    res.set("content-type","text/json");
    return res.send(JSON.stringify(login.checkReq(req),null,2));
});
