var base,not,firstSave;
function onload() {
    not = new gm.NotificationMessages();
    base = gm.base();
    if (!base || !base.uname) {
        document.getElementById("content-container").innerHTML = "ERROR: NO BASE";
        return false;
    }

    refreshAccountsAdmin();

    firstSave = _toSave();

    refresh();
}

function refreshAccountsAdmin() {
    if (base.isCreator !== true) {
        var fls = document.getElementById("flags").getElementsByClassName("flag-checkbox");
        for(var i = 0;i < fls.length;i++) {
            var fl = fls[i];
            if (fl.name == "accounts_admin" || base.editingSelf == true) {
                fl.disabled = true;
                fl.title = "Only creator can edit this flag";
            }
        }
    }
}


function _toSave() {
    var r = {
        username: null,
        password: null,
        flags: {}
    };
    var f = gm.fromIDS({
        name: "f-username",
        password: "f-password",
        flags: "flags"
    });
    r.username = f.name.value.trim();
    r.password = f.password.value.trim();
    var fls = f.flags.getElementsByClassName("flag-checkbox");
    for(var i = 0;i < fls.length;i++) {
        var fl = fls[i];
        if (!fl.name) {continue;}
        r.flags[fl.name] = fl.checked;
    }

    return r;
}

function toSave() {
    var t = _toSave();
    if (!t.username || !t.password) {return false;}
    return t;
}

function refresh() {
    var b = document.getElementById("save_button");
    var t = toSave();
    if (t === false) {
        b.disabled = true;
    } else {
        if (gm.deepEqual(firstSave,t)) {
            b.disabled = true;
        } else {
            b.disabled = false;
        }
    }
}

function revokeToken(id,caller) {
    if (!id) {return;}
    if (!!base.currentTokenID && id === base.currentTokenID) {
        if (!confirm("Are you sure you want to do this ? This will log you out !")) {
            return;
        }
    }
    if (!!caller) {caller.disabled = true;}
    gm.request("api/revokeToken?" + gm.buildQuery({
        uname: base.uname,
        id: id  
    }),{
        notifier: not
    },function (r) {
        if (r.status === 1) {
            not.addMessage(r.res,null,3000,true);
        }
        if (r.headers['x-logout'] === "1") {
            window.location.href = "login.html";
            return disabledAll(true);
        }
        var ss = document.getElementById("session-tr-" + id);
        if (!!ss) {
            ss.remove();
        }
        if (!!caller) {caller.disabled = false;}
        firstSave = _toSave();
        refresh();
    });
}

function disabledAll(d) {
    var f = Object.values(gm.fromIDS({
        name: "f-username",
        password: "f-password",
        flags: "flags",
        save: "save_button"
    }));
    f.concat(document.getElementsByClassName("flag-checkbox"),document.getElementsByClassName("revoke-button"));
    for(var i = 0;i < f.length;i++) {
        f[i].disabled = d;
    }
    refreshAccountsAdmin();
}

function saveSettings(force) {
    var t = toSave();
    if (!force) {force = false;}
    if (base.editingSelf === true && force !== true) {
        if (!confirm("You are editing your own account. You will therefore be logged out. Do you wish to continue ?")) {return;}
    }
    if (!t) {return refresh();}
    disabledAll(true);
    //console.log("passed",force);
    gm.request("api/save_settings?" + gm.buildQuery({
            uname: base.uname,
            force: force
        }),{
        method: "POST",
        body: t,
        notifier: not,
        accept_codes: [200,201]
    },function (r) {
        console.log(r);
        if (r.status === 1) {
            if (r.http_code === 201) {
                var rt = confirm(r.res);
                if (rt === true) {
                    return saveSettings(true);
                }
            }
            not.addMessage("Saved settings",null,4000,true);
            if (r.headers['x-logout'] === "1") {
                window.location.href = "login.html";
                return disabledAll(true);
            }
            firstSave = t;
        }
        disabledAll(false);
        refresh();
    });
}

function deleteAccount() {
    if (confirm("Are you sure that you wish to delete this account") === true) {
        window.location.href = ("deleteUser?uname=" + encodeURIComponent(base.uname));
    }
}

function revokeAllTokens() {
    revokeToken("all",document.getElementById("revoke-all-tokens"));
}

gm.onload(function () {
    try {onload();}catch(err) {alert(err);}
});
