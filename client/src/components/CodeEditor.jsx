function CodeEditor({ code, handleCodeChange }) {
  return (
    <textarea
      value={code}
      onChange={(e) => handleCodeChange(e.target.value)}
      placeholder="Start writing code..."
      className="w-full h-[500px] bg-slate-900 text-white p-4 rounded-xl border border-slate-700 outline-none font-mono resize-none"
    />
  );
}

export default CodeEditor;