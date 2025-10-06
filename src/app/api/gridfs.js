import { MongoClient, GridFSBucket } from 'mongodb';
import fs from 'fs';
import { Readable } from 'stream';

/**
 * Creates and returns a GridFS bucket instance
 * @param {string} dbUrl - MongoDB connection string
 * @param {string} dbName - Database name
 * @param {string} bucketName - Name of the GridFS bucket (default: 'fs')
 * @returns {Promise<Object>} Object containing the bucket and client
 */
async function createGridFSBucket(dbUrl, dbName, bucketName) {
  try {
    const client = new MongoClient(dbUrl);
    await client.connect();
    
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db, {
      bucketName: bucketName
    });
    
    console.log(`GridFS bucket '${bucketName}' created successfully`);
    
    return { bucket, client, db };
  } catch (error) {
    console.error('Error creating GridFS bucket:', error);
    throw error;
  }
}

/**
 * Uploads a file to GridFS
 * @param {GridFSBucket} bucket - The GridFS bucket instance
 * @param {string} filePath - Path to the file to upload
 * @param {string} filename - Name to store the file as
 * @param {Object} metadata - Optional metadata to attach to the file
 * @returns {Promise<string>} The file ID
 */
async function uploadFile(bucket, fileBuffer, filename, metadata = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata
    });
    
    const fileStream = new Readable();
    fileStream.push(fileBuffer);
    fileStream.push(null)
    fileStream
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        console.log(`File '${filename}' uploaded successfully with ID: ${uploadStream.id}`);
        resolve({ 
            filename, 
            id: uploadStream.id.toString()
        });
      });
  });
}

/**
 * Downloads a file from GridFS
 * @param {GridFSBucket} bucket - The GridFS bucket instance
 * @param {string} filename - Name of the file to download
 * @param {string} outputPath - Where to save the downloaded file
 * @returns {Promise<void>}
 */
async function downloadFile(bucket, filename, outputPath) {
  return new Promise((resolve, reject) => {
    const downloadStream = bucket.openDownloadStreamByName(filename);
    const writeStream = fs.createWriteStream(outputPath);
    
    downloadStream
      .pipe(writeStream)
      .on('error', reject)
      .on('finish', () => {
        console.log(`File '${filename}' downloaded successfully to ${outputPath}`);
        resolve();
      });
  });
}

/**
 * Deletes a file from GridFS
 * @param {GridFSBucket} bucket - The GridFS bucket instance
 * @param {string} fileId - The ID of the file to delete
 * @returns {Promise<void>}
 */
async function deleteFile(bucket, fileId) {
  try {
    const { ObjectId } = await import('mongodb');
    await bucket.delete(new ObjectId(fileId));
    console.log(`File with ID ${fileId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export { 
  createGridFSBucket, 
  uploadFile, 
  downloadFile, 
  deleteFile
};