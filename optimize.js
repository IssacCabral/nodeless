"use strict";

const AWS = require("aws-sdk");
const S3 = new AWS.S3(); // Isso aqui é a API sdk para lidarmos com a S3
const sharp = require("sharp");
const { basename, extname } = require("path");

module.exports.handle = async ({ Records: records }, context) => {
  try {
    await Promise.all(
      records.map(async (record) => {
        // caminho para essa imagem dentro do s3
        const { key } = record.s3.object;

        const image = await S3.getObject({
          Bucket: process.env.bucket,
          Key: key,
        }).promise();

        const optimized = await sharp(image.body)
          .resize(1280, 720, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFormat("jpeg", { progressive: true, quality: 50 })
          .toBuffer();

        await S3.putObject({
          Body: optimized,
          Bucket: process.env.bucket,
          ContentType: "image/jpeg",
          Key: `compressed/${basename(key, extname(key))}.jpeg`,
        }).promise();
      })
    );

    return {
      statusCode: 301,
      body: {},
    };
  } catch (err) {
    return err;
  }
};
