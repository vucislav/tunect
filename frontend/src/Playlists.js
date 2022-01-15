import { Component } from "react";
import './Playlists.css'
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios'

class Playlists extends Component {
    constructor(props) {
      super(props);
      this.state = {
          newPlaylistName: "",
          myPlaylists: [],
          audioUrl: ""
      };
      this.fetchMyPlaylists = this.fetchMyPlaylists.bind(this)
      this.createPlaylist = this.createPlaylist.bind(this)
      this.removePlaylist = this.removePlaylist.bind(this)
    }

    componentDidMount(){
        this.fetchMyPlaylists()
    }

    fetchMyPlaylists(){
        fetch("http://localhost:3030/user/" + localStorage.getItem("username") + "/playlists", {
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
                    this.setState({
                        myPlaylists: result.data
                    }) 
                else if (result.status == 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                } 
                else if(result.status == 400)
                    this.setState({invalidRegInput: result.message})
            },
            (error) => {
                console.log(error)
            }
        )
    }

    createPlaylist(){
        fetch("http://localhost:3030/createPlaylist", {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: localStorage.getItem("username"), 
                name: this.state.newPlaylistName
            })
        })
        .then(res => res.json())
        .then(
            (result) => {
                if(result.status == 200)
                    this.setState(prevState => ({
                        myPlaylists: [result.data, ...prevState.myPlaylists]
                    }))
                else if (result.status == 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                } 
                else if(result.status == 400)
                    this.setState({invalidRegInput: result.message})
            },
            (error) => {
                console.log(error)
            })
    }

    removePlaylist(playlistId){
        fetch("http://localhost:3030/playlist/" + playlistId, {
            method: 'DELETE',
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
                    this.setState(prevState => ({
                        myPlaylists: prevState.myPlaylists.filter(e => e.id != playlistId)
                    }))
                else if (result.status == 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                } 
                else if(result.status == 400)
                    this.setState({invalidRegInput: result.message})
            },
            (error) => {
                console.log(error)
            })
    }

    render() {
        return (
            <div className="padding">
                <div className="col-md-8 offset-md-2">
                    <div className="card">
                        <div className="card-body little-profile text-center">
                            <div className="form-group">
                                <label>Create new playlist</label>
                                <input type="text" className="form-control regInput" placeholder="Playlist name" value={this.state.newPlaylistName}
                                        onChange={(e) => this.setState({newPlaylistName: e.target.value})}/>
                            </div>
                            <button id="createPlaylistBtn" className="btn btn-primary btn-block" onClick={this.createPlaylist}>Create</button>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="list list-row block">
                                        {this.state.myPlaylists.map((e, i) => 
                                            <div className="list-item col playListItem" key={i}>
                                                <div className="col-md-1"><a href="#" data-abc="true"><span className="w-48 avatar gd-warning">P</span></a></div>
                                                <div className="flex col-md-3"> 
                                                    <a href="#" onClick={(event) => this.props.navigate('/playlist/' + e.id)} 
                                                    className="item-author text-color" data-abc="true">{ e.name }</a>
                                                    <div className="item-except text-muted text-sm h-1x"> 
                                                        {e.songCount === undefined ? "0 songs" : e.songCount + " songs"} 
                                                    </div>
                                                </div>
                                                <button className="deletePlaylistBtn btn btn-danger btn-block col-md-4" 
                                                onClick = { (event) => this.removePlaylist(e.id) }>Delete</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

function WithNavigate(props) {
    let navigate = useNavigate();
    let location = useLocation();
    return <Playlists {...props} navigate={navigate} location={location}/>
}

export default WithNavigate