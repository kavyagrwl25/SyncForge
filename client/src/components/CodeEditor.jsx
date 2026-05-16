import Editor from "@monaco-editor/react";

function CodeEditor({ code, language, setLanguage, handleCodeChange, handleLanguageChange }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 outline-none"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
      </div>

      <div className="h-[500px] border border-slate-700 rounded-xl overflow-hidden">
        <Editor
          height="500px"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => handleCodeChange(value || "")}   // whenever code is changed, run handleCodeChange function with the new code value. If value is null or undefined, use an empty string instead.
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;