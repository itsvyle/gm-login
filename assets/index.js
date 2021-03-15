var not;
function onload() {
    not = new gm.NotificationMessages();
    var form = document.getElementById("form");
    form.addEventListener("submit",function (event) {
        event.preventDefault();
        createAccount();
    });
}

function createAccount(force) {
    if (!force) {force = false;}
    var fields = gm.fromIDS({
        uname: "f-username",
        p: "f-password",
        submit: "f-submit"
    });
    if (!fields.uname.value.trim() || !fields.p.value.trim()) {return;}
    fields.submit.disabled = true;
    gm.request("api/createAccount",{
        body: {
            u: fields.uname.value.trim(),
            p: fields.p.value.trim(),
            machine: (!!document.getElementById("machines-indicator"))
        },
        method: "POST",
        notifier: not,
        accept_codes: [200,201]
    },function (r) {
        if (r.status === 1) {
            if (r.http_code === 201) {
                var rt = confirm(r.res);
                if (rt === true) {
                    return createAccount(true);
                }
            }
            if (r.headers['x-logout'] === "1") {
                window.location.href = "login.html";
                return;
            }
            window.location.reload();
        }       
    });
}

gm.onload(onload);
