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
            isFollowing: false 
        };
        this.uploadSingle = this.uploadSingle.bind(this)
        this.uploadAlbum = this.uploadAlbum.bind(this)
        this.follow = this.follow.bind(this)
        this.unfollow = this.unfollow.bind(this)
        this.fectchProfileInfo = this.fetchProfileInfo.bind(this)
        this.fetchSingles = this.fetchSingles.bind(this)
        this.fetchPlaylists = this.fetchPlaylists.bind(this)
        this.changePhoto = this.changePhoto.bind(this)
        this.getPhoto = this.getPhoto.bind(this)
        this.isMyProfile = this.isMyProfile.bind(this)
        this.isFollowing = this.isFollowing.bind(this)

        let pathname = this.props.location.pathname
        this.state.username = pathname.substring(pathname.lastIndexOf("/") + 1, pathname.length);
    }

    componentDidMount(){
        this.fetchProfileInfo()
        this.getPhoto("profile")
        this.getPhoto("cover")
        this.fetchAlbums()
        this.fetchPlaylists()
        this.fetchSingles()
    }

    async uploadSingle(e){
        e.preventDefault()
        if(this.state.singleFile == null) return
        let reader = new FileReader();
        let single = this.state.singleFile

        reader.onload = function (event) {
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(event.target.result, async function(buffer) {
                let formData = new FormData()
                formData.append("single", single);
                formData.append("duration", buffer.duration);
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
        formData.append("songCount", this.state.albumFiles.length);
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
                    })
                    this.isFollowing()
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
                        singles: result.data
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
                if(result.status === 200){
                    this.setState({
                        isFollowing: true 
                    })
                }
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

    unfollow(){
        fetch("http://localhost:3030/unfollow/" + this.state.user.id, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(
            (result) => {
                if(result.status === 200){
                    this.setState({
                        isFollowing: false 
                    })
                }
                if (result.status === 401) {
                    localStorage.removeItem('token')
                    this.props.navigate('/login')
                } 
                else if(result.status === 400)
                    console.log(result.message)
            },
            (error) => {
                console.log(error)
            }
        )
    }

    getPhoto(type){
        fetch("http://localhost:3030/photo/" + type + "/" + localStorage.getItem("userId"), {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.blob())
        .then(blob => {
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

    isFollowing(){
        fetch("http://localhost:3030/isFollowing/" + localStorage.getItem("userId") + "/" + this.state.user.id, {
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
                if(result.status === 200){
                    this.setState({
                        isFollowing: result.data
                    })
                }
                if (result.status === 401) {
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

    isMyProfile(){
        return this.state.username === localStorage.getItem("username")
    }

    render(){
        return(
            <div className="padding">
                <div className="col-md-8 offset-md-2 col-sm-12 col-lg-6 offset-md-3">
                    <div className="card  row-md-12 row-xl-12 col-sm-12 col-sm-12">
                        <div className="coverPhoto" onMouseOver={(e) => {
                            if(this.isMyProfile())
                                document.getElementById("coverPhotoEdit").style.display = "block";
                        }} 
                        onMouseOut={(e) => {
                            if(this.isMyProfile())
                                document.getElementById("coverPhotoEdit").style.display = "none";
                        }}>
                            <img className="col-md-12" style={{maxHeight: "300px"}} src={this.state.coverPhotoSrc}/>
                            <div id="coverPhotoEdit">
                                <a href="#" onClick={(e) => {
                                    e.preventDefault(); 
                                    document.getElementById("coverPhotoFile").click();
                                }}><EditIcon /></a>
                                <input id="coverPhotoFile" accept="image/*" type="file" onChange={(e) => {this.changePhoto(e, "cover")}}/>
                            </div>
                        </div>
                        <div className="card-body little-profile text-center">
                            <div className="profilePhoto" onMouseOver={(e) => {
                                if(this.isMyProfile())
                                    document.getElementById("profilePhotoEdit").style.display = "block";
                            }} 
                            onMouseOut={(e) => {
                                if(this.isMyProfile())
                                    document.getElementById("profilePhotoEdit").style.display = "none";
                            }}>
                                <img style={{maxHeight: "300px"}} src={this.state.profilePhotoSrc}/>
                                <div id="profilePhotoEdit">
                                    <a href="#" onClick={(e) => {
                                        e.preventDefault(); 
                                        document.getElementById("profilePhotoFile").click();
                                    }}><EditIcon /></a>
                                    <input id="profilePhotoFile" accept="image/*" type="file" onChange={(e) => {this.changePhoto(e, "profile")}}/>
                                </div>
                            </div>
                            <h4 className="m-b-0">{this.state.user.stageName + " (" + this.state.user.firstName + " " + this.state.user.lastName + ")"}</h4>
                            <p>{"@" + this.state.user.username}</p>
                            {
                                !this.isMyProfile() ? 
                                <a className="m-t-10 waves-effect waves-dark btn btn-primary btn-md btn-rounded"            
                                onClick={(e) => { 
                                    if(this.state.isFollowing) this.unfollow()
                                    else this.follow()
                                }} data-abc="true">{this.state.isFollowing ? "Unfollow" : "Follow"}</a> : null
                            }
                            <div className="row text-center offset-md-3">
                                <div className="col-lg-4 col-md-4 m-t-20">
                                    <h4 className="m-b-0 font-light">{this.state.user.followersCount}</h4><small>Followers</small>
                                </div>
                                <div className="col-lg-4 col-md-4 m-t-20">
                                    <h4 className="m-b-0 font-light">{this.state.user.followingCount}</h4><small>Following</small>
                                </div>
                            </div>
                        </div>
                        {
                           this.isMyProfile() ? 
                            <div className="form padding row-md-12">
                                <form>
                                    <h3>Upload single:</h3>
                                        <input className = "audioFileInput" id="singleFile" accept="audio/*" type="file" name="singleFile" 
                                            onChange={(e) => this.setState({singleFile:e.target.files[0]})}/>
                                    <button type="submit" className="btn-primary" onClick={this.uploadSingle}>Post single</button>
                                </form>
                                
                                <form className="col">
                                    <h3>Upload album:</h3>
                                    <input className = "audioFileInput" id="albumFiles" multiple accept="audio/*" type="file" name="albumFiles" 
                                    onChange={(e) => this.setState({albumFiles: e.target.files})}/>
                                    <input id="albumNameInput" type="text" className="col-md-4" placeholder="Album name"
                                    onChange={(e) => this.setState({albumName: e.target.value})}/>
                                    <button type="submit" className="btn-primary" onClick={this.uploadAlbum}>Post album</button>
                                </form>
                            </div> : null   
                        }
                        <div className="row-md-12" id="page-content">
                        <div className="padding row-md-12 row-xl-12">
                            <hr/>
                            <h3>Singles</h3>
                            <Songs songs = {this.state.singles} 
                                ratingEnabled = {true}
                                loggedInUserPlaylists = {this.state.loggedInUserPlaylists}
                                playlistAdding = {true}/>
                            <hr/>
                            <h3>Albums</h3>
                            <Albums albums = {this.state.albums} />
                            <hr/>
                            <h3>Playlists</h3>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="list list-row block">
                                        {this.state.playlists.map((e, i) => 
                                            <div className="list-item" key={i}>
                                                <div><a href="#" data-abc="true"><span className="w-48 avatar gd-warning">P</span></a></div>
                                                <div className="flex"> 
                                                    <a href="#" onClick={(event) => this.props.navigate('/playlist/' + e.id)} className="item-author text-color" data-abc="true">{ e.name }</a>
                                                    <div className="item-except text-muted text-sm h-1x"> {e.songCount + " songs"} </div>
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