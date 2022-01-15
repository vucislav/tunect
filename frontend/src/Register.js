import { Component } from "react";
import './Register.css';
import { useNavigate, Navigate } from "react-router-dom";

class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            firstName: "",
            lastName: "",
            stageName: "",
            email: "",
            password: "",
            invalidRegInput: ""
        };
        this.register = this.register.bind(this);
    }

    register(e) {
        e.preventDefault()
        if(this.state.username === "" || this.state.email === "" || this.state.password === "") { 
            this.setState({invalidRegInput: 'You need to fill all fields marked with *'}); 
            return
        }
        fetch("http://localhost:3030/register", {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: this.state.username,
                firstName: this.state.firstName,
                lastName: this.state.lastName,
                stageName: this.state.stageName,
                email: this.state.email,
                password: this.state.password,
            })
        })
        .then(res => res.json())
        .then(
            (result) => {
                if(result.status == 200)
                    this.props.navigate('/login')
                else if(result.status == 400)
                    this.setState({invalidRegInput: result.message})
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
                <h3>Register</h3>

                <div className="form-group">
                    <label>Username *</label>
                    <input type="text" className="form-control regInput" placeholder="Username" value={this.state.username}
                            onChange={(e) => this.setState({username: e.target.value})}/>
                </div>

                <div className="form-group">
                    <label>First name</label>
                    <input type="text" className="form-control regInput" placeholder="First name" value={this.state.firstName}
                            onChange={(e) => this.setState({firstName: e.target.value})}/>
                </div>

                <div className="form-group">
                    <label>Last name</label>
                    <input type="text" className="form-control regInput" placeholder="Last name" 
                        onChange={(e) => this.setState({lastName: e.target.value})}/>
                </div>

                <div className="form-group">
                    <label>Stage name</label>
                    <input type="text" className="form-control regInput" placeholder="Stage name" 
                        onChange={(e) => this.setState({stageName: e.target.value})}/>
                </div>

                <div className="form-group">
                    <label>Email address *</label>
                    <input type="email" className="form-control regInput" placeholder="Enter email" 
                    onChange={(e) => this.setState({email: e.target.value})}/>
                </div>

                <div className="form-group">
                    <label>Password *</label>
                    <input type="password" className="form-control regInput" placeholder="Enter password" 
                     onChange={(e) => this.setState({password: e.target.value})}/>
                </div>

                <div>
                    <p id = "invalidRegInput" 
                       style = {{display: this.state.invalidRegInput === "" ? 'none' : 'block'}}>
                            {this.state.invalidRegInput}</p>
                </div>

                <button id="regBtn" type="submit" className="btn btn-primary btn-block" onClick={this.register}>Sign Up</button>
                <p className="forgot-password text-right">
                    Already registered <a href="/login">login?</a>
                </p>
            </form>
        );
    }
}

function WithNavigate(props) {
    let navigate = useNavigate();
    return <Register {...props} navigate={navigate} />
}

export default WithNavigate