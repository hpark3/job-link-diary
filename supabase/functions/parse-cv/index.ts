import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { cvText } = await req.json();
    if (!cvText || typeof cvText !== "string" || cvText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "CV text is too short or missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a CV/resume parser. Extract structured candidate profile data from the provided CV text.
Focus on:
- Target roles the candidate is suited for (pick from: Business Analyst, Product Analyst, Product Operations, Systems Analyst, Analyst OR Operations)
- Technical and soft skills
- Industry domains (e.g. Fintech, SaaS, E-commerce, Healthcare)
- Preferred regions if mentioned (pick keys from: seoul, london, singapore)
- Experience level: junior (0-2 yrs), mid (2-5 yrs), senior (5-10 yrs), lead (10+ yrs)

Be concise. Only extract what's clearly present in the CV.`,
            },
            {
              role: "user",
              content: `Parse this CV and extract the candidate profile:\n\n${cvText.slice(0, 8000)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_profile",
                description:
                  "Extract structured candidate profile from a CV/resume",
                parameters: {
                  type: "object",
                  properties: {
                    targetRoles: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Matching roles from: Business Analyst, Product Analyst, Product Operations, Systems Analyst, Analyst OR Operations",
                    },
                    skills: {
                      type: "array",
                      items: { type: "string" },
                      description: "Technical and soft skills found in the CV",
                    },
                    domains: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Industry domains like Fintech, SaaS, E-commerce",
                    },
                    preferredRegions: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Region keys: seoul, london, singapore (only if mentioned)",
                    },
                    experienceLevel: {
                      type: "string",
                      enum: ["junior", "mid", "senior", "lead"],
                      description: "Estimated experience level",
                    },
                    summary: {
                      type: "string",
                      description:
                        "One-sentence summary of the candidate's profile",
                    },
                  },
                  required: [
                    "targetRoles",
                    "skills",
                    "domains",
                    "preferredRegions",
                    "experienceLevel",
                    "summary",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_profile" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profile = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
