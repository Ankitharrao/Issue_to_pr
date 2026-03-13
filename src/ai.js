require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function reviewChanges(issue, originalFiles, changedFiles) {

  const prompt = `
You are a senior software engineer performing a code review.

Issue:
${issue.title}

Issue Description:
${issue.body}

Original Files:
${JSON.stringify(originalFiles, null, 2)}

Changed Files:
${JSON.stringify(changedFiles, null, 2)}

Analyze the code change carefully.

First determine:
- whether the issue described is actually fixed
- whether the new code introduces any bugs
- whether there are security risks
- whether the implementation follows good practices

Then respond STRICTLY in this JSON format:

{
 "bugs_found": "Explain clearly whether the bug is fixed or still exists",
 "security_issues": "Explain real security concerns or say 'None'",
 "suggestions": "Concrete improvements to the code",
 "verdict": "APPROVE if the issue is fixed correctly, otherwise REQUEST_CHANGES"
}

Return ONLY valid JSON.
Do not include any extra text.
`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "user", content: prompt }
    ],
    model: "llama-3.1-8b-instant"
  });

  return completion.choices[0].message.content;
}

module.exports = {
  reviewChanges
};