import React from 'react';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: [],
      tmp: 0
    };
  }

  componentDidMount() {
    /*fetch("http://localhost:3030/russel", {
          method: 'GET',
          mode: 'cors',
      })
      .then(res => res.json())
      .then(
        (result) => {
          console.log(result)
          this.setState({
            isLoaded: true,
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
    /*fetch("http://localhost:3040/incr", {
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
          tmp: result
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
    //const { error, isLoaded, items } = this.state;
    const { error, isLoaded, tmp } = this.state
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
        <p>lazar car</p>
      );
    }
  }
}

export default App;
