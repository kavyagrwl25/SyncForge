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
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const cursorListenerRef = useRef(null);
  const roomIdRef = useRef(roomId);
  const usernameRef = useRef(username);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    console.log("[cursor][frontend] Monaco editor mounted");

    cursorListenerRef.current = editor.onDidChangeCursorPosition((event) => {
      if (!roomIdRef.current || !usernameRef.current) return;

      const payload = {
        roomId: roomIdRef.current,
        username: usernameRef.current,
        lineNumber: event.position.lineNumber,
        column: event.position.column,
      };

      console.log("[cursor][frontend] emitting cursor-position-change", payload);
      socket.emit("cursor-position-change", payload);
    });
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !remoteCursors) return;

    const decorations = Object.values(remoteCursors)
      .filter(
        (cursor) =>
          Number.isInteger(cursor.lineNumber) &&
          Number.isInteger(cursor.column) &&
          cursor.lineNumber > 0 &&
          cursor.column > 0
      )
      .map((cursor) => ({
        range: new monacoRef.current.Range(
          cursor.lineNumber,
          cursor.column,
          cursor.lineNumber,
          cursor.column
        ),
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

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      decorations
    );

    console.log(
      "[cursor][frontend] decoration ids after deltaDecorations",
      decorationsRef.current
    );
  }, [remoteCursors]);

  useEffect(() => {
    return () => {
      if (cursorListenerRef.current) {
        cursorListenerRef.current.dispose();
      }

      if (editorRef.current) {
        editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Code Editor</h2>
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
          value={code}
          onChange={(value) => handleCodeChange(value || "")}
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
