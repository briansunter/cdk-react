import logo from "./logo.svg";
import "./App.css";
import config from "./config";
import axios from "axios";
import React, { useState, useEffect } from "react";

function App() {
  const [entries, setEntries] = useState([]);
  useEffect(() => {
    async function fetchData() {
      const entries = await axios.get(config().api + "/entries");
      setEntries(entries.data);
    }
    fetchData();
  }, []);
  const newEntryTitle = React.createRef();
  const newEntry = React.createRef();
  const handleSubmit = async (e) => {
    e.preventDefault();
      await axios.post(config().api + "/entries", {title: newEntryTitle.current.value, body: newEntry.current.value});
      newEntry.current.value = "";
      newEntryTitle.current.value = "";
      const entries = await axios.get(config().api + "/entries");
      setEntries(entries.data);

  };
  return (
    <div className="App">
      <div>
        <h1>Journal</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Title:
            <input type="text" ref={newEntryTitle}></input>
          </label>
          <label>
            Entry:
            <input type="text" ref={newEntry}></input>
          </label>
          <input type="submit" value="Submit" />
        </form>
      </div>
      <ul>
        {entries.map((e) => (
          <li> <div>{e.title}</div>
         <div>{e.body} </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
