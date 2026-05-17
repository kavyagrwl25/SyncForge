import Editor from "@monaco-editor/react";

function CodeEditor({ code, language, setLanguage, handleCodeChange, handleLanguageChange }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Code Editor</h2>
          <p className="text-sm text-slate-400">Write and sync code in real time</p>
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
          onChange={(value) => handleCodeChange(value || "")}   // whenever code is changed, run handleCodeChange function with the new code value. If value is null or undefined, use an empty string instead.
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
