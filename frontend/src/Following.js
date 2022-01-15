import { Component } from "react";
import { useNavigate } from "react-router-dom";
import Songs from './Songs'
import Albums from './Albums'

class Following extends Component {
    constructor(props) {
        super(props);
        this.state = {
            singles: [],
            songsOnAlbums: [],
            albums: []
        };
    }

    componentDidMount(){
        fetch("http://localhost:3030/following/singles", {
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

        fetch("http://localhost:3030/following/songsOnAlbums", { 
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

        fetch("http://localhost:3030/following/albums", { 
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
                <h3>Singles</h3>
                <Songs songs = {this.state.singles}
                    ratingEnabled = {true}
                    playlistAdding = {true} />
                <h3>Songs on albums</h3>
                <Songs songs = {this.state.songsOnAlbums}
                    ratingEnabled = {true}
                    playlistAdding = {true} />
                <h3>Albums</h3>
                <Albums albums = {this.state.albums} />
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