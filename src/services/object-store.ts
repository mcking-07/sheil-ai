import { DeleteObjectCommand, type DeleteObjectCommandInput, GetObjectCommand, type GetObjectCommandInput, PutObjectCommand, type PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import type { ObjectStoreConfigType } from '../types';

class ObjectStore {
  private client: S3Client;
  private bucket: string;
  constructor({ bucket, ...config }: ObjectStoreConfigType) {
    this.client = new S3Client(config);
    this.bucket = bucket;
  }

  async get(params: Omit<GetObjectCommandInput, 'Bucket'>) {
    return this.client.send(new GetObjectCommand({ ...params, Bucket: this.bucket }));
  }

  async put(params: Omit<PutObjectCommandInput, 'Bucket'>) {
    return this.client.send(new PutObjectCommand({ ...params, Bucket: this.bucket }));
  }

  async delete(params: Omit<DeleteObjectCommandInput, 'Bucket'>) {
    return this.client.send(new DeleteObjectCommand({ ...params, Bucket: this.bucket }));
  }
}

export { ObjectStore };
