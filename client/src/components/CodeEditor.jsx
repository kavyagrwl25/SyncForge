import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";    
import { socket } from "../socket";
import { MonacoBinding } from "y-monaco";

function CodeEditor({
  language,
  roomId,
  username,
  remoteCursors,
  handleLanguageChange,
  ytext,
}) {
  // State makes the effects run after Monaco finishes mounting.
  const [editor, setEditor] = useState(null);

  // Store a reference to the Monaco instance.
  const monacoRef = useRef(null);

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

  // Binding and listeners are managed by effects so cleanup and
  // setup also work when React Strict Mode replays effects.
  const handleEditorDidMount = (editor, monaco) => {
    monacoRef.current = monaco;
    setEditor(editor);
  };

  useEffect(() => {
    if (!editor || !ytext) return;

    let model = null;
    let binding = null;

    const bindModel = () => {
      // y-monaco already destroys its binding if the model is disposed.
      if (model && !model.isDisposed()) binding?.destroy();

      model = editor.getModel();
      binding = model && !model.isDisposed()
        ? new MonacoBinding(ytext, model, new Set([editor]))
        : null;
    };

    bindModel();
    const modelListener = editor.onDidChangeModel(bindModel);

    return () => {
      modelListener.dispose();
      if (model && !model.isDisposed()) binding?.destroy();
    };
  }, [editor, ytext]);

  useEffect(() => {
    if (!editor) return;

    // Listen for cursor position changes in the editor.
    const cursorListener = editor.onDidChangeCursorPosition(
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

    return () => cursorListener.dispose();
  }, [editor]);

  // Listen for changes in remoteCursors and update the
  // corresponding cursor decorations inside Monaco.
  useEffect(() => {
    if (!editor || !monacoRef.current || !remoteCursors) {
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

    let model = null;
    let decorationIds = [];

    const clearDecorations = () => {
      if (model && !model.isDisposed()) {
        model.deltaDecorations(decorationIds, []);
      }
      decorationIds = [];
    };

    const updateDecorations = () => {
      clearDecorations();
      model = editor.getModel();
      if (model && !model.isDisposed()) {
        decorationIds = editor.deltaDecorations([], decorations);
      }
    };

    updateDecorations();
    const modelListener = editor.onDidChangeModel(updateDecorations);

    return () => {
      modelListener.dispose();
      clearDecorations();
    };
  }, [editor, remoteCursors]);

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
