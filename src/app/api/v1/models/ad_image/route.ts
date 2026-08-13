import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/idempiere'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
const MAX_BASE64_LENGTH = 7_000_000

function parseJson(text: string): Record<string, unknown> {
  try { return text ? JSON.parse(text) : {} } catch { return {} }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { fileName?: string; data?: string }
    const fileName = body.fileName?.trim()
    const binaryData = body.data?.trim()
    if (!fileName || !binaryData) {
      return NextResponse.json({ error: 'Image file name and data are required' }, { status: 400 })
    }
    if (binaryData.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: 'Image size must be 5 MB or less' }, { status: 413 })
    }

    const token = await getAuthToken()
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    // iDempiere creates AD_Image rows but ignores the LOB value on the initial POST.
    // Create the record first, then persist BinaryData with a record update.
    const createResponse = await fetch(`${API_URL}/models/ad_image`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ Name: fileName, BinaryData: binaryData }),
      cache: 'no-store',
    })
    const createText = await createResponse.text()
    const created = parseJson(createText)
    if (!createResponse.ok) {
      console.error('ad_image create failed:', createResponse.status, createText)
      return NextResponse.json({ error: String(created.message || created.error || createText || 'Could not create image') }, { status: createResponse.status })
    }

    const imageId = Number(created.id || created.AD_Image_ID)
    if (!imageId) {
      return NextResponse.json({ error: 'Image creation did not return an image ID' }, { status: 502 })
    }

    const updateResponse = await fetch(`${API_URL}/models/ad_image/${imageId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ Name: fileName, BinaryData: binaryData }),
      cache: 'no-store',
    })
    const updateText = await updateResponse.text()
    const updated = parseJson(updateText)
    if (!updateResponse.ok) {
      console.error('ad_image BinaryData update failed:', updateResponse.status, updateText)
      return NextResponse.json({ error: String(updated.message || updated.error || updateText || 'Image record created, but image data could not be saved'), imageId }, { status: updateResponse.status })
    }

    const verifyResponse = await fetch(`${API_URL}/models/ad_image/${imageId}?_select=BinaryData&_=${Date.now()}`, {
      headers,
      cache: 'no-store',
    })
    const verifyText = await verifyResponse.text()
    const verified = parseJson(verifyText)
    const savedBinaryData = verified.BinaryData
    if (!verifyResponse.ok || !savedBinaryData) {
      console.error('ad_image BinaryData verification failed:', verifyResponse.status, verifyText)
      return NextResponse.json({ error: 'Image record was created, but BinaryData was not saved', imageId }, { status: 502 })
    }

    return NextResponse.json({ ...created, ...updated, id: imageId, binaryDataSaved: true }, { status: 201 })
  } catch (error) {
    console.error('ad_image upload failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not upload image' }, { status: 500 })
  }
}