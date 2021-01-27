const fs = require("fs");

class LoginUI {
    constructor(login) {
        Object.defineProperty(this,"login",{value: login});
        this.pages = {};
    }

    getLoginPage(error) {
        let d = null;
        if (this.pages.login) {
            d = this.pages.login;
        } else {
            try {
                d = fs.readFileSync(__dirname + "/assets/index.html");
                d = d.toString();
            } catch (err) {}
        }
        if (!d) return "Error getting page";
        let s = function (e,def = "") {
            return (e in this.login.options) ? this.login.options[e] : def;
        };
        s = s.bind(this);
        d = d.split("{website_name}").join(s("website_name","REPLIT"));
        d = d.split("{website_icon}").join(s("website_icon","https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Repl.it_logo.svg/480px-Repl.it_logo.svg.png"));
        d = d.split("{icon_style}").join(s("icon_style",""));
        d = d.split("{default_username}").join(s("default_username",""));
        d = d.split("{error}").join(error || "");
        if (this.login.remember_me === true) {
            d = d.split("{remember_me}").join("checked");
        } else {
            d = d.split("{remember_me}").join("");   
        }
        return d;
    }

}

module.exports = LoginUI;
