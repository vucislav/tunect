import React, { Component } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import './Login.css'

class Login extends Component {
    constructor(props) {
      super(props);
      this.state = {
          email: "",
          password: "",
          invalidLoginInput: ""
      };
      this.login = this.login.bind(this);
      
    }

    login(e) {
      e.preventDefault();
      fetch("http://localhost:3030/login", {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: this.state.email,
                password: this.state.password,
            })
        })
        .then(res => res.json())
        .then(
            (result) => {
                if(result.status === 200) {
                    localStorage.setItem('token', result.data.token)
                    localStorage.setItem('username', result.data.username)
                    localStorage.setItem('userId', result.data.userId)
                    this.props.navigate('/home')
                } else if(result.status === 400)
                    this.setState({invalidLoginInput: result.message})
            },
            (error) => {
                console.log(error)
            }
        )
    }

    render() {
        
        if (localStorage.getItem('token')) {
            return (
                <Navigate to='/home' />
            )
        }

        return (
          <form>
            <h3>Sign In</h3>

            <div className="form-group">
                <label>Email address</label>
                <input type="email" className="form-control loginInput" placeholder="Enter email" 
                  onChange={(e) => this.setState({email: e.target.value})}/>
            </div>

            <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control loginInput" placeholder="Enter password"
                  onChange={(e) => this.setState({password: e.target.value})} />
            </div>

            <div>
                <p id = "invalidLoginInput" 
                    style = {{display: this.state.invalidLoginInput === "" ? 'none' : 'block'}}>
                        {this.state.invalidLoginInput}</p>
            </div>

            <button type="submit" className="btn btn-primary btn-block loginBtn" onClick = {this.login}>Submit</button>
          </form>
        );
    }
}

function WithNavigate(props) {
  let navigate = useNavigate();
  return <Login {...props} navigate={navigate} />
}

export default WithNavigate