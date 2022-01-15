import { Component } from "react";
import Songs from './Songs'
import './Leaderboard.css'

export default class Leaderboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            songs: [],
            albums: [],
            day: "",
            month: "",
            year: "",
            socket: null,
            basedOn: "rating"
        };
        this.fetchSongs = this.fetchSongs.bind(this)
    }

    fetchSongs(){
        let checkboxes = document.querySelectorAll('.basedOnCb');
        let basedOn = "rating"
        checkboxes.forEach((e) => {
            if(e.checked) basedOn = e.value
        })
        let date = ""
        if(this.state.day !== "") date += this.state.day + '.'
        if(this.state.month !== "") date += this.state.month + '.'
        if(this.state.year !== "") date += this.state.year + '.'
        if(date === "") return
        fetch("http://localhost:3030/leaderboards/" + date + "/" + basedOn, {
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
                        songs: result.data,
                        basedOn: basedOn
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

    render(){
        return(
        <div className="padding">
            <div className="col-md-8 offset-md-2">
                <h3>Leaderboard</h3>
                <div className="dateInputContainer">
                    <label className = "dateLbl">Day</label>
                    <input type="number" className="form-control dateInput" value={this.state.day}
                                onChange={(e) => this.setState({day: e.target.value})}/>
                    <label className = "dateLbl">Month</label>
                    <input type="number" className="form-control dateInput"  value={this.state.month}
                                onChange={(e) => this.setState({month: e.target.value})}/>
                    <label className = "dateLbl">Year</label>
                    <input type="number" className="form-control dateInput" value={this.state.year}
                                onChange={(e) => this.setState({year: e.target.value})}/>

                    <input className = "basedOnCb" defaultChecked type="radio" name="basedOn" value="rating"/>
                    <label className = "basedOnLbl">Rating</label>

                    <input className = "basedOnCb" type="radio" name="basedOn" value="listenings"/>
                    <label className = "basedOnLbl">Listenings</label>

                    <button className="btn btn-warning btn-block" onClick = { (event) => this.fetchSongs() }>Submit</button>
                </div>
                <Songs songs = {this.state.songs}
                    ratingEnabled = {true}
                    playlistAdding = {true}
                    showListenings = {this.state.basedOn === "listenings"}
                    numbered = {true} />
            </div>
        </div>
        )
    }
}