import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { cognitoSub, email, name } = await request.json()

    if (!cognitoSub || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call the CMS API to create/update user
    const cmsResponse = await fetch(`${process.env.CMS_API_URL || 'http://localhost:4000'}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cognitoSub,
        email,
        name: name || email.split('@')[0], // Use email prefix as fallback name
      }),
    })

    if (!cmsResponse.ok) {
      const errorText = await cmsResponse.text()
      console.error('CMS API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create user in database' },
        { status: 500 }
      )
    }

    const user = await cmsResponse.json()
    return NextResponse.json({ success: true, user })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}