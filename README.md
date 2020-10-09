# Url-Shortener
A Simple Url shortener.
Currently Requires MongoDB to be installed and running on your Server

A Better Guide will come soon, for now, you kinda have to figure out how it works. Sorry

## Installing

1. `npm install url-shortener-mongodb`
2.  Install MongoDB (`sudo apt install mongodb`)
3. `mongodb`/ `mongo`
4. `use ScarVite`
5. `db.createCollection("shortener")`
6. Import The File using `const shortener = require('url-shortener-mongodb')`


Quick Example using an Express App:
```Javascript
app.get('/re/:nanoId', async (req, res) => {
    var nanoId = await shortener.isExistentNanoID(req.params.nanoId);
    if (!nanoId.err && nanoId.exists) {
        if (nanoId.err) {
            console.error(nanoId.err);
            res.status(500);
            res.send(nanoId.err)
        } else {
            res.redirect(nanoId.nanoId.link);
        }
    } else {
        res.send(nanoId.err)
        //res.sendfile('./html/index.html')
    }
})

app.post('/nanoid/createNanoId', async (req, res) => {
    var answ = await shortener.CreateNewNanoId(req.body);
    if (answ.err) res.send(answ)
    else res.send(`Your Link is Done, ${ApiLink}/${answ.id}. Send a POST to  ${ApiLink}/checkStats with creator and the using the Body, to check your Clicks`)
})

app.post('/nanoid/checkStats', async (req, res) => {
    var answ = await shortener.checkStats(req.body);
    if (!answ.err) res.send(`You have ${answ.nanoId.clicks} clicks on  ${ApiLink}/${answ.id}.`)
    else res.send(answ.err)
})
```
