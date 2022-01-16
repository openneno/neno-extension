var ObjectId = (function () {
    var increment = Math.floor(Math.random() * (16777216));
    var pid = Math.floor(Math.random() * (65536));
    var machine = Math.floor(Math.random() * (16777216));

    var setMachineCookie = function () {
        var cookieList = document.cookie.split('; ');
        for (var i in cookieList) {
            var cookie = cookieList[i].split('=');
            var cookieMachineId = parseInt(cookie[1], 10);
            if (cookie[0] == 'mongoMachineId' && cookieMachineId && cookieMachineId >= 0 && cookieMachineId <= 16777215) {
                machine = cookieMachineId;
                break;
            }
        }
        document.cookie = 'mongoMachineId=' + machine + ';expires=Tue, 19 Jan 2038 05:00:00 GMT;path=/';
    };
    if (typeof (localStorage) != 'undefined') {
        try {
            var mongoMachineId = parseInt(localStorage['mongoMachineId']);
            if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
                machine = Math.floor(localStorage['mongoMachineId']);
            }
            // Just always stick the value in.
            localStorage['mongoMachineId'] = machine;
        } catch (e) {
            setMachineCookie();
        }
    }
    else {
        setMachineCookie();
    }

    function ObjId() {
        if (!(this instanceof ObjectId)) {
            return new ObjectId(arguments[0], arguments[1], arguments[2], arguments[3]).toString();
        }

        if (typeof (arguments[0]) == 'object') {
            this.timestamp = arguments[0].timestamp;
            this.machine = arguments[0].machine;
            this.pid = arguments[0].pid;
            this.increment = arguments[0].increment;
        }
        else if (typeof (arguments[0]) == 'string' && arguments[0].length == 24) {
            this.timestamp = Number('0x' + arguments[0].substr(0, 8)),
                this.machine = Number('0x' + arguments[0].substr(8, 6)),
                this.pid = Number('0x' + arguments[0].substr(14, 4)),
                this.increment = Number('0x' + arguments[0].substr(18, 6))
        }
        else if (arguments.length == 4 && arguments[0] != null) {
            this.timestamp = arguments[0];
            this.machine = arguments[1];
            this.pid = arguments[2];
            this.increment = arguments[3];
        }
        else {
            this.timestamp = Math.floor(new Date().valueOf() / 1000);
            this.machine = machine;
            this.pid = pid;
            this.increment = increment++;
            if (increment > 0xffffff) {
                increment = 0;
            }
        }
    };
    return ObjId;
})();

ObjectId.prototype.getDate = function () {
    return new Date(this.timestamp * 1000);
};

ObjectId.prototype.toArray = function () {
    var strOid = this.toString();
    var array = [];
    var i;
    for (i = 0; i < 12; i++) {
        array[i] = parseInt(strOid.slice(i * 2, i * 2 + 2), 16);
    }
    return array;
};

/**
* Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
*/
ObjectId.prototype.toString = function () {
    if (this.timestamp === undefined
        || this.machine === undefined
        || this.pid === undefined
        || this.increment === undefined) {
        return 'Invalid ObjectId';
    }

    var timestamp = this.timestamp.toString(16);
    var machine = this.machine.toString(16);
    var pid = this.pid.toString(16);
    var increment = this.increment.toString(16);
    return '00000000'.substr(0, 8 - timestamp.length) + timestamp +
        '000000'.substr(0, 6 - machine.length) + machine +
        '0000'.substr(0, 4 - pid.length) + pid +
        '000000'.substr(0, 6 - increment.length) + increment;
};
window.exports = {
    "neno": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list",  // 列表模式
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                if (!getGithubToken()) {
                    callbackSetList([
                        {
                            title: '请输入github token 设置github token',
                            description: '当前未设置github token,使用clear neno setting命令清除所有设置',
                        }
                    ])
                }
                else if (!getGithubUserName()) {
                    callbackSetList([
                        {
                            title: '请输入保存neno笔记的github用户名',
                            description: '当前未设置github用户名,使用clear neno setting命令清除所有设置',
                        }
                    ])
                } else if (!getGithubNenoRepo()) {
                    callbackSetList([
                        {
                            title: '请输入保存neno笔记的github仓库名',
                            description: '当前未设置github仓库名,使用clear neno setting命令清除所有设置',
                        }
                    ])
                }


            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                console.log(action, searchWord);
                inputContent = searchWord
                if (!getGithubToken()) {
                    callbackSetList([
                        {
                            title: '确定设置github token',
                            description: '确定',
                        }
                    ])
                } else if (!getGithubUserName()) {
                    callbackSetList([
                        {
                            title: '确定设置github用户名',
                            description: '确定',
                        }
                    ])
                }
                else if (!getGithubNenoRepo()) {
                    callbackSetList([
                        {
                            title: '确定设置github仓库',
                            description: '确定',
                        }
                    ])
                } else {
                    callbackSetList([
                        {
                            title: '发送neno笔记',
                            description: '发送',
                        }
                    ])
                }
            },
            // 用户选择列表中某个条目时被调用
            select: async (action, itemData, callbackSetList) => {
                if (itemData.title === "确定设置github token") {
                    setGithubToken(inputContent)
                    utools.setSubInputValue('')
                } else if (itemData.title === "确定设置github仓库") {
                    setGithubNenoRepo(inputContent)
                    utools.setSubInputValue('')

                } else if (itemData.title === "确定设置github用户名") {
                    setGithubUserName(inputContent)
                    utools.setSubInputValue('')

                } else {
                    callbackSetList([
                        {
                            title: '正在发送neno笔记',
                            description: '发送中',
                        }
                    ])
                    await sendNenoToGithub(inputContent)
                    window.utools.hideMainWindow()
                }

            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "输入笔记"
        }
    },
    "clear neno setting": {
        mode: "none",
        args: {
            enter: (action) => {
                clearNenoSetting()
                window.utools.hideMainWindow()
                window.utools.outPlugin()
            }

        }
    }
}
let inputContent = ""

function setGithubToken(token) {
    utools.dbStorage.setItem('githubToken', token)
}
function setGithubNenoRepo(repo) {
    utools.dbStorage.setItem('repo', repo)
}
function setGithubUserName(userName) {
    utools.dbStorage.setItem('userName', userName)

}
function getGithubToken() {
    return utools.dbStorage.getItem('githubToken')
}
function getGithubNenoRepo() {
    return utools.dbStorage.getItem('repo')
}
function clearNenoSetting() {
    utools.dbStorage.removeItem('githubToken')
    utools.dbStorage.removeItem('repo')
    utools.dbStorage.removeItem('userName')
    
}
function getGithubUserName() {
    return utools.dbStorage.getItem('userName')
}
async function sendNenoToGithub(content) {
    let date = new Date()
    let created_at = `${date.getFullYear()}-${(date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)}-${date.getDate() < 10 ? '0' + date.getDate()  : date.getDate() }T${date.getHours() < 10 ? '0' + date.getHours()  : date.getHours() }:${date.getMinutes() < 10 ? '0' + date.getMinutes()  : date.getMinutes() }:${date.getSeconds() < 10 ? '0' + date.getSeconds()  : date.getSeconds() }+08:00`
    let datefile = `${date.getFullYear()}-${(date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)}-${date.getDate() < 10 ? '0' + date.getDate()  : date.getDate() }`
    let _id = (new ObjectId()).toString()
    let tags = [];

    let mt = content.match(/#\S*/g);
    if (mt != null) {
        tags = [...tags, ...mt];
    }
    let neno = {
        "content": `<p>${content}</p>`,
        "pureContent": content,
        "_id": _id,
        "parentId": "",
        "source": "utools",
        "tags": tags,
        "images": [],
        "created_at": created_at,
        "sha": "",
        "update_at": created_at
    }
    let buff = new Buffer(JSON.stringify(neno, null, "\t"));
    let base64content = buff.toString('base64');
    var raw = JSON.stringify({
        "content": base64content,
        "message": `[ADD] ${content}`
    }, null, "\t");
    console.log(raw);

    var requestOptions = {
        method: 'PUT',
        headers: {
            authorization: `token ${getGithubToken()}`,
            accept: "application/vnd.github.v3+json"
        },
        body: raw,
        redirect: 'follow'
    };

    await fetch(`https://api.github.com/repos/${getGithubUserName()}/${getGithubNenoRepo()}/contents/${datefile}/${_id}.json`, requestOptions)

}