const { prepareSongs } = require("./utility");

module.exports = function(app, neoDriver, redisClient){
    app.get("/songsOnAlbums", async (req, res) => {
        const session = neoDriver.session()
        session.run("match (u:User)-[:Published]->(a:Album)-[:Includes]->(s:Song) OPTIONAL MATCH (s)<-[r:Rated]-(u:User) " 
        + " return s as song, u.stageName as artist, u.username as username, avg(r.rating) as avgRating order by s.timestamp limit 5")
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

    app.get("/singles", async (req, res) => {
        const session = neoDriver.session()
        session.run("match (u:User)-[:Published]->(s:Song) OPTIONAL MATCH (s)<-[r:Rated]-(u:User) " 
        + " return s as song, u.stageName as artist, u.username as username, avg(r.rating) as avgRating order by s.timestamp limit 5")
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
}