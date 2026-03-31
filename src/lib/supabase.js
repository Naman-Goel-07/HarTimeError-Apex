import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple test function to insert dummy telemetry data
export async function insertDummyTelemetry() {
  const event_id = '9da4b67b-1234-5678-abcd-1234567890ab'; // Dummy hackathon event
  
  const { data, error } = await supabase
    .from('telemetry')
    .insert([
      { 
        event_id, 
        // Generates random coordinates near center of Mapbox StrategyMap (London)
        latitude: 51.5072 + (Math.random() - 0.5) * 0.01,
        longitude: -0.1276 + (Math.random() - 0.5) * 0.01
      }
    ]);
  
  if (error) {
    console.error('Error inserting dummy telemetry:', error);
  } else {
    console.log('Successfully inserted dummy telemetry.');
  }
  
  return { data, error };
}
