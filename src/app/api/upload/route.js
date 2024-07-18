import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: "drtp0rk65",
  api_key: "111968424228555",
  api_secret: "Z1xAFhxTiECYX0Bchfrbk9uSSI0",
});

export async function POST(request) {
  try {
    const data = await request.formData();
    const image = data.get("image");

    if (!image) {
      return NextResponse.json({ error: "Error 404" }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "uploads" },
        (error, result) => {
          if (error) {
            console.error("Upload failed:", error);
            reject(error);
          } else {
            console.log("Imagen subida:", result.secure_url);
            resolve(result);
          }
        }
      );

      Readable.from(buffer).pipe(stream);
    });

    // Esperar a que se complete la carga
    const result = await uploadPromise;

    return NextResponse.json({
      message: "Imagen subida exitosamente",
      url: result.secure_url,
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
