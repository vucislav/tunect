import { Component } from "react";
import Songs from './Songs'
import { prepareSongs } from "./Utility";

export default class Leaderboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            songs: [],
            albums: [],
            day: "",
            month: "",
            year: "",
            socket: null
        };
        this.fetchSongs = this.fetchSongs.bind(this)
    }

    componentDidMount(){
        this.fetchSongs()
    }

    fetchSongs(){
        let date = "2022."
        let basedOn = "rating"
        fetch("http://localhost:3030/leaderboards/" + date + "/" + basedOn, { //TODO: id ulogovanog
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
                console.log(result.data); 
                if(result.status == 200){
                    this.setState({
                        songs: prepareSongs(result.data.songs)
                    })
                } else if (result.status == 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                }
            },
            (error) => {
                console.log(error)
            }
        )
    }

    render(){//onClick = { (event) => this.props.fetchSongs() }
        return(
        <div className="padding">
            <div className="col-md-8 offset-md-2">
                <h3>Leaderboard</h3>
                <button className="btn btn-danger btn-block" onClick = { this.publish }>Submit</button>
                <Songs songs = {this.state.songs}
                    ratingEnabled = {true}
                    playlistAdding = {true}
                    numbered = {true} />
            </div>
        </div>
        )
    }
}