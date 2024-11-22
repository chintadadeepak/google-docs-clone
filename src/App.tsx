import { useEffect } from "react";
import "./App.css";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/project-config";
import { TextEditor } from "./components/text-editor";

function App() {
  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, (user) => {
      if (user) console.log(user.uid);
    });
  }, []);

  return (
    <div>
      <header>
        <h1>Google Docs Clone</h1>
        <TextEditor />
      </header>
    </div>
  );
}

export default App;
