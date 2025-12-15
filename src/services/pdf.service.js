/**
 * PDF Generation Service
 *
 * This service handles PDF generation using Puppeteer.
 * It converts HTML agreement templates into professional PDF documents.
 */

import puppeteer from 'puppeteer'

/**
 * Generate PDF from HTML content
 * @param {string} htmlContent - HTML string to convert to PDF
 * @param {string} documentType - Type of document (NDA or MSA)
 * @returns {Promise<Buffer>} - PDF file as buffer
 */
export async function generateAgreementPDF(htmlContent, documentType) {
  let browser = null

  try {
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()

    // Set HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0', // Wait for all network requests to finish
    })

    // Generate PDF with professional settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Include background colors/images
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; text-align: center; width: 100%; color: #666; padding: 5px 0;">
          <span>REBOO8 - Confidential Document</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; text-align: center; width: 100%; color: #666; padding: 5px 0;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          <span style="margin-left: 20px;">${documentType} - Version 1.0</span>
        </div>
      `,
      preferCSSPageSize: false,
    })

    console.log(`✅ PDF generated successfully for ${documentType}`)
    return pdfBuffer
  } catch (error) {
    console.error(`❌ Error generating PDF for ${documentType}:`, error)
    throw new Error(`PDF generation failed: ${error.message}`)
  } finally {
    // Always close browser to free resources
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Generate multiple PDFs in parallel (for NDA and MSA)
 * @param {Object[]} documents - Array of document objects
 * @param {string} documents[].htmlContent - HTML content
 * @param {string} documents[].documentType - Document type (NDA/MSA)
 * @returns {Promise<Object[]>} - Array of results with buffers
 */
export async function generateMultiplePDFs(documents) {
  try {
    const pdfPromises = documents.map((doc) =>
      generateAgreementPDF(doc.htmlContent, doc.documentType)
        .then((buffer) => ({
          documentType: doc.documentType,
          buffer,
          success: true,
        }))
        .catch((error) => ({
          documentType: doc.documentType,
          error: error.message,
          success: false,
        }))
    )

    const results = await Promise.all(pdfPromises)

    // Check if all succeeded
    const failedDocs = results.filter((r) => !r.success)
    if (failedDocs.length > 0) {
      throw new Error(
        `Failed to generate PDFs for: ${failedDocs.map((d) => d.documentType).join(', ')}`
      )
    }

    return results
  } catch (error) {
    console.error('❌ Error generating multiple PDFs:', error)
    throw error
  }
}

/**
 * Validate HTML content before PDF generation
 * @param {string} htmlContent - HTML string to validate
 * @returns {Object} - Validation result
 */
export function validateHTMLContent(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return { isValid: false, error: 'HTML content is required and must be a string' }
  }

  if (htmlContent.trim().length === 0) {
    return { isValid: false, error: 'HTML content cannot be empty' }
  }

  // Check for basic HTML structure
  if (!htmlContent.includes('<html') || !htmlContent.includes('</html>')) {
    return { isValid: false, error: 'Invalid HTML structure: missing <html> tags' }
  }

  return { isValid: true }
}
