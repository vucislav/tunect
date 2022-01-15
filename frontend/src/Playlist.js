import { Component } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Songs from './Songs'
import './Playlist.css'
import { prepareSongs } from "./Utility";

class Playlist extends Component {
    constructor(props) {
      super(props);
      this.state = {
          playlist: {},
          songs: [],
          playlistId: ""
      };
      this.fetchPlaylist = this.fetchPlaylist.bind(this)
      this.removeFromPlaylist = this.removeFromPlaylist.bind(this)

      let pathname = this.props.location.pathname
      this.state.playlistId = pathname.substring(pathname.lastIndexOf("/") + 1, pathname.length)
    }

    componentDidMount(){
        this.fetchPlaylist()
    }

    fetchPlaylist(){
        fetch("http://localhost:3030/playlist/" + this.state.playlistId, {
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
                        songs: prepareSongs(result.data.songs),
                        playlist: result.data.playlist
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

    removeFromPlaylist(songId){
        fetch("http://localhost:3030/playlist/" + this.state.playlistId + "/" + songId, { //TODO: ovde treba da vadis id ulogovanog usera
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then(
            (result) => {
                if(result.status == 200){
                    this.setState((prevState) =>({
                        songs: prevState.songs.filter(e => e.id != songId)
                    }))
                } else if (result.status == 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                } else if(result.status == 400)
                    this.setState({invalidRegInput: result.message})
            },
            (error) => {
                console.log(error)
            })
    }

    render() {
        return (<div className="padding">
        <div className="col-md-6 offset-md-3">
            <h3 id="playlistName">{this.state.playlist.name}</h3>
            <Songs songs = {this.state.songs}
                ratingEnabled = {true}
                isMyPlaylist={this.state.playlist.creatorId == 46} //TODO: umesto 46 treba da stoji id ulogovanog usera
                playlistAdding = {true} 
                removeFromPlaylist = {this.removeFromPlaylist}/>
        </div>
    </div>)
    }
}

function WithNavigate(props) {
    let navigate = useNavigate();
    let location = useLocation();
    return <Playlist {...props} navigate={navigate} location={location}/>
}

export default WithNavigate