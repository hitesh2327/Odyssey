export interface ResumeParserPromptInput {
  resumeText: string;
  availableTopics: string[];  // topic names from the topics table
}

export class ResumeParserPromptTemplate {
  static build({ resumeText, availableTopics }: ResumeParserPromptInput): string {
    return `
You are a professional resume parser. Extract structured information from the 
resume text below and return ONLY a valid JSON object — no extra text, no markdown.

Available topics to match skills against:
${availableTopics.join(', ')}

Resume text:
"""
${resumeText.slice(0, 12000)}
"""

Return this exact JSON structure:

{
  "role": "string — the person's target or most recent job title (max 150 chars)",
  "bio": "string — a 2-3 sentence professional summary written in first person (max 500 chars)",
  "homePort": "string — city and country/state if found, otherwise empty string",
  "experienceLevel": "BEGINNER | INTERMEDIATE | ADVANCED | EXPERT — infer from years of experience: 0-1=BEGINNER, 1-3=INTERMEDIATE, 3-7=ADVANCED, 7+=EXPERT",
  "matchedTopics": ["array of topic names from the Available topics list that appear in this resume — exact matches only from the provided list"],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startYear": "string",
      "endYear": "string or 'Present'"
    }
  ],
  "experience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string",
      "endDate": "string or 'Present'",
      "summary": "string — max 200 chars, key responsibilities"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string — max 200 chars",
      "techStack": ["string"]
    }
  ]
}

Rules:
- matchedTopics must only contain values from the Available topics list — do not invent new ones
- If a field cannot be determined from the resume, use an empty string or empty array
- Return only valid JSON, nothing else
`;
  }
}
