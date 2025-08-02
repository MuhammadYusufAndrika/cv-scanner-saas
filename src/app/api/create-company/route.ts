import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, industry, userId } = await req.json();

    if (!name || !industry || !userId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use server-side client with service_role key
    const supabase = createClient();

    // Insert company record
    const { data, error } = await supabase
      .from('companies')
      .insert([{ name, industry, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error in create-company API:', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}