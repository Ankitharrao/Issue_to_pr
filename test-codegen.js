const ai = require("./src/ai");

const fakeIssue = {
  title: "Sample bug",
  body: "This is a test issue to check AI code generator"
};

const fakeFiles = [
  {
    path: "example.js",
    content: "function test(){ console.log('hello'); }"
  }
];

ai.generateCodeFix(fakeIssue, fakeFiles)
.then(result => console.log(result))
.catch(err => console.error(err));