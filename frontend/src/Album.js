import { Component } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Songs from './Songs'

class Album extends Component {
    constructor(props) {
      super(props);
      this.state = {
          album: {},
          songs: [],
          albumId: ""
      };
      this.fetchAlbum = this.fetchAlbum.bind(this)

      let pathname = this.props.location.pathname
      this.state.albumId = pathname.substring(pathname.lastIndexOf("/") + 1, pathname.length)
    }

    componentDidMount(){
        this.fetchAlbum()
    }

    fetchAlbum(){
        fetch("http://localhost:3030/album/" + this.state.albumId, {
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
                        songs: result.data.songs,
                        album: result.data.album
                    })
                } else if (result.status == 401) {
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

    removeFromPlaylist(songId){
        fetch("http://localhost:3030/playlist/" + this.state.playlistId + "/" + songId, {
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
                }
                else if(result.status == 400)
                    this.setState({invalidRegInput: result.message})
            },
            (error) => {
                console.log(error)
            })
    }

    render() {
        return (<div className="padding">
        <div className="col-md-6 offset-md-3">
            <h3 id="playlistName">{this.state.album.title}</h3>
            <Songs songs = {this.state.songs}
                ratingEnabled = {true}
                playlistAdding = {true} />
        </div>
    </div>)
    }
}

function WithNavigate(props) {
    let navigate = useNavigate();
    let location = useLocation();
    return <Album {...props} navigate={navigate} location={location}/>
}

export default WithNavigate