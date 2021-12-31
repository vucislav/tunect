import React from 'react';
import './App.css';
import Login from './Login'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: [],
      counter: 0
    };
  }

  componentDidMount() {
    /*fetch("http://localhost:3030/shark", {
          method: 'GET',
          mode: 'cors',
      })
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: false,
            items: result
          });
        },
        (error) => {
          console.log(error)
          this.setState({
            isLoaded: true,
            error
          });
        }
      )*/
    /*fetch("http://localhost:3030/incr", {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/html'
        },

    })
    .then(res => res.json())
    .then(
      (result) => {
        console.log(result)
        this.setState({
          counter: result
        });
      },
      (error) => {
        console.log(error)
        this.setState({
          error
        });
      }
    )*/
  }

  render() {
    const { error, isLoaded, counter } = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
        <Login></Login>
      );
    }
  }
}

export default App;
