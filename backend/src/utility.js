function prepareSongs(records){
    return new Promise(async function(resolve) {
        let songs = []
        for(let i = 0; i < records.length; i++){
            let song = records[i]
            let songIndex = song._fieldLookup["song"]
            let artistIndex = song._fieldLookup["artist"]
            let usernameIndex = song._fieldLookup["username"]
            let avgRatingIndex = song._fieldLookup["avgRating"]
            let res = {
                ...song._fields[songIndex].properties,
                id: song._fields[songIndex].identity.low,
                labels: song._fields[songIndex].labels,
                artist: song._fields[artistIndex],
                username: song._fields[usernameIndex],
                avgRating: song._fields[avgRatingIndex] === null ? 0 : song._fields[avgRatingIndex]
            }
            songs.push(res)
        }
        resolve(songs)
    });
}

function averageRating(songId, neoDriver){
    return new Promise(function(resolve) {
        const session = neoDriver.session()
        session.run("match (s:Song)<-[r:Rated]-(u:User) where ID(s) = " + songId + 
                    " return avg(r.rating) as avgRating")
        .then(function(result){
            resolve(result.records[0]._fields[0])
            session.close()
        }).catch((error) => {
            console.error(error);//TODO: ove greske kad se dese treba nekako da se obrade
            //res.status(500).json({status: 500, message: "Internal server error"})
            session.close()
        });
    })
}

function prepareAlbums(records){
    return new Promise(async function(resolve) {
        let albums = []
        records.forEach((album) => {
            let songCountIndex = album._fieldLookup["songCount"]
            let artistIndex = album._fieldLookup["artist"]
            let albumIndex = album._fieldLookup["album"]
            albums.push({
                ...album._fields[albumIndex].properties,
                id: album._fields[albumIndex].identity.low,
                labels: album._fields[albumIndex].labels,
                songCount: album._fields[songCountIndex].low,
                artist: album._fields[artistIndex]
            })
        })
        resolve(albums)
    });
}

module.exports = { prepareSongs, prepareAlbums };