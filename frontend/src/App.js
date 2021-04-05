import logo from './logo.svg';
import './App.css';
import config from './config';
import axios from 'axios';

function App() {
  const entries = axios.get(config().api + '/entries').then(console.log).catch(console.error);
  console.log(entries);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          "Hello World"
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
