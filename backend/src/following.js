const { prepareSongs, prepareAlbums } = require("./utility");

module.exports = function(app, neoDriver, redisClient){

    app.get("/following/songsOnAlbums", async (req, res) => {
        const session = neoDriver.session()
        let userId = req.user_id
        session.run("match (u1:User)-[:Follows]->(u2:User)-[:Published]->(s:Song) OPTIONAL MATCH (s)<-[r:Rated]-(u:User) "
        + " where id(u1) = " + userId 
        + " return s as song, u2.stageName as artist, u2.username as username, avg(r.rating) as avgRating order by s.timestamp limit 5")
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

    app.get("/following/singles", async (req, res) => {
        const session = neoDriver.session()
        let userId = req.user_id
        session.run("match (u1:User)-[:Follows]->(u2:User)-[:Published]->(a:Album)-[:Includes]->(s:Song) OPTIONAL MATCH (s)<-[r:Rated]-(u:User) "
        + " where id(u1) = " + userId 
        + " return s as song, u2.stageName as artist, u2.username as username, avg(r.rating) as avgRating order by s.timestamp limit 5")
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

    app.get("/following/albums", async (req, res) => {
        const session = neoDriver.session()
        let userId = req.user_id
        session.run("match (u1:User)-[:Follows]->(u2:User)-[:Published]->(a:Album)-[:Includes]->(s:Song)"
        + " where id(u1) = " + userId 
        + " return a AS album, count(s) AS songCount, u2.stageName AS artist order by a.timestamp limit 5")
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
}