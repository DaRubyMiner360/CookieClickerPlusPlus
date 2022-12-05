const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;

const { getUserInfo } = require('@replit/repl-auth');
const Client = require("@replit/database");
const client = new Client();

const requests = require('request-promise');

// Set to false to keep ads, supporting the original creators
const removeAds = true;
// Set to false to disable bulk buying 1000
const enableBulkBuyThousand = true;

app.get('/load', async (req, res) => {
    // await client.empty();
    // process.exit();
    const user = getUserInfo(req);
    if (!user) {
        res.json({ "result": null });
        return;
    }

    let version = "live";
    if (req.query.version) {
        version = req.query.version;
        if (version != "live" && version != "beta" && version != "v10466") {
            version = "live";
        }
    }

    let savedata = await client.get(user.id);
    if (savedata != null) {
        if (savedata[version] != null) {
            if (req.query.key) {
                if (savedata[version][req.query.key]) {
                    let result = savedata[version][req.query.key];
                
                    res.json({ "result": result });
                    return;
                }
                res.json({ "result": null });
                return;
            }
            res.json({ "result": savedata[version] });
            return;
        }
        res.json({ "result": null });
        return
    }
    res.json({ "result": null });
    return;
});

app.post('/save', async (req, res) => {
    const user = getUserInfo(req);
    if (!user) {
        res.json({ "result": null });
        return;
    }

    let version = "live";
    if (req.query.version) {
        version = req.query.version;
        if (version != "live" && version != "beta" && version != "v10466") {
            version = "live";
        }
    }

    if (req.body) {
        let savedata = await client.get(user.id);
        if (savedata == null) {
            savedata = {};
        }
        if (savedata[version] == null) {
            savedata[version] = {};
        }
        savedata[version][req.body.key] = req.body.str;
        await client.set(user.id, savedata);

        res.send("{}");
        return;
    }
    res.send("0");
});

app.get('/', async (req, res) => {
    const user = getUserInfo(req);

    requests('https://orteil.dashnet.org/cookieclicker/')
        .then(async (content) => {
            let result = content;
            if (removeAds) {
                result = result.replace(new RegExp("<!-- ad[\\d\\D]*?\/ad -->", 'g'), '');
            }
            
            res.send(result);
        })
        .catch(async (err) => {
            console.log(err);
        });
});

app.get('/beta', async (req, res) => {
    const user = getUserInfo(req);

    requests('https://orteil.dashnet.org/cookieclicker/beta/')
        .then(async (content) => {
            let result = content;
            result = result.replace('src="main.js', 'src="beta/main.js');
            result = result.replace('href="style.css', 'href="beta/style.css');

            result = result.replace('href="favicon.ico', 'src="beta/favicon.ico');
            result = result.replace('src="base64.js', 'src="beta/base64.js');
            result = result.replace('src="ajax.js', 'src="beta/ajax.js');
            result = result.replace('src="DungeonGen.js', 'src="beta/DungeonGen.js');
            result = result.replace('src="dungeons.js', 'src="beta/dungeons.js');

            if (removeAds) {
                result = result.replace(new RegExp("<!-- ad[\\d\\D]*?\/ad -->", 'g'), '');
            }
            
            res.send(result);
        })
        .catch(async (err) => {
            console.log(err);
        });
});

app.get('/v10466', async (req, res) => {
    const user = getUserInfo(req);

    requests('https://orteil.dashnet.org/cookieclicker/v10466/')
        .then(async (content) => {
            let result = content;
            result = result.replace('src="main.js', 'src="v10466/main.js');
            result = result.replace('href="style.css', 'href="v10466/style.css');

            result = result.replace('href="favicon.ico', 'src="v10466/favicon.ico');
            result = result.replace('src="base64.js', 'src="v10466/base64.js');
            result = result.replace('src="ajax.js', 'src="v10466/ajax.js');
            result = result.replace('src="DungeonGen.js', 'src="v10466/DungeonGen.js');
            result = result.replace('src="dungeons.js', 'src="v10466/dungeons.js');

            if (removeAds) {
                result = result.replace(new RegExp("<!-- ad[\\d\\D]*?\/ad -->", 'g'), '');
            }
            
            res.send(result);
        })
        .catch(async (err) => {
            console.log(err);
        });
});

async function applyScriptChanges(content, version) {
    let result = content;
    result = `var saveData = null;
var windowLoaded = false;

(async () => {
    await fetch('/load?version=${version}', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(response => {
        saveData = response.result;
        if (saveData == null) {
            saveData = {};
        }
        if (windowLoaded) {
            load();
        }
        return response.result;
    })
    .catch(function(err) {
        console.log(err);
    });
})();
` + result;
    result = result.replace('window.onload=function()',
`window.onload=function() {
    windowLoaded = true;
    if (saveData != null) {
        load();
    }
}
var load=function()
`);
    result = result.replace('localStorageGet=function(key)',
`localStorageGet=function(key)
{
    return saveData[key];
}
_localStorageGet=function(key)`);
    result = result.replace('localStorageSet=function(key,str)',
`localStorageSet=function(key,str)
{
    saveData[key] = str;
    fetch('/save?version=${version}', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "key": key, "str": str })
    })
    .then(response => response.json())
    .then(response => JSON.stringify(response));
    return 0;
}
_localStorageSet=function(key,str)`);
    result = result.replace(
        `(!App?('<div id="httpsSwitch" style="cursor:pointer;display:inline-block;background:url(img/'+(Game.https?'lockOn':'lockOff')+'.png);width:16px;height:16px;position:relative;top:4px;left:0px;margin:0px -2px;"></div>'):'')+`,
        ''
    ).replace(
        `Game.attachTooltip(l('httpsSwitch'),'<div style="padding:8px;width:350px;text-align:center;font-size:11px;">'+loc("You are currently playing Cookie Clicker on the <b>%1</b> protocol.<br>The <b>%2</b> version uses a different save slot than this one.<br>Click this lock to reload the page and switch to the <b>%2</b> version!",[(Game.https?'HTTPS':'HTTP'),(Game.https?'HTTP':'HTTPS')])+'</div>','this');`,
        `/*Game.attachTooltip(l('httpsSwitch'),'<div style="padding:8px;width:350px;text-align:center;font-size:11px;">'+loc("You are currently playing Cookie Clicker on the <b>%1</b> protocol.<br>The <b>%2</b> version uses a different save slot than this one.<br>Click this lock to reload the page and switch to the <b>%2</b> version!",[(Game.https?'HTTPS':'HTTP'),(Game.https?'HTTP':'HTTPS')])+'</div>','this');`
    ).replace(
        `else if (location.protocol=='http:') location.href='https:'+window.location.href.substring(window.location.protocol.length);`,
        `else if (location.protocol=='http:') location.href='https:'+window.location.href.substring(window.location.protocol.length);*/
			({`
    );

    if (enableBulkBuyThousand) {
        result = result.replace('if (Game.keys[16]) Game.buyBulk=100;',
`if (Game.keys[18] || Game.keys[225]) Game.buyBulk=1000;
					if (Game.keys[16]) Game.buyBulk=100;`);
        result = result.replace(`l('storeBulkMax').style.visibility='hidden';`, `l('storeBulkMax').style.visibility='visible';`);
        result = result.replace(`loc("all")`, `(Game.buyMode==1?1000:loc("all"))`);
        result = result.replace('else if (id==5) Game.buyBulk=-1;', 'else if (id==5) Game.buyBulk=(Game.buyMode==1?1000:-1);');
        result = result.replace('if (Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=100;', 'if (Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=1000;');
        result = result.replace(`if (Game.buyBulk==-1) l('storeBulkMax').className='storePreButton storeBulkAmount selected'; else l('storeBulkMax').className='storePreButton storeBulkAmount';`, `if (Game.buyBulk==-1 || Game.buyBulk==1000) l('storeBulkMax').className='storePreButton storeBulkAmount selected'; else l('storeBulkMax').className='storePreButton storeBulkAmount';`);
    }
    
    return result;
}

app.get('/main.js', async (req, res) => {
    const user = getUserInfo(req);

    let url = 'https://orteil.dashnet.org/cookieclicker/main.js';
    if (req.query.v) {
        url += '?v=' + req.query.v;
    }
    requests(url)
        .then(async (content) => {
            let result = await applyScriptChanges(content, 'live');
            res.type('.js');
            res.send(result);
        })
        .catch(async (err) => {
            console.log(err);
        });
});

app.get('/beta/main.js', async (req, res) => {
    const user = getUserInfo(req);

    let url = 'https://orteil.dashnet.org/cookieclicker/beta/main.js';
    if (req.query.v) {
        url += '?v=' + req.query.v;
    }
    requests(url)
        .then(async (content) => {
            let result = await applyScriptChanges(content, 'beta');
            res.type('.js');
            res.send(result);
        })
        .catch(async (err) => {
            console.log(err);
        });
});

app.get('/v10466/main.js', async (req, res) => {
    const user = getUserInfo(req);

    let url = 'https://orteil.dashnet.org/cookieclicker/v10466/main.js';
    if (req.query.v) {
        url += '?v=' + req.query.v;
    }
    requests(url)
        .then(async (content) => {
            let result = await applyScriptChanges(content, 'v10466');
            res.type('.js');
            res.send(result);
        })
        .catch(async (err) => {
            console.log(err);
        });
});

app.get('/patreon/*', async (req, res) => {
    const user = getUserInfo(req);

    requests('https://orteil.dashnet.org' + req.url)
        .then(async (content) => {
            let result = content;
            
            res.send(result);
        })
        .catch(async (err) => {
            console.log(err);
        });
});

app.get('beta/*', async (req, res) => {
    let url = req.url.replace('https://cookieclicker.darubyminer360.repl.co/', '');
    if (url.startsWith('/')) {
        url = url.substring(1);
    }
    url = 'https://orteil.dashnet.org/cookieclicker/' + url;
    
    res.redirect(url);
});

app.get('v10466/*', async (req, res) => {
    let url = req.url.replace('https://cookieclicker.darubyminer360.repl.co/', '');
    if (url.startsWith('/')) {
        url = url.substring(1);
    }
    url = 'https://orteil.dashnet.org/cookieclicker/' + url;
    
    res.redirect(url);
});

app.get('*', async (req, res) => {
    let url = req.url.replace('https://cookieclicker.darubyminer360.repl.co/', '');
    if (url.startsWith('/')) {
        url = url.substring(1);
    }
    url = 'https://orteil.dashnet.org/cookieclicker/' + url;
    
    res.redirect(url);
});

app.listen(port, async () => {
    console.log(`CookieClicker++ listening on port ${port}`);
});
