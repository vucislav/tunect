import { Component } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { prepareSongs } from "./Utility";
import Songs from './Songs'
import './Song.css';

class Song extends Component {
    constructor(props) {
        super(props);
        this.state = {
            song: {},
            comments: [],
            songId: "",
            commentText: ""
        };
        this.fetchSong = this.fetchSong.bind(this)
        this.postComment = this.postComment.bind(this)
        this.fetchComments = this.fetchComments.bind(this)
        let pathname = this.props.location.pathname
        this.state.songId = pathname.substring(pathname.lastIndexOf("/") + 1, pathname.length);
    }

    componentDidMount(){
        this.fetchSong()
    }

    postComment(){
        if(this.state.commentText === "") return
        fetch("http://localhost:3030/comment/", {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Authorization': localStorage.getItem('token'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: this.state.commentText,
            username: localStorage.getItem("username"),
            songId: this.state.songId
        })
    })
    .then(res => res.json())
    .then(
        (result) => {
            if(result.status == 200){
                this.setState(prevState => ({
                    comments: [result.data, ...prevState.comments],
                    commentText: ""
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

    fetchComments(){
        let count = document.querySelector('#commentsCount option:checked').value;
        fetch("http://localhost:3030/comments/" + this.state.songId + "/" + count, {
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
                        comments: result.data,
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

    fetchSong(){
        fetch("http://localhost:3030/song/" + this.state.songId, {
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
                        song: prepareSongs([result.data])[0],
                    })
                    this.fetchComments()
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

    timestampToDate(timestamp){
        var date = new Date(Number(timestamp));
        return date.toLocaleString();
    }

    render(){
        return(
        <div className="padding">
            <div className="col-md-8 offset-md-2">
                <h3 className = "title" style={{paddingLeft: "0px"}}>Song</h3>
                <Songs songs = {Object.keys(this.state.song).length === 0 ? [] : [this.state.song]}
                    ratingEnabled = {true}
                    playlistAdding = {true}
                    playingEnabled = {true} />
                <div className="form-group row">
                    <label className = "title" style={{marginBottom: "10px"}}>Leave a comment</label>
                    <input style={{marginBottom: "10px"}} type="text" className="form-control" placeholder="Add a comment" 
                        value={this.state.commentText} onChange={(e) => this.setState({commentText: e.target.value})}/>
                    <div className="col">
                        <button className="btn btn-primary btn-block col-md-4" onClick={this.postComment}
                        style={{width: "200px"}}>Comment</button>
                        <select style={{width: "150px", height: "30px"}} className="col-md-4 offset-md-2" name="count" id="commentsCount" onChange={this.fetchComments}>
                            <option value="5">Last 5 comments</option>
                            <option value="10">Last 10 comments</option>
                            <option value="15">Last 15 comments</option>
                            <option value="20">Last 20 comments</option>
                        </select>
                    </div>
                </div>
                <div className="list list-row block" style={{marginTop: "20px"}}>
                {
                    this.state.comments.map((e, i) =>
                        <div className="list-item" key={i}>
                            <div><a href="#" data-abc="true"><span className="w-48 avatar gd-warning">C</span></a></div>
                            <div className="row" style={{textAlign: "left"}}>
                                <a href={"/profile/" + e.username}>
                                    <p style={{marginBottom: "0px"}}>{"@" + e.username + "  " + this.timestampToDate(e.timestamp)}</p>
                                </a>
                                <p style={{marginBottom: "0px"}}>{e.text}</p>
                            </div>
                        </div>
                        
                    )
                }
                </div>
            </div>
        </div>
        )
    }
}

function WithNavigate(props) {
    let navigate = useNavigate();
    let location = useLocation();
    return <Song {...props} navigate={navigate} location={location}/>
}
  
export default WithNavigate