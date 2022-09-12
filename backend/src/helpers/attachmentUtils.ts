import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStorage logic

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})
const logger = createLogger('attachmentUtils')

export async function AttachmentUtils(imageId: string) {
  const param = {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  }
  try {
    const data = await s3.getSignedUrl('putObject', param);
    logger.info("CreateItem succeeded:", {
      key: imageId,
      data : data,
      time : new Date().toISOString()
    })
    return data;
  } catch (err) {
    logger.info("Unable to create item. Error JSON:", {
      key: imageId,
      data : JSON.stringify(err, null, 2),
      time : new Date().toISOString()
    })
  }
}