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

const wsClient = new WebSocket('ws://localhost:3080/?token=' + localStorage.getItem('token')); //TODO: id ulogovanog

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: [],
    };
    this.notificationConnection = this.notificationConnection.bind(this)
  }

  componentDidMount() {
    wsClient.addEventListener('open', function (event) {
      wsClient.send('Hello Server!');
    });

    wsClient.addEventListener('message', function (event) {
        console.log('Message from server ', event.data);
    });
  }

  notificationConnection(){

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
          <Route path="/home" element={<Home/>} />
          <Route path="/profile/:username" element={<Profile/>} />
          <Route path="/home" element={<Home/>} />
          <Route path="/playlists" element={<Playlists/>} />
          <Route path="/playlist/:playlistId" element={<Playlist/>} />
          <Route path="/album/:albumId" element={<Album/>} />
          <Route path="/leaderboard" element={<Leaderboard/>} />
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
