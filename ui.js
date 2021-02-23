const fs = require("fs");
const {Util} = require("./utilities");

class LoginUI {
    constructor(login) {
        Object.defineProperty(this,"login",{value: login});
        this.pages = {};
    }

    getLoginPage(error,redirectTo) {
        let d = null;
        if (this.pages.login) {
            d = this.pages.login;
        } else {
            try {
                d = fs.readFileSync(__dirname + "/assets/login.html");
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
        d = d.split("{default_username}").join(s("default_username",""));
        d = d.split("{error}").join(error || "");
        d = d.split("{redirect_to}").join((!redirectTo) ? "" : `<input type="text" style="display: none;" name="to" value="${redirectTo}">`);
        if (this.login.options.dark === true) {
            d = d.split("{body_class}").join("dark-mode");
        }
        if (this.login.remember_me === true) {
            d = d.split("{remember_me}").join("checked");
        } else {
            d = d.split("{remember_me}").join("");   
        }
        return d;
    }

    errorPage(code,desc,text,title) {
        if (!title) title = desc;
        let d = null;
        if (this.pages.error) {
            d = this.pages.error;
        } else {
            try {
                d = fs.readFileSync(__dirname + "/assets/error.html");
                d = d.toString();
            } catch (err) {}
        }
        if (!d) return "Error getting page";
        let repl = function (a,b) {d = d.split(a).join(b);};
        repl("{page-title}",(code || "000") + " - " + title);
        repl("{error-code}",code);
        repl("{error-desc}",desc);
        repl("{error-text}",text || "");
        return d;
    }



    accounts(editor) {
        if (!editor) {return "Missing editor parameter";}
        let r = [];
        var prim = function (c) {
            let a = {
                name: c.u,
                password: "",
                date: new Date(c.d),
                timestamp: c.d,
                isCreator: c.creator === 1,
                sessionsCount: c.tokens.size
            };
            if (editor.isCreator !== true && c.flags.has("accounts_admin") && c !== editor) return;
            for(var i = 0;i < c.p.length;i++) {a.password += '*';}
            r.push(a);
        };
        prim = prim.bind(this);
        this.login.credentials.forEach(prim);

        return r.sort(Util.sortBy("timestamp"));
    }

    getAccountsPage(editor) {
        if (!editor) {return "Missing editor parameter";}
        let con = "";
        let accounts = this.accounts(editor);
        for(let a of accounts) {
            if (a.isCreator && editor.isCreator === false) continue;
            con += `<div class="user">
                <p class="user-name">${(a.isCreator) ? "<i>Creator</i>: " : ""}${a.name}${(a.name === editor.n) ? " (YOU)" : ""}</p>
                <p>Password: <span class="bold">${a.password}</span></p>
                <p>Account created: <span class="bold">${a.date.toLocaleString("en-US",{ timeZone: 'America/New_York' }) + " (NY time)"}</span></p>
                <p>Sessions open: <span class="bold">${a.sessionsCount}</span></p>
                <div class="user-options">
                    <a href="user.html?u=${a.name}">View or edit user</a>
                </div>
            </div>`;
        }

        let d = null;
        if (this.pages.accounts) {
            d = this.pages.accounts;
        } else {
            try {
                d = fs.readFileSync(__dirname + "/assets/index.html");
                d = d.toString();
            } catch (err) {}
        }
        if (!d) return "Error getting page";
        d = d.split("{content}").join(con);
        return d;

    }

    user(uname) {
        if (!this.login.credentials.has(uname)) {
            return null;
        }
        let c = this.login.credentials.get(uname);
        let r = {
            name: c.u,
            password: c.p,
            isCreator: (c.creator === 1),
            sessions: [],
            flags: c.flags,
        };
        let tokens = c.tokens;
        tokens.forEach((t) => {
            r.sessions.push({
                id: t.id,
                token: t.t,
                dateCreatedRaw: t.d,
                dateCreated: t.dateCreated,
                dateExpires: t.dateExpires,
                expiresDif: t.expires - Date.now(),
                ip: t.ip,
                tempSession: (t.s === 0)
            });
        });
        return r;
    }

    getUserPage(uname,editor) {
        let u = this.user(uname);
        if (!editor) {
            return "Internal error";
        }
        let d = null;
        if (this.pages.user) {
            d = this.pages.user;
        } else {
            try {
                d = fs.readFileSync(__dirname + "/assets/user.html");
                d = d.toString();
            } catch (err) {}
        }
        if (!d) return "Error getting page";

        var triggerError = function (er) {
            d = d.replace("{error}",er);
            d = d.replace("{content-container-style}","display: none;");
            d = d.replace("{footer-style}","display: none;");
            return d;
        };
        if (!u) {
            return triggerError("Could not find the user");
        }
        if (u.isCreator && !editor.credentials.isCreator) {
            return triggerError("You cannot edit the creator's settings");
        }
        if (u.flags.has("accounts_admin") && !editor.credentials.isCreator && u.name !== editor.username) {
            return triggerError("You cannot edit the another admin's settings");
        }
        u.flags = u.flags.object();
        
        u.deletable = (editor.credentials.isCreator  || !u.isCreator && editor.credentials.flags.has("accounts_admin") === false);

        d = d.replace("{error}","");
        d = d.replace("{content-container-style}","");
        d = d.replace("{footer-style}","");

        for(var i = 0;i < u.sessions.length;i++) {
            let s = u.sessions[i];
            u.sessions[i].dateCreated = u.sessions[i].dateCreated.toLocaleString("en-US",{ timeZone: 'America/New_York' }) + " (NY time)";
            u.sessions[i].dateExpires = u.sessions[i].dateExpires.toLocaleString("en-US",{ timeZone: 'America/New_York' }) + " (NY time)";
        }
        u.sessions = u.sessions.sort(Util.sortBy("dateCreatedRaw"));

        let replaceAll = function (s,r) {d = d.split(s).join(r);};
        let base = {
            uname: uname,
            isCreator: editor.credentials.isCreator,
            currentTokenID: editor.token.id,
            editingSelf: (u.name === editor.username)
        };
        
        replaceAll("{username}",u.name);
        replaceAll("{password}",u.password);
        replaceAll("{can_delete}",(u.deletable) ? "" : "disabled");
        let html = "";
        for(let flag in u.flags) {
            let has = u.flags[flag];
            html += `<tr class="flag-tr">
                    <td>
                        <input onclick="refresh();" type="checkbox" name="${flag}" class="flag-checkbox" ${(has === true) ? "checked" : ""}>
                    </td>
                    <td>${flag}</th>
            </tr>`;
        }

        replaceAll("{flags}",html);
        
        html = "";
        for(let i of u.sessions) {
            if (!i.ip) i.ip = "<i>No IP</i>";
            if (i.id === editor.token.id) i.token += ' (current session)';
            html += `<tr class="session-tr" id="session-tr-${i.id}">
                    <td title="id='${i.id}'">${i.token}</td>
                    <td>${i.ip}</td>
                    <td>${i.dateExpires} (${Util.formatTime(i.expiresDif)}${(i.tempSession === true) ? " / Browser session close" : ""})</td>
                    <td><button class="revoke-button" onclick="revokeToken('${i.id}',this);">Revoke</button></th>
                </tr>`;
        }
        replaceAll("{tokens}",html);

        d = d.replace("{base}",JSON.stringify(base));
        return d;
        //return JSON.stringify(u,null,2);
    }

}

module.exports = LoginUI;
