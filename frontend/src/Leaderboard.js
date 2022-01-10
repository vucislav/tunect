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
        this.publish = this.publish.bind(this)
        this.state.socket = new WebSocket('ws://localhost:3080/?id=' + 46); //TODO: id ulogovanog
    }

    componentDidMount(){
        this.fetchSongs()
        
        let socket = this.state.socket
        // Connection opened
        this.state.socket.addEventListener('open', function (event) {
            socket.send('Hello Server!');
        });

        // Listen for messages
        this.state.socket.addEventListener('message', function (event) {
            console.log('Message from server ', event.data);
        });
    }

    fetchSongs(){
        let date = "2022."
        let basedOn = "rating"
        fetch("http://localhost:3030/leaderboards/" + date + "/" + basedOn, { //TODO: id ulogovanog
            method: 'GET',
            mode: 'cors',
            headers: {
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
                }
            },
            (error) => {
                console.log(error)
            }
        )
    }

    publish(){
        this.state.socket.send("porukica")
        return
        fetch("http://localhost:3030/publish/", { //TODO: id ulogovanog
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(
            (result) => {
                console.log(result.data); 
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