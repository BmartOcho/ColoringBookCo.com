import { NextRequest, NextResponse } from "next/server";
import PDFDocument from 'pdfkit';
import { getScenes } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ jobId: string }> } // Params is a Promise in Next.js 15+
) {
    try {
        const { jobId } = await params;

        const scenes = getScenes(jobId);
        if (!scenes || scenes.length === 0) {
            return NextResponse.json({ error: "No scenes found" }, { status: 404 });
        }

        // Create PDF Document
        const doc = new PDFDocument({
            size: 'LETTER',
            autoFirstPage: false, // We'll add pages manually
            margin: 50
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // Create a promise to handle the PDF generation
        const pdfBuffer = new Promise<Buffer>((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        // Generate pages
        for (const scene of scenes) {
            doc.addPage();



            // Image
            if (scene.image_data) {
                try {
                    // Convert Data URL to Buffer
                    // Format: data:image/png;base64,.....
                    const base64Data = scene.image_data.split('base64,')[1];
                    const imgBuffer = Buffer.from(base64Data, 'base64');

                    // Center image fit to page
                    doc.image(imgBuffer, {
                        fit: [500, 500],
                        align: 'center',
                        valign: 'center'
                    });
                } catch (e) {
                    console.error(`Failed to add image for scene ${scene.scene_number}`, e);
                    doc.moveDown().text("[Image missing or corrupted]", { align: 'center' });
                }
            } else {
                doc.moveDown().moveDown().text("[Image generating...]", { align: 'center' });
            }

            // Story Text at bottom
            // Move cursor to bottom area
            doc.y = 600;

            doc.font('Helvetica')
                .fontSize(16)
                .text(scene.story_text, {
                    align: 'center',
                    width: 500, // Constrain width for wrapping
                    lineGap: 5
                });
        }

        doc.end();

        const buffer = await pdfBuffer;

        return new NextResponse(buffer as unknown as BodyInit, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="coloring_book_${jobId.slice(0, 8)}.pdf"`,
            }
        });

    } catch (e: any) {
        console.error("PDF Generation Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
