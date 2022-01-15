import { Component } from "react";
import { useNavigate } from "react-router-dom";
    
class Albums extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render(){
        return(
        <div className="row">
            <div className="col-sm-12">
                <div className="list list-row block">
                    {this.props.albums.map((e, i) => 
                        <div className="list-item" key={i}>
                            <div><a href="#" data-abc="true"><span className="w-48 avatar gd-warning">A</span></a></div>
                            <div className="flex"> <a href="#" className="item-author text-color" data-abc="true"
                                onClick={(event) => this.props.navigate('/album/' + e.id)}>{ e.title }</a>
                                <div className="item-except text-muted text-sm h-1x"> { e.artist + " • " + e.songCount + " songs" }</div>
                            </div>
                            <div className="no-wrap">
                                <div className="item-date text-muted text-sm d-none d-md-block">{ }</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        )
    }
}

function WithNavigate(props) {
    let navigate = useNavigate();
    return <Albums {...props} navigate={navigate} />
  }
  
  export default WithNavigate