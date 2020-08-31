const axios = require('axios')
const { nanoid } = require('nanoid')

const MongoClient = require('mongodb').MongoClient;

let url = "mongodb://localhost:27017/";
let db_name = "ScarVite";
let db_collection = "shortener";

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
                    var newvalues = { $set: { nanoId: { clicks: (result[0].nanoId.clicks + 1), creator: result[0].nanoId.creator, created_at: result[0].nanoId.created_at, link: result[0].nanoId.link } } }
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
                    } else if (result.length > 0) {
                        resolve({
                            err: {
                                code: 2,
                                string: "Found too Many Entrys.Please Message an Administrator"
                            }
                        });
                    } else {
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

exports.isExistentNanoID = isExistentNanoID;
exports.CreateNewNanoId = CreateNewNanoId;
exports.checkStats = checkStats;