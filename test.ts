import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://lclwcpizpkmkiuajeccn.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbHdjcGl6cGtta2l1YWplY2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MjAyODQsImV4cCI6MjA4OTA5NjI4NH0.c4Pej1lygPIq07Nbm0eEMyFieIyhyd-AXtgsVGzJAeU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('uploads')
    .select(`
          id, created_at, status, body_part,
          analysis:analysis_results(risk_level, summary, confidence, severity_score),
          consultations(id, status, scheduled_at, doctor_notes)
        `)
    .limit(10);
    
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

check();
