import { Component } from "react";
import './Profile.css';
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios'
import Songs from './Songs'
import { EditIcon, prepareSongs } from "./Utility";
import Albums from './Albums'

class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            singleFile: null,
            albumFiles: [],
            user: {},
            username: "",
            albumName: "",
            singles: [],
            albums: [],
            playlists: [],
            coverPhotoSrc: "",
            profilePhotoSrc: "",
        };
        this.uploadSingle = this.uploadSingle.bind(this)
        this.uploadAlbum = this.uploadAlbum.bind(this)
        this.follow = this.follow.bind(this)
        this.fectchProfileInfo = this.fetchProfileInfo.bind(this)
        this.fetchSingles = this.fetchSingles.bind(this)
        this.fetchPlaylists = this.fetchPlaylists.bind(this)
        this.changePhoto = this.changePhoto.bind(this)
        this.getPhoto = this.getPhoto.bind(this)

        let pathname = this.props.location.pathname
        this.state.username = pathname.substring(pathname.lastIndexOf("/") + 1, pathname.length);
    }

    componentDidMount(){
        this.fetchProfileInfo()
        this.fetchAlbums()
        this.fetchPlaylists()
        this.fetchSingles()
    }

    async uploadSingle(e){
        e.preventDefault()
        if(this.state.singleFile == null) return
        let reader = new FileReader();
        let single = this.state.singleFile
        let userId = this.state.user.id

        reader.onload = function (event) {
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(event.target.result, async function(buffer) {
                let formData = new FormData()
                formData.append("single", single);
                formData.append("duration", buffer.duration);
                formData.append("userId", 54);//userId
                await axios.post('http://localhost:3030/uploadSingle', formData, {
                    headers: {
                        'Authorization': localStorage.getItem('token'),
                        'Content-type': 'multipart/form-data'
                    }
                })
            });
        };

        reader.onerror = function (event) {
            console.error("An error ocurred reading the file: ", event);
        };

        reader.readAsArrayBuffer(this.state.singleFile);
    }

    async uploadAlbum(e){
        e.preventDefault()
        if(this.state.albumFiles.length == 0) return
        let reader = new FileReader();
        let formData = new FormData()
        let album = this.state.albumFiles
        let counter = 0;
        let songsInfoList = []
        formData.append("albumName", this.state.albumName);
        reader.onload = function (event) {
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(event.target.result, async function(buffer) {
                formData.append("song" + counter, album[counter])
                songsInfoList.push({duration: buffer.duration})
                counter++
                if(counter === album.length){
                    formData.append("songsInfo", JSON.stringify(songsInfoList));
                    await axios.post('http://localhost:3030/uploadAlbum/', formData, {
                        headers: {
                            'Authorization': localStorage.getItem('token'),
                            'Content-type': 'multipart/form-data'
                        }
                    })
                } else {
                    reader.readAsArrayBuffer(album[counter]);
                }
            });
        };
        reader.onerror = function (event) {
            console.error("An error ocurred reading the file: ", event);
        };
        reader.readAsArrayBuffer(this.state.albumFiles[0]);
    }

    fetchProfileInfo(){
        fetch("http://localhost:3030/user/" + this.state.username, {
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
                        user: result.data
                    })//TODO: vadi slicke
                    //this.getPhoto("profile")
                    //this.getPhoto("cover")
                } else if (result.status == 401) {
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
        fetch("http://localhost:3030/user/" + this.state.username + "/albums", {
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
                } else if (result.status == 401) {
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

    fetchSingles(){
        fetch("http://localhost:3030/user/" + this.state.username + "/singles", {
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
                        singles: prepareSongs(result.data)
                    })
                } else if (result.status == 401) {
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

    fetchPlaylists(){
        fetch("http://localhost:3030/user/" + this.state.username + "/playlists", {
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
                if(result.status == 200)
                    this.setState({
                        playlists: result.data
                    })
                else if (result.status == 401) {
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

    follow(){
        fetch("http://localhost:3030/follow", {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                followingId: this.state.user.id
            })
        })
        .then(res => res.json())
        .then(
            (result) => {
                if (result.status == 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                } 
                else if(result.status == 400)
                    console.log(result.message)
            },
            (error) => {
                console.log(error)
            }
        )
    }

    getPhoto(type){
        fetch("http://localhost:3030/photo/" + type + "/" + this.state.user.id, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.blob())
        .then(blob => {
            // TODO: da li hocemo da proverimo status code?
            if(type == "cover")
                this.setState({
                    coverPhotoSrc: URL.createObjectURL(blob)
                })
            else if (type == "profile")
                this.setState({
                    profilePhotoSrc: URL.createObjectURL(blob)
                })
        })
    }

    changePhoto(e, type){
        let photoFile = e.target.files[0]
        e.preventDefault()
        if(photoFile == null) return
        let formData = new FormData()
        formData.append("photoFile", photoFile);
        formData.append("userId", 16); //TODO: ovde treba da stoji ID ulogovanog
        formData.append("type", type);
        axios.post('http://localhost:3030/uploadPhoto', formData, {
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-type': 'multipart/form-data'
            }
        })
        if(type == "cover")
            this.setState({
                coverPhotoSrc: URL.createObjectURL(photoFile)
            })
        else if (type == "profile")
            this.setState({
                profilePhotoSrc: URL.createObjectURL(photoFile)
            })
    }

    render(){
        return(
            <div className="padding">
                <div className="col-md-6 offset-md-3">
                    <div className="card">
                        <div className="coverPhoto">
                            <img style={{maxHeight: "300px"}} src={this.state.coverPhotoSrc}/>
                            <div id="coverPhotoEdit">
                                <a href="#" onClick={(e) => {
                                    e.preventDefault(); 
                                    document.getElementById("coverPhotoFile").click();
                                }}><EditIcon /></a>
                                <input id="coverPhotoFile" accept="image/*" type="file" onChange={(e) => {this.changePhoto(e, "cover")}}/>
                            </div>
                        </div>
                        <div className="card-body little-profile text-center">
                            <div className="profilePhoto">
                                <img style={{maxHeight: "300px"}} src={this.state.profilePhotoSrc}/>
                                <div id="profilePhotoEdit">
                                    <a href="#" onClick={(e) => {
                                        e.preventDefault(); 
                                        document.getElementById("profilePhotoFile").click();
                                    }}><EditIcon /></a>
                                    <input id="profilePhotoFile" accept="image/*" type="file" onChange={(e) => {this.changePhoto(e, "profile")}}/>
                                </div>
                            </div>
                            <h4 className="m-b-0">{this.state.user.stageName}</h4>
                            <p>{"@" + this.state.user.username}</p>
                            <a className="m-t-10 waves-effect waves-dark btn btn-primary btn-md btn-rounded" 
                                onClick={this.follow} data-abc="true">Follow</a>
                            <div className="row text-center offset-md-3">
                                <div className="col-lg-4 col-md-4 m-t-20">
                                    <h4 className="m-b-0 font-light">{this.state.user.followersCount}</h4><small>Followers</small>
                                </div>
                                <div className="col-lg-4 col-md-4 m-t-20">
                                    <h4 className="m-b-0 font-light">{this.state.user.followingCount}</h4><small>Following</small>
                                </div>
                            </div>
                        </div>
                        <div className="form">
                            <form>
                                <label>Upload single:<br />
                                    <input id="singleFile" accept="audio/*" type="file" name="singleFile" 
                                        onChange={(e) => this.setState({singleFile:e.target.files[0]})}/>
                                </label>
                                <button type="submit" onClick={this.uploadSingle}>Post single</button>
                            </form>
                            <form>
                                <label>Upload album:<br />
                                    <input id="albumFiles" multiple accept="audio/*" type="file" name="albumFiles" 
                                    onChange={(e) => this.setState({albumFiles: e.target.files})}/>
                                    <input type="text" className="form-control" placeholder="Album name"
                                    onChange={(e) => this.setState({albumName: e.target.value})}/>
                                </label>
                                <button type="submit" onClick={this.uploadAlbum}>Post album</button>
                            </form>
                        </div>
                        <div className="page-content page-container" id="page-content">
                        <div className="padding">
                            <h3>Singles</h3>
                            <Songs songs = {this.state.singles} 
                                ratingEnabled = {true}
                                loggedInUserPlaylists = {this.state.loggedInUserPlaylists}
                                playlistAdding = {true}/>
                            <h3>Albums</h3>
                            <Albums albums = {this.state.albums} />
                            <h3>Playlists</h3>
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="list list-row block">
                                        {this.state.playlists.map((e, i) => 
                                            <div className="list-item" key={i}>
                                                <div><a href="#" data-abc="true"><span className="w-48 avatar gd-warning">P</span></a></div>
                                                <div className="flex"> 
                                                    <a href="#" onClick={(event) => this.props.navigate('/playlist/' + e.id)} className="item-author text-color" data-abc="true">{ e.name }</a>
                                                    <div className="item-except text-muted text-sm h-1x"> ovde treba da ide broj pesama </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> 
                    </div>
                </div>
            </div>
        )
    }
}

function WithNavigate(props) {
    let navigate = useNavigate();
    let location = useLocation();
    return <Profile {...props} navigate={navigate} location={location}/>
}

export default WithNavigate