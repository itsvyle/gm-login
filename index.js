var getClientAddress = function (req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0] 
        || req.connection.remoteAddress;
};
const {LoginCredential,LoginUser,LoginToken} = require("./structures.js");
const LoginUI = require("./ui.js")
const {Util,Collection,Flags} = require("./utilities");
const fs = require("fs");
var ReplITDB = null;
class Login {
    constructor({
        useReplDatabases,
        onReady,
        flags,
        accounts_admin,
        cookie_options,
        token_lifetime,
        default_username,
        options,
        remember_me_default,
        multisite
    } = {}) {
        this.remember_me = remember_me_default;
        if (typeof(onReady) !== "function") onReady = () => {};
        this.ui = new LoginUI(this);
        if (!flags || typeof(flags) !== "object") flags = {};
        if (Object.values(flags).includes(0) || Object.keys(flags).includes("accounts_admin")) {
            throw new Error("The flag value '0' is reserved for 'accounts_admin'");
        }

        this.options = (!!options && typeof(options) === "object") ? options : {};
        this.isMultisite = multisite || false;

        if (accounts_admin !== false) {
            flags = Object.assign({accounts_admin},flags);
            flags.accounts_admin = 0;
        }
        this.flag_values = flags;

        Object.defineProperty(this,'db',{value: null,writable: true});
		if (typeof(useReplDatabases) === "object") {
			this.db = useReplDatabases;
		} else if (useReplDatabases !== false) {
            let bd = "@replit/database";
			if (!ReplITDB) ReplITDB = require(bd);
            this.db = new ReplITDB();
        }


        this.credentials = new Collection();
        this.machine_credentials = new Collection();
        this.tokens = new Collection();

        Object.defineProperty(this,'last_tokens',{value: {},writable: true});
        Object.defineProperty(this,'last_credentials',{value: {},writable: true});

        let par = this;
        let loaded = () => {
            par._saved();
            setInterval(function () {
                par.save();
            },2500);
            par.refreshTokens();
            onReady(par);
            let nm = "[Login] Welcome to the login !. The default username and password are 'default'. Use it to login and change it";
            if (par.credentials.size < 1) {
                console.log(nm);
                par.addCredential("default","default",0);
            } else {
                if (par.credentials.has("default")) {
                    if (par.credentials.get("default").p == "default") {
                        console.log(nm);
                    }
                }
            }
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

        this.loginRoute = "/";

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
                    let c = new LoginCredential(par,v);
                    (c.machine) ? par.machine_credentials.set(v.u,c) : par.credentials.set(v.u,c);
                }
                resolve(par);
            }).catch(reject);
        });
    }

    _saved() {
        this.last_tokens = this.tokens.toObject(obj => Object.assign({},obj));
        this.last_credentials = this.credentials.map(obj => Object.assign({},obj)).concat(this.machine_credentials.map(obj => Object.assign({},obj)));
    }

    get must_save() {
        return (!(Util.deepEqual(this.tokens.toObject(),this.last_tokens) && Util.deepEqual(this.credentials.array().concat(this.machine_credentials.array()),this.last_credentials)));
    }

    save(force) {
        let par = this;
        let sc = this.credentials.array().concat(this.machine_credentials.array());
        let st = this.tokens.toObject();
        if (force !== true) {
            if (Util.deepEqual(this.last_tokens,st) && Util.deepEqual(this.last_credentials,sc)) return null;
        }
        let ended = {t: false,c: false};
        this.db.set("gm_login_credentials",sc).then(() => {
            ended.c = true;
            if (Object.values(ended).includes(false) === false) par._saved();
        });

        this.db.set("gm_login_tokens",st).then(() => {
            ended.t = true;
            if (Object.values(ended).includes(false) === false) par._saved();
        });
    }

    _createToken(c,stayLoggedIn,ip) {//c is LoginCredentials
        if (!(c instanceof LoginCredential)) return null;
        let token = Util.generateID(40);
        let id = this.tokens.createKey();
        let t = {
            t: token,
            d: Date.now(),
            u: c.u,
            s: (stayLoggedIn === true || stayLoggedIn === 1) ? 1 : 0,
            m: c.m
        };
        if (ip) t.ip = ip;
        t = new LoginToken(this,id,t);
        this.tokens.set(id,t);
        return t;
    }

    login(username,password,stayLoggedIn,ip) {
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
            let t = this._createToken(credentials,stayLoggedIn,ip);
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
        t = this.tokens.find((to) => {
            if (!!to.t && token === to.t && to.expired === false && to.revoked === false) {
                return true;
            }
            return false;
        });
        if (!t) return null;
        return new LoginUser(this,t.credentials,t);
    }

    addCredential(username,password,flags,mode = "users") {
        if (flags instanceof Flags) flags = flags.flags;
        if (typeof(flags) !== "number") flags = 0;
        if (!username || !password || typeof(username) != "string" || typeof(password) != "string") return false;
        let crede = (mode === "machines") ? this.machine_credentials : this.credentials;
        if (crede.has(username)) crede.get(username).revokeAllTokens();
        let c = {
            u: username,
            p: password,
            f: flags,
            d: Date.now()
        };
        if (mode == "machines") c.m = true;
        if (this.credentials.size < 1) {c.creator = 1;}
        c = new LoginCredential(this,c);
        
        crede.set(c.u,c);
        return c;
    }

    refreshTokens() {
        this.tokens.forEach((t) => {
            if (!t.valid) {
                t.revoke();
            }
        });
    }

    _editCredential(oldUName,editor,d,mode = "users") {
        if (!this.accounts_admin) return null;
        if (!editor || !(editor instanceof LoginCredential)) return null;
        if (!editor.flags.has("accounts_admin") && !editor.isCreator) {
            return [403,"You do not have the authorization to do this"];
        }
        if (!d || typeof(d) !== "object" || !d.u || !d.p || !("f" in d) || typeof(d.f) !== "number") return false;
        let crede = (mode == "machines") ? this.machine_credentials : this.credentials;
        let _tf = new Flags(this.flag_values,d.f);
        let old = crede.get(oldUName);
        if (!old) {
            return [404,"User with username '" + oldUName + "' does not exist"];
        }
        if (_tf.has("accounts_admin") !== old.flags.has("accounts_admin") && !editor.isCreator) {
            return [403,"Only the creator can edit the 'accounts_admin' flag"];
        }

        if (_tf.flags !== old.flags.flags && old === editor && !editor.isCreator) {
            return [403,"You cannot edit your own flags"];
        }
        // let ol = this.credentials.get(d.u);
        // if (!ol) {
        //     return this.addCredential(d.u,d.p,d.f);
        // }
        if (old.isCreator && !editor.isCreator) {
            return [403,"You cannot edit the creator's settings"];
        }
        if (old.flags.has("accounts_admin") && old !== editor && !editor.isCreator) {
            return [403,"Only the creator can edit the other admin's settings"];
        }
        crede.get(oldUName).revokeAllTokens();
        crede.get(oldUName).u = d.u;
        crede.get(oldUName).p = d.p;
        crede.get(oldUName).f = d.f;
        if (old.p !== d.p || old.f !== d.f || old.u !== d.u) {
            old.revokeAllTokens();
        }
        if (d.u !== oldUName) {
            crede.set(d.u,crede.get(oldUName));
            crede.delete(oldUName);
        }
        this.refreshTokens();
        return crede.get(d.u);
    }

    checkReq(req) {
        let cookies = (!!req.headers.authorization) ? {token: req.headers.authorization} : Util.parseCookies(req.headers.cookie || "");
        if (!cookies || (!cookies.token && (this.isMultisite && !cookies.multtoken))) return null;
        let c = cookies.token;
        if (!c && this.isMultisite) c = cookies.multtoken;
        return this.check(c);
    }

    newFlags(val) {
        return new Flags(this.flag_values,val);
    }

    expressAuths(auths,checkCreator,allowMachine = false) {
        if (!Array.isArray(auths)) {
            auths = [auths];
        }
        if (typeof(checkCreator) !== "boolean") {checkCreator = true;}
        let par = this;
        return function (req,res,next) {
            //console.log(auths,checkCreator,req);
            if (!req.user) {
                res.status(403);
                res.send(par.ui.errorPage(403,"Unauthorized",'You must be logged in to view this page<br><a href="' + par.loginRoute + 'login.html?to=' + encodeURIComponent(req.originalUrl) + '">Login or switch account</a>'));
                return;
            }
            var isMachine = (req.user.machine);
            const exit = (status,text) => {res.status(status);return res.send(text);};
            if (allowMachine !== true && req.user.machine) {
                if (isMachine) return exit(403,'A machine cannot access this page');
                res.send(par.ui.errorPage(403,"Unauthorized",'A machine cannot access this page'));
                return;
            }
            if (checkCreator !== false && req.user.isCreator === true) {
                return next();
            } else if (auths.length <= 0) {
                if (isMachine) return exit(403,'You must be the website owner to view this page');

                res.status(403);
                res.send(par.ui.errorPage(403,"Unauthorized",'You must be the website owner to view this page<br><a href="' + par.loginRoute + 'login.html?to=' + encodeURIComponent(req.originalUrl) + '">Login or switch account</a>'));
                return;
            }
            let fl = req.user.flags;
            let missing = [];
            for(let f of auths) {
                if (typeof(f) === "number") f = String(f);
                if (!f || typeof(f) !== "string") continue;
                if (!fl.has(f)) {
                    missing.push(f);
                }
            }
            if (missing.length < 1) {
                return next();
            }
            if (isMachine) return exit(403,'You are missing the following flags to access this page: ' + missing.join(", "));

            let text = '';
            for(let m of missing) {
                if (text !== "") {
                    text += ', ';
                }
                text += '<span class="inline-code">' +  m + '</span>';
            }
            text = "You are missing the following permissions (flags): " + text;
            res.status(403);
            return res.send(par.ui.errorPage(403,"Unauthorized",text + ' <a href="' + par.loginRoute + 'login.html?to=' + encodeURIComponent(req.originalUrl) + '">Login or switch account</a>'));
        };
    }

    expressAuthsAPI(auths,checkCreator,allowMachine = false) {
        if (!Array.isArray(auths)) {
            auths = [auths];
        }
        if (typeof(checkCreator) !== "boolean") {checkCreator = true;}
        let par = this;
        return function (req,res,next) {
            //console.log(auths,checkCreator,req);
            if (!req.user) {
                res.status(403);
                return res.send("You should be logged in to use this service");
            }
            if (allowMachine !== true && req.user.machine) {
                res.send('A machine cannot access this page');
                return;
            }
            if (checkCreator !== false && req.user.isCreator === true) {
                return next();
            } else if (auths.length <= 0) {
                res.status(403);
                res.send("You must be the website creator to use this service")
                return;
            }
            let fl = req.user.flags;
            let missing = [];
            for(let f of auths) {
                if (typeof(f) === "number") f = String(f);
                if (!f || typeof(f) !== "string") continue;
                if (!fl.has(f)) {
                    missing.push(f);
                }
            }
            if (missing.length < 1) {
                return next();
            }
            let text = "You are missing the following permissions (flags): " + missing.join(", ") + " to use this service";
            res.status(403);
            return res.send(text);            
        };
    }

    get getUser() {
        let par = this;
        return function (req,res,next) {
            req.user = par.checkReq(req);
            next();
        };
    }

    express(loginRoute) {
        if (loginRoute.endsWith("/") !== true) {loginRoute += "/";}
        this.loginRoute = loginRoute;
        let par = this;
        return function (req,res,next) {
            if (!req.user) {
                req.user = par.checkReq(req);
            }
            if (!req.user) {
                if (req.headers.authorization) {
                    res.status(403);
                    return res.send("NOT LOGGED IN");
                } else {
                    res.redirect(loginRoute + "login.html?to=" + encodeURIComponent(req.originalUrl));
                }
            } else {
                next();
            }
        };
    }

    get router() {
        var expr = require("exp" + "ress");
        return this._router(expr.Router()).bind(this);
    }

    _router(router) {
        let par = this;

        router.use("*",function (req,res,next) {
            req.user = par.checkReq(req);
            next();
        });

        router.post("/machines/login",function (req,res) {
            let {password,username} = req.body;
            var ip = getClientAddress(req);
            if (!password || !username) {
                res.status(400);
                return res.send("Missing arguments");
            }
            if (req.user && req.user.machine) {
                req.user.token.revoke();
            }
            let c = par.machine_credentials.get(username);
            if (!c || c.password !== password) {
                res.status(403);
                return res.send("Incorrect credentials");
            }
            let t = par._createToken(c,true,getClientAddress(req));
            if (!t || t.revoked === true) {
                return reject("Encountered inernal error");
            }
            let url = req.protocol + '://' + req.get('host') + req.originalUrl.slice(0,-"login".length);
            //return console.log(url);
            res.set("content-type","application/json");
            let credentials = t.credentials;
            let r = {
                token_id: t.id,
                token: t.t,
                expires: (new Date(t.expires)).toISOString(),
                login_url: url + "login",
                logout_url: url + "logout",
                username: credentials.u,
                flags: credentials.f
            };
            if (req.query.format == "xml") {
                r = Util.toXML(r);
            } else {
                r = JSON.stringify(r,null,2);
            }

            res.send(r);
        });

        router.get("/machines/logout",function (req,res) {
            if (!req.user || !req.user.machine) {
                return res.send("NOT OK");
            }
            req.user.token.revoke();
            res.send("OK");
        });

        router.use("*",function (req,res,next) {
            if (req.user && req.user.machine) {
                res.status(403);
                return res.send("Machines don't have access to this");
            }
            return next();
        });


        router.get(["/login.html","/login"],function (req,res) {
            if (req.user) {
                res.set("Set-cookie",req.user.revoke_cookie);
                req.user.token.revoke();
            }
            res.send(par.ui.getLoginPage(req.query.error,req.query.to));
        });

        router.post("/login",function (req,res) {
            let {p,u} = req.body;
            var ip = getClientAddress(req);
            if (!p || !u) {
                res.status(400);
                return res.send("Missing arguments");
            }
            let r = (req.body.r == "1" || req.body.r === 1);
            par.login(u,p,r,ip).then((user) =>{
                if (par.isMultisite) {
                    let dc;
                    if (user.token.temp === true) {
                        dc = "";
                    } else {
                        dc = ` Expires=${(new Date(user.token.expires)).toUTCString()};`;
                    }
                    dc = `multtoken=${user.token.t};${dc} Path=/; SameSite=None; Secure`;
                    res.set("set-cookie",[
                        user.cookie,
                        dc
                    ]);
                } else {
                    res.set("set-cookie",user.cookie);
                }
                res.redirect(req.body.to || "/");
                res.end();
            }).catch((err) => {
                err = "login.html?error=" + err + ((!!req.body.to) ? "&to=" + encodeURIComponent(req.body.to) : "");
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

        var checkIsAdmin = function (req,res) {
            if (!req.user || req.user.machine) {
                res.status(403);
                res.send(par.ui.errorPage(403,"Unauthorized",'You are not allowed to do this <a href="login.html">Login or switch account</a>'));
                return false;
            }
            if (par.accounts_admin !== true) {
                res.status(403);
                res.send(par.ui.errorPage(403,"Unauthorized",'Admin did not allow modifying the settings <a href="/">Website home</a>'));
                return false;
            }
            if (!req.user.flags.has("accounts_admin") && req.user.credentials.creator !== 1) {
                res.status(403);
                res.send(par.ui.errorPage(403,"Unauthorized",'You do not have the authorization to do this <a href="login.html">Login or switch account</a>'));
                return false;
            }
            return true;
        };

        router.get(["/","/index.html"],function (req,res) {
            if (req._parsedUrl.pathname === "/") {
                let u = req.originalUrl;
                if (!u.endsWith("/")) {u += '/';}
                return res.redirect(u + "index.html");
            }
            if (!checkIsAdmin(req,res)) {return;}
            res.send(par.ui.getAccountsPage(req.user.credentials));
        });

        router.get(["/machines/","/machines/index.html"],function (req,res) {
            let u = req._parsedUrl.pathname;
            if (u === "/machines" || u === "/machines/") {
                u = req.originalUrl;
                if (!u.endsWith("/")) {u += '/';}
                return res.redirect(u + "index.html");
            }
            if (!checkIsAdmin(req,res)) {return;}
            res.send(par.ui.getAccountsPage(req.user.credentials,"machines"));
        });

        router.get(["/machines/user","/machines/user.html"],function (req,res) {
            if (!checkIsAdmin(req,res)) {return;}
            let uname = req.query.u;
            if (!uname) {
                res.status(400);
                return res.send("Missing parameters");
            }
            res.set("content-type","text/html");
            res.send(par.ui.getUserPage(uname,req.user,"machines"));
        });

        router.get(["/user","/user.html"],function (req,res) {
            if (!checkIsAdmin(req,res)) {return;}
            let uname = req.query.u;
            if (!uname) {
                res.status(400);
                return res.send("Missing parameters");
            }
            res.set("content-type","text/html");
            res.send(par.ui.getUserPage(uname,req.user));
        });

        router.get("/api/revokeToken",function (req,res) {
            if (!checkIsAdmin(req,res)) {return;}
            let id = req.query.id,uname = req.query.uname;
            if (!id || !uname) {
                res.status(400);
                return res.send("Missing arguments");
            }

            let u = (req.query.machine == "1") ? par.machine_credentials.get(uname) : par.credentials.get(uname);
            if (!u) {
                res.status(404);
                return res.send("User does not exist");
            }
            let currentTokenID = req.user.token.id;
            if (id === "all") {
                u.tokens.forEach((t) => {
                    if (t.id === currentTokenID) {
                        res.set("x-logout","1");
                    }
                    t.revoke();
                });
            } else {
                let t = u.tokens.get(id);
                if (!t) {
                    res.status(404);
                    return res.send("Requested token does not exit (id='" + id + "')");
                }
                t.revoke();
                if (t.id === currentTokenID) {
                    res.set("x-logout","1");
                }
            }
            res.send("Revoked the session(s)");
        });

        router.post("/api/createAccount",function (req,res) {
            if (!checkIsAdmin(req,res)) {return;}
            let force = (req.query.force === "1" || req.query.force === 1);
            if (!req.body || typeof(req.body) !== "object") {
                res.status(400);
                return res.send("Invalid request body");
            }
            let d = req.body;
            if (!d || typeof(d) !== "object" || !d.u || !d.p || typeof(d.u) !== "string" || typeof(d.p) !== "string") {
                res.status(400);
                return res.send("Invalid request body");
            }
            let crede = (d.machine === true) ? par.machine_credentials : par.credentials;
            let isOwner = req.user.credentials.isOwner;
            let ol = crede.get(d.u);
            if (ol) {
                if (!isOwner && ol.isOwner) {
                    res.status(403);
                    return res.send("You do not have the permission to recreate the owner's account");
                }

                if (ol === req.user.credentials) {
                    if (force !== true) {
                        res.status(201);
                        return res.send("This will recreate your account. You will probably not be able to edit the settings anymore. do you wish to continue ?");
                    }
                    res.set("x-logout","1");
                }

                if (force !== true) {
                    res.status(201);
                    return res.send("A user with this name already exists. Continuing will recreate it from scratch. Are you sure you want to continue ?");
                }
            }
            let n = par.addCredential(d.u,d.p,0,(d.machine === true) ? "machines" : "users");
            if (!n) {
                res.status(500);
                return res.send("Error creating account");
            }
            return res.send("OK");
        });

        router.post("/api/save_settings",function (req,res) {
            if (!checkIsAdmin(req,res)) {return;}
            let force = (req.query.force === "1" || req.query.force === 1);
            if (!req.body || typeof(req.body) !== "object") {
                res.status(400);
                return res.send("Invalid request body");
            }
            let uname = req.query.uname;
            if (!uname) {
                res.status(400);
                return res.send("Missing parameters");
            }
            let crede = (req.query.machine == "1") ? par.machine_credentials : par.credentials;
            let u = crede.get(uname);
            if (!u) {
                res.status(404);
                return res.send("User does not exist");
            }
            if (!req.body.username || !req.body.password) {
                res.status(400);
                return res.send("Invalid request body");
            }
            let j = {
                u: req.body.username,
                p: req.body.password
            };
            let fls = (!!req.body.flags && typeof(req.body.flags) == "object") ? req.body.flags : {};
            let flags = u.flags;
            flags.flags = 0;
            flags.fromObject(fls);
            j.f = flags.flags;

            if (crede.has(j.u) && force !== true) {
                let ol = crede.get(j.u);
                if (ol !== u) {
                    res.status(201);
                    return res.send("A user with this username already exist. Are you sure you want to overwrite it ?");
                }
            }
            if (u === req.user.credentials) {
                res.set("x-logout","1");
            }
            let n = par._editCredential(uname,req.user.credentials,j,((req.query.machine == "1") ? "machines" : "users"));
            if (!n) {
                res.status(500);
                return res.send("Error saving edits");
            } else if (Array.isArray(n)) {
                res.status(n[0]);
                return res.send(n[1]);
            } else if (n instanceof LoginCredential) {
                return res.send(n);
            } else {
                res.status(500);
                return res.send("Error saving edits (invalid _editCredentials return value)");
            }
        });

        router.get("/deleteUser",function (req,res) {
            if (!checkIsAdmin(req,res)) {return;}
            let force = (req.query.force === "1" || req.query.force === 1);
            let uname = req.query.uname;
            if (!uname) {
                res.status(400);
                return res.send("Missing parameters");
            }

            let isCreator = req.user.credentials.isCreator;
            let crede = (req.query.machine == "1") ? par.machine_credentials : par.credentials;
            let ol = crede.get(uname);

            if (!ol) {
                res.status(404);
                return res.send("This user does not exist (uname='" + uname + "')");
            }
            if (!isCreator && ol.isCreator) {
                res.status(403);
                return res.send("You do not have the permission to delete the creators account");
            }

            if (ol.flags.has("accounts_admin") && !isCreator) {
                res.status(403);
                return res.send("Only the creator can delete a user with admin  permissions");
            }

            if (ol === req.user.credentials) {
                if (force !== true) {
                    res.status(200);
                    return res.send("This will delete your account<br>This action cannot be undone<br>Do you wish to continue ?<br><a href=\"?uname=" + encodeURIComponent(uname) + "\"");
                }
                res.set("x-logout","1");
            }

            if (ol.isCreator) {
                return res.send("You cannot delete creator's account");
            }

            ol.revokeAllTokens();
            let m = 0;
            if (ol === req.user.credentials) {
                m = 1;
            }
            crede.delete(ol.u);
            res.redirect((m === 1) ? "login.html" : (!ol.m ? "index.html" : "machines/index.html"));
            res.end();
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
            return res.send("404 Not Found");
        });

        return router;
    }

}
module.exports = Login;
