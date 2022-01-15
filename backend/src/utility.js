var fs = require('fs');
function prepareSongs(records, getFile = false){
    return new Promise(async function(resolve) {
        let songs = []
        for(let i = 0; i < records.length; i++){
            let song = records[i]
            let songIndex = song._fieldLookup["song"]

            let artistIndex = -1
            if(song._fields[song._fieldLookup["artist"]] !== undefined && song._fields[song._fieldLookup["artist"]] !== null)
                artistIndex = song._fieldLookup["artist"]
            else if (song._fields[song._fieldLookup["artist1"]] !== undefined && song._fields[song._fieldLookup["artist1"]] !== null)
                artistIndex = song._fieldLookup["artist1"]
            else if (song._fields[song._fieldLookup["artist2"]] !== undefined && song._fields[song._fieldLookup["artist2"]] !== null)
                artistIndex = song._fieldLookup["artist2"]
            let usernameIndex = -1
            if(song._fields[song._fieldLookup["username"]] !== undefined && song._fields[song._fieldLookup["username"]] !== null)
                usernameIndex = song._fieldLookup["username"]
            else if (song._fields[song._fieldLookup["username1"]] !== undefined && song._fields[song._fieldLookup["username1"]] !== null)
                usernameIndex = song._fieldLookup["username1"]
            else if (song._fields[song._fieldLookup["username2"]] !== undefined && song._fields[song._fieldLookup["username2"]] !== null)
                usernameIndex = song._fieldLookup["username2"]
                
            let avgRatingIndex = song._fieldLookup["avgRating"]
            let res = {
                ...song._fields[songIndex].properties,
                id: song._fields[songIndex].identity.low,
                labels: song._fields[songIndex].labels,
                artist: song._fields[artistIndex],
                avgRating: song._fields[avgRatingIndex] === null ? 0 : song._fields[avgRatingIndex]
            }
            if(usernameIndex !== -1) res.username = song._fields[usernameIndex]
            let albumIdIndex = song._fieldLookup["albumId"]
            if(albumIdIndex !== undefined &&  song._fields[albumIdIndex] !== null)
                res.albumId = song._fields[albumIdIndex].low
            if(getFile){
                if(res.albumId === undefined) res.songFile = await getSongFile(res.id, res.extension)
                else res.songFile = await getSongFile(res.id, res.extension, res.albumId)
            } 
            songs.push(res)
        }
        resolve(songs)
    });
}

function getSongFile(id, extension, albumId = -1){
    return new Promise(function(resolve) {
        let path = ""
        if(albumId != -1) path = "./albums/" + albumId + "/"
        else path = "./singles/"
        fs.readFile(path + id + extension, {encoding: 'base64'}, (err, songFile) =>{
            if(!err){
                resolve(songFile)
            } else {
                resolve(null)
            }
        })
    });
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

function preparePlaylists(records){
    return new Promise(async function(resolve) {
        let playlists = []
        records.forEach((e) => {
            let playlistIndex = e._fieldLookup["playlist"]
            let creatorIndex = e._fieldLookup["creatorId"]
            let songCountIndex = e._fieldLookup["songCount"]
            playlists.push({
                ...e._fields[playlistIndex].properties,
                id: e._fields[playlistIndex].identity.low,
                labels: e._fields[playlistIndex].labels,
                creatorId: e._fields[creatorIndex].low,
                songCount: e._fields[songCountIndex].low
            })
        })
        resolve(playlists)
    });
}

module.exports = { prepareSongs, prepareAlbums, preparePlaylists };