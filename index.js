const {LoginCredential,LoginUser,LoginToken} = require("./structures.js");
const LoginUI = require("./ui.js")
const {Util,Collection,Flags} = require("./utilities");
const fs = require("fs");
class Login {
    constructor({
        useReplDatabases,
        onReady,
        flags,
        accounts_admin,
        cookie_options,
        token_lifetime,
        default_username,
        options
    }) {
        if (typeof(onReady) !== "function") onReady = () => {};
        this.ui = new LoginUI(this);
        if (!flags || typeof(flags) !== "object") flags = {};
        if (Object.values(flags).includes(0) || Object.keys(flags).includes("accounts_admin")) {
            throw "The flag value '0' is reserved for 'accounts_admin'";
        }

        this.options = (!!options && typeof(options) === "object") ? options : {};

        if (accounts_admin === true) {
            flags.accounts_admin = 0;
        }
        this.flag_values = flags;

        Object.defineProperty(this,'db',{value: null,writable: true});
        if (useReplDatabases !== false) {
            this.db = new (require("@replit/database"));
        }

        this.credentials = new Collection();
        this.tokens = new Collection();

        Object.defineProperty(this,'last_tokens',{value: {},writable: true});
        Object.defineProperty(this,'last_credentials',{value: {},writable: true});

        let par = this;
        let loaded = () => {
            par._saved();
            setInterval(function () {
                par.save();
            },1000);
            onReady(par);
        }

        this.fetchCredentials().then(() => {
            this.fetchTokens().then(() => {
                loaded();
            }).catch(console.error);
        }).catch(console.error);

        this.token_lifetime = (typeof(token_lifetime) === "number") ? token_lifetime : 30 * 86400 * 1000;

        this.cookie_options = (typeof(cookie_options) === "string") ? ";" + cookie_options : "";

        if (typeof(default_username) === "string") {
            this.options.default_username = default_username;
        }

        this.paths = {
            "login_page": "pages/index.html",            
        };
    }

    get accounts_admin() {return ("accounts_admin" in this.flag_values);}

    fetchTokens() {
        let par = this;
        return new Promise((resolve,reject) => {
            if (!this.db) return reject("Not using repl.it databases");
            
            par.db.get("gm_login_tokens",{raw: false}).then((d) => {
                if (!d || typeof(d) !== "object") return resolve(par);
                for(let n in d) {
                    let v = d[n];
                    if (!v.id) continue;
                    par.tokens.set(v.id,new LoginToken(par,v.id,v));
                }
                resolve(par);
            }).catch(reject);
        });
    }

    fetchCredentials() {
        let par = this;
        return new Promise((resolve,reject) => {
            if (!this.db) return reject("Not using repl.it databases");
            
            par.db.get("gm_login_credentials",{raw: false}).then((d) => {
                if (!d || typeof(d) !== "object") return resolve(par);
                for(let n in d) {
                    let v = d[n];
                    if (!v.u) continue;
                    par.credentials.set(v.u,new LoginCredential(par,v));
                }
                resolve(par);
            }).catch(reject);
        });
    }

    _saved() {
        this.last_tokens = this.tokens.toObject();
        this.last_credentials = this.credentials.toObject();
    }

    get must_save() {
        return (!(Util.deepEqual(this.tokens.toObject(),this.last_tokens) && Util.deepEqual(this.credentials.toObject(),this.last_credentials)));
    }

    save(force) {
        if (!this.must_save && force !== true) return;
        let par = this;
        let ended = {t: false,c: false};
        this.db.set("gm_login_credentials",this.credentials.toObject()).then(() => {
            ended.c = true;
            if (Object.values(ended).includes(false) === false) par._saved();
        });

        this.db.set("gm_login_tokens",this.tokens.toObject()).then(() => {
            ended.t = true;
            if (Object.values(ended).includes(false) === false) par._saved();
        });
    }

    _createToken(c,stayLoggedIn) {//c is LoginCredentials
        if (!(c instanceof LoginCredential)) return null;
        let token = Util.generateID(40);
        let id = this.tokens.createKey();
        let t = new LoginToken(this,id,{
            t: token,
            d: Date.now(),
            u: c.u,
            s: (stayLoggedIn === true || stayLoggedIn === 1) ? 1 : 0
        });
        this.tokens.set(id,t);
        return t;
    }

    login(username,password,stayLoggedIn) {
        let func_ = function (resolve,reject) {
            if (!username || !password) return reject("Missing username and/or password parameter");
            let credentials = null;
            this.credentials.forEach((c) => {
                if (!c.valid) return;
                if (c.p === password && c.u === username) {
                    credentials = c;
                }
            });
            if (!credentials) return reject("Incorrect username or password");
            let t = this._createToken(credentials,stayLoggedIn);
            if (!t || t.revoked === true) {
                return reject("Encountered inernal error");
            }
            resolve(new LoginUser(this,credentials,t));
        };
        func_ = func_.bind(this);
        return new Promise(func_);
    }

    check(token) {
        if (!token) return null;
        let t = null;
        this.tokens.forEach((to) => {
            if (!!to.t && token === to.t && to.expired === false && to.revoked === false) {
                t = to;
            }
        });
        if (!t) return null;
        return new LoginUser(this,t.credentials,t);
    }

    addCredential(username,password,flags) {
        if (flags instanceof Flags) flags = flags.flags;
        if (typeof(flags) !== "number") flags = 0;
        if (!username || !password) return false;
        let c = new LoginCredential(this,{
            u: username,
            p: password,
            f: flags
        });

        if (this.credentials.has(c.u)) {
            this.tokens.forEach((t) => {
                if (t.u === c.u) {
                    t.revoke();
                }
            });
        }

        this.credentials.set(c.u,c);
        return c;
    }

    checkReq(req) {
        let cookies = Util.parseCookies(req.headers.cookie || "");
        if (!cookies || !cookies.token) return null;
        return this.check(cookies.token);
    }

    newFlags(val) {
        return new Flags(this.flag_values,val);
    }

    router(router) {
        let par = this;

        router.use("*",function (req,res,next) {
            req.user = par.checkReq(req);
            next();
        });

        router.get(["/login.html"],function (req,res) {
            if (req.user) {
                res.set("Set-cookie",req.user.revoke_cookie);
                req.user.token.revoke();
            }
            res.send(par.ui.getLoginPage(req.query.error));
        });

        router.post("/login",function (req,res) {
            let {p,u} = req.body;
            if (!p || !u) {
                res.status(400);
                return res.send("Missing arguments");
            }
            let r = (req.body.r == "1" || req.body.r === 1);
            par.login(u,p,r).then((user) =>{
                res.set("set-cookie",user.cookie);
                res.redirect('/');
                res.end();
            }).catch((err) => {
                console.log(err);
                err = "login.html?error=" + err;
                res.redirect(err);
                res.end();
            });
        });

        router.get("/logout",function (req,res) {
            if (!req.user) {
                return res.redirect("/");
            }
            req.user.token.revoke();
            res.redirect("/");
        });

        router.use("/assets",function (req,res) {
            var url = req._parsedUrl;
            if (url.pathname.endsWith("/")) {url.pathname += 'index.html';}
            var filename = __dirname + url.pathname;
            fs.readFile(filename, function(err, data) {
                if (err) {
                    //res.sendStatus(404);
                    res.status(404);
                    return res.send('404 Not Found');
                }
                if (filename.endsWith('.css')) {
                    res.set('Content-Type', 'text/css; charset=UTF-8');
                } else if (filename.endsWith('.html')) {
                    res.set('Cache-Control','no-cache');
                    res.set('Content-Type', 'text/html; charset=UTF-8');
                } else if (filename.endsWith('.js')) {
                    res.set('Cache-Control','no-cache');
                    res.set('Content-Type', 'application/javascript');
                } else if (filename.endsWith('.png')) {
                    res.set('Content-Type', 'image/png');
                } else if (filename.endsWith('.mp3')) {
                    res.set('Content-Type', 'audio/mp3');
                }
                res.status(200);
                res.send(data);
            });
        });

        router.use("*",function (req,res) {
            res.status(404);
            return res.send("4040 Not Found");
        });

        return router;
    }

}

module.exports = Login;