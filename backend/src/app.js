require('dotenv').config()
express = require("express")
cors = require('cors')
redis = require('redis')
neo4j = require("neo4j-driver")
cors = require('cors')
var fs = require('fs');
const fileUpload = require('express-fileupload')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
var redisClient = {}
const env = process.env
const comments = require('./comments');
const songs = require('./songs');
const following = require('./following');
const albums = require('./albums');
const { prepareSongs, prepareAlbums, preparePlaylists } = require('./utility')

app = express()
app.use(cors())
app.use(express.json())
app.use(fileUpload())

const WebSocket = require('ws')
const wss = new WebSocket.Server({port: 3080})
webSockets = []

host = "neo4j://" + env['NEO4J_HOSTNAME'] + ":" + env['NEO4J_PORT']
const driver = neo4j.driver(host, neo4j.auth.basic(env['NEO4J_USER'], env['NEO4J_PASS']))

wss.on('connection', function connection(ws, req) {
    let url = req.url
    let token = url.substring(req.url.indexOf('=') + 1, url.length)
    var decoded = jwt.verify(token, env.JWT_SECRET)
    let user_id = decoded.user_id
    let maks = -1
    webSockets.forEach((e) => {
        if(e.userId === user_id && e.n > maks) maks = e.n
    })
    maks++
    webSockets.push({ ws: ws, n: maks, userId: user_id})
    ws.on('close', function(){
        console.log("closing ", connection);
        let removeAt = 0
        webSockets.forEach((e, i) => {
            if(e.userId === user_id && e.n === maks){ 
                removeAt = i
                return
            }
        })
        webSockets.splice(removeAt, 1);
    });
});

async function setupRedis() {
    url = 'redis://:' + env['REDIS_PASS'] + '@' + env['REDIS_HOSTNAME'] + ':' + env['REDIS_PORT'];
    redisClient = redis.createClient({
        url: url
    });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('connect', function() {
        console.log('connected to redis!!');
    });
    redisClient.connect();
}
setupRedis()

const subscriber = redisClient.duplicate();

async function setupSubscriber(){
    await subscriber.connect();
    await subscriber.subscribe('notifications', (message) => {
        let { publisherId } = parseMessage(message)
        const session = driver.session()
        session.run("match (u1:User)-[:Follows]->(u2:User) where id(u2) = " + publisherId + " return id(u1) as subscriberId" )
        .then(function(result){
            if(result.records.length !== 0){
                let subscriberIndex = result.records[0]._fieldLookup["subscriberId"]
                result.records.forEach((e) => {
                    let id =  e._fields[subscriberIndex].low
                    webSockets.forEach((e) => {
                        if(e.userId === id) e.ws.send(message)
                    })
                })
            }
            session.close()
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
    });
}

setupSubscriber()

function parseMessage(message){
    let publisherId = "", type = "", id = "", text = ""
    let array = message.split(":")
    publisherId = array[0]
    type = array[1]
    id = array[2]
    array.forEach((e, i) => {
        if(i > 2) text += e
    })
    return {publisherId, type, id, text}
}

app.post("/register", (req, res) => {
    const session = driver.session()
    session.run("match (u:User) where u.username = '" + req.body.username + "' or u.email = '" + req.body.email + "' return id(u)")
        .then(function(result){
            if(result.records.length != 0){
                res.status(400).json({status: 400, message: "User with this email or with this username already exists."})
                session.close()
            } else {
                password = bcrypt.hashSync(req.body.password, 10)
                data = [{key: "username", value: req.body.username, type: "string"},
                        {key: "firstName", value: req.body.firstName, type: "string"},
                        {key: "lastName", value: req.body.lastName, type: "string"},
                        {key: "stageName", value: req.body.stageName, type: "string"},
                        {key: "email", value: req.body.email, type: "string"},
                        {key: "password", value: password, type: "string"}]
                session.run(buildCreateQuery(["User"], data))
                    .then(function(result){
                        res.status(200).json({status: 200, message: "OK"})
                        session.close()
                    }).catch((error) => {
                        console.error(error);
                        res.status(500).json({status: 500, message: "Internal server error"})
                        session.close()
                    });
            }
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.post("/login", (req, res) => {
    const session = driver.session()
    session.run("match (u:User) where u.email = '" + req.body.email + "' return u, id(u)")
            .then(function(result){
                if(result.records.length == 0){
                    res.status(400).json({status: 400, message: "Incorrect email."})
                } else {
                    user = result.records[0]._fields[0].properties
                    user_id = result.records[0]._fields[1].low
                    if (bcrypt.compareSync(req.body.password, user.password)) {
                        token = jwt.sign({user_id: user_id}, env.JWT_SECRET)
                        res.status(200).json({status: 200, data: { token: token, username: user.username,
                                                userId: user_id}})
                    } else {
                        res.status(401).json({message: "Wrong password."})
                    }
                }
                session.close()
            }).catch((error) => {
                console.error(error);
                res.status(500).json({status: 500, message: "Internal server error"})
                session.close()
            });
})

app.use((req, res, next) => {
    token = req.header('Authorization')
    try {
        var decoded = jwt.verify(token, env.JWT_SECRET)
        req.user_id = decoded.user_id
        next()
    } catch(e) {
        res.status(401).json({status: 401})
    }
})

comments(app, driver, redisClient)
songs(app, driver, redisClient)
following(app, driver, redisClient)
albums(app, driver, redisClient)

function getCurrTimestamp(){
    const currentDate = new Date();
    return currentDate.getTime().toString()
}

app.post("/uploadSingle", (req, res) => {
    const session = driver.session()
    let userId = req.user_id
    let singleFile = req.files.single
    let fileName = singleFile.name
    let title = fileName.substring(0, fileName.lastIndexOf("."));
    let extension = fileName.substring(fileName.lastIndexOf("."), fileName.length);
    let timestamp = getCurrTimestamp()
    session.run("MATCH (u:User) WHERE id(u) = " + userId + " create (u)-[:Published]->(song:Song {title: \"" 
                + title + "\", duration: " + req.body.duration + 
                ", extension: '" + extension + "', timestamp: " + timestamp + "}) RETURN id(song), u.stageName as stageName")
            .then(async function(result){
                res.status(200).json({status: 200, message: "OK"})
                let songId = result.records[0]._fields[0].low
                let path = `${__dirname}/../singles/${songId + extension}`
                let stageName = result.records[0]._fields[1]
                singleFile.mv(path)
                await redisClient.publish('notifications', userId + ":single:" + songId + ":" + (stageName + " has published a new single: " + title));
                session.close()
            }).catch((error) => {
                console.error(error);
                res.status(500).json({status: 500, message: "Internal server error"})
                session.close()
            });
})

app.post("/uploadAlbum", (req, res) => {
    const session = driver.session()
    let albumName = req.body.albumName
    let songsInfo = JSON.parse(req.body.songsInfo)
    let songCount = req.body.songCount
    let songFiles = req.files
    let userId = req.user_id
    let titles = []
    let extensions = []
    let timestamp = getCurrTimestamp()
    for(let i = 0; i < songCount; i++){
        let fullTitle = songFiles["song" + i].name
        titles.push(fullTitle.substring(0, fullTitle.lastIndexOf(".")))
        extensions.push(fullTitle.substring(fullTitle.lastIndexOf("."), fullTitle.length))
    } 
    session.run("match (u:User) where id(u) = " + userId + " create (u)-[:Published]->(album:Album {title: \"" +
                albumName + "\", timestamp: " + timestamp + " }) return id(album), u.stageName as stageName")
    .then(function(result){
        let albumId = result.records[0]._fields[0].low
        let stageName = result.records[0]._fields[1]
        let returnPart = " return "
        let query = "match (album:Album) where id(album) = " + albumId + " create "
        songsInfo.forEach((e, i) => {
            let title = titles[i]
            query += "(album)-[:Includes]->" +
                "(s" + i + ":Song {title: '" + title + "', duration: " + e.duration + ", extension: '" + extensions[i] 
                + "', timestamp: " + timestamp + "})"
            if(i !== songsInfo.length - 1)
                query += ", "
            returnPart += "id(s" + i + ")"
            if(i !== songsInfo.length - 1)
                returnPart += ", "
        })
        query += returnPart
        session.run(query)
            .then(async function(result){
                let songs = result.records[0]._fields
                fs.mkdirSync("./albums/" + albumId)
                songs.forEach((e, i) => {
                    let path = `${__dirname}/../albums/${albumId + "/"}${e.low + extensions[i]}`
                    songFiles["song" + i].mv(path)
                })
                await redisClient.publish('notifications', userId + ":album:" + albumId + ":" + (stageName + " has published a new album: " + albumName));
                res.status(200).json({status: 200, message: "OK"})
                session.close()
            }).catch((error) => {
                console.error(error);
                res.status(500).json({status: 500, message: "Internal server error"})
                session.close()
            });
    }).catch((error) => {
        console.error(error);
        res.status(500).json({status: 500, message: "Internal server error"})
        session.close()
    });
})

app.get("/user/:username", (req, res) => {
    const session = driver.session()
    let username = req.params.username
    session.run("MATCH (u:User) where u.username = '" + username 
            + "' RETURN u AS user, size((u)-[:Follows]->()) as followingCount, size((u)<-[:Follows]-()) as followersCount")
        .then(function(result){
            if(result.records.length == 0){
                res.status(400).json({status: 400, message: "This user does not exist."})
            } else {
                let user = result.records[0]
                let userIndex = user._fieldLookup["user"]
                let followingCountIndex = user._fieldLookup["followingCount"]
                let followersCountIndex = user._fieldLookup["followersCount"]
                let data = {
                    ...user._fields[userIndex].properties,
                    id: user._fields[userIndex].identity.low,
                    labels: user._fields[userIndex].labels,
                    followersCount: user._fields[followersCountIndex].low,
                    followingCount: user._fields[followingCountIndex].low
                }
                res.status(200).json({status: 200, message: "OK", data: data})
            }
            session.close()
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.get("/isFollowing/:followerId/:followingId", (req, res) => {
    const session = driver.session()
    let followerId = req.params.followerId
    let followingId = req.params.followingId
    session.run("MATCH (u1:User)-[f:Follows]->(u2:User) where id(u1) = " + followerId
            + " and id(u2) = " + followingId 
            + " RETURN f")
        .then(function(result){
            if(result.records.length == 0){
                res.status(200).json({status: 200, message: "OK", data: false})
            } else {
                res.status(200).json({status: 200, message: "OK", data: true})
            }
            session.close()
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.post("/follow", (req, res) => {
    const session = driver.session()
    let followerId =  req.user_id
    let followingId = req.body.followingId
    session.run("match (u1:User)-[:Follows]->(u2:User) where id(u1) = " + followerId + " and id(u2) = " + followingId + 
                " return u1, u2")
            .then(function(result){
                if(result.records.length != 0){
                    res.status(400).json({status: 400, message: "You already follow this user."})
                    session.close()
                } else {
                    session.run("match (u1:User), (u2:User) where id(u1) = " + followerId + " and id(u2) = " + followingId + 
                                " create (u1)-[f:Follows]->(u2) return u1")
                    .then(function(result){
                        if(result.records.length == 0){
                            res.status(400).json({status: 400, message: "Bad request. One or both ids do not exist."})
                        } else {
                            res.status(200).json({status: 200, message: "OK"})
                        }
                        session.close()
                    }).catch((error) => {
                        console.error(error);
                        res.status(500).json({status: 500, message: "Internal server error"})
                        session.close()
                    });
                }
            }).catch((error) => {
                console.error(error);
                res.status(500).json({status: 500, message: "Internal server error"})
                session.close()
            });
})

app.delete("/unfollow/:followingId", (req, res) => {
    const session = driver.session()
    let followerId =  req.user_id
    let followingId = req.params.followingId
    session.run("match (u1:User)-[f:Follows]->(u2:User) where id(u1) = " + followerId + " and id(u2) = " + followingId + 
                " delete f")
            .then(function(result){
                res.status(200).json({status: 200, message: "OK"})
            }).catch((error) => {
                console.error(error);
                res.status(500).json({status: 500, message: "Internal server error"})
                session.close()
            });
})

app.get("/user/:username/albums", (req, res) => {
    const session = driver.session()
    let username = req.params.username
    session.run("match (u:User)-[:Published]->(a:Album)-[:Includes]->(s:Song) where u.username = \'" + username + 
                "\' return a AS album, count(s) AS songCount, u.stageName AS artist")
    .then(async function(result){
        let albums = await prepareAlbums(result.records)
        res.status(200).json({status: 200, message: "OK", data: albums})
        session.close()
    }).catch((error) => {
        console.error(error);
        res.status(500).json({status: 500, message: "Internal server error"})
        session.close()
    });
})

app.get("/user/:username/singles", async (req, res) => {
    const session = driver.session()
    let username = req.params.username
    session.run("match (u:User)-[:Published]->(s:Song) where u.username = \'" 
                + username + "\' optional match (s)<-[r:Rated]-(:User) return u.stageName AS artist, s AS song, avg(r.rating) as avgRating")
    .then(async function(result){
        let songs = await prepareSongs(result.records)
        res.status(200).json({status: 200, message: "OK", data: songs})
        session.close()
    }).catch((error) => {
        console.error(error);
        res.status(500).json({status: 500, message: "Internal server error"})
        session.close()
    });
})

app.get("/user/:username/playlists", (req, res) => {
    const session = driver.session()
    let username = req.params.username
    session.run("match (u:User)-[:Created]->(p:Playlist) where u.username = \'" + username + 
                "\' optional match (p)-[i:Includes]->(:Song) return ID(u) as creatorId, p AS playlist, count(i) as songCount ORDER BY ID(p) DESC")
    .then(async function(result){
        let playlists = await preparePlaylists(result.records)
        res.status(200).json({status: 200, message: "OK", data: playlists})
        session.close()
    }).catch((error) => {
        console.error(error);
        res.status(500).json({status: 500, message: "Internal server error"})
        session.close()
    });
})

app.post("/createPlaylist", (req, res) => {
    const session = driver.session()
    session.run("match (u:User) where u.username = '" + req.body.username + 
                "' create (u)-[:Created]->(p:Playlist {name: \"" + req.body.name + "\"}) return p")
        .then(function(result){
            let playlist = result.records[0]
            let playlistIndex = playlist._fieldLookup['p']
            let data = {
                ...playlist._fields[playlistIndex].properties,
                id: playlist._fields[playlistIndex].identity.low,
                labels: playlist._fields[playlistIndex].labels
            }
            res.status(200).json({status: 200, message: "OK", data: data})
            session.close()
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.post("/addToPlaylists", (req, res) => {
    let songId = req.body.songId
    let playlistIds = req.body.playlistIds
    let userId = req.user_id
    const session = driver.session()
    session.run("MATCH (u:User)-[r:Created]->(p:Playlist)-[i:Includes]->(s:Song) where id(u) = " + userId + " and id(s) = " + songId
                + " delete i")
        .then(function(result){
            let idsAsString = "[" + playlistIds.toString() + "]" 
            session.run("unwind " + idsAsString + " as el match (s:Song) match (p:Playlist) where id(s) = " + songId 
            + " and id(p) = el create (s)<-[:Includes]-(p)") //el je zapravo po jedan id iz ove liste ali je id kljucna rec pa zato koristim el
            .then(function(result){
                res.status(200).json({status: 200, message: "OK"})
                session.close()
            }).catch((error) => {
                console.error(error);
                res.status(500).json({status: 500, message: "Internal server error"})
                session.close()
            });
            
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.get("/playlist/:playlistId", (req, res) => {
    const session = driver.session()
    let playlistId = req.params.playlistId
    session.run("match (u:User)-[:Created]->(p:Playlist) where ID(p) = " + playlistId + 
                " optional match (p)-[i:Includes]->(:Song) return ID(u) as creatorId, count(i) as songCount, p as playlist")
    .then(async function(result){
        if(result.records.length == 0){
            res.status(400).json({status: 400, message: "This playlist does not exist."})
            session.close()
        } else {
            let playlist = await preparePlaylists(result.records)
            session.run("match (p:Playlist)-[:Includes]->(s:Song) where ID(p) = " + playlistId
                + " optional match (s)<-[:Published]-(u1:User)"
                + " optional match (s)<-[:Includes]-(a:Album)<-[:Published]-(u2:User)"
                + " optional match (s)<-[r:Rated]-(:User)" 
                + " return u1.username as username1, u2.username as username2, u1.stageName AS artist1, u2.stageName AS artist2, s AS song, avg(r.rating) as avgRating")
            .then(async function(result){
                let songs = await prepareSongs(result.records)
                res.status(200).json({status: 200, message: "OK", data: {playlist: playlist[0], songs: songs}})
                session.close()
            }).catch((error) => {
                console.error(error);
                res.status(500).json({status: 500, message: "Internal server error"})
                session.close()
            });
        }
        
    }).catch((error) => {
        console.error(error);
        res.status(500).json({status: 500, message: "Internal server error"})
        session.close()
    });
})

app.delete("/playlist/:playlistId/:songId", (req, res) => {
    const session = driver.session()
    let playlistId = req.params.playlistId
    let songId = req.params.songId
    session.run("match (p:Playlist)-[i:Includes]->(s:Song) where ID(p) = " + playlistId + " and ID(s) = " + songId +
                " delete i")
        .then(function(result){
            res.status(200).json({status: 200, message: "OK"})
            session.close()
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.delete("/playlist/:playlistId", (req, res) => {
    const session = driver.session()
    let playlistId = req.params.playlistId
    session.run("match (p:Playlist) where ID(p) = " + playlistId +
                " detach delete p")
        .then(function(result){
            res.status(200).json({status: 200, message: "OK"})
            session.close()
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.post("/rateSong", (req, res) => {
    const session = driver.session()
    let rating = req.body.rating
    if(rating < 1 && rating > 5) {
        res.status(400).json({status: 400, message: "Rating should be between 1 and 5."})
        return;
    }
    let songId = req.body.songId
    let userId = req.user_id

    session.run("MATCH (u:User)-[r:Rated]->(s:Song) where id(u) = " + userId + " and id(s) = " + songId +
                 " RETURN r.rating as newRating")
    .then(async function(result){
        let alreadyRated = false
        let oldRating = -1
        if(result.records.length > 0){
            alreadyRated = true
            oldRating = result.records[0]._fields[0].low
        }
        session.run("MATCH (u:User) MATCH (s:Song) where id(u) = " + userId + " and id(s) = " + songId + " MERGE (u)-[r:Rated]->(s)" 
                    + "ON CREATE SET r.rating = " + rating + " ON MATCH SET r.rating = " + rating
                    + " RETURN r")
        .then(async function(result){
            let my = getCurrDate("my")
            let y = getCurrDate("y")
            let monthRes = await redisClient.sendCommand(['HMGET',"rating:" + songId.toString() + ":" + my, "n", "sum"]);
            let yearRes = await redisClient.sendCommand(['HMGET',"rating:" + songId.toString() + ":" + y, "n", "sum"]);
            let n = 0, sum = 0
            if(monthRes[0] !== null) { 
                n = Number(monthRes[0])
                if(alreadyRated) n--
            }
            if(monthRes[1] !== null) {
                sum = Number(monthRes[1])
                if(alreadyRated) sum -= oldRating
            }
            sum += Number(rating)
            n++
            let monthAvg = sum / n
            
            await redisClient.sendCommand(['HMSET',"rating:" + songId.toString() + ":" + my, "n", n.toString()]);
            await redisClient.sendCommand(['HMSET',"rating:" + songId.toString() + ":" + my, "sum", sum.toString()]);

            n = 0, sum = 0
            if(yearRes[0] !== null) { 
                n = Number(yearRes[0])
                if(alreadyRated) n--
            }
            if(yearRes[1] !== null) {
                sum = Number(yearRes[1])
                if(alreadyRated) sum -= oldRating
            }
            sum += Number(rating)
            n++
            let yearAvg = sum / n

            await redisClient.sendCommand(['HMSET',"rating:" + songId.toString() + ":" + y, "n", n.toString()]);
            await redisClient.sendCommand(['HMSET',"rating:" + songId.toString() + ":" + y, "sum", sum.toString()]);

            await redisClient.sendCommand(['ZADD',"rating:" + my, monthAvg.toString(), songId.toString()]);
            await redisClient.sendCommand(['ZADD',"rating:" + y, yearAvg.toString(), songId.toString()]);
            res.status(200).json({status: 200, message: "OK"})
            session.close()
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });

    }).catch((error) => {
        console.error(error);
        res.status(500).json({status: 500, message: "Internal server error"})
        session.close()
    });
})

app.get("/rating/:userId/:songId", (req, res) => {
    const session = driver.session()
    let userId = req.params.userId
    let songId = req.params.songId
    session.run("MATCH (u:User)-[r:Rated]->(s:Song) where id(u) = " + userId + " and id(s) = " + songId
                + " RETURN r")
        .then(function(result){
            let rating = -1
            if(result.records.length > 0) rating = result.records[0]._fields[0].properties.rating.low
            res.status(200).json({status: 200, message: "OK", data: rating})
            session.close()
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.get("/containSong/:userId/:songId", (req, res) => {
    const session = driver.session()
    let userId = req.params.userId
    let songId = req.params.songId
    session.run("MATCH (u:User)-[r:Created]->(p:Playlist)-[i:Includes]->(s:Song) where id(u) = " + userId + " and id(s) = " + songId
                + " RETURN id(p) AS playlistId")
        .then(function(result){
            let ids = []
            result.records.forEach((e) => {
                ids.push(e._fields[0].low)
            })
            res.status(200).json({status: 200, message: "OK", data: ids})
            session.close()
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.post("/uploadPhoto", (req, res) => {
    let photoFile = req.files.photoFile
    let type = req.body.type
    let userId = req.user_id
    let photoName = photoFile.name
    let extension = photoName.substring(photoName.lastIndexOf("."), photoName.length);
    let path = ""
    let smallerPath = ""
    if(type === "cover") { 
        path = `${__dirname}/../cover_photos/${userId + extension}`
        smallerPath = "./cover_photos/"
    }
    else if(type === "profile"){ 
        path = `${__dirname}/../profile_photos/${userId + extension}`
        smallerPath = "./profile_photos/"
    }
    userId = 53
    let fileName = getFileNameByUserId(smallerPath, userId)
    if(fileName !== ""){
        fs.unlink(smallerPath + fileName, (err) => {
            if (err) console.error(err)
        })
    }
    photoFile.mv(path)
    res.status(200).json({status: 200, message: "OK"})
})

app.get("/photo/:type/:userId", (req, res) => {
    let userId = req.params.userId
    let type = req.params.type
    let path = ""
    if(type === "cover") { 
        path = "./cover_photos/"
    }
    else if(type === "profile"){ 
        path = "./profile_photos/"
    }
    let fileName = getFileNameByUserId(path, userId)
    if(fileName === ""){
        fs.readFile(path + "default_" + type + (type === "profile" ? ".jpg" : ".png" ), (err, data) =>{
            if(err){
                res.status(500).send("500 error")
            } else {
                let extension = fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length);
                res.writeHead(200,{'Content-type':'image/' + extension});
                res.end(data);
            }
        });
    } else {
        fs.readFile(path + fileName, (err, data) =>{
            if(err){
                res.status(500).send("500 error")
            } else {
                let extension = fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length);
                res.writeHead(200,{'Content-type':'image/' + extension});
                res.end(data);
            }
        });
    }
})

app.get("/album/:albumId", (req, res) => {
    let albumId = req.params.albumId
    const session = driver.session()
    session.run("match (a:Album)<-[:Published]-(u:User) where ID(a) = " 
                + albumId + " return a as album, u.stageName as stageName, id(u) as userId, u.username as username")
        .then(async function(result){
            if(result.records.length == 0){
                res.status(400).json({status: 400, message: "This album does not exist."})
                session.close()
            } else {
                let albumInfo = result.records[0]
                let albumIndex = albumInfo._fieldLookup["album"]
                let stageNameIndex = albumInfo._fieldLookup["stageName"]
                let userIdIndex = albumInfo._fieldLookup["userId"]
                let usernameIndex = albumInfo._fieldLookup["username"]
                let album = {
                    ...albumInfo._fields[albumIndex].properties,
                    id: albumInfo._fields[albumIndex].identity.low,
                    labels: albumInfo._fields[albumIndex].labels,
                    stageName: albumInfo._fields[stageNameIndex],
                    userId: albumInfo._fields[userIdIndex].low,
                    username: albumInfo._fields[usernameIndex],
                }
                session.run("match (u:User)-[:Published]-(a:Album)-[:Includes]->(s:Song) where ID(a) = " + albumId
                            + " optional match (s)<-[r:Rated]-(:User)"
                            + " return u.username as username, u.stageName AS artist, s AS song, avg(r.rating) as avgRating")
                .then(async function(result){
                    let songs = await prepareSongs(result.records)
                    res.status(200).json({status: 200, message: "OK", data: {album: album, songs: songs}})
                    session.close()
                }).catch((error) => {
                    console.error(error);
                    res.status(500).json({status: 500, message: "Internal server error"})
                    session.close()
                });
            }
            
        }).catch((error) => {
            console.error(error);
            res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
})

app.get("/song/:songId", async (req, res) => {
    const session = driver.session()
    let songId = req.params.songId
    session.run("match (s:Song) where ID(s) = " + songId
            + " optional match (s)<-[:Published]-(u1:User)"
            + " optional match (s)<-[:Includes]-(a:Album)<-[:Published]-(u2:User)"
            + " optional match (s)<-[r:Rated]-(:User)"
            + " return s as song, a, u1.username as username1, u2.username as username2, u1.stageName as artist1, u2.stageName as artist2, avg(r.rating) as avgRating, id(a) as albumId")
    .then(async function(result){
        if(result.records.length === 0){
            res.status(404).json({status: 404, message: "Song not found."})
        } else {
            let song = await prepareSongs(result.records, true)
            res.status(200).json({status: 200, message: "OK", data: song[0]})
        }
        session.close()
    }).catch((error) => {
        console.error(error);
        res.status(500).json({status: 500, message: "Internal server error"})
        session.close()
    });
})

app.get("/recommended", async (req, res) => {
    const session = driver.session()
    let userId = req.user_id
    session.run("match (u1:User)-[r1:Rated]->(s1:Song)<-[r2:Rated]-(u2:User)-[r3:Rated]->(s2:Song)<-[:Published]-(u:User)" 
                + " where r1.rating > 3 and r2.rating > 3 and r3.rating > 3 and id(u1) = " + userId + " and NOT (u1)-[:Rated]->(s2)"
                + " optional match (s2)<-[r:Rated]-(:User)"
                + " return distinct s2 as song, u.username as username, u.stageName as artist, avg(r.rating) as avgRating")
    .then(async function(result){
        let songs = await prepareSongs(result.records)
        session.run("match (u1:User)-[r1:Rated]->(s1:Song)<-[r2:Rated]-(u2:User)-[r3:Rated]->(s2:Song)<-[:Includes]-(a:Album)<-[:Published]-(u:User)"
                + " where r1.rating > 3 and r2.rating > 3 and r3.rating > 3 and id(u1) = " + userId + " and NOT (u1)-[:Rated]->(s2)" 
                + " optional match (s2)<-[r:Rated]-(:User)"
                + " return distinct s2 as song, u.username as username, u.stageName as artist, id(a) as albumId, avg(r.rating) as avgRating")
            .then(async function(result){
                let restOfTheSongs = await prepareSongs(result.records)
                songs = songs.concat(restOfTheSongs)
                let albumOccurrence = {}
                let albumIds = []
                restOfTheSongs.forEach(e => {
                    if(albumOccurrence[e.albumId] === undefined)
                        albumOccurrence[e.albumId] = 1
                    else if (albumOccurrence[e.albumId] < 2){
                        albumOccurrence[e.albumId]++
                        if(albumOccurrence[e.albumId] == 2)
                            albumIds.push(e.albumId)
                    }
                })
                session.run("unwind [" + albumIds.toString() + "] as el match (u:User)-[:Published]->(a:Album)-[i:Includes]->(:Song)"
                        + " where id(a) = el"
                        + " return a as album, u.stageName as artist, count(i) as songCount")
                    .then(async function(result){
                        let albums = await prepareAlbums(result.records)
                        res.status(200).json({status: 200, message: "OK", data: {songs: songs, albums: albums}})
                        session.close()
                    }).catch((error) => {
                        console.error(error);
                        res.status(500).json({status: 500, message: "Internal server error"})
                        session.close()
                    });
            }).catch((error) => {
                console.error(error);
                res.status(500).json({status: 500, message: "Internal server error"})
                session.close()
            });
    }).catch((error) => {
        console.error(error);
        res.status(500).json({status: 500, message: "Internal server error"})
        session.close()
    });
})

app.post("/listen", (req, res) => {
    const session = driver.session()
    let songId = req.body.songId
    redisClient.sendCommand(['ZINCRBY',"listenings:" + getCurrDate("dmy"), "1", songId.toString()]);
    redisClient.sendCommand(['ZINCRBY', "listenings:" + getCurrDate("my"), "1", songId.toString() ]);
    redisClient.sendCommand(['ZINCRBY', "listenings:" + getCurrDate("y"), "1", songId.toString() ]);
    res.status(200).send({status: 200, message: "OK"})
})

app.get("/leaderboards/:date/:basedOn", async (req, res) => {
    const session = driver.session()
    let basedOn = req.params.basedOn
    let date = req.params.date
    let redisRes = await redisClient.sendCommand(['ZREVRANGE', basedOn + ":" + date, "0", "10", "withscores"]);
    let songIds = [], values = {}
    redisRes.forEach((e, i) => {
        if(i % 2 == 0) songIds.push(e)
        else values[songIds[songIds.length - 1]] = e
    })
    let idsAsString = "[" + songIds.toString() + "]"
    session.run("unwind " + idsAsString + " as songId match (s:Song) where id(s) = songId "
    + " optional match (s)<-[:Published]-(u1:User) "
    + " optional match (s)<-[:Includes]-(a:Album)<-[:Published]-(u2:User) "
    + " optional match (s)<-[r:Rated]-(:User) "
    + " return s as song, a, u1.username as username1, u2.username as username2, u1.stageName as artist1, u2.stageName as artist2, avg(r.rating) as avgRating, id(a) as albumId")
            .then(async function(result){
                let songs = await prepareSongs(result.records)
                if(basedOn === "listenings"){
                    songs.forEach((e) =>{
                        e.listenings = Number(values[e.id])
                    })
                }
                res.status(200).json({status: 200, message: "OK", data: songs})
                session.close()
            }).catch((error) => {
                console.error(error);
                res.status(500).json({status: 500, message: "Internal server error"})
                session.close()
            });
})

function getFileNameByUserId(path, userId){
    let fileName = ""
    fs.readdirSync(path).forEach(file => {
        if(file.substring(0, file.lastIndexOf(".")) == userId)
            fileName = file
    });
    return fileName
}

function buildCreateQuery(labels, data){
    var query = "create (n"
    labels.forEach((e) =>{
        query += ":" + e
    })
    query += " {"
    data.forEach((e, i) => {
        if(e.type === "string")
            query += e.key + ":'" + e.value + "'"
        else if (e.type === "number")
            query += e.key + ": " + e.value
        if(i != data.length - 1)
            query += ", "
    })
    query += "}) return id(n)"
    return query
}

function getCurrDate(format){
    let date_ob = new Date();

    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();

    if(format === "dmy") return date + "." + month + "." + year + "."
    else if(format === "my") return month + "." + year + "."
    else if(format === "y")  return year + "."
    return ""
}

app.listen(3030)