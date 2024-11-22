import { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../config/project-config";
import "react-quill/dist/quill.snow.css";
import { throttle } from "lodash";

export const TextEditor = () => {
  const quillRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const documentRef = doc(db, "documents", "sample-doc");
  const isLocalChange = useRef(false);

  const saveContent = throttle(() => {
    if (quillRef.current && isLocalChange.current) {
      // fetch the content from the editor
      const content = quillRef.current.getEditor().getContents();

      setDoc(documentRef, { content: content.ops }, { merge: true })
        .then(() => console.log("Data Saved"))
        .catch((err) => console.log(err));
      isLocalChange.current = false;
    }
  }, 1000);

  useEffect(() => {
    // fetching the initial content from the firestore

    if (quillRef.current) {
      getDoc(documentRef)
        .then((docSnapShot) => {
          if (docSnapShot.exists()) {
            const savedContent = docSnapShot.data().content;
            quillRef.current.getEditor().setContents(savedContent);
          } else {
            console.log(`Doc, 404`);
          }
        })
        .catch(console.error);

      const unsubscribe = onSnapshot(documentRef, (snapshot) => {
        if (snapshot.exists()) {
          const newContent = snapshot.data().content;

          if (!isEditing) {
            const editor = quillRef.current.getEditor();
            const currentCursorPosition = editor.getSelection()?.index || 0; // Get the current cursor position

            // Apply content update silently to avoid triggering `text-change`
            editor.setContents(newContent, "silent");

            // Restore cursor position after content update
            editor.setSelection(currentCursorPosition);
          }
        }
      });

      // inserting the changes from local machine to firestore

      const editor = quillRef.current.getEditor();
      editor.on("text-change", (_: any, __: any, source: any) => {
        if (source === "user") {
          isLocalChange.current = true;
          setIsEditing(true);
          saveContent();
          setTimeout(() => {
            setIsEditing(false);
          }, 5000);
        }
      });
      return () => {
        unsubscribe();
        editor.off("text-change");
      };
    }

    // fetching the updates from firestore to local machine in real time
  }, []);

  return (
    <div className="ql-container">
      <ReactQuill ref={quillRef} />
    </div>
  );
};
