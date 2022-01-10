import React, { Component } from "react";
import { useNavigate } from "react-router-dom";

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
                console.log(result)
                if(result.status === 200)
                    this.props.navigate('/home')
                else if(result.status === 400)
                    this.setState({invalidLoginInput: result.message})
            },
            (error) => {
                console.log(error)
            }
        )
    }

    render() {
        return (
          <form>
            <h3>Sign In</h3>

            <div className="form-group">
                <label>Email address</label>
                <input type="email" className="form-control" placeholder="Enter email" 
                  onChange={(e) => this.setState({email: e.target.value})}/>
            </div>

            <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control" placeholder="Enter password"
                  onChange={(e) => this.setState({password: e.target.value})} />
            </div>

            <div>
                <p id = "invalidLoginInput" 
                    style = {{display: this.state.invalidLoginInput === "" ? 'none' : 'block'}}>
                        {this.state.invalidLoginInput}</p>
            </div>

            <button type="submit" className="btn btn-primary btn-block" onClick = {this.login}>Submit</button>
            <p className="forgot-password text-right">
                Forgot <a href="#">password?</a>
            </p>
          </form>
        );
    }
}

function WithNavigate(props) {
  let navigate = useNavigate();
  return <Login {...props} navigate={navigate} />
}

export default WithNavigate