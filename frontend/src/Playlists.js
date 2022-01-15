import { Component } from "react";
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
        fetch("http://localhost:3030/user/" + "carina" + "/playlists", { //TODO: ovde treba da vadis id ulogovanog usera
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
        fetch("http://localhost:3030/createPlaylist", { //TODO: ovde treba da vadis id ulogovanog usera
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: "carina", //TODO: ovde treba da vadis username ulogovanog usera
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
                            {this.state.myPlaylists.map((e, i) => { 
                                return (
                                    <div className="list-item" key={i}>
                                        <div><a href="#" data-abc="true"><span className="w-48 avatar gd-warning">P</span></a></div>
                                        <div className="flex"> 
                                            <a href="#" className="item-author text-color" 
                                                onClick={(event) => this.props.navigate('/playlist/' + e.id)} data-abc="true">{ e.name }</a>
                                            <div className="item-except text-muted text-sm h-1x"> ovde treba da ide broj pesama </div>
                                        </div>
                                        <button className="btn btn-danger btn-block" onClick = { (event) => this.removePlaylist(e.id) }>Remove</button>
                                    </div>)
                                }
                            )}
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