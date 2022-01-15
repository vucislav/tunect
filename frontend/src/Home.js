import { Component } from "react";
import { useNavigate } from "react-router-dom";
import './Home.css';
import Songs from './Songs'
import Albums from './Albums'
    
class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            singles: [],
            songsOnAlbums: [],
            albums: []
        };
        this.fetchSongs = this.fetchSongs.bind(this)
        this.fetchAlbums = this.fetchAlbums.bind(this)
    }

    componentDidMount(){
        this.fetchSongs()
        this.fetchAlbums()
        if(!this.props.areNotifSet)
            this.props.setupNotifications()
    }

    fetchSongs(){
        fetch("http://localhost:3030/singles", {
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
                        singles: result.data
                    })
                }
                else if(result.status == 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                } else if(result.status == 400)
                    this.setState({invalidRegInput: result.message})
            },
            (error) => {
                console.log(error)
            }
        )

        fetch("http://localhost:3030/songsOnAlbums", { 
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
                        songsOnAlbums: result.data
                    })
                }
                else if(result.status == 401) {
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

    fetchAlbums(){
        fetch("http://localhost:3030/albums", {
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
                        albums: result.data
                    })
                }
                else if(result.status == 401) {
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

    render(){
        return(
        <div className="padding">
            <div className="col-md-8 offset-md-2">
                <h3 className="title">Singles</h3>
                <Songs songs = {this.state.singles}
                    ratingEnabled = {true}
                    playlistAdding = {true} />
                <h3 className="title">Songs on albums</h3>
                <Songs songs = {this.state.songsOnAlbums}
                    ratingEnabled = {true}
                    playlistAdding = {true} />
                <h3 className="title">Albums</h3>
                <Albums albums = {this.state.albums} />
            </div>
        </div>
        )
    }
}

function WithNavigate(props) {
    let navigate = useNavigate();
    return <Home {...props} navigate={navigate} />
  }
  
  export default WithNavigate