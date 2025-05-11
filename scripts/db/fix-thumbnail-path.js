const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixThumbnailPaths() {
  try {
    // Find all records with null thumbnailPath
    const records = await prisma.generatedMedia.findMany({
      where: {
        thumbnailPath: null
      }
    });

    console.log(`Found ${records.length} records with null thumbnailPath`);

    // Update each record to use filePath as thumbnailPath
    for (const record of records) {
      await prisma.generatedMedia.update({
        where: { id: record.id },
        data: { thumbnailPath: record.filePath }
      });
      console.log(`Updated record ${record.id}`);
    }

    console.log('Successfully updated all records');
  } catch (error) {
    console.error('Error updating records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixThumbnailPaths(); 