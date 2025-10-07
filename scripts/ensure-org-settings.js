import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function ensureOrganizationSettings() {
  try {
    console.log('🔄 Checking and creating organization_settings for all organizations...');

    // Get all organizations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name');

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      return;
    }

    console.log(`Found ${organizations?.length || 0} organizations`);

    for (const org of organizations || []) {
      // Check if organization_settings exists
      const { data: settings, error: settingsError } = await supabase
        .from('organization_settings')
        .select('id')
        .eq('organization_id', org.id)
        .single();

      if (settingsError && settingsError.code === 'PGRST116') {
        // Record doesn't exist, create it
        console.log(`Creating organization_settings for ${org.name} (${org.id})`);

        const { error: insertError } = await supabase
          .from('organization_settings')
          .insert({
            organization_id: org.id,
            business_hours: {
              monday: { open: '08:00', close: '18:00', closed: false },
              tuesday: { open: '08:00', close: '18:00', closed: false },
              wednesday: { open: '08:00', close: '18:00', closed: false },
              thursday: { open: '08:00', close: '18:00', closed: false },
              friday: { open: '08:00', close: '18:00', closed: false },
              saturday: { open: '09:00', close: '13:00', closed: false },
              sunday: { closed: true }
            },
            owner_profile: {},
            onboarding_step: 0,
            onboarding_completed: false,
            ai_personality_config: {
              client_ai: {
                name: 'Luna',
                personality: 'amigavel',
                tone: 'casual',
                emoji_frequency: 'medium',
                brazilian_slang: true,
                empathy_level: 8
              },
              aurora: {
                name: 'Aurora',
                personality: 'parceira-proxima',
                tone: 'coleguinha',
                data_driven_style: 'celebratorio'
              }
            }
          });

        if (insertError) {
          console.error(`Error creating settings for ${org.name}:`, insertError);
        } else {
          console.log(`✅ Created settings for ${org.name}`);
        }
      } else if (settings) {
        console.log(`✅ Settings already exist for ${org.name}`);
      }
    }

    console.log('✨ Organization settings check complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
ensureOrganizationSettings();