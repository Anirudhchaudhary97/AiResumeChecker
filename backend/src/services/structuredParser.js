const { GoogleGenAI, Type } = require("@google/genai");
const { z } = require("zod");
const env = require("../config/env");

const ai = env.geminiApiKey
  ? new GoogleGenAI({ apiKey: env.geminiApiKey })
  : null;

const linkSchema = {
  type: Type.OBJECT,
  required: ["label", "url"],
  properties: {
    label: { type: Type.STRING },
    url: { type: Type.STRING },
  },
};

const responseSchema = {
  type: Type.OBJECT,
  required: [
    "basics",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
    "interests",
  ],

  properties: {
    basics: {
      type: Type.OBJECT,
      required: ["name", "label", "email", "phone", "location", "links"],
      properties: {
        name: { type: Type.STRING },
        label: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        location: {
          type: Type.STRING,
        },
        links: {
          type: Type.ARRAY,
          items: linkSchema,
        },
      },
    },
    summary: { type: Type.STRING },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["company", "role", "period", "bullets"],
        properties: {
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          period: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },

    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["school", "degree", "period"],
        properties: {
          school: { type: Type.STRING },
          degree: { type: Type.STRING },
          period: { type: Type.STRING },
          location: { type: Type.STRING },
          details: { type: Type.STRING },
        },
      },
    },

    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["name", "description"],
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          tech: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          links: {
            type: Type.ARRAY,
            items: linkSchema,
          },
        },
      },
    },

    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["name"],
        properties: {
          name: { type: Type.STRING },
          issuer: { type: Type.STRING },
          year: { type: Type.STRING },
        },
      },
    },

    languages: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    interests: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
};

const validator = z.object({
  //basics
  basics: z.object({
    name: z.string().default(""),
    title: z.string().default(""),
    email: z.string().email().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    links: z
      .array(
        z.object({
          label: z.string().default(""),
          url: z.string().url(),
        }),
      )
      .default([]),
  }),

  //summary
  summary: z.string().default(""),

  //experience
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        role: z.string().default(""),
        period: z.string().default(""),
        bullets: z.array(z.string()).default([]),
      }),
    )
    .default([]),

  //education
  education: z
    .array(
      z.object({
        school: z.string().default(""),
        degree: z.string().default(""),
        period: z.string().default(""),
        location: z.string().default("").optional(),
        details: z.string().default("").optional(),
      }),
    )
    .default([]),

  //projects
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        description: z.string().default(""),
        tech: z.array(z.string()).default([]),
        links: z
          .array(
            z.object({
              label: z.string().default(""),
              url: z.string().url(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),

  //skills
  skills: z.array(z.string()).default([]),

  //certifications
  certifications: z
    .array(
      z.object({
        name: z.string().default(""),
        issuer: z.string().default("").optional(),
        year: z.string().default("").optional(),
      }),
    )
    .default([]),

  //languages
  languages: z.array(z.string()).default([]),

  //interests
  interests: z.array(z.string()).default([]),
});

const buildPrompt = (resumeText) => {
  return [
    "Your are a resume parser .The input is text extracted from a PDF - line may be jumbled or out of natural reading order.",
    "",
    "Extract structured data",
    "- basics: name,professional title,email,phone,location, social links (Linkedln/Github/portfolio etc.; label like \"LinkedIn\", \"GitHub\" \\full URL)",
    "- summary: the professional Summary paragraph(rejoin if split across lines)",
    "- experience: job most recent first, with company,role,period(preserve original date format),location if available,and bullets points",
    "-education:degree,school,location,period,optional details",
    "-skills: flat array of technical skillls",
    "-projects:name,one-sentence description,tech array(optional),links(optional)",
    "-certifications: name,issuer,year(optional)",
    "-languages: flat array",
    "-interests: flat array",
    "",
    "Rules:",
    "- Be conservative: omit fields that are not clearly present. Use empty strings/arrays where missing",
    "- Do not invent or paraphrase - extract verbatim where possible.",
    "- Each experience bullet should be read as complete sentences.",
    " - Preserve original date formats (e.g. 'jan 2022 - Dec 2023').",
    "",
    "RESUME TEXT:",
    "-----------",
    resumeText,
    "-----------",
  ].join("\n");
};

const EMPTY = {
  basics: { name: "", title: "", email: "", phone: "", location: "", links: [] },
  summary: "",
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
  languages: [],
  interests: [],
};


const parseResume= async(rawText)=>{
  if(!ai || !rawText?.trim())return EMPTY;

  const prompt= buildPrompt(rawText);

  for (let attempt=1; attempt<=2; attempt++){
    try {
      const result= await ai.models.generateContent({
      model:env.geminiModel,
      contents:[{role:"user", parts:[{text:prompt}]}],
      config:{
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      }
    });

    const text = typeof result.text === "function" ? result.text() : result.text;
    if(!text) throw new Error("Empty response")
    const parsed = JSON.parse(text);
    return validator.parse(parsed);
    } catch (error) {
      if(attempt===2){
        console.error("failed to parse",error);
        return EMPTY;
      }
    }
  }
return EMPTY
}


module.exports = {
 parseResume
};
