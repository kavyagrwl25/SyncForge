import Editor from "@monaco-editor/react";

function CodeEditor({ code, handleCodeChange }) {
  return (
    <div className="h-[500px] border border-slate-700 rounded-xl overflow-hidden">
      <Editor
        height="500px"
        language="javascript"
        theme="vs-dark"
        value={code}
        onChange={(value) => handleCodeChange(value || "")}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />
    </div>
  );
}

export default CodeEditor;