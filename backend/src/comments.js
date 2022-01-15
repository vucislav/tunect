module.exports = function(app, neoDriver, redisClient){
    app.post("/comment", async (req, res) => {
        let text =  req.body.text
        let username = req.body.username
        let songId = req.body.songId
        const currentDate = new Date();
        let comment = {username: username, text: text, timestamp: currentDate.getTime()}
        await redisClient.sendCommand(['ZADD', "comments:" + songId, currentDate.getTime().toString(), 
                                        JSON.stringify(comment)]);
        res.status(200).json({status: 200, data: comment})
    })

    app.get("/comments/:songId/:count", async (req, res) => {
        let count = req.params.count
        let songId = req.params.songId
        let redisRes = await redisClient.sendCommand(['ZREVRANGE', "comments:" + songId, "0", (count - 1).toString(), "withscores"]);
        let comments = []
        redisRes.forEach((el, i) => {
            let parsedComment = JSON.parse(el)
            parsedComment.timestamp = redisRes[i + 1]
            if(i % 2 === 0) comments.push(parsedComment)
        });
        console.log(comments)
        res.status(200).json({status: 200, data: comments})
    })
}