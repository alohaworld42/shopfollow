import { createClient } from '@supabase/supabase-js';

const url = 'https://qcmnnfrvujxytcwmnquy.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbW5uZnJ2dWp4eXRjd21ucXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzczOTQsImV4cCI6MjA4NTY1MzM5NH0.6MYsMJtvmQDVle1A-rLb2SiKwrrACcqZQ3M6FYVF4kE';

const supabase = createClient(url, key);

async function test() {
    const email = `debug_${Date.now()}@gmail.com`;
    const password = 'TestPassword123!';

    console.log('Signing up:', email);
    const { data: upData, error: upError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: 'Debug User' } }
    });

    if (upError) {
        console.error('Signup Error:', upError.message);
        return;
    }

    console.log('Signup User ID:', upData.user?.id);
    console.log('Signup Session Present:', !!upData.session);

    if (!upData.session) {
        console.log('NOTE: Session is null after signup. This usually means Email Verification is REQUIRED.');
    }

    console.log('Attempting Login...');
    const { data: inData, error: inError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (inError) {
        console.error('Login Error:', inError.message);
        if (inError.message.includes('Email not confirmed')) {
            console.log('CONCLUSION: You MUST verify your email before logging in.');
        }
    } else {
        console.log('Login Success! Session token obtained.');
    }
}

test();
