import { Component } from "react";
import './Home.css';
import Songs from './Songs'
import { prepareSongs } from "./Utility";

export default class Home extends Component {
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
        fetch("http://localhost:3030/recommended/" + 46, { //TODO: id ulogovanog
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(
            (result) => {
                console.log(result.data)
                if(result.status == 200){
                    this.setState({
                        songs: prepareSongs(result.data.songs),
                        albums: result.data.albums
                    })
                }
                else if(result.status == 400)
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
            </div>
        </div>
        )
    }
}