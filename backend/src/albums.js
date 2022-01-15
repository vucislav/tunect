const { prepareAlbums } = require("./utility");

module.exports = function(app, neoDriver, redisClient){
    app.get("/albums", async (req, res) => {
        const session = neoDriver.session()
        let username = req.params.username
        session.run("match (u:User)-[:Published]->(a:Album)-[:Includes]->(s:Song)"
                    + "return a AS album, count(s) AS songCount, u.stageName AS artist order by a.timestamp limit 5")
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