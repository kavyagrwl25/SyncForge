import { useEffect, useRef } from "react";

import Editor from "@monaco-editor/react";

import { socket } from "../socket";

function CodeEditor({
  code,
  language,
  roomId,
  username,
  remoteCursors,
  handleCodeChange,
  handleLanguageChange,
}) {
  // Store a reference to the Monaco editor instance.
  // useRef persists this reference across re-renders.
  const editorRef = useRef(null);

  // Store a reference to the Monaco instance.
  const monacoRef = useRef(null);

  // Store the current remote cursor decorations so they can
  // be replaced when remote cursor positions change.
  const decorationsRef = useRef([]);

  // Store the cursor listener so it can be disposed when
  // the component is unmounted.
  const cursorListenerRef = useRef(null);

  // Keep the latest roomId available inside event listeners
  // without recreating those listeners whenever roomId changes.
  const roomIdRef = useRef(roomId);

  // Keep the latest username available inside event listeners
  // without recreating those listeners whenever username changes.
  const usernameRef = useRef(username);

  // Update the roomId ref whenever the roomId prop changes.
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // Update the username ref whenever the username prop changes.
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // Called once when Monaco finishes mounting.
  // Stores the editor/Monaco references and sets up the
  // listener for the current user's cursor position.
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    console.log("[cursor][frontend] Monaco editor mounted");

    // Listen for cursor position changes in the editor.
    cursorListenerRef.current = editor.onDidChangeCursorPosition(
      (event) => {
        // Do not send cursor information if the user or room
        // information is not available yet.
        if (!roomIdRef.current || !usernameRef.current) return;

        // Create the payload containing the current user's
        // cursor position and room information.
        const payload = {
          roomId: roomIdRef.current,
          username: usernameRef.current,
          lineNumber: event.position.lineNumber,
          column: event.position.column,
        };

        // Send the cursor position to the server.
        socket.emit("cursor-position-change", payload);
      }
    );
  };

  // Listen for changes in remoteCursors and update the
  // corresponding cursor decorations inside Monaco.
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !remoteCursors) {
      return;
    }

    // Convert each remote cursor into a Monaco decoration.
    const decorations = Object.values(remoteCursors)
      .filter(
        (cursor) =>
          Number.isInteger(cursor.lineNumber) &&
          Number.isInteger(cursor.column) &&
          cursor.lineNumber > 0 &&
          cursor.column > 0
      )
      .map((cursor) => ({
        // Create a zero-length range at the remote user's
        // current cursor position.
        range: new monacoRef.current.Range(
          cursor.lineNumber,
          cursor.column,
          cursor.lineNumber,
          cursor.column
        ),

        // Display the remote cursor and show the username
        // when the cursor is hovered.
        options: {
          beforeContentClassName: "remote-cursor",
          hoverMessage: {
            value: cursor.username,
          },
        },
      }));

    console.log("[cursor][frontend] applying remote cursor decorations", {
      remoteCursors,
      previousDecorationIds: decorationsRef.current,
      nextDecorations: decorations,
    });

    // Replace the previous decorations with the new
    // remote cursor decorations.
    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      decorations
    );

    console.log(
      "[cursor][frontend] decoration ids after deltaDecorations",
      decorationsRef.current
    );
  }, [remoteCursors]);

  // Cleanup function that runs when the component unmounts.
  // Dispose of the cursor listener and remove the remaining
  // remote cursor decorations.
  useEffect(() => {
    return () => {
      if (cursorListenerRef.current) {
        cursorListenerRef.current.dispose();
      }

      if (editorRef.current) {
        editorRef.current.deltaDecorations(
          decorationsRef.current,
          []
        );
      }
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Code Editor
          </h2>

          <p className="text-sm text-slate-400">
            Write and sync code in real time
          </p>
        </div>

        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
        <Editor
          height="500px"
          language={language}
          theme="vs-dark"
          value={code} // Set the initial value of the editor to the code prop

          // Monaco's onChange gives us the complete current
          // editor content. This is the full-document sync flow.
          onChange={(value) => handleCodeChange(value || "")}

          // Call handleEditorDidMount when Monaco is mounted
          // to store references and set up the cursor listener.
          onMount={handleEditorDidMount}

          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            mouseWheelZoom: false,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;