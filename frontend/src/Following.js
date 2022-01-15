import { Component } from "react";
import { useNavigate } from "react-router-dom";
import Songs from './Songs'
import Albums from './Albums'
import './Following.css'

class Following extends Component {
    constructor(props) {
        super(props);
        this.state = {
            singles: [],
            songsOnAlbums: [],
            albums: []
        };
        this.fetchSingles = this.fetchSingles.bind(this)
        this.fetchSongsOnAlbums = this.fetchSongsOnAlbums.bind(this)
        this.fetchAlbums = this.fetchAlbums.bind(this)
    }

    componentDidMount(){
        this.fetchSingles()
        this.fetchSongsOnAlbums()
        this.fetchAlbums()
    }

    fetchSingles(){
        fetch("http://localhost:3030/following/singles/" + this.state.singles.length + "/3", {
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
                    this.setState(prevState => ({
                        singles: [...prevState.singles, ...result.data]
                    }))
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

    fetchSongsOnAlbums(){
        fetch("http://localhost:3030/following/songsOnAlbums/" + this.state.songsOnAlbums.length + "/1", { 
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
                    this.setState(prevState => ({
                        songsOnAlbums: [...prevState.songsOnAlbums, ...result.data]
                    }))
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
        fetch("http://localhost:3030/following/albums/" + this.state.albums.length + "/1", { 
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
                    this.setState(prevState => ({
                        albums: [...prevState.albums, ...result.data]
                    }))
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
                <a href="#" className="showMore" onClick={this.fetchSingles}><p>Show more...</p></a>
                <h3 className="title">Songs on albums</h3>
                <Songs songs = {this.state.songsOnAlbums}
                    ratingEnabled = {true}
                    playlistAdding = {true} />
                <a href="#" className="showMore" onClick={this.fetchSongsOnAlbums}><p>Show more...</p></a>
                <h3 className="title">Albums</h3>
                <Albums albums = {this.state.albums} />
                <a href="#" className="showMore" onClick={this.fetchAlbums}><p>Show more...</p></a>
            </div>
        </div>
        )
    }
}

function WithNavigate(props) {
    let navigate = useNavigate();
    return <Following {...props} navigate={navigate} />
  }
  
  export default WithNavigate