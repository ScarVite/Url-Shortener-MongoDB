const express = require('express');
var helmet = require('helmet')
const bodyParser = require('body-parser');
const { nanoid } = require('nanoid')

const MongoClient = require('mongodb').MongoClient;

let url = "mongodb://localhost:27017/";
let db_name = "Aniflix";
let db_collection = "nanoId";

const app = express();


var listener = app.listen(180, function () {
    console.log(`Enter The API listening on port ${listener.address().port}`)
});

app.use(helmet())
app.use(bodyParser.json());

app.get('/re/:nanoId', async (req, res) => {
    var nanoId = await isExistentNanoID(req.params.nanoId);
    if (!nanoId.err && nanoId.exists) {
        if (nanoId.err) {
            console.error(nanoId.err);
            res.status(500);
            res.send(nanoId.err.string)
        } else {
            res.redirect(nanoId.nanoId.link);
        }
    } else {
        res.send(nanoId.err.string)
        //res.sendfile('./html/index.html')
    }
})

app.get('/', (req, res) => {
    res.sendfile('./html/index.html')
})

app.get('/admin', (req, res) => {
    res.sendfile('./html/admin.html')
})

app.post('/createNanoId', async (req, res) => {
    var answ = await CreateNewNanoId(req.body);
    res.send(`Your Link is Done, http://scarvite.de:180/re/${answ.id}. Send a POST to scarvite.de:180/checkStats with creator and the id, to check your Clicks`)
})

app.post('/checkStats', async (req, res) => {
    var answ = await checkStats(req.body);
    if(!answ.err){
    res.send(`You have ${answ.nanoId.clicks} clicks on http://scarvite.de:180/re/${answ.id}.`)
    }
    res.send(answ.err)
})

function isExistentNanoID(nanoId) {
    return new Promise(resolve => {
        MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {
            if (err) {
                resolve({
                    err: {
                        code: 4,
                        string: err
                    }
                })
                console.log(err)
            }
            var dbo = db.db(db_name)
            dbo.collection(db_collection).find({ id: nanoId }).toArray(function (err, result) {
                if (err) {
                    resolve({
                        err: {
                            code: 4,
                            string: err
                        }
                    })
                    console.log(err)
                }
                if (result.length == 1) {
                    resolve({
                        exists: true,
                        nanoId: result[0].nanoId
                    });
                    var newvalues = { $set: { nanoId: { clicks: (result[0].nanoId.clicks+1), creator: result[0].nanoId.creator, created_at: result[0].nanoId.created_at, link: result[0].nanoId.link } } }
                    dbo.collection(db_collection).updateOne(result[0], newvalues, function (err, res) {
                        if (err) {
                            resolve({
                                err: {
                                    code: 4,
                                    string: err
                                }
                            })
                            console.log(err)
                        }
                        console.log(`Added a View for ${result[0].id}`);
                        db.close();
                    })
                } else if (result.length > 1) {
                    resolve({
                        exists: true,
                        err: {
                            code: 2,
                            string: "Found too Many Entrys. Message an Administrator"
                        }
                    });
                    db.close();
                } else {
                    resolve({
                        exists: false,
                        err: {
                            code: 1,
                            string: "NanoId does not Exist"
                        }
                    });
                    db.close();
                }
            });
        });
    });
}

function CreateNewNanoId(params, number) {
    return new Promise(resolve => {
        if (number > 10) {
            resolve({
                err: {
                    code: 5,
                    string: "Something Went Wrong While Creating a nanoId. Check Your Console"
                }
            })
            console.log("More than 10 tries while creating a nanoid");
            console.log("Are we at our Maximum ?")
        }
        if (params.link !== undefined && params.creator !== undefined) {
            MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {
                if (err) {
                    resolve({
                        err: {
                            code: 4,
                            string: err
                        }
                    })
                    console.log(err)
                }
                var dbo = db.db(db_name)
                var nanid = nanoid();
                dbo.collection(db_collection).find({ id: nanid }).toArray(function (err, result) {
                    if (err) {
                        resolve({
                            err: {
                                code: 4,
                                string: err
                            }
                        })
                        console.log(err)
                        db.close();
                    }
                    if (result.length > 0) {
                        db.close();
                        CreateNewNanoId(params, number++);
                    } else {
                        var myobj = {
                            id: nanid,
                            nanoId: {
                                clicks: 0,
                                link: params.link,
                                creator: params.creator,
                                created_at: new Date()
                            }
                        }
                        dbo.collection(db_collection).insertOne(myobj, function (err, res) {
                            if (err) {
                                resolve({
                                    err: {
                                        code: 4,
                                        string: err
                                    }
                                })
                                console.log(err)
                            }
                            console.log(`added nanoId for link ${params.link} `)
                            var myobj = {
                                added: true,
                                id: nanid,
                                nanoId: {
                                    clicks: 0,
                                    link: params.link,
                                    creator: params.creator,
                                    created_at: new Date()
                                }
                            }
                            resolve(myobj);
                            db.close();
                        });
                    }
                });
            })
        } else {
            resolve({
                err: {
                    code: 3,
                    string: "Missing/Wrong Arguments"
                }
            })
            db.close();
        }
    })
}

function checkStats(params) {
    return new Promise(resolve => {
        if (params.id !== undefined && params.creator !== undefined) {
            MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {
                if (err) console.log(err)
                var dbo = db.db(db_name)
                dbo.collection(db_collection).find({ id: params.id }).toArray(function (err, result) {
                    if (err) {
                        resolve({
                            err: {
                                code: 4,
                                string: err
                            }
                        })
                        console.log(err)
                    }
                    if (result.length == 1) {
                        if (params.creator == result[0].nanoId.creator) {
                            resolve(result[0])
                        } else {
                            resolve({
                                err: {
                                    code: 6,
                                    string: "You Provided The Wrong Creator for this nanoId. Please Check it Again"
                                }
                            });
                        }
                    } else if(result.length > 0) {
                        resolve({
                            err: {
                                code: 2,
                                string: "Found too Many Entrys. Message an Administrator"
                            }
                        });
                    } else{
                        resolve({
                            err: {
                                code: 1,
                                string: "NanoId does not Exist"
                            }
                        });
                    }
                });
            });
        } else {
            resolve({
                err: {
                    code: 3,
                    string: "Missing/Wrong Arguments"
                }
            })
        }
    })
}
