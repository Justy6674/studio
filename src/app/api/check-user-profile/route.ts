import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "In development, Firebase Admin uses mocks. Please check client-side debug info on the profile page.",
    instructions: [
      "1. Go to /profile in your browser",
      "2. Look for the yellow debug box at the top",
      "3. Check what it shows for 'Profile Name' and 'Profile Loaded'",
      "4. If Profile Loaded shows 'No', the issue is that no profile document exists",
      "5. If Profile Name shows 'None', the name field is missing from your profile"
    ],
    your_uid: "CyNwVfklX0QTiRPLgWOSZkAVyki2",
    your_email: "downscaleweightloss@gmail.com"
  });
} 