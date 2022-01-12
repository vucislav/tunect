import React from 'react';
import './Songs.css'
import { RateIcon, PlaylistIcon } from "./Utility";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default class Songs extends React.Component {

    constructor(props) {
        super(props);
        this.state ={
            loggedInUserPlaylists: [],
            ratingList: [1, 2, 3, 4, 5],
            showRateModal: false,
            showPlaylistModal: false,
            currSongRating: 0,
            currSongId: -1,
            playlistIds: [] //lista id-eva pljelisti u kojoj se nalazi izabrana pesma
        }
        this.addToPlaylist = this.addToPlaylist.bind(this)
        this.rateSong = this.rateSong.bind(this)
        this.openRatingModal = this.openRatingModal.bind(this)
        this.openPlaylistsModal = this.openPlaylistsModal.bind(this)
        this.onSongPlay = this.onSongPlay.bind(this)
    }

    componentDidMount(){
        if(this.props.playlistAdding){
            fetch("http://localhost:3030/user/" + "carina" + "/playlists", { //TODO: ovde ide username ulogovanog korisnika
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Authorization': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                }
            })
            .then(res => res.json())
            .then(
                (result) => {
                    if(result.status == 200){
                        this.setState({
                            loggedInUserPlaylists: result.data
                        })
                    } else if (result.status == 401) {
                        localStorage.removeItem('token')
                        this.props.navigate('/login')
                    } else if(result.status == 400)
                        this.setState({invalidRegInput: result.message})
                },
                (error) => {
                    console.log(error)
                }
            )
        }
    }
  
    addToPlaylist(songId){
        let checkboxes = document.querySelectorAll('.playlistCheckbox');
        let checkedPlIds = []
        checkboxes.forEach((e) => {
            if(e.checked) checkedPlIds.push(e.value)
        })
        fetch("http://localhost:3030/addToPlaylists", {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                songId: this.state.currSongId,
                playlistIds: checkedPlIds,
                userId: 46 //TODO: id ulogovanog
            })
        })
        .then(res => res.json())
        .then(
            (result) => {
                console.log(result)
                if(result.status == 400)
                    console.log(result.message)
            },
            (error) => {
                console.log(error)
        })
        this.setState({showPlaylistModal: false})
    }

    rateSong(){
        let checkboxes = document.querySelectorAll('.rateRadioButton');
        let rating = -1
        checkboxes.forEach((e) => {
            if(e.checked) rating = e.value
        })
        if(rating !== -1) {
            fetch("http://localhost:3030/rateSong", {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Authorization': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: rating,
                    songId: this.state.currSongId,
                    userId: 16 //TODO: ovde ide ID ulogovanog
                })
            })
            .then(res => res.json())
            .then(
                (result) => {
                    console.log(result)
                    if(result.status == 400)
                        console.log(result.message)
                    else if (result.status == 401) {
                        localStorage.removeItem('token')
                        this.props.navigate('/login')
                    } 
                },
                (error) => {
                    console.log(error)
                }
            )
        }
        this.setState({showRateModal: false})
    }

    openRatingModal(event, songId){
        event.preventDefault()
        fetch("http://localhost:3030/rating/" + 16 + "/" + songId, { //TODO: ID loginovanog 
            method: 'GET',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(
            (result) => {
                console.log(result.data)
                if(result.status == 200)
                    this.setState({showRateModal: true, currSongRating: result.data, currSongId: songId})
                else if(result.status == 400)
                    console.log(result.message) 
                else if (result.status == 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                } 
            },
            (error) => {
                console.log(error)
            }
        )
    }

    openPlaylistsModal(event, songId){
        event.preventDefault()
        fetch("http://localhost:3030/containSong/" + 46 + "/" + songId, { //TODO: ID loginovanog 
            method: 'GET',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(
            (result) => {
                if(result.status == 200)
                    this.setState({showPlaylistModal: true, currSongId: songId, playlistIds: result.data})
                else if(result.status == 400)
                    console.log(result.message) 
                else if (result.status == 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                } 
            },
            (error) => {
                console.log(error)
            }
        )
    }

    onSongPlay(e, songId){
        console.log(songId)
        let audio = document.querySelector("#audio" + songId);
        if(audio.currentTime === 0){
            fetch("http://localhost:3030/listen", {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Authorization': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    songId: songId,
                })
            })
            .then(res => res.json())
            .then(
                (result) => {
                    if(result.status == 200)
                        console.log(result)
                    else if (result.status == 401) {
                        localStorage.removeItem('token')
                        this.props.navigate('/login')
                    } 
                },
                (error) => {
                    console.log(error)
                }
            )
        }
    }

    render() {
        return(
        <div className="row">
             <Modal show={this.state.showRateModal} onHide={() => this.setState({showRateModal: false})}>
                    <Modal.Header closeButton>
                        <Modal.Title>Rate</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {
                            this.state.ratingList.map((p, i) =>
                                <div key={i}>
                                    <input className = "rateRadioButton" defaultChecked = {this.state.currSongRating == p ? true : false} type="radio" name="rate" value={p}/>
                                    <label>{p}</label>
                                </div>
                            )
                        }
                    </Modal.Body>
                    <Modal.Footer>
                    <Button variant="primary" onClick={this.rateSong}>
                        Save Changes
                    </Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={this.state.showPlaylistModal} onHide={() => this.setState({showPlaylistModal: false})}>
                    <Modal.Header closeButton>
                    <Modal.Title>Add to playlist</Modal.Title>
                    </Modal.Header>
                        <Modal.Body>
                        {
                            this.state.loggedInUserPlaylists.map((p, i) =>
                                <div key={i}>
                                    <input className = "playlistCheckbox" 
                                        defaultChecked = {this.state.playlistIds.includes(p.id)}
                                        type="checkbox" name="playlistCB" value={p.id}/>
                                    <label>{p.name}</label>
                                </div>
                            )
                        }
                        </Modal.Body>
                    <Modal.Footer>
                    <Button variant="primary" onClick={this.addToPlaylist}>
                        Save Changes
                    </Button>
                    </Modal.Footer>
                </Modal>
            <div className="col-sm-12">
                <div className="list list-row block">
                    {this.props.songs.map((song, i) => 
                        { 
                            let minutes =  Math.floor(song.duration / 60)
                            let seconds = Math.floor(song.duration) - minutes * 60
                            if(seconds < 10) seconds = "0" + seconds
                            let duration = minutes + " : " + seconds
                            return (
                                <div className="list-item" key={i}>
                                    {this.props.numbered === true ? <div className="no-wrap">
                                        <div className="item-date text-muted text-sm d-none d-md-block">{ (i + 1) + "." }</div>
                                    </div> : null}
                                    <div><a href="#" data-abc="true"><span className="w-48 avatar gd-warning">S</span></a></div>
                                    <div className="flex"> <a href="#" className="item-author text-color" data-abc="true">{ song.title }</a>
                                        <div className="item-except text-muted text-sm h-1x"> { song.artist }</div>
                                    </div>
                                    <div className="no-wrap">
                                        <div className="item-date text-muted text-sm d-none d-md-block">{ duration }</div>
                                    </div>
                                    <div className="no-wrap">
                                        <div className="item-date text-muted text-sm d-none d-md-block">
                                            {"Rate " + (song.avgRating !== null ? song.avgRating : 0) }
                                        </div>
                                    </div>
                                    {this.props.playlistAdding == true ? 
                                        <a className="playListIcon" href="#" onClick={(event) => {
                                            this.openPlaylistsModal(event, song.id)
                                    }}><PlaylistIcon /></a> : null}

                                    {this.props.ratingEnabled == true ? 
                                    <a className="rateIcon" href="#" onClick={(event) => {
                                            this.openRatingModal(event, song.id)
                                    }}><RateIcon /></a> : null}
                                    {
                                        this.props.isMyPlaylist ? 
                                        <button className="btn btn-danger btn-block" onClick = { (event) => this.props.removeFromPlaylist(song.id) }>Remove</button>
                                        : null
                                    }
                                    <audio id={"audio" + song.id} controls={true}
                                        type={"audio/" + song.extension.substring(1, song.extension.length)}
                                        src={song.audioUrl} onPlay={(e) => this.onSongPlay(e, song.id)}></audio>
                                </div>)
                        }
                    )}
                </div>
            </div>
        </div>
        )
    }
}
