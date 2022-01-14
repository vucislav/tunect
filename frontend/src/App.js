import React from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import Login from './Login'
import Register from './Register';
import Profile from './Profile';
import Home from './Home';
import Playlists from './Playlists'
import Playlist from './Playlist'
import Album from './Album'
import Leaderboard from './Leaderboard';
import { Routes, Route, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { CancelIcon } from './Utility';
import Song from './Song'

var wsClient = {}

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: [],
      notifList: [],
    };
    this.setupNotifications = this.setupNotifications.bind(this)
    this.removeNotif = this.removeNotif.bind(this)
    this.parseMessage = this.parseMessage.bind(this)
    this.setupNotifications()
  }

  parseMessage(message){
    let publisherId = "", type = "", id = "", text = ""
    let array = message.split(":")
    publisherId = array[0]
    type = array[1]
    id = array[2]
    array.forEach((e, i) => {
        if(i > 2) text += e
    })
    return { publisherId, type, id, text }
}

  setupNotifications(){
    if(localStorage.getItem('token') != null){
      wsClient = new WebSocket('ws://localhost:3080/?token=' + localStorage.getItem('token'));
      wsClient.addEventListener('open', function (event) {
        wsClient.send('Hello Server!');
      });
      let app = this
      wsClient.addEventListener('message', function (event) {
          console.log('Message from server ', event.data);
          let { publisherId, type, id, text } = app.parseMessage(event.data)
          let newNotif = {publisherId: publisherId, text:text, id: id, type: type}
          app.setState(prevState => ({
            notifList: [...prevState.notifList, newNotif]
          }))
      });
    }
  }

  removeNotif(e, index){
    e.preventDefault()
    this.state.notifList.splice(index, 1)
    this.forceUpdate()
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-light fixed-top">
          <div className="container">
            <Link className="navbar-brand" to={"/login"}>eVeL</Link>
            <div className="collapse navbar-collapse" id="navbarTogglerDemo02">
                {
                localStorage.getItem('token') ? 
                
                <ul className="navbar-nav ml-auto">
                  <li className="nav-item">
                    <Link className="nav-link" to={"/home"}>Home</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to={"/profile/" + localStorage.getItem('username')}>Profile</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to={"/playlists"}>My playlists</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to={"/leaderboard"}>Leaderboard</Link>
                  </li>
                  <li className="nav-item">
                    <a href="" className="nav-link" onClick={
                      (e) => {
                        e.preventDefault()
                        localStorage.removeItem('token')
                        this.props.navigate('/login')
                      }
                    }>Log out</a>
                  </li>
                </ul>
                :
                <ul className="navbar-nav ml-auto">
                  <li className="nav-item">
                    <Link className="nav-link" to={"/login"}>Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to={"/register"}>Register</Link>
                  </li> 
                </ul>
                }
            </div>
          </div>
        </nav>
        {this.state.notifList.map((notif, i) => {
          return (
            <div className="card" key = {i}>
              <div className="card-body notifCard">
                <a className="notifBtnCancel" href="" onClick={(e) => this.removeNotif(e, i)}><CancelIcon /></a>
                <h5 className="card-title">Notification</h5>
                <p className="card-text">{notif.text}</p>
                <a href="#" className="btn btn-primary" onClick={(e) => { 
                  this.removeNotif(e, i)
                  if(notif.type === "single")
                    this.props.navigate('/song/' + notif.id)
                  else if(notif.type === "album")
                    this.props.navigate('/album/' + notif.id)
                }} >Check it out</a>
              </div>
            </div>
          )
        }
        )}
        
        <Routes>
          <Route exact path='/' element={
            <div className="auth-wrapper">
              <div className="auth-inner">
                <Login/>
              </div>
            </div>
            } />
          <Route path="/login" element={
            <div className="auth-wrapper">
              <div className="auth-inner">
                <Login/>
              </div>
            </div>
          } />
          <Route path="/register" element={
            <div className="auth-wrapper">
              <div className="auth-inner">
                <Register/>
              </div>
            </div>
          } />
          <Route path="/home" element={<Home setupNotifications={this.setupNotifications} areNotifSet = {wsClient.url !== undefined}/>} />
          <Route path="/profile/:username" element={<Profile/>} />
          <Route path="/playlists" element={<Playlists/>} />
          <Route path="/playlist/:playlistId" element={<Playlist/>} />
          <Route path="/album/:albumId" element={<Album/>} />
          <Route path="/leaderboard" element={<Leaderboard/>} />
          <Route path="/song/:songId" element={<Song/>} />
        </Routes>
      </div>
    );
  }
}

function WithNavigate(props) {
  let navigate = useNavigate();
  return <App {...props} navigate={navigate} />
}

export default WithNavigate
