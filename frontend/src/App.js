import logo from "./logo.svg";
import "./App.css";
import config from "./config";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { API, Amplify, Auth } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';

// Amplify.configure({
//   aws_cognito_region: "us-east-1", // (required) - Region where Amazon Cognito project was created   
//   aws_user_pools_id:  "us-east-1_Gq9LEQec2", // (optional) -  Amazon Cognito User Pool ID   
//   aws_user_pools_web_client_id: "5ib2bgldvs5rhf4e8tefa1f86m", // (optional) - Amazon Cognito App Client ID (App client secret needs to be disabled)
//   // aws_cognito_identity_pool_id: "us-east-1:f602c14b-0fde-409c-9a7e-0baccbfd87d0", // (optional) - Amazon Cognito Identity Pool ID   
//   aws_mandatory_sign_in: "enable" // (optional) - Users are not allowed to get the aws credentials unless they are signed in   
// })

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
              endpoint: "https://api-dev.briansunter.com",
              custom_header: async () => { 
                // return { Authorization : 'token' } 
                // Alternatively, with Cognito User Pools use this:
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

