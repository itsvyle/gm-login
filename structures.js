const Flags = require("./utilities/flags.js");
class LoginCredential {
    constructor(login,d) {
        Object.defineProperty(this,"login",{value: login});
        this.u = d.u;//Username
        this.p = d.p;//Password
        this.f = d.f;//Flags
        if (typeof(this.f) !== 'number') this.f = 0;
    }

    get username() {return this.u;}
    get password() {return this.p;}
    get flags() {
        return new Flags(this.login.flag_values,this.f);
    }
    get valid() {
        return (!!this.u && !!this.p);
    }
}

class LoginUser {
    constructor(login,credentials,token) {
        Object.defineProperty(this,"login",{value: login});
        Object.defineProperty(this,"credentials",{value: credentials});
        this.token = token;
        
        this.username = this.credentials.username;
        this.flags = this.credentials.flags;
    }

    get cookie() {
        let d;
        if (this.tokens.temp === true) {
            d = "";
        } else {
            d = new Date(this.token.expires);
            d.toUTCString();
            d = ` Expires=${d};`;
        }
        
        return `token=${this.token.t};${d} Path=/` + this.login.cookie_options;
    }

    get revoke_cookie() {
        let d = new Date(Date.now() - 10 * 1000 * 1000);
        return `token=null; Expires=${d.toUTCString()}`;
    }
}

class LoginToken {
    constructor(login,id,d) {
        Object.defineProperty(this,"login",{value: login});

        this.id = id;

        this.t = d.t;//token
        this.d = d.d;//date created
        this.u = d.u;//username
        this.s = d.s;//stay logged in

        Object.defineProperty(this,"revoked",{value: false,writable: true});
        if (!this.credentials) this.revoke();
    }

    get token() {return this.t;}
    get dateCreated() {return new Date(this.d);}
    get username() {return this.u;}
    get temp() {return this.s !== 1;}


    get expires() {
        return (this.s === 1) ? this.d + this.login.token_lifetime : this.d + 60 * 60 * 1000;
    }

    get expired() {
        return (this.expires < Date.now());
    }

    revoke() {
        Object.defineProperty(this,"revoked",{value: true,writable: true});
        this.login.tokens.delete(this.id);
    }

    get credentials() {
        return this.login.credentials.get(this.u);
    }
}

module.exports = {
    LoginCredential,
    LoginUser,
    LoginToken
};
