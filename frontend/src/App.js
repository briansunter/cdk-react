import logo from "./logo.svg";
import "./App.css";
import React, { useState, useEffect } from "react";
import { API, Amplify, Auth } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import getConfig from "./config";

Amplify.configure({
    Auth: {
        // identityPoolId: 'XX-XXXX-X:XXXXXXXX-XXXX-1234-abcd-1234567890ab',
        region: 'us-east-1',

        userPoolId: 'us-east-1_Gq9LEQec2',

        userPoolWebClientId: '5ib2bgldvs5rhf4e8tefa1f86m',

        mandatorySignIn: true,
    },
    API: {
      endpoints: [
          {
              name: "MyAPIGatewayAPI",
              endpoint: getConfig().api,
              custom_header: async () => { 
                return { Authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}` }
          }}]}
});

function App() {
  const [entries, setEntries] = useState([]);
  useEffect(() => {
    async function fetchData() {
      const entries = await API.get('MyAPIGatewayAPI', "/entries");
      setEntries(entries);
    }
    fetchData();
  }, []);
  const newEntryTitle = React.createRef();
  const newEntry = React.createRef();
  const handleSubmit = async (e) => {
    e.preventDefault();
       await API.post('MyAPIGatewayAPI', "/entries", {body: 
      {title: newEntryTitle.current.value, body: newEntry.current.value}
      });
      newEntry.current.value = "";
      newEntryTitle.current.value = "";

      const entries = await API.get('MyAPIGatewayAPI', "/entries");
      setEntries(entries);

  };
  return (
    <div className="App">
    <AmplifySignOut />
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

export default withAuthenticator(App);

