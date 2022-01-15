import { Component } from "react";
import { useNavigate } from "react-router-dom";
import Songs from './Songs'
import Albums from "./Albums";
import { prepareSongs } from "./Utility";

class Recommended extends Component {
    constructor(props) {
        super(props);
        this.state = {
            songs: [],
            albums: []
        };
        this.fetchSongs = this.fetchSongs.bind(this)
    }

    componentDidMount(){
        this.fetchSongs()
    }

    fetchSongs(){
        fetch("http://localhost:3030/recommended/" + localStorage.getItem("userId"), { //TODO: id ulogovanog
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
                console.log(result.data.songs)
                if(result.status == 200){
                    this.setState({
                        //songs: prepareSongs(result.data.songs), //TODO: da l ce moci odavde da se pustaju pesme 
                        songs: result.data.songs,
                        albums: result.data.albums
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
                <h3>Recommended songs</h3>
                <Songs songs = {this.state.songs}
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
    return <Recommended {...props} navigate={navigate} />
  }
  
  export default WithNavigate