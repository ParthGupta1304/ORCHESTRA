const OpenAI = require('openai');

async function feedbackEngine(judgeOutputs, chief, audit) {
  const openai = new OpenAI();
  
  const prompt = `You are a professional Hackathon Judging Coordinator.
Your job is to take the raw scoring data from our specialized AI agents and synthesize it into a cohesive, encouraging, and detailed feedback document for the submitting team.

Here is the data:
Chief Judge Summary: ${JSON.stringify(chief)}
Specialist Judges: ${JSON.stringify(judgeOutputs)}
Auditor Notes: ${JSON.stringify(audit)}

Write a detailed, well-structured Markdown document. Do not just blindly list the internal JSON arrays. Instead, write fluid paragraphs explaining what the team did well and what they need to work on across all dimensions. Incorporate the Chief Judge's notes and any Auditor bias notes naturally into your review.

Requirements:
1. Do not include a main title (no '# Final Feedback Report'), the system will provide it.
2. Structure the report beautifully using Markdown headers (##), bold text, and bullet points where appropriate, but focus on prose and paragraphs.
3. Make it read like a white-glove executive summary from a panel of expert judges.
4. Keep the tone professional, constructive, and highly detailed.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    let report = "## Final Feedback Report\n\n";
    report += `**Overall Score:** ${chief.total_score} / 100\n`;
    report += `**Confidence Tier:** ${chief.confidence_tier}\n\n`;
    report += response.choices[0].message.content;
    
    return report;
  } catch (err) {
    console.error("Feedback generation failed:", err);
    // Fallback if API fails
    let report = "## Final Feedback Report\n\n";
    report += `**Overall Score:** ${chief.total_score} / 100\n`;
    report += `**Confidence Tier:** ${chief.confidence_tier}\n\n`;
    report += `> ${chief.ranking_notes}\n\n`;
    judgeOutputs.forEach(judge => {
      report += `### ${judge.dimension.charAt(0).toUpperCase() + judge.dimension.slice(1)} Judge\n`;
      report += `**Score:** ${judge.score} / ${judge.max_score}\n\n`;
      report += `**Strengths:**\n`;
      judge.strengths.forEach(s => report += `- ${s}\n`);
      report += `\n**Improvements:**\n`;
      judge.improvements.forEach(i => report += `- ${i}\n`);
      report += `\n`;
    });
    return report;
  }
}

module.exports = { feedbackEngine };
