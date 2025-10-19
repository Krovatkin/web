export type HttpPeerInfo = {
  alias: string;
  version: string;
  deviceModel?: string;
  deviceType?: string;
  fingerprint: string;
  port: number;
  protocol: string;
  download: boolean;
};

export type HttpPrepareUploadRequest = {
  info: HttpPeerInfo;
  files: Record<string, HttpFileInfo>;
};

export type HttpFileInfo = {
  id: string;
  fileName: string;
  size: number;
  fileType: string;
  sha256?: string;
  preview?: string;
};

export type HttpPrepareUploadResponse = {
  sessionId: string;
  files: Record<string, string>; // fileId -> token
};

export async function sendFilesViaHttp({
  targetIp,
  targetPort = 53317,
  files,
  info,
  onFileProgress,
  onFilesSkip,
}: {
  targetIp: string;
  targetPort?: number;
  files: FileList;
  info: HttpPeerInfo;
  onFileProgress: (progress: { id: string; curr: number }) => void;
  onFilesSkip: (fileIds: string[]) => void;
}): Promise<void> {
  // Step 1: Prepare file metadata
  const fileMap: Record<string, HttpFileInfo> = {};
  const fileListArray: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileId = i.toString();
    fileMap[fileId] = {
      id: fileId,
      fileName: file.name,
      size: file.size,
      fileType: file.type || "application/octet-stream",
    };
    fileListArray.push(file);
  }

  const prepareRequest: HttpPrepareUploadRequest = {
    info,
    files: fileMap,
  };

  // Step 2: Send prepare-upload request
  const prepareUrl = `http://${targetIp}:${targetPort}/api/localsend/v2/prepare-upload`;

  console.log("Sending prepare-upload request to:", prepareUrl);

  let prepareResponse: HttpPrepareUploadResponse;
  try {
    const response = await fetch(prepareUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prepareRequest),
    });

    if (!response.ok) {
      switch (response.status) {
        case 204:
          throw new Error("No file transfer needed");
        case 400:
          throw new Error("Invalid request body");
        case 403:
          throw new Error("Transfer rejected by receiver");
        case 500:
          throw new Error("Unknown error by receiver");
        default:
          throw new Error(`Failed to prepare upload: ${response.status}`);
      }
    }

    prepareResponse = await response.json();
    console.log("Prepare upload response:", prepareResponse);
  } catch (error) {
    console.error("Failed to prepare upload:", error);
    throw new Error(
      `Cannot connect to ${targetIp}:${targetPort}. Make sure the device is reachable and accepting connections. ${error}`,
    );
  }

  // Step 3: Check which files were accepted
  const acceptedFileIds = Object.keys(prepareResponse.files);
  const skippedFileIds: string[] = [];

  for (const fileId in fileMap) {
    if (!acceptedFileIds.includes(fileId)) {
      skippedFileIds.push(fileId);
    }
  }

  if (skippedFileIds.length > 0) {
    onFilesSkip(skippedFileIds);
  }

  // Step 4: Upload each accepted file
  for (const fileId of acceptedFileIds) {
    const token = prepareResponse.files[fileId];
    const file = fileListArray[parseInt(fileId)];

    console.log(`Uploading file: ${file.name}`);

    const uploadUrl = `http://${targetIp}:${targetPort}/api/localsend/v2/upload?sessionId=${encodeURIComponent(prepareResponse.sessionId)}&fileId=${encodeURIComponent(fileId)}&token=${encodeURIComponent(token)}`;

    try {
      const totalSize = file.size;
      let uploadedSize = 0;

      // Use XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            uploadedSize = e.loaded;
            onFileProgress({
              id: fileId,
              curr: uploadedSize,
            });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            onFileProgress({
              id: fileId,
              curr: totalSize,
            });
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload aborted"));
        });

        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.send(file);
      });

      console.log(`File uploaded successfully: ${file.name}`);
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error);
      throw error;
    }
  }

  console.log("All files uploaded successfully");
}
