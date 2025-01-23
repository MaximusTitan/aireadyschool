import { NextResponse } from 'next/server'
import { exportToPDF } from '../../tools/presentation/utils/export'
import { Presentation } from '../../tools/presentation/types/presentation'

export async function POST(request: Request) {
  try {
    const presentation: Presentation = await request.json()
    
    const pdfBytes = await exportToPDF(presentation)
    
    // Convert to Base64
    const base64String = Buffer.from(pdfBytes).toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64String}`
    
    return NextResponse.json({ url: dataUrl })
  } catch (error) {
    console.error('Error in PDF generation route:', error)
    let errorMessage = 'Failed to generate PDF'
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`
    } else {
      errorMessage += `: ${JSON.stringify(error)}`
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

