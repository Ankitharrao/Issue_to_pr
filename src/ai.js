async function generateCodeFix(issue, files) {

  // Take first file as demo fix
  const file = files[0];

  const fixedCode = file.content + "\n// Fix applied based on issue";

  return {
    changes: [
      {
        path: file.path,
        newContent: fixedCode,
        explanation: "Basic fix generated based on issue description"
      }
    ]
  };

}

module.exports = { generateCodeFix };